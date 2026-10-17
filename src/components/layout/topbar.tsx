"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Check,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  UserCog,
} from "lucide-react";
import { navItems } from "./nav";
import { useTheme } from "./theme-provider";
import { tokenStore } from "@/lib/api/client";
import { notifications as seedNotifications } from "@/lib/mock/data";
import { Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { cn, relativeTime } from "@/lib/utils";

const typeTone: Record<string, string> = {
  maintenance: "bg-warn",
  booking: "bg-brand",
  rent_bill: "bg-ok",
  lease: "bg-info",
  service_provider: "bg-bad",
  general: "bg-ink-subtle",
};

function useDismiss(onDismiss: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onDismiss();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onDismiss]);
  return ref;
}

export function Topbar({
  onOpenMobileNav,
  onOpenSearch,
}: {
  onOpenMobileNav: () => void;
  onOpenSearch: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [panel, setPanel] = useState<"none" | "bell" | "user">("none");
  const [items, setItems] = useState(seedNotifications);
  const ref = useDismiss(() => setPanel("none"));

  const unread = items.filter((n) => !n.isRead).length;
  const current =
    navItems.find((item) => item.href !== "/" && pathname.startsWith(item.href)) ??
    navItems[0];

  return (
    <header className="bg-surface/85 border-line sticky top-0 z-40 flex h-14 items-center gap-2 border-b px-3 backdrop-blur-md sm:px-5">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="focus-ring text-ink-muted hover:bg-surface-hover grid size-9 place-items-center rounded-lg lg:hidden"
      >
        <Menu className="size-4.5" />
      </button>

      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-1.5 text-[13px]">
          <li className="text-ink-subtle hidden sm:block">{current.section}</li>
          <li className="text-ink-subtle hidden sm:block">/</li>
          <li className="text-ink truncate font-medium">{current.label}</li>
        </ol>
      </nav>

      <div className="ml-auto flex items-center gap-1.5" ref={ref}>
        <button
          type="button"
          onClick={onOpenSearch}
          className="focus-ring bg-surface-hover border-line text-ink-subtle hover:text-ink-muted hidden h-9 items-center gap-2 rounded-lg border pr-2 pl-3 text-[13px] transition-colors md:flex"
        >
          <Search className="size-3.5" />
          <span className="pr-6">Search…</span>
          <kbd className="bg-surface border-line rounded border px-1.5 py-0.5 text-[10px]">⌘K</kbd>
        </button>
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Search"
          className="focus-ring text-ink-muted hover:bg-surface-hover grid size-9 place-items-center rounded-lg md:hidden"
        >
          <Search className="size-4" />
        </button>

        <button
          type="button"
          onClick={toggle}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          className="focus-ring text-ink-muted hover:bg-surface-hover hover:text-ink grid size-9 place-items-center rounded-lg transition-colors"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPanel((p) => (p === "bell" ? "none" : "bell"))}
            aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
            className="focus-ring text-ink-muted hover:bg-surface-hover hover:text-ink relative grid size-9 place-items-center rounded-lg transition-colors"
          >
            <Bell className="size-4" />
            {unread > 0 && (
              <span className="bg-bad border-surface absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full border-2 text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>

          {panel === "bell" && (
            <div
              className="bg-surface border-line shadow-overlay absolute right-0 mt-2 w-[22rem] overflow-hidden rounded-xl border"
              style={{ animation: "panel-in 160ms cubic-bezier(0.16,1,0.3,1)" }}
            >
              <div className="border-line flex items-center justify-between border-b px-4 py-3">
                <p className="text-ink text-[13px] font-semibold">Notifications</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))}
                >
                  <Check className="size-3.5" /> Mark all read
                </Button>
              </div>
              <ul className="max-h-80 overflow-y-auto">
                {items.slice(0, 6).map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.targetUrl ?? "/notifications"}
                      onClick={() => setPanel("none")}
                      className={cn(
                        "hover:bg-surface-hover border-line flex gap-3 border-b px-4 py-3 last:border-0",
                        !item.isRead && "bg-brand-soft/40",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-1.5 size-1.5 shrink-0 rounded-full",
                          typeTone[item.type],
                        )}
                      />
                      <span className="min-w-0">
                        <span className="text-ink block text-[13px] font-medium">
                          {item.title}
                        </span>
                        <span className="text-ink-muted mt-0.5 block text-xs leading-5">
                          {item.message}
                        </span>
                        <span className="text-ink-subtle mt-1 block text-[11px]">
                          {relativeTime(item.createdAt)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/notifications"
                onClick={() => setPanel("none")}
                className="text-brand-ink hover:bg-surface-hover block px-4 py-2.5 text-center text-[13px] font-medium"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>

        {/* Account */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPanel((p) => (p === "user" ? "none" : "user"))}
            className="focus-ring hover:bg-surface-hover flex items-center gap-2 rounded-lg py-1 pr-1.5 pl-1 transition-colors"
          >
            <Avatar name="Rafid Mostafa" />
            <span className="hidden text-left sm:block">
              <span className="text-ink block text-[13px] leading-4 font-medium">
                Rafid Mostafa
              </span>
              <span className="text-ink-subtle block text-[11px] leading-4">Platform admin</span>
            </span>
            <ChevronDown className="text-ink-subtle size-3.5" />
          </button>

          {panel === "user" && (
            <div
              className="bg-surface border-line shadow-overlay absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border p-1.5"
              style={{ animation: "panel-in 160ms cubic-bezier(0.16,1,0.3,1)" }}
            >
              <div className="border-line mb-1.5 border-b px-2.5 py-2">
                <p className="text-ink text-[13px] font-medium">Rafid Mostafa</p>
                <p className="text-ink-subtle truncate text-xs">admin@nextholder.app</p>
              </div>
              {[
                { label: "Account settings", icon: UserCog, href: "/settings" },
                { label: "Platform settings", icon: Settings, href: "/settings" },
              ].map((entry) => (
                <Link
                  key={entry.label}
                  href={entry.href}
                  onClick={() => setPanel("none")}
                  className="text-ink-muted hover:bg-surface-hover hover:text-ink flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px]"
                >
                  <entry.icon className="size-4" />
                  {entry.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  tokenStore.clear();
                  router.push("/login");
                }}
                className="text-bad hover:bg-bad-soft focus-ring mt-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px]"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
