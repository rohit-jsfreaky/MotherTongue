"""Stage 2 — adapt: Gemma re-writes the ad for one audience (not a translation), keeping facts as placeholders."""

from __future__ import annotations

import json
import math
from typing import Any

from .facts import ResolvedFact, check_line, doubled_words, fill
from .languages import Language
from .tf import TokenFactory

ADAPT_SYSTEM = """You are the senior copywriter at an ad agency that makes regional versions of video ads.
You re-make one ad for one audience. You do NOT translate. Write what a great local copywriter from that place would
write for these people: their everyday words, their rhythm, a local touch, the tone they respond to. Keep each
scene's job in the story (hook, product, price, call to action) and keep the brand's facts.

Hard rules (a version that breaks one is rejected):
1. Facts are placeholders like {PRICE}. Copy every placeholder of the master line into your line exactly — same
   braces, same name, once each. Never write a fact's value yourself. Never add a placeholder the master line
   doesn't have. Don't glue grammar endings onto a placeholder; if the language needs one, rephrase the
   sentence so the value stands on its own. Each fact's value is given
   ("says" = how the voice says it, "shows" = how it looks on screen): write your sentence so it reads naturally
   once the placeholder is replaced, and never repeat a word the value already contains.
2. Never write digits, prices, currencies, percentages, dates, phone numbers, links or quantities in your own words.
   Those come only through placeholders.
3. Never add claims the master doesn't make (no "best", "No. 1", health claims, awards, extra discounts).
4. Keep these words exactly as written, in the same letters: {never_change}.
5. Write in {language} using {script} script, except kept words and placeholders.
6. "voice" is what the voiceover says in that scene; it must be speakable in the scene's seconds (stay within
   max_words). "screen" is the on-screen text: short and punchy, within screen_max_words.
7. Keep one level of formality and one form of address in every line (never mix, e.g., "tumi" and "apni").
8. Follow the brand memory rules. List the ids of the rules you applied.

Example of adapting (another brand, master in English, audience Kolkata · Bengali · warm, informal):
master voice "Long day? You deserve a break." -> voice "সারাদিন খাটুনি? এবার একটু আড্ডা হোক।"
meaning "Worked all day? Now let's have a little adda." why "Kolkata unwinds with 'adda'; informal and warm."

Reply as JSON only:
{"lines": [{"scene": "<scene id>", "voice": "...", "screen": "...", "meaning": "plain English meaning of the
voice line", "why": "one short plain-English sentence: what you changed for this audience and why"}],
"summary": "one plain-English sentence: how this version differs from the master",
"applied_rules": ["<rule id>", ...]}"""


def scene_budget(scene: dict[str, Any], lang: Language) -> dict[str, Any]:
    seconds = max(0.8, float(scene["end"]) - float(scene["start"]) - 0.35)
    return {
        "scene": scene["id"],
        "role": scene.get("role", ""),
        "seconds": round(seconds, 1),
        "max_words": max(3, math.floor(seconds * lang.words_per_second)),
        "screen_max_words": scene.get("screen_max_words", 7),
        "master_voice": scene["line"]["voice"],
        "master_screen": scene["line"].get("screen", ""),
    }


def _brief(master: dict[str, Any], audience: dict[str, Any], lang: Language, facts: dict[str, ResolvedFact],
           rules: list[dict[str, Any]]) -> dict[str, Any]:
    brand = master["brand"]
    return {
        "brand": {"name": brand["name"], "tone": brand.get("tone", ""), "about": brand.get("about", "")},
        "audience": {k: audience.get(k) for k in ("label", "city", "language", "tone", "notes") if audience.get(k)},
        "language": lang.name,
        "facts": {k: {"what": f.label, "kind": f.kind, "says": f.spoken, "shows": f.display} for k, f in facts.items()},
        "brand_memory_rules": [{"id": r["id"], "rule": r["text"]} for r in rules],
        "scenes": [scene_budget(s, lang) for s in master["scenes"]],
    }


def _system(master: dict[str, Any], lang: Language) -> str:
    never = master["brand"].get("never_change") or []
    return (ADAPT_SYSTEM.replace("{never_change}", ", ".join(f'"{w}"' for w in never) or "(none)")
            .replace("{language}", lang.name).replace("{script}", lang.script))


def validate_lines(master: dict[str, Any], lines: list[dict[str, Any]], facts: dict[str, ResolvedFact],
                   lang: Language) -> list[dict[str, str]]:
    never = master["brand"].get("never_change") or []
    by_id = {ln.get("scene"): ln for ln in lines}
    issues: list[dict[str, str]] = []
    for s in master["scenes"]:
        ln = by_id.get(s["id"])
        if not ln or not str(ln.get("voice", "")).strip():
            issues.append({"scene": s["id"], "field": "voice", "code": "missing_line", "message": "no line for this scene",
                           "by": "code"})
            continue
        issues += check_line(s["id"], "voice", s["line"]["voice"], ln.get("voice", ""), facts, never)
        issues += check_line(s["id"], "screen", s["line"].get("screen", ""), ln.get("screen", ""), facts, never)
        for field, form in (("voice", "spoken"), ("screen", "display")):
            for word in doubled_words(fill(ln.get(field, ""), facts, form)):
                issues.append({"scene": s["id"], "field": field, "code": "doubled_word",
                               "message": f"'{word}' is said twice once the facts are filled in", "by": "code"})
        if lang.script_chars is not None and not lang.script_chars.search(ln.get("voice", "")):
            issues.append({"scene": s["id"], "field": "voice", "code": "wrong_script",
                           "message": f"the line is not written in {lang.script} script", "by": "code"})
    return issues


