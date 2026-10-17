import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Service client for trusted server code only (job queue, signed URLs, demo seeding). Never import in client code. */
export function supabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
