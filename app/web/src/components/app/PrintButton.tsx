"use client";

import { Printer } from "@phosphor-icons/react";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="inline-flex h-9 items-center gap-1.5 rounded-[11px] bg-ink px-3 text-[13px] font-semibold text-white">
      <Printer className="size-4" /> Print or save as PDF
    </button>
  );
}
