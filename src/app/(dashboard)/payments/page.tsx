"use client";

import { useCallback, useMemo, useState } from "react";
import { Receipt } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Select } from "@/components/ui/field";
import { DataTable, type Column } from "@/components/ui/table";
import { EmptyState, FilterBar, PageHeader, StatCard } from "@/components/ui/misc";
import { ErrorState, TableSkeleton } from "@/components/ui/states";
import { RequirePermission } from "@/components/layout/permission-gate";
import { useApi } from "@/lib/api/hooks";
import { listPayments } from "@/lib/api/admin";
import type { AdminPayment } from "@/lib/api/admin-types";
import { formatDateTime, humanize, money, number } from "@/lib/utils";

export default function PaymentsPage() {
  return (
    <RequirePermission codes={["operations.view"]}>
      <Payments />
    </RequirePermission>
  );
}

function Payments() {
  const [status, setStatus] = useState("all");
  const [gateway, setGateway] = useState("all");

  const feed = useApi(
    useCallback(
      () =>
        listPayments({
          status: status === "all" ? undefined : status,
          gateway: gateway === "all" ? undefined : gateway,
        }),
      [status, gateway],
    ),
  );

  const rows = useMemo(() => feed.data?.results ?? [], [feed.data]);
  const settled = rows
    .filter((p) => p.status === "succeeded")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const columns: Column<AdminPayment>[] = [
    {
      key: "id",
      header: "Payment",
      cell: (row) => (
        <span>
          <span className="text-ink block font-mono text-xs font-medium">#{row.id}</span>
          <span className="text-ink-subtle block max-w-56 truncate text-xs">
            {row.externalReference || "no gateway reference"}
          </span>
        </span>
      ),
    },
    {
      key: "booking",
      header: "Booking",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-ink-muted text-[13px]">
          {row.bookingId ? `#${row.bookingId}` : row.bookingGroupId ? `Group #${row.bookingGroupId}` : "—"}
        </span>
      ),
    },
    {
      key: "gateway",
      header: "Gateway",
      hideOnMobile: true,
      cell: (row) => <Badge tone="neutral">{humanize(row.gateway)}</Badge>,
    },
    {
      key: "created",
      header: "When",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-ink-muted text-xs">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (row) => (
        <span className="text-ink text-[13px] font-medium tabular-nums">{money(row.amount)}</span>
      ),
    },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Payments"
        description="Gateway transactions behind booking confirmations. Read-only."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Payments" value={number(feed.data?.count ?? 0)} icon={<Receipt className="size-4" />} />
        <StatCard label="Settled on this page" value={money(settled)} />
        <StatCard
          label="Failed"
          value={number(rows.filter((p) => p.status === "failed").length)}
        />
        <StatCard
          label="Refunded"
          value={number(rows.filter((p) => p.status === "refunded").length)}
        />
      </div>

      <Card>
        <FilterBar>
          <Select
            aria-label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-auto"
          >
            <option value="all">Any status</option>
            <option value="initiated">Initiated</option>
            <option value="succeeded">Succeeded</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </Select>
          <Select
            aria-label="Gateway"
            value={gateway}
            onChange={(e) => setGateway(e.target.value)}
            className="w-auto"
          >
            <option value="all">Any gateway</option>
            <option value="stub">Stub</option>
            <option value="stripe">Stripe</option>
            <option value="sslcommerz">SSLCommerz</option>
          </Select>
        </FilterBar>

        {feed.error ? (
          <CardBody>
            <ErrorState error={feed.error} onRetry={feed.refetch} resource="payments" />
          </CardBody>
        ) : feed.loading && !feed.data ? (
          <TableSkeleton rows={6} columns={5} />
        ) : rows.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<Receipt className="size-5" />}
              title="No payments"
              description="Gateway transactions appear here once bookings are paid."
            />
          </CardBody>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            pageSize={10}
            expandedContent={(row) => (
              <pre className="text-ink-muted bg-surface overflow-x-auto rounded-lg p-3 font-mono text-xs">
                {JSON.stringify(row.gatewayResponse, null, 2) || "{}"}
              </pre>
            )}
          />
        )}
      </Card>
    </>
  );
}
