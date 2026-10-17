"""Tiny Supabase client for the worker: PostgREST rows, one RPC, and Storage — service role, server side only."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import httpx


class Supa:
    def __init__(self, url: str, service_key: str) -> None:
        headers = {"apikey": service_key}
        # New secret keys (sb_secret_…) go in `apikey` only; legacy service_role JWTs also as a Bearer token.
        if not service_key.startswith("sb_"):
            headers["Authorization"] = f"Bearer {service_key}"
        self._http = httpx.AsyncClient(
            base_url=url.rstrip("/"),
            headers=headers,
            timeout=httpx.Timeout(60.0, connect=15.0),
        )

    async def aclose(self) -> None:
        await self._http.aclose()

    async def rpc(self, fn: str, args: dict[str, Any]) -> Any:
        r = await self._http.post(f"/rest/v1/rpc/{fn}", json=args)
        r.raise_for_status()
        return r.json()

    async def one(self, table: str, **eq: Any) -> dict[str, Any]:
        rows = await self.select(table, **eq)
        if not rows:
            raise LookupError(f"{table} {eq} not found")
        return rows[0]

    async def select(self, table: str, order: str | None = None, **eq: Any) -> list[dict[str, Any]]:
        params = {k: f"eq.{v}" for k, v in eq.items()}
        params["select"] = "*"
        if order:
            params["order"] = order
        r = await self._http.get(f"/rest/v1/{table}", params=params)
        r.raise_for_status()
        return r.json()

    async def insert(self, table: str, row: dict[str, Any]) -> dict[str, Any]:
        r = await self._http.post(f"/rest/v1/{table}", json=row, headers={"Prefer": "return=representation"})
        r.raise_for_status()
        return r.json()[0]

    async def update(self, table: str, values: dict[str, Any], **eq: Any) -> None:
        params = {k: f"eq.{v}" for k, v in eq.items()}
        r = await self._http.patch(f"/rest/v1/{table}", params=params, json=values)
        r.raise_for_status()

    async def download(self, bucket: str, path: str, dest: Path) -> Path:
        r = await self._http.get(f"/storage/v1/object/{bucket}/{path}")
        r.raise_for_status()
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(r.content)
        return dest

    async def upload(self, bucket: str, path: str, src: Path, content_type: str) -> str:
        r = await self._http.post(f"/storage/v1/object/{bucket}/{path}", content=src.read_bytes(),
                                  headers={"Content-Type": content_type, "x-upsert": "true"})
        r.raise_for_status()
        return path
