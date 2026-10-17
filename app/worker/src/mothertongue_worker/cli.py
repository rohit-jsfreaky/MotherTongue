"""Command line: run a campaign locally (`run-local`) or serve the Supabase job queue (`serve`)."""

from __future__ import annotations

import argparse
import asyncio
import json
import time
from datetime import datetime, timezone
from pathlib import Path

from .config import WORKER_ROOT, load_settings
from .pipeline import make_version, see_master
from .tf import TokenFactory

TEMPLATES = WORKER_ROOT / "templates"


def load_template(template_id: str) -> dict:
    return json.loads((TEMPLATES / template_id / "template.json").read_text(encoding="utf-8"))


def load_audiences(ids: list[str]) -> list[dict]:
    presets = {a["id"]: a for a in json.loads((TEMPLATES / "audiences.json").read_text(encoding="utf-8"))}
    return [presets[i] for i in ids]


async def run_local(args: argparse.Namespace) -> None:
    settings = load_settings()
    master = load_template(args.template)
    audiences = load_audiences(args.audiences.split(","))
    assets = Path(args.assets) if args.assets else TEMPLATES / args.template
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    if args.no_music:
        master["music"] = None
    tf = TokenFactory(settings)
    started = time.monotonic()
    try:
        seen = await see_master(tf, master, assets)
        print("seen:", json.dumps(seen["placement"]))

        async def one(aud: dict) -> dict:
            async def progress(stage: str) -> None:
                print(f"[{aud['id']}] {stage}", flush=True)
            rec = await make_version(tf, master, aud, seen, [], assets, out / aud["id"], out / "voices",
                                     settings.ffmpeg_threads, progress=progress)
            print(f"[{aud['id']}] {rec['status']} · {rec['cost']['model_calls']} calls · "
                  f"{len(rec['issues'])} issues", flush=True)
            return rec

        results = await asyncio.gather(*[one(a) for a in audiences], return_exceptions=True)
        failed = {a["id"]: f"{type(r).__name__}: {r}" for a, r in zip(audiences, results) if isinstance(r, BaseException)}
        for aid, err in failed.items():
            print(f"[{aid}] FAILED {err[:300]}", flush=True)
        records = [r for r in results if not isinstance(r, BaseException)]
        usage = None
        try:
            usage = await tf.usage()
        except Exception as exc:  # usage is a nice-to-have in the manifest, never a reason to fail the run
            usage = {"error": str(exc)[:200]}
    finally:
        await tf.aclose()
    run = {
        "template": args.template,
        "audiences": [a["id"] for a in audiences],
        "finished_at": datetime.now(timezone.utc).isoformat(),
        "wall_seconds": round(time.monotonic() - started, 1),
        "see": seen,
        "versions": [{k: r[k] for k in ("language", "summary", "status", "issues", "lines", "picture")}
                     | {"audience": r["audience"]["id"], "cost": {k: v for k, v in r["cost"].items() if k != "calls"}}
                     for r in records],
        "failed": failed,
        "all_calls": [c.to_dict() for c in tf.calls],
        "usage_after": {k: v for k, v in (usage or {}).items() if k != "recent"},
    }
    (out / "run.json").write_text(json.dumps(run, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"done in {run['wall_seconds']} s -> {out / 'run.json'}")


def main() -> None:
    p = argparse.ArgumentParser(prog="mothertongue-worker")
    sub = p.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run-local", help="make versions of a template for some audiences, into a folder")
    r.add_argument("--template", required=True)
    r.add_argument("--audiences", required=True, help="comma-separated preset ids")
    r.add_argument("--assets", help="folder with the template's clips and music (default: the template folder)")
    r.add_argument("--out", required=True)
    r.add_argument("--no-music", action="store_true")
    sv = sub.add_parser("serve", help="serve the Supabase job queue (the always-on worker)")
    sv.add_argument("--drain", type=float, default=None, metavar="SECONDS",
                    help="process the queue, then exit after it has been empty this long (CI / on-demand runs)")
    pub = sub.add_parser("publish-samples", help="upload rendered samples for the demo workspace + landing copies")
    pub.add_argument("--out", help="folder with <template>/<audience>/ renders (default: worker/out)")
    a = p.parse_args()
    if a.cmd == "run-local":
        asyncio.run(run_local(a))
    elif a.cmd == "publish-samples":
        from .publish import main_publish
        main_publish(a.out)
    elif a.cmd == "serve":
        from .serve import serve
        asyncio.run(serve(load_settings(), a.drain))
