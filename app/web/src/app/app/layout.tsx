import Link from "next/link";
import { Sidebar } from "@/components/app/Sidebar";
import { LogoMark } from "@/components/brand/Logo";
import { getWorkspace } from "@/lib/data";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const { user, workspace } = await getWorkspace();
  return (
    <div className="flex min-h-svh bg-page">
      <Sidebar email={user.email ?? null} isDemo={workspace.is_demo || Boolean(user.is_anonymous)} />
      <div className="min-w-0 flex-1">
        <div className="flex h-14 items-center gap-3 border-b border-line bg-white px-5 md:hidden">
          <LogoMark />
          <Link href="/app" className="text-[15px] font-semibold">Campaigns</Link>
          <Link href="/app/memory" className="text-[15px] text-fg-2">Memory</Link>
          <Link href="/app/new" className="ml-auto rounded-[10px] bg-lime px-3 py-1.5 text-[13px] font-semibold">New</Link>
        </div>
        {children}
      </div>
    </div>
  );
}
