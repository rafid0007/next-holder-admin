"use client";

import { cn, number as fmt } from "@/lib/utils";

export interface Slice {
  label: string;
  value: number;
  color: string;
}

/** Donut with a centred total; legend doubles as the value table. */
export function Donut({
  slices,
  total,
  totalLabel,
  size = 148,
  className,
}: {
  slices: Slice[];
  total?: number;
  totalLabel?: string;
  size?: number;
  className?: string;
}) {
  const sum = slices.reduce((acc, s) => acc + s.value, 0) || 1;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  // Precompute each arc's length and start offset so nothing mutates mid-render.
  const lengths = slices.map((slice) => (slice.value / sum) * circumference);
  const arcs = slices.map((slice, index) => ({
    slice,
    length: lengths[index],
    offset: lengths.slice(0, index).reduce((acc, value) => acc + value, 0),
  }));

  return (
    <div className={cn("flex flex-wrap items-center gap-6", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 140 140" className="size-full -rotate-90">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="var(--surface-hover)"
            strokeWidth="16"
          />
          {arcs.map(({ slice, length, offset }) => (
            <circle
              key={slice.label}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth="16"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-ink text-xl font-semibold tabular-nums">
              {fmt(total ?? sum)}
            </p>
            {totalLabel && <p className="text-ink-subtle text-[11px]">{totalLabel}</p>}
          </div>
        </div>
      </div>

      {/* min-width lets the legend wrap under the ring instead of truncating. */}
      <ul className="min-w-44 flex-1 space-y-2">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2 text-[13px]">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: slice.color }} />
            <span className="text-ink-muted min-w-0 flex-1 truncate">{slice.label}</span>
            <span className="text-ink font-medium tabular-nums">{fmt(slice.value)}</span>
            <span className="text-ink-subtle w-10 text-right text-xs tabular-nums">
              {Math.round((slice.value / sum) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
