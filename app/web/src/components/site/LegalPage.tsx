import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-[760px] px-6 py-10">
      <Logo />
      <h1 className="mt-10 text-[36px] font-medium tracking-[-0.03em]">{title}</h1>
      <p className="mt-1 text-[13px] text-fg-3">Last updated {updated}</p>
      <div className="mt-8 flex flex-col gap-4 text-[15px] leading-relaxed text-fg-2 [&_h2]:mt-4 [&_h2]:text-[18px] [&_h2]:font-semibold [&_h2]:text-fg">
        {children}
      </div>
    </main>
  );
}
