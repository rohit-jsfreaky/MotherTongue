"""The always-on worker: claims jobs from Supabase, makes versions, uploads the files, and reports progress.

The app never waits on this process. It inserts a job and watches the `versions` row (Realtime); if Token Factory is
busy or a model is briefly unavailable, the job goes back in the queue and the version says so.
"""

from __future__ import annotations

import asyncio
import json
import os
import socket
import tempfile
import traceback
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from .cli import TEMPLATES
from .config import Settings
from .facts import resolve_facts
from .languages import get_language
from .pipeline import make_version, rules_for, see_master
from .revise import edit_line, learn_rule, revise
from .supa import Supa
from .tf import ModelUnavailable, TokenFactory
from .voice import ref_name

WORK = Path(os.environ.get("WORKER_TMP", tempfile.gettempdir())) / "mothertongue"
MAX_ATTEMPTS = 3


class Worker:
    def __init__(self, settings: Settings) -> None:
        if not (settings.supabase_url and settings.supabase_service_key):
            raise RuntimeError("SUPABASE_URL and SUPABASE_SECRET_KEY are needed to serve jobs")
        self.s = settings
        self.db = Supa(settings.supabase_url, settings.supabase_service_key)
        self.tf = TokenFactory(settings)
        self.id = f"{socket.gethostname()}-{os.getpid()}"
        self.slots = asyncio.Semaphore(int(os.environ.get("WORKER_JOBS", "3")))
        self.campaign_locks: dict[str, asyncio.Lock] = {}
        self.last_poll: str | None = None
        self.done = 0

    # ── loop ─────────────────────────────────────────────────────────────────────────────────────────────────────
    async def run(self) -> None:
        print(f"worker {self.id} serving jobs", flush=True)
        while True:
            await self.slots.acquire()
            try:
                rows = await self.db.rpc("claim_job", {"worker": self.id})
            except Exception as exc:  # network blip: keep the loop alive
                self.slots.release()
                print("claim failed:", exc, flush=True)
                await asyncio.sleep(5)
                continue
            self.last_poll = datetime.now(timezone.utc).isoformat()
            if not rows:
                self.slots.release()
                await asyncio.sleep(2)
                continue
            asyncio.create_task(self._run_job(rows[0]))

    async def _run_job(self, job: dict[str, Any]) -> None:
        try:
            await self.handle(job)
            await self.db.update("jobs", {"state": "done", "finished_at": _now(), "error": None}, id=job["id"])
            self.done += 1
        except ModelUnavailable as exc:
            await self._requeue(job, 120, str(exc))
            await self._status(job, "waiting", "Waiting for the voice service — this continues by itself.")
        except Exception as exc:
            traceback.print_exc()
            if job["attempts"] < MAX_ATTEMPTS:
                await self._requeue(job, 30 * job["attempts"], f"{type(exc).__name__}: {exc}")
                await self._status(job, "waiting", "Hit a snag — trying again in a moment.")
            else:
                await self.db.update("jobs", {"state": "failed", "finished_at": _now(),
                                              "error": f"{type(exc).__name__}: {exc}"[:2000]}, id=job["id"])
                await self._status(job, "failed", "This version couldn't be made. Try again from the review page.")
        finally:
            self.slots.release()

    async def _requeue(self, job: dict[str, Any], seconds: int, error: str) -> None:
        when = (datetime.now(timezone.utc) + timedelta(seconds=seconds)).isoformat()
        await self.db.update("jobs", {"state": "queued", "run_after": when, "locked_by": None, "error": error[:2000]},
                             id=job["id"])

    async def _status(self, job: dict[str, Any], status: str, note: str) -> None:
        if job.get("version_id"):
            await self.db.update("versions", {"status": status, "status_note": note, "updated_at": _now()},
                                 id=job["version_id"])

    # ── jobs ─────────────────────────────────────────────────────────────────────────────────────────────────────
    async def handle(self, job: dict[str, Any]) -> None:
        version = await self.db.one("versions", id=job["version_id"])
        ctx = await self._context(version)
        payload = job.get("payload") or {}
        kind = job["kind"]
        parent = await self.db.one("versions", id=version["parent_id"]) if version.get("parent_id") else None
        lang = get_language(ctx["audience"]["language"])
        facts = resolve_facts(ctx["master"]["facts"], ctx["audience"])
        applicable = rules_for(ctx["rules"], ctx["audience"])
        written: dict[str, Any] | None = None
        feedback: dict[str, Any] | None = None

        if kind in ("revise", "edit_line", "rerender"):
            if not parent:
                raise ValueError(f"{kind} needs a parent version")
            current = parent["record"]["lines"]
            if kind == "revise":
                await self._progress(version, "understanding your request")
                written = await revise(self.tf, ctx["master"], ctx["audience"], lang, facts, current,
                                       payload.get("request", ""), payload.get("chips", []), applicable)
                feedback = {"kind": "request", "text": payload.get("request", ""), "chips": payload.get("chips", [])}
            elif kind == "edit_line":
                lines = edit_line(ctx["master"], current, payload["scene"], payload.get("field", "voice"),
                                  payload["text"], facts)
                before = next(ln for ln in current if ln["scene"] == payload["scene"])
                written = {"lines": lines, "understood": "You edited this line yourself. We re-voiced it and checked "
                                                         "the facts again.",
                           "changes": [{"scene": payload["scene"], "what": "Edited by you.",
                                        "fields": [payload.get("field", "voice")]}]}
                feedback = {"kind": "edit", "before": before.get(payload.get("field", "voice"), ""),
                            "after": payload["text"]}
            else:
                written = {"lines": [{k: v for k, v in ln.items() if k in ("scene", "voice", "screen", "meaning", "why")}
                                     for ln in current],
                           "understood": "You changed a brand fact. We re-voiced and re-checked this version."}

        record = await self._make(version, ctx, written)
        if feedback and payload.get("feedback_id"):
            rule = await learn_rule(self.tf, ctx["master"]["brand"], ctx["audience"], lang, feedback, ctx["rules"])
            if rule:
                row = await self.db.insert("memory_rules", {
                    "brand_id": ctx["brand"]["id"], "text": rule["text"], "scope": rule["scope"],
                    "scope_label": rule["scope_label"], "why": rule["why"],
                    "source_feedback_id": payload["feedback_id"], "source_campaign_id": ctx["campaign"]["id"]})
                record["learned_rule"] = {"id": row["id"], "text": row["text"], "scope_label": row["scope_label"]}
                await self.db.update("versions", {"record": record}, id=version["id"])

    async def _make(self, version: dict[str, Any], ctx: dict[str, Any], written: dict[str, Any] | None) -> dict[str, Any]:
        campaign = ctx["campaign"]
        assets = await self._assets(ctx)
        seen = await self._seen(ctx, assets)
        out = WORK / "versions" / version["id"]
        voices = WORK / "voices" / ctx["brand"]["id"]
        await self._pull_voice(ctx, voices)

        async def progress(stage: str) -> None:
            await self._progress(version, stage)

        record = await make_version(self.tf, ctx["master"], ctx["audience"] | {"id": ctx["audience"]["id"]}, seen,
                                    ctx["rules"], assets, out, voices, self.s.ffmpeg_threads, written=written,
                                    progress=progress)
        await self._push_voice(ctx, voices)
        await self._progress(version, "saving")
        base = f"{campaign['workspace_id']}/{campaign['id']}/{version['id']}"
        mp4 = await self.db.upload("media", f"{base}/version.mp4", out / "version.mp4", "video/mp4")
        srt = await self.db.upload("media", f"{base}/version.srt", out / "version.srt", "application/x-subrip")
        thumb = await self.db.upload("media", f"{base}/thumb.jpg", out / "thumb.jpg", "image/jpeg")
        record.pop("files", None)
        record.pop("audience", None)
        await self.db.update("versions", {
            "status": record["status"], "stage": "done", "status_note": "", "record": record,
            "mp4_path": mp4, "srt_path": srt, "thumb_path": thumb, "updated_at": _now()}, id=version["id"])
        await self.db.update("campaigns", {"updated_at": _now()}, id=campaign["id"])
        return record

    async def _progress(self, version: dict[str, Any], stage: str) -> None:
        await self.db.update("versions", {"status": "making", "stage": stage, "status_note": "", "updated_at": _now()},
                             id=version["id"])

    # ── context + assets ─────────────────────────────────────────────────────────────────────────────────────────
    async def _context(self, version: dict[str, Any]) -> dict[str, Any]:
        campaign = await self.db.one("campaigns", id=version["campaign_id"])
        audience = await self.db.one("audiences", id=version["audience_id"])
        brand = await self.db.one("brands", id=campaign["brand_id"])
        rules = [r for r in await self.db.select("memory_rules", order="created_at", brand_id=brand["id"])
                 if r.get("enabled", True)]
        master = dict(campaign["master"])
        master["brand"] = {"name": brand["name"], "about": brand["about"], "tone": brand["tone"],
                           "never_change": brand["never_change"], "colours": brand["colours"]}
        return {"campaign": campaign, "audience": audience, "brand": brand, "rules": rules, "master": master}

    async def _assets(self, ctx: dict[str, Any]) -> Path:
        campaign = ctx["campaign"]
        if campaign["source"] == "template":
            return TEMPLATES / campaign["template_id"]
        folder = WORK / "masters" / campaign["id"]
        for name, path in (("master.mp4", campaign.get("master_path")), ("music.mp3", ctx["master"].get("music_path"))):
            if path and not (folder / name).exists():
                await self.db.download("media", path, folder / name)
        return folder

    async def _seen(self, ctx: dict[str, Any], assets: Path) -> dict[str, Any]:
        campaign = ctx["campaign"]
        if campaign.get("seen"):
            return campaign["seen"]
        lock = self.campaign_locks.setdefault(campaign["id"], asyncio.Lock())
        async with lock:
            fresh = await self.db.one("campaigns", id=campaign["id"])
            if fresh.get("seen"):
                return fresh["seen"]
            seen = await see_master(self.tf, ctx["master"], assets)
            await self.db.update("campaigns", {"seen": seen}, id=campaign["id"])
            campaign["seen"] = seen
            return seen

    def _voice_key(self, ctx: dict[str, Any]) -> tuple[str, str]:
        lang = get_language(ctx["audience"]["language"])
        name = ref_name(lang, ctx["audience"].get("voice") or "female, young adult")
        return name, f"{ctx['campaign']['workspace_id']}/brand-{ctx['brand']['id']}/voices/{name}"

    async def _pull_voice(self, ctx: dict[str, Any], folder: Path) -> None:
        """Keep the brand's voice steady across worker restarts: its reference clip lives in storage."""
        name, path = self._voice_key(ctx)
        if not (folder / name).exists():
            try:
                await self.db.download("media", path, folder / name)
            except Exception:
                pass  # first version in this language: the clip is created and pushed after this run

    async def _push_voice(self, ctx: dict[str, Any], folder: Path) -> None:
        name, path = self._voice_key(ctx)
        if (folder / name).exists():
            await self.db.upload("media", path, folder / name, "audio/wav")

    async def health(self) -> dict[str, Any]:
        return {"worker": self.id, "last_poll": self.last_poll, "jobs_done": self.done}


async def serve(settings: Settings) -> None:
    worker = Worker(settings)
    port = int(os.environ.get("PORT", "7860"))

    async def http(reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> None:
        await reader.read(1024)
        body = json.dumps({"ok": True} | await worker.health()).encode()
        writer.write(b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n"
                     b"Content-Length: " + str(len(body)).encode() + b"\r\nConnection: close\r\n\r\n" + body)
        await writer.drain()
        writer.close()

    server = await asyncio.start_server(http, "0.0.0.0", port)
    async with server:
        await worker.run()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()
