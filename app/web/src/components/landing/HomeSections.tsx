"use client";

/* eslint-disable @next/next/no-img-element */
import { Brain, Buildings, ChatCircleText, DownloadSimple, GithubLogo, Lock, Microphone, PenNib, ShieldCheck, SquaresFour, Storefront, UsersThree } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Reveal } from "@/components/ui/Reveal";
import { MarkWhite } from "./HomeHero";
import { BRANDS, SAMPLES, byId } from "./samples";

/* Sections ported from the studiomode landing (same structure, classes and motion); MotherTongue content only. */

function Clip({ id, className }: { id: string; className: string }) {
  return <video src={`/samples/${id}.mp4`} poster={`/samples/${id}.jpg`} autoPlay loop muted playsInline className={className} />;
}

/* ── Product cards (inside the hero, under the marquee) ─────────────────────────────────────────────────────────── */
const CARDS = [
  { tag: "Script", icon: PenNib, title: "Written for each city", desc: "Its own words, tone and local touch — never a word-for-word translation." },
  { tag: "Voice", icon: Microphone, title: "One steady brand voice", desc: "A natural voice in every language, the same in every version." },
  { tag: null, icon: ShieldCheck, title: "Facts locked and checked", desc: "Price, offer and dates verified on screen and in the voice." },
];

