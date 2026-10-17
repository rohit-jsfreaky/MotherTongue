# hackathon.md — rules and submission checklist

**AMD Developer Hackathon: ACT III** (lablab.ai × AMD). Event: https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii
Rules: https://lablab.ai/hackathon-rules · Guidelines: https://lablab.ai/ai-articles/hackathon-guidelines
Re-read live **14 Oct 2026** and again **17 Oct 2026 ~1:40 AM IST** (saved: `hackathon_ideas/contexts/amd-act-iii-page-2026-10-17.txt`);
deadline still Oct 18, 3:30 PM IST. If this file and the live page disagree, the live page wins.

## Clock (IST)
| | |
|---|---|
| Online build | Oct 12 → Oct 18 |
| **Submission deadline** | **Oct 18, 3:30 PM IST** (schedule + /live countdown; page header said 8:30 PM — plan for 3:30) |
| On-site pitches (Italy, optional) | Oct 18, 5:30–7:30 PM IST — we are online only |
| **Submit by** | **Oct 18, 12:00 PM IST** (submission page prepared by Oct 18, 10 AM) |

## Hard rules
- Registered on lablab + AMD AI Developer Program (done Sep). Create the lablab team/project page even when solo.
- **AMD is required:** "Every project must run a meaningful part of its workload on AMD infrastructure… The AMD component must
  be part of the working product shown to the judges." Options: AMD Developer Cloud, Instinct, ROCm, Ryzen AI, Radeon,
  event infra. Event FAQ: "hosted on notebooks.amd.com/tokenfactory… no billing… Just the api from the tokenfactory."
- Original work, "MIT-compliant". Plagiarism / unauthorized automation → DQ. Prize distribution up to 90 days.

## What to submit (lablab form)
- [ ] Project title (≤50 chars) · short description · long description · selected challenge (Track 4) · technology tags
- [ ] Cover image (16:9) · **demo video** (MP4, ≤5 min, <300 MB — keep ~2:30) · **pitch slides (PDF)**
- [ ] "Clear explanation of the problem and intended user"
- [ ] **Public GitHub repo** · demo application platform · **application URL** (working prototype)

## Tracks (main prize: AMD $5,000)
**Track 4 — Create a New Kind of Experience** (ours). Brief, verbatim: "Do more than generate an image, advertisement, or
chatbot. Create something that responds to its audience, changes with context, or produces a different experience for each
person." Ideas listed: "Personalized video · Interactive stories · Audience driven entertainment · Adaptive campaigns ·
**Multilingual creative content** · Generative brand experiences · … · **Creative quality control**".
Your demo: "Show the experience changing for at least two different audiences, situations, or inputs. Explain: What the team
created · What the models generated or decided · How you controlled quality and consistency · **How much each generated
experience costs** · Who would pay for it and why". Good projects: "An original concept · A strong user experience · A
thoughtful combination of human creativity and technology · A product that could work at a realistic cost".

## Judging criteria (verbatim)
| criterion | words | where MotherTongue earns it |
|---|---|---|
| Application of Technology | "How effectively the chosen model(s) are integrated into the solution." | All on AMD Token Factory: Gemma-4-31B-IT sees the ad, writes each audience's version, checks facts in the script and the finished frames, understands change requests and learns brand rules; OmniVoice speaks every version |
| Presentation | "The clarity and effectiveness of the project presentation." | one ad → three audience versions side by side; ask for a change in plain words → v2; investor deck |
| Business Value | "The impact and practical value, considering how well it fits into business areas." | a real SaaS brands/agencies can use today; cost per version vs agency/API; who pays and why |
| Originality | "The uniqueness and creativity of the solution…" | re-made per audience (not translated) + a review loop whose corrections become brand memory; nearest rivals do subtitles (Tigran) or web pages (Lumen) |

## Partner prizes (optional; one project can win main + partner)
- **Google $5,000** — "Google and Evolus technologies are optional. Teams that use an eligible partner technology can also
  compete for that partner's prize." (ACT II's was "Google DeepMind Gemma Prizes" → use **Gemma** for adaptation; confirm.)
- Evolus €1,011.50 in plans/credits (needs Evolus workspace + own vLLM endpoint on AMD Dev Cloud + ≥2 building blocks) — **not
  planned** unless time remains.
- Vibe Generation special (AirPods; criteria: Hybrid / Becreatives / Vibe Generation "taste, originality, human plus AI
  creative workflow") — our approval step is the human+AI workflow.

## Judges (who reads it)
AMD (Maharshi Trivedi), Evolus (Andrea Belloni, Riccardo Benedetti, Samuele Lomonaco), NativelyAI (Andrea Marazzi, Emmanuel
Iriarte), Confindustria Imperia (Paolo della Pietra), Francesco Belgrano (CEO Search Marketing Studio — marketing!), Paolo
Bonetti (Vibe Generation), + engineers from American Express, Walmart, Meta, Intuit, Apple, Amazon Ads.

## Ship checklist (Oct 18 morning)
- [ ] Live app URL works from a fresh browser; the worker is running (Token Factory + FFmpeg); sample workspace pre-rendered
- [ ] Repo public; README in kit order; START_HERE_FOR_JUDGES.md; `verify` prints PASS lines
- [ ] Numbers re-synced across README, slides, video, form; evidence files present
- [ ] Video ≤ 2:30 uploaded; investor deck PDF; cover image
- [ ] Landing page: product words only (no tech); demo workspace works with no signup
- [ ] Submitted on lablab by 12:00 PM IST, confirmation saved
