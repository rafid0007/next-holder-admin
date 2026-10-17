"use client";

import { useState } from "react";
import { cn, compactMoney } from "@/lib/utils";

export interface Series {
  name: string;
  color: string;
  values: number[];
}

/**
 * Small grouped/stacked bar chart drawn as plain SVG — no charting dependency,
 * and it inherits the theme tokens so it reads correctly in dark mode.
 */
export function BarChart({
  labels,
  series,
  stacked = false,
  height = 220,
  formatValue = compactMoney,
  className,
}: {
  labels: string[];
  series: Series[];
  stacked?: boolean;
  height?: number;
  formatValue?: (value: number) => string;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const totals = labels.map((_, i) =>
    stacked
      ? series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0)
      : Math.max(...series.map((s) => s.values[i] ?? 0)),
  );
  const peak = Math.max(...totals, 1);
  const ticks = 4;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex gap-3">
        {/* y axis */}
        <div
          className="text-ink-subtle flex flex-col justify-between py-0 text-right text-[11px] tabular-nums"
          style={{ height }}
        >
          {Array.from({ length: ticks + 1 }, (_, i) => (
            <span key={i}>{formatValue(Math.round((peak / ticks) * (ticks - i)))}</span>
          ))}
        </div>

        <div className="relative flex-1">
          {/* gridlines */}
          <div
            className="absolute inset-0 flex flex-col justify-between"
            style={{ height }}
            aria-hidden
          >
            {Array.from({ length: ticks + 1 }, (_, i) => (
              <div key={i} className="border-line border-t border-dashed first:border-solid" />
            ))}
          </div>

          <div className="relative flex items-end gap-1.5" style={{ height }}>
            {labels.map((label, i) => (
              <div
                key={label}
                className="group relative flex h-full flex-1 items-end justify-center gap-0.5"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                {hover === i && (
                  <div className="bg-surface border-line shadow-overlay text-ink absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 rounded-lg border px-2.5 py-2 text-xs">
                    <p className="text-ink-subtle mb-1 font-medium">{label}</p>
                    {series.map((s) => (
                      <p key={s.name} className="flex items-center gap-1.5 whitespace-nowrap">
                        <span
                          className="size-2 rounded-sm"
                          style={{ background: s.color }}
                        />
                        <span className="text-ink-muted">{s.name}</span>
                        <span className="ml-auto font-medium tabular-nums">
                          {formatValue(s.values[i] ?? 0)}
                        </span>
                      </p>
                    ))}
                  </div>
                )}

                {stacked ? (
                  <div className="flex h-full w-full max-w-10 flex-col justify-end overflow-hidden rounded-[5px]">
                    {series.map((s) => (
                      <div
                        key={s.name}
                        className="w-full transition-opacity"
                        style={{
                          height: `${((s.values[i] ?? 0) / peak) * 100}%`,
                          background: s.color,
                          opacity: hover == null || hover === i ? 1 : 0.4,
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  series.map((s) => (
                    <div
                      key={s.name}
                      className="w-full max-w-5 rounded-t-[4px] transition-opacity"
                      style={{
                        height: `${((s.values[i] ?? 0) / peak) * 100}%`,
                        background: s.color,
                        opacity: hover == null || hover === i ? 1 : 0.4,
                      }}
                    />
                  ))
                )}
              </div>
            ))}
          </div>

          <div className="text-ink-subtle mt-2 flex gap-1.5 text-[11px]">
            {labels.map((label) => (
              <span key={label} className="flex-1 truncate text-center">
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 pl-12">
        {series.map((s) => (
          <span key={s.name} className="text-ink-muted flex items-center gap-1.5 text-xs">
            <span className="size-2 rounded-sm" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
