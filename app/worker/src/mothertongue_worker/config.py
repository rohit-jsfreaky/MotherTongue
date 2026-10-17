"""Settings, read once from the environment (and the repo-root .env when running locally)."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

WORKER_ROOT = Path(__file__).resolve().parents[2]
REPO_ROOT = WORKER_ROOT.parents[1]

# Local runs read the repo-root .env; on the server the variables come from the host.
load_dotenv(REPO_ROOT / ".env")


@dataclass(frozen=True)
class Settings:
    tf_base_url: str
    tf_api_key: str
    text_model: str
    voice_model: str
    # Token Factory allows 20 requests/min per account and 8 concurrent per key; we stay under both.
    requests_per_minute: int
    max_concurrent: int
    ffmpeg_threads: int
    supabase_url: str | None
    supabase_service_key: str | None


def load_settings() -> Settings:
    key = os.environ.get("AMD_TOKEN_FACTORY_API_KEY", "").strip()
    if not key:
        raise RuntimeError("AMD_TOKEN_FACTORY_API_KEY is not set")
    return Settings(
        tf_base_url=os.environ.get("TF_BASE_URL", "https://developer.amd.com.cn/radeon/api/v1").rstrip("/"),
        tf_api_key=key,
        text_model=os.environ.get("TF_TEXT_MODEL", "Gemma-4-31B-IT"),
        voice_model=os.environ.get("TF_VOICE_MODEL", "OmniVoice"),
        requests_per_minute=int(os.environ.get("TF_RPM", "18")),
        max_concurrent=int(os.environ.get("TF_CONCURRENCY", "4")),
        ffmpeg_threads=int(os.environ.get("FFMPEG_THREADS", "2")),
        supabase_url=os.environ.get("SUPABASE_URL"),
        supabase_service_key=os.environ.get("SUPABASE_SECRET_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY"),
    )
