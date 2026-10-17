import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata = { title: "Log in — MotherTongue" };

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" sub="Log in to review your versions.">
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </AuthShell>
  );
}
