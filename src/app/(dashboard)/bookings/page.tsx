"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { SearchInput, Select } from "@/components/ui/field";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import {
  DefinitionList, EmptyState, FilterBar, PageHeader, Progress, StatCard,
} from "@/components/ui/misc";
import { CardSkeleton, ErrorState, TableSkeleton } from "@/components/ui/states";
import { RequirePermission } from "@/components/layout/permission-gate";
import { useApi } from "@/lib/api/hooks";
import { useAdminSession } from "@/lib/api/admin-session";
import { getAdminBookingsOverview, listAdminBookings } from "@/lib/api/admin";
import type { AdminBooking } from "@/lib/api/admin-types";
import { formatDateTime, humanize, money, number } from "@/lib/utils";

const tabs = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "rejected", label: "Rejected" },
  { id: "cancelled", label: "Cancelled" },
];

export default function BookingsPage() {
  return (
    <RequirePermission codes={["operations.view"]}>
      <Bookings />
    </RequirePermission>
  );
}

function Bookings() {
  const { can } = useAdminSession();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [payment, setPayment] = useState("all");

  const feed = useApi(
    useCallback(
      () =>
        listAdminBookings({
          status: tab === "all" ? undefined : tab,
          paymentStatus: payment === "all" ? undefined : payment,
          search: search.trim() || undefined,
        }),
      [tab, payment, search],
    ),
  );
  const overview = useApi(
    useCallback(
      () => (can("analytics.view") ? getAdminBookingsOverview() : Promise.resolve(null)),
      [can],
    ),
  );

  const rows = useMemo(() => feed.data?.results ?? [], [feed.data]);

  const columns: Column<AdminBooking>[] = [
    {
      key: "purpose",
      header: "Booking",
      cell: (row) => (
        <span className="block max-w-56">
          <span className="text-ink block truncate text-[13px] font-medium">{row.purpose}</span>
          <span className="text-ink-subtle block truncate text-xs">
            {row.unitName ?? "Whole property"}
            {row.isManualBooking && " · manual"}
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
          href={`/properties/${row.propertyId}`}
          className="focus-ring text-ink-muted block max-w-44 truncate text-[13px] hover:underline"
        >
          {row.propertyTitle}
        </Link>
      ),
    },
    {
      key: "people",
      header: "Booker",
      hideOnMobile: true,
      cell: (row) => (
        <span className="block max-w-44">
          <span className="text-ink block truncate text-[13px]">
            {row.bookerEmail || "Walk-in"}
          </span>
          <span className="text-ink-subtle block truncate text-xs">{row.landlordEmail}</span>
        </span>
      ),
    },
    {
      key: "when",
      header: "Slot",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-ink-muted text-xs whitespace-nowrap">
          {formatDateTime(row.startDatetime)}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (row) => (
        <span className="text-ink text-[13px] font-medium tabular-nums">
          {money(row.finalAmount ?? row.confirmationAmountPaid)}
        </span>
      ),
    },
    { key: "payment", header: "Payment", cell: (row) => <StatusBadge status={row.paymentStatus} /> },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span className="flex items-center gap-1.5">
          <StatusBadge status={row.status} />
          {row.isManualBooking && <Badge tone="neutral">Manual</Badge>}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Bookings"
        description="Every reservation on the platform. Read-only — landlords confirm and cancel."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bookings" value={number(feed.data?.count ?? 0)} icon={<CalendarCheck className="size-4" />} />
        <StatCard label="Revenue" value={money(overview.data?.revenue)} hint="confirmed and paid" />
        <StatCard
          label="Cancellation rate"
          value={overview.data ? `${overview.data.cancellationRate.toFixed(1)}%` : "—"}
        />
        <StatCard
          label="Avg. time to confirm"
          value={overview.data ? `${overview.data.averageConfirmationHours.toFixed(1)} hrs` : "—"}
        />
      </div>

      {can("analytics.view") && (
        <Card className="mb-4">
          <CardHeader title="By status" description="Platform-wide booking mix." />
          {overview.loading && !overview.data ? (
            <CardSkeleton />
          ) : (
            <CardBody className="space-y-3.5">
              {Object.entries(overview.data?.byStatus ?? {}).map(([status, count], index) => (
                <div key={status}>
                  <div className="mb-1 flex items-baseline justify-between text-[13px]">
                    <span className="text-ink font-medium">{humanize(status)}</span>
                    <span className="text-ink-muted tabular-nums">{count}</span>
                  </div>
                  <Progress
                    value={count}
                    max={Math.max(overview.data?.totalBookings ?? 1, 1)}
                    tone={(["brand", "ok", "warn", "bad"] as const)[index % 4]}
                  />
                </div>
              ))}
              {Object.keys(overview.data?.byStatus ?? {}).length === 0 && (
                <EmptyState icon={<CalendarCheck className="size-5" />} title="No bookings yet" />
              )}
            </CardBody>
          )}
        </Card>
      )}

      <Card>
        <Tabs items={tabs} value={tab} onChange={setTab} className="px-3" />
        <FilterBar>
          <SearchInput
            placeholder="Search purpose, property or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72"
          />
          <Select
            aria-label="Payment"
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
            className="w-auto"
          >
            <option value="all">Any payment state</option>
            <option value="not_required">Not required</option>
            <option value="awaiting_payment">Awaiting payment</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </Select>
        </FilterBar>

        {feed.error ? (
          <CardBody>
            <ErrorState error={feed.error} onRetry={feed.refetch} resource="bookings" />
          </CardBody>
        ) : feed.loading && !feed.data ? (
          <TableSkeleton rows={6} columns={6} />
        ) : rows.length === 0 ? (
          <CardBody>
            <EmptyState icon={<CalendarCheck className="size-5" />} title="No bookings match" />
          </CardBody>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            pageSize={12}
            expandedContent={(booking) => (
              <DefinitionList
                items={[
                  { label: "Booking ID", value: `#${booking.id}` },
                  { label: "Guests", value: booking.numGuests ?? "—" },
                  { label: "Promo code", value: booking.promoCode || "—" },
                  { label: "Discount", value: money(booking.discountAmount) },
                  { label: "Confirmation paid", value: money(booking.confirmationAmountPaid) },
                  { label: "Created", value: formatDateTime(booking.createdAt) },
                  { label: "Ends", value: formatDateTime(booking.endDatetime) },
                  { label: "Source", value: booking.isManualBooking ? "Manual" : "Tenant app" },
                ]}
              />
            )}
          />
        )}
      </Card>
    </>
  );
}
