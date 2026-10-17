import { cn, humanize } from "@/lib/utils";

export type Tone = "neutral" | "brand" | "ok" | "warn" | "bad" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-muted text-ink-muted border-line",
  brand: "bg-brand-soft text-brand-ink border-brand/20",
  ok: "bg-ok-soft text-ok border-ok/25",
  warn: "bg-warn-soft text-warn border-warn/25",
  bad: "bg-bad-soft text-bad border-bad/25",
  info: "bg-info-soft text-info border-info/25",
};

export function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/**
 * Status → tone map covering every TextChoices enum in the backend, so one
 * component renders bills, leases, bookings, providers and work orders alike.
 */
const statusTones: Record<string, Tone> = {
  // shared
  active: "ok",
  available: "ok",
  paid: "ok",
  confirmed: "ok",
  resolved: "ok",
  verified: "ok",
  accepted: "ok",
  completed_by_provider: "ok",
  replied: "info",
  open: "info",
  pending: "warn",
  pending_verification: "warn",
  awaiting_payment: "warn",
  acknowledged: "info",
  in_progress: "info",
  scheduled: "info",
  sent: "info",
  seen: "info",
  quoted: "info",
  partially_quoted: "info",
  submitted: "info",
  unpaid: "warn",
  occupied: "brand",
  maintenance: "warn",
  draft: "neutral",
  paused: "neutral",
  hidden: "neutral",
  unlisted: "neutral",
  unverified: "neutral",
  closed: "neutral",
  cancelled: "neutral",
  expired: "neutral",
  released: "neutral",
  overdue: "bad",
  rejected: "bad",
  terminated: "bad",
  suspended: "bad",
  disputed: "bad",
  subscription_expired: "bad",
  refunded: "neutral",
  partially_refunded: "warn",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge tone={statusTones[status] ?? "neutral"} dot className={className}>
      {humanize(status)}
    </Badge>
  );
}

const priorityTones: Record<string, Tone> = {
  low: "neutral",
  medium: "info",
  high: "warn",
  urgent: "bad",
  emergency: "bad",
  normal: "neutral",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return <Badge tone={priorityTones[priority] ?? "neutral"}>{humanize(priority)}</Badge>;
}
