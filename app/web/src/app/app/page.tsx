import { Brain, Plus, UploadSimple } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { StatusPill } from "@/components/app/Status";
import { getWorkspace, signedUrls } from "@/lib/data";
import type { AudienceRow, CampaignRow, VersionRow } from "@/lib/types";

export const metadata = { title: "Campaigns — MotherTongue" };

export default async function Dashboard() {
  const { supabase, workspace } = await getWorkspace();
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false });
  const ids = (campaigns ?? []).map((c) => c.id);
  const [{ data: versions }, { data: audiences }, { count: rules }] = await Promise.all([
    supabase.from("versions").select("*").in("campaign_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("audiences").select("*").in("campaign_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("memory_rules").select("id", { count: "exact", head: true }).eq("enabled", true),
  ]);
  const vs = (versions ?? []) as VersionRow[];
  const urls = await signedUrls(vs.map((v) => v.thumb_path));
  const thisMonth = vs.filter((v) => v.mp4_path && new Date(v.created_at).getMonth() === new Date().getMonth()).length;

  return (
    <main className="mx-auto max-w-[1240px] px-5 py-8 sm:px-10">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-[30px] font-medium tracking-[-0.03em]">Campaigns</h1>
          <p className="mt-1 text-[14px] text-fg-2">One ad in, a version for every audience out.</p>
        </div>
        <div className="ml-auto flex gap-2">
          <div className="rounded-[14px] border border-line bg-white px-4 py-2 text-[12.5px] text-fg-2">
            <span className="font-mono text-[15px] font-medium text-fg">{thisMonth}</span> versions made this month
          </div>
          <Link href="/app/memory" className="flex items-center gap-1.5 rounded-[14px] border border-line bg-white px-4 py-2 text-[12.5px] text-fg-2 hover:border-violet/40">
            <Brain weight="fill" className="size-4 text-violet" />
            Brand memory: <span className="font-mono text-[15px] font-medium text-fg">{rules ?? 0}</span> rules
          </Link>
        </div>
      </div>

      {!campaigns?.length ? (
        <div className="mt-10 rounded-[24px] border border-dashed border-line-2 bg-white p-14 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-violet-50">
            <UploadSimple weight="bold" className="size-6 text-violet" />
          </span>
          <h2 className="mt-5 text-[22px] font-medium tracking-[-0.02em]">Upload your first ad</h2>
          <p className="mx-auto mt-2 max-w-[420px] text-[14px] text-fg-2">
            A finished video and its voiceover script — or start from one of our sample ads.
          </p>
          <Link href="/app/new" className="mt-6 inline-flex h-11 items-center gap-2 rounded-[12px] bg-ink px-5 text-[14px] font-semibold text-white">
            <Plus weight="bold" className="size-4" /> New campaign
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {(campaigns as CampaignRow[]).map((c) => {
            const cv = vs.filter((v) => v.campaign_id === c.id);
            const latest = new Map<string, VersionRow>();
            cv.forEach((v) => {
              const cur = latest.get(v.audience_id);
              if (!cur || v.n > cur.n) latest.set(v.audience_id, v);
            });
            const lv = [...latest.values()];
            const auds = ((audiences ?? []) as AudienceRow[]).filter((a) => a.campaign_id === c.id);
            const thumbs = lv.map((v) => (v.thumb_path ? urls[v.thumb_path] : null)).filter(Boolean).slice(0, 4) as string[];
            const counts = {
              approved: lv.filter((v) => v.status === "approved").length,
              review: lv.filter((v) => v.status === "ready" || v.status === "needs_look").length,
              making: lv.filter((v) => ["queued", "making", "waiting"].includes(v.status)).length,
            };
            return (
              <Link
                key={c.id}
                href={`/app/c/${c.id}`}
                className="group overflow-hidden rounded-[22px] border border-line bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-float"
              >
                <div className="flex h-[190px] gap-1.5 bg-[linear-gradient(135deg,#efeaff,#fde7ef)] p-3">
                  {thumbs.length ? (
                    thumbs.map((t) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={t} src={t} alt="" className="h-full min-w-0 flex-1 rounded-[12px] object-cover" />
                    ))
                  ) : (
                    <div className="grid flex-1 place-items-center text-[13px] text-fg-2">Making your versions…</div>
                  )}
                </div>
                <div className="p-5">
                  <div className="text-[16px] font-semibold tracking-[-0.01em]">{c.name}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {auds.map((a) => (
                      <span key={a.id} className="rounded-full bg-soft px-2 py-0.5 text-[11.5px] font-medium text-fg-2">
                        {a.label}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {counts.making > 0 && <StatusPill status="making" stage={`Making ${counts.making}`} />}
                    {counts.review > 0 && <StatusPill status="ready" />}
                    {counts.approved > 0 && <StatusPill status="approved" />}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
