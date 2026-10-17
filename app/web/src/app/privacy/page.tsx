import { LegalPage } from "@/components/site/LegalPage";

export const metadata = { title: "Privacy — MotherTongue" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy" updated="17 October 2026">
      <p>MotherTongue turns one ad into versions for different audiences. This page says plainly what we keep and why.</p>
      <h2>What we store</h2>
      <p>Your account email, the ads, scripts and music you upload, your brand facts, the versions we make, your review notes and the brand-memory rules learned from them. Files are kept in private storage; only you can open them, through short-lived links.</p>
      <h2>AI processing</h2>
      <p>To write, voice and check versions, the text of your script, your brand facts and a few frames of your video are sent to AI models running on AMD&apos;s model service. Its operator keeps prompts and outputs for about two days and does not use them for training.</p>
      <h2>Sample workspace</h2>
      <p>“Try with a sample ad” creates a private, anonymous workspace in your browser. Create an account to keep it; otherwise it simply stays unused.</p>
      <h2>Voices</h2>
      <p>We only use ready-made synthetic voices, or your own voice with your recorded consent. We never imitate a real person without consent.</p>
      <h2>Deleting your data</h2>
      <p>Ask us through the project&apos;s GitHub page and we delete your workspace and files.</p>
    </LegalPage>
  );
}
