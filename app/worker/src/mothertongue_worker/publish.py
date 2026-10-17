"""Publish pre-rendered sample versions: storage files for the demo workspace + small web copies for the landing page."""

from __future__ import annotations

import asyncio
import json
from pathlib import Path

from .config import REPO_ROOT, WORKER_ROOT, load_settings
from .media import run_ffmpeg
from .supa import Supa

BRAND_KEY = {"kettle-and-kadak": "chai", "stride": "stride", "mitti": "mitti"}
KEEP = ("language", "summary", "applied_rules", "lines", "facts", "placement", "picture", "issues", "status")


async def publish(out_root: Path) -> None:
    s = load_settings()
    db = Supa(s.supabase_url, s.supabase_service_key)
    web = REPO_ROOT / "app" / "web"
    public = web / "public" / "samples"
    public.mkdir(parents=True, exist_ok=True)
    data: dict[str, dict] = {}
    try:
        for tdir in sorted(p for p in out_root.iterdir() if p.is_dir() and p.name in BRAND_KEY):
            for adir in sorted(p for p in tdir.iterdir() if p.is_dir() and (p / "version.json").exists()):
                rec = json.loads((adir / "version.json").read_text(encoding="utf-8"))
                base = f"samples/{tdir.name}/{adir.name}"
                mp4 = await db.upload("media", f"{base}/version.mp4", adir / "version.mp4", "video/mp4")
                srt = await db.upload("media", f"{base}/version.srt", adir / "version.srt", "application/x-subrip")
                thumb = await db.upload("media", f"{base}/thumb.jpg", adir / "thumb.jpg", "image/jpeg")
                record = {k: rec.get(k) for k in KEEP}
                record["cost"] = {k: v for k, v in rec.get("cost", {}).items() if k != "calls"}
                data.setdefault(tdir.name, {})[adir.name] = {
                    "mp4_path": mp4, "srt_path": srt, "thumb_path": thumb, "record": record, "status": rec["status"],
                }
                # Landing copy: small, muted, loops in the cards.
                key = f"{BRAND_KEY[tdir.name]}-{adir.name.split('-')[-1]}"
                run_ffmpeg(["-i", str(adir / "version.mp4"), "-an", "-vf", "scale=360:640", "-c:v", "libx264",
                            "-preset", "veryfast", "-crf", "30", "-movflags", "+faststart", "-threads", "2",
                            str(public / f"{key}.mp4")])
                run_ffmpeg(["-ss", "2.5", "-i", str(adir / "version.mp4"), "-frames:v", "1", "-vf", "scale=360:-2",
                            "-q:v", "4", str(public / f"{key}.jpg")])
                print("published", tdir.name, adir.name, rec["status"], flush=True)
    finally:
        await db.aclose()
    target = web / "src" / "data" / "samples-rendered.json"
    target.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print("wrote", target)


def main_publish(out: str | None) -> None:
    asyncio.run(publish(Path(out) if out else WORKER_ROOT / "out"))
