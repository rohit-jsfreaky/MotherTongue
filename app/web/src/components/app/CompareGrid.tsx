"use client";

import { Pause, Play } from "@phosphor-icons/react";
import { useRef, useState } from "react";

export type CompareItem = { id: string; label: string; url: string | null; poster: string | null; lines: string[] };

/** Every version side by side; one button plays them all from the start, in sync (one voice audible at a time). */
export function CompareGrid({ items, scenes }: { items: CompareItem[]; scenes: string[] }) {
  const refs = useRef<(HTMLVideoElement | null)[]>([]);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const vids = refs.current.filter(Boolean) as HTMLVideoElement[];
    if (playing) {
      vids.forEach((v) => v.pause());
      setPlaying(false);
      return;
    }
    vids.forEach((v, i) => {
      v.currentTime = 0;
      v.muted = i !== 0;
    });
    Promise.all(vids.map((v) => v.play().catch(() => undefined))).then(() => setPlaying(true));
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <button onClick={toggle} className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-ink px-4 text-[14px] font-semibold text-white">
          {playing ? <Pause weight="fill" className="size-4" /> : <Play weight="fill" className="size-4" />}
          {playing ? "Pause all" : "Play all in sync"}
        </button>
        <span className="text-[13px] text-fg-2">Tap a video to hear that version.</span>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(150px, 1fr))` }}>
        {items.map((it, i) => (
          <div key={it.id} className="min-w-0">
            <div className="aspect-[9/16] overflow-hidden rounded-[18px] bg-ink">
              {it.url ? (
                <video
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  src={it.url}
                  poster={it.poster ?? undefined}
                  playsInline
                  controls
                  className="size-full object-cover"
                  onClick={(e) => {
                    refs.current.forEach((v) => v && (v.muted = v !== e.currentTarget));
                  }}
                />
              ) : (
                <div className="grid size-full place-items-center text-[13px] text-white/60">Being made…</div>
              )}
            </div>
            <div className="mt-2 text-[13px] font-semibold">{it.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 overflow-x-auto rounded-[18px] border border-line bg-white">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead className="bg-soft text-[11.5px] uppercase tracking-wide text-fg-3">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Scene</th>
              {items.map((it) => (
                <th key={it.id} className="px-4 py-2.5 font-semibold">
                  {it.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scenes.map((s, r) => (
              <tr key={s} className="border-t border-line align-top">
                <td className="px-4 py-3 font-mono text-[12px] text-fg-3">{r + 1}</td>
                {items.map((it) => (
                  <td key={it.id} className="px-4 py-3 leading-snug">
                    {it.lines[r] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
