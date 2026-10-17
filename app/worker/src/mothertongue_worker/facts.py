"""Brand facts: the model never writes them. It writes {PLACEHOLDERS}; code fills the brand's own words and checks them.

A fact has a display form (what goes on screen) and a spoken form per language (what the voice says, e.g. "₹149" is
said "একশো ঊনপঞ্চাশ টাকা"). Both are set and confirmed by the brand, per language or per audience.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

PLACEHOLDER_RE = re.compile(r"\{([A-Z][A-Z0-9_]*)\}")
# Anything that looks like a number, price, percentage or contact the model wrote by itself.
STRAY_RE = re.compile(r"[0-9०-९০-৯]|[₹€$£%]|https?://|www\.|\.(com|in|it|shop)\b", re.I)


@dataclass(frozen=True)
class ResolvedFact:
    key: str
    label: str
    kind: str
    display: str
    spoken: str | None


def resolve_facts(facts: list[dict[str, Any]], audience: dict[str, Any]) -> dict[str, ResolvedFact]:
    lang = audience["language"]
    out: dict[str, ResolvedFact] = {}
    for f in facts:
        override = (f.get("overrides") or {}).get(audience.get("id", ""), {})
        display = override.get("display", f.get("display"))
        if isinstance(display, dict):
            display = display.get(lang) or display.get("default")
        spoken = override.get("spoken", f.get("spoken"))
        if isinstance(spoken, dict):
            spoken = spoken.get(lang)
        if not display:
            raise ValueError(f"fact {f['key']} has no display form for {lang}")
        out[f["key"]] = ResolvedFact(f["key"], f.get("label", f["key"]), f.get("kind", "text"), display, spoken)
    return out


def placeholders(text: str) -> list[str]:
    return PLACEHOLDER_RE.findall(text or "")


def fill(text: str, facts: dict[str, ResolvedFact], form: str) -> str:
    def sub(m: re.Match[str]) -> str:
        fact = facts.get(m.group(1))
        if fact is None:
            return m.group(0)
        value = fact.spoken if form == "spoken" else fact.display
        return value if value is not None else m.group(0)

    return PLACEHOLDER_RE.sub(sub, text or "")


def check_line(scene_id: str, field: str, master: str, written: str, facts: dict[str, ResolvedFact],
               never_change: list[str]) -> list[dict[str, str]]:
    """Code check of one adapted line, before anything is voiced."""
    issues: list[dict[str, str]] = []
    want, got = sorted(placeholders(master)), sorted(placeholders(written))
    for key in sorted(set(want) - set(got)):
        issues.append(_issue(scene_id, field, "missing_fact", f"{facts[key].label if key in facts else key} is missing"))
    for key in sorted(set(got) - set(want)):
        issues.append(_issue(scene_id, field, "extra_fact", f"{{{key}}} was added but the master line doesn't have it"))
    for key in sorted({k for k in got if got.count(k) > want.count(k) and k in want}):
        issues.append(_issue(scene_id, field, "repeated_fact", f"{{{key}}} appears more than in the master"))
    for key in sorted(set(got) - set(facts)):
        issues.append(_issue(scene_id, field, "unknown_fact", f"{{{key}}} is not a brand fact"))
    stray = STRAY_RE.findall(PLACEHOLDER_RE.sub(" ", written or ""))
    if stray:
        issues.append(_issue(scene_id, field, "invented_number",
                             "the line contains a number, price or link that isn't a locked fact"))
    for word in never_change:
        if word.lower() in (master or "").lower() and word not in (written or ""):
            issues.append(_issue(scene_id, field, "changed_word", f"'{word}' must stay exactly as written"))
    if field == "voice":
        for key in got:
            if key in facts and not facts[key].spoken:
                issues.append(_issue(scene_id, field, "no_spoken_form",
                                     f"{facts[key].label} has no spoken form for this language yet"))
    return issues


def check_filled(scene_id: str, field: str, master: str, filled: str, facts: dict[str, ResolvedFact]) -> list[dict[str, str]]:
    """After filling: every fact the master line carries is present, word for word."""
    issues = []
    for key in placeholders(master):
        fact = facts.get(key)
        if not fact:
            continue
        value = fact.spoken if field == "voice" else fact.display
        if value and value not in filled:
            issues.append(_issue(scene_id, field, "fact_changed", f"{fact.label} should read '{value}'"))
    if PLACEHOLDER_RE.search(filled):
        issues.append(_issue(scene_id, field, "unfilled", "a fact placeholder was left unfilled"))
    return issues


_SPLIT_RE = re.compile(r"[\s,.;:!?।|·]+")


def doubled_words(filled: str) -> list[str]:
    """Words said twice in a row after filling (e.g. a value that already contains "till" + the model's own "till")."""
    tokens = [t for t in _SPLIT_RE.split((filled or "").lower()) if t]
    return [a for a, b in zip(tokens, tokens[1:]) if a == b and not a.isdigit()]


def _issue(scene: str, field: str, code: str, message: str) -> dict[str, str]:
    return {"scene": scene, "field": field, "code": code, "message": message, "by": "code"}
