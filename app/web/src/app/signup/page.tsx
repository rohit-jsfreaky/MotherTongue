import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata = { title: "Start free — MotherTongue" };

export default function SignupPage() {
  return (
    <AuthShell title="Start free" sub="3 versions on your own ad. No credit card.">
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </AuthShell>
  );
}
