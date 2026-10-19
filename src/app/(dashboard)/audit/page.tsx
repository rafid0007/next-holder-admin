"use client";

import { useCallback, useMemo, useState } from "react";
import { ScrollText } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, SearchInput, Select } from "@/components/ui/field";
import { Drawer } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/table";
import {
  DefinitionList, EmptyState, FilterBar, PageHeader, StatCard, UserCell,
} from "@/components/ui/misc";
import { ErrorState, TableSkeleton } from "@/components/ui/states";
import { RequirePermission } from "@/components/layout/permission-gate";
import { useApi } from "@/lib/api/hooks";
import { listAuditLogs } from "@/lib/api/admin";
import type { AuditLogEntry } from "@/lib/api/admin-types";
import { formatDateTime, humanize, number, relativeTime } from "@/lib/utils";

/** Prefix filters match the backend's `action` prefix form, e.g. `user.`. */
const areas = [
  { id: "all", label: "Every action" },
  { id: "user.", label: "Users" },
  { id: "staff.", label: "Staff & roles" },
  { id: "listing.", label: "Listings" },
  { id: "provider.", label: "Providers" },
  { id: "credits.", label: "Credits" },
  { id: "subscription.", label: "Subscriptions" },
  { id: "taxonomy.", label: "Taxonomy" },
  { id: "geo.", label: "Locations" },
  { id: "report.", label: "Reports" },
  { id: "complaint.", label: "Complaints" },
  { id: "promotion.", label: "Promotions" },
];

const toneFor = (action: string) => {
  if (/suspend|delete|reject|deduct|hide/.test(action)) return "bad" as const;
  if (/approve|reactivate|verify|grant|create|unhide|reinstate/.test(action)) return "ok" as const;
  return "neutral" as const;
};

export default function AuditPage() {
  return (
    <RequirePermission codes={["audit.view"]}>
      <Audit />
    </RequirePermission>
  );
}

function Audit() {
  const [area, setArea] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [open, setOpen] = useState<AuditLogEntry | null>(null);

  const feed = useApi(
    useCallback(
      () =>
        listAuditLogs({
          action: area === "all" ? undefined : area,
          search: search.trim() || undefined,
          dateFrom: dateFrom || undefined,
        }),
      [area, search, dateFrom],
    ),
  );

  const rows = useMemo(() => feed.data?.results ?? [], [feed.data]);

  const columns: Column<AuditLogEntry>[] = [
    {
      key: "action",
      header: "Action",
      cell: (row) => (
        <span className="block max-w-56">
          <Badge tone={toneFor(row.action)}>{row.action}</Badge>
          <span className="text-ink-subtle mt-1 block truncate text-xs">
            {row.targetRepr || row.targetType}
          </span>
        </span>
      ),
    },
    {
      key: "actor",
      header: "By",
      cell: (row) => <UserCell name={row.actorEmail || "system"} />,
    },
    {
      key: "reason",
      header: "Reason",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-ink-muted block max-w-64 truncate text-[13px]">
          {row.reason || "—"}
        </span>
      ),
    },
    {
      key: "when",
      header: "When",
      align: "right",
      cell: (row) => (
        <span className="text-ink-subtle text-xs whitespace-nowrap">
          {relativeTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (row) => (
        <Button size="sm" variant="ghost" onClick={() => setOpen(row)}>
          Details
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every staff write, newest first. Entries cannot be edited or deleted."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Entries" value={number(feed.data?.count ?? 0)} icon={<ScrollText className="size-4" />} />
        <StatCard
          label="Distinct actors"
          value={number(new Set(rows.map((r) => r.actorEmail)).size)}
          hint="on this page"
        />
        <StatCard
          label="Destructive"
          value={number(rows.filter((r) => toneFor(r.action) === "bad").length)}
          hint="suspend, hide, reject, delete"
        />
        <StatCard
          label="Most recent"
          value={rows[0] ? relativeTime(rows[0].createdAt) : "—"}
        />
      </div>

      <Card>
        <FilterBar>
          <SearchInput
            placeholder="Search actor, target or reason…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72"
          />
          <Select aria-label="Area" value={area} onChange={(e) => setArea(e.target.value)} className="w-auto">
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            aria-label="From date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-auto"
          />
        </FilterBar>

        {feed.error ? (
          <CardBody>
            <ErrorState error={feed.error} onRetry={feed.refetch} resource="the audit log" />
          </CardBody>
        ) : feed.loading && !feed.data ? (
          <TableSkeleton rows={8} columns={4} />
        ) : rows.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<ScrollText className="size-5" />}
              title="Nothing logged yet"
              description="Staff writes appear here as they happen."
            />
          </CardBody>
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} pageSize={15} />
        )}
      </Card>

      <Drawer
        open={open != null}
        onClose={() => setOpen(null)}
        title={open?.action ?? ""}
        subtitle={open ? formatDateTime(open.createdAt) : ""}
      >
        {open && (
          <div className="space-y-5">
            <DefinitionList
              items={[
                { label: "Entry", value: `#${open.id}` },
                { label: "Actor", value: open.actorEmail || "system" },
                { label: "Target type", value: humanize(open.targetType.split(".").pop() ?? "") },
                { label: "Target", value: open.targetRepr || `#${open.targetId}` },
                { label: "Reason", value: open.reason || "—" },
                { label: "IP address", value: open.ipAddress || "—" },
              ]}
            />

            {(Object.keys(open.before).length > 0 || Object.keys(open.after).length > 0) && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-ink-subtle mb-1.5 text-xs font-medium">Before</p>
                  <pre className="bg-surface-muted text-ink-muted overflow-x-auto rounded-lg p-3 font-mono text-[11px] leading-5">
                    {JSON.stringify(open.before, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="text-ink-subtle mb-1.5 text-xs font-medium">After</p>
                  <pre className="bg-surface-muted text-ink-muted overflow-x-auto rounded-lg p-3 font-mono text-[11px] leading-5">
                    {JSON.stringify(open.after, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {Object.keys(open.metadata).length > 0 && (
              <div>
                <p className="text-ink-subtle mb-1.5 text-xs font-medium">Metadata</p>
                <pre className="bg-surface-muted text-ink-muted overflow-x-auto rounded-lg p-3 font-mono text-[11px]">
                  {JSON.stringify(open.metadata, null, 2)}
                </pre>
              </div>
            )}

            {open.userAgent && (
              <p className="text-ink-subtle text-[11px] leading-5">{open.userAgent}</p>
            )}
          </div>
        )}
      </Drawer>
    </>
  );
}
