"use client";

import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn("border-line flex gap-1 overflow-x-auto border-b", className)}
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "focus-ring -mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors",
              active
                ? "border-brand text-ink"
                : "text-ink-muted hover:text-ink border-transparent",
            )}
          >
            {item.label}
            {item.count != null && (
              <span
                className={cn(
                  "rounded-md px-1.5 py-px text-[11px] tabular-nums",
                  active ? "bg-brand-soft text-brand-ink" : "bg-surface-hover text-ink-muted",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SegmentedControl({
  items,
  value,
  onChange,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="bg-surface-hover border-line inline-flex rounded-lg border p-0.5">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "focus-ring rounded-[6px] px-2.5 py-1 text-[13px] font-medium transition-colors",
            item.id === value
              ? "bg-surface text-ink shadow-card"
              : "text-ink-muted hover:text-ink",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
