"use client";

/* eslint-disable @next/next/no-img-element */
import { CaretDown, List, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Reveal } from "@/components/ui/Reveal";

/* Layout, classes and motion ported from the studiomode landing (HeroSection + Header landing variant). */

const NAV = [
  { href: "#how", label: "How it works", caret: true },
  { href: "#languages", label: "Languages" },
  { href: "#review", label: "Review" },
  { href: "#memory", label: "Brand memory" },
  { href: "#faq", label: "FAQ" },
];

const navTrigger =
  "inline-flex h-10 shrink-0 items-center gap-1 whitespace-nowrap px-2.5 xl:px-3 rounded-[10px] text-sm font-normal leading-5 transition-colors text-white/60 hover:bg-white/5 hover:text-white";

export function MarkWhite({ className = "w-7 h-7 sm:w-9 sm:h-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden>
      <path d="M7 19c0-4.4 3.2-8 7.3-8" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" fill="none" />
      <path d="M12 20.4c0-2.9 2.1-5.2 4.8-5.2" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" fill="none" opacity="0.75" />
      <circle cx="21" cy="19.6" r="2.3" fill="#d1fe17" />
    </svg>
  );
}

function Cursor({ flip = false, size = 24 }: { flip?: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size + 2}
      viewBox="0 0 32 35"
      fill="none"
      className="drop-shadow-md relative z-10"
      style={flip ? { transform: "scaleX(-1)", marginBottom: "-6px", marginRight: "-2px" } : { marginBottom: "-6px", marginLeft: "-2px" }}
    >
      <path
        d="M5.64844 6.43457C5.31173 5.03595 6.82465 3.92124 8.06055 4.65723L25.4756 15.0322C26.7145 15.7705 26.4494 17.6369 25.0537 18.001L17.207 20.0469L13.4697 26.8457C12.7542 28.1459 10.8132 27.8857 10.4658 26.4424L5.64844 6.43457Z"
        fill="black"
        stroke="white"
        strokeWidth="1.77"
      />
    </svg>
  );
}

export function LandingNav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="absolute inset-x-0 top-0 z-50 bg-transparent text-white">
      <div className="mx-auto flex h-16 max-w-[1512px] items-center gap-2 px-4 sm:px-6 lg:gap-3 lg:px-5">
        <div className="shrink-0">
          <Logo tone="light" />
        </div>
        <div className="hidden min-w-0 flex-1 items-center gap-0.5 lg:flex xl:gap-1">
          <span className="mx-1 hidden h-3 w-px bg-white/12 xl:inline-block" />
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className={navTrigger}>
              {n.label}
              {n.caret && <CaretDown className="size-3.5" />}
            </a>
          ))}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <a href="#pricing" className={`${navTrigger} relative hidden gap-1.5 rounded-[10px] bg-white/5 backdrop-blur-md sm:inline-flex`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M3 6.2 5.4 3h5.2L13 6.2 8 13 3 6.2Z" fill="#fff" />
              <path d="M3 6.2h10M5.4 3 8 13l2.6-10" stroke="#5b41f8" strokeOpacity=".35" strokeWidth=".8" />
            </svg>
            <span>Pricing</span>
            <span className="rounded-md bg-gradient-to-r from-[#f920d1] via-[#f31ba2] to-[#ed1572] px-1.5 py-0.5 text-[10px] leading-none text-white">
              FREE
            </span>
          </a>
          <Link href="/login" className="hidden h-10 items-center rounded-xl border border-[#d1fe17]/10 bg-[#d1fe17]/5 px-4 text-sm font-normal leading-5 text-[#d1fe17] sm:inline-flex">
            Login
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center rounded-xl bg-[#d1fe17] px-4 text-sm font-medium leading-5 text-[#14151a] shadow-[0_2px_0_rgba(255,255,255,0.72)] transition hover:brightness-105 sm:px-5"
          >
            Sign up
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white lg:hidden"
          >
            {open ? <X className="size-5" /> : <List className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="mx-4 mt-1 flex flex-col gap-1 rounded-2xl bg-[#14151a]/95 p-3 backdrop-blur-md lg:hidden">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-[15px] text-white/80 hover:bg-white/5">
              {n.label}
            </a>
          ))}
          <Link href="/login" className="rounded-lg px-3 py-2.5 text-[15px] text-[#d1fe17]">
            Login
          </Link>
        </div>
      )}
    </nav>
  );
}

function HeroMouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let mx = 50,
      my = 32,
      tx = 50,
      ty = 32,
      rafId = 0;
    const start = performance.now();
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      tx = ((e.clientX - rect.left) / rect.width) * 100;
      ty = ((e.clientY - rect.top) / rect.height) * 100;
    };
    const tick = () => {
      mx += (tx - mx) * 0.07;
      my += (ty - my) * 0.07;
      const t = (performance.now() - start) / 1000;
      el.style.setProperty("--mx", `${mx + Math.sin(t * 0.35) * 1.5}%`);
      el.style.setProperty("--my", `${my + Math.cos(t * 0.45) * 1}%`);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);
  return <div ref={glowRef} aria-hidden className="hero-mouse-glow absolute inset-0 pointer-events-none hidden md:block" style={{ zIndex: 2 }} />;
}

function Clip({ id, className }: { id: string; className: string }) {
  return <video src={`/samples/${id}.mp4`} poster={`/samples/${id}.jpg`} autoPlay loop muted playsInline className={className} />;
}

export function HeroCta({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/try"
      className={`cta-hero-interaction cta-hero-surface group relative inline-flex items-center justify-center h-12 sm:h-16 pl-[54px] sm:pl-[76px] pr-3 sm:pr-6 rounded-[10px] bg-black border border-white/10 overflow-hidden hover:border-[#9356F9]/30 shadow-[0_8px_32px_rgba(91,65,248,0.35)] hover:shadow-[0_8px_40px_rgba(147,86,249,0.4)] active:scale-[0.98] animate-cta-slide-in transition-[padding,background-color,border-color,box-shadow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:pl-3 hover:sm:pl-6 hover:pr-[54px] hover:sm:pr-[76px] ${className}`}
    >
      <span
        className="absolute inset-0 -translate-x-full animate-cta-shimmer pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(147,86,249,0.1) 48%, rgba(255,255,255,0.08) 50%, rgba(91,65,248,0.1) 52%, transparent 100%)",
        }}
      />
      <div aria-hidden className="cta-logo-track pointer-events-none absolute left-1.5 right-1.5 top-1.5 bottom-1.5 z-[1]">
        <div className="cta-logo-slide h-full">
          <div className="cta-logo-glow rounded-md" style={{ background: "linear-gradient(136deg, #9356F9 0%, #5B41F8 55%, #A855F7 100%)" }} />
        </div>
      </div>
      <div aria-hidden className="cta-logo-track pointer-events-none absolute left-1.5 right-1.5 top-1.5 bottom-1.5 z-10">
        <div className="cta-logo-slide h-full">
          <div
            className="cta-logo-pill absolute left-0 top-0 bottom-0 w-[42px] sm:w-[58px] rounded-md flex items-center justify-center shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset]"
            style={{
              backgroundImage: "linear-gradient(136deg, #9356F9 0%, #5B41F8 45%, #7C3AED 72%, #C026D3 100%)",
              backgroundSize: "240% 240%",
            }}
          >
            <MarkWhite className="cta-hero-logo-icon w-7 h-7 sm:w-9 sm:h-9" />
          </div>
        </div>
      </div>
      <span className="cta-hero-text-stack">
        <span className="cta-hero-text-out block font-sans text-white text-[11px] sm:text-[15px] font-medium tracking-[0.06em] uppercase whitespace-nowrap">
          Try it with a sample ad — free
        </span>
        <span className="cta-hero-text-in font-sans text-[11px] sm:text-[15px] font-semibold tracking-[0.1em] uppercase whitespace-nowrap">
          Start now
        </span>
      </span>
    </Link>
  );
}

