"""The review loop: change requests in plain words -> a new version, line edits, and brand-memory rules learned from both."""

from __future__ import annotations

import json
import re
from typing import Any

from .adapt import _normalise, _system, scene_budget, validate_lines
from .facts import ResolvedFact
from .languages import Language
from .tf import TokenFactory

REVISE_TASK = """
NOW YOU ARE REVISING. The brand's marketer reviewed your version and asked for changes. Change what the request asks
for, keep everything else as it was, and keep every hard rule above. Also reply with:
"understood": one or two plain-English sentences, first person, saying how you understood the request and what you
will do (e.g. "You want it to sound like a friend, so I switched to informal 'tumi' and shortened line 2.");
"changes": [{"scene": "<id>", "what": "plain English: what changed in this scene"}] for every scene you changed.
Every scene you list in "changes" must really be different from the current version — never claim a change you
didn't make. If the request asks for a change, make it: the lines it is about must come out different.
Brand facts are locked: you cannot change a placeholder's value or how it is said or shown. If the request is about
a fact's wording (for example how the brand name is said in this language), don't pretend — suggest it in
"fact_requests": [{"key": "<FACT KEY>", "form": "says" or "shows", "suggested": "...", "why": "..."}] and the
marketer will confirm it. Also say so in "understood".
Reply as JSON: {"understood": "...", "lines": [...same shape as before...], "changes": [...], "fact_requests": [...],
"summary": "...", "applied_rules": [...]}"""


async def revise(tf: TokenFactory, master: dict[str, Any], audience: dict[str, Any], lang: Language,
                 facts: dict[str, ResolvedFact], current: list[dict[str, Any]], request: str, chips: list[str],
                 rules: list[dict[str, Any]]) -> dict[str, Any]:
    brief = {
        "audience": {k: audience.get(k) for k in ("label", "city", "language", "tone", "notes") if audience.get(k)},
        "facts": {k: {"what": f.label, "kind": f.kind, "says": f.spoken, "shows": f.display} for k, f in facts.items()},
        "brand_memory_rules": [{"id": r["id"], "rule": r["text"]} for r in rules],
        "scenes": [scene_budget(s, lang) for s in master["scenes"]],
        "current_version": [{k: ln.get(k, "") for k in ("scene", "voice", "screen", "meaning")} for ln in current],
        "marketer_request": request.strip(),
        "quick_notes": chips,
    }
    system = _system(master, lang) + REVISE_TASK
    user = json.dumps(brief, ensure_ascii=False, indent=1)
    data = await tf.chat_json("revise", system, user, temperature=0.5)
    out = _normalise(master, data) | _explain(data, facts)
    issues = validate_lines(master, out["lines"], facts, lang)
    unchanged = not _diff(current, out["lines"]) and not out["fact_requests"]
    if issues or unchanged:
        problems = [f"- scene {i['scene']} {i['field']}: {i['message']}" for i in issues]
        if unchanged:
            problems.append("- you returned exactly the same lines: actually make the change the marketer asked for")
        fix = (user + "\n\nYour previous answer:\n" + json.dumps(out["lines"], ensure_ascii=False)
               + "\n\nProblems — fix them and return the full JSON again:\n" + "\n".join(problems))
        data = await tf.chat_json("revise-fix", system, fix, temperature=0.6)
        out = _normalise(master, data) | _explain(data, facts)
    diff = _diff(current, out["lines"])
    claimed = {c["scene"]: c["what"] for c in out["changes"]}
    # Only real differences are reported as changes; the model's words are kept where it described a real one.
    out["changes"] = [{"scene": sid, "what": claimed.get(sid) or "Reworded.", "fields": fields}
                      for sid, fields in diff.items()]
    out["changed"] = bool(diff)
    if not diff and not out["fact_requests"]:
        out["understood"] = ("I couldn't find a way to change the lines for this request without breaking a brand "
                             "fact or rule. Try saying it differently, or edit the line yourself.")
    return out


def _diff(before: list[dict[str, Any]], after: list[dict[str, Any]]) -> dict[str, list[str]]:
    old = {ln["scene"]: ln for ln in before}
    out: dict[str, list[str]] = {}
    for ln in after:
        o = old.get(ln["scene"], {})
        fields = [f for f in ("voice", "screen") if (ln.get(f) or "").strip() != (o.get(f) or "").strip()]
        if fields:
            out[ln["scene"]] = fields
    return out


