"""One version, end to end: adapt -> fill + check facts -> voice -> render -> check the picture."""

from __future__ import annotations

import asyncio
import json
import time
from pathlib import Path
from typing import Any

from . import adapt as adapt_mod
from .check import check_picture
from .facts import check_filled, fill, resolve_facts
from .languages import get_language
from .media import frame_jpeg, thumbnail
from .render import build_ass, build_srt, render
from .see import place_text, see_scenes
from .tf import TokenFactory, current_job
from .voice import reference_voice, voice_line

# Problems that block approval; the rest are shown as "needs a look".
BLOCKING = {"missing_fact", "extra_fact", "repeated_fact", "unknown_fact", "invented_number", "changed_word",
            "fact_changed", "unfilled", "fact_mismatch", "fact_not_on_screen", "no_spoken_form", "missing_line",
            "unexpected_number"}


def rules_for(rules: list[dict[str, Any]], audience: dict[str, Any]) -> list[dict[str, Any]]:
    out = []
    for r in rules:
        if not r.get("enabled", True):
            continue
        scope = r.get("scope") or {}
        if scope.get("language") and scope["language"] != audience["language"]:
            continue
        if scope.get("audience_id") and scope["audience_id"] != audience.get("id"):
            continue
        out.append(r)
    return out


async def see_master(tf: TokenFactory, master: dict[str, Any], assets_dir: Path) -> dict[str, Any]:
    """Look at each scene once per campaign; the result decides where each version's text goes."""
    frames = []
    for s in master["scenes"]:
        dur = float(s["end"]) - float(s["start"])
        frames.append(frame_jpeg(assets_dir / s["clip"], float(s.get("clip_in", 0)) + dur * 0.5))
    seen = await see_scenes(tf, frames)
    placement = {s["id"]: place_text(seen[i], s.get("text_band")) for i, s in enumerate(master["scenes"])}
    return {"scenes": {s["id"]: seen[i] for i, s in enumerate(master["scenes"])}, "placement": placement}


