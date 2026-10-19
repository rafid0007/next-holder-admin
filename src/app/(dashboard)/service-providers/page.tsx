"use client";

import { useCallback, useMemo, useState } from "react";
import {
  BadgeCheck, Briefcase, CheckCircle2, FileText, PauseCircle, Users, XCircle,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, SearchInput, Textarea } from "@/components/ui/field";
import { Drawer } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import {
  Avatar, DefinitionList, EmptyState, FilterBar, PageHeader, StatCard, UserCell,
} from "@/components/ui/misc";
import { ErrorState, TableSkeleton } from "@/components/ui/states";
import { useApi } from "@/lib/api/hooks";
import { RequirePermission } from "@/components/layout/permission-gate";
import { useAdminSession } from "@/lib/api/admin-session";
import {
  approveProviderAdmin, listAdminProviderApplications, reinstateProviderAdmin,
  rejectProviderAdmin, suspendProviderAdmin,
} from "@/lib/api/admin";
import type { ApiServiceProviderApplication } from "@/lib/api/types";
import { formatDate, humanize, relativeTime } from "@/lib/utils";

export default function ServiceProvidersPage() {
  return (
    <RequirePermission codes={["providers.view"]}>
      <Providers />
    </RequirePermission>
  );
}

function Providers() {
  const { can } = useAdminSession();
  const [tab, setTab] = useState("pending_verification");
  const [query, setQuery] = useState("");
  const [reviewing, setReviewing] = useState<ApiServiceProviderApplication | null>(null);

  const feed = useApi(
    useCallback(
      () =>
        listAdminProviderApplications({
          status: tab === "all" ? undefined : tab,
          search: query.trim() || undefined,
        }),
      [tab, query],
    ),
  );
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

  const tabs = useMemo(
    () =>
      [
        { id: "pending_verification", label: "Applications" },
        { id: "active", label: "Active" },
        { id: "paused", label: "Paused" },
        { id: "suspended", label: "Suspended" },
        { id: "all", label: "All" },
      ].map((t) => ({ ...t })),
    [],
  );

  const rows = serviceProviders;

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
          label="Verified"
          value={String(serviceProviders.filter((p) => p.verificationStatus === "verified").length)}
          icon={<BadgeCheck className="size-4" />}
        />
        <StatCard
          label="Suspended"
          value={String(serviceProviders.filter((p) => p.status === "suspended").length)}
          hint="hidden from the marketplace"
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
          description="Jobs providers are delivering."
        />
        <CardBody>
          <EmptyState
            icon={<Briefcase className="size-5" />}
            title="Needs a staff endpoint"
            description="The admin API covers provider applications only. /service-providers/work-orders is scoped to the signed-in user, so it would show your own jobs rather than the platform's."
          />
        </CardBody>
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
                disabled={!can("providers.review")}
                onClick={() => decide(() => rejectProviderAdmin(reviewing.id, decisionNote || undefined))}
              >
                <XCircle className="size-4" /> Reject
              </Button>
              <Button
                variant="primary"
                disabled={!can("providers.review")}
                onClick={() => decide(() => approveProviderAdmin(reviewing.id))}
              >
                <CheckCircle2 className="size-4" /> Approve provider
              </Button>
            </>
          ) : (
            <>
              {reviewing?.status === "suspended" ? (
                <Button
                  variant="primary"
                  disabled={!can("providers.review")}
                  onClick={() =>
                    reviewing && decide(() => reinstateProviderAdmin(reviewing.id, decisionNote || undefined))
                  }
                >
                  <CheckCircle2 className="size-4" /> Reinstate
                </Button>
              ) : (
                <Button
                  variant="danger"
                  disabled={!reviewing || !can("providers.review")}
                  onClick={() =>
                    reviewing && decide(() => suspendProviderAdmin(reviewing.id, decisionNote || undefined))
                  }
                >
                  <PauseCircle className="size-4" /> Suspend
                </Button>
              )}
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
