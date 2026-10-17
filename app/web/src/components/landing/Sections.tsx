import {
  ArrowUpRight,
  Brain,
  ChatCircleText,
  CheckCircle,
  Check,
  DownloadSimple,
  Lock,
  Microphone,
  PenNib,
  ShieldCheck,
  SquaresFour,
  Storefront,
  Buildings,
  UsersThree,
} from "@phosphor-icons/react/ssr";
import { LogoMark, Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { AdTile } from "./AdTile";
import { SAMPLES, byId } from "./samples";

/* ── 1. Giant text marquee ─────────────────────────────────────────────────────────────────────────────────────── */
export function BigMarquee() {
  const text = "FOR BRANDS, SHOPS, AGENCIES AND CREATORS WHO SELL IN MORE THAN ONE LANGUAGE — ";
  return (
    <div className="relative z-10 -mt-28 overflow-hidden py-2 lg:-mt-24">
      <div className="flex w-max animate-marquee whitespace-nowrap will-change-transform">
        {[0, 1].map((i) => (
          <span key={i} className="pr-6 text-[44px] font-medium tracking-[-0.02em] text-ink sm:text-[64px]">
            {text}
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── 2. Product cards row ──────────────────────────────────────────────────────────────────────────────────────── */
const PRODUCT_CARDS = [
  { tag: "SCRIPT", icon: PenNib, title: "Written for each city", text: "Its own words, tone and local touch — not a translation." },
  { tag: "VOICE", icon: Microphone, title: "One steady brand voice", text: "A natural voice in every language, the same in every version." },
  { tag: "CHECK", icon: ShieldCheck, title: "Facts locked and checked", text: "Price, offer and dates verified on screen and in the voice." },
];

export function ProductCards() {
  return (
    <section id="how" className="relative z-10 mx-auto max-w-[1440px] px-4 pt-14 sm:px-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
        <Reveal className="relative overflow-hidden rounded-[18px] bg-[#0d1236] p-6 text-white shadow-float">
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_80%_120%,#3c7cff_0%,#2a3bd8_30%,transparent_60%)] opacity-90" />
          <div className="absolute -bottom-10 left-0 right-0 h-24 rounded-[50%] bg-[#4fa3ff]/40 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[15px] font-semibold tracking-wide">
              MOTHERTONGUE STUDIO
              <span className="rounded-md bg-lime px-1.5 py-0.5 text-[10px] font-bold text-ink">NEW</span>
            </div>
            <p className="mt-2 max-w-[260px] text-[12.5px] text-white/75">
              Upload one ad, pick your audiences, review every version side by side.
            </p>
            <ButtonLink href="/try" variant="lime" size="sm" className="mt-5">
              Try now <ArrowUpRight weight="bold" className="size-3.5" />
            </ButtonLink>
          </div>
        </Reveal>
        {PRODUCT_CARDS.map(({ tag, icon: Icon, title, text }, i) => (
          <Reveal key={tag} delay={0.06 * (i + 1)} className="rounded-[18px] bg-ink-2 p-6 text-white shadow-float">
            <div className="flex items-start justify-between">
              <Icon weight="bold" className="size-5 text-white/90" />
              <span className="flex items-center gap-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/80">
                <span className="size-1.5 rounded-full bg-lime" /> {tag}
              </span>
            </div>
            <div className="mt-8 text-[14px] font-semibold">{title}</div>
            <p className="mt-1 text-[12.5px] leading-snug text-white/60">{text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── 3. Moving strip of ad versions ────────────────────────────────────────────────────────────────────────────── */
export function AdMarquee() {
  const row = [...SAMPLES, ...SAMPLES];
  return (
    <section className="marquee-pause relative mt-14 overflow-hidden">
      <div className="flex w-max animate-scroll-x gap-4 will-change-transform">
        {row.map((s, i) => (
          <AdTile key={`${s.id}-${i}`} s={s} className="w-[210px] sm:w-[230px]" />
        ))}
      </div>
    </section>
  );
}

/* ── 4. Languages grid (instead of client logos — we have none, and we don't fake any) ─────────────────────────── */
const PLACES = [
  ["কলকাতা", "font-semibold"],
  ["लखनऊ", "font-bold"],
  ["Milano", "font-medium italic"],
  ["London", "font-semibold tracking-[-0.04em]"],
  ["ঢাকা", "font-medium"],
  ["दिल्ली", "font-semibold"],
  ["Roma", "font-bold tracking-[0.08em] uppercase text-[19px]"],
  ["New York", "font-medium"],
  ["হাওড়া", "font-bold"],
  ["जयपुर", "font-medium"],
  ["Torino", "font-semibold italic"],
  ["Manchester", "font-bold tracking-[-0.03em]"],
  ["শিলিগুড়ি", "font-medium"],
  ["वाराणसी", "font-semibold"],
];

export function Languages() {
  return (
    <section id="languages" className="mx-auto max-w-[1100px] px-6 pb-8 pt-28 text-center">
      <Reveal as="h2" className="text-[40px] font-medium leading-[1.2] tracking-[-0.02em] sm:text-[64px] sm:leading-[80px]">
        Built for brands that sell in more than one language
      </Reveal>
      <Reveal as="p" delay={0.05} className="mt-3 text-[15px] font-medium text-fg">
        Bengali, Hindi, Italian and English today — every voice tested properly. More languages are coming.
      </Reveal>
      <Reveal delay={0.1} className="mt-14 grid grid-cols-3 gap-x-6 gap-y-10 sm:grid-cols-7">
        {PLACES.map(([p, cls]) => (
          <span key={p} className={`text-[22px] text-ink/80 ${cls}`}>
            {p}
          </span>
        ))}
      </Reveal>
    </section>
  );
}

/* ── 5. Gradient banner ────────────────────────────────────────────────────────────────────────────────────────── */
export function GradientBanner() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-20 sm:px-8">
      <Reveal className="relative isolate overflow-hidden rounded-[24px] bg-[#0c1030] px-8 py-14 text-white sm:px-12">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#0c1030_0%,#20185e_35%,#5b41f8_62%,#d1fe17_118%)] opacity-90" />
        <div className="absolute -bottom-24 left-[20%] -z-10 h-56 w-[90%] rounded-[50%] bg-[#ff7ab6]/50 blur-3xl" />
        <div className="absolute -bottom-32 left-[45%] -z-10 h-64 w-[70%] rounded-[50%] bg-[#4fe3c1]/40 blur-3xl" />
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="font-display text-[34px] font-bold uppercase leading-[1.25] tracking-[-0.035em] sm:text-[48px]">
              One ad.
              <br />
              Every audience.
            </h2>
            <p className="mt-4 max-w-[420px] text-[14px] text-white/80">
              Make a version for every city you sell in, review them side by side, and download the ones you approve.
            </p>
            <ButtonLink href="/try" variant="white" className="mt-7">
              + Try now
            </ButtonLink>
          </div>
          <div className="relative h-[300px]">
            <span className="absolute left-[38%] top-0 z-10 rotate-[-4deg] rounded-md bg-[#ff6fb5] px-2 py-1 text-[11px] font-bold italic text-white">
              BENGALI VOICE
            </span>
            <span className="absolute right-0 top-[38%] z-10 rotate-[4deg] rounded-md bg-lime px-2 py-1 text-[11px] font-bold italic text-ink">
              PRICE LOCKED
            </span>
            <div className="absolute left-[8%] top-6 w-[150px] -rotate-6 rounded-[16px] bg-[#fff6c8] p-3 text-[12px] leading-snug text-ink shadow-float">
              <div className="mb-1 font-semibold">Festive chai launch</div>
              Kolkata, Lucknow and Milan versions — ready to review.
            </div>
            <AdTile s={byId("chai-bn")} className="absolute left-[38%] top-2 w-[136px] shadow-float" />
            <AdTile s={byId("chai-it")} className="absolute right-[6%] top-4 w-[118px] rotate-3 shadow-float" />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ── 6. Centre heading ─────────────────────────────────────────────────────────────────────────────────────────── */
export function CenterHeading() {
  return (
    <section className="mx-auto max-w-[920px] px-6 pb-6 pt-28 text-center">
      <Reveal as="h2" className="text-[36px] font-medium leading-[1.1] tracking-[-0.02em] sm:text-[56px]">
        The ad your audience
        <br /> actually hears
      </Reveal>
      <Reveal as="p" delay={0.05} className="mx-auto mt-5 max-w-[620px] text-[15px] text-fg-2">
        Its own script, its own tone and its own voice for every city — with your price exactly as you set it, and your
        yes on every version.
      </Reveal>
    </section>
  );
}

/* ── 7. Split with masonry (review) ────────────────────────────────────────────────────────────────────────────── */
function Masonry() {
  const cols = [SAMPLES.slice(0, 4), SAMPLES.slice(4, 8), SAMPLES.slice(8, 12)];
  const anim = ["animate-masonry-up", "animate-masonry-down", "animate-masonry-up"];
  return (
    <div className="relative h-[520px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]">
      <div className="grid grid-cols-3 gap-3">
        {cols.map((col, c) => (
          <div key={c} className={`flex flex-col gap-3 ${anim[c]}`}>
            {[...col, ...col].map((s, i) => (
              <div key={`${s.id}-${i}`} className="overflow-hidden rounded-[14px] bg-white p-1.5 shadow-card">
                <AdTile s={s} className="w-full" />
                <div className="flex gap-1 p-1.5">
                  <span className="flex-1 rounded-md bg-violet-100 py-1 text-center text-[10px] font-semibold text-violet">
                    Review
                  </span>
                  <span className="flex-1 rounded-md bg-ink py-1 text-center text-[10px] font-semibold text-white">Approve</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 flex flex-col gap-2">
      {items.map((t) => (
        <li key={t} className="flex gap-2.5 text-[15px] text-fg">
          <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ink" />
          {t}
        </li>
      ))}
    </ul>
  );
}

export function ReviewSplit() {
  return (
    <section id="review" className="mx-auto grid max-w-[1200px] items-center gap-14 px-6 pt-20 lg:grid-cols-2">
      <Reveal>
        <Masonry />
      </Reveal>
      <Reveal delay={0.05}>
        <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-violet">Review</div>
        <h2 className="mt-3 text-[32px] font-medium leading-[1.25] tracking-[-0.02em] sm:text-[40px]">
          You stay in charge of every version.
        </h2>
        <Bullets
          items={[
            "Nothing goes out without your yes",
            "Ask for changes in plain words — “too formal”, “sounds translated”",
            "See exactly what changed in the new version",
          ]}
        />
        <ButtonLink href="/signup" variant="ink" className="mt-8">
          Start for free
        </ButtonLink>
      </Reveal>
    </section>
  );
}

/* ── 8. Split with drifting collage (brand memory) ─────────────────────────────────────────────────────────────── */
export function MemorySplit() {
  return (
    <section id="memory" className="mx-auto grid max-w-[1200px] items-center gap-14 px-6 pt-28 lg:grid-cols-2">
      <Reveal>
        <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-violet">Learn</div>
        <h2 className="mt-3 text-[32px] font-medium leading-[1.25] tracking-[-0.02em] sm:text-[40px]">
          It learns your brand. Every time.
        </h2>
        <Bullets
          items={[
            "Every change you ask for becomes part of your brand memory",
            "Next time, your versions already sound like you",
            "See, edit or switch off anything it learned",
          ]}
        />
        <ButtonLink href="/try" variant="lime" className="mt-8">
          Start creating for free
        </ButtonLink>
      </Reveal>
      <Reveal delay={0.05} className="relative h-[460px] overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#fff3b0_0%,#ffd39b_45%,#ffb1c8_100%)] p-6">
        <div className="absolute left-[8%] top-[10%] w-[44%] animate-drift-a">
          <AdTile s={byId("mitti-bn")} className="w-full shadow-float" />
        </div>
        <div className="absolute right-[7%] top-[7%] w-[40%] animate-drift-b rounded-[18px] bg-white p-4 text-[12.5px] shadow-float">
          <div className="mb-2 flex items-center gap-1.5 font-semibold">
            <Brain weight="fill" className="size-4 text-violet" /> Learned from you
          </div>
          <p className="leading-snug">In Bengali versions, talk informally — use “tumi”, never “apni”.</p>
          <div className="mt-2 inline-flex rounded-md bg-violet-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-violet">
            Bengali versions
          </div>
        </div>
        <div className="absolute bottom-[8%] right-[10%] w-[46%] animate-drift-c rounded-[18px] bg-white p-4 text-[12.5px] shadow-float">
          <div className="flex items-center gap-2 rounded-lg bg-lime/60 px-2.5 py-1.5 font-semibold">
            <Check weight="bold" className="size-3.5" /> Applied 3 things we learned from you
          </div>
          <div className="mt-2 text-fg-2">New campaign · 3 versions</div>
        </div>
      </Reveal>
    </section>
  );
}

/* ── 9. Toolkit band with moving feature cards ─────────────────────────────────────────────────────────────────── */
const TOOLKIT = [
  { label: "Every audience, its own script", icon: PenNib, s: "chai-bn" },
  { label: "One brand voice", icon: Microphone, s: "stride-hi" },
  { label: "Facts locked", icon: Lock, s: "mitti-it" },
  { label: "Side-by-side compare", icon: SquaresFour, s: "chai-it" },
  { label: "Request changes", icon: ChatCircleText, s: "stride-bn" },
  { label: "Brand memory", icon: Brain, s: "mitti-hi" },
  { label: "Download MP4 + subtitles", icon: DownloadSimple, s: "chai-en" },
];

export function Toolkit() {
  const row = [...TOOLKIT, ...TOOLKIT];
  return (
    <section className="relative mt-28 overflow-hidden pb-16 pt-24">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#f3efff_0%,#e9e3ff_35%,#f9fafb_100%)]" />
      <div className="absolute -top-24 left-[-10%] -z-10 h-72 w-[60%] rounded-full bg-[#7a57f7]/30 blur-3xl" />
      <div className="absolute -top-24 right-[-10%] -z-10 h-72 w-[50%] rounded-full bg-[#ff9d5c]/30 blur-3xl" />
      <div className="mx-auto max-w-[1000px] px-6 text-center">
        <Reveal as="h2" className="text-[36px] font-medium leading-[1.15] tracking-[-0.01em] sm:text-[60px] sm:leading-[75px]">
          Everything a regional ad needs
        </Reveal>
        <Reveal as="p" delay={0.05} className="mt-2 text-[15px] font-medium text-fg">
          Upload → Pick audiences → Review → Download
        </Reveal>
      </div>
      <div className="marquee-pause mt-12 overflow-hidden">
        <div className="flex w-max animate-scroll-x gap-4 will-change-transform">
          {row.map(({ label, icon: Icon, s }, i) => (
            <div key={`${label}-${i}`} className="w-[230px] shrink-0 overflow-hidden rounded-[18px] bg-white shadow-card">
              <AdTile s={byId(s)} className="w-full !aspect-[4/5] !rounded-none" showLabel={false} />
              <div className="flex items-center gap-2 px-4 py-3.5 text-[15px] font-medium">
                <Icon weight="bold" className="size-4 text-violet" />
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 10. Pricing ───────────────────────────────────────────────────────────────────────────────────────────────── */
export function PricingBand() {
  return (
    <section id="pricing" className="relative mx-auto max-w-[1200px] px-6 pt-20">
      <div className="absolute left-0 top-40 -z-10 size-[420px] rounded-full bg-[#e9e6ff] blur-3xl" />
      <Reveal as="h2" className="text-center text-[34px] font-medium tracking-[-0.02em] sm:text-[48px]">
        Start at <span className="text-violet">₹0</span> &amp; get 3 free versions
      </Reveal>
      <div className="mt-14 grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <Reveal>
          <p className="max-w-[520px] text-[26px] font-medium leading-[1.35] tracking-[-0.01em] sm:text-[32px]">
            Try MotherTongue on your own ad, then pay only for the versions you approve.
          </p>
          <ButtonLink href="/signup" variant="ink" className="mt-8">
            Start creating for free
          </ButtonLink>
          <p className="mt-4 text-[13px] text-fg-3">Launch pricing. Pro is per approved version; agency plans are coming soon.</p>
        </Reveal>
        <Reveal delay={0.05} className="rounded-[24px] bg-[linear-gradient(160deg,#5b41f8_0%,#7b2cf0_100%)] p-8 text-white shadow-cta">
          <span className="grid size-9 place-items-center rounded-lg bg-lime">
            <LogoMark className="size-6" />
          </span>
          <div className="mt-5 text-[26px] font-semibold">Free Plan</div>
          <div className="text-[13px] text-white/75">Everything you need to try it on your own ad</div>
          <div className="mt-6 flex items-end gap-1">
            <span className="text-[40px] font-semibold leading-none">₹0</span>
            <span className="pb-1 text-[13px] text-white/75">/ to start</span>
          </div>
          <div className="my-6 h-px bg-white/20" />
          <ul className="flex flex-col gap-2.5 text-[14px]">
            {["3 versions on your own ad", "Every language we offer", "Review, changes and brand memory", "No credit card required"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle weight="fill" className="size-4 text-lime" /> {t}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 11. Who it helps (scenarios — not testimonials) ───────────────────────────────────────────────────────────── */
const HELPS = [
  {
    bg: "#fbd9a8",
    icon: Buildings,
    who: "A D2C brand",
    where: "selling in three states",
    text: "One shoot, one edit — then a Bengali, a Hindi and an English version that each sound local, with the same price in all of them.",
  },
  {
    bg: "#f9c4dc",
    icon: Storefront,
    who: "A local business",
    where: "growing beyond one city",
    text: "Run the ad you already have in the language of every new neighbourhood, without hiring voice artists.",
  },
  {
    bg: "#b9f5a3",
    icon: UsersThree,
    who: "An agency",
    where: "making regional versions for clients",
    text: "Deliver every market's version in a day, with an approval report and the client's brand rules applied every time.",
  },
];

export function HowItHelps() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 pt-32 text-center">
      <Reveal as="h2" className="text-[36px] font-medium tracking-[-0.02em] sm:text-[48px]">
        How MotherTongue helps
      </Reveal>
      <Reveal as="p" delay={0.05} className="mx-auto mt-3 max-w-[560px] text-[15px] text-fg-2">
        From small shops to growing brands and agencies — one ad, made right for every audience.
      </Reveal>
      <div className="mt-12 grid gap-5 text-left md:grid-cols-3">
        {HELPS.map(({ bg, icon: Icon, who, where, text }, i) => (
          <Reveal key={who} delay={i * 0.05} className="h-full">
            <div className="flex h-full flex-col rounded-[24px] p-7" style={{ background: bg }}>
              <span className="grid size-11 place-items-center rounded-full bg-white/70">
                <Icon weight="bold" className="size-5" />
              </span>
              <p className="mt-5 flex-1 text-[14.5px] leading-[1.55]">{text}</p>
              <div className="mt-6 text-[13px] font-semibold">{who}</div>
              <div className="text-[12px] text-ink/60">{where}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── 12. Stats card (only true, checkable facts about the product) ─────────────────────────────────────────────── */
export function StatsCard() {
  const rows = [
    ["1", "upload — that's all you make"],
    ["4", "languages with voices tested properly"],
    ["Every", "fact checked on screen and in the voice"],
  ];
  return (
    <section className="mx-auto max-w-[1200px] px-6 pt-24">
      <Reveal className="relative grid items-center gap-10 overflow-hidden rounded-[24px] bg-[#f0f1f3] p-10 lg:grid-cols-2 lg:p-14">
        <div className="relative">
          <p className="text-[34px] font-medium leading-[1.25] tracking-[-0.02em] sm:text-[40px]">
            Local <span className="text-violet">words.</span>
            <br />
            Faster launches.
            <br />
            Same <span className="text-[#e0458f]">price.</span>
          </p>
          <div className="absolute -bottom-6 left-[52%] size-20 rounded-full bg-[radial-gradient(circle_at_30%_30%,#ffd39b,#ff7a59)] opacity-80 blur-[2px]" />
        </div>
        <div className="divide-y divide-line-2 lg:border-l lg:border-line-2 lg:pl-10">
          {rows.map(([n, t]) => (
            <div key={t} className="flex items-center gap-8 py-5">
              <span className="w-24 text-[40px] font-medium tracking-[-0.02em]">{n}</span>
              <span className="text-[14px]">{t}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ── 13. CTA band ──────────────────────────────────────────────────────────────────────────────────────────────── */
export function CtaBand() {
  return (
    <section className="relative mt-28 overflow-hidden bg-[#0a2a6b] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,#0a1f5c_0%,#0b4fa8_45%,#0aa5b9_80%,#2fe0a6_100%)]" />
      <div className="absolute -bottom-40 left-[10%] h-72 w-[90%] rounded-[50%] bg-[#2fe0a6]/50 blur-3xl" />
      <div className="relative mx-auto grid max-w-[1200px] items-center gap-10 px-6 py-20 lg:grid-cols-[1.3fr_1fr]">
        <Reveal>
          <h2 className="text-[32px] font-medium leading-[1.25] tracking-[-0.01em] sm:text-[40px]">
            Make your ad speak every language your customers do
          </h2>
          <a href="/try" className="mt-5 inline-block text-[18px] font-semibold underline underline-offset-4">
            Try it free
          </a>
        </Reveal>
        <div className="relative hidden h-[280px] lg:block">
          <AdTile s={byId("stride-en")} className="absolute bottom-0 right-6 w-[170px] rotate-2 shadow-float" />
          <AdTile s={byId("mitti-en")} className="absolute bottom-6 right-[200px] w-[150px] -rotate-3 shadow-float" />
        </div>
      </div>
    </section>
  );
}

/* ── 14. Footer ────────────────────────────────────────────────────────────────────────────────────────────────── */
export function SiteFooter() {
  const cols = [
    ["Product", [["How it works", "#how"], ["Review", "#review"], ["Brand memory", "#memory"], ["Pricing", "#pricing"]]],
    ["Languages", [["Bengali", "#languages"], ["Hindi", "#languages"], ["Italian", "#languages"], ["English", "#languages"]]],
    ["Start", [["Try a sample ad", "/try"], ["Sign up", "/signup"], ["Login", "/login"]]],
    ["Company", [["Privacy", "/privacy"], ["Terms", "/terms"], ["GitHub", "https://github.com/rohit-jsfreaky/mothertongue"]]],
  ] as const;
  return (
    <footer className="bg-[#0b0b0a] text-white">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-6 pb-12 pt-20 md:grid-cols-[1fr_2fr]">
        <Logo tone="light" />
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          {cols.map(([title, links]) => (
            <div key={title}>
              <div className="mb-4 text-[14px] font-medium">{title}</div>
              <ul className="flex flex-col gap-3">
                {links.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="text-[13px] text-white/70 hover:text-white">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 border-t border-white/10 px-6 py-8 text-[12.5px] text-white/60">
        <span>© 2026 MotherTongue</span>
        <span>Built on AMD</span>
        <span className="flex gap-6">
          <a href="/terms" className="hover:text-white">Terms</a>
          <a href="/privacy" className="hover:text-white">Privacy</a>
        </span>
      </div>
    </footer>
  );
}

/* ── FAQ ───────────────────────────────────────────────────────────────────────────────────────────────────────── */
const FAQ = [
  ["Is this just translation?", "No. Each audience gets its own script, tone and voice, written for them — then you approve it."],
  ["Will it change my price or offer?", "Never. Your facts are locked and checked in every version."],
  ["Which languages?", "Bengali, Hindi, Italian and English — the ones whose voices we tested properly. More are coming."],
  ["Do I need to design anything?", "No. Upload the ad you already have, paste its voiceover, and pick your audiences."],
  ["What happens to my original voiceover?", "Each version gets a new voice over your music. Text burned into your video stays; we add new text in the free space."],
  ["Can I change what it wrote?", "Yes. Edit any line yourself, or ask for changes in plain words and get a new version."],
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-[1200px] px-6 pt-28">
      <Reveal as="h2" className="text-center text-[36px] font-medium tracking-[-0.02em] sm:text-[48px]">
        Questions, answered plainly
      </Reveal>
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FAQ.map(([q, a], i) => (
          <Reveal key={q} delay={(i % 3) * 0.05} className="rounded-[20px] bg-white p-6 shadow-card">
            <h3 className="text-[16px] font-semibold">{q}</h3>
            <p className="mt-2 text-[14.5px] leading-[1.55] text-fg-2">{a}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
