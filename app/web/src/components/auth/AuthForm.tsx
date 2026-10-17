"use client";

import { ArrowRight, CircleNotch } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { startTopLoader } from "@/components/site/TopLoader";
import { Button } from "@/components/ui/Button";
import { supabaseBrowser } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(params.get("error") ? "That didn't work — please try again." : "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const supabase = supabaseBrowser();
    const { data: current } = await supabase.auth.getUser();
    let err: { message: string } | null = null;
    if (mode === "signup") {
      if (current.user?.is_anonymous) {
        // Keep everything made in the sample workspace: turn the anonymous user into a real account.
        ({ error: err } = await supabase.auth.updateUser({ email, password }));
      } else {
        ({ error: err } = await supabase.auth.signUp({ email, password }));
      }
    } else {
      ({ error: err } = await supabase.auth.signInWithPassword({ email, password }));
    }
    if (err) {
      setError(err.message);
      setBusy(false);
      return;
    }
    startTopLoader();
    router.push(params.get("next") || "/app");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-[13px] font-medium">
        Work email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 rounded-[12px] border border-line-2 bg-white px-3.5 text-[15px] outline-none transition focus:border-violet focus:ring-4 focus:ring-violet/15"
          placeholder="you@brand.com"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-[13px] font-medium">
        Password
        <input
          type="password"
          required
          minLength={8}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 rounded-[12px] border border-line-2 bg-white px-3.5 text-[15px] outline-none transition focus:border-violet focus:ring-4 focus:ring-violet/15"
          placeholder={mode === "signup" ? "At least 8 characters" : ""}
        />
      </label>
      {error && <p className="rounded-[10px] bg-bad-100 px-3 py-2 text-[13px] text-bad">{error}</p>}
      <Button type="submit" variant="ink" size="lg" disabled={busy} className="mt-1">
        {busy ? <CircleNotch className="size-4 animate-spin" /> : null}
        {mode === "signup" ? "Create account" : "Log in"}
        {!busy && <ArrowRight weight="bold" className="size-4" />}
      </Button>
      <p className="text-center text-[13.5px] text-fg-2">
        {mode === "signup" ? (
          <>
            Already have an account? <Link href="/login" className="font-semibold text-violet">Log in</Link>
          </>
        ) : (
          <>
            New here? <Link href="/signup" className="font-semibold text-violet">Create an account</Link>
          </>
        )}
      </p>
    </form>
  );
}
