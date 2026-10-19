"use client";

import { useCallback, useMemo, useState } from "react";
import {
  BadgeCheck, Briefcase, CheckCircle2, FileText, PauseCircle, Users, XCircle,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, SearchInput, Select, Textarea } from "@/components/ui/field";
import { Drawer } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import {
  Avatar, DefinitionList, EmptyState, FilterBar, PageHeader, StatCard, UserCell,
} from "@/components/ui/misc";
import { ErrorState, TableSkeleton } from "@/components/ui/states";
import { useApi } from "@/lib/api/hooks";
import {
  approveProvider, listProviderApplications, listWorkOrders, rejectProvider, suspendProvider,
} from "@/lib/api/resources";
import type { ApiServiceProviderApplication } from "@/lib/api/types";
import { formatDate, humanize, money, relativeTime } from "@/lib/utils";

export default function ServiceProvidersPage() {
  const [tab, setTab] = useState("pending_verification");
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [reviewing, setReviewing] = useState<ApiServiceProviderApplication | null>(null);

  // Both endpoints are staff-only; a landlord account gets a 403 the error
  // state explains rather than an empty table.
  const feed = useApi(useCallback(() => listProviderApplications(), []));
  const orders = useApi(useCallback(() => listWorkOrders(), []));
  const [decisionNote, setDecisionNote] = useState("");

  async function decide(action: () => Promise<unknown>) {
    await action();
    setReviewing(null);
    setDecisionNote("");
    feed.refetch();
  }

  const serviceProviders: ApiServiceProviderApplication[] = useMemo(
    () => feed.data?.results ?? [],
    [feed.data],
  );
  const workOrders = useMemo(() => orders.data?.results ?? [], [orders.data]);

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
    [serviceProviders],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return serviceProviders.filter((provider) => {
      if (tab !== "all" && provider.status !== tab) return false;
      if (
        q &&
        !`${provider.businessName} ${provider.userFullName} ${provider.userEmail}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });
  }, [serviceProviders, tab, query]);

  const columns: Column<ApiServiceProviderApplication>[] = [
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
              {humanize(row.providerType)}
              {row.tagline && ` · ${row.tagline}`}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      hideOnMobile: true,
      cell: (row) => <UserCell name={row.userFullName} meta={row.userEmail} />,
    },
    {
      key: "experience",
      header: "Experience",
      align: "center",
      hideOnMobile: true,
      sortValue: (row) => row.yearsExperience,
      cell: (row) => (
        <span className="text-ink-muted text-[13px] tabular-nums">
          {row.yearsExperience ? `${row.yearsExperience} yrs` : "—"}
        </span>
      ),
    },
    {
      key: "docs",
      header: "Documents",
      align: "right",
      hideOnMobile: true,
      sortValue: (row) => row.documents.length,
      cell: (row) => (
        <span className="text-ink-muted text-[13px] tabular-nums">{row.documents.length}</span>
      ),
    },
    {
      key: "verification",
      header: "Verification",
      hideOnMobile: true,
      cell: (row) => <StatusBadge status={row.verificationStatus} />,
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

        {feed.error ? (
          <CardBody>
            <ErrorState error={feed.error} onRetry={feed.refetch} resource="provider applications" />
          </CardBody>
        ) : feed.loading && !feed.data ? (
          <TableSkeleton rows={6} columns={5} />
        ) : rows.length === 0 ? (
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
        {orders.error ? (
          <CardBody>
            <ErrorState error={orders.error} onRetry={orders.refetch} resource="work orders" />
          </CardBody>
        ) : orders.loading && !orders.data ? (
          <TableSkeleton rows={4} columns={5} />
        ) : (
        <DataTable
          rows={workOrders}
          rowKey={(row) => row.id}
          pageSize={6}
          columns={[
            {
              key: "reference",
              header: "Work order",
              cell: (row) => (
                <span>
                  <span className="text-ink block font-mono text-xs font-medium">
                    WO-{row.id}
                  </span>
                  <span className="text-ink-subtle block max-w-48 truncate text-xs">
                    {row.requestTitle}
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
                  {row.providerName}
                </span>
              ),
            },
            {
              key: "requester",
              header: "Requested by",
              hideOnMobile: true,
              cell: (row) => <span className="text-ink-muted text-[13px]">#{row.requesterId}</span>,
            },
            {
              key: "scheduled",
              header: "Scheduled",
              hideOnMobile: true,
              cell: (row) => (
                <span className="text-ink-muted text-xs">
                  {row.scheduledAt ? formatDate(row.scheduledAt) : "Not scheduled"}
                </span>
              ),
            },
            {
              key: "amount",
              header: "Amount",
              align: "right",
              sortValue: (row) => Number(row.finalQuoteAmount),
              cell: (row) => (
                <span className="text-ink text-[13px] font-medium tabular-nums">
                  {money(row.finalQuoteAmount)}
                </span>
              ),
            },
            { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
          ]}
        />
        )}
      </Card>

      <Drawer
        open={reviewing != null}
        onClose={() => setReviewing(null)}
        title={reviewing?.businessName ?? ""}
        subtitle={reviewing ? `${humanize(reviewing.providerType)} · ${reviewing.userEmail}` : ""}
        footer={
          reviewing?.status === "pending_verification" ? (
            <>
              <Button
                variant="danger"
                onClick={() => decide(() => rejectProvider(reviewing.id, decisionNote))}
              >
                <XCircle className="size-4" /> Reject
              </Button>
              <Button variant="primary" onClick={() => decide(() => approveProvider(reviewing.id))}>
                <CheckCircle2 className="size-4" /> Approve provider
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="danger"
                disabled={!reviewing}
                onClick={() => reviewing && decide(() => suspendProvider(reviewing.id, decisionNote))}
              >
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
              <StatusBadge status={reviewing.verificationStatus} />
            </div>

            {reviewing.bio && (
              <p className="text-ink-muted text-[13px] leading-6">{reviewing.bio}</p>
            )}

            <DefinitionList
              items={[
                { label: "Provider ID", value: `#${reviewing.id}` },
                { label: "Owner", value: reviewing.userFullName },
                { label: "Email", value: reviewing.userEmail },
                { label: "Type", value: humanize(reviewing.providerType) },
                { label: "Applied", value: relativeTime(reviewing.createdAt) },
                {
                  label: "Experience",
                  value: reviewing.yearsExperience ? `${reviewing.yearsExperience} years` : "—",
                },
                { label: "Offerings", value: String(reviewing.offerings.length) },
                {
                  label: "Approved",
                  value: reviewing.approvedAt ? formatDate(reviewing.approvedAt) : "Not yet",
                },
              ]}
            />

            {reviewing.rejectionReason && (
              <div className="bg-bad-soft border-bad/25 rounded-xl border p-3.5">
                <p className="text-bad text-[13px] leading-5">{reviewing.rejectionReason}</p>
              </div>
            )}

            <div>
              <p className="text-ink mb-2 text-[13px] font-medium">
                Verification documents ({reviewing.documents.length})
              </p>
              {reviewing.documents.length === 0 ? (
                <EmptyState
                  icon={<FileText className="size-5" />}
                  title="No documents uploaded"
                  description="The provider must submit identity documents before approval."
                />
              ) : (
                <ul className="space-y-2">
                  {reviewing.documents.map((document) => (
                    <li
                      key={document.id}
                      className="border-line bg-surface-muted flex items-center gap-3 rounded-lg border p-2.5"
                    >
                      <span className="bg-surface text-ink-subtle grid size-8 shrink-0 place-items-center rounded-md">
                        <FileText className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-ink block truncate text-[13px]">
                          {humanize(document.documentType)}
                        </span>
                        {document.note && (
                          <span className="text-ink-subtle block truncate text-xs">
                            {document.note}
                          </span>
                        )}
                      </span>
                      {document.fileUrl && (
                        <a href={document.fileUrl} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="ghost">
                            View
                          </Button>
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Field label="Decision note" hint="Shared with the provider when you reject or suspend.">
              <Textarea
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder="The trade licence has expired — please upload a current one."
              />
            </Field>
          </div>
        )}
      </Drawer>
    </>
  );
}
