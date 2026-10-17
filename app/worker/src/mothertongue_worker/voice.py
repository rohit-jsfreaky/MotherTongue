"""Stage 3 — voice: OmniVoice speaks every line in one steady brand voice, fitted to its scene.

OmniVoice gives a different speaker on every call, so each brand gets one reference clip per language (made once
from voice attributes, or a consented recording of the brand's own voice) and every line clones it via ref_audio.
"""

from __future__ import annotations

import base64
import math
from pathlib import Path
from typing import Any

from .adapt import shorten
from .facts import ResolvedFact, check_line, doubled_words, fill
from .languages import Language
from .media import wav_seconds
from .tf import TokenFactory

# How much faster than natural we let a line run before asking for a shorter one.
MAX_SQUEEZE = 1.25
LEAD_IN = 0.15


def ref_name(lang: Language, attrs: str) -> str:
    return f"ref-{lang.code}-{attrs.replace(',', '').replace(' ', '-')}.wav"


async def reference_voice(tf: TokenFactory, cache_dir: Path, lang: Language, attrs: str) -> dict[str, Any]:
    """The brand's steady voice for this language: created once, then reused for every line and every version."""
    wav_path = cache_dir / ref_name(lang, attrs)
    if not wav_path.exists():
        cache_dir.mkdir(parents=True, exist_ok=True)
        body_attrs = attrs if attrs not in ("auto", "") else None
        audio = await tf.speak("voice-ref", lang.voice_sample, voice="auto" if body_attrs else "female",
                               instructions=body_attrs)
        wav_path.write_bytes(audio)
    return {"path": wav_path, "text": lang.voice_sample}


async def _say(tf: TokenFactory, text: str, ref: dict[str, Any], seconds: float | None = None) -> bytes:
    body: dict[str, Any] = {
        "model": tf.s.voice_model,
        "input": text,
        "ref_audio": base64.b64encode(Path(ref["path"]).read_bytes()).decode(),
        "ref_text": ref["text"],
    }
    if seconds:
        body["duration"] = round(seconds, 2)
    resp = await tf._post("voice", "/audio/speech", body)
    tf.calls[-1].output_bytes = len(resp.content)
    return resp.content


async def voice_line(tf: TokenFactory, out_dir: Path, master: dict[str, Any], scene: dict[str, Any],
                     line: dict[str, Any], facts: dict[str, ResolvedFact], lang: Language,
                     ref: dict[str, Any]) -> dict[str, Any]:
    """Speak one line; squeeze it a little if it runs long, or ask Gemma for a shorter line if it runs very long."""
    slot = float(scene["end"]) - float(scene["start"]) - LEAD_IN - 0.15
    text = fill(line["voice"], facts, "spoken")
    audio = await _say(tf, text, ref)
    natural = wav_seconds(audio)
    fit = "natural"
    if natural > slot * MAX_SQUEEZE:
        target = max(3, math.floor(len(line["voice"].split()) * slot / natural))
        shorter = await shorten(tf, line, target, lang, facts)
        never = master["brand"].get("never_change") or []
        if (shorter["voice"] and not check_line(scene["id"], "voice", scene["line"]["voice"], shorter["voice"], facts, never)
                and not doubled_words(fill(shorter["voice"], facts, "spoken"))):
            line["voice_before_shorten"] = line["voice"]
            line["voice"], line["meaning"] = shorter["voice"], shorter["meaning"] or line.get("meaning", "")
            line["why"] = (line.get("why", "") + " Shortened to fit the scene.").strip()
            text = fill(line["voice"], facts, "spoken")
            audio = await _say(tf, text, ref)
            natural = wav_seconds(audio)
            fit = "shortened"
    if natural > slot:
        audio = await _say(tf, text, ref, seconds=slot)
        fit = "squeezed" if fit == "natural" else "shortened+squeezed"
    seconds = wav_seconds(audio)
    path = out_dir / f"voice-{scene['id']}.wav"
    path.write_bytes(audio)
    return {"path": str(path), "seconds": round(seconds, 2), "natural_seconds": round(natural, 2),
            "slot_seconds": round(slot, 2), "fit": fit, "start": float(scene["start"]) + LEAD_IN,
            "text": text, "over": seconds > slot + 0.3}
