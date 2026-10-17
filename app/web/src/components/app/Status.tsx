import { CheckCircle, CircleNotch, Clock, SealCheck, Warning, XCircle } from "@phosphor-icons/react/ssr";

const MAP = {
  queued: { label: "Queued", cls: "bg-soft text-fg-2", Icon: Clock },
  waiting: { label: "Waiting", cls: "bg-warn-100 text-warn", Icon: Clock },
  making: { label: "Making", cls: "bg-violet-50 text-violet", Icon: CircleNotch },
  ready: { label: "Ready to review", cls: "bg-ok-100 text-ok", Icon: CheckCircle },
  needs_look: { label: "Needs a look", cls: "bg-warn-100 text-warn", Icon: Warning },
  approved: { label: "Approved", cls: "bg-ink text-lime", Icon: SealCheck },
  failed: { label: "Failed", cls: "bg-bad-100 text-bad", Icon: XCircle },
} as const;

export function StatusPill({ status, stage }: { status: keyof typeof MAP; stage?: string }) {
  const m = MAP[status] ?? MAP.queued;
  const label = status === "making" && stage ? stage.charAt(0).toUpperCase() + stage.slice(1) : m.label;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${m.cls}`}>
      <m.Icon weight="bold" className={`size-3 ${status === "making" ? "animate-spin" : ""}`} />
      {label}
    </span>
  );
}