async def make_version(tf: TokenFactory, master: dict[str, Any], audience: dict[str, Any], seen: dict[str, Any],
                       rules: list[dict[str, Any]], assets_dir: Path, out_dir: Path, voice_cache: Path,
                       ffmpeg_threads: int, written: dict[str, Any] | None = None,
                       progress=None) -> dict[str, Any]:
    """Make one audience version. With `written` (a revision or a line edit) the writing step is skipped and the
    given script is checked, voiced, rendered and checked like any other. Returns the full version record."""
    out_dir.mkdir(parents=True, exist_ok=True)
    lang = get_language(audience["language"])
    facts = resolve_facts(master["facts"], audience)
    # The reviewer reads the English meaning, so facts in it use their English form.
    facts_en = resolve_facts(master["facts"], audience | {"language": "en"})
    applicable = rules_for(rules, audience)
    job_tag = f"{audience.get('id', audience['language'])}:{out_dir.name}:{time.time_ns()}"
    current_job.set(job_tag)
    timings: dict[str, float] = {}

    async def stage(name: str) -> None:
        if progress:
            await progress(name)

    t = time.monotonic()
    await stage("writing")
    if written is None:
        written = await adapt_mod.adapt(tf, master, audience, lang, facts, applicable)
    else:
        written = {"summary": "", "applied_rules": [], "attempts": 0} | written
        written["issues"] = adapt_mod.validate_lines(master, written["lines"], facts, lang)
    timings["write"] = time.monotonic() - t
    script = written["lines"]

    t = time.monotonic()
    await stage("voicing")
    ref = await reference_voice(tf, voice_cache, lang, audience.get("voice", "female, young adult"))
    scenes = {s["id"]: s for s in master["scenes"]}
    voiced = await asyncio.gather(*[
        voice_line(tf, out_dir, master, scenes[ln["scene"]], ln, facts, lang, ref) for ln in script])
    voices = {ln["scene"]: v for ln, v in zip(script, voiced)}
    timings["voice"] = time.monotonic() - t

    issues = list(written["issues"])
    for ln in script:
        s = scenes[ln["scene"]]
        ln["voice_filled"] = fill(ln["voice"], facts, "spoken")
        ln["screen_filled"] = fill(ln.get("screen", ""), facts, "display")
        ln["meaning_filled"] = fill(ln.get("meaning", ""), facts_en, "display")
        issues += check_filled(s["id"], "voice", s["line"]["voice"], ln["voice_filled"], facts)
        issues += check_filled(s["id"], "screen", s["line"].get("screen", ""), ln["screen_filled"], facts)
        if voices[ln["scene"]]["over"]:
            issues.append({"scene": s["id"], "field": "voice", "code": "too_long",
                           "message": "the line is still a little long for its scene", "by": "code"})

    t = time.monotonic()
    await stage("checking")
    issues += await adapt_mod.factcheck(tf, master, script, facts, lang)
    timings["factcheck"] = time.monotonic() - t

    t = time.monotonic()
    await stage("rendering")
    legal = facts["LEGAL"].display if "LEGAL" in facts else None
    ass = build_ass(master, script, voices, seen["placement"], lang, legal)
    mp4 = await render(master, assets_dir, out_dir, ass, voices, ffmpeg_threads)
    (out_dir / "version.srt").write_text(build_srt(master, voices), encoding="utf-8")
    await asyncio.to_thread(thumbnail, mp4, float(master["scenes"][0]["end"]) * 0.6, out_dir / "thumb.jpg")
    timings["render"] = time.monotonic() - t

    t = time.monotonic()
    await stage("checking the picture")
    picture = await check_picture(tf, mp4, master, script, facts, lang)
    issues += picture["issues"]
    timings["picture"] = time.monotonic() - t

    for i in issues:
        i["blocking"] = i["code"] in BLOCKING
    calls = [c.to_dict() for c in tf.calls if c.job == job_tag]
    record = {
        "audience": audience,
        "language": lang.code,
        "summary": written["summary"],
        "understood": written.get("understood", ""),
        "changes": written.get("changes", []),
        "fact_requests": written.get("fact_requests", []),
        "applied_rules": [r for r in written["applied_rules"] if r in {x["id"] for x in applicable}],
        "lines": [ln | {"voice_seconds": voices[ln["scene"]]["seconds"], "fit": voices[ln["scene"]]["fit"]}
                  for ln in script],
        "facts": [{"key": f.key, "label": f.label, "display": f.display, "spoken": f.spoken} for f in facts.values()],
        "placement": seen["placement"],
        "picture": picture["frames"],
        "issues": issues,
        "status": "needs_look" if issues else "ready",
        "files": {"mp4": str(mp4), "srt": str(out_dir / "version.srt"), "thumb": str(out_dir / "thumb.jpg")},
        "cost": cost_summary(calls, timings),
    }
    (out_dir / "version.json").write_text(json.dumps(record, ensure_ascii=False, indent=1), encoding="utf-8")
    return record


def cost_summary(calls: list[dict[str, Any]], timings: dict[str, float]) -> dict[str, Any]:
    ok = [c for c in calls if 200 <= c.get("status", 0) < 300]
    return {
        "model_calls": len(ok),
        "retried_or_failed_calls": len(calls) - len(ok),
        "gemma_calls": sum(1 for c in ok if "Gemma" in c["model"]),
        "omnivoice_calls": sum(1 for c in ok if c["model"] == "OmniVoice"),
        "prompt_tokens": sum(c.get("prompt_tokens") or 0 for c in ok),
        "completion_tokens": sum(c.get("completion_tokens") or 0 for c in ok),
        "seconds_by_stage": {k: round(v, 1) for k, v in timings.items()},
        "calls": calls,
    }
