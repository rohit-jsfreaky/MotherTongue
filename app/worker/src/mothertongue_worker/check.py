"""Stage 5 — check the picture: Gemma (vision) looks at frames of the finished version and confirms what we expect.

Models read Indic scripts off a frame unreliably but compare well, so we hand Gemma the exact text and facts each
frame should show and ask it to confirm or point out what differs — never to transcribe.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .facts import ResolvedFact, placeholders
from .languages import Language
from .media import frame_jpeg
from .tf import TokenFactory, image_part

SYSTEM = """You are the quality checker for finished video ads. For each frame of one finished version you get what
the frame SHOULD show: the main on-screen text, the brand facts inside it (price, offer, website…), the subtitle line,
and sometimes a small legal line. Look closely and answer for each frame:
- "main_text_shown": true if the main on-screen text is shown in full and correctly (same words, same numbers);
- "facts": for each expected fact, {"fact": "<name>", "shown_exactly": true/false};
- "other_numbers": any price, number, percentage or date visible that is NOT one of the expected facts
  (ignore the subtitle line and the legal line); [] if none;
- "right_script": true if the main text is in the expected script;
- "cut_off": true if any text runs off the frame edge or is clipped;
- "covers_subject": true if text hides the product or the main subject;
- "problem": one short plain-English sentence if something needs fixing, else "".
Answer in English. Do not copy the on-screen text. Reply as compact JSON:
{"frames": [{"index": 0, "main_text_shown": true, "facts": [], "other_numbers": [], "right_script": true,
"cut_off": false, "covers_subject": false, "problem": ""}]}"""


async def check_picture(tf: TokenFactory, mp4: Path, master: dict[str, Any], lines: list[dict[str, Any]],
                        facts: dict[str, ResolvedFact], lang: Language) -> dict[str, Any]:
    scenes = master["scenes"]
    by_scene = {ln["scene"]: ln for ln in lines}
    legal = facts["LEGAL"].display if "LEGAL" in facts else None
    content: list[dict[str, Any]] = [{"type": "text", "text": f"Expected language: {lang.name} ({lang.script} script). "
                                                             f"{len(scenes)} frames, one per scene, in order."}]
    expected_by_scene = {}
    for i, s in enumerate(scenes):
        at = float(s["start"]) + (float(s["end"]) - float(s["start"])) * 0.6
        ln = by_scene[s["id"]]
        expected = {
            "main_text": ln.get("screen_filled", ""),
            "facts": [{"fact": facts[k].label, "value": facts[k].display}
                      for k in placeholders(s["line"].get("screen", "")) if k in facts],
            "subtitle": ln.get("voice_filled", ""),
        }
        if legal and i == len(scenes) - 1:
            expected["legal_line"] = legal
        expected_by_scene[s["id"]] = expected
        content += [{"type": "text", "text": f"Frame {i} should show: {json.dumps(expected, ensure_ascii=False)}"},
                    image_part(frame_jpeg(mp4, at, width=540))]
    data = await tf.chat_json("check-picture", SYSTEM, content, max_tokens=3000, temperature=0.0)
    seen = data.get("frames") or []
    issues: list[dict[str, str]] = []
    report = []
    for i, s in enumerate(scenes):
        f = seen[i] if i < len(seen) and isinstance(seen[i], dict) else {}
        expected = expected_by_scene[s["id"]]
        shown = {str(x.get("fact")): bool(x.get("shown_exactly")) for x in (f.get("facts") or []) if isinstance(x, dict)}
        fact_rows = []
        for fx in expected["facts"]:
            ok = shown.get(fx["fact"], False)
            fact_rows.append({"fact": fx["fact"], "expected": fx["value"], "on_screen": ok})
            if not ok:
                issues.append(_issue(s["id"], "fact_not_on_screen", f"{fx['fact']} '{fx['value']}' isn't shown correctly"))
        if not f:
            issues.append(_issue(s["id"], "not_checked", "this frame could not be checked"))
        if expected["main_text"] and f and f.get("main_text_shown") is False:
            issues.append(_issue(s["id"], "text_wrong", "the on-screen text isn't shown in full"))
        others = [str(x) for x in (f.get("other_numbers") or []) if str(x).strip()]
        if others:
            issues.append(_issue(s["id"], "unexpected_number", f"unexpected number on screen: {', '.join(others)}"))
        if expected["main_text"] and f.get("right_script") is False:
            issues.append(_issue(s["id"], "wrong_script", f"on-screen text doesn't look like {lang.script} script"))
        if f.get("cut_off"):
            issues.append(_issue(s["id"], "cut_off", "text is cut off"))
        if f.get("covers_subject"):
            issues.append(_issue(s["id"], "covers_subject", "text covers the product"))
        problem = str(f.get("problem") or "").strip()
        if problem:
            issues.append(_issue(s["id"], "picture_note", problem))
        report.append({"scene": s["id"], "facts": fact_rows, "problem": problem,
                       "main_text_shown": f.get("main_text_shown"), "other_numbers": others})
    return {"frames": report, "issues": issues}


def _issue(scene: str, code: str, message: str) -> dict[str, str]:
    return {"scene": scene, "field": "screen", "code": code, "message": message, "by": "gemma"}