def _explain(data: dict[str, Any], facts: dict[str, ResolvedFact]) -> dict[str, Any]:
    changes = [{"scene": str(c.get("scene", "")), "what": str(c.get("what", ""))}
               for c in (data.get("changes") or []) if isinstance(c, dict)]
    fact_requests = []
    for r in data.get("fact_requests") or []:
        if not isinstance(r, dict) or r.get("key") not in facts or not str(r.get("suggested", "")).strip():
            continue
        f = facts[r["key"]]
        form = "spoken" if r.get("form") == "says" else "display"
        current = f.spoken if form == "spoken" else f.display
        if str(r["suggested"]).strip() != (current or ""):
            fact_requests.append({"key": f.key, "label": f.label, "form": form, "current": current,
                                  "suggested": str(r["suggested"]).strip(), "why": str(r.get("why", "")).strip()})
    return {"understood": str(data.get("understood", "")).strip(), "changes": changes, "fact_requests": fact_requests}


def to_placeholders(text: str, facts: dict[str, ResolvedFact]) -> str:
    """A marketer types real values ("₹149"); turn them back into placeholders so the same checks apply."""
    forms = []
    for key, f in facts.items():
        for value in (f.spoken, f.display):
            if value:
                forms.append((value, key))
    for value, key in sorted(forms, key=lambda x: -len(x[0])):  # longest first, so "₹149" doesn't eat part of a phrase
        text = re.sub(re.escape(value), "{" + key + "}", text, flags=re.I)
    return text


def edit_line(master: dict[str, Any], current: list[dict[str, Any]], scene_id: str, field: str, new_text: str,
              facts: dict[str, ResolvedFact]) -> list[dict[str, Any]]:
    lines = [dict(ln) for ln in current]
    for ln in lines:
        if ln["scene"] == scene_id:
            ln[field] = to_placeholders(new_text.strip(), facts)
            ln["why"] = "Edited by you."
            if field == "voice":
                ln["meaning"] = ""
    return lines


LEARN_SYSTEM = """You keep a brand's "memory": short rules about the brand's taste, learned from how its marketer
corrects ad versions. From ONE piece of feedback, decide if there is a reusable rule for future versions.
- A rule is general and reusable ("In Bengali versions, talk informally — use 'tumi', never 'apni'."), not a one-off
  fix ("change line 2"). If the feedback is a one-off or a typo fix, return "rule": null.
- Scope: "language" if it is about one language, "audience" if only about this audience, "all" for every version.
- Never make a rule about prices, offers or dates (those are locked facts).
- Don't repeat an existing rule; return null if it's already covered.
Reply as JSON: {"rule": "plain English, one sentence" or null, "scope": "all" | "language" | "audience",
"why": "one short sentence"}"""


async def learn_rule(tf: TokenFactory, brand: dict[str, Any], audience: dict[str, Any], lang: Language,
                     feedback: dict[str, Any], existing: list[dict[str, Any]]) -> dict[str, Any] | None:
    payload = {
        "brand": brand.get("name"),
        "audience": audience.get("label"),
        "language": lang.name,
        "feedback": feedback,
        "existing_rules": [r["text"] for r in existing],
    }
    data = await tf.chat_json("learn", LEARN_SYSTEM, json.dumps(payload, ensure_ascii=False, indent=1),
                              max_tokens=500, temperature=0.2)
    rule = data.get("rule")
    if not rule or not str(rule).strip():
        return None
    scope_kind = data.get("scope") if data.get("scope") in ("all", "language", "audience") else "language"
    scope: dict[str, Any] = {}
    if scope_kind == "language":
        scope = {"language": lang.code}
    elif scope_kind == "audience":
        scope = {"audience_id": audience.get("id")}
    return {"text": str(rule).strip(), "scope": scope, "scope_label": _scope_label(scope_kind, lang, audience),
            "why": str(data.get("why", "")).strip()}


def _scope_label(kind: str, lang: Language, audience: dict[str, Any]) -> str:
    return {"all": "All versions", "language": f"{lang.name} versions",
            "audience": audience.get("label", "This audience")}[kind]
