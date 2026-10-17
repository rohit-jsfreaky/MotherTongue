"use client";

import { ArrowLeft, ArrowRight, CheckCircle, CircleNotch, FilmStrip, Info, Lock, MusicNotes, Plus, Trash, UploadSimple } from "@phosphor-icons/react";
import { useMemo, useState, useTransition } from "react";
import { createFromTemplate, createFromUpload, uploadTicket } from "@/app/app/actions";
import { startTopLoader, stopTopLoader } from "@/components/site/TopLoader";
import { supabaseBrowser } from "@/lib/supabase/client";
import { LANGUAGE_NAMES, type Fact } from "@/lib/types";

type Preset = { id: string; label: string; city: string; language: string; tone: string; notes: string; voice: string };
type TemplateCard = { id: string; name: string; brand: string; lines: string[]; facts: Fact[] };
type UploadFact = { key: string; label: string; shown: string; said: Record<string, string> };
type Line = { text: string; start: number; end: number };

const STEPS = ["Your ad", "Audiences", "Brand facts"];
const MAX_SECONDS = 60;
const MAX_BYTES = 50 * 1024 * 1024;

function splitScript(script: string, seconds: number): Line[] {
  const parts = script
    .split(/\n+|(?<=[.!?।])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const words = parts.map((p) => Math.max(1, p.split(/\s+/).length));
  const total = words.reduce((a, b) => a + b, 0) || 1;
  let t = 0;
  return parts.map((text, i) => {
    const dur = (seconds * words[i]) / total;
    const line = { text, start: Math.round(t * 10) / 10, end: Math.round((t + dur) * 10) / 10 };
    t += dur;
    return line;
  });
}

export function NewCampaignWizard({ templates, presets }: { templates: TemplateCard[]; presets: Preset[] }) {
  const [step, setStep] = useState(0);
  const [source, setSource] = useState<"template" | "upload">("template");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<string[]>(["kolkata-bn", "lucknow-hi", "milan-it"]);
  const [custom, setCustom] = useState<Preset[]>([]);
  const [draftAud, setDraftAud] = useState({ city: "", language: "bn", tone: "", notes: "" });
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  // upload state
  const [video, setVideo] = useState<{ path: string; seconds: number; name: string } | null>(null);
  const [music, setMusic] = useState<{ path: string; name: string } | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [script, setScript] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [brand, setBrand] = useState({ name: "", tone: "", neverChange: "" });
  const [facts, setFacts] = useState<UploadFact[]>([
    { key: "PRICE", label: "Price", shown: "", said: {} },
    { key: "OFFER", label: "Offer", shown: "", said: {} },
  ]);

  const template = templates.find((t) => t.id === templateId);
  const languages = useMemo(() => {
    const all = [...presets.filter((p) => picked.includes(p.id)), ...custom].map((a) => a.language);
    return [...new Set(all)];
  }, [picked, custom, presets]);
  const audienceCount = picked.length + custom.length;

  async function upload(kind: "video" | "music", file: File) {
    setError("");
    if (kind === "video") {
      if (file.size > MAX_BYTES) return setError("Videos up to 50 MB, please.");
      const seconds = await new Promise<number>((res) => {
        const el = document.createElement("video");
        el.preload = "metadata";
        el.onloadedmetadata = () => res(el.duration);
        el.onerror = () => res(0);
        el.src = URL.createObjectURL(file);
      });
      if (!seconds) return setError("That file doesn't look like a video we can read. Use an MP4.");
      if (seconds > MAX_SECONDS) return setError("Ads up to 60 seconds, please.");
      setUploading("video");
      const t = await uploadTicket("video", file.name);
      const { error: e } = await supabaseBrowser().storage.from("media").uploadToSignedUrl(t.path, t.token, file, { contentType: "video/mp4" });
      setUploading(null);
      if (e) return setError("The upload didn't finish. Try again.");
      setVideo({ path: t.path, seconds, name: file.name });
      if (script.trim()) setLines(splitScript(script, seconds));
    } else {
      if (file.size > MAX_BYTES) return setError("Music up to 50 MB, please.");
      setUploading("music");
      const t = await uploadTicket("music", file.name);
      const { error: e } = await supabaseBrowser().storage.from("media").uploadToSignedUrl(t.path, t.token, file);
      setUploading(null);
      if (e) return setError("The music upload didn't finish. Try again.");
      setMusic({ path: t.path, name: file.name });
    }
  }

  function canNext() {
    if (step === 0) return source === "template" ? Boolean(templateId) : Boolean(video && lines.length);
    if (step === 1) return audienceCount > 0 && audienceCount <= 5;
    return true;
  }

  function submit() {
    setError("");
    startTopLoader();
    start(async () => {
      try {
        if (source === "template" && template) {
          await createFromTemplate({ templateId, name: name || template.name, audienceIds: picked, custom, facts: template.facts });
        } else if (video) {
          // Facts typed into the script become locked placeholders; the model never writes them.
          const used = facts.filter((f) => f.shown.trim());
          const toPh = (s: string) => used.reduce((acc, f) => acc.split(f.shown.trim()).join(`{${f.key}}`), s);
          const outLines = lines.map((l) => {
            const voice = toPh(l.text);
            const screen = used.filter((f) => voice.includes(`{${f.key}}`)).map((f) => `{${f.key}}`).join(" · ");
            return { ...l, text: voice, screen };
          });
          const outFacts: Fact[] = used.map((f) => ({
            key: f.key,
            label: f.label,
            kind: f.key.toLowerCase(),
            display: f.shown.trim(),
            spoken: Object.fromEntries(languages.map((lang) => [lang, (f.said[lang] || f.shown).trim()])),
          }));
          await createFromUpload({
            name: name || video.name.replace(/\.[^.]+$/, ""),
            brand: { name: brand.name, tone: brand.tone, neverChange: brand.neverChange.split(",").map((s) => s.trim()).filter(Boolean) },
            videoPath: video.path,
            musicPath: music?.path ?? null,
            lines: outLines,
            facts: outFacts,
            audienceIds: picked,
            custom,
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("NEXT_REDIRECT")) throw e;
        stopTopLoader();
        setError(msg);
      }
    });
  }

  return (
    <div className="mt-6">
      {/* Steps */}
      <ol className="flex gap-2">
        {STEPS.map((s, i) => (
          <li
            key={s}
            className={`flex flex-1 items-center gap-2 rounded-[14px] border px-4 py-3 text-[13.5px] font-semibold ${i === step ? "border-ink bg-white" : i < step ? "border-line bg-white text-ok" : "border-line bg-soft text-fg-3"}`}
          >
            {i < step ? <CheckCircle weight="fill" className="size-4" /> : <span className="font-mono text-[12px]">{i + 1}</span>}
            {s}
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-[24px] border border-line bg-white p-6 shadow-card">
        {step === 0 && (
          <div>
            <div className="inline-flex rounded-[12px] border border-line bg-soft p-1 text-[13.5px] font-semibold">
              {(["template", "upload"] as const).map((s) => (
                <button key={s} onClick={() => setSource(s)} className={`rounded-[9px] px-4 py-1.5 ${source === s ? "bg-white shadow-soft" : "text-fg-2"}`}>
                  {s === "template" ? "Start from a sample ad" : "Upload your ad"}
                </button>
              ))}
            </div>
            <label className="mt-5 block text-[13px] font-medium">
              Campaign name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={source === "template" ? template?.name : "Festive launch"}
                className="mt-1.5 h-11 w-full rounded-[12px] border border-line-2 px-3 text-[15px] outline-none focus:border-violet"
              />
            </label>

            {source === "template" ? (
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplateId(t.id)}
                    className={`rounded-[18px] border p-4 text-left transition ${templateId === t.id ? "border-violet bg-violet-50" : "border-line hover:border-line-2"}`}
                  >
                    <div className="flex items-center gap-2 text-[14.5px] font-semibold">
                      <FilmStrip weight="fill" className="size-4 text-violet" /> {t.brand}
                    </div>
                    <div className="mt-1 text-[12.5px] text-fg-3">{t.name}</div>
                    <ul className="mt-3 flex flex-col gap-1 text-[12.5px] text-fg-2">
                      {t.lines.map((l) => (
                        <li key={l} className="truncate">
                          “{l}”
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div className="flex flex-col gap-3">
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[18px] border border-dashed border-line-2 bg-soft p-6 text-center text-[13.5px] text-fg-2 hover:border-violet">
                    {uploading === "video" ? <CircleNotch className="size-6 animate-spin text-violet" /> : <UploadSimple weight="bold" className="size-6 text-violet" />}
                    {video ? (
                      <span className="font-semibold text-fg">
                        {video.name} · {video.seconds.toFixed(1)} s
                      </span>
                    ) : (
                      <span>
                        <span className="font-semibold text-fg">Drop your MP4</span> — up to 60 s and 50 MB
                      </span>
                    )}
                    <input type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={(e) => e.target.files?.[0] && upload("video", e.target.files[0])} />
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-[14px] border border-line px-4 py-3 text-[13px] text-fg-2 hover:border-line-2">
                    {uploading === "music" ? <CircleNotch className="size-4 animate-spin" /> : <MusicNotes className="size-4" />}
                    {music ? music.name : "Optional: the music-only track (otherwise the new voice plays alone)"}
                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload("music", e.target.files[0])} />
                  </label>
                  <p className="flex gap-2 rounded-[14px] bg-warn-100 p-3 text-[12.5px] leading-snug text-warn">
                    <Info weight="fill" className="mt-0.5 size-4 shrink-0" />
                    Each version gets a new voice over your music track. Text burned into your video stays as it is; we
                    add the new on-screen text and subtitles in the free space.
                  </p>
                </div>
                <div>
                  <label className="block text-[13px] font-medium">
                    Voiceover script
                    <textarea
                      value={script}
                      onChange={(e) => {
                        setScript(e.target.value);
                        if (video) setLines(splitScript(e.target.value, video.seconds));
                      }}
                      rows={5}
                      placeholder={"Paste what the voice says. One sentence per line works best.\nType prices and offers exactly as they are."}
                      className="mt-1.5 w-full rounded-[12px] border border-line-2 p-3 text-[14px] outline-none focus:border-violet"
                    />
                  </label>
                  {lines.length > 0 && (
                    <div className="mt-3 max-h-[220px] overflow-auto rounded-[14px] border border-line">
                      {lines.map((l, i) => (
                        <div key={i} className="flex items-center gap-2 border-b border-line px-3 py-2 text-[12.5px] last:border-0">
                          <input
                            type="number"
                            step="0.1"
                            value={l.start}
                            onChange={(e) => setLines((x) => x.map((y, j) => (j === i ? { ...y, start: Number(e.target.value) } : y)))}
                            className="w-14 rounded-md border border-line px-1 font-mono"
                          />
                          <input
                            type="number"
                            step="0.1"
                            value={l.end}
                            onChange={(e) => setLines((x) => x.map((y, j) => (j === i ? { ...y, end: Number(e.target.value) } : y)))}
                            className="w-14 rounded-md border border-line px-1 font-mono"
                          />
                          <span className="truncate">{l.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="grid gap-3 md:grid-cols-2">
              {presets.map((p) => {
                const on = picked.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => setPicked((x) => (on ? x.filter((y) => y !== p.id) : [...x, p.id]))}
                    className={`flex items-start gap-3 rounded-[18px] border p-4 text-left ${on ? "border-violet bg-violet-50" : "border-line hover:border-line-2"}`}
                  >
                    <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md ${on ? "bg-violet text-white" : "border border-line-2"}`}>
                      {on && <CheckCircle weight="bold" className="size-3.5" />}
                    </span>
                    <span>
                      <span className="block text-[14.5px] font-semibold">{p.label}</span>
                      <span className="block text-[12.5px] text-fg-2">{p.tone}</span>
                      <span className="mt-1 block text-[11.5px] text-fg-3">Voice: {p.voice}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 rounded-[18px] border border-line p-4">
              <div className="text-[14px] font-semibold">Describe your own audience</div>
              <div className="mt-3 grid gap-2 md:grid-cols-[1fr_150px_1fr_1fr_auto]">
                <input value={draftAud.city} onChange={(e) => setDraftAud({ ...draftAud, city: e.target.value })} placeholder="City or region" className="h-10 rounded-[11px] border border-line-2 px-3 text-[14px]" />
                <select value={draftAud.language} onChange={(e) => setDraftAud({ ...draftAud, language: e.target.value })} className="h-10 rounded-[11px] border border-line-2 px-2 text-[14px]">
                  {Object.entries(LANGUAGE_NAMES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <input value={draftAud.tone} onChange={(e) => setDraftAud({ ...draftAud, tone: e.target.value })} placeholder="Tone — e.g. playful, quick" className="h-10 rounded-[11px] border border-line-2 px-3 text-[14px]" />
                <input value={draftAud.notes} onChange={(e) => setDraftAud({ ...draftAud, notes: e.target.value })} placeholder="Who — e.g. college students" className="h-10 rounded-[11px] border border-line-2 px-3 text-[14px]" />
                <button
                  disabled={!draftAud.city.trim()}
                  onClick={() => {
                    setCustom((x) => [
                      ...x,
                      {
                        id: `custom-${Date.now()}`,
                        label: `${draftAud.city.trim()} · ${LANGUAGE_NAMES[draftAud.language]}`,
                        city: draftAud.city.trim(),
                        language: draftAud.language,
                        tone: draftAud.tone.trim(),
                        notes: draftAud.notes.trim(),
                        voice: "female, young adult",
                      },
                    ]);
                    setDraftAud({ city: "", language: draftAud.language, tone: "", notes: "" });
                  }}
                  className="inline-flex h-10 items-center gap-1 rounded-[11px] bg-ink px-3 text-[13px] font-semibold text-white disabled:opacity-40"
                >
                  <Plus weight="bold" className="size-4" /> Add
                </button>
              </div>
              {custom.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {custom.map((c) => (
                    <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-[12.5px] font-semibold text-violet">
                      {c.label}
                      <button onClick={() => setCustom((x) => x.filter((y) => y.id !== c.id))} aria-label="Remove">
                        <Trash className="size-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-3 text-[12px] text-fg-3">Languages we offer are the ones whose voices we tested properly: Bengali, Hindi, Italian, English.</p>
            </div>
            <p className="mt-3 text-[13px] text-fg-2">
              {audienceCount} audience{audienceCount === 1 ? "" : "s"} · {audienceCount} version{audienceCount === 1 ? "" : "s"} will be made (up to 5).
            </p>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="flex items-center gap-2 text-[15px] font-semibold">
              <Lock weight="bold" className="size-4" /> Brand facts — locked
            </div>
            <p className="mt-1 text-[13px] text-fg-2">
              These come from you, never from the AI. Every version is checked against them — on screen and in the voice — before you can approve it.
            </p>
            {source === "template" && template ? (
              <div className="mt-4 overflow-x-auto rounded-[16px] border border-line">
                <table className="w-full min-w-[640px] text-left text-[13px]">
                  <thead className="bg-soft text-[11.5px] uppercase tracking-wide text-fg-3">
                    <tr>
                      <th className="px-3 py-2">Fact</th>
                      <th className="px-3 py-2">Shown</th>
                      {languages.map((l) => (
                        <th key={l} className="px-3 py-2">
                          Said in {LANGUAGE_NAMES[l]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {template.facts.map((f) => (
                      <tr key={f.key} className="border-t border-line">
                        <td className="px-3 py-2 font-medium">{f.label}</td>
                        <td className="px-3 py-2 font-mono text-[12px]">
                          {typeof f.display === "string" ? f.display : f.display.default ?? f.display.en}
                        </td>
                        {languages.map((l) => (
                          <td key={l} className="px-3 py-2">
                            {typeof f.spoken === "object" ? f.spoken?.[l] ?? "—" : f.spoken ?? "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-4">
                <div className="grid gap-2 md:grid-cols-3">
                  <input value={brand.name} onChange={(e) => setBrand({ ...brand, name: e.target.value })} placeholder="Brand name" className="h-10 rounded-[11px] border border-line-2 px-3 text-[14px]" />
                  <input value={brand.tone} onChange={(e) => setBrand({ ...brand, tone: e.target.value })} placeholder="Brand tone — e.g. warm, honest" className="h-10 rounded-[11px] border border-line-2 px-3 text-[14px]" />
                  <input value={brand.neverChange} onChange={(e) => setBrand({ ...brand, neverChange: e.target.value })} placeholder="Words never to change (comma-separated)" className="h-10 rounded-[11px] border border-line-2 px-3 text-[14px]" />
                </div>
                {facts.map((f, i) => (
                  <div key={f.key} className="rounded-[16px] border border-line p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <input value={f.label} onChange={(e) => setFacts((x) => x.map((y, j) => (j === i ? { ...y, label: e.target.value } : y)))} className="h-9 w-36 rounded-[10px] border border-line-2 px-2 text-[13.5px] font-semibold" />
                      <input
                        value={f.shown}
                        onChange={(e) => setFacts((x) => x.map((y, j) => (j === i ? { ...y, shown: e.target.value } : y)))}
                        placeholder="Exactly as in your script — e.g. ₹499"
                        className="h-9 flex-1 rounded-[10px] border border-line-2 px-3 font-mono text-[13px]"
                      />
                      <button onClick={() => setFacts((x) => x.filter((_, j) => j !== i))} className="grid size-9 place-items-center rounded-[10px] text-fg-3 hover:bg-bad-100 hover:text-bad" aria-label="Remove fact">
                        <Trash className="size-4" />
                      </button>
                    </div>
                    {f.shown && !lines.some((l) => l.text.includes(f.shown.trim())) && (
                      <p className="mt-2 text-[12px] text-warn">Not found in your script — type it exactly as written there.</p>
                    )}
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {languages.map((l) => (
                        <input
                          key={l}
                          value={f.said[l] ?? ""}
                          onChange={(e) => setFacts((x) => x.map((y, j) => (j === i ? { ...y, said: { ...y.said, [l]: e.target.value } } : y)))}
                          placeholder={`How it's said in ${LANGUAGE_NAMES[l]} — e.g. in words`}
                          className="h-9 rounded-[10px] border border-line px-3 text-[13px]"
                        />
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setFacts((x) => [...x, { key: `FACT${x.length + 1}`, label: "Website", shown: "", said: {} }])}
                  className="inline-flex h-9 w-fit items-center gap-1.5 rounded-[11px] border border-line-2 px-3 text-[13px] font-semibold"
                >
                  <Plus weight="bold" className="size-4" /> Add a fact
                </button>
              </div>
            )}
          </div>
        )}

        {error && <p className="mt-4 rounded-[10px] bg-bad-100 px-3 py-2 text-[13px] text-bad">{error}</p>}

        <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex h-10 items-center gap-1.5 rounded-[12px] px-3 text-[14px] font-semibold text-fg-2 disabled:opacity-0"
          >
            <ArrowLeft className="size-4" /> Back
          </button>
          {step < 2 ? (
            <button
              onClick={() => canNext() && setStep((s) => s + 1)}
              disabled={!canNext()}
              className="inline-flex h-10 items-center gap-1.5 rounded-[12px] bg-ink px-4 text-[14px] font-semibold text-white disabled:opacity-40"
            >
              Next <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={pending}
              className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-lime px-5 text-[14.5px] font-semibold text-ink shadow-[var(--shadow-lime)] disabled:opacity-50"
            >
              {pending && <CircleNotch className="size-4 animate-spin" />} Make {audienceCount} version{audienceCount === 1 ? "" : "s"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
