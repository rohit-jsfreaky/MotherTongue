"use client";

import { Check, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { addRule, deleteRule, setRuleEnabled, updateRule } from "@/app/app/actions";
import type { RuleRow } from "@/lib/types";

export function MemoryRules({
  brand,
  rules,
  campaignName,
}: {
  brand: { id: string; name: string };
  rules: RuleRow[];
  campaignName: Record<string, string>;
}) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [newRule, setNewRule] = useState("");
  const [lang, setLang] = useState("");

  return (
    <section className="mt-8 rounded-[22px] border border-line bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-semibold">{brand.name}</h2>
        <span className="text-[12.5px] text-fg-3">
          {rules.filter((r) => r.enabled).length} on · {rules.length} total
        </span>
      </div>
      <div className="mt-4 divide-y divide-line rounded-[16px] border border-line">
        {rules.length === 0 && (
          <p className="p-4 text-[13.5px] text-fg-2">
            Nothing learned yet. Ask for a change on any version — like “too formal” — and the rule shows up here.
          </p>
        )}
        {rules.map((r) => (
          <div key={r.id} className={`flex items-start gap-3 p-4 ${r.enabled ? "" : "opacity-55"}`}>
            <button
              role="switch"
              aria-checked={r.enabled}
              aria-label="Use this rule"
              disabled={pending}
              onClick={() => start(() => setRuleEnabled(r.id, !r.enabled))}
              className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition ${r.enabled ? "bg-violet" : "bg-line-2"}`}
            >
              <span className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${r.enabled ? "left-[18px]" : "left-0.5"}`} />
            </button>
            <div className="min-w-0 flex-1">
              {editing === r.id ? (
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="h-9 flex-1 rounded-[10px] border border-violet/50 px-3 text-[14px] outline-none"
                  />
                  <button
                    onClick={() =>
                      start(async () => {
                        await updateRule(r.id, draft);
                        setEditing(null);
                      })
                    }
                    className="grid size-9 place-items-center rounded-[10px] bg-ink text-white"
                    aria-label="Save"
                  >
                    <Check weight="bold" className="size-4" />
                  </button>
                </div>
              ) : (
                <p className="text-[14.5px] leading-snug">{r.text}</p>
              )}
              <div className="mt-1 flex flex-wrap gap-x-2 text-[12px] text-fg-3">
                <span className="rounded-md bg-violet-50 px-1.5 py-0.5 font-semibold text-violet">{r.scope_label}</span>
                <span>
                  {r.why}
                  {r.source_campaign_id && campaignName[r.source_campaign_id] ? ` · from “${campaignName[r.source_campaign_id]}”` : ""}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setEditing(r.id);
                setDraft(r.text);
              }}
              className="grid size-8 place-items-center rounded-[8px] text-fg-3 hover:bg-soft hover:text-fg"
              aria-label="Edit"
            >
              <PencilSimple className="size-4" />
            </button>
            <button
              disabled={pending}
              onClick={() => start(() => deleteRule(r.id))}
              className="grid size-8 place-items-center rounded-[8px] text-fg-3 hover:bg-bad-100 hover:text-bad"
              aria-label="Delete"
            >
              <Trash className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <form
        className="mt-4 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            await addRule(brand.id, newRule, lang || null);
            setNewRule("");
          });
        }}
      >
        <input
          value={newRule}
          onChange={(e) => setNewRule(e.target.value)}
          placeholder="Add your own rule — “Never use the word ‘cheap’”"
          className="h-10 min-w-[240px] flex-1 rounded-[12px] border border-line-2 px-3 text-[14px] outline-none focus:border-violet"
        />
        <select value={lang} onChange={(e) => setLang(e.target.value)} className="h-10 rounded-[12px] border border-line-2 px-2 text-[13.5px]">
          <option value="">All versions</option>
          <option value="bn">Bengali versions</option>
          <option value="hi">Hindi versions</option>
          <option value="it">Italian versions</option>
          <option value="en">English versions</option>
        </select>
        <button disabled={pending || !newRule.trim()} className="inline-flex h-10 items-center gap-1.5 rounded-[12px] bg-ink px-4 text-[13.5px] font-semibold text-white disabled:opacity-50">
          <Plus weight="bold" className="size-4" /> Add rule
        </button>
      </form>
    </section>
  );
}
