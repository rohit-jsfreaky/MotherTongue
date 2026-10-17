"use client";

import { Brain, MegaphoneSimple, Plus, SignOut } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { signOut } from "@/app/app/actions";
import { startTopLoader } from "@/components/site/TopLoader";

const NAV = [
  { href: "/app", label: "Campaigns", icon: MegaphoneSimple, exact: true },
  { href: "/app/memory", label: "Brand memory", icon: Brain, exact: false },
];

export function Sidebar({ email, isDemo }: { email: string | null; isDemo: boolean }) {
  const path = usePathname();
  return (
    <aside className="sticky top-0 hidden h-svh w-[248px] shrink-0 flex-col border-r border-line bg-white px-4 py-5 md:flex">
      <div className="px-2">
        <Logo href="/app" />
      </div>
      <Link
        href="/app/new"
        className="mt-7 flex h-10 items-center justify-center gap-2 rounded-[12px] bg-lime text-[14px] font-semibold text-ink shadow-[var(--shadow-lime)] transition hover:bg-[#c4f00a]"
      >
        <Plus weight="bold" className="size-4" /> New campaign
      </Link>
      <nav className="mt-6 flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? path === href || path.startsWith("/app/c/") : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[14px] font-medium transition ${active ? "bg-violet-50 text-violet" : "text-fg-2 hover:bg-soft hover:text-fg"}`}
            >
              <Icon weight={active ? "fill" : "regular"} className="size-[18px]" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        {isDemo && (
          <div className="mb-4 rounded-[16px] bg-[linear-gradient(150deg,#5b41f8,#7b2cf0)] p-4 text-white">
            <div className="text-[13px] font-semibold">Sample workspace</div>
            <p className="mt-1 text-[12px] leading-snug text-white/80">Create your account to keep your work.</p>
            <Link href="/signup" className="mt-3 inline-flex h-8 items-center rounded-[10px] bg-lime px-3 text-[12.5px] font-semibold text-ink">
              Create account
            </Link>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-[12px] px-2 py-2">
          <span className="grid size-8 place-items-center rounded-full bg-soft text-[12px] font-semibold text-fg-2">
            {(email ?? "S").slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] text-fg-2">{email ?? "Guest (sample)"}</span>
          <form action={signOut} onSubmit={() => startTopLoader()}>
            <button aria-label="Sign out" className="grid size-8 place-items-center rounded-[8px] text-fg-3 hover:bg-soft hover:text-fg">
              <SignOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
