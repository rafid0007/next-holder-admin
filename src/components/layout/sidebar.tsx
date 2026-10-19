"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { navSections } from "./nav";
import { useWorkQueue, type WorkQueue } from "@/lib/api/work-queue";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SidebarContent({
  collapsed,
  onNavigate,
  counts,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  counts: WorkQueue;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Main">
      {navSections.map((section) => (
        <div key={section.title} className="mb-5 last:mb-0">
          {!collapsed && (
            <p className="text-ink-subtle mb-1.5 px-2 text-[11px] font-semibold tracking-wider uppercase">
              {section.title}
            </p>
          )}
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              const count = (item.badgeKey ? counts[item.badgeKey] : 0) ?? 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "focus-ring group relative flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-brand-soft text-brand-ink"
                        : "text-ink-muted hover:bg-surface-hover hover:text-ink",
                      collapsed && "justify-center",
                    )}
                  >
                    {active && (
                      <span className="bg-brand absolute top-1.5 bottom-1.5 -left-3 w-[3px] rounded-r-full" />
                    )}
                    <item.icon className="size-4 shrink-0" />
                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {count > 0 &&
                      (collapsed ? (
                        <span className="bg-brand absolute top-1 right-1 size-1.5 rounded-full" />
                      ) : (
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-px text-[11px] font-semibold tabular-nums",
                            active
                              ? "bg-brand text-white"
                              : "bg-surface-hover text-ink-muted group-hover:bg-brand-soft group-hover:text-brand-ink",
                          )}
                        >
                          {count}
                        </span>
                      ))}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "focus-ring flex items-center gap-2.5 rounded-lg",
        collapsed && "justify-center",
      )}
    >
      <span className="bg-brand grid size-8 shrink-0 place-items-center rounded-lg text-white">
        <Building2 className="size-4.5" />
      </span>
      {!collapsed && (
        <span className="min-w-0">
          <span className="text-ink block text-[13px] leading-4 font-semibold">Next Holder</span>
          <span className="text-ink-subtle block text-[11px] leading-4">Admin console</span>
        </span>
      )}
    </Link>
  );
}

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const counts = useWorkQueue();

  return (
    <>
      {/* Desktop rail */}
      <aside
        className={cn(
          "bg-surface border-line sticky top-0 hidden h-dvh shrink-0 flex-col border-r transition-[width] duration-200 lg:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div
          className={cn(
            "border-line flex h-14 items-center border-b px-3",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          <Brand collapsed={collapsed} />
          {!collapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label="Collapse sidebar"
              className="focus-ring text-ink-subtle hover:bg-surface-hover hover:text-ink grid size-7 place-items-center rounded-md transition-colors"
            >
              <PanelLeftClose className="size-4" />
            </button>
          )}
        </div>
        <SidebarContent collapsed={collapsed} counts={counts} />
        {collapsed && (
          <div className="border-line border-t p-3">
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label="Expand sidebar"
              className="focus-ring text-ink-subtle hover:bg-surface-hover hover:text-ink grid size-9 w-full place-items-center rounded-md transition-colors"
            >
              <PanelLeftOpen className="size-4" />
            </button>
          </div>
        )}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            aria-label="Close navigation"
            onClick={onCloseMobile}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
            style={{ animation: "overlay-in 140ms ease-out" }}
          />
          <aside
            className="bg-surface border-line shadow-overlay relative flex h-full w-64 flex-col border-r"
            style={{ animation: "panel-in 200ms cubic-bezier(0.16,1,0.3,1)" }}
          >
            <div className="border-line flex h-14 items-center justify-between border-b px-3">
              <Brand collapsed={false} />
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close navigation"
                className="focus-ring text-ink-subtle hover:bg-surface-hover grid size-7 place-items-center rounded-md"
              >
                <X className="size-4" />
              </button>
            </div>
            <SidebarContent collapsed={false} onNavigate={onCloseMobile} counts={counts} />
          </aside>
        </div>
      )}
    </>
  );
}
