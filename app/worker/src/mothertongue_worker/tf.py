"""AMD Token Factory client: every AI call in MotherTongue goes through here.

One shared limiter keeps us under the account's requests/minute and the key's concurrency cap, 429s are retried
after Retry-After, and every call is logged (model, latency, response id, usage) so a version's cost is a real number.
"""

from __future__ import annotations

import asyncio
import base64
import contextvars
import json
import random
import re
import time
from collections import deque
from dataclasses import dataclass, field
from typing import Any

import httpx

from .config import Settings

RETRY_STATUSES = {429, 500, 502, 503, 504}

# Which version a call belongs to, so parallel versions each get their own true cost.
current_job: contextvars.ContextVar[str | None] = contextvars.ContextVar("current_job", default=None)


class TokenFactoryError(RuntimeError):
    pass


class ModelUnavailable(TokenFactoryError):
    """The model is (temporarily) missing from the catalogue — wait and try the job again later."""


@dataclass
class CallRecord:
    stage: str
    model: str
    endpoint: str
    status: int
    started_at: float
    seconds: float
    attempt: int
    response_id: str | None = None
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    output_bytes: int | None = None
    ratelimit: dict[str, str] = field(default_factory=dict)
    error: str | None = None
    job: str | None = field(default_factory=current_job.get)

    def to_dict(self) -> dict[str, Any]:
        return {k: v for k, v in self.__dict__.items() if v not in (None, {}, "")}


class _Limiter:
    """Sliding-window requests/minute plus a concurrency cap, shared by every caller in the process."""

    def __init__(self, rpm: int, concurrent: int) -> None:
        self._rpm = rpm
        self._sent: deque[float] = deque()
        self._lock = asyncio.Lock()
        self._sem = asyncio.Semaphore(concurrent)
        self._paused_until = 0.0

    async def acquire(self) -> None:
        await self._sem.acquire()
        while True:
            async with self._lock:
                now = time.monotonic()
                while self._sent and now - self._sent[0] >= 60:
                    self._sent.popleft()
                wait = max(0.0, self._paused_until - now)
                if not wait and len(self._sent) < self._rpm:
                    self._sent.append(now)
                    return
                if not wait:
                    wait = 60 - (now - self._sent[0]) + 0.05
            await asyncio.sleep(wait)

    def release(self) -> None:
        self._sem.release()

    def pause(self, seconds: float) -> None:
        self._paused_until = max(self._paused_until, time.monotonic() + seconds)


class TokenFactory:
    def __init__(self, settings: Settings) -> None:
        self.s = settings
        self._limiter = _Limiter(settings.requests_per_minute, settings.max_concurrent)
        self._http = httpx.AsyncClient(
            base_url=settings.tf_base_url,
            headers={"Authorization": f"Bearer {settings.tf_api_key}"},
            timeout=httpx.Timeout(120.0, connect=20.0),
        )
        self.calls: list[CallRecord] = []

    async def aclose(self) -> None:
        await self._http.aclose()

    async def _post(self, stage: str, endpoint: str, body: dict[str, Any], max_attempts: int = 4) -> httpx.Response:
        model = str(body.get("model"))
        for attempt in range(1, max_attempts + 1):
            await self._limiter.acquire()
            started = time.time()
            t0 = time.monotonic()
            try:
                resp = await self._http.post(endpoint, json=body)
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                self._limiter.release()
                self.calls.append(CallRecord(stage, model, endpoint, 0, started, time.monotonic() - t0, attempt,
                                             error=f"{type(exc).__name__}"))
                if attempt == max_attempts:
                    raise TokenFactoryError(f"{stage}: {type(exc).__name__} after {attempt} attempts") from exc
                await asyncio.sleep(_backoff(attempt))
                continue
            self._limiter.release()
            rec = CallRecord(stage, model, endpoint, resp.status_code, started, time.monotonic() - t0, attempt,
                             ratelimit={k: v for k, v in resp.headers.items() if k.lower().startswith("x-ratelimit")})
            self.calls.append(rec)
            if resp.status_code < 400:
                return resp
            rec.error = resp.text[:300]
            if resp.status_code == 400 and "model_not_found" in resp.text:
                raise ModelUnavailable(f"{stage}: {model} is not available right now")
            if resp.status_code in RETRY_STATUSES and attempt < max_attempts:
                retry_after = _retry_after(resp)
                if resp.status_code == 429 and retry_after:
                    self._limiter.pause(retry_after)
                await asyncio.sleep(retry_after or _backoff(attempt))
                continue
            raise TokenFactoryError(f"{stage}: HTTP {resp.status_code}: {resp.text[:300]}")
        raise TokenFactoryError(f"{stage}: gave up")

    async def chat_json(self, stage: str, system: str, user: str | list[dict[str, Any]],
                        max_tokens: int = 4000, temperature: float = 0.6) -> dict[str, Any]:
        """One Gemma call that must return a JSON object."""
        body = {
            "model": self.s.text_model,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
            "response_format": {"type": "json_object"},
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        last_err = ""
        for _ in range(2):  # one retry if the model returns something that isn't JSON
            resp = await self._post(stage, "/chat/completions", body)
            data = resp.json()
            rec = self.calls[-1]
            rec.response_id = data.get("id")
            usage = data.get("usage") or {}
            rec.prompt_tokens = usage.get("prompt_tokens")
            rec.completion_tokens = usage.get("completion_tokens")
            choice = (data.get("choices") or [{}])[0]
            content = (choice.get("message") or {}).get("content") or ""
            if choice.get("finish_reason") == "length":
                body["max_tokens"] = int(body["max_tokens"] * 2)
            try:
                return parse_json_object(content)
            except ValueError as exc:
                last_err = str(exc)
                rec.error = f"bad json: {last_err}"
        raise TokenFactoryError(f"{stage}: model did not return JSON ({last_err})")

    async def speak(self, stage: str, text: str, voice: str = "female", instructions: str | None = None) -> bytes:
        """OmniVoice text -> WAV bytes."""
        body: dict[str, Any] = {"model": self.s.voice_model, "input": text, "voice": voice}
        if instructions:
            body["instructions"] = instructions
        resp = await self._post(stage, "/audio/speech", body)
        rec = self.calls[-1]
        rec.output_bytes = len(resp.content)
        if not resp.headers.get("content-type", "").startswith("audio"):
            raise TokenFactoryError(f"{stage}: expected audio, got {resp.headers.get('content-type')}")
        return resp.content

    async def usage(self) -> dict[str, Any]:
        resp = await self._http.get("/usage", params={"include_recent": "false"})
        resp.raise_for_status()
        return resp.json()


def image_part(png_bytes: bytes, mime: str = "image/jpeg") -> dict[str, Any]:
    return {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{base64.b64encode(png_bytes).decode()}"}}


def parse_json_object(text: str) -> dict[str, Any]:
    text = text.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)```", text, re.S)
    if fenced:
        text = fenced.group(1).strip()
    try:
        obj = json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start < 0 or end <= start:
            raise ValueError("no JSON object in reply")
        obj = json.loads(text[start:end + 1])
    if not isinstance(obj, dict):
        raise ValueError("reply is not a JSON object")
    return obj


def _retry_after(resp: httpx.Response) -> float:
    try:
        return float(resp.headers.get("retry-after", "0"))
    except ValueError:
        return 0.0


def _backoff(attempt: int) -> float:
    return min(30.0, 2 ** attempt) * (0.5 + random.random() / 2)
