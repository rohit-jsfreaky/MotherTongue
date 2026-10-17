import { LegalPage } from "@/components/site/LegalPage";

export const metadata = { title: "Terms — MotherTongue" };

export default function Terms() {
  return (
    <LegalPage title="Terms" updated="17 October 2026">
      <p>By using MotherTongue you agree to these terms.</p>
      <h2>Your content</h2>
      <p>You keep all rights to the ads, scripts, music and brand facts you upload, and to the versions you approve. Only upload material you have the rights to use.</p>
      <h2>You approve every version</h2>
      <p>MotherTongue checks your locked facts and flags problems, but you review and approve each version before it runs. You are responsible for the ads you publish, including labelling AI-generated audio where the law requires it.</p>
      <h2>Fair use</h2>
      <p>No unlawful, hateful or misleading ads, no impersonation of real people, and no attempts to break or overload the service.</p>
      <h2>Launch pricing</h2>
      <p>The free plan includes 3 versions on your own ad. Paid plans are shown on the website when they open.</p>
      <h2>No warranty</h2>
      <p>The service is provided as is while we are in launch. We may change or stop features with notice on this page.</p>
    </LegalPage>
  );
}
