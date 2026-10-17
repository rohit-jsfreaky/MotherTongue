"""Attack our own fact checks: plant wrong facts into real versions and count how many are caught.

Usage (from app/worker):  uv run python ../../evidence/scripts/planted_facts.py out/kettle-and-kadak ../../evidence/planted.json
For each real version of the Kettle & Kadak ad (bn, hi, it, en) it makes 5 cases — a clean control and 4 planted errors —
and runs the same two checks the product runs before a version can be approved: the code check (placeholders + stray
numbers) and the Gemma fact check on AMD Token Factory. A case counts as caught if either check raises a blocking issue.
"""

from __future__ import annotations

import asyncio
import copy
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from mothertongue_worker.adapt import factcheck, validate_lines
from mothertongue_worker.cli import load_template
from mothertongue_worker.config import load_settings
from mothertongue_worker.facts import fill, resolve_facts
from mothertongue_worker.languages import get_language
from mothertongue_worker.tf import TokenFactory

# Planted errors, written the way a model could slip them in: in digits, or in words of the audience's language.
WRONG_PRICE_DIGITS = {"en": "₹129", "hi": "₹129", "bn": "₹129", "it": "€3,90"}
HALF_PRICE_WORDS = {"en": " Now at half price!", "hi": " अब आधे दाम में!", "bn": " এখন অর্ধেক দামে!", "it": " Ora a metà prezzo!"}
WRONG_DATE_WORDS = {"en": "November thirtieth", "hi": "तीस नवंबर", "bn": "তিরিশে নভেম্বর", "it": "trenta novembre"}
FAKE_CLAIM_WORDS = {"en": " Recommended by doctors.", "hi": " डॉक्टरों की सलाह से बनी।", "bn": " ডাক্তারদের পরামর্শে তৈরি।", "it": " Consigliato dai medici."}


def cases(lines: list[dict], lang: str) -> list[tuple[str, list[dict]]]:
    def edit(scene: str, fn) -> list[dict]:
        out = copy.deepcopy(lines)
        for ln in out:
            if ln["scene"] == scene:
                ln["voice"] = fn(ln["voice"])
        return out

    return [
        ("control_unchanged", copy.deepcopy(lines)),
        ("wrong_price_in_digits", edit("s3", lambda v: v.replace("{PRICE}", WRONG_PRICE_DIGITS[lang]))),
        ("extra_discount_in_words", edit("s3", lambda v: v + HALF_PRICE_WORDS[lang])),
        ("wrong_date_in_words", edit("s4", lambda v: v.replace("{DEADLINE}", WRONG_DATE_WORDS[lang]))),
        ("invented_claim_in_words", edit("s2", lambda v: v + FAKE_CLAIM_WORDS[lang])),
    ]


async def run(version_dir: Path, target: Path) -> None:
    master = load_template(version_dir.name)
    tf = TokenFactory(load_settings())
    results = []
    try:
        for vdir in sorted(p for p in version_dir.iterdir() if (p / "version.json").exists()):
            rec = json.loads((vdir / "version.json").read_text(encoding="utf-8"))
            audience = rec["audience"]
            lang = get_language(audience["language"])
            facts = resolve_facts(master["facts"], audience)
            base = [{k: ln[k] for k in ("scene", "voice", "screen")} for ln in rec["lines"]]
            for name, lines in cases(base, lang.code):
                code = [i for i in validate_lines(master, lines, facts, lang) if i["code"] != "wrong_script"]
                for ln in lines:
                    ln["voice_filled"] = fill(ln["voice"], facts, "spoken")
                    ln["screen_filled"] = fill(ln["screen"], facts, "display")
                gemma = await factcheck(tf, master, lines, facts, lang)
                planted = name != "control_unchanged"
                flagged = bool(code or gemma)
                results.append({
                    "language": lang.code, "case": name, "planted": planted,
                    "caught_by_code": bool(code), "caught_by_gemma": bool(gemma), "flagged": flagged,
                    "correct": flagged == planted,
                    "code_issues": [i["message"] for i in code], "gemma_issues": [i["message"] for i in gemma],
                    "planted_line": next((ln["voice_filled"] for ln in lines if ln["voice"] != next(
                        b["voice"] for b in base if b["scene"] == ln["scene"])), None),
                })
                print(f"{lang.code} {name:26s} code={bool(code)!s:5} gemma={bool(gemma)!s:5} {'OK' if flagged == planted else 'MISS'}",
                      flush=True)
    finally:
        await tf.aclose()
    planted = [r for r in results if r["planted"]]
    controls = [r for r in results if not r["planted"]]
    by_kind = {}
    for r in planted:
        k = by_kind.setdefault(r["case"], {"planted": 0, "caught": 0, "by_code": 0, "by_gemma": 0})
        k["planted"] += 1
        k["caught"] += r["flagged"]
        k["by_code"] += r["caught_by_code"]
        k["by_gemma"] += r["caught_by_gemma"]
    report = {
        "what": "Planted wrong facts in real Kettle & Kadak versions (bn, hi, it, en); same checks the product runs before approval.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "planted_total": len(planted),
        "planted_caught": sum(r["flagged"] for r in planted),
        "controls_total": len(controls),
        "controls_false_alarms": sum(r["flagged"] for r in controls),
        "by_kind": by_kind,
        "results": results,
    }
    target.write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps({k: report[k] for k in ("planted_total", "planted_caught", "controls_total", "controls_false_alarms", "by_kind")}, indent=1))


if __name__ == "__main__":
    asyncio.run(run(Path(sys.argv[1]), Path(sys.argv[2])))
