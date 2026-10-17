import { ArrowLeft, CheckCircle, Warning } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompareGrid } from "@/components/app/CompareGrid";
import { LiveRefresh } from "@/components/app/LiveRefresh";
import { StatusPill } from "@/components/app/Status";
import { getWorkspace, signedUrls } from "@/lib/data";
import type { AudienceRow, CampaignRow, VersionRow } from "@/lib/types";
import { retry } from "../../actions";

export const metadata = { title: "Campaign — MotherTongue" };

export default async function CampaignPage(props: PageProps<"/app/c/[id]">) {
  const { id } = await props.params;
  const { tab } = (await props.searchParams) as { tab?: string };
  const { supabase } = await getWorkspace();
  const { data: campaign } = await supabase.from("campaigns").select("*").eq("id", id).single();
  if (!campaign) notFound();
  const c = campaign as CampaignRow;
  const [{ data: auds }, { data: vers }] = await Promise.all([
    supabase.from("audiences").select("*").eq("campaign_id", id).order("created_at"),
    supabase.from("versions").select("*").eq("campaign_id", id),
  ]);
  const audiences = (auds ?? []) as AudienceRow[];
  const versions = (vers ?? []) as VersionRow[];
  const latest = audiences.map((a) => versions.filter((v) => v.audience_id === a.id).sort((x, y) => y.n - x.n)[0]);
  const urls = await signedUrls(latest.flatMap((v) => [v?.mp4_path, v?.thumb_path]));
  const making = latest.some((v) => v && ["queued", "making", "waiting"].includes(v.status));
  const compare = tab === "compare";

  return (
    <main className="mx-auto max-w-[1240px] px-5 py-8 sm:px-10">
      <LiveRefresh campaignId={c.id} poll={making} />
      <Link href="/app" className="inline-flex items-center gap-1.5 text-[13px] text-fg-2 hover:text-fg">
        <ArrowLeft className="size-3.5" /> Campaigns
      </Link>
      <div className="mt-3 flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-[28px] font-medium tracking-[-0.03em]">{c.name}</h1>
          <p className="mt-1 text-[14px] text-fg-2">
            {audiences.length} audiences · {c.source === "upload" ? "your uploaded ad" : "sample ad"}
            {making && " · versions are being made — this page updates by itself"}
          </p>
        </div>
        <div className="ml-auto flex rounded-[12px] border border-line bg-white p-1 text-[13.5px] font-medium">
          <Link href={`/app/c/${c.id}`} className={`rounded-[9px] px-4 py-1.5 ${!compare ? "bg-ink text-white" : "text-fg-2"}`}>
            Versions
          </Link>
          <Link
            href={`/app/c/${c.id}?tab=compare`}
            className={`rounded-[9px] px-4 py-1.5 ${compare ? "bg-ink text-white" : "text-fg-2"}`}
          >
            Compare
          </Link>
        </div>
      </div>

      {compare ? (
        <div className="mt-8">
          <CompareGrid
            scenes={c.master.scenes.map((s) => s.id)}
            items={audiences.map((a, i) => ({
              id: a.id,
              label: a.label,
              url: latest[i]?.mp4_path ? urls[latest[i].mp4_path!] : null,
              poster: latest[i]?.thumb_path ? urls[latest[i].thumb_path!] : null,
              lines: (latest[i]?.record.lines ?? []).map((l) => l.voice_filled ?? l.voice),
            }))}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((a, i) => {
            const v = latest[i];
            const issues = v?.record.issues ?? [];
            const blocking = issues.filter((x) => x.blocking).length;
            const warnings = issues.length - blocking;
            return (
              <div key={a.id} className="overflow-hidden rounded-[22px] border border-line bg-white shadow-card">
                <div className="aspect-[9/16] bg-ink">
                  {v?.mp4_path ? (
                    <video
                      src={urls[v.mp4_path]}
                      poster={v.thumb_path ? urls[v.thumb_path] : undefined}
                      controls
                      playsInline
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center text-white">
                      <span className="size-8 animate-spin rounded-full border-2 border-white/15 border-t-white/70" />
                      <span className="text-[13px] capitalize text-white/80">{v?.status_note || `${v?.stage ?? "Queued"}…`}</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14.5px] font-semibold">{a.label}</span>
                    {v && v.n > 1 && <span className="font-mono text-[11.5px] text-fg-3">v{v.n}</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {v && <StatusPill status={v.status} stage={v.stage} />}
                    {v?.mp4_path &&
                      (blocking ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-bad-100 px-2 py-0.5 text-[11.5px] font-semibold text-bad">
                          <Warning weight="bold" className="size-3" /> Facts
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-ok-100 px-2 py-0.5 text-[11.5px] font-semibold text-ok">
                          <CheckCircle weight="bold" className="size-3" /> All facts
                        </span>
                      ))}
                    {v?.mp4_path && warnings > 0 && <span className="text-[11.5px] text-warn">{warnings} to look at</span>}
                  </div>
                  {v?.status === "failed" ? (
                    <form action={retry.bind(null, v.id)} className="mt-3">
                      <button className="h-9 w-full rounded-[11px] bg-ink text-[13px] font-semibold text-white">Try again</button>
                    </form>
                  ) : (
                    <Link
                      href={v ? `/app/c/${c.id}/v/${v.id}` : "#"}
                      className={`mt-3 flex h-9 items-center justify-center rounded-[11px] text-[13px] font-semibold ${v?.mp4_path ? "bg-ink text-white" : "pointer-events-none bg-soft text-fg-3"}`}
                    >
                      Review
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
