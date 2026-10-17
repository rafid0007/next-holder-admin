"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck, Briefcase, CheckCircle2, FileText, MapPin, PauseCircle, Star, Users, XCircle,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, SearchInput, Select, Textarea } from "@/components/ui/field";
import { Drawer } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import {
  Avatar, DefinitionList, EmptyState, FilterBar, PageHeader, StatCard, UserCell,
} from "@/components/ui/misc";
import { serviceProviders, workOrders } from "@/lib/mock/data";
import type { ServiceProvider } from "@/lib/api/types";
import { formatDate, humanize, money, relativeTime } from "@/lib/utils";

export default function ServiceProvidersPage() {
  const [tab, setTab] = useState("pending_verification");
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [reviewing, setReviewing] = useState<ServiceProvider | null>(null);

  const tabs = useMemo(
    () =>
      [
        { id: "pending_verification", label: "Applications" },
        { id: "active", label: "Active" },
        { id: "paused", label: "Paused" },
        { id: "suspended", label: "Suspended" },
        { id: "all", label: "All" },
      ].map((t) => ({
        ...t,
        count:
          t.id === "all"
            ? serviceProviders.length
            : serviceProviders.filter((p) => p.status === t.id).length,
      })),
    [],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return serviceProviders.filter((provider) => {
      if (tab !== "all" && provider.status !== tab) return false;
      if (planFilter !== "all" && provider.plan !== planFilter) return false;
      if (
        q &&
        !`${provider.businessName} ${provider.owner.fullName} ${provider.categories.join(" ")}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });
  }, [tab, query, planFilter]);

  const columns: Column<ServiceProvider>[] = [
    {
      key: "business",
      header: "Provider",
      sortValue: (row) => row.businessName,
      cell: (row) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={row.businessName} />
          <span className="min-w-0">
            <span className="text-ink flex items-center gap-1.5 text-[13px] font-medium">
              <span className="max-w-48 truncate">{row.businessName}</span>
              {row.verificationStatus === "verified" && (
                <BadgeCheck className="text-ok size-3.5 shrink-0" />
              )}
            </span>
            <span className="text-ink-subtle block truncate text-xs">
              {humanize(row.providerType)} · {row.categories.join(", ")}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      hideOnMobile: true,
      cell: (row) => <UserCell name={row.owner.fullName} meta={row.owner.phoneNumber} />,
    },
    {
      key: "areas",
      header: "Service areas",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-ink-muted flex max-w-44 items-center gap-1 truncate text-xs">
          <MapPin className="size-3 shrink-0" />
          {row.serviceAreas.join(", ")}
        </span>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      align: "center",
      sortValue: (row) => row.rating ?? 0,
      cell: (row) =>
        row.rating ? (
          <span className="text-ink flex items-center justify-center gap-1 text-[13px] tabular-nums">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            {row.rating.toFixed(1)}
          </span>
        ) : (
          <span className="text-ink-subtle text-xs">New</span>
        ),
    },
    {
      key: "jobs",
      header: "Jobs",
      align: "right",
      hideOnMobile: true,
      sortValue: (row) => row.completedJobs,
      cell: (row) => <span className="text-ink-muted text-[13px] tabular-nums">{row.completedJobs}</span>,
    },
    {
      key: "plan",
      header: "Plan",
      hideOnMobile: true,
      cell: (row) => <Badge tone="neutral">{humanize(row.plan ?? "starter")}</Badge>,
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
          variant={row.status === "pending_verification" ? "subtle" : "secondary"}
          onClick={(event) => {
            event.stopPropagation();
            setReviewing(row);
          }}
        >
          {row.status === "pending_verification" ? "Review" : "Open"}
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Service providers"
        description="Verification applications, active providers and the work orders they are running."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Applications pending"
          value={String(serviceProviders.filter((p) => p.status === "pending_verification").length)}
          icon={<FileText className="size-4" />}
          hint="awaiting review"
        />
        <StatCard
          label="Active providers"
          value={String(serviceProviders.filter((p) => p.status === "active").length)}
          delta={8.3}
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="Open work orders"
          value={String(workOrders.filter((w) => ["scheduled", "in_progress"].includes(w.status)).length)}
          icon={<Briefcase className="size-4" />}
        />
        <StatCard
          label="Disputed"
          value={String(workOrders.filter((w) => w.status === "disputed").length)}
          hint="needs mediation"
        />
      </div>

      <Card>
        <Tabs items={tabs} value={tab} onChange={setTab} className="px-3" />
        <FilterBar>
          <SearchInput
            placeholder="Search business, owner or category…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-80"
          />
          <Select
            aria-label="Plan"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="w-auto"
          >
            <option value="all">All plans</option>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="business">Business</option>
          </Select>
        </FilterBar>

        {rows.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<Users className="size-5" />}
              title="No providers in this state"
              description="Nothing matches the current tab and filters."
            />
          </CardBody>
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} pageSize={10} />
        )}
      </Card>

      <Card className="mt-4">
        <CardHeader
          title="Work orders"
          description="Accepted quotes being delivered, including disputes."
        />
        <DataTable
          rows={workOrders}
          rowKey={(row) => row.id}
          pageSize={6}
          columns={[
            {
              key: "reference",
              header: "Reference",
              cell: (row) => (
                <span>
                  <span className="text-ink block font-mono text-xs font-medium">
                    {row.reference}
                  </span>
                  <span className="text-ink-subtle block max-w-48 truncate text-xs">
                    {row.serviceType}
                  </span>
                </span>
              ),
            },
            {
              key: "provider",
              header: "Provider",
              hideOnMobile: true,
              cell: (row) => (
                <span className="text-ink-muted block max-w-40 truncate text-[13px]">
                  {row.provider.businessName}
                </span>
              ),
            },
            {
              key: "requester",
              header: "Requested by",
              hideOnMobile: true,
              cell: (row) => <UserCell name={row.requester.fullName} />,
            },
            {
              key: "scheduled",
              header: "Scheduled",
              hideOnMobile: true,
              cell: (row) => (
                <span className="text-ink-muted text-xs">
                  {row.scheduledFor ? formatDate(row.scheduledFor) : "Not scheduled"}
                </span>
              ),
            },
            {
              key: "amount",
              header: "Amount",
              align: "right",
              sortValue: (row) => row.amount,
              cell: (row) => (
                <span className="text-ink text-[13px] font-medium tabular-nums">
                  {money(row.amount)}
                </span>
              ),
            },
            { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
          ]}
        />
      </Card>

      <Drawer
        open={reviewing != null}
        onClose={() => setReviewing(null)}
        title={reviewing?.businessName ?? ""}
        subtitle={reviewing ? `${humanize(reviewing.providerType)} · ${reviewing.owner.email}` : ""}
        footer={
          reviewing?.status === "pending_verification" ? (
            <>
              <Button variant="danger" onClick={() => setReviewing(null)}>
                <XCircle className="size-4" /> Reject
              </Button>
              <Button variant="primary" onClick={() => setReviewing(null)}>
                <CheckCircle2 className="size-4" /> Approve provider
              </Button>
            </>
          ) : (
            <>
              <Button variant="danger" onClick={() => setReviewing(null)}>
                <PauseCircle className="size-4" /> Suspend
              </Button>
              <Button onClick={() => setReviewing(null)}>Close</Button>
            </>
          )
        }
      >
        {reviewing && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={reviewing.status} />
              <Badge tone={reviewing.verificationStatus === "verified" ? "ok" : "warn"}>
                {humanize(reviewing.verificationStatus)}
              </Badge>
              <Badge tone="neutral">{humanize(reviewing.plan ?? "starter")} plan</Badge>
            </div>

            <DefinitionList
              items={[
                { label: "Provider ID", value: `#${reviewing.id}` },
                { label: "Owner", value: reviewing.owner.fullName },
                { label: "Phone", value: reviewing.owner.phoneNumber },
                { label: "Applied", value: relativeTime(reviewing.submittedAt) },
                { label: "Categories", value: reviewing.categories.join(", ") },
                { label: "Service areas", value: reviewing.serviceAreas.join(", ") },
                { label: "Completed jobs", value: String(reviewing.completedJobs) },
                {
                  label: "Rating",
                  value: reviewing.rating ? `${reviewing.rating.toFixed(1)} / 5` : "No reviews yet",
                },
              ]}
            />

            <div>
              <p className="text-ink mb-2 text-[13px] font-medium">
                Verification documents ({reviewing.documentsCount})
              </p>
              {reviewing.documentsCount === 0 ? (
                <EmptyState
                  icon={<FileText className="size-5" />}
                  title="No documents uploaded"
                  description="The provider must submit identity documents before approval."
                />
              ) : (
                <ul className="space-y-2">
                  {[
                    "National ID (front)",
                    "National ID (back)",
                    "Trade licence",
                    "Utility bill",
                    "Workplace photo",
                    "Other",
                  ]
                    .slice(0, reviewing.documentsCount)
                    .map((label) => (
                      <li
                        key={label}
                        className="border-line bg-surface-muted flex items-center gap-3 rounded-lg border p-2.5"
                      >
                        <span className="bg-surface text-ink-subtle grid size-8 shrink-0 place-items-center rounded-md">
                          <FileText className="size-4" />
                        </span>
                        <span className="text-ink min-w-0 flex-1 truncate text-[13px]">{label}</span>
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            <Field label="Decision note" hint="Shared with the provider when you reject or suspend.">
              <Textarea placeholder="The trade licence has expired — please upload a current one." />
            </Field>
          </div>
        )}
      </Drawer>
    </>
  );
}
