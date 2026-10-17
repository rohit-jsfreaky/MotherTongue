import { ArrowLeft } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LiveRefresh } from "@/components/app/LiveRefresh";
import { ReviewPanel } from "@/components/app/ReviewPanel";
import { StatusPill } from "@/components/app/Status";
import { getWorkspace, signedUrls } from "@/lib/data";
import type { AudienceRow, CampaignRow, RuleRow, VersionRow } from "@/lib/types";
import { markOpened } from "../../../../actions";

export const metadata = { title: "Review — MotherTongue" };

export default async function ReviewPage(props: PageProps<"/app/c/[id]/v/[vid]">) {
  const { id, vid } = await props.params;
  const { supabase } = await getWorkspace();
  const { data: version } = await supabase.from("versions").select("*").eq("id", vid).single();
  if (!version || version.campaign_id !== id) notFound();
  const v = version as VersionRow;
  const [{ data: campaign }, { data: audience }, { data: siblings }] = await Promise.all([
    supabase.from("campaigns").select("*").eq("id", id).single(),
    supabase.from("audiences").select("*").eq("id", v.audience_id).single(),
    supabase.from("versions").select("*").eq("audience_id", v.audience_id).order("n"),
  ]);
  const c = campaign as CampaignRow;
  const a = audience as AudienceRow;
  const history = (siblings ?? []) as VersionRow[];
  const { data: feedback } = await supabase
    .from("feedback")
    .select("*")
    .in("version_id", history.map((h) => h.id))
    .order("created_at");
  const { data: rules } = await supabase.from("memory_rules").select("*").eq("brand_id", c.brand_id);
  const parent = v.parent_id ? history.find((h) => h.id === v.parent_id) ?? null : null;
  const urls = await signedUrls([v.mp4_path, v.srt_path, v.thumb_path]);
  if (v.mp4_path && !v.opened_at) await markOpened(v.id);
  const making = ["queued", "making", "waiting"].includes(v.status);

  return (
    <main className="mx-auto max-w-[1280px] px-5 py-8 sm:px-10">
      <LiveRefresh campaignId={c.id} poll={making} />
      <Link href={`/app/c/${c.id}`} className="inline-flex items-center gap-1.5 text-[13px] text-fg-2 hover:text-fg">
        <ArrowLeft className="size-3.5" /> {c.name}
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-[28px] font-medium tracking-[-0.03em]">{a.label}</h1>
        <span className="rounded-full bg-soft px-2.5 py-0.5 font-mono text-[12.5px] text-fg-2">v{v.n}</span>
        <StatusPill status={v.status} stage={v.stage} />
      </div>
      <ReviewPanel
        campaignId={c.id}
        version={v}
        parent={parent}
        audience={a}
        master={c.master}
        history={history.map((h) => ({ id: h.id, n: h.n, status: h.status, created_at: h.created_at }))}
        feedback={(feedback ?? []).map((f) => ({ version_id: f.version_id, kind: f.kind, text: f.text, chips: f.chips, created_at: f.created_at }))}
        rules={(rules ?? []) as RuleRow[]}
        media={{
          mp4: v.mp4_path ? urls[v.mp4_path] : null,
          srt: v.srt_path ? urls[v.srt_path] : null,
          poster: v.thumb_path ? urls[v.thumb_path] : null,
        }}
      />
    </main>
  );
}