export function HeroSection({ after }: { after: React.ReactNode }) {
  return (
    <section
      className="relative min-h-[100svh] flex flex-col overflow-hidden pt-16"
      style={{ background: "url('/brand/hero-bg.jpeg') lightgray center/cover no-repeat" }}
    >
      <LandingNav />
      <HeroMouseGlow />

      {/* Top-right: the Milan version in a selection frame */}
      <Reveal direction="left" delay={400} className="absolute top-20 right-4 lg:right-8 xl:right-16 hidden md:block z-20">
        <div className="animate-float relative">
          <span className="absolute -left-[118px] top-1 z-10 rounded-full bg-white px-3.5 py-2 text-[13px] font-medium text-black shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
            Milan version
          </span>
          <div className="relative rotate-[8deg] rounded-[6px] border border-[#5b41f8] p-2">
            {["-left-1.5 -top-1.5", "-right-1.5 -top-1.5", "-left-1.5 -bottom-1.5", "-right-1.5 -bottom-1.5"].map((p) => (
              <span key={p} className={`absolute ${p} size-3 rounded-full bg-white`} />
            ))}
            <Clip id="stride-it" className="w-[120px] lg:w-[140px] xl:w-[150px] aspect-[9/16] rounded-[14px] object-cover drop-shadow-2xl" />
          </div>
        </div>
      </Reveal>
      <Reveal direction="left" delay={550} className="absolute hidden lg:block z-20 pointer-events-none" style={{ top: "332px", right: "80px" }}>
        <img src="/brand/squiggle.svg" alt="" style={{ width: "70px", height: "50px", transform: "rotate(-219.5deg)" }} />
      </Reveal>

      {/* Right: same price, every version */}
      <Reveal direction="left" delay={700} className="absolute hidden lg:block z-20" style={{ top: "440px", right: "-60px" }}>
        <div className="animate-float relative" style={{ animationDelay: "0.8s" }}>
          <div className="w-[270px] xl:w-[300px] rounded-[32px] p-5 backdrop-blur-sm" style={{ background: "rgba(255, 255, 255, 0.2)" }}>
            <p className="text-white text-xs font-medium mb-3 px-1">Same price, every version</p>
            <div className="w-full h-px bg-white/30 mb-4" />
            <div className="flex gap-3">
              <Clip id="chai-hi" className="w-[101px] xl:w-[112px] h-[144px] xl:h-[158px] rounded-[18px] object-cover" />
              <Clip id="chai-it" className="w-[86px] xl:w-[97px] h-[144px] xl:h-[158px] rounded-[18px] object-cover" />
            </div>
          </div>
          <div className="absolute bottom-0 -left-[106px] z-40">
            <div className="flex justify-end relative left-3">
              <Cursor flip size={22} />
            </div>
            <div
              className="bg-[#DDFE43] text-black text-xs font-semibold px-[14px] py-[9px] whitespace-nowrap leading-tight text-center"
              style={{
                border: "1.17px solid #C6F000",
                boxShadow: "0px 4.69px 9.37px rgba(255, 205, 41, 0.25)",
                borderRadius: "18.75px 1.17px 14.06px 18.75px",
              }}
            >
              Price and offer
              <br />
              locked
            </div>
          </div>
        </div>
      </Reveal>

      {/* Left: the Kolkata version */}
      <Reveal direction="right" delay={600} className="absolute hidden md:block z-20" style={{ top: "440px", left: "20px" }}>
        <div className="animate-float relative" style={{ animationDelay: "1.2s" }}>
          <div className="w-[250px] rounded-[32px] p-5 backdrop-blur-sm" style={{ background: "rgba(255, 255, 255, 0.2)" }}>
            <p className="text-white text-sm font-medium">Kolkata version</p>
            <div className="w-full h-px bg-white/30 mt-3 mb-4" />
            <div className="w-full h-52 rounded-[24px] overflow-hidden bg-white/10">
              <Clip id="chai-bn" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="absolute bottom-12 -right-[90px] z-40">
            <div className="flex justify-start relative right-4">
              <Cursor />
            </div>
            <div
              className="bg-[#F24822] text-white text-xs font-semibold px-[14px] py-[9px] whitespace-nowrap"
              style={{
                border: "1.18px solid #C23A1B",
                boxShadow: "0px 4.72px 9.43px rgba(242, 72, 34, 0.25)",
                borderRadius: "1.18px 18.86px 18.86px 14.15px",
              }}
            >
              Bengali voice
            </div>
          </div>
        </div>
      </Reveal>

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 text-center pt-12 sm:pt-20 pb-10 sm:pb-16 max-w-[1240px] mx-auto w-full">
        <Reveal
          as="h1"
          direction="up"
          delay={50}
          className="font-sans text-white font-medium leading-[1.04] tracking-[-0.035em] mb-4 sm:mb-6 max-w-[1240px]"
          style={{ fontSize: "clamp(30px, 7.4vw, 104px)" }}
        >
          <span className="block lg:whitespace-nowrap">One ad. Every audience,</span>
          <span className="block">in their own words</span>
        </Reveal>
        <Reveal as="p" direction="up" delay={200} className="text-white/85 text-sm sm:text-lg lg:text-lg font-normal leading-relaxed mb-7 sm:mb-10 px-2">
          <span className="hidden sm:inline">
            Upload your ad once — get a version for every city and language you sell in, with your price unchanged.
          </span>
          <span className="sm:hidden">One ad in. A version for every city you sell in — your price unchanged.</span>
        </Reveal>

        <Reveal direction="up" delay={350} className="mb-5 sm:mb-6 max-w-full">
          <HeroCta />
        </Reveal>

        <Reveal direction="up" delay={500} className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2 text-white/90 text-[11px] sm:text-[13px] font-medium px-2">
          <span className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 20 23" fill="none" className="shrink-0">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M1.875 11.5C1.875 7.0125 5.5125 3.375 10 3.375C14.4875 3.375 18.125 7.0125 18.125 11.5C18.125 15.9875 14.4875 19.625 10 19.625C5.5125 19.625 1.875 15.9875 1.875 11.5ZM13.0083 9.98833C13.1444 9.80697 13.1716 9.56611 13.0794 9.35896C12.9872 9.15181 12.79 9.01087 12.5641 8.99066C12.3383 8.97046 12.1192 9.07417 11.9917 9.26167L9.295 13.0367L7.94167 11.6833C7.69541 11.4539 7.31166 11.4606 7.07365 11.6986C6.83564 11.9367 6.82887 12.3204 7.05833 12.5667L8.93333 14.4417C9.06319 14.5714 9.24352 14.6375 9.42647 14.6224C9.60942 14.6074 9.77649 14.5126 9.88333 14.3633L13.0083 9.98833Z"
                fill="white"
              />
            </svg>
            No credit card required
          </span>
          <span className="text-white/30 hidden sm:inline">·</span>
          <span className="hidden sm:inline">Free to start — 3 versions on your own ad.</span>
          <span className="text-white/30">·</span>
          <span>Bengali, Hindi, Italian &amp; English voices</span>
        </Reveal>
      </div>

      <div className="w-full overflow-hidden pt-20 pb-12 sm:pt-40 sm:pb-24 relative z-10">
        <div className="flex whitespace-nowrap animate-marquee will-change-transform">
          {Array.from({ length: 2 }).map((_, copy) => (
            <div key={copy} className="flex items-center shrink-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <span
                  key={i}
                  className="font-sans text-[#131517] text-[28px] sm:text-[55px] lg:text-[65px] font-medium uppercase tracking-tight px-4 sm:px-6 flex items-center gap-6 sm:gap-12"
                >
                  Brands, shops, agencies and creators who sell in more than one language
                  <span className="text-[#131517]/20">•</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {after}
    </section>
  );
}
