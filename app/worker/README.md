---
title: MotherTongue Worker
emoji: 🗣️
colorFrom: indigo
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# MotherTongue worker

No GPU. Claims jobs from the Supabase `jobs` table, calls **AMD Token Factory** (Gemma-4-31B-IT for seeing, writing,
checking and learning; OmniVoice for voices), renders each version with FFmpeg, uploads it to Supabase Storage and
reports progress on the `versions` row. `GET /` returns a small health JSON.

Secrets (Space → Settings → Variables and secrets): `AMD_TOKEN_FACTORY_API_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`.

```bash
uv run mothertongue-worker serve                       # the job worker
uv run mothertongue-worker run-local --template stride --audiences kolkata-bn,milan-it --out out/x
uv run mothertongue-worker publish-samples             # upload sample renders for the demo workspace
```
