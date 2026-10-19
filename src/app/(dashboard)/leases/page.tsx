"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/field";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import {
  DefinitionList, EmptyState, FilterBar, PageHeader, StatCard, UserCell,
} from "@/components/ui/misc";
import { ErrorState, TableSkeleton } from "@/components/ui/states";
import { RequirePermission } from "@/components/layout/permission-gate";
import { useApi } from "@/lib/api/hooks";
import { listAdminLeases } from "@/lib/api/admin";
import type { AdminLease } from "@/lib/api/admin-types";
import { formatDate, money, number } from "@/lib/utils";

const tabs = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "active", label: "Active" },
  { id: "expired", label: "Expired" },
  { id: "terminated", label: "Terminated" },
];

export default function LeasesPage() {
  return (
    <RequirePermission codes={["operations.view"]}>
      <Leases />
    </RequirePermission>
  );
}

function Leases() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const feed = useApi(
    useCallback(
      () =>
        listAdminLeases({
          status: tab === "all" ? undefined : tab,
          search: search.trim() || undefined,
        }),
      [tab, search],
    ),
  );

  const rows = useMemo(() => feed.data?.results ?? [], [feed.data]);
  const contracted = rows
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + Number(l.rentAmount), 0);

  const columns: Column<AdminLease>[] = [
    {
      key: "property",
      header: "Property",
      cell: (row) => (
        <Link
          href={`/properties/${row.propertyId}`}
          className="focus-ring block max-w-56"
        >
          <span className="text-ink block truncate text-[13px] font-medium hover:underline">
            {row.propertyTitle}
          </span>
          <span className="text-ink-subtle block truncate text-xs">
            {row.propertyCity}
            {row.holdingNumber && ` · ${row.holdingNumber}`}
          </span>
        </Link>
      ),
    },
    { key: "tenant", header: "Tenant", cell: (row) => <UserCell name={row.tenant.fullName} meta={row.tenant.email} /> },
    {
      key: "landlord",
      header: "Landlord",
      hideOnMobile: true,
      cell: (row) => <UserCell name={row.landlord.fullName} meta={row.landlord.email} />,
    },
    {
      key: "term",
      header: "Term",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-ink-muted text-xs whitespace-nowrap">
          {formatDate(row.startDate)} → {formatDate(row.endDate)}
        </span>
      ),
    },
    {
      key: "rent",
      header: "Rent",
      align: "right",
      cell: (row) => (
        <span className="text-ink text-[13px] font-medium tabular-nums">
          {money(row.rentAmount)}
        </span>
      ),
    },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Leases"
        description="Every tenancy on the platform. Read-only — landlords and tenants drive the lifecycle."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Leases" value={number(feed.data?.count ?? 0)} icon={<FileText className="size-4" />} />
        <StatCard label="Active on this page" value={number(rows.filter((l) => l.status === "active").length)} />
        <StatCard label="Pending signature" value={number(rows.filter((l) => l.status === "pending").length)} />
        <StatCard label="Contracted rent" value={money(contracted)} hint="active leases here" />
      </div>

      <Card>
        <Tabs items={tabs} value={tab} onChange={setTab} className="px-3" />
        <FilterBar>
          <SearchInput
            placeholder="Search property, tenant or landlord…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80"
          />
        </FilterBar>

        {feed.error ? (
          <CardBody>
            <ErrorState error={feed.error} onRetry={feed.refetch} resource="leases" />
          </CardBody>
        ) : feed.loading && !feed.data ? (
          <TableSkeleton rows={6} columns={5} />
        ) : rows.length === 0 ? (
          <CardBody>
            <EmptyState icon={<FileText className="size-5" />} title="No leases match" />
          </CardBody>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            pageSize={12}
            expandedContent={(lease) => (
              <DefinitionList
                items={[
                  { label: "Lease ID", value: `#${lease.id}` },
                  { label: "Created", value: formatDate(lease.createdAt) },
                  { label: "Deposit", value: money(lease.depositAmount) },
                  { label: "Holding", value: lease.holdingNumber ?? "—" },
                  { label: "Tenant email", value: lease.tenant.email },
                  { label: "Landlord email", value: lease.landlord.email },
                ]}
              />
            )}
          />
        )}
      </Card>
    </>
  );
}
