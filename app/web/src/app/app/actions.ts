"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PRESETS, TEMPLATES, brandForTemplate, createCampaign, type AudiencePreset } from "@/lib/campaigns";
import { enqueue, getWorkspace, requireUser } from "@/lib/data";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Fact, Master, VersionRow } from "@/lib/types";

export async function signOut() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut();
  redirect("/");
}

function pickAudiences(ids: string[], custom: AudiencePreset[] = []) {
  const chosen = PRESETS.filter((p) => ids.includes(p.id));
  return [...chosen, ...custom].slice(0, 5);
}

/* ── New campaign from a sample ad ────────────────────────────────────────────────────────────────────────────── */
export async function createFromTemplate(input: {
  templateId: string;
  name: string;
  audienceIds: string[];
  custom: AudiencePreset[];
  facts: Fact[];
}) {
  const { workspace } = await getWorkspace();
  const t = TEMPLATES[input.templateId];
  if (!t) throw new Error("Unknown sample ad");
  const audiences = pickAudiences(input.audienceIds, input.custom);
  if (!audiences.length) throw new Error("Pick at least one audience");
  const brand = await brandForTemplate(workspace.id, t);
  const master: Master = { ...t, facts: input.facts?.length ? input.facts : t.facts };
  const campaign = await createCampaign({
    workspaceId: workspace.id,
    brandId: brand.id,
    name: input.name || t.name,
    source: "template",
    templateId: input.templateId,
    master,
    audiences,
  });
  redirect(`/app/c/${campaign.id}`);
}

/* ── Upload: the browser uploads straight to storage with a signed URL; we only get the path back ─────────────── */
export async function uploadTicket(kind: "video" | "music", fileName: string) {
  const { workspace } = await getWorkspace();
  const ext = kind === "video" ? "mp4" : (fileName.split(".").pop() || "mp3").toLowerCase().slice(0, 4);
  const path = `${workspace.id}/uploads/${randomUUID()}.${ext}`;
  const { data, error } = await supabaseAdmin().storage.from("media").createSignedUploadUrl(path);
  if (error || !data) throw new Error("Could not start the upload");
  return { path: data.path, token: data.token };
}

export async function createFromUpload(input: {
  name: string;
  brand: { name: string; tone: string; neverChange: string[] };
  videoPath: string;
  musicPath: string | null;
  lines: { text: string; start: number; end: number; screen: string }[];
  facts: Fact[];
  audienceIds: string[];
  custom: AudiencePreset[];
}) {
  const { workspace } = await getWorkspace();
  if (!input.videoPath.startsWith(`${workspace.id}/`)) throw new Error("Not your upload");
  const audiences = pickAudiences(input.audienceIds, input.custom);
  if (!audiences.length) throw new Error("Pick at least one audience");
  if (!input.lines.length) throw new Error("Paste the voiceover script");
  const db = supabaseAdmin();
  const { data: brand, error } = await db
    .from("brands")
    .insert({
      workspace_id: workspace.id,
      name: input.brand.name || "My brand",
      tone: input.brand.tone,
      never_change: input.brand.neverChange,
      colours: { accent: "#D1FE17", ink: "#05050A" },
    })
    .select()
    .single();
  if (error) throw error;
  const master: Master = {
    canvas: { w: 720, h: 1280, fps: 30 },
    music: input.musicPath ? "music.mp3" : null,
    music_path: input.musicPath,
    music_volume: 0.35,
    facts: input.facts,
    scenes: input.lines.map((l, i) => ({
      id: `s${i + 1}`,
      role: /\{PRICE\}|\{OFFER\}/.test(l.text + l.screen) ? "price" : i === 0 ? "hook" : i === input.lines.length - 1 ? "cta" : "product",
      start: Math.round(l.start * 100) / 100,
      end: Math.round(l.end * 100) / 100,
      clip: "master.mp4",
      clip_in: Math.round(l.start * 100) / 100,
      line: { voice: l.text, screen: l.screen },
    })),
  };
  const campaign = await createCampaign({
    workspaceId: workspace.id,
    brandId: brand.id,
    name: input.name || "My ad",
    source: "upload",
    master,
    masterPath: input.videoPath,
    audiences,
  });
  redirect(`/app/c/${campaign.id}`);
}

/* ── Review actions ───────────────────────────────────────────────────────────────────────────────────────────── */
async function ownVersion(versionId: string) {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("versions").select("*").eq("id", versionId).single();
  if (!data) throw new Error("Version not found");
  return { user, version: data as VersionRow };
}

async function nextVersion(parent: VersionRow) {
  const db = supabaseAdmin();
  const { data: siblings } = await db.from("versions").select("n").eq("audience_id", parent.audience_id).order("n", { ascending: false }).limit(1);
  const n = (siblings?.[0]?.n ?? parent.n) + 1;
  const { data, error } = await db
    .from("versions")
    .insert({ campaign_id: parent.campaign_id, audience_id: parent.audience_id, n, parent_id: parent.id, status: "queued", stage: "queued" })
    .select()
    .single();
  if (error) throw error;
  return data as VersionRow;
}

