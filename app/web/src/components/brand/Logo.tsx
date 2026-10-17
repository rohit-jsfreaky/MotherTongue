import Link from "next/link";

/** MotherTongue mark: a violet tile with one shape speaking in three voices. */
export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
      <rect width="28" height="28" rx="8" fill="#5b41f8" />
      <path d="M8 18c0-3.6 2.6-6.5 6-6.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M12.3 19.3c0-2.4 1.7-4.2 3.9-4.2" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.75" />
      <circle cx="19.6" cy="18.6" r="1.9" fill="#d1fe17" />
    </svg>
  );
}

export function Logo({ tone = "dark", href = "/" }: { tone?: "dark" | "light"; href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2" aria-label="MotherTongue home">
      <LogoMark />
      <span className={`text-[19px] font-semibold tracking-[-0.03em] ${tone === "light" ? "text-white" : "text-ink"}`}>
        mothertongue
      </span>
    </Link>
  );
}
