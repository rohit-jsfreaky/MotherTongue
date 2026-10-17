import { CaretDown, CheckCircle, Lightning } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { AdTile } from "./AdTile";
import { byId } from "./samples";

const NAV = [
  { href: "#how", label: "How it works", caret: true },
  { href: "#languages", label: "Languages", caret: false },
  { href: "#review", label: "Review", caret: false },
  { href: "#memory", label: "Brand memory", caret: false },
  { href: "#faq", label: "FAQ", caret: false },
];

function Nav() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <nav className="mx-auto flex h-16 max-w-[1440px] items-center gap-10 px-5 sm:px-8">
        <Logo tone="light" />
        <ul className="hidden items-center gap-7 lg:flex">
          {NAV.map((n) => (
            <li key={n.href}>
              <a href={n.href} className="flex items-center gap-1 text-[15px] text-white/85 transition-colors hover:text-white">
                {n.label}
                {n.caret && <CaretDown className="size-3" />}
              </a>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-2">
          <a
            href="#pricing"
            className="hidden h-10 items-center gap-2 rounded-[12px] border border-white/10 bg-white/5 px-3 text-[14px] text-white/90 sm:flex"
          >
            <Lightning weight="fill" className="size-3.5 text-lime" /> Pricing
            <span className="rounded-full bg-[#ff3ea5] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
              FREE TO START
            </span>
          </a>
          <ButtonLink href="/login" variant="ghostLime" className="hidden sm:inline-flex">
            Login
          </ButtonLink>
          <ButtonLink href="/signup" variant="lime">
            Sign up
          </ButtonLink>
        </div>
      </nav>
    </header>
  );
}

function MeshBackground() {
  return (
    <div aria-hidden className="grain absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#3d2fd6_0%,#5a45f5_38%,#7a57f7_62%,#f9fafb_100%)]" />
      <div className="absolute -left-[10%] top-[30%] h-[70%] w-[60%] rounded-full bg-[#c64fd6] opacity-70 blur-[120px] animate-[mesh-drift-1_18s_ease-in-out_infinite]" />
      <div className="absolute -right-[12%] top-[34%] h-[70%] w-[60%] rounded-full bg-[#e3609b] opacity-55 blur-[120px] animate-[mesh-drift-2_22s_ease-in-out_infinite]" />
      <div className="absolute left-[22%] top-[62%] h-[55%] w-[56%] rounded-full bg-[#ff9d5c] opacity-70 blur-[110px] animate-[mesh-drift-3_16s_ease-in-out_infinite]" />
      <div className="absolute left-[25%] -top-[20%] h-[60%] w-[50%] rounded-full bg-[#2f22c4] opacity-60 blur-[120px]" />
      <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_49.08%_31.34%,rgba(255,200,150,0.28)_0px,rgba(200,150,255,0.2)_28%,rgba(120,100,240,0.1)_55%,transparent_85%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-b from-transparent to-page" />
    </div>
  );
}

function Cursor({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`size-5 drop-shadow ${className}`} aria-hidden>
      <path d="M4 3l16 7-7 2-2 7z" fill="#05050a" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function Squiggle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 90" className={className} aria-hidden fill="none">
      <path
        d="M20 2c10 6 12 14 4 20s-12 12-2 18 12 14 2 20-10 14 0 22"
        stroke="#d1fe17"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M14 76l7 9 6-10" stroke="#d1fe17" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GlassCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[28px] border border-white/25 bg-white/15 p-5 shadow-float backdrop-blur-md ${className}`}>
      <div className="mb-3 border-b border-white/25 pb-3 text-[14px] font-semibold text-white">{title}</div>
      {children}
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pb-40 pt-16 lg:min-h-[900px] lg:pb-0">
      <MeshBackground />
      <Nav />

      <div className="relative z-10 mx-auto flex max-w-[1440px] flex-col items-center px-6 pt-20 text-center sm:pt-24">
        <h1 className="max-w-[1100px] animate-hero-up text-[48px] font-medium leading-[1.04] tracking-[-0.035em] text-white sm:text-[76px] xl:text-[104px]">
          One ad. Every audience,
          <br className="hidden sm:block" /> in their own words
        </h1>
        <p
          className="mt-7 max-w-[880px] animate-hero-up text-[16px] font-medium text-white/90 sm:text-[18px]"
          style={{ animationDelay: "120ms" }}
        >
          Upload your ad once. Get a version for every city and language you sell in — its own words, its own voice —
          with your price and offer exactly as you set them.
        </p>

        <Link
          href="/try"
          className="group relative mt-12 inline-flex h-16 animate-cta-in items-center overflow-hidden rounded-[10px] border border-white/10 bg-black pl-[76px] pr-7 text-[14px] tracking-wide sm:text-[16px] text-white shadow-cta transition-transform hover:scale-[1.02]"
          style={{ animationDelay: "250ms" }}
        >
          <span className="absolute left-2 top-2 grid size-12 place-items-center rounded-[8px] bg-violet">
            <LogoMark className="size-8" />
          </span>
          TRY WITH A SAMPLE AD — FREE
          <span className="pointer-events-none absolute inset-0 -translate-x-full animate-cta-shimmer bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </Link>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12.5px] font-medium text-white/90">
          <span className="flex items-center gap-1.5">
            <CheckCircle weight="fill" className="size-3.5" /> No credit card required
          </span>
          <span className="hidden opacity-50 sm:inline">·</span>
          <span>Free to start — 3 versions on your own ad</span>
          <span className="hidden opacity-50 sm:inline">·</span>
          <span>Bengali, Hindi, Italian and English voices</span>
        </div>
      </div>

      {/* Floating cards — float 3s ease-in-out, as in the reference */}
      <div className="pointer-events-none absolute inset-0 z-10 mx-auto hidden max-w-[1440px] lg:block">
        <div className="absolute left-5 top-[430px] animate-float">
          <GlassCard title="Kolkata version" className="w-[250px]">
            <AdTile s={byId("chai-bn")} className="w-full !aspect-[4/5]" progress />
          </GlassCard>
          <div className="absolute -right-24 top-[200px] flex items-start gap-1">
            <Cursor className="-mt-3" />
            <span className="rounded-full bg-tag-red px-3 py-1.5 text-[12px] font-semibold text-white shadow-soft">
              Bengali voice
            </span>
          </div>
        </div>

        <div className="absolute right-0 top-[430px] animate-float" style={{ animationDelay: "1.2s" }}>
          <GlassCard title="Same price, every version" className="w-[290px] rounded-r-none border-r-0">
            <div className="flex gap-3">
              <AdTile s={byId("chai-hi")} className="w-[112px] !aspect-[3/4]" showLabel={false} compact />
              <AdTile s={byId("chai-it")} className="w-[112px] !aspect-[3/4]" showLabel={false} compact />
            </div>
          </GlassCard>
          <div className="absolute -left-28 top-[195px] flex items-end gap-1">
            <span className="rounded-[10px] bg-lime px-3 py-1.5 text-[12px] font-semibold leading-tight text-ink shadow-soft">
              Price and offer
              <br />
              locked
            </span>
            <Cursor className="-mb-3 -scale-x-100" />
          </div>
        </div>

        <div className="absolute right-[34px] top-[96px] animate-float xl:right-[24px]" style={{ animationDelay: "0.6s" }}>
          <span className="absolute -left-36 -top-1 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-ink shadow-soft">
            Milan version
          </span>
          <div className="relative rotate-[8deg] rounded-[6px] border border-violet/70 p-2">
            {["-left-1 -top-1", "-right-1 -top-1", "-left-1 -bottom-1", "-right-1 -bottom-1"].map((p) => (
              <span key={p} className={`absolute ${p} size-2 rounded-full bg-white`} />
            ))}
            <AdTile s={byId("stride-it")} className="w-[100px]" showLabel={false} compact />
          </div>
          <Squiggle className="absolute -bottom-32 left-6 h-24 w-10" />
        </div>
      </div>
    </section>
  );
}
