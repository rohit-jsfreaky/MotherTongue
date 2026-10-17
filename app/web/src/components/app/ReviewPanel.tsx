"use client";

import {
  ArrowRight,
  Brain,
  ChatCircleText,
  CheckCircle,
  CircleNotch,
  ClockCounterClockwise,
  DownloadSimple,
  FileText,
  Lock,
  PencilSimple,
  SealCheck,
  Sparkle,
  Warning,
  XCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { applyFactChange, approve, editLine, requestChanges } from "@/app/app/actions";
import { startTopLoader, stopTopLoader } from "@/components/site/TopLoader";
import type { AudienceRow, Master, RuleRow, VersionRow } from "@/lib/types";

const CHIPS = ["Too formal", "Too long", "Sounds translated", "Wrong slang", "Keep brand name in English", "More energy", "Calmer"];
const STAGES = ["understanding your request", "writing", "voicing", "checking", "rendering", "checking the picture", "saving"];

type Props = {
  campaignId: string;
  version: VersionRow;
  parent: VersionRow | null;
  audience: AudienceRow;
  master: Master;
  history: { id: string; n: number; status: string; created_at: string }[];
  feedback: { version_id: string; kind: string; text: string; chips: string[]; created_at: string }[];
  rules: RuleRow[];
  media: { mp4: string | null; srt: string | null; poster: string | null };
};

export function ReviewPanel(p: Props) {
  const v = p.version;
  const rec = v.record ?? {};
  const [tab, setTab] = useState<"script" | "facts" | "history">("script");
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [request, setRequest] = useState("");
  const [chips, setChips] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const making = ["queued", "making", "waiting"].includes(v.status);
  const issues = rec.issues ?? [];
  const blocking = issues.filter((i) => i.blocking);
  const myRequest = p.feedback.find((f) => f.version_id === v.parent_id && (f.kind === "request" || f.kind === "edit"));
  // `navigates`: the action redirects to the new version's page, so the top bar runs until it opens
  const run = (fn: () => Promise<unknown>, navigates = false) => {
    if (navigates) startTopLoader();
    start(async () => {
      setError("");
      try {
        await fn();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("NEXT_REDIRECT")) throw e;
        if (navigates) stopTopLoader();
        setError(msg);
      }
    });
  };
  const masterText = (t: string) =>
    t.replace(/\{(\w+)\}/g, (m, k) => {
      const d = p.master.facts.find((f) => f.key === k)?.display;
      return typeof d === "string" ? d : d?.en ?? d?.default ?? m;
    });
  const parentLines = new Map((p.parent?.record.lines ?? []).map((l) => [l.scene, l]));
  const ruleText = new Map(p.rules.map((r) => [r.id, r.text]));

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Player */}
      <div>
        <div className="sticky top-6">
          <div className="aspect-[9/16] overflow-hidden rounded-[22px] bg-ink shadow-card">
            {p.media.mp4 ? (
              <video src={p.media.mp4} poster={p.media.poster ?? undefined} controls playsInline className="size-full object-cover" />
            ) : (
              <div className="flex size-full flex-col justify-center gap-2 p-8 text-white">
                <div className="mb-2 text-[15px] font-semibold">{v.status_note || "Making this version…"}</div>
                {STAGES.map((s) => {
                  const idx = STAGES.indexOf(v.stage);
                  const me = STAGES.indexOf(s);
                  const done = idx > me;
                  const now = idx === me;
                  return (
                    <div key={s} className={`flex items-center gap-2 text-[13px] capitalize ${done ? "text-lime" : now ? "text-white" : "text-white/35"}`}>
                      {done ? <CheckCircle weight="fill" className="size-4" /> : now ? <CircleNotch className="size-4 animate-spin" /> : <span className="size-4 rounded-full border border-white/25" />}
                      {s}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {p.media.mp4 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={p.media.mp4} download className="inline-flex h-9 items-center gap-1.5 rounded-[11px] border border-line-2 bg-white px-3 text-[13px] font-semibold">
                <DownloadSimple className="size-4" /> MP4
              </a>
              {p.media.srt && (
                <a href={p.media.srt} download className="inline-flex h-9 items-center gap-1.5 rounded-[11px] border border-line-2 bg-white px-3 text-[13px] font-semibold">
                  <DownloadSimple className="size-4" /> Subtitles
                </a>
              )}
              <Link
                href={`/app/c/${p.campaignId}/v/${v.id}/report`}
                className="inline-flex h-9 items-center gap-1.5 rounded-[11px] border border-line-2 bg-white px-3 text-[13px] font-semibold"
              >
                <FileText className="size-4" /> Approval report
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Panel */}
      <div className="min-w-0">
        {(myRequest || rec.understood) && (
          <div className="mb-5 rounded-[18px] border border-violet/20 bg-violet-50 p-5">
            {myRequest && (
              <div className="mb-3 ml-auto w-fit max-w-[85%] rounded-[14px] bg-white px-3.5 py-2 text-[14px] shadow-soft">
                {myRequest.text || myRequest.chips.join(", ")}
                {myRequest.chips.length > 0 && myRequest.text && (
                  <span className="ml-1 text-fg-3">· {myRequest.chips.join(", ")}</span>
                )}
              </div>
            )}
            <div className="flex gap-2 text-[14px] leading-relaxed">
              <Sparkle weight="fill" className="mt-1 size-4 shrink-0 text-violet" />
              <div>
                <div className="text-[11.5px] font-semibold uppercase tracking-wide text-violet">How I understood it</div>
                {rec.understood ? rec.understood : <span className="text-shimmer font-medium">Thinking</span>}
                {rec.changes && rec.changes.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1 text-[13px] text-fg-2">
                    {rec.changes.map((ch) => (
                      <li key={ch.scene}>
                        <span className="font-mono text-[12px] text-fg-3">Scene {ch.scene.replace("s", "")}</span> — {ch.what}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {rec.learned_rule && (
          <div className="mb-5 flex items-center gap-3 rounded-[16px] bg-ink px-4 py-3 text-[13.5px] text-white">
            <Brain weight="fill" className="size-5 shrink-0 text-lime" />
            <span>
              Saved to brand memory: <span className="font-semibold">“{rec.learned_rule.text}”</span>{" "}
              <span className="text-white/60">· {rec.learned_rule.scope_label}</span>
            </span>
            <Link href="/app/memory" className="ml-auto shrink-0 text-lime underline-offset-2 hover:underline">
              View
            </Link>
          </div>
        )}

        {(rec.fact_requests ?? []).map((fr) => (
          <div key={fr.key + fr.form} className="mb-5 rounded-[16px] border border-warn/30 bg-warn-100 p-4 text-[13.5px]">
            <div className="flex items-center gap-1.5 font-semibold">
              <Lock weight="bold" className="size-4" /> Suggested change to a locked fact — only you can apply it
            </div>
            <p className="mt-1">
              {fr.label} ({fr.form === "spoken" ? "how it's said" : "how it's shown"} in {p.audience.label}): “{fr.current}” →{" "}
              <span className="font-semibold">“{fr.suggested}”</span>
            </p>
            {fr.why && <p className="mt-1 text-fg-2">{fr.why}</p>}
            <button
              disabled={pending}
              onClick={() => run(() => applyFactChange(v.id, fr.key, fr.form, fr.suggested), true)}
              className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-[11px] bg-ink px-3 text-[13px] font-semibold text-white"
            >
              Apply and make a new version <ArrowRight className="size-3.5" />
            </button>
          </div>
        ))}

        <div className="flex gap-1 border-b border-line">
          {(
            [
              ["script", "Script"],
              ["facts", `Facts check${blocking.length ? ` · ${blocking.length} ⚠` : ""}`],
              ["history", `History · ${p.history.length}`],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-[14px] font-semibold ${tab === k ? "border-ink text-ink" : "border-transparent text-fg-3 hover:text-fg"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "script" && (
          <div className="mt-4 flex flex-col gap-3">
            {rec.summary && <p className="text-[14px] text-fg-2">{rec.summary}</p>}
            {(rec.applied_rules ?? []).length > 0 && (
              <div className="flex items-center gap-2 rounded-[12px] bg-[#f3efff] px-3 py-2 text-[13px] font-semibold text-[#5b3fd1]">
                <Brain weight="fill" className="size-4" /> Applied {rec.applied_rules!.length} thing{rec.applied_rules!.length > 1 ? "s" : ""} we learned from you
                <span className="font-normal text-[#5b3fd1]/80">— {rec.applied_rules!.map((id) => ruleText.get(id)).filter(Boolean).join(" · ")}</span>
              </div>
            )}
            {(rec.lines ?? []).map((ln, i) => {
              const scene = p.master.scenes.find((s) => s.id === ln.scene);
              const before = parentLines.get(ln.scene);
              const changed = before && before.voice !== ln.voice;
              return (
                <div key={ln.scene} className={`rounded-[18px] border bg-white p-4 ${changed ? "border-violet/40" : "border-line"}`}>
                  <div className="flex items-center justify-between text-[12px] text-fg-3">
                    <span className="font-mono">
                      Scene {i + 1} · {scene ? `${scene.start.toFixed(1)}–${scene.end.toFixed(1)} s` : ""} {ln.fit && ln.fit !== "natural" ? `· ${ln.fit}` : ""}
                    </span>
                    {changed && <span className="rounded-full bg-violet-50 px-2 py-0.5 font-semibold text-violet">Changed in v{v.n}</span>}
                  </div>
                  <div className="mt-2 grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-fg-3">Master</div>
                      <p className="mt-1 text-[14px] text-fg-2">{scene ? masterText(scene.line.voice) : ""}</p>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-fg-3">{p.audience.label}</div>
                      {editing === ln.scene ? (
                        <div className="mt-1">
                          <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            rows={3}
                            className="w-full rounded-[12px] border border-violet/50 p-2.5 text-[15px] outline-none focus:ring-4 focus:ring-violet/15"
                          />
                          <p className="mt-1 text-[12px] text-fg-3">Type prices and offers as they are — we keep them locked and check them again.</p>
                          <div className="mt-2 flex gap-2">
                            <button
                              disabled={pending}
                              onClick={() => run(() => editLine(v.id, ln.scene, "voice", draft), true)}
                              className="h-8 rounded-[10px] bg-ink px-3 text-[12.5px] font-semibold text-white"
                            >
                              Save and re-voice
                            </button>
                            <button onClick={() => setEditing(null)} className="h-8 rounded-[10px] px-3 text-[12.5px] font-semibold text-fg-2">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {changed && <p className="mt-1 text-[13.5px] text-fg-3 line-through">{before?.voice_filled}</p>}
                          <p className="mt-1 text-[15.5px] font-medium leading-snug">{ln.voice_filled ?? ln.voice}</p>
                          {ln.meaning_filled && <p className="mt-1 text-[13px] italic text-fg-2">“{ln.meaning_filled}”</p>}
                          {ln.screen_filled && (
                            <p className="mt-2 text-[12.5px] text-fg-2">
                              On screen: <span className="font-medium text-fg">{ln.screen_filled}</span>
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {editing !== ln.scene && (
                    <div className="mt-3 flex items-start justify-between gap-3 border-t border-line pt-3">
                      {ln.why ? (
                        <p className="flex gap-1.5 text-[13px] text-fg-2">
                          <Sparkle weight="fill" className="mt-0.5 size-3.5 shrink-0 text-violet" /> {ln.why}
                        </p>
                      ) : (
                        <span />
                      )}
                      {!making && v.status !== "approved" && (
                        <button
                          onClick={() => {
                            setEditing(ln.scene);
                            setDraft(ln.voice_filled ?? ln.voice);
                          }}
                          className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-fg-2 hover:text-ink"
                        >
                          <PencilSimple className="size-3.5" /> Edit line
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {!rec.lines?.length && <p className="text-[14px] text-fg-2">The script appears here as soon as it&apos;s written.</p>}
          </div>
        )}

        {tab === "facts" && (
          <div className="mt-4 flex flex-col gap-3">
            <div className="overflow-hidden rounded-[18px] border border-line bg-white">
              <table className="w-full text-left text-[13.5px]">
                <thead className="bg-soft text-[11.5px] uppercase tracking-wide text-fg-3">
                  <tr>
                    <th className="px-4 py-2.5">Fact</th>
                    <th className="px-4 py-2.5">On screen</th>
                    <th className="px-4 py-2.5">In the voice</th>
                  </tr>
                </thead>
                <tbody>
                  {(rec.facts ?? []).map((f) => {
                    const bad = issues.some((i) => i.blocking && i.message.includes(f.label));
                    return (
                      <tr key={f.key} className="border-t border-line">
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5 font-medium">
                            {bad ? <XCircle weight="fill" className="size-4 text-bad" /> : <CheckCircle weight="fill" className="size-4 text-ok" />}
                            {f.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[12.5px]">{f.display}</td>
                        <td className="px-4 py-3">{f.spoken ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {issues.length ? (
              issues.map((i, k) => (
                <div
                  key={k}
                  className={`flex gap-2 rounded-[14px] p-3 text-[13.5px] ${i.blocking ? "bg-bad-100 text-bad" : "bg-warn-100 text-warn"}`}
                >
                  <Warning weight="fill" className="mt-0.5 size-4 shrink-0" />
                  <span>
                    <span className="font-semibold">Scene {i.scene.replace("s", "")}:</span> {i.message}{" "}
                    <span className="opacity-70">({i.by === "gemma" ? "AI check" : "code check"}{i.blocking ? ", blocks approval" : ""})</span>
                  </span>
                </div>
              ))
            ) : rec.facts?.length ? (
              <div className="flex items-center gap-2 rounded-[14px] bg-ok-100 p-3 text-[13.5px] text-ok">
                <CheckCircle weight="fill" className="size-4" /> Every fact is present and unchanged — on screen and in the voice.
              </div>
            ) : null}
          </div>
        )}

        {tab === "history" && (
          <div className="mt-4 flex flex-col gap-2">
            {[...p.history].reverse().map((h) => {
              const asked = p.feedback.filter((f) => f.version_id === h.id && f.kind !== "approve");
              return (
                <Link
                  key={h.id}
                  href={`/app/c/${p.campaignId}/v/${h.id}`}
                  className={`flex items-start gap-3 rounded-[14px] border bg-white p-3.5 text-[13.5px] ${h.id === v.id ? "border-ink" : "border-line hover:border-line-2"}`}
                >
                  <ClockCounterClockwise className="mt-0.5 size-4 text-fg-3" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">
                      v{h.n} <span className="font-normal capitalize text-fg-3">· {h.status.replace("_", " ")}</span>
                    </div>
                    {asked.map((f, i) => (
                      <div key={i} className="mt-0.5 text-fg-2">
                        {f.kind === "request" ? "You asked: " : f.kind === "edit" ? "You edited: " : "Fact changed: "}“{f.text || f.chips.join(", ")}”
                      </div>
                    ))}
                  </div>
                  <span className="text-[12px] text-fg-3">{new Date(h.created_at).toLocaleString()}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Actions */}
        {!making && v.status !== "approved" && v.status !== "failed" && (
          <div className="mt-6 rounded-[22px] border border-line bg-white p-5 shadow-card">
            <div className="flex items-center gap-2 text-[15px] font-semibold">
              <ChatCircleText weight="fill" className="size-5 text-violet" /> Request changes
            </div>
            <textarea
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              rows={2}
              placeholder="Say it in plain words — “too formal, talk like a friend from Kolkata”"
              className="mt-3 w-full rounded-[14px] border border-line-2 p-3 text-[15px] outline-none focus:border-violet focus:ring-4 focus:ring-violet/15"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CHIPS.map((c) => (
                <button
                  key={c}
                  onClick={() => setChips((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))}
                  className={`rounded-full border px-3 py-1 text-[12.5px] font-semibold ${chips.includes(c) ? "border-violet bg-violet-50 text-violet" : "border-line text-fg-2 hover:border-line-2"}`}
                >
                  {c}
                </button>
              ))}
            </div>
            {error && <p className="mt-3 rounded-[10px] bg-bad-100 px-3 py-2 text-[13px] text-bad">{error}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                disabled={pending || (!request.trim() && !chips.length)}
                onClick={() => run(() => requestChanges(v.id, request, chips), true)}
                className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-violet px-4 text-[14px] font-semibold text-white shadow-cta disabled:opacity-50"
              >
                {pending ? <CircleNotch className="size-4 animate-spin" /> : <Sparkle weight="fill" className="size-4" />} Make v{p.history.length + 1}
              </button>
              <button
                disabled={pending || blocking.length > 0}
                onClick={() => run(() => approve(v.id))}
                title={blocking.length ? "Fix the flagged facts first" : ""}
                className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-lime px-4 text-[14px] font-semibold text-ink shadow-[var(--shadow-lime)] disabled:opacity-50"
              >
                <SealCheck weight="fill" className="size-4" /> Approve
              </button>
              {blocking.length > 0 && <span className="text-[12.5px] text-bad">Approval is locked until the flagged facts are fixed.</span>}
            </div>
          </div>
        )}
        {v.status === "approved" && (
          <div className="mt-6 flex items-center gap-3 rounded-[22px] bg-ink p-5 text-white">
            <SealCheck weight="fill" className="size-6 text-lime" />
            <div className="text-[14.5px]">
              Approved {v.approved_at ? new Date(v.approved_at).toLocaleString() : ""}. Download the MP4 and subtitles, or the approval report.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