export function ProductCardsRow() {
  return (
    <div className="w-full px-4 sm:px-6 pb-16 sm:pb-32 relative z-10" id="how">
      <div className="flex flex-col lg:flex-row items-start gap-3 sm:gap-4 max-w-[1480px] mx-auto">
        <Reveal direction="up" delay={100} className="relative w-full flex-shrink-0 lg:w-[420px] rounded-[16px] overflow-hidden shadow-2xl">
          <Link href="/try" className="relative flex flex-col justify-end p-5 sm:p-6 h-[161px]">
            <div className="absolute inset-0">
              <img src="/brand/studio-card-bg.png" alt="" className="w-full h-full object-cover rounded-[16px]" />
            </div>
            <div className="relative z-10 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-display text-[15px] sm:text-[17px] font-bold uppercase tracking-tight">MotherTongue studio</h3>
                <span className="bg-[#4FCEE4] text-[#131517] text-[8px] font-bold px-1.5 py-[2px] rounded-[3px] uppercase font-sans tracking-wider italic">NEW</span>
              </div>
              <p className="text-white/70 text-[11px] leading-[1.3] lg:whitespace-nowrap">Upload one ad, pick your audiences, review every version side by side.</p>
              <span className="w-fit flex items-center gap-1.5 h-8 px-4 rounded-lg bg-[#DDFE43] text-[#131517] text-[12px] font-semibold mt-1 hover:bg-[#c8f010] transition-colors">
                Try now
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M12.1667 10.1663V3.83301M12.1667 3.83301H5.83333M12.1667 3.83301L4 11.9997" stroke="#131517" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </Link>
        </Reveal>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {CARDS.map(({ tag, icon: Icon, title, desc }, i) => (
            <Reveal key={title} direction="up" delay={200 + i * 100} className="rounded-[16px] bg-[#1C1E20] border border-white/5 hover:border-white/15 transition-colors shadow-2xl">
              <Link href="/try" className="relative flex flex-col justify-between p-4 sm:p-5 h-[134px]">
                {tag && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-white/5 backdrop-blur-sm px-2 py-1 rounded-full">
                    <span className="size-1.5 rounded-full bg-[#d1fe17]" />
                    <span className="text-white/80 text-[10px] font-medium uppercase tracking-wide">{tag}</span>
                  </span>
                )}
                <span className="grid w-7 h-7 place-items-center rounded bg-[linear-gradient(136deg,#9356F9_0%,#5B41F8_55%,#A855F7_100%)] shadow-[0_3px_2px_rgba(0,0,0,0.15)]">
                  <Icon weight="bold" className="size-4 text-white" />
                </span>
                <div className="flex flex-col justify-center items-start py-[6px]">
                  <p className="text-white text-[13px] font-bold leading-5 tracking-tight">{title}</p>
                  <p className="text-[#898A8B] text-[11px] leading-[1.4] mt-0.5">{desc}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Video slider (HomeSlidesSection) ───────────────────────────────────────────────────────────────────────────── */
function VideoSlide({ id }: { id: string }) {
  const s = byId(id);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={wrapperRef} className="relative flex-shrink-0 w-[160px] sm:w-[200px] md:w-[240px] lg:w-[270px] aspect-[9/16] rounded-[16px] sm:rounded-[20px] overflow-hidden bg-[#16171e] select-none">
      <span
        className="absolute z-20 flex items-center text-white text-[10px] font-bold font-display uppercase tracking-wider whitespace-nowrap pointer-events-none"
        style={{
          top: "8px",
          left: "8px",
          height: "18.4px",
          padding: "0 6px",
          background: "radial-gradient(39.71% 136.54% at 51.64% 117.31%, #9356F9 0%, #5B41F8 100%)",
          borderRadius: "4px",
          transform: "matrix(1, 0, -0.21, 0.98, 0, 0)",
        }}
      >
        {s.city} · {s.script}
      </span>
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#16171e] pointer-events-none">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-skeleton-shimmer" />
          </div>
          <div className="relative h-8 w-8 rounded-full border-2 border-white/15 border-t-white/70 animate-spin" />
        </div>
      )}
      {shouldLoad && (
        <video
          src={`/samples/${id}.mp4`}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onLoadedData={() => setIsLoaded(true)}
          className={`w-full h-full object-cover pointer-events-none select-none transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}

export function HomeSlidesSection() {
  const ids = SAMPLES.map((s) => s.id);
  return (
    <Reveal as="section" direction="fade" className="bg-white py-6 sm:py-10 overflow-hidden">
      <div className="flex gap-3 sm:gap-4 animate-scroll-x will-change-transform w-max">
        {[...ids, ...ids].map((id, i) => (
          <VideoSlide key={i} id={id} />
        ))}
      </div>
    </Reveal>
  );
}

/* ── Language wall (LogoSection) — city names in their own script; we show no client logos we don't have ──────── */
const ROW1 = [["কলকাতা", "font-semibold"], ["लखनऊ", "font-bold"], ["Milano", "font-medium italic"], ["London", "font-semibold tracking-[-0.04em]"], ["ঢাকা", "font-medium"], ["दिल्ली", "font-semibold"], ["ROMA", "font-bold tracking-[0.08em]"]];
const ROW2 = [["New York", "font-medium"], ["হাওড়া", "font-bold"], ["जयपुर", "font-medium"], ["Torino", "font-semibold italic"], ["Manchester", "font-bold tracking-[-0.03em]"], ["শিলিগুড়ি", "font-medium"], ["वाराणसी", "font-semibold"]];

export function LogoSection() {
  return (
    <section id="languages" className="bg-white py-10 sm:py-14 lg:py-16 px-4">
      <div className="max-w-[1260px] mx-auto text-center">
        <Reveal as="h2" direction="up" className="font-sans text-[28px] sm:text-5xl lg:text-[64px] font-medium text-black leading-tight tracking-[-0.02em] mb-2 sm:mb-3">
          Built for brands that sell in more than one language
        </Reveal>
        <Reveal as="p" direction="up" delay={100} className="text-black text-sm sm:text-lg lg:text-xl font-medium mb-8 sm:mb-10">
          Bengali, Hindi, Italian and English today — every voice tested properly
        </Reveal>
        {[ROW1, ROW2].map((row, r) => (
          <div key={r} className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 items-center gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6 mb-4 sm:mb-6">
            {row.map(([name, cls], i) => (
              <Reveal key={name} direction="up" delay={50 * i} className="flex items-center justify-center h-12 sm:h-16 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition duration-300">
                <span className={`text-[20px] sm:text-[26px] text-black ${cls}`}>{name}</span>
              </Reveal>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Canvas banner ─────────────────────────────────────────────────────────────────────────────────────────────── */
export function CanvasSection() {
  return (
    <section className="bg-white px-4 pb-12 sm:pb-16 pt-4">
      <div className="max-w-[1480px] mx-auto">
        <Reveal
          direction="scale"
          className="relative rounded-3xl overflow-hidden min-h-[280px] sm:min-h-[320px] border border-[#D6D6D6]"
          style={{
            background: "linear-gradient(135deg, #2A1A3F 0%, #4B2C7A 30%, #7B4DDC 55%, #D1FE17 100%), url('/brand/canvas-bg.png') center/cover no-repeat",
            backgroundBlendMode: "overlay",
          }}
        >
          <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col lg:flex-row justify-between items-start gap-6 sm:gap-8">
            <div className="flex-1 max-w-xl">
              <Reveal as="h2" direction="up" delay={150} className="font-display text-white text-2xl sm:text-4xl lg:text-5xl font-bold uppercase leading-tight tracking-[-0.035em] mb-3">
                One ad.
                <br />
                <span className="sm:whitespace-nowrap">Every audience.</span>
              </Reveal>
              <Reveal as="p" direction="up" delay={250} className="text-white/70 text-sm font-medium leading-5 mb-5 sm:mb-6 max-w-sm">
                Make a version for every city you sell in, review them side by side, and download the ones you approve.
              </Reveal>
              <Reveal direction="up" delay={350}>
                <Link href="/try" className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.18)] text-[#131517] text-sm font-semibold hover:bg-gray-50 active:scale-95 transition">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M9.1911 14.5008C9.22327 14.7849 9.4635 14.9997 9.7494 15C10.0354 15.0003 10.276 14.786 10.3088 14.5019C10.5218 12.6548 11.0741 11.356 11.965 10.465C12.856 9.57412 14.1548 9.02182 16.0019 8.80882C16.286 8.77605 16.5003 8.53537 16.5 8.2494C16.4997 7.9635 16.2849 7.72327 16.0008 7.6911C14.1842 7.4853 12.8578 6.9333 11.9457 6.03765C11.037 5.14545 10.4732 3.8469 10.3103 2.0127C10.2845 1.72223 10.041 1.4997 9.7494 1.5C9.45772 1.5003 9.21472 1.72342 9.1896 2.01398C9.03345 3.81795 8.4702 5.14388 7.557 6.057C6.64388 6.9702 5.31795 7.53345 3.51398 7.6896C3.22342 7.71472 3.0003 7.95772 3 8.2494C2.9997 8.541 3.22223 8.78452 3.5127 8.81032C5.3469 8.97322 6.64545 9.537 7.53765 10.4457C8.4333 11.3578 8.9853 12.6842 9.1911 14.5008Z"
                      fill="#131517"
                    />
                  </svg>
                  Try now
                </Link>
              </Reveal>
            </div>
            <Reveal direction="left" delay={250} className="relative w-full lg:w-auto flex-shrink-0 mt-4 lg:mt-0 max-w-full">
              <div className="flex h-[200px] sm:h-[260px] lg:h-[270px] w-full lg:w-[480px] gap-2 overflow-hidden rounded-2xl bg-black/30 p-2">
                {["chai-bn", "chai-hi", "chai-it"].map((id) => (
                  <Clip key={id} id={id} className="h-full min-w-0 flex-1 rounded-xl object-cover" />
                ))}
              </div>
              <div
                className="absolute flex flex-col items-start font-display text-[#131517] text-xs sm:text-sm font-bold uppercase"
                style={{ padding: "0px 7.79px", height: "24.54px", lineHeight: "24.54px", background: "#D1FE17", borderRadius: "5.2px", transform: "matrix(1, 0, -0.21, 0.98, 0, 0)", top: "57px", right: "16px" }}
              >
                Price locked
              </div>
              <div
                className="absolute flex flex-col justify-center items-center font-display text-[#131517] text-xs sm:text-sm font-bold uppercase"
                style={{ padding: "0px 8.44px", height: "45.13px", background: "#FF73AF", borderRadius: "5.63px", transform: "matrix(1, -0.01, -0.2, 0.98, 0, 0)", top: "-10px", left: "33%" }}
              >
                Bengali voice
              </div>
            </Reveal>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function AudienceHeading() {
  return (
    <section className="bg-white pt-12 sm:pt-16 pb-4 px-4">
      <div className="max-w-[1260px] mx-auto text-center flex flex-col items-center">
        <Reveal as="h2" direction="up" className="font-sans text-[28px] sm:text-5xl lg:text-[56px] font-medium text-black leading-[1.1] tracking-[-0.02em] mb-3 sm:mb-4">
          The ad your audience
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          actually hears
        </Reveal>
        <Reveal as="p" direction="up" delay={150} className="text-[#344054] text-sm sm:text-lg lg:text-xl font-normal max-w-2xl text-center">
          Its own script, its own tone and its own voice for every city — with your price exactly as you set it, and your yes on every version.
        </Reveal>
      </div>
    </section>
  );
}

/* ── Review masonry (StoreReadySection) ─────────────────────────────────────────────────────────────────────────── */
function VersionCard({ id }: { id: string }) {
  const s = byId(id);
  return (
    <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden mb-3">
      <div className="flex items-center justify-between px-2 sm:px-3 pt-2 sm:pt-3 pb-1 gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full shrink-0" style={{ background: BRANDS[s.brand].bg }} />
          <span className="text-[9px] sm:text-[10px] font-bold text-black tracking-wide uppercase truncate">{BRANDS[s.brand].name}</span>
        </div>
        <span className="text-[9px] font-semibold text-[#16a34a]">✓ Facts</span>
      </div>
      <p className="text-[8px] text-[#666] font-medium uppercase tracking-wide px-2 sm:px-3 pb-2 truncate">
        {s.city} · {s.language}
      </p>
      <Clip id={id} className="w-full aspect-[3/4] object-cover" />
      <div className="p-2 sm:p-2.5 flex flex-col gap-1.5">
        <span className="w-full py-1.5 sm:py-2 rounded-lg bg-[#F0EDFF] text-[#573CFF] text-[9px] sm:text-[10px] font-semibold text-center">Request changes</span>
        <span className="w-full py-1.5 sm:py-2 rounded-lg bg-[#1A1D11] text-white text-[9px] sm:text-[10px] font-semibold text-center">Approve</span>
      </div>
    </div>
  );
}

export function ReviewSection() {
  const col1 = ["chai-bn", "mitti-it"];
  const col2 = ["stride-hi", "chai-it", "mitti-bn"];
  const col3 = ["mitti-hi", "stride-bn", "chai-en"];
  const bullets = [
    "Nothing goes out without your yes",
    "Ask for changes in plain words — “too formal”, “sounds translated”",
    "See exactly what changed in the new version",
  ];
  return (
    <section id="review" className="bg-white py-10 sm:py-14 px-4">
      <div className="max-w-[1332px] mx-auto flex flex-col lg:flex-row items-center gap-8 sm:gap-12">
        <Reveal direction="right" className="w-full lg:w-[620px] max-w-full flex-shrink-0 rounded-[20px] overflow-hidden h-[480px] sm:h-[560px] relative">
          <div className="absolute inset-0 flex gap-2 sm:gap-3 px-2">
            <div className="flex-1 min-w-0 overflow-hidden relative">
              <div className="animate-masonry-up">{[...col1, ...col1].map((id, i) => <VersionCard key={`a${i}`} id={id} />)}</div>
            </div>
            <div className="flex-1 min-w-0 overflow-hidden relative">
              <div className="animate-masonry-down">{[...col2, ...col2].map((id, i) => <VersionCard key={`b${i}`} id={id} />)}</div>
            </div>
            <div className="hidden sm:block flex-1 min-w-0 overflow-hidden relative">
              <div className="animate-masonry-up" style={{ animationDelay: "-5s" }}>
                {[...col3, ...col3].map((id, i) => <VersionCard key={`c${i}`} id={id} />)}
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
        </Reveal>
        <div className="flex-1 flex flex-col gap-5 sm:gap-8 w-full">
          <Reveal direction="left">
            <p className="text-[#573CFF] text-xs sm:text-sm font-semibold tracking-[0.08em] uppercase mb-3 sm:mb-4">Review</p>
            <h2 className="font-sans text-2xl sm:text-4xl lg:text-[40px] font-medium text-black leading-tight tracking-[-0.02em]">You stay in charge of every version.</h2>
          </Reveal>
          <ul className="flex flex-col gap-2 pl-5 sm:pl-6 list-disc text-black text-sm sm:text-lg lg:text-xl leading-[24px] sm:leading-[28px] font-normal">
            {bullets.map((b, i) => (
              <Reveal as="li" key={b} direction="left" delay={150 + i * 100}>
                {b}
              </Reveal>
            ))}
          </ul>
          <Reveal direction="up" delay={500}>
            <Link href="/signup" className="w-fit inline-flex items-center justify-center h-10 px-4 rounded-xl bg-black text-white text-sm font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.18)] hover:bg-zinc-800 active:scale-95 transition">
              Start for free
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Brand memory collage (CreateSection) ───────────────────────────────────────────────────────────────────────── */
export function MemorySection() {
  const bullets = [
    "Every change you ask for becomes part of your brand memory",
    "Next time, your versions already sound like you",
    "See, edit or switch off anything it learned",
  ];
  return (
    <section id="memory" className="bg-white py-10 sm:py-14 px-4">
      <div className="max-w-[1260px] mx-auto flex flex-col lg:flex-row-reverse items-center gap-8 sm:gap-12">
        <Reveal direction="left" className="w-full lg:w-[685px] max-w-full flex-shrink-0 rounded-[24px] overflow-hidden relative h-[360px] sm:h-[480px] lg:h-[580px]">
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #e8f5a3 0%, #fef3c7 25%, #fde68a 40%, #fdba74 60%, #fca5a5 80%, #fecdd3 100%)" }} />
          <Reveal direction="scale" delay={120} className="absolute z-[2] w-[26.5%] sm:w-[25%] top-[16%]" style={{ left: "13%" }}>
            <div className="create-drift-a w-full">
              <Clip id="mitti-bn" className="w-full aspect-[9/16] rounded-2xl object-cover" />
            </div>
          </Reveal>
          <Reveal direction="scale" delay={200} className="absolute z-[3] w-[30%] top-[8%]" style={{ left: "37%" }}>
            <div className="create-drift-b w-full rounded-2xl bg-white p-4 text-[12.5px] shadow-xl" style={{ animationDelay: "-2s" }}>
              <div className="mb-2 flex items-center gap-1.5 font-semibold">
                <Brain weight="fill" className="size-4 text-[#573CFF]" /> Learned from you
              </div>
              <p className="leading-snug text-black">In Bengali versions, talk informally — use “tumi”, never “apni”.</p>
              <span className="mt-2 inline-flex rounded-md bg-[#F0EDFF] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#573CFF]">Bengali versions</span>
            </div>
          </Reveal>
          <Reveal direction="scale" delay={280} className="absolute z-[1] w-[25%] top-[19%]" style={{ right: "12%" }}>
            <div className="create-drift-c w-full" style={{ animationDelay: "-4s" }}>
              <Clip id="stride-en" className="w-full aspect-[9/16] rounded-2xl object-cover" />
            </div>
          </Reveal>
          <Reveal direction="scale" delay={440} className="absolute z-[4] w-[44%] bottom-[10%]" style={{ left: "30%" }}>
            <div className="create-drift-a w-full rounded-2xl bg-white p-4 text-[12.5px] shadow-xl" style={{ animationDelay: "-3s" }}>
              <div className="flex items-center gap-2 rounded-lg bg-[#D1FE17]/70 px-2.5 py-1.5 font-semibold text-black">✓ Applied 3 things we learned from you</div>
              <div className="mt-2 text-[#344054]">New campaign · 4 versions</div>
            </div>
          </Reveal>
        </Reveal>
        <div className="flex-1 flex flex-col gap-5 sm:gap-8 w-full">
          <Reveal direction="right">
            <p className="text-[#573CFF] text-xs sm:text-sm font-semibold tracking-[0.08em] uppercase mb-3 sm:mb-4">Learn</p>
            <h2 className="font-sans text-2xl sm:text-4xl lg:text-[40px] font-medium text-black leading-tight tracking-[-0.02em]">It learns your brand. Every time.</h2>
          </Reveal>
          <ul className="flex flex-col gap-2 pl-5 sm:pl-6 list-disc text-black text-sm sm:text-lg lg:text-xl leading-[24px] sm:leading-[28px] font-normal">
            {bullets.map((b, i) => (
              <Reveal as="li" key={b} direction="right" delay={150 + i * 100}>
                {b}
              </Reveal>
            ))}
          </ul>
          <Reveal direction="up" delay={500}>
            <Link href="/try" className="w-fit inline-flex items-center justify-center h-10 px-4 rounded-xl bg-[#D1FE17] text-black text-sm font-semibold hover:bg-[#c8f010] active:scale-95 transition">
              Start creating for free
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Toolkit strip ─────────────────────────────────────────────────────────────────────────────────────────────── */
const SLIDES = [
  { label: "Its own script", icon: PenNib, id: "chai-bn" },
  { label: "One brand voice", icon: Microphone, id: "stride-hi" },
  { label: "Facts locked", icon: Lock, id: "mitti-it" },
  { label: "Side by side", icon: SquaresFour, id: "chai-it" },
  { label: "Ask for changes", icon: ChatCircleText, id: "stride-bn" },
  { label: "Brand memory", icon: Brain, id: "mitti-hi" },
  { label: "MP4 + subtitles", icon: DownloadSimple, id: "chai-en" },
];

export function ToolkitSection() {
  return (
    <section className="relative py-10 sm:py-16 overflow-hidden">
      <img src="/brand/toolkit-bg.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="relative z-10">
        <div className="text-center mb-6 sm:mb-10 px-4">
          <Reveal as="h2" direction="up" className="font-sans text-[24px] sm:text-5xl lg:text-[60px] font-medium text-black leading-tight tracking-[-0.01em] mb-2 sm:mb-3">
            Everything a regional ad needs
          </Reveal>
          <Reveal as="p" direction="up" delay={100} className="text-black text-xs sm:text-lg lg:text-xl font-normal leading-5 sm:leading-7 px-2">
            Upload → Pick audiences → Review → Download
          </Reveal>
        </div>
        <div className="overflow-hidden w-full">
          <div className="flex gap-3 sm:gap-4 animate-toolkit-scroll" style={{ width: "max-content" }}>
            {[...SLIDES, ...SLIDES].map(({ label, icon: Icon, id }, i) => (
              <Link key={i} href="/try" className="w-[200px] sm:w-[280px] lg:w-[300px] rounded-[20px] sm:rounded-[24px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] overflow-hidden hover:-translate-y-1 transition-transform flex-none">
                <div className="h-[260px] sm:h-[380px] lg:h-[420px] bg-gray-100 overflow-hidden">
                  <Clip id={id} className="w-full h-full object-cover" />
                </div>
                <div className="py-2.5 sm:py-4 flex items-center justify-center gap-2">
                  <Icon weight="bold" className="size-5 text-[#573CFF]" />
                  <p className="font-sans text-black text-base sm:text-2xl font-medium">{label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ───────────────────────────────────────────────────────────────────────────────────────────────────── */
export function PricingSection() {
  return (
    <section id="pricing" className="bg-white py-12 sm:py-16 px-4 overflow-hidden relative">
      <svg className="absolute left-0 bottom-0 opacity-50" width="800" height="600" viewBox="0 0 1512 968" fill="none" aria-hidden>
        <circle cx="432.5" cy="432.5" r="432" fill="url(#p2)" stroke="url(#p3)" />
        <circle cx="756.5" cy="535.5" r="432" fill="url(#p4)" stroke="url(#p5)" />
        <defs>
          <linearGradient id="p2" x1="432.5" y1="0" x2="432.5" y2="865" gradientUnits="userSpaceOnUse"><stop stopColor="#EFF2FF" /><stop offset="1" stopColor="#EFF2FF" stopOpacity="0" /></linearGradient>
          <linearGradient id="p3" x1="885.5" y1="389.5" x2="-116.5" y2="611.5" gradientUnits="userSpaceOnUse"><stop stopColor="#B5C2FB" /><stop offset="1" stopColor="#B5C2FB" stopOpacity="0" /></linearGradient>
          <linearGradient id="p4" x1="756.5" y1="103" x2="756.5" y2="968" gradientUnits="userSpaceOnUse"><stop stopColor="#EFF2FF" /><stop offset="1" stopColor="#EFF2FF" stopOpacity="0" /></linearGradient>
          <radialGradient id="p5" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(756.5 535.5) rotate(89.968) scale(896)"><stop offset="0.046875" stopColor="#B5C2FB" stopOpacity="0" /><stop offset="1" stopColor="#B5C2FB" /></radialGradient>
        </defs>
      </svg>
      <div className="relative z-10 max-w-[1260px] mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <Reveal as="h2" direction="up" className="font-sans text-[26px] sm:text-5xl lg:text-[60px] font-medium leading-tight sm:leading-none tracking-[-0.023em]">
            <span className="text-[#0F172A]">Start at </span>
            <span className="text-[#2506DA]">₹0</span>
            <span className="text-[#0F172A]"> &amp; get 3 free versions</span>
          </Reveal>
        </div>
        <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12">
          <div className="flex-1 flex flex-col gap-5 sm:gap-8 w-full">
            <Reveal as="h3" direction="up" className="font-sans text-xl sm:text-3xl lg:text-[40px] font-medium text-black leading-snug sm:leading-normal tracking-[-0.02em]">
              Try MotherTongue on your own ad, then pay only for the versions you approve.
            </Reveal>
            <Reveal direction="up" delay={150}>
              <Link href="/signup" className="w-fit inline-flex items-center justify-center h-10 px-4 rounded-xl bg-black text-white text-sm font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.18)] hover:bg-zinc-800 active:scale-95 transition">
                Start creating for free
              </Link>
            </Reveal>
            <Reveal direction="up" delay={300} className="text-[13px] text-[#6B6B6B]">
              Launch pricing. Pro is per approved version; agency plans are coming soon.
            </Reveal>
          </div>
          <Reveal direction="scale" delay={150} className="w-full lg:w-[407px] rounded-[26px] border border-[#E7EBFF] bg-white overflow-hidden p-6 sm:p-8 lg:p-10 relative flex-shrink-0 hover:shadow-[0_24px_64px_rgba(87,60,255,0.4)] transition-shadow">
            <div className="absolute inset-0 overflow-hidden rounded-[26px]" style={{ background: "linear-gradient(180deg, #573CFF 0%, #8920F9 100%)" }} />
            <div className="relative z-10 flex flex-col gap-6 sm:gap-10">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#D1FE17] flex items-center justify-center">
                  <span className="grid size-8 place-items-center rounded-lg bg-[#573CFF]">
                    <MarkWhite className="size-6" />
                  </span>
                </div>
                <div>
                  <h3 className="font-sans text-white text-3xl sm:text-4xl font-medium tracking-[-0.035em]">Free Plan</h3>
                  <p className="font-sans text-white text-base sm:text-lg font-light mt-1">Everything you need to try it on your own ad</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-sans text-white text-4xl sm:text-5xl font-medium tracking-[-0.035em]">₹0</span>
                  <span className="font-sans text-white text-base sm:text-lg font-light">/ 3 versions</span>
                </div>
              </div>
              <div className="h-px bg-white/20" />
              {["No credit card required", "Every language we offer", "Review, changes and brand memory"].map((t) => (
                <div key={t} className="-mt-3 flex items-center gap-3 sm:-mt-6">
                  <svg width="22" height="22" viewBox="0 0 25 25" fill="none">
                    <path d="M4.87891 12.8086C12.5029 19.2128 14.0277 18.9078 19.8219 7.31934" stroke="white" strokeWidth="1.74" strokeLinecap="round" />
                  </svg>
                  <span className="font-sans text-white text-base sm:text-lg font-normal">{t}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── How it helps (TestimonialsSection layout — scenarios, not invented testimonials) ───────────────────────────── */
const HELPS = [
  { icon: Buildings, text: "One shoot, one edit — then a Bengali, a Hindi and an English version that each sound local, with the same price in all of them.", who: "A D2C brand", where: "selling in three states", bg: "#FFE3AB" },
  { icon: Storefront, text: "Run the ad you already have in the language of every new neighbourhood, without hiring voice artists or an agency.", who: "A local business", where: "growing beyond one city", bg: "#FFC6EA" },
  { icon: UsersThree, text: "Deliver every market's version in a day, with an approval report and the client's brand rules applied every time.", who: "An agency", where: "making regional versions for clients", bg: "#BCFFAD" },
];

export function HelpsSection() {
  return (
    <section className="bg-white py-12 sm:py-16 px-4">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <Reveal as="h2" direction="up" className="font-sans text-[26px] sm:text-5xl lg:text-[60px] font-medium text-black leading-tight tracking-[-0.01em]">
            How MotherTongue helps
          </Reveal>
          <Reveal as="p" direction="up" delay={120} className="text-[#6B6B6B] text-sm sm:text-lg lg:text-xl font-normal leading-6 sm:leading-[30px] mt-3 sm:mt-4 max-w-2xl mx-auto">
            From small shops to growing brands and agencies — one ad, made right for every audience.
          </Reveal>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {HELPS.map(({ icon: Icon, text, who, where, bg }, i) => (
            <Reveal key={who} direction="up" delay={150 + i * 120} className="rounded-[40px_0px] p-4 sm:p-5 flex flex-col gap-4 sm:gap-5 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all" style={{ background: bg }}>
              <span className="grid w-16 h-16 sm:w-20 sm:h-20 place-items-center rounded-full bg-white/70">
                <Icon weight="bold" className="size-7 sm:size-8 text-black" />
              </span>
              <p className="text-black text-sm sm:text-base font-medium leading-[20px] sm:leading-[22px] flex-1">{text}</p>
              <div>
                <p className="text-black text-sm font-semibold">{who}</p>
                <p className="text-[#344054] text-xs font-normal">{where}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Numbers (only true, checkable facts about the product) ────────────────────────────────────────────────────── */
export function NumbersSection() {
  const stats = [
    { value: "1", label: "Upload — that's all you make" },
    { value: "4", label: "Languages with voices tested properly" },
    { value: "100%", label: "Of versions fact-checked before you can approve" },
  ];
  return (
    <section className="bg-[#FCFCFC] py-10 sm:py-14 px-4">
      <div className="max-w-[1260px] mx-auto">
        <div className="rounded-[24px] bg-[#F0F0F0] p-6 sm:p-10 lg:p-16 flex flex-col lg:flex-row items-stretch gap-6 sm:gap-12">
          <Reveal direction="right" className="flex-1 w-full relative min-h-[260px] sm:min-h-[280px]">
            <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-medium leading-tight">
              <span className="text-black">Local </span>
              <span className="text-[#573CFF]">words.</span>
              <br />
              <span className="text-black">Faster launches.</span>
              <br />
              <span className="text-black">Same </span>
              <span className="text-[#573CFF]">price.</span>
            </h2>
            <img src="/brand/blob.png" alt="" className="absolute bottom-0 right-0 w-[160px] sm:w-[240px] lg:w-[300px] max-w-[55%]" />
          </Reveal>
          <div className="flex-1 w-full lg:border-l lg:border-t-0 border-t border-black/15">
            {stats.map((stat, i) => (
              <Reveal key={stat.label} direction="left" delay={150 + i * 120} className={`flex flex-row items-center gap-3 sm:gap-8 py-4 sm:py-7 pl-3 sm:pl-9 ${i < stats.length - 1 ? "border-b border-black/15" : ""}`}>
                <span className="font-sans text-3xl sm:text-5xl lg:text-6xl font-medium text-black leading-none tracking-[-0.02em] w-16 sm:w-36 flex-shrink-0">{stat.value}</span>
                <span className="text-black text-sm sm:text-base lg:text-lg font-medium leading-snug">{stat.label}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ───────────────────────────────────────────────────────────────────────────────────────────────────────── */
const FAQ = [
  ["Is this just translation?", "No. Each audience gets its own script, tone and voice, written for them — then you approve it."],
  ["Will it change my price or offer?", "Never. Your facts are locked and checked in every version, on screen and in the voice."],
  ["Which languages?", "Bengali, Hindi, Italian and English — the ones whose voices we tested properly. More are coming."],
  ["Do I need to design anything?", "No. Upload the ad you already have, paste its voiceover, and pick your audiences."],
  ["What happens to my original voiceover?", "Each version gets a new voice over your music. Text burned into your video stays; we add new text in the free space."],
  ["Can I change what it wrote?", "Yes. Edit any line yourself, or ask for changes in plain words and get a new version."],
];

export function FaqSection() {
  return (
    <section id="faq" className="bg-white py-12 sm:py-16 px-4">
      <div className="max-w-[1200px] mx-auto">
        <Reveal as="h2" direction="up" className="text-center font-sans text-[26px] sm:text-5xl lg:text-[60px] font-medium text-black leading-tight tracking-[-0.01em] mb-8 sm:mb-12">
          Questions, answered plainly
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FAQ.map(([q, a], i) => (
            <Reveal key={q} direction="up" delay={(i % 3) * 100} className="rounded-[24px] border border-[#E7EBFF] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <h3 className="text-[17px] font-semibold text-black">{q}</h3>
              <p className="mt-2 text-[15px] leading-[1.55] text-[#344054]">{a}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA banner ────────────────────────────────────────────────────────────────────────────────────────────────── */
export function CTABannerSection() {
  return (
    <section className="relative px-4 overflow-hidden bg-[#0a3e52] pb-10 sm:pb-16 lg:pb-24">
      <img src="/brand/cta-bg.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="relative z-10 max-w-[1260px] mx-auto flex flex-col lg:flex-row items-center lg:items-end gap-6 sm:gap-12 py-10 sm:py-16 lg:py-20">
        <Reveal direction="right" className="flex-1 w-full lg:pb-12">
          <h2 className="font-sans text-white text-2xl sm:text-4xl lg:text-5xl font-medium leading-tight mb-4">Make your ad speak every language your customers do</h2>
          <Link href="/try" className="inline-block text-white text-lg sm:text-xl lg:text-2xl font-medium underline decoration-white underline-offset-4 hover:text-[#D1FE17] transition-colors">
            Try for free
          </Link>
        </Reveal>
        <Reveal direction="left" delay={200} className="flex-shrink-0 bg-white/20 rounded-[28px] sm:rounded-[32px] p-3 w-44 sm:w-56 lg:w-64 h-[240px] sm:h-[300px] lg:h-[340px] flex items-end justify-center overflow-hidden lg:translate-y-10 mb-[-105px] md:mb-[-170px]">
          <Clip id="mitti-en" className="w-full rounded-[24px] sm:rounded-[26px] object-cover h-full" />
        </Reveal>
      </div>
    </section>
  );
}

/* ── Footer ────────────────────────────────────────────────────────────────────────────────────────────────────── */
const FOOTER: [string, [string, string][]][] = [
  ["Product", [["How it works", "#how"], ["Review", "#review"], ["Brand memory", "#memory"], ["Pricing", "#pricing"]]],
  ["Languages", [["Bengali", "#languages"], ["Hindi", "#languages"], ["Italian", "#languages"], ["English", "#languages"]]],
  ["Start", [["Try a sample ad", "/try"], ["Sign up", "/signup"], ["Login", "/login"]]],
  ["Company", [["Privacy", "/privacy"], ["Terms", "/terms"], ["GitHub", "https://github.com/rohit-jsfreaky/mothertongue"]]],
];

export function SiteFooter() {
  return (
    <footer className="relative bg-[#0C0D06] text-white pt-16 sm:pt-24 pb-8 sm:pb-10 px-4 overflow-hidden">
      <img src="/brand/footer-swirl.png" alt="" aria-hidden className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 z-0 h-[188px] w-[109px] object-contain opacity-90" />
      <div className="max-w-[1200px] mx-auto relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-y-8 gap-x-6 sm:gap-x-8 lg:gap-10 mb-10 sm:mb-16">
          <Reveal direction="up">
            <Logo tone="light" />
          </Reveal>
          {FOOTER.map(([title, items], i) => (
            <Reveal key={title} direction="up" delay={80 * (i + 1)}>
              <h4 className="text-white font-sans text-base font-normal mb-4 sm:mb-6">{title}</h4>
              <ul className="flex flex-col gap-3 sm:gap-4">
                {items.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="text-white/85 font-sans text-sm hover:text-white transition-colors">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
        <Reveal direction="fade" className="border-t border-white/10 pt-6 sm:pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <a href="https://github.com/rohit-jsfreaky/mothertongue" aria-label="GitHub" className="opacity-80 hover:opacity-100 transition-opacity">
            <GithubLogo weight="fill" className="size-[22px]" />
          </a>
          <p className="text-white/80 font-sans text-xs sm:text-sm">© 2026 MotherTongue · Built on AMD</p>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/terms" className="text-white/80 font-sans text-xs sm:text-sm hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="text-white/80 font-sans text-xs sm:text-sm hover:text-white transition-colors">Privacy</Link>
          </div>
        </Reveal>
      </div>
    </footer>
  );
}
