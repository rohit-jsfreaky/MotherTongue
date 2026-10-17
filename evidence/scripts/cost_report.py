"""Cost and time per version, from the worker's own records of real runs on AMD Token Factory.

Usage (from app/worker):  uv run python ../../evidence/scripts/cost_report.py out ../../evidence/cost.json
Reads every <template>/<audience>/version.json the worker wrote (each lists every Token Factory call it made) plus the
account usage snapshot from GET /v1/usage, and writes one JSON file with the numbers the README/deck/video quote.
"""

from __future__ import annotations

import asyncio
import json
import statistics as st
import sys
from datetime import datetime, timezone
from pathlib import Path

from mothertongue_worker.config import load_settings
from mothertongue_worker.tf import TokenFactory


def summarise(values: list[float]) -> dict[str, float]:
    return {"mean": round(st.mean(values), 2), "median": round(st.median(values), 2), "min": round(min(values), 2),
            "max": round(max(values), 2)}


async def usage_snapshot() -> dict:
    tf = TokenFactory(load_settings())
    try:
        u = await tf.usage()
    finally:
        await tf.aclose()
    keep = ("daily_cost_limit_usd", "daily_cost_used_usd", "rpm_limit")
    out = {k: u.get(k) for k in keep}
    out["by_model"] = [{k: m.get(k) for k in ("model", "requests", "errors", "prompt_tokens", "completion_tokens", "cost")}
                       for m in u.get("by_model", [])]
    return out


def usd_per_version(report: dict) -> dict:
    """The meter's own rates (its USD per Gemma token, per OmniVoice call) times one version's mean usage."""
    by = {m["model"]: m for m in report["token_factory_usage_snapshot"]["by_model"]}
    g, o, pv = by["Gemma-4-31B-IT"], by["OmniVoice"], report["per_version"]
    per_token = g["cost"] / (g["prompt_tokens"] + g["completion_tokens"])
    per_call = o["cost"] / o["requests"]
    gemma = per_token * (pv["prompt_tokens"]["mean"] + pv["completion_tokens"]["mean"])
    voice = per_call * pv["omnivoice_calls"]["mean"]
    return {"gemma_usd": round(gemma, 7), "omnivoice_usd": round(voice, 7), "total_usd": round(gemma + voice, 7),
            "how": "rates from token_factory_usage_snapshot (cost / tokens for Gemma, cost / requests for OmniVoice) "
                   "times the per-version means above; nominal, the service is free for the event"}


def main(out_dir: Path, target: Path) -> None:
    rows = []
    for f in sorted(out_dir.glob("*/*/version.json")):
        v = json.loads(f.read_text(encoding="utf-8"))
        c = v["cost"]
        stages = c.get("seconds_by_stage", {})
        rows.append({
            "template": f.parent.parent.name,
            "audience": f.parent.name,
            "status": v["status"],
            "model_calls": c["model_calls"],
            "gemma_calls": c["gemma_calls"],
            "omnivoice_calls": c["omnivoice_calls"],
            "retried_or_failed_calls": c.get("retried_or_failed_calls", 0),
            "prompt_tokens": c["prompt_tokens"],
            "completion_tokens": c["completion_tokens"],
            "seconds_total": round(sum(stages.values()), 1),
            "seconds_by_stage": stages,
            "issues": [i["code"] for i in v.get("issues", [])],
        })
    if not rows:
        raise SystemExit(f"no version.json under {out_dir}")
    stage_names = sorted({k for r in rows for k in r["seconds_by_stage"]})
    report = {
        "what": "Per-version cost and time for real MotherTongue versions made on AMD Token Factory "
                "(Gemma-4-31B-IT + OmniVoice), 15-second ads, 4 scenes, 720x1280.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "versions": len(rows),
        "status_counts": {s: sum(1 for r in rows if r["status"] == s) for s in sorted({r["status"] for r in rows})},
        "per_version": {
            "model_calls": summarise([r["model_calls"] for r in rows]),
            "gemma_calls": summarise([r["gemma_calls"] for r in rows]),
            "omnivoice_calls": summarise([r["omnivoice_calls"] for r in rows]),
            "prompt_tokens": summarise([r["prompt_tokens"] for r in rows]),
            "completion_tokens": summarise([r["completion_tokens"] for r in rows]),
            "seconds_total": summarise([r["seconds_total"] for r in rows]),
            "seconds_by_stage_mean": {s: round(st.mean([r["seconds_by_stage"].get(s, 0) for r in rows]), 1)
                                      for s in stage_names},
        },
        "notes": [
            "seconds are wall time per version measured by the worker; versions ran 4 at a time sharing one rate limit "
            "(20 requests/min per account), so the voice stage includes waiting for the limiter.",
            "One extra Gemma 'see' call per campaign (shared by all its versions) is not included per version.",
            "Token Factory is free for the event; its usage endpoint reports a nominal USD figure, recorded below.",
        ],
        "token_factory_usage_snapshot": asyncio.run(usage_snapshot()),
        "rows": rows,
    }
    report["per_version"]["nominal_usd"] = usd_per_version(report)
    target.write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps({k: report[k] for k in ("versions", "status_counts", "per_version")}, indent=1))


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
