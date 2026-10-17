import { notFound } from "next/navigation";
import { LogoMark } from "@/components/brand/Logo";
import { PrintButton } from "@/components/app/PrintButton";
import { getWorkspace } from "@/lib/data";
import type { AudienceRow, CampaignRow, VersionRow } from "@/lib/types";

export const metadata = { title: "Approval report — MotherTongue" };

export default async function ReportPage(props: PageProps<"/app/c/[id]/v/[vid]/report">) {
  const { id, vid } = await props.params;
  const { supabase, user } = await getWorkspace();
  const { data: version } = await supabase.from("versions").select("*").eq("id", vid).single();
  if (!version || version.campaign_id !== id) notFound();
  const v = version as VersionRow;
  const [{ data: campaign }, { data: audience }, { data: brand }] = await Promise.all([
    supabase.from("campaigns").select("*").eq("id", id).single(),
    supabase.from("audiences").select("*").eq("id", v.audience_id).single(),
    supabase.from("campaigns").select("brands(name)").eq("id", id).single(),
  ]);
  const c = campaign as CampaignRow;
  const a = audience as AudienceRow;
  const brandName = (brand as unknown as { brands: { name: string } | null })?.brands?.name ?? "";
  const rec = v.record;
  const blocking = (rec.issues ?? []).filter((i) => i.blocking);

  return (
    <main className="mx-auto max-w-[820px] bg-white px-8 py-10 print:px-0 print:py-0">
      <div className="flex items-center justify-between print:hidden">
        <PrintButton />
      </div>
      <header className="mt-6 flex items-center gap-3 border-b border-line pb-5">
        <LogoMark className="size-9" />
        <div>
          <div className="text-[20px] font-semibold tracking-[-0.02em]">Approval report</div>
          <div className="text-[13px] text-fg-2">MotherTongue · generated {new Date().toLocaleString()}</div>
        </div>
      </header>
      <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 text-[14px]">
        {[
          ["Brand", brandName],
          ["Campaign", c.name],
          ["Audience", a.label],
          ["Version", `v${v.n}`],
          ["Status", v.status === "approved" ? "Approved" : "Not approved yet"],
          ["Approved", v.approved_at ? `${new Date(v.approved_at).toLocaleString()} by ${user.email ?? "workspace owner"}` : "—"],
        ].map(([k, val]) => (
          <div key={k}>
            <dt className="text-[12px] uppercase tracking-wide text-fg-3">{k}</dt>
            <dd className="font-medium">{val}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-8 text-[16px] font-semibold">Facts check</h2>
      <table className="mt-2 w-full border border-line text-left text-[13.5px]">
        <thead className="bg-soft text-[12px] uppercase text-fg-3">
          <tr>
            <th className="px-3 py-2">Fact</th>
            <th className="px-3 py-2">On screen</th>
            <th className="px-3 py-2">In the voice</th>
          </tr>
        </thead>
        <tbody>
          {(rec.facts ?? []).map((f) => (
            <tr key={f.key} className="border-t border-line">
              <td className="px-3 py-2">{f.label}</td>
              <td className="px-3 py-2 font-mono text-[12.5px]">{f.display}</td>
              <td className="px-3 py-2">{f.spoken ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[13.5px]">
        {blocking.length
          ? `${blocking.length} fact problem(s) found — this version must not run until fixed.`
          : "Every fact present and unchanged in the script and on screen (code check + AI check of the script and the finished frames)."}
      </p>

      <h2 className="mt-8 text-[16px] font-semibold">Script</h2>
      <ol className="mt-2 flex flex-col gap-2 text-[13.5px]">
        {(rec.lines ?? []).map((l, i) => (
          <li key={l.scene} className="rounded-[10px] border border-line p-3">
            <div className="font-mono text-[11.5px] text-fg-3">Scene {i + 1}</div>
            <div className="font-medium">{l.voice_filled ?? l.voice}</div>
            {l.meaning_filled && <div className="italic text-fg-2">“{l.meaning_filled}”</div>}
            {l.screen_filled && <div className="text-fg-2">On screen: {l.screen_filled}</div>}
          </li>
        ))}
      </ol>

      <h2 className="mt-8 text-[16px] font-semibold">Disclosure</h2>
      <p className="mt-2 text-[13.5px] leading-relaxed">
        The voiceover in this version is AI-generated (synthetic voice, no real person&apos;s likeness or voice cloned without
        consent). The script was adapted by AI from the brand&apos;s master ad and reviewed and approved by a person. Where
        required (for example EU AI Act Art. 50), label the ad as containing AI-generated audio.
      </p>
    </main>
  );
}
