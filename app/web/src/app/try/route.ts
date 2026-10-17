import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { PRESETS, TEMPLATES, brandForTemplate, createCampaign } from "@/lib/campaigns";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * One click, no form: signs the visitor in anonymously, creates a private sample workspace with three sample ads
 * (each already made for four audiences), and opens the dashboard.
 */
export async function GET(request: NextRequest) {
  const dashboard = new URL("/app", request.url);
  const response = NextResponse.redirect(dashboard);
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (all) => all.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });

  let {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) return NextResponse.redirect(new URL("/login?error=try", request.url));
    user = data.user;
  }

  const db = supabaseAdmin();
  const { data: existing } = await db.from("workspaces").select("id").eq("owner_id", user.id).limit(1);
  if (existing?.length) return response;

  const { data: ws, error } = await db
    .from("workspaces")
    .insert({ owner_id: user.id, name: "Sample workspace", is_demo: true })
    .select()
    .single();
  if (error || !ws) return NextResponse.redirect(new URL("/login?error=try", request.url));

  const audiences = PRESETS.filter((p) => ["kolkata-bn", "lucknow-hi", "milan-it", "global-en"].includes(p.id));
  for (const [id, t] of Object.entries(TEMPLATES)) {
    const brand = await brandForTemplate(ws.id, t);
    await createCampaign({
      workspaceId: ws.id,
      brandId: brand.id,
      name: t.name.replace(/ — .*/, "") + " · launch ad",
      source: "template",
      templateId: id,
      master: t,
      audiences,
      usePrerendered: true,
    });
  }
  return response;
}
