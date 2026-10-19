"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell, BellOff, CalendarCheck, Check, FileText, Info, Megaphone, Send, Users, Wrench,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, SearchInput, Select, Switch, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState, FilterBar, PageHeader, StatCard } from "@/components/ui/misc";
import { useApi } from "@/lib/api/hooks";
import {
  listNotifications, markAllNotificationsRead, markNotificationRead,
} from "@/lib/api/resources";
import { CardSkeleton, ErrorState } from "@/components/ui/states";
import type { ApiNotification, NotificationType } from "@/lib/api/types";
import { cn, formatDateTime, humanize, relativeTime } from "@/lib/utils";

const typeMeta: Record<NotificationType, { icon: typeof Bell; tone: string }> = {
  lease: { icon: FileText, tone: "bg-info-soft text-info" },
  booking: { icon: CalendarCheck, tone: "bg-brand-soft text-brand-ink" },
  maintenance: { icon: Wrench, tone: "bg-warn-soft text-warn" },
  rent_bill: { icon: Megaphone, tone: "bg-ok-soft text-ok" },
  service_provider: { icon: Users, tone: "bg-bad-soft text-bad" },
  general: { icon: Info, tone: "bg-surface-hover text-ink-muted" },
};

export default function NotificationsPage() {
  const [tab, setTab] = useState("unread");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [composeOpen, setComposeOpen] = useState(false);

  // The endpoint is scoped to the signed-in user's own notifications.
  const feed = useApi(useCallback(() => listNotifications(), []));
  const items: ApiNotification[] = useMemo(() => feed.data?.results ?? [], [feed.data]);

  const tabs = useMemo(
    () => [
      { id: "unread", label: "Unread", count: items.filter((n) => !n.isRead).length },
      { id: "all", label: "All", count: items.length },
    ],
    [items],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (tab === "unread" && item.isRead) return false;
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (q && !`${item.title} ${item.message}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, tab, query, typeFilter]);

  async function markRead(id: number) {
    await markNotificationRead(id);
    feed.refetch();
  }

  async function markAllRead() {
    await markAllNotificationsRead();
    feed.refetch();
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Everything the platform has pushed to admins, and announcements you can send out."
        actions={
          <>
            <Button onClick={markAllRead} disabled={items.length === 0}>
              <Check className="size-4" /> Mark all read
            </Button>
            <Button variant="primary" onClick={() => setComposeOpen(true)}>
              <Megaphone className="size-4" /> Send announcement
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {feed.loading && !feed.data ? (
          Array.from({ length: 4 }, (_, i) => (
            <Card key={i}>
              <CardSkeleton />
            </Card>
          ))
        ) : (
          <>
        <StatCard
          label="Unread"
          value={String(items.filter((n) => !n.isRead).length)}
          icon={<Bell className="size-4" />}
        />
        <StatCard label="Received this week" value={String(items.length)} />
        <StatCard
          label="Maintenance alerts"
          value={String(items.filter((n) => n.type === "maintenance").length)}
        />
        <StatCard
          label="Announcements sent"
          value={String(items.filter((n) => n.type === "general").length)}
          hint="platform-wide"
        />
          </>
        )}
      </div>

      <Card>
        <Tabs items={tabs} value={tab} onChange={setTab} className="px-3" />
        <FilterBar>
          <SearchInput
            placeholder="Search notifications…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-80"
          />
          <Select
            aria-label="Type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-auto"
          >
            <option value="all">All types</option>
            {(Object.keys(typeMeta) as NotificationType[]).map((type) => (
              <option key={type} value={type}>
                {humanize(type)}
              </option>
            ))}
          </Select>
        </FilterBar>

        {feed.error ? (
          <CardBody>
            <ErrorState error={feed.error} onRetry={feed.refetch} resource="notifications" />
          </CardBody>
        ) : feed.loading && !feed.data ? (
          <CardBody>
            <CardSkeleton />
          </CardBody>
        ) : rows.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<BellOff className="size-5" />}
              title="Nothing here"
              description={tab === "unread" ? "You are all caught up." : "No notifications match."}
            />
          </CardBody>
        ) : (
          <ul>
            {rows.map((item) => {
              const meta = typeMeta[item.type];
              return (
                <li
                  key={item.id}
                  className={cn(
                    "border-line flex gap-3.5 border-b px-5 py-4 last:border-0",
                    !item.isRead && "bg-brand-soft/30",
                  )}
                >
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", meta.tone)}>
                    <meta.icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-ink text-[13px] font-medium">{item.title}</p>
                      <Badge tone="neutral">{humanize(item.type)}</Badge>
                      {!item.isRead && <Badge tone="brand">New</Badge>}
                    </div>
                    <p className="text-ink-muted mt-1 text-[13px] leading-5">{item.message}</p>
                    <p className="text-ink-subtle mt-1.5 text-xs">
                      {relativeTime(item.createdAt)} · {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {item.targetUrl && (
                      <Link href={item.targetUrl as "/"}>
                        <Button size="sm" variant="subtle">
                          Open
                        </Button>
                      </Link>
                    )}
                    {!item.isRead && (
                      <Button size="sm" variant="ghost" onClick={() => markRead(item.id)}>
                        Mark read
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="mt-4">
        <CardHeader
          title="Delivery channels"
          description="Where each notification type is sent. Email templates exist but are not yet wired to a sender."
        />
        <CardBody>
          <ul className="divide-line divide-y">
            {(Object.keys(typeMeta) as NotificationType[]).map((type) => (
              <li key={type} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-lg",
                    typeMeta[type].tone,
                  )}
                >
                  {(() => {
                    const Icon = typeMeta[type].icon;
                    return <Icon className="size-4" />;
                  })()}
                </span>
                <span className="text-ink min-w-0 flex-1 text-[13px] font-medium">
                  {humanize(type)}
                </span>
                <ChannelToggles />
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Modal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="Send an announcement"
        description="Delivered as an in-app notification to everyone in the selected audience."
        footer={
          <>
            <Button onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setComposeOpen(false)}>
              <Send className="size-4" /> Send announcement
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Audience">
            <Select>
              <option>Everyone</option>
              <option>Landlords only</option>
              <option>Tenants only</option>
              <option>Service providers only</option>
              <option>Paying subscribers only</option>
            </Select>
          </Field>
          <Field label="Title">
            <Input placeholder="Scheduled maintenance on Friday night" />
          </Field>
          <Field label="Message">
            <Textarea placeholder="The app will be unavailable between 1am and 3am on Friday while we upgrade the database." />
          </Field>
          <Field label="Link" hint="Optional deep link opened when the notification is tapped.">
            <Input placeholder="/settings" />
          </Field>
        </div>
      </Modal>
    </>
  );
}

function ChannelToggles() {
  const [inApp, setInApp] = useState(true);
  const [email, setEmail] = useState(false);
  return (
    <div className="flex shrink-0 items-center gap-5">
      <span className="flex items-center gap-2">
        <span className="text-ink-subtle hidden text-xs sm:inline">In-app</span>
        <Switch checked={inApp} onChange={setInApp} label="In-app delivery" />
      </span>
      <span className="flex items-center gap-2">
        <span className="text-ink-subtle hidden text-xs sm:inline">Email</span>
        <Switch checked={email} onChange={setEmail} label="Email delivery" />
      </span>
    </div>
  );
}
