import { Coffee, Drop, SneakerMove, SpeakerHigh } from "@phosphor-icons/react/ssr";
import { BRANDS, type Sample } from "./samples";

const ICONS = { chai: Coffee, stride: SneakerMove, mitti: Drop } as const;

/**
 * A 9:16 ad version. With `src` it plays the real rendered version; without it, it draws the version's real
 * on-screen text on the sample brand's colours (never a fake photo).
 */
export function AdTile({
  s,
  src,
  poster,
  className = "",
  showLabel = true,
  progress = false,
  compact = false,
}: {
  s: Sample;
  src?: string;
  poster?: string;
  className?: string;
  showLabel?: boolean;
  progress?: boolean;
  /** Small tiles: headline + price only, so nothing overlaps. */
  compact?: boolean;
}) {
  const b = BRANDS[s.brand];
  const Icon = ICONS[s.brand];
  // Every sample has a real rendered version in /public/samples (made on AMD by the worker); drawn card is the fallback.
  const video = src ?? `/samples/${s.id}.mp4`;
  const still = poster ?? `/samples/${s.id}.jpg`;
  return (
    <div
      className={`relative aspect-[9/16] shrink-0 overflow-hidden rounded-[18px] ${className}`}
      style={{ background: b.bg, color: b.fg }}
    >
      {video ? (
        <video src={video} poster={still} className="absolute inset-0 size-full object-cover" autoPlay muted loop playsInline preload="metadata" />
      ) : (
        <>
          <div className="absolute inset-x-0 top-[30%] flex justify-center opacity-80">
            <Icon weight="duotone" className="size-[34%]" style={{ color: b.card }} />
          </div>
          <div className="absolute inset-x-[8%] top-[11%] text-center text-[clamp(11px,1.15vw,17px)] font-semibold leading-tight">
            {s.headline}
          </div>
          <div className={`absolute inset-x-[7%] flex justify-center ${compact ? "bottom-[9%]" : "bottom-[24%]"}`}>
            <span
              className="rounded-[8px] px-2 py-1 text-center text-[clamp(9px,0.85vw,12px)] font-semibold leading-tight"
              style={{ background: b.card, color: b.cardFg }}
            >
              {compact ? s.price : `${s.price} · ${s.offer}`}
            </span>
          </div>
          {!compact && (
            <div className="absolute inset-x-[7%] bottom-[8%] rounded-[8px] bg-black/35 px-1.5 py-1 text-center text-[clamp(8px,0.75vw,11px)] font-medium leading-snug text-white">
              {s.caption}
            </div>
          )}
        </>
      )}
      {showLabel && (
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
          <SpeakerHigh weight="fill" className="size-2.5" />
          {s.city} · {s.script}
        </div>
      )}
      {progress && (
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/25">
          <div className="h-full origin-left animate-[ad-progress_15s_linear_infinite] bg-white/90" />
        </div>
      )}
    </div>
  );
}
