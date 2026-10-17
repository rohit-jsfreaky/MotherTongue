# MotherTongue — one ad, every audience

**A brand uploads one video ad and gets a different, ready-to-run version for each audience — its own words, tone, voice
and on-screen text — while the price, the offer and every brand fact stay exactly as the brand set them. Every AI step runs
on AMD Token Factory (Gemma-4-31B-IT + OmniVoice).**

Built for the AMD Developer Hackathon: ACT III (lablab.ai) · Track 4 — Create a New Kind of Experience.

> **Live app: https://mothertongue-flame.vercel.app** · one click, no sign-up: https://mothertongue-flame.vercel.app/try

---

## Judge it in 90 seconds
1. Open the live app → **Try with a sample ad**. You get a private sample workspace with three sample ads (fictional
   brands), each already made for Kolkata · Bengali, Lucknow · Hindi, Milan · Italian and Global · English.
2. Open a campaign → **Compare** → *Play all in sync*: one ad, four audiences, four different ads; every price exactly as the brand set it (₹149 in India, €4,90 in Milan).
3. Open **Mitti → Lucknow · Hindi**: the fact check **blocked** it — the AI added "बिल्कुल प्राकृतिक" (completely natural), a
   claim the brand never made. Approve is locked. Click **Request changes** → a v2 is made on AMD, re-checked, and the
   request becomes a **brand-memory** rule.
4. **Brand memory** shows what it learned; switch rules off, edit or delete them.

## What it does (the product)
1. **Upload** a finished ad (MP4 ≤ 60 s) + paste its voiceover script — or start from a sample ad.
2. **Pick audiences** (city · language · tone) or describe your own.
3. **Lock brand facts** — price, offer, dates, URL — shown and spoken forms per language.
4. MotherTongue makes one version per audience: **see** the ad → **adapt** the script (not translate) → **check facts** →
   **voice** it → **render** → **check the picture**.
5. **Review**: script line by line with the English meaning and *why it changed*, facts check, history; **Approve**,
   **Edit a line**, or **Request changes** in plain words → v2 with "how I understood it" and only the real changes.
6. **Brand memory** learns a reusable rule from each request/edit and applies it to the next versions.
7. **Export**: MP4, SRT subtitles, printable approval report with the AI-voice disclosure.

## How AMD does the work (every AI call goes to AMD Token Factory)
| step | model | endpoint | what it decides |
|---|---|---|---|
| See | Gemma-4-31B-IT (vision) | `/chat/completions` + `image_url` | what's on screen in each scene, where the product is, which band is free for text |
| Adapt | Gemma-4-31B-IT | `/chat/completions` (JSON) | each audience's script with facts as `{PLACEHOLDERS}`, the English meaning, why it changed |
| Check the script | Gemma-4-31B-IT + code | `/chat/completions` | every fact present and unchanged; no invented prices, discounts or claims |
| Voice | OmniVoice | `/audio/speech` | one steady brand voice per language (`ref_audio`), fitted to each scene (`duration`) |
| Check the picture | Gemma-4-31B-IT (vision) | `/chat/completions` + `image_url` | the finished frames show the right facts, right script, nothing cut off or covering the product |
| Revise + learn | Gemma-4-31B-IT | `/chat/completions` | understand a change request, make v2, distil a brand-memory rule |

Code: `app/worker/src/mothertongue_worker/` (`tf.py` client with a shared rate limiter, `see.py`, `adapt.py`,
`voice.py`, `render.py`, `check.py`, `revise.py`, `serve.py`).

## Things learned the hard way (Token Factory, 17 Oct 2026)
OmniVoice `instructions` accepts only attribute words; every call is a new speaker, so
we clone one reference clip per brand × language; `duration` fits lines to scenes; OmniVoice briefly vanished from the
catalogue (handled as "waiting for the voice service", job retried); Gemma transcribes Bengali off a frame badly but
verifies it well, so the picture check verifies instead of transcribing.

## The numbers
Every number here has a result file in `evidence/` and a script that reproduces it. Small samples, stated honestly.

| what | result | file |
|---|---|---|
| Planted wrong facts caught before approval (wrong price in digits, extra discount in words, wrong date in words, invented claim in words — × Bengali, Hindi, Italian, English) | **16 / 16 caught, 0 / 4 false alarms** on clean controls | `evidence/planted.json` (`evidence/scripts/planted_facts.py`) |
| …of those, caught by the code check alone | 8 / 16 (the ones in digits or that drop a fact) — the 8 written **in words** are caught only by Gemma on AMD | same |
| AI calls per version (15 s ad, 4 scenes) | **≈ 10** on AMD Token Factory: 3 Gemma + 7 OmniVoice (median 10, range 8–12; + 1 shared "see" call per campaign) | `evidence/cost.json` (`evidence/scripts/cost_report.py`) |
| Tokens per version | ≈ 3,800 in / 630 out (Gemma) | same |
| Time per version | ≈ 2.3 min median wall time with 4 versions made at once under one 20 req/min limit (voice ≈ 69 s incl. waiting for the limiter, write ≈ 25 s, picture check ≈ 26 s, render ≈ 3 s) | same |
| Token Factory meter for the whole build day (~350 calls: all tests + 12 versions + revisions) | $0.0076 of the $1/day nominal allowance (the service is free for the event; this is its own nominal meter) | same |
| What it replaces | AI video translation alone costs **$2–20 per minute** (pictory.ai, 12 Aug 2026) ≈ $0.50–5 per 15-second ad per language, and still sounds translated | pictory.ai "10 Best AI Video Translators We Tested in 2026" (12 Aug 2026) |
| Real checks that fired during the build | picture check caught the price card covering the shoe in 3/4 Stride versions (fixed in placement logic); Gemma fact check blocked an invented "completely natural" claim in Mitti · Hindi | `evidence/phase1/picture-check-…json`, `evidence/phase1/factcheck-…json` |
| Review loop, real | v1 blocked → plain-words request → v2 on AMD in ≈ 3 min, only the problem scene changed, rule learned | `evidence/phase1/review-loop-…json` |

## Honest limits
- No speech-to-text on Token Factory today → uploads need their voiceover script pasted, and the facts check runs on the
  script that is voiced (plus vision on the finished frames), not on the audio itself. Re-tested the evening of 17 Oct:
  MiMo still rejects audio input, and `/v1/audio/transcriptions` now answers but has no model behind it
  (`evidence/stt-retest-2026-10-17.json`). The day a transcription model appears, listen-back is one more check.
- Uploaded videos: the original voice is replaced by the new voice over the uploader's music track; burned-in text stays.
- Languages offered are the four whose voices we tested: Bengali, Hindi, Italian, English.
- Sample brands (Kettle & Kadak, Stride, Mitti) are fictional; footage is from Pexels and music from Pixabay (free
  licences, see `app/worker/templates/ASSETS.txt`).

## Stack
Next.js 16 (App Router) on Vercel (Mumbai) · Supabase (Auth incl. anonymous, Postgres + RLS, Storage, Realtime) · Python
worker (httpx + FFmpeg/libass, no GPU) that drains a Supabase job queue on **GitHub Actions** — woken by the app the
moment a job is queued, with a 5-minute schedule as a safety net (`.github/workflows/worker.yml`) · AMD Token Factory.

## Run it locally
```bash
# worker (needs AMD_TOKEN_FACTORY_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY in .env)
cd app/worker && uv sync
uv run mothertongue-worker run-local --template kettle-and-kadak --audiences kolkata-bn,milan-it --out out/demo
uv run mothertongue-worker serve          # the always-on job worker
# web
cd app/web && npm install && npm run dev
```
