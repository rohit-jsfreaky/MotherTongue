"""FFmpeg helpers. Everything runs on CPU, with a capped thread count."""

from __future__ import annotations

import asyncio
import io
import json
import subprocess
import wave
from pathlib import Path

# One render at a time per worker process keeps the box responsive; AI calls still run in parallel.
_render_lock = asyncio.Lock()


def run_ffmpeg(args: list[str]) -> None:
    proc = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args],
                          capture_output=True, text=True, encoding="utf-8", errors="replace")
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {proc.stderr.strip()[-800:]}")


async def run_ffmpeg_locked(args: list[str]) -> None:
    async with _render_lock:
        await asyncio.to_thread(run_ffmpeg, args)


def probe(path: Path) -> dict:
    proc = subprocess.run(["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(path)],
                          capture_output=True, text=True, check=True)
    return json.loads(proc.stdout)


def duration(path: Path) -> float:
    return float(probe(path)["format"]["duration"])


def video_size(path: Path) -> tuple[int, int]:
    for s in probe(path)["streams"]:
        if s.get("codec_type") == "video":
            return int(s["width"]), int(s["height"])
    raise ValueError(f"{path} has no video stream")


def wav_seconds(data: bytes) -> float:
    with wave.open(io.BytesIO(data)) as w:
        return w.getnframes() / float(w.getframerate())


def frame_jpeg(path: Path, at: float, width: int = 540) -> bytes:
    proc = subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", f"{at:.2f}", "-i", str(path), "-frames:v", "1",
         "-vf", f"scale={width}:-2", "-q:v", "4", "-f", "image2pipe", "-vcodec", "mjpeg", "-"],
        capture_output=True, check=True)
    return proc.stdout


def thumbnail(src: Path, at: float, dest: Path, width: int = 360) -> None:
    run_ffmpeg(["-ss", f"{at:.2f}", "-i", str(src), "-frames:v", "1", "-vf", f"scale={width}:-2", "-q:v", "3", str(dest)])
