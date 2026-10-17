export type Fact = {
  key: string;
  label: string;
  kind: string;
  display: string | Record<string, string>;
  spoken?: string | Record<string, string>;
  overrides?: Record<string, { display?: string; spoken?: string }>;
};

export type Scene = {
  id: string;
  role: string;
  start: number;
  end: number;
  clip: string;
  clip_in?: number;
  text_band?: string;
  screen_max_words?: number;
  line: { voice: string; screen: string };
};

export type Master = {
  id?: string;
  name?: string;
  canvas: { w: number; h: number; fps: number };
  music?: string | null;
  music_path?: string | null;
  music_volume?: number;
  facts: Fact[];
  scenes: Scene[];
  brand?: { name: string; about?: string; tone?: string; never_change?: string[]; colours?: Record<string, string> };
};

export type Issue = { scene: string; field: string; code: string; message: string; by: string; blocking?: boolean };

export type Line = {
  scene: string;
  voice: string;
  screen: string;
  meaning: string;
  why: string;
  voice_filled?: string;
  screen_filled?: string;
  meaning_filled?: string;
  voice_seconds?: number;
  fit?: string;
};

export type VersionRecord = {
  language?: string;
  summary?: string;
  understood?: string;
  changes?: { scene: string; what: string; fields?: string[] }[];
  fact_requests?: { key: string; label: string; form: "spoken" | "display"; current: string; suggested: string; why: string }[];
  applied_rules?: string[];
  lines?: Line[];
  facts?: { key: string; label: string; display: string; spoken: string | null }[];
  picture?: { scene: string; facts: { fact: string; expected: string; on_screen: boolean }[]; problem?: string }[];
  issues?: Issue[];
  status?: string;
  cost?: { model_calls: number; gemma_calls: number; omnivoice_calls: number; seconds_by_stage: Record<string, number> };
  learned_rule?: { id: string; text: string; scope_label: string };
};

export type VersionRow = {
  id: string;
  campaign_id: string;
  audience_id: string;
  n: number;
  parent_id: string | null;
  status: "queued" | "waiting" | "making" | "ready" | "needs_look" | "approved" | "failed";
  stage: string;
  status_note: string;
  record: VersionRecord;
  mp4_path: string | null;
  srt_path: string | null;
  thumb_path: string | null;
  opened_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AudienceRow = {
  id: string;
  campaign_id: string;
  preset_id: string | null;
  label: string;
  city: string;
  language: string;
  tone: string;
  notes: string;
  voice: string;
};

export type CampaignRow = {
  id: string;
  workspace_id: string;
  brand_id: string;
  name: string;
  source: "template" | "upload";
  template_id: string | null;
  master: Master;
  master_path: string | null;
  created_at: string;
  updated_at: string;
};

export type BrandRow = {
  id: string;
  workspace_id: string;
  name: string;
  about: string;
  tone: string;
  never_change: string[];
  colours: Record<string, string>;
};

export type RuleRow = {
  id: string;
  brand_id: string;
  text: string;
  scope: Record<string, string>;
  scope_label: string;
  why: string;
  enabled: boolean;
  source_campaign_id: string | null;
  created_at: string;
};

export const LANGUAGE_NAMES: Record<string, string> = { en: "English", hi: "Hindi", bn: "Bengali", it: "Italian" };