def _normalise(master: dict[str, Any], data: dict[str, Any]) -> dict[str, Any]:
    lines = []
    raw = {str(ln.get("scene")): ln for ln in (data.get("lines") or []) if isinstance(ln, dict)}
    for s in master["scenes"]:
        ln = raw.get(s["id"], {})
        lines.append({k: str(ln.get(k, "")).strip() for k in ("voice", "screen", "meaning", "why")} | {"scene": s["id"]})
    return {"lines": lines, "summary": str(data.get("summary", "")).strip(),
            "applied_rules": [str(r) for r in (data.get("applied_rules") or [])]}


async def adapt(tf: TokenFactory, master: dict[str, Any], audience: dict[str, Any], lang: Language,
                facts: dict[str, ResolvedFact], rules: list[dict[str, Any]]) -> dict[str, Any]:
    brief = _brief(master, audience, lang, facts, rules)
    user = "Make the version for this audience.\n" + json.dumps(brief, ensure_ascii=False, indent=1)
    out = _normalise(master, await tf.chat_json("adapt", _system(master, lang), user, temperature=0.7))
    issues = validate_lines(master, out["lines"], facts, lang)
    out["attempts"] = 1
    if issues:
        fix = (user + "\n\nYour previous answer:\n" + json.dumps(out["lines"], ensure_ascii=False)
               + "\n\nIt broke these rules — fix them and return the full JSON again:\n"
               + "\n".join(f"- scene {i['scene']} {i['field']}: {i['message']}" for i in issues))
        out = _normalise(master, await tf.chat_json("adapt-fix", _system(master, lang), fix, temperature=0.4))
        out["attempts"] = 2
        issues = validate_lines(master, out["lines"], facts, lang)
    out["issues"] = issues
    return out


SHORTEN_SYSTEM = """You tighten voiceover lines for video ads. Rewrite the line so it is clearly shorter (about
{words} words) while keeping its meaning, tone and language. Keep every {PLACEHOLDER} exactly, once each; the line must read naturally
once each placeholder is replaced by its value (never repeat a word the value contains). Never add digits, prices
or links. Reply as JSON: {"voice": "...", "meaning": "plain English meaning"}"""


async def shorten(tf: TokenFactory, line: dict[str, Any], target_words: int, lang: Language,
                  facts: dict[str, ResolvedFact]) -> dict[str, str]:
    used = {k: {"says": f.spoken} for k, f in facts.items() if "{" + k + "}" in line["voice"]}
    user = json.dumps({"language": lang.name, "line": line["voice"], "target_words": target_words,
                       "placeholder_values": used}, ensure_ascii=False)
    data = await tf.chat_json("shorten", SHORTEN_SYSTEM.replace("{words}", str(target_words)), user, max_tokens=600,
                              temperature=0.4)
    return {"voice": str(data.get("voice", "")).strip(), "meaning": str(data.get("meaning", "")).strip()}


FACTCHECK_SYSTEM = """You are the compliance checker for a brand's video ads. You get the brand's LOCKED FACTS
(the only allowed prices, offers, dates, contacts and product names) and the lines of one regional version, already
filled in, in its own language. Find every statement in these lines about price, quantity, discount, offer terms,
dates or deadlines, contact details, or product claims that is NOT exactly backed by the locked facts or by the
master ad. A fact said in other words that changes its meaning (a different amount, a different deal) is a problem.
Ordinary persuasive language is fine. Reply as JSON: {"problems": [{"scene": "<id>", "quote": "<exact words>",
"why": "plain English"}]} — an empty list if everything is backed."""


async def factcheck(tf: TokenFactory, master: dict[str, Any], lines: list[dict[str, Any]],
                    facts: dict[str, ResolvedFact], lang: Language) -> list[dict[str, str]]:
    payload = {
        "language": lang.name,
        "locked_facts": [{"what": f.label, "on_screen": f.display, "spoken": f.spoken} for f in facts.values()],
        "master_ad": [{"scene": s["id"], "voice": s["line"]["voice"], "screen": s["line"].get("screen", "")}
                      for s in master["scenes"]],
        "version_lines": [{"scene": ln["scene"], "voice": ln["voice_filled"], "screen": ln["screen_filled"]}
                          for ln in lines],
    }
    data = await tf.chat_json("factcheck", FACTCHECK_SYSTEM, json.dumps(payload, ensure_ascii=False, indent=1),
                              max_tokens=1200, temperature=0.0)
    return [{"scene": str(p.get("scene", "")), "field": "voice", "code": "fact_mismatch",
             "message": f"\"{p.get('quote', '')}\": {p.get('why', '')}", "by": "gemma"}
            for p in (data.get("problems") or []) if isinstance(p, dict)]
