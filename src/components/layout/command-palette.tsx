"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CornerDownLeft, Search } from "lucide-react";
import { navItems } from "./nav";
import { useApi } from "@/lib/api/hooks";
import { listAllProperties, listUsers } from "@/lib/api/resources";
import { cn } from "@/lib/utils";

interface Entry {
  id: string;
  label: string;
  meta: string;
  group: string;
  href: string;
  icon?: React.ReactNode;
}

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // Mounting the dialog only while open lets query/cursor reset by unmounting,
  // instead of being cleared from an effect.
  if (!open) return null;
  return <Palette onClose={onClose} />;
}

function Palette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  // Loaded when the palette opens, and dropped when it closes with the component.
  const properties = useApi(useCallback(() => listAllProperties().catch(() => []), []));
  const people = useApi(useCallback(() => listUsers().catch(() => null), []));
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);

  const entries = useMemo<Entry[]>(
    () => [
      ...navItems.map((item) => ({
        id: `nav-${item.href}`,
        label: item.label,
        meta: item.section,
        group: "Navigate",
        href: item.href,
      })),
      ...(properties.data ?? []).slice(0, 40).map((p) => ({
        id: `prop-${p.id}`,
        label: p.title,
        meta: [p.neighborhood, p.city].filter(Boolean).join(", "),
        group: "Properties",
        href: `/properties/${p.id}`,
        icon: <Building2 className="size-3.5" />,
      })),
      ...(people.data?.results ?? []).map((u) => ({
        id: `user-${u.id}`,
        label: u.fullName,
        meta: u.email,
        group: "People",
        href: "/users",
      })),
    ],
    [properties.data, people.data],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? entries.filter(
          (e) =>
            e.label.toLowerCase().includes(q) || e.meta.toLowerCase().includes(q),
        )
      : entries.filter((e) => e.group === "Navigate");
    return pool.slice(0, 12);
  }, [entries, query]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setCursor((c) => Math.min(c + 1, results.length - 1));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      }
      if (event.key === "Enter" && results[cursor]) {
        event.preventDefault();
        router.push(results[cursor].href);
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [results, cursor, onClose, router]);

  let lastGroup = "";

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center p-4 pt-[12vh]">
      <button
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        style={{ animation: "overlay-in 140ms ease-out" }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="bg-surface border-line shadow-overlay relative w-full max-w-xl overflow-hidden rounded-2xl border"
        style={{ animation: "panel-in 180ms cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="border-line flex items-center gap-2.5 border-b px-4">
          <Search className="text-ink-subtle size-4" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            placeholder="Search properties, people or pages…"
            className="text-ink placeholder:text-ink-subtle h-12 flex-1 bg-transparent text-sm outline-none"
          />
          <kbd className="border-line text-ink-subtle rounded border px-1.5 py-0.5 text-[10px]">
            ESC
          </kbd>
        </div>

        <ul className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="text-ink-muted px-3 py-8 text-center text-[13px]">
              Nothing matches “{query}”.
            </li>
          )}
          {results.map((entry, index) => {
            const showGroup = entry.group !== lastGroup;
            lastGroup = entry.group;
            return (
              <li key={entry.id}>
                {showGroup && (
                  <p className="text-ink-subtle px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider uppercase">
                    {entry.group}
                  </p>
                )}
                <button
                  type="button"
                  onMouseEnter={() => setCursor(index)}
                  onClick={() => {
                    router.push(entry.href);
                    onClose();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors",
                    cursor === index ? "bg-brand-soft" : "hover:bg-surface-hover",
                  )}
                >
                  {entry.icon && <span className="text-ink-subtle">{entry.icon}</span>}
                  <span className="min-w-0 flex-1">
                    <span className="text-ink block truncate text-[13px] font-medium">
                      {entry.label}
                    </span>
                    <span className="text-ink-subtle block truncate text-xs">{entry.meta}</span>
                  </span>
                  {cursor === index && (
                    <CornerDownLeft className="text-brand-ink size-3.5 shrink-0" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
