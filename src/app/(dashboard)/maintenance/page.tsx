"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2, Forward, MessageSquare, Paperclip, Send, Wrench, XCircle,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, SearchInput, Select, Textarea } from "@/components/ui/field";
import { Drawer } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import {
  Avatar, DefinitionList, EmptyState, FilterBar, PageHeader, StatCard, UserCell,
} from "@/components/ui/misc";
import { Donut } from "@/components/charts/donut";
import { maintenanceRequests, serviceProviders } from "@/lib/mock/data";
import type { MaintenanceRequest } from "@/lib/api/types";
import { formatDateTime, humanize, relativeTime } from "@/lib/utils";

const statusFlow = ["pending", "acknowledged", "in_progress", "resolved"] as const;

export default function MaintenancePage() {
  const [tab, setTab] = useState("open");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selected, setSelected] = useState<MaintenanceRequest | null>(null);

  const isOpen = (request: MaintenanceRequest) =>
    ["pending", "acknowledged", "in_progress"].includes(request.status);

  const tabs = useMemo(
    () => [
      { id: "open", label: "Open", count: maintenanceRequests.filter(isOpen).length },
      { id: "pending", label: "Pending", count: maintenanceRequests.filter((r) => r.status === "pending").length },
      { id: "in_progress", label: "In progress", count: maintenanceRequests.filter((r) => r.status === "in_progress").length },
      { id: "resolved", label: "Resolved", count: maintenanceRequests.filter((r) => r.status === "resolved").length },
      { id: "all", label: "All", count: maintenanceRequests.length },
    ],
    [],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return maintenanceRequests.filter((request) => {
      if (tab === "open" && !isOpen(request)) return false;
      if (!["open", "all"].includes(tab) && request.status !== tab) return false;
      if (categoryFilter !== "all" && request.category !== categoryFilter) return false;
      if (priorityFilter !== "all" && request.priority !== priorityFilter) return false;
      if (
        q &&
        !`${request.title} ${request.property.title} ${request.tenant.fullName}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });
  }, [tab, query, categoryFilter, priorityFilter]);

  const byCategory = (
    ["plumbing", "electrical", "structural", "appliance", "pest", "other"] as const
  ).map((key, index) => ({
    label: humanize(key),
    value: maintenanceRequests.filter((r) => r.category === key).length,
    color: ["var(--brand)", "#38bdf8", "#34d399", "#fbbf24", "#f472b6", "var(--ink-subtle)"][index],
  }));

  const columns: Column<MaintenanceRequest>[] = [
    {
      key: "title",
      header: "Request",
      sortValue: (row) => row.title,
      cell: (row) => (
        <span className="block max-w-72">
          <span className="text-ink block truncate text-[13px] font-medium">{row.title}</span>
          <span className="text-ink-subtle block truncate text-xs">
            {humanize(row.category)} · {relativeTime(row.createdAt)}
          </span>
        </span>
      ),
    },
    {
      key: "property",
      header: "Property",
      hideOnMobile: true,
      cell: (row) => (
        <Link
          href={`/properties/${row.property.id}`}
          className="focus-ring text-ink-muted block max-w-44 truncate text-[13px] hover:underline"
        >
          {row.property.title}
        </Link>
      ),
    },
    {
      key: "tenant",
      header: "Reported by",
      cell: (row) => <UserCell name={row.tenant.fullName} />,
    },
    {
      key: "priority",
      header: "Priority",
      sortValue: (row) => statusFlow.indexOf(row.status as (typeof statusFlow)[number]),
      cell: (row) => <PriorityBadge priority={row.priority} />,
    },
    {
      key: "attachments",
      header: "Thread",
      align: "center",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-ink-subtle flex items-center justify-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <MessageSquare className="size-3.5" /> {row.commentsCount}
          </span>
          <span className="flex items-center gap-1">
            <Paperclip className="size-3.5" /> {row.mediaCount}
          </span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => row.status,
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (row) => (
        <Button
          size="sm"
          variant="subtle"
          onClick={(event) => {
            event.stopPropagation();
            setSelected(row);
          }}
        >
          Open
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Maintenance"
        description="Tenant-reported issues, their severity and who is working on them."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Open requests"
          value={String(maintenanceRequests.filter(isOpen).length)}
          icon={<Wrench className="size-4" />}
        />
        <StatCard
          label="Urgent"
          value={String(maintenanceRequests.filter((r) => r.priority === "urgent" && isOpen(r)).length)}
          hint="same-day response"
        />
        <StatCard label="Resolved this month" value="4" delta={18.2} />
        <StatCard label="Median time to resolve" value="3.2 days" delta={-11.4} hint="faster than last month" />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="By category" description="Where issues come from." />
          <CardBody>
            <Donut slices={byCategory} totalLabel="requests" />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Pipeline" description="Requests at each stage of the workflow." />
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-4">
              {statusFlow.map((status) => {
                const items = maintenanceRequests.filter((r) => r.status === status);
                return (
                  <div
                    key={status}
                    className="border-line bg-surface-muted min-h-40 rounded-xl border p-3"
                  >
                    <div className="mb-2.5 flex items-center justify-between">
                      <StatusBadge status={status} />
                      <span className="text-ink-subtle text-xs tabular-nums">{items.length}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {items.slice(0, 3).map((request) => (
                        <li
                          key={request.id}
                          className="bg-surface border-line rounded-lg border p-2"
                        >
                          <p className="text-ink line-clamp-2 text-xs leading-4 font-medium">
                            {request.title}
                          </p>
                          <p className="text-ink-subtle mt-1 truncate text-[11px]">
                            {request.property.title}
                          </p>
                        </li>
                      ))}
                      {items.length > 3 && (
                        <li className="text-ink-subtle px-1 text-[11px]">
                          +{items.length - 3} more
                        </li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <Tabs items={tabs} value={tab} onChange={setTab} className="px-3" />
        <FilterBar>
          <SearchInput
            placeholder="Search request, property or tenant…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-80"
          />
          <Select
            aria-label="Category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-auto"
          >
            <option value="all">All categories</option>
            {["plumbing", "electrical", "structural", "appliance", "pest", "other"].map((c) => (
              <option key={c} value={c}>
                {humanize(c)}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-auto"
          >
            <option value="all">All priorities</option>
            {["urgent", "high", "medium", "low"].map((p) => (
              <option key={p} value={p}>
                {humanize(p)}
              </option>
            ))}
          </Select>
        </FilterBar>

        {rows.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<Wrench className="size-5" />}
              title="Nothing to fix here"
              description="No requests match the current tab and filters."
            />
          </CardBody>
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} pageSize={10} />
        )}
      </Card>

      <Drawer
        open={selected != null}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ""}
        subtitle={selected?.property.title}
        footer={
          <>
            <Button variant="danger" onClick={() => setSelected(null)}>
              <XCircle className="size-4" /> Reject
            </Button>
            <Button variant="primary" onClick={() => setSelected(null)}>
              <CheckCircle2 className="size-4" /> Mark resolved
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selected.status} />
              <PriorityBadge priority={selected.priority} />
              <Badge tone="neutral">{humanize(selected.category)}</Badge>
            </div>

            <p className="text-ink-muted text-[13px] leading-6">{selected.description}</p>

            <DefinitionList
              items={[
                { label: "Request ID", value: `#${selected.id}` },
                { label: "Reported by", value: selected.tenant.fullName },
                { label: "Landlord", value: selected.landlord.fullName },
                { label: "Raised", value: formatDateTime(selected.createdAt) },
                { label: "Last update", value: formatDateTime(selected.updatedAt) },
                { label: "Attachments", value: `${selected.mediaCount} file(s)` },
              ]}
            />

            <div>
              <p className="text-ink mb-2 text-[13px] font-medium">Change status</p>
              <div className="flex flex-wrap gap-1.5">
                {statusFlow.map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={selected.status === status ? "subtle" : "secondary"}
                  >
                    {humanize(status)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-line bg-surface-muted rounded-xl border p-4">
              <p className="text-ink flex items-center gap-1.5 text-[13px] font-medium">
                <Forward className="size-3.5" /> Forward to a service provider
              </p>
              <p className="text-ink-subtle mt-0.5 text-xs">
                Creates a service request and notifies matching providers in the area.
              </p>
              <Select aria-label="Service provider" className="mt-3">
                {serviceProviders
                  .filter((p) => p.status === "active")
                  .map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.businessName} — {provider.categories.join(", ")}
                    </option>
                  ))}
              </Select>
              <Button className="mt-2.5 w-full justify-center">Forward request</Button>
            </div>

            <div>
              <p className="text-ink mb-2 text-[13px] font-medium">
                Comments ({selected.commentsCount})
              </p>
              {selected.commentsCount === 0 ? (
                <EmptyState
                  icon={<MessageSquare className="size-5" />}
                  title="No comments yet"
                  description="Reply to let the tenant know the request has been seen."
                />
              ) : (
                <ul className="space-y-3">
                  <li className="flex gap-2.5">
                    <Avatar name={selected.tenant.fullName} size="sm" />
                    <div className="bg-surface-muted min-w-0 flex-1 rounded-xl p-3">
                      <p className="text-ink text-xs font-medium">{selected.tenant.fullName}</p>
                      <p className="text-ink-muted mt-1 text-[13px] leading-5">
                        Could someone come today? It is getting worse.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-2.5">
                    <Avatar name={selected.landlord.fullName} size="sm" />
                    <div className="bg-brand-soft min-w-0 flex-1 rounded-xl p-3">
                      <p className="text-brand-ink text-xs font-medium">
                        {selected.landlord.fullName}
                      </p>
                      <p className="text-ink mt-1 text-[13px] leading-5">
                        A technician has been assigned and will visit this afternoon.
                      </p>
                    </div>
                  </li>
                </ul>
              )}
              <Field label="Add a comment" className="mt-4">
                <Textarea placeholder="Write an update for the tenant…" />
              </Field>
              <Button className="mt-2">
                <Send className="size-4" /> Post comment
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
