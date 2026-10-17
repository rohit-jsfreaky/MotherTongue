"""Re-test speech-to-text on AMD Token Factory before submitting (17 Oct 2026).

    cd app/worker && uv run python ../../evidence/scripts/stt_retest.py ../../evidence/stt-retest-2026-10-17.json

1. GET /v1/models: which models list audio as an input today.
2. OmniVoice speaks a known English sentence (the reference text).
3. That clip goes to every model that lists audio input (and MiMo-V2.6-Flash, the one the manual names), in the manual's
   shape {"type":"input_audio","input_audio":{"data":<base64>,"format":"wav"}} plus two common variants, asking for a
   word-for-word transcript.
4. The transcription paths a Whisper-style API would use.
Writes every status code, error and transcript (no key) to the result file.
"""

import asyncio
import base64
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import httpx

from mothertongue_worker.config import load_settings

TEXT = "Kettle and Kadak. Real ginger, real cardamom. Just one hundred and forty-nine rupees a box."
# if OmniVoice can't speak right now: a clip it made earlier today, with its exact text
FALLBACK = (Path(__file__).resolve().parents[2] / "research/video/narration/n2.wav",
            "MotherTongue fixes that. Upload one ad, pick who it's for, and lock your price and offer.")


def words(s: str) -> list[str]:
    return re.sub(r"[^a-z0-9 ]", " ", s.lower().replace("-", " ")).split()


async def main(out: Path) -> None:
    s = load_settings()
    auth = {"Authorization": f"Bearer {s.tf_api_key}"}
    result: dict = {"what": "Speech-to-text re-test on AMD Token Factory", "at": datetime.now(timezone.utc).isoformat(),
                    "reference_text": TEXT, "attempts": []}
    async with httpx.AsyncClient(base_url=s.tf_base_url, headers=auth, timeout=180) as c:
        models = (await c.get("/models")).json().get("data", [])
        catalogue = []
        for m in models:
            flat = json.dumps(m).lower()
            catalogue.append({"id": m.get("id"), "mentions_audio": "audio" in flat,
                              "input_modalities": m.get("input_modalities") or m.get("architecture", {}).get("input_modalities")
                              or m.get("modalities") or m.get("capabilities")})
        result["catalogue"] = catalogue
        audio_models = [m["id"] for m in catalogue if m["mentions_audio"] and m["id"] != s.voice_model]
        targets = sorted(set(audio_models) | {"MiMo-V2.6-Flash"})
        result["models_tried"] = targets

        text = TEXT
        r = await c.post("/audio/speech", json={"model": s.voice_model, "input": TEXT, "voice": "auto",
                                                 "instructions": "male, adult"})
        if r.status_code == 200:
            wav = r.content
            result["clip"] = "made now by OmniVoice"
        else:
            wav, text = FALLBACK[0].read_bytes(), FALLBACK[1]
            result["clip"] = f"OmniVoice returned {r.status_code} now; used {FALLBACK[0].name}, made by OmniVoice earlier today"
            result["reference_text"] = text
        b64 = base64.b64encode(wav).decode()
        result["clip_bytes"] = len(wav)

        shapes = {
            "manual: input_audio {data, format: wav}": {"type": "input_audio", "input_audio": {"data": b64, "format": "wav"}},
            "input_audio with a data URL": {"type": "input_audio", "input_audio": {"data": f"data:audio/wav;base64,{b64}", "format": "wav"}},
            "audio_url data URL": {"type": "audio_url", "audio_url": {"url": f"data:audio/wav;base64,{b64}"}},
        }
        for model in targets:
            for name, part in shapes.items():
                body = {"model": model, "max_tokens": 300, "temperature": 0,
                        "messages": [{"role": "user", "content": [
                            {"type": "text", "text": "Transcribe this audio word for word. Reply with the transcript only."},
                            part]}]}
                r = await c.post("/chat/completions", json=body)
                row = {"model": model, "shape": name, "status": r.status_code}
                try:
                    data = r.json()
                except ValueError:
                    data = {"raw": r.text[:300]}
                if r.status_code == 200:
                    msg = data["choices"][0]["message"]
                    heard = (msg.get("content") or "").strip()
                    ref = set(words(text))
                    row["transcript"] = heard
                    row["reference_words_heard"] = f"{len(ref & set(words(heard)))}/{len(ref)}"
                else:
                    row["error"] = json.dumps(data.get("error", data), ensure_ascii=False)[:300]
                result["attempts"].append(row)
                print(row)
                await asyncio.sleep(3.5)  # stay under 20 requests/min

        for path in ("/audio/transcriptions", "/audio/translations"):
            r = await c.post(path, files={"file": ("clip.wav", wav, "audio/wav")}, data={"model": "whisper-1"})
            row = {"endpoint": path, "status": r.status_code, "body": r.text[:200]}
            result["attempts"].append(row)
            print(row)

    ok = [a for a in result["attempts"] if a.get("status") == 200 and a.get("transcript")]
    result["verdict"] = ("speech-to-text WORKS: " + "; ".join(f"{a['model']} via {a['shape']} ({a['reference_words_heard']})" for a in ok)
                         if ok else "speech-to-text still NOT available: every audio input shape and transcription path was rejected")
    out.write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
    print(result["verdict"])


asyncio.run(main(Path(sys.argv[1])))
