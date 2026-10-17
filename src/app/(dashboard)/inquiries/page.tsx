"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Archive, Mail, MessageSquare, Phone, Send } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput, Textarea } from "@/components/ui/field";
import { Tabs } from "@/components/ui/tabs";
import { Avatar, EmptyState, FilterBar, PageHeader, StatCard } from "@/components/ui/misc";
import { inquiries } from "@/lib/mock/data";
import { cn, formatDateTime, relativeTime } from "@/lib/utils";

export default function InquiriesPage() {
  const [tab, setTab] = useState("open");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(inquiries[0].id);
  const [reply, setReply] = useState("");

  const tabs = useMemo(
    () => [
      { id: "open", label: "Open", count: inquiries.filter((i) => i.status === "open").length },
      { id: "replied", label: "Replied", count: inquiries.filter((i) => i.status === "replied").length },
      { id: "closed", label: "Closed", count: inquiries.filter((i) => i.status === "closed").length },
      { id: "all", label: "All", count: inquiries.length },
    ],
    [],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inquiries.filter((inquiry) => {
      if (tab !== "all" && inquiry.status !== tab) return false;
      if (q && !`${inquiry.name} ${inquiry.message} ${inquiry.property.title}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [tab, query]);

  const selected = inquiries.find((i) => i.id === selectedId) ?? rows[0];

  return (
    <>
      <PageHeader
        title="Inquiries"
        description="Questions sent about marketplace listings, from both registered users and guests."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Open inquiries"
          value={String(inquiries.filter((i) => i.status === "open").length)}
          icon={<MessageSquare className="size-4" />}
        />
        <StatCard label="Replied" value={String(inquiries.filter((i) => i.status === "replied").length)} />
        <StatCard label="Median first reply" value="5.4 hrs" delta={-14.1} hint="faster than last month" />
        <StatCard
          label="From guests"
          value={String(inquiries.filter((i) => !i.sender).length)}
          hint="no account yet"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <Tabs items={tabs} value={tab} onChange={setTab} className="px-3" />
          <FilterBar>
            <SearchInput
              placeholder="Search sender, message or listing…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full"
            />
          </FilterBar>

          {rows.length === 0 ? (
            <CardBody>
              <EmptyState
                icon={<MessageSquare className="size-5" />}
                title="No inquiries here"
                description="Nothing matches the current tab and search."
              />
            </CardBody>
          ) : (
            <ul className="max-h-[32rem] overflow-y-auto">
              {rows.map((inquiry) => (
                <li key={inquiry.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(inquiry.id)}
                    className={cn(
                      "border-line focus-ring flex w-full gap-3 border-b px-5 py-3.5 text-left transition-colors last:border-0",
                      selected?.id === inquiry.id ? "bg-brand-soft/60" : "hover:bg-surface-hover",
                    )}
                  >
                    <Avatar name={inquiry.name} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-ink truncate text-[13px] font-medium">
                          {inquiry.name}
                        </span>
                        <span className="text-ink-subtle shrink-0 text-[11px]">
                          {relativeTime(inquiry.createdAt)}
                        </span>
                      </span>
                      <span className="text-ink-subtle mt-0.5 block truncate text-xs">
                        {inquiry.property.title}
                      </span>
                      <span className="text-ink-muted mt-1 line-clamp-2 block text-xs leading-5">
                        {inquiry.message}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-3">
          {selected ? (
            <>
              <div className="border-line flex items-start justify-between gap-4 border-b px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={selected.name} size="lg" />
                  <div className="min-w-0">
                    <p className="text-ink truncate text-[15px] font-semibold">{selected.name}</p>
                    <div className="text-ink-subtle mt-0.5 flex flex-wrap items-center gap-3 text-xs">
                      {selected.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="size-3" /> {selected.phone}
                        </span>
                      )}
                      {selected.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="size-3" /> {selected.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={selected.status} />
                  {!selected.sender && <Badge tone="warn">Guest</Badge>}
                </div>
              </div>

              <CardBody className="space-y-5">
                <div className="bg-surface-muted border-line rounded-xl border p-4">
                  <p className="text-ink-subtle text-xs">About</p>
                  <Link
                    href={`/properties/${selected.property.id}`}
                    className="text-ink focus-ring mt-1 block text-[13px] font-medium hover:underline"
                  >
                    {selected.property.title}
                  </Link>
                </div>

                <div>
                  <div className="flex gap-3">
                    <Avatar name={selected.name} size="sm" />
                    <div className="bg-surface-muted min-w-0 flex-1 rounded-xl p-3.5">
                      <p className="text-ink-muted text-[13px] leading-6">{selected.message}</p>
                      <p className="text-ink-subtle mt-2 text-[11px]">
                        {formatDateTime(selected.createdAt)}
                      </p>
                    </div>
                  </div>

                  {selected.repliesCount > 0 && (
                    <div className="mt-3 flex gap-3">
                      <Avatar name="Rafid Mostafa" size="sm" />
                      <div className="bg-brand-soft min-w-0 flex-1 rounded-xl p-3.5">
                        <p className="text-ink text-[13px] leading-6">
                          Thanks for reaching out. The unit is available from the 1st and I can
                          arrange a viewing this Saturday afternoon.
                        </p>
                        <p className="text-ink-subtle mt-2 text-[11px]">
                          {selected.repliesCount} repl{selected.repliesCount === 1 ? "y" : "ies"} in
                          this thread
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-ink mb-2 text-[13px] font-medium">Reply</p>
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write a reply to the sender…"
                  />
                  <div className="mt-3 flex items-center gap-2">
                    <Button variant="primary" disabled={reply.trim().length === 0}>
                      <Send className="size-4" /> Send reply
                    </Button>
                    <Button>
                      <Archive className="size-4" /> Close inquiry
                    </Button>
                  </div>
                </div>
              </CardBody>
            </>
          ) : (
            <CardBody>
              <EmptyState
                icon={<MessageSquare className="size-5" />}
                title="Select an inquiry"
                description="Pick a conversation from the list to read and reply."
              />
            </CardBody>
          )}
        </Card>
      </div>
    </>
  );
}
