import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { AdTile } from "@/components/landing/AdTile";
import { byId } from "@/components/landing/samples";

export function AuthShell({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <main className="grid min-h-svh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">
          <h1 className="text-[34px] font-medium leading-tight tracking-[-0.03em]">{title}</h1>
          <p className="mb-8 mt-2 text-[15px] text-fg-2">{sub}</p>
          {children}
          <div className="mt-8 rounded-[16px] border border-line bg-white p-4 text-[13.5px] text-fg-2">
            Just looking?{" "}
            <Link href="/try" className="font-semibold text-violet">
              Try it with a sample ad
            </Link>{" "}
            — no account needed.
          </div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden lg:block">
        <div className="grain absolute inset-0 bg-[linear-gradient(160deg,#3d2fd6_0%,#5a45f5_45%,#c64fd6_80%,#ff9d5c_110%)]" />
        <div className="relative flex h-full flex-col justify-end p-14 text-white">
          <div className="absolute left-[14%] top-[12%] w-[34%] rotate-[-5deg] animate-float">
            <AdTile s={byId("chai-bn")} className="w-full shadow-float" />
          </div>
          <div className="absolute right-[12%] top-[20%] w-[30%] rotate-[4deg] animate-float" style={{ animationDelay: "1s" }}>
            <AdTile s={byId("stride-it")} className="w-full shadow-float" />
          </div>
          <p className="relative max-w-[420px] text-[30px] font-medium leading-[1.2] tracking-[-0.02em]">
            One ad. Every audience, in their own words.
          </p>
        </div>
      </div>
    </main>
  );
}
