import { NewCampaignWizard } from "@/components/app/NewCampaignWizard";
import { PRESETS, TEMPLATES } from "@/lib/campaigns";

export const metadata = { title: "New campaign — MotherTongue" };

export default function NewCampaignPage() {
  const templates = Object.entries(TEMPLATES).map(([id, t]) => ({
    id,
    name: t.name,
    brand: t.brand.name,
    lines: t.scenes.map((s) =>
      s.line.voice.replace(/\{(\w+)\}/g, (m, k) => {
        const f = t.facts.find((x) => x.key === k);
        const d = f?.display;
        return typeof d === "string" ? d : d?.en ?? d?.default ?? m;
      }),
    ),
    facts: t.facts,
  }));
  return (
    <main className="mx-auto max-w-[1040px] px-5 py-8 sm:px-10">
      <h1 className="text-[28px] font-medium tracking-[-0.03em]">New campaign</h1>
      <p className="mt-1 text-[14px] text-fg-2">Three steps: your ad, who it&apos;s for, and the facts that must never change.</p>
      <NewCampaignWizard templates={templates} presets={PRESETS} />
    </main>
  );
}
