"use client";

import { Fragment, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface Column<T> {
  /** Stable key; also the sort key when `sortable`. */
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** Value used for sorting; defaults to no sorting. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "right" | "center";
  width?: string;
  /** Hide below the md breakpoint to keep narrow screens readable. */
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  /** Rendered inside the row as an expandable detail panel. */
  expandedContent?: (row: T) => React.ReactNode;
  pageSize?: number;
  empty?: React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  expandedContent,
  pageSize = 10,
  empty,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<string | number | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortValue) return rows;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = column.sortValue!(a);
      const bv = column.sortValue!(b);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * factor;
      return String(av).localeCompare(String(bv)) * factor;
    });
  }, [rows, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const visible = sorted.slice(current * pageSize, current * pageSize + pageSize);

  function toggleSort(key: string) {
    setSort((prev) =>
      prev?.key === key
        ? prev.dir === "asc"
          ? { key, dir: "desc" }
          : null
        : { key, dir: "asc" },
    );
  }

  if (rows.length === 0 && empty) return <div className="p-10">{empty}</div>;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-line border-b">
              {columns.map((column) => {
                const active = sort?.key === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    style={{ width: column.width }}
                    className={cn(
                      "text-ink-muted bg-surface-muted/60 px-4 py-2.5 text-xs font-medium tracking-wide first:pl-5 last:pr-5",
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center",
                      column.align !== "right" && column.align !== "center" && "text-left",
                      column.hideOnMobile && "hidden md:table-cell",
                    )}
                  >
                    {column.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className={cn(
                          "focus-ring inline-flex items-center gap-1 rounded transition-colors hover:text-ink",
                          active && "text-ink",
                        )}
                      >
                        {column.header}
                        {active ? (
                          sort!.dir === "asc" ? (
                            <ArrowUp className="size-3" />
                          ) : (
                            <ArrowDown className="size-3" />
                          )
                        ) : (
                          <ArrowDown className="size-3 opacity-0 transition-opacity group-hover:opacity-40" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const key = rowKey(row);
              const isExpanded = expanded === key;
              const interactive = Boolean(onRowClick || expandedContent);
              return (
                <Fragment key={key}>
                  <tr
                    onClick={() => {
                      if (expandedContent) setExpanded(isExpanded ? null : key);
                      onRowClick?.(row);
                    }}
                    className={cn(
                      "border-line border-b transition-colors last:border-0",
                      interactive && "hover:bg-surface-hover cursor-pointer",
                      isExpanded && "bg-surface-muted",
                    )}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          "px-4 py-3 align-middle first:pl-5 last:pr-5",
                          column.align === "right" && "text-right",
                          column.align === "center" && "text-center",
                          column.hideOnMobile && "hidden md:table-cell",
                        )}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                  </tr>
                  {isExpanded && expandedContent && (
                    <tr className="bg-surface-muted border-line border-b">
                      <td colSpan={columns.length} className="px-5 py-4">
                        {expandedContent(row)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {sorted.length > pageSize && (
        <div className="border-line flex items-center justify-between border-t px-5 py-3">
          <p className="text-ink-muted text-[13px]">
            {current * pageSize + 1}–{Math.min((current + 1) * pageSize, sorted.length)} of{" "}
            {sorted.length}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              size="icon"
              variant="ghost"
              aria-label="Previous page"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-ink-muted px-1 text-[13px] tabular-nums">
              {current + 1} / {pageCount}
            </span>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Next page"
              disabled={current >= pageCount - 1}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
