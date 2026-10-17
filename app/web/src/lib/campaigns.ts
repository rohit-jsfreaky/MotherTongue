import "server-only";
import audiencesJson from "@/data/audiences.json";
import chai from "@/data/templates/kettle-and-kadak.json";
import mitti from "@/data/templates/mitti.json";
import stride from "@/data/templates/stride.json";
import { kickWorker } from "./kick";
import { supabaseAdmin } from "./supabase/admin";
import type { Master } from "./types";

type Template = Master & { id: string; name: string; brand: NonNullable<Master["brand"]> };

export const TEMPLATES: Record<string, Template> = {
  "kettle-and-kadak": chai as unknown as Template,
  stride: stride as unknown as Template,
  mitti: mitti as unknown as Template,
};

export type AudiencePreset = { id: string; label: string; city: string; language: string; tone: string; notes: string; voice: string };
export const PRESETS = audiencesJson as AudiencePreset[];

/** Pre-rendered sample versions (made by the worker on AMD and uploaded to storage) — used by the demo workspace. */
type Prerendered = Record<string, Record<string, { mp4_path: string; srt_path: string; thumb_path: string; record: unknown; status: string }>>;
let prerendered: Prerendered = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  prerendered = require("@/data/samples-rendered.json") as Prerendered;
} catch {
  prerendered = {};
}

export async function brandForTemplate(workspaceId: string, t: Template) {
  const db = supabaseAdmin();
  const { data: existing } = await db.from("brands").select("*").eq("workspace_id", workspaceId).eq("name", t.brand.name).limit(1);
  if (existing?.[0]) return existing[0];
  const { data, error } = await db
    .from("brands")
    .insert({
      workspace_id: workspaceId,
      name: t.brand.name,
      about: t.brand.about ?? "",
      tone: t.brand.tone ?? "",
      never_change: t.brand.never_change ?? [],
      colours: t.brand.colours ?? {},
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Create a campaign with one version per audience. Versions start "queued" and a job is enqueued for each — unless a
 * pre-rendered sample exists for that template + audience (demo workspace), in which case it starts ready.
 */
export async function createCampaign(opts: {
  workspaceId: string;
  brandId: string;
  name: string;
  source: "template" | "upload";
  templateId?: string;
  master: Master;
  masterPath?: string | null;
  audiences: AudiencePreset[];
  usePrerendered?: boolean;
}) {
  const db = supabaseAdmin();
  const { brand, ...master } = opts.master;
  void brand;
  const { data: campaign, error } = await db
    .from("campaigns")
    .insert({
      workspace_id: opts.workspaceId,
      brand_id: opts.brandId,
      name: opts.name,
      source: opts.source,
      template_id: opts.templateId ?? null,
      master,
      master_path: opts.masterPath ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  // Batched: one insert for all audiences, one for all versions, one for all jobs.
  const { data: auds, error: aErr } = await db
    .from("audiences")
    .insert(
      opts.audiences.map((a) => ({
        campaign_id: campaign.id,
        preset_id: a.id.startsWith("custom-") ? null : a.id,
        label: a.label,
        city: a.city,
        language: a.language,
        tone: a.tone,
        notes: a.notes,
        voice: a.voice,
      })),
    )
    .select();
  if (aErr || !auds) throw aErr ?? new Error("Could not save audiences");
  const presetOf = (row: { preset_id: string | null }, i: number) => row.preset_id ?? opts.audiences[i]?.id;
  const { data: vers, error: vErr } = await db
    .from("versions")
    .insert(
      auds.map((aud, i) => {
        const pre = opts.usePrerendered && opts.templateId ? prerendered[opts.templateId]?.[presetOf(aud, i)] : undefined;
        return {
          campaign_id: campaign.id,
          audience_id: aud.id,
          n: 1,
          status: pre ? pre.status : "queued",
          stage: pre ? "done" : "queued",
          record: pre ? pre.record : {},
          mp4_path: pre?.mp4_path ?? null,
          srt_path: pre?.srt_path ?? null,
          thumb_path: pre?.thumb_path ?? null,
        };
      }),
    )
    .select();
  if (vErr || !vers) throw vErr ?? new Error("Could not save versions");
  const queued = vers.filter((v) => v.status === "queued");
  if (queued.length) {
    await db.from("jobs").insert(queued.map((v) => ({ kind: "make_version", version_id: v.id, campaign_id: campaign.id, payload: {} })));
  }
  if (queued.length) await kickWorker();
  return campaign;
}

export function hasPrerendered(templateId: string) {
  return Boolean(prerendered[templateId] && Object.keys(prerendered[templateId]).length);
}
