import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { kickWorker } from "./kick";
import { supabaseAdmin } from "./supabase/admin";
import { supabaseServer } from "./supabase/server";

/**
 * The signed-in user (anonymous demo users included) or a redirect to login. The session token is verified locally
 * against the project's public signing key (getClaims), so no page waits on a round trip to the auth server.
 */
export const requireUser = cache(async () => {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/login");
  const user = {
    id: claims.sub,
    email: typeof claims.email === "string" && claims.email ? claims.email : null,
    is_anonymous: claims.is_anonymous === true,
  };
  return { supabase, user };
});

/** The user's workspace (one per user in this build). Created on first visit after sign-up. Layout and page share it. */
export const getWorkspace = cache(async () => {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("workspaces").select("*").order("created_at").limit(1);
  let ws = data?.[0];
  if (!ws) {
    const { data: created, error } = await supabase
      .from("workspaces")
      .insert({ owner_id: user.id, name: "My workspace", is_demo: Boolean(user.is_anonymous) })
      .select()
      .single();
    if (error) throw error;
    ws = created;
  }
  return { supabase, user, workspace: ws as { id: string; name: string; is_demo: boolean; owner_id: string } };
});

/** Short-lived links to private media. Only called after RLS has confirmed the row belongs to the user. */
export async function signedUrls(paths: (string | null | undefined)[], seconds = 3600) {
  const clean = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  if (!clean.length) return {} as Record<string, string>;
  const { data } = await supabaseAdmin().storage.from("media").createSignedUrls(clean, seconds);
  const out: Record<string, string> = {};
  data?.forEach((d) => {
    if (d.path && d.signedUrl) out[d.path] = d.signedUrl;
  });
  return out;
}

/** Enqueue a job for the worker. The app never waits for it; the version row reports progress. */
export async function enqueue(kind: string, versionId: string, campaignId: string, payload: Record<string, unknown> = {}) {
  const { error } = await supabaseAdmin()
    .from("jobs")
    .insert({ kind, version_id: versionId, campaign_id: campaignId, payload });
  if (error) throw error;
  await kickWorker();
}
