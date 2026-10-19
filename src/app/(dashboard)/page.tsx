"use client";

import { useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight, Banknote, Building2, CalendarCheck, CircleAlert, Clock, FileText, Users, Wrench,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, StatusBadge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Progress, StatCard } from "@/components/ui/misc";
import { CardSkeleton, ErrorState } from "@/components/ui/states";
import { Donut } from "@/components/charts/donut";
import { useApi } from "@/lib/api/hooks";
import {
  getBookingReportOverview, getFinanceSummary, getReportOverview, listAllProperties,
  listBills, listBookings, listFinanceTransactions, listLeases, listMaintenance,
} from "@/lib/api/resources";
import { formatDateTime, humanize, money, number } from "@/lib/utils";

export default function DashboardPage() {
  const finance = useApi(useCallback(() => getFinanceSummary(), []));
  const report = useApi(useCallback(() => getReportOverview(), []));
  const bookingReport = useApi(useCallback(() => getBookingReportOverview(), []));
  const transactions = useApi(useCallback(() => listFinanceTransactions(), []));
  const properties = useApi(useCallback(() => listAllProperties(), []));

  // The queue counts come from the same lists the detail screens use; each is a
  // single page, which is enough for a count of outstanding work.
  const leases = useApi(useCallback(() => listLeases(), []));
  const bookings = useApi(useCallback(() => listBookings({ status: "pending" }), []));
  const bills = useApi(useCallback(() => listBills({ status: "pending_verification" }), []));
  const maintenance = useApi(useCallback(() => listMaintenance({ status: "pending" }), []));

  const pendingLeases = (leases.data?.results ?? []).filter((l) => l.status === "pending").length;

  const queue = [
    {
      label: "Leases awaiting signature",
      count: pendingLeases,
      href: "/leases",
      icon: FileText,
      tone: "warn" as Tone,
    },
    {
      label: "Bookings to approve",
      count: bookings.data?.count ?? 0,
      href: "/bookings",
      icon: CalendarCheck,
      tone: "brand" as Tone,
    },
    {
      label: "Payment proofs to verify",
      count: bills.data?.count ?? 0,
      href: "/rent",
      icon: Banknote,
      tone: "info" as Tone,
    },
    {
      label: "Maintenance requests pending",
      count: maintenance.data?.count ?? 0,
      href: "/maintenance",
      icon: Wrench,
      tone: "bad" as Tone,
    },
    {
      label: "Unpaid bills",
      count: report.data?.unpaidBills ?? 0,
      href: "/rent",
      icon: CircleAlert,
      tone: "warn" as Tone,
    },
    {
      label: "Confirmed bookings",
      count: report.data?.totalConfirmedBookings ?? 0,
      href: "/bookings",
      icon: Users,
      tone: "ok" as Tone,
    },
  ];

  const all = properties.data ?? [];
  const statusSlices = [
    { label: "Available", value: all.filter((p) => p.status === "available").length, color: "var(--ok)" },
    { label: "Occupied", value: all.filter((p) => p.status === "occupied").length, color: "var(--brand)" },
    { label: "Under maintenance", value: all.filter((p) => p.status === "maintenance").length, color: "var(--warn)" },
    { label: "Unlisted", value: all.filter((p) => p.status === "unlisted").length, color: "var(--ink-subtle)" },
  ];

  if (finance.error) {
    return (
      <>
        <PageHeader title="Dashboard" description="Platform health across your portfolio." />
        <Card>
          <CardBody className="py-10">
            <ErrorState error={finance.error} onRetry={finance.refetch} resource="the dashboard" />
          </CardBody>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your portfolio across tenancies, bookings and money."
        actions={
          <Button
            onClick={() => {
              finance.refetch();
              report.refetch();
              bookingReport.refetch();
            }}
          >
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {finance.loading && !finance.data ? (
          Array.from({ length: 4 }, (_, i) => (
            <Card key={i}>
              <CardSkeleton />
            </Card>
          ))
        ) : (
          <>
            <StatCard
              label="Total income"
              value={money(finance.data?.totalIncome)}
              hint="rent, bookings and sales"
              icon={<Banknote className="size-4" />}
            />
            <StatCard
              label="Properties"
              value={number(report.data?.totalProperties ?? all.length)}
              hint={`${number(report.data?.listedProperties ?? 0)} in marketplace`}
              icon={<Building2 className="size-4" />}
              href="/properties"
            />
            <StatCard
              label="Active leases"
              value={number(report.data?.activeLeases ?? 0)}
              hint={`${number(report.data?.activeTenants ?? 0)} tenants`}
              icon={<FileText className="size-4" />}
              href="/leases"
            />
            <StatCard
              label="Overdue"
              value={money(finance.data?.overduePayments)}
              hint={`${number(report.data?.unpaidBills ?? 0)} unpaid bills`}
              icon={<CircleAlert className="size-4" />}
              href="/rent"
            />
          </>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Income by stream"
            description="Straight from the landlord finance summary."
            action={<Badge tone="brand">All time</Badge>}
          />
          {finance.loading && !finance.data ? (
            <CardSkeleton />
          ) : (
            <CardBody className="space-y-3.5">
              {(
                [
                  ["Rent", finance.data?.rentIncome, "brand"],
                  ["Bookings", finance.data?.bookingIncome, "ok"],
                  ["Sales", finance.data?.saleIncome, "warn"],
                  ["Pending", finance.data?.pendingPayments, "info"],
                  ["Overdue", finance.data?.overduePayments, "bad"],
                ] as const
              ).map(([label, value, tone]) => (
                <div key={label}>
                  <div className="mb-1 flex items-baseline justify-between text-[13px]">
                    <span className="text-ink font-medium">{label}</span>
                    <span className="text-ink-muted tabular-nums">{money(value)}</span>
                  </div>
                  <Progress
                    value={Number(value ?? 0)}
                    max={Math.max(Number(finance.data?.totalIncome ?? 0), 1)}
                    tone={tone === "info" ? "brand" : tone}
                  />
                </div>
              ))}
            </CardBody>
          )}
        </Card>

        <Card>
          <CardHeader title="Needs attention" description="Items waiting on you." />
          <ul>
            {queue.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="hover:bg-surface-hover border-line focus-ring flex items-center gap-3 border-b px-5 py-3 transition-colors last:border-0"
                >
                  <span className="bg-surface-hover text-ink-muted grid size-8 shrink-0 place-items-center rounded-lg">
                    <item.icon className="size-4" />
                  </span>
                  <span className="text-ink min-w-0 flex-1 text-[13px]">{item.label}</span>
                  <Badge tone={item.count > 0 ? item.tone : "neutral"}>{item.count}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader
            title="Portfolio status"
            description={`${number(all.length)} properties`}
          />
          <CardBody>
            {properties.loading && !properties.data ? (
              <CardSkeleton className="p-0" />
            ) : all.length === 0 ? (
              <EmptyState
                icon={<Building2 className="size-5" />}
                title="No properties yet"
                description="Add your first property to see the breakdown here."
                action={
                  <Link href="/properties">
                    <Button variant="primary">Add a property</Button>
                  </Link>
                }
              />
            ) : (
              <>
                <Donut slices={statusSlices} totalLabel="properties" />
                <div className="border-line mt-5 border-t pt-4">
                  <Progress
                    value={report.data?.occupiedProperties ?? 0}
                    max={Math.max(all.length, 1)}
                    tone="brand"
                    label="Occupancy rate"
                  />
                </div>
              </>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Rent collection" description="Across every bill raised." />
          <CardBody className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-ink-subtle text-xs">Collected</p>
                <p className="text-ok mt-1 text-xl font-semibold tabular-nums">
                  {money(finance.data?.rentIncome)}
                </p>
              </div>
              <div>
                <p className="text-ink-subtle text-xs">Outstanding</p>
                <p className="text-bad mt-1 text-xl font-semibold tabular-nums">
                  {money(report.data?.totalUnpaidAmount)}
                </p>
              </div>
            </div>
            <Progress
              value={Number(finance.data?.rentIncome ?? 0)}
              max={Math.max(
                Number(finance.data?.rentIncome ?? 0) + Number(report.data?.totalUnpaidAmount ?? 0),
                1,
              )}
              tone="ok"
              label="Collection rate"
            />
            <ul className="space-y-2.5">
              <li className="flex items-center justify-between text-[13px]">
                <span className="text-ink-muted">Pending payments</span>
                <span className="text-ink font-medium tabular-nums">
                  {money(finance.data?.pendingPayments)}
                </span>
              </li>
              <li className="flex items-center justify-between text-[13px]">
                <span className="text-ink-muted">Overdue payments</span>
                <span className="text-ink font-medium tabular-nums">
                  {money(finance.data?.overduePayments)}
                </span>
              </li>
              <li className="flex items-center justify-between text-[13px]">
                <span className="text-ink-muted">Unpaid bills</span>
                <span className="text-ink font-medium tabular-nums">
                  {number(report.data?.unpaidBills ?? 0)}
                </span>
              </li>
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Bookings"
            description={`${number(bookingReport.data?.totalBookings ?? 0)} in total`}
          />
          <CardBody className="space-y-3.5">
            {bookingReport.loading && !bookingReport.data ? (
              <CardSkeleton className="p-0" />
            ) : Object.keys(bookingReport.data?.byStatus ?? {}).length === 0 ? (
              <EmptyState
                icon={<CalendarCheck className="size-5" />}
                title="No bookings yet"
                description="Status counts appear once bookings exist."
              />
            ) : (
              <>
                {Object.entries(bookingReport.data?.byStatus ?? {}).map(([status, count], index) => (
                  <div key={status}>
                    <div className="mb-1 flex items-baseline justify-between text-[13px]">
                      <span className="text-ink font-medium">{humanize(status)}</span>
                      <span className="text-ink-muted tabular-nums">{count}</span>
                    </div>
                    <Progress
                      value={count}
                      max={Math.max(bookingReport.data?.totalBookings ?? 1, 1)}
                      tone={(["brand", "ok", "warn", "bad"] as const)[index % 4]}
                    />
                  </div>
                ))}
                <div className="border-line mt-1 border-t pt-3 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Revenue</span>
                    <span className="text-ink font-medium tabular-nums">
                      {money(bookingReport.data?.revenue)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex justify-between">
                    <span className="text-ink-muted">Cancellation rate</span>
                    <span className="text-ink font-medium tabular-nums">
                      {((bookingReport.data?.cancellationRate ?? 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Recent transactions"
          description="Rent and booking money, newest first."
          action={
            <Link href="/rent">
              <Button size="sm" variant="ghost">
                View bills <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          }
        />
        {transactions.error ? (
          <CardBody>
            <ErrorState
              error={transactions.error}
              onRetry={transactions.refetch}
              resource="transactions"
            />
          </CardBody>
        ) : transactions.loading && !transactions.data ? (
          <CardSkeleton />
        ) : (transactions.data ?? []).length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<Clock className="size-5" />}
              title="No transactions yet"
              description="Rent payments and booking income appear here as they land."
            />
          </CardBody>
        ) : (
          <ul>
            {(transactions.data ?? []).slice(0, 8).map((entry) => (
              <li
                key={`${entry.source}-${entry.id}`}
                className="border-line flex items-center gap-3 border-b px-5 py-3.5 last:border-0"
              >
                <span className="bg-surface-hover text-ink-subtle grid size-8 shrink-0 place-items-center rounded-lg">
                  {entry.source === "booking" ? (
                    <CalendarCheck className="size-4" />
                  ) : (
                    <Banknote className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-ink truncate text-[13px] font-medium">{entry.description}</p>
                  <p className="text-ink-subtle truncate text-xs">
                    {entry.propertyTitle} · {formatDateTime(entry.date)}
                  </p>
                </div>
                <StatusBadge status={entry.status} />
                <span className="text-ink shrink-0 text-[13px] font-medium tabular-nums">
                  {money(entry.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {report.data && (
        <p className="text-ink-subtle mt-6 text-center text-xs">
          {number(report.data.totalProperties)} properties ·{" "}
          {number(report.data.activeLeases)} active leases ·{" "}
          {number(report.data.pendingMaintenanceRequests)} maintenance requests pending
        </p>
      )}
    </>
  );
}
