import { Brain } from "@phosphor-icons/react/ssr";
import { MemoryRules } from "@/components/app/MemoryRules";
import { getWorkspace } from "@/lib/data";
import type { BrandRow, RuleRow } from "@/lib/types";

export const metadata = { title: "Brand memory — MotherTongue" };

export default async function MemoryPage() {
  const { supabase, workspace } = await getWorkspace();
  const { data: brands } = await supabase.from("brands").select("*").eq("workspace_id", workspace.id).order("created_at");
  const ids = (brands ?? []).map((b) => b.id);
  const { data: rules } = await supabase
    .from("memory_rules")
    .select("*")
    .in("brand_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: false });
  const { data: campaigns } = await supabase.from("campaigns").select("id,name").eq("workspace_id", workspace.id);
  const campaignName = Object.fromEntries((campaigns ?? []).map((c) => [c.id, c.name]));

  return (
    <main className="mx-auto max-w-[980px] px-5 py-8 sm:px-10">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-violet-50">
          <Brain weight="fill" className="size-6 text-violet" />
        </span>
        <div>
          <h1 className="text-[28px] font-medium tracking-[-0.03em]">Brand memory</h1>
          <p className="text-[14px] text-fg-2">
            What MotherTongue learned from your changes and edits. It&apos;s applied to every new version — and it&apos;s yours to edit.
          </p>
        </div>
      </div>
      {!brands?.length ? (
        <p className="mt-10 text-[14px] text-fg-2">Your brands appear here after your first campaign.</p>
      ) : (
        (brands as BrandRow[]).map((b) => (
          <MemoryRules
            key={b.id}
            brand={{ id: b.id, name: b.name }}
            rules={((rules ?? []) as RuleRow[]).filter((r) => r.brand_id === b.id)}
            campaignName={campaignName}
          />
        ))
      )}
    </main>
  );
}
