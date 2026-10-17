# MotherTongue — one ad, every audience

**A brand uploads one video ad and gets a different, ready-to-run version for each audience — its own words, tone, voice
and on-screen text — while the price, the offer and every brand fact stay exactly as the brand set them. Every AI step runs
on AMD Token Factory (Gemma-4-31B-IT + OmniVoice).**

Built for the AMD Developer Hackathon: ACT III (lablab.ai) · Track 4 — Create a New Kind of Experience.

> Live app: _(Vercel URL — added at deploy)_ · Try it in one click: `/try` (no sign-up)

---

## Judge it in 90 seconds
1. Open the live app → **Try with a sample ad**. You get a private sample workspace with three sample ads (fictional
   brands), each already made for Kolkata · Bengali, Lucknow · Hindi, Milan · Italian and Global · English.
2. Open a campaign → **Compare** → *Play all in sync*: one ad, four audiences, four different ads; same price everywhere.
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
_(filled from `evidence/` before submission — no number appears here without its file)_

## Honest limits
- No speech-to-text on Token Factory today → uploads need their voiceover script pasted, and the facts check runs on the
  script that is voiced (plus vision on the finished frames), not on the audio itself.
- Uploaded videos: the original voice is replaced by the new voice over the uploader's music track; burned-in text stays.
- Languages offered are the four whose voices we tested: Bengali, Hindi, Italian, English.
- Sample brands (Kettle & Kadak, Stride, Mitti) are fictional; footage is from Pexels and music from Pixabay (free
  licences, see `app/worker/templates/ASSETS.txt`).

## Stack
Next.js 16 (App Router) on Vercel · Supabase (Auth incl. anonymous, Postgres + RLS, Storage, Realtime) · Python worker
(httpx + FFmpeg/libass, no GPU) polling a Supabase job queue · AMD Token Factory.

## Run it locally
```bash
# worker (needs AMD_TOKEN_FACTORY_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY in .env)
cd app/worker && uv sync
uv run mothertongue-worker run-local --template kettle-and-kadak --audiences kolkata-bn,milan-it --out out/demo
uv run mothertongue-worker serve          # the always-on job worker
# web
cd app/web && npm install && npm run dev
```
