"use client";

import { useCallback } from "react";
import Link from "next/link";
import {
  Banknote, Building2, CalendarCheck, CircleAlert, Coins, FileText, Gavel, ShieldCheck, Users,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Progress, StatCard } from "@/components/ui/misc";
import { CardSkeleton, ErrorState } from "@/components/ui/states";
import { Donut } from "@/components/charts/donut";
import { RequirePermission } from "@/components/layout/permission-gate";
import { useApi } from "@/lib/api/hooks";
import { useAdminSession } from "@/lib/api/admin-session";
import {
  getAdminBookingsOverview, getAdminFinanceSummary, getAdminReportOverview, getDashboardStats,
} from "@/lib/api/admin";
import { humanize, money, number } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <RequirePermission codes={["dashboard.view"]}>
      <Dashboard />
    </RequirePermission>
  );
}

function Dashboard() {
  const { can, me } = useAdminSession();

  const stats = useApi(useCallback(() => getDashboardStats(), []));
  const finance = useApi(
    useCallback(
      () => (can("finance.view") ? getAdminFinanceSummary() : Promise.resolve(null)),
      [can],
    ),
  );
  const report = useApi(
    useCallback(
      () => (can("analytics.view") ? getAdminReportOverview() : Promise.resolve(null)),
      [can],
    ),
  );
  const bookings = useApi(
    useCallback(
      () => (can("analytics.view") ? getAdminBookingsOverview() : Promise.resolve(null)),
      [can],
    ),
  );

  const data = stats.data;

  const queue = [
    {
      label: "Provider applications",
      count: data?.moderation.pendingProviderApplications ?? 0,
      href: "/service-providers",
      icon: ShieldCheck,
      tone: "ok" as Tone,
      show: can("providers.view"),
    },
    {
      label: "Open complaints",
      count: data?.moderation.openComplaints ?? 0,
      href: "/moderation",
      icon: Gavel,
      tone: "bad" as Tone,
      show: can("complaints.view"),
    },
    {
      label: "Provisional tenant reports",
      count: data?.moderation.openProvisionalReports ?? 0,
      href: "/moderation",
      icon: CircleAlert,
      tone: "warn" as Tone,
      show: can("reports.view"),
    },
    {
      label: "Bookings pending approval",
      count: data?.bookings.pending ?? 0,
      href: "/bookings",
      icon: CalendarCheck,
      tone: "brand" as Tone,
      show: can("operations.view"),
    },
    {
      label: "Unpaid bills",
      count: report.data?.unpaidBills ?? 0,
      href: "/rent",
      icon: Banknote,
      tone: "info" as Tone,
      show: can("operations.view"),
    },
    {
      label: "Listings hidden by staff",
      count: data?.properties.hidden ?? 0,
      href: "/properties",
      icon: Building2,
      tone: "neutral" as Tone,
      show: can("listings.view"),
    },
  ].filter((item) => item.show);

  if (stats.error) {
    return (
      <>
        <PageHeader title="Dashboard" description="Platform health at a glance." />
        <Card>
          <CardBody className="py-10">
            <ErrorState error={stats.error} onRetry={stats.refetch} resource="the dashboard" />
          </CardBody>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={me ? `Welcome back, ${me.fullName.split(" ")[0]}` : "Dashboard"}
        description="Platform health across users, listings, bookings and money."
        actions={
          <>
            <Button
              onClick={() => {
                stats.refetch();
                finance.refetch();
                report.refetch();
                bookings.refetch();
              }}
            >
              Refresh
            </Button>
            {can("analytics.view") && (
              <Link href="/reports">
                <Button variant="primary">Open reports</Button>
              </Link>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.loading && !data ? (
          Array.from({ length: 4 }, (_, i) => (
            <Card key={i}>
              <CardSkeleton />
            </Card>
          ))
        ) : (
          <>
            <StatCard
              label="Users"
              value={number(data?.users.total ?? 0)}
              hint={`${number(data?.users.newLast30Days ?? 0)} in the last 30 days`}
              icon={<Users className="size-4" />}
              href="/users"
            />
            <StatCard
              label="Properties"
              value={number(data?.properties.total ?? 0)}
              hint={`${number(data?.properties.listed ?? 0)} in the marketplace`}
              icon={<Building2 className="size-4" />}
              href="/properties"
            />
            <StatCard
              label="Active leases"
              value={number(data?.activeLeases ?? 0)}
              hint={`${number(data?.bookings.confirmed ?? 0)} confirmed bookings`}
              icon={<FileText className="size-4" />}
            />
            <StatCard
              label="Credits outstanding"
              value={number(data?.credits.outstandingBalance ?? 0)}
              hint="held in user wallets"
              icon={<Coins className="size-4" />}
              href="/credits"
            />
          </>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {can("finance.view") ? (
          <Card className="lg:col-span-2">
            <CardHeader
              title="Income by stream"
              description="Platform-wide, all time."
              action={<Badge tone="brand">Live</Badge>}
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
                    ["Pending", finance.data?.pendingPayments, "brand"],
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
                      tone={tone}
                    />
                  </div>
                ))}
                <div className="border-line flex justify-between border-t pt-3 text-[13px]">
                  <span className="text-ink-muted">Total income</span>
                  <span className="text-ink font-semibold tabular-nums">
                    {money(finance.data?.totalIncome)}
                  </span>
                </div>
              </CardBody>
            )}
          </Card>
        ) : (
          <Card className="lg:col-span-2">
            <CardHeader title="Income" description="Needs the finance.view permission." />
            <CardBody>
              <EmptyState
                icon={<Banknote className="size-5" />}
                title="Finance is restricted"
                description="Ask a super admin to add finance.view to one of your roles."
              />
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader title="Needs attention" description="Work waiting on staff." />
          {queue.length === 0 ? (
            <CardBody>
              <EmptyState icon={<Gavel className="size-5" />} title="Nothing assigned to you" />
            </CardBody>
          ) : (
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
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="User mix" description={`${number(data?.users.total ?? 0)} accounts`} />
          <CardBody>
            {!data ? (
              <CardSkeleton className="p-0" />
            ) : (
              <Donut
                totalLabel="users"
                total={data.users.total}
                slices={[
                  { label: "Tenants", value: data.users.tenants, color: "var(--brand)" },
                  { label: "Landlords", value: data.users.landlords, color: "var(--ok)" },
                  { label: "Providers", value: data.users.serviceProviders, color: "#38bdf8" },
                ]}
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Listings"
            description={`${number(data?.properties.total ?? 0)} properties`}
          />
          <CardBody>
            {!data ? (
              <CardSkeleton className="p-0" />
            ) : (
              <>
                <Donut
                  totalLabel="properties"
                  total={data.properties.total}
                  slices={[
                    { label: "In marketplace", value: data.properties.listed, color: "var(--ok)" },
                    { label: "Occupied", value: data.properties.occupied, color: "var(--brand)" },
                    { label: "Hidden by staff", value: data.properties.hidden, color: "var(--bad)" },
                    { label: "Locked", value: data.properties.locked, color: "var(--warn)" },
                  ]}
                />
                <div className="border-line mt-5 border-t pt-4">
                  <Progress
                    value={data.properties.occupied}
                    max={Math.max(data.properties.total, 1)}
                    tone="brand"
                    label="Occupancy rate"
                  />
                </div>
              </>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Bookings"
            description={`${number(bookings.data?.totalBookings ?? 0)} in total`}
          />
          <CardBody className="space-y-3.5">
            {bookings.loading && !bookings.data ? (
              <CardSkeleton className="p-0" />
            ) : Object.keys(bookings.data?.byStatus ?? {}).length === 0 ? (
              <EmptyState
                icon={<CalendarCheck className="size-5" />}
                title="No bookings yet"
                description="Status counts appear once bookings exist."
              />
            ) : (
              <>
                {Object.entries(bookings.data?.byStatus ?? {}).map(([status, count], index) => (
                  <div key={status}>
                    <div className="mb-1 flex items-baseline justify-between text-[13px]">
                      <span className="text-ink font-medium">{humanize(status)}</span>
                      <span className="text-ink-muted tabular-nums">{count}</span>
                    </div>
                    <Progress
                      value={count}
                      max={Math.max(bookings.data?.totalBookings ?? 1, 1)}
                      tone={(["brand", "ok", "warn", "bad"] as const)[index % 4]}
                    />
                  </div>
                ))}
                <div className="border-line mt-1 space-y-1.5 border-t pt-3 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Revenue</span>
                    <span className="text-ink font-medium tabular-nums">
                      {money(bookings.data?.revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Cancellation rate</span>
                    <span className="text-ink font-medium tabular-nums">
                      {(bookings.data?.cancellationRate ?? 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
