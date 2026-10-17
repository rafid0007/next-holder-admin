import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { Card } from "./card";

export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-ink text-[22px] leading-7 font-semibold tracking-[-0.01em]">
            {title}
          </h1>
          {description && <p className="text-ink-muted mt-1 text-sm">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </header>
  );
}

export function StatCard({
  label,
  value,
  delta,
  hint,
  icon,
  href,
  trend,
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  icon?: React.ReactNode;
  href?: string;
  /** Normalised 0–1 series for the sparkline. */
  trend?: number[];
}) {
  const positive = (delta ?? 0) >= 0;
  const body = (
    <Card className="hover:shadow-raised group relative overflow-hidden p-5 transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <p className="text-ink-muted text-[13px] font-medium">{label}</p>
        {icon && (
          <span className="bg-brand-soft text-brand-ink grid size-8 place-items-center rounded-lg">
            {icon}
          </span>
        )}
      </div>
      <p className="text-ink mt-3 text-2xl font-semibold tracking-[-0.02em] tabular-nums">
        {value}
      </p>
      <div className="mt-2 flex items-center gap-2">
        {delta != null && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[13px] font-medium",
              positive ? "text-ok" : "text-bad",
            )}
          >
            {positive ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {Math.abs(delta)}%
          </span>
        )}
        {hint && <span className="text-ink-subtle text-[13px]">{hint}</span>}
      </div>
      {trend && (
        <Sparkline
          values={trend}
          className="pointer-events-none absolute right-0 bottom-0 left-0 opacity-70"
        />
      )}
    </Card>
  );

  return href ? (
    <Link href={href} className="focus-ring block rounded-[--radius-card]">
      {body}
    </Link>
  ) : (
    body
  );
}

export function Sparkline({
  values,
  className,
  height = 36,
}: {
  values: number[];
  className?: string;
  height?: number;
}) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const step = 100 / Math.max(values.length - 1, 1);
  const points = values.map((v, i) => `${i * step},${30 - ((v - min) / span) * 26}`);
  const id = `spark-${values.length}-${Math.round(max)}`;

  return (
    <svg
      viewBox="0 0 100 34"
      preserveAspectRatio="none"
      className={cn("w-full", className)}
      style={{ height }}
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,34 ${points.join(" ")} 100,34`} fill={`url(#${id})`} />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="var(--brand)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      {icon && (
        <div className="bg-surface-hover text-ink-subtle mb-3 grid size-11 place-items-center rounded-xl">
          {icon}
        </div>
      )}
      <p className="text-ink text-sm font-medium">{title}</p>
      {description && (
        <p className="text-ink-muted mt-1 max-w-sm text-[13px]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

const avatarPalette = [
  "bg-brand-soft text-brand-ink",
  "bg-ok-soft text-ok",
  "bg-warn-soft text-warn",
  "bg-info-soft text-info",
  "bg-bad-soft text-bad",
];

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const tone = avatarPalette[name.length % avatarPalette.length];
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold",
        tone,
        size === "sm" && "size-6 text-[10px]",
        size === "md" && "size-8 text-xs",
        size === "lg" && "size-10 text-sm",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function UserCell({
  name,
  meta,
  href,
}: {
  name: string;
  meta?: string;
  href?: string;
}) {
  const content = (
    <span className="flex min-w-0 items-center gap-2.5">
      <Avatar name={name} />
      <span className="min-w-0">
        <span className="text-ink block truncate text-[13px] font-medium">{name}</span>
        {meta && <span className="text-ink-subtle block truncate text-xs">{meta}</span>}
      </span>
    </span>
  );
  return href ? (
    <Link href={href} className="focus-ring hover:underline">
      {content}
    </Link>
  ) : (
    content
  );
}

export function Progress({
  value,
  max = 100,
  tone = "brand",
  label,
}: {
  value: number;
  max?: number;
  tone?: "brand" | "ok" | "warn" | "bad";
  label?: string;
}) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));
  const bg = {
    brand: "bg-brand",
    ok: "bg-ok",
    warn: "bg-warn",
    bad: "bg-bad",
  }[tone];
  return (
    <div className="w-full">
      {label && (
        <div className="text-ink-muted mb-1 flex justify-between text-xs">
          <span>{label}</span>
          <span className="tabular-nums">{pct}%</span>
        </div>
      )}
      <div
        className="bg-surface-hover h-1.5 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={cn("h-full rounded-full transition-[width]", bg)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-line flex flex-wrap items-center gap-2 border-b px-5 py-3">
      {children}
    </div>
  );
}

export function DefinitionList({
  items,
}: {
  items: { label: string; value: React.ReactNode }[];
}) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-ink-subtle text-xs">{item.label}</dt>
          <dd className="text-ink mt-0.5 text-[13px] font-medium">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
