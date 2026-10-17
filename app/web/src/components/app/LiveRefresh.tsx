"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

/** Re-renders the page whenever the worker updates a version of this campaign (Supabase Realtime). */
export function LiveRefresh({ campaignId, poll = true }: { campaignId: string; poll?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`versions-${campaignId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "versions", filter: `campaign_id=eq.${campaignId}` }, () =>
        router.refresh(),
      )
      .subscribe();
    // Fallback while something is still being made, in case the socket drops.
    const t = poll ? setInterval(() => router.refresh(), 12000) : undefined;
    return () => {
      if (t) clearInterval(t);
      supabase.removeChannel(channel);
    };
  }, [campaignId, poll, router]);
  return null;
}