export async function requestChanges(versionId: string, text: string, chips: string[]) {
  const { user, version } = await ownVersion(versionId);
  if (!text.trim() && !chips.length) throw new Error("Say what you'd like to change");
  const db = supabaseAdmin();
  const { data: fb } = await db
    .from("feedback")
    .insert({ version_id: version.id, kind: "request", text: text.trim(), chips, created_by: user.id })
    .select()
    .single();
  const next = await nextVersion(version);
  await enqueue("revise", next.id, version.campaign_id, { request: text.trim(), chips, feedback_id: fb?.id });
  redirect(`/app/c/${version.campaign_id}/v/${next.id}`);
}

export async function editLine(versionId: string, scene: string, field: "voice" | "screen", text: string) {
  const { user, version } = await ownVersion(versionId);
  if (!text.trim()) throw new Error("The line can't be empty");
  const db = supabaseAdmin();
  const { data: fb } = await db
    .from("feedback")
    .insert({ version_id: version.id, kind: "edit", text: text.trim(), scene, detail: { field }, created_by: user.id })
    .select()
    .single();
  const next = await nextVersion(version);
  await enqueue("edit_line", next.id, version.campaign_id, { scene, field, text: text.trim(), feedback_id: fb?.id });
  redirect(`/app/c/${version.campaign_id}/v/${next.id}`);
}

export async function approve(versionId: string) {
  const { user, version } = await ownVersion(versionId);
  const blocking = (version.record.issues ?? []).filter((i) => i.blocking);
  if (blocking.length) throw new Error("Fix the flagged facts before approving");
  if (!["ready", "needs_look"].includes(version.status)) throw new Error("This version isn't ready yet");
  const db = supabaseAdmin();
  await db.from("versions").update({ status: "approved", approved_at: new Date().toISOString(), approved_by: user.id }).eq("id", version.id);
  await db.from("feedback").insert({ version_id: version.id, kind: "approve", created_by: user.id });
  revalidatePath(`/app/c/${version.campaign_id}`);
}

export async function markOpened(versionId: string) {
  const { version } = await ownVersion(versionId);
  if (!version.opened_at) await supabaseAdmin().from("versions").update({ opened_at: new Date().toISOString() }).eq("id", version.id);
}

export async function retry(versionId: string) {
  const { version } = await ownVersion(versionId);
  if (version.status !== "failed") return;
  await supabaseAdmin().from("versions").update({ status: "queued", stage: "queued", status_note: "" }).eq("id", version.id);
  await enqueue(version.parent_id ? "rerender" : "make_version", version.id, version.campaign_id);
  revalidatePath(`/app/c/${version.campaign_id}`);
}

/** The marketer confirms a fact change the AI suggested (facts are never changed by the model itself). */
export async function applyFactChange(versionId: string, key: string, form: "spoken" | "display", value: string) {
  const { user, version } = await ownVersion(versionId);
  const db = supabaseAdmin();
  const { data: campaign } = await db.from("campaigns").select("master").eq("id", version.campaign_id).single();
  const { data: audience } = await db.from("audiences").select("language").eq("id", version.audience_id).single();
  if (!campaign || !audience) throw new Error("Campaign not found");
  const master = campaign.master as Master;
  const fact = master.facts.find((f) => f.key === key);
  if (!fact) throw new Error("Unknown fact");
  const current = fact[form];
  const asMap: Record<string, string> =
    typeof current === "object" && current ? { ...current } : { default: (current as string) ?? "" };
  asMap[audience.language as string] = value.trim();
  fact[form] = asMap;
  await db.from("campaigns").update({ master, updated_at: new Date().toISOString() }).eq("id", version.campaign_id);
  await db.from("feedback").insert({ version_id: version.id, kind: "fact_change", text: value.trim(), detail: { key, form }, created_by: user.id });
  const next = await nextVersion(version);
  await enqueue("rerender", next.id, version.campaign_id);
  redirect(`/app/c/${version.campaign_id}/v/${next.id}`);
}

/* ── Brand memory ─────────────────────────────────────────────────────────────────────────────────────────────── */
export async function setRuleEnabled(ruleId: string, enabled: boolean) {
  const { supabase } = await requireUser();
  await supabase.from("memory_rules").update({ enabled }).eq("id", ruleId);
  revalidatePath("/app/memory");
}

export async function updateRule(ruleId: string, text: string) {
  const { supabase } = await requireUser();
  if (text.trim()) await supabase.from("memory_rules").update({ text: text.trim() }).eq("id", ruleId);
  revalidatePath("/app/memory");
}

export async function deleteRule(ruleId: string) {
  const { supabase } = await requireUser();
  await supabase.from("memory_rules").delete().eq("id", ruleId);
  revalidatePath("/app/memory");
}

export async function addRule(brandId: string, text: string, language: string | null) {
  const { supabase } = await requireUser();
  if (!text.trim()) return;
  await supabase.from("memory_rules").insert({
    brand_id: brandId,
    text: text.trim(),
    scope: language ? { language } : {},
    scope_label: language ? `${{ en: "English", hi: "Hindi", bn: "Bengali", it: "Italian" }[language] ?? language} versions` : "All versions",
    why: "Added by you",
  });
  revalidatePath("/app/memory");
}
