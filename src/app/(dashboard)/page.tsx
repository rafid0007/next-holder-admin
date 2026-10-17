"use client";

import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Building2,
  CalendarCheck,
  CircleAlert,
  Clock,
  FileText,
  Users,
  Wrench,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, StatusBadge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Progress, StatCard, UserCell } from "@/components/ui/misc";
import { BarChart } from "@/components/charts/bar-chart";
import { Donut } from "@/components/charts/donut";
import {
  activityFeed,
  badgeCounts,
  bookingVolumeSeries,
  bookings,
  inquiries,
  leases,
  maintenanceRequests,
  NOW,
  monthLabels,
  newUsersSeries,
  occupancySeries,
  properties,
  propertyGrowthSeries,
  rentBills,
  revenueSeries,
  serviceProviders,
  subscriptionPlans,
  users,
} from "@/lib/mock/data";
import { compactMoney, formatDate, money, relativeTime } from "@/lib/utils";

const last = (series: number[]) => series[series.length - 1];

export default function DashboardPage() {
  const monthRevenue =
    last(revenueSeries.rent) +
    last(revenueSeries.bookings) +
    last(revenueSeries.subscriptions) +
    last(revenueSeries.credits);

  const collected = rentBills
    .filter((b) => b.status === "paid")
    .reduce((sum, b) => sum + b.amount, 0);
  const outstanding = rentBills
    .filter((b) => ["unpaid", "overdue", "pending_verification"].includes(b.status))
    .reduce((sum, b) => sum + b.amount, 0);

  const activeLeases = leases.filter((l) => l.status === "active").length;
  const occupied = properties.filter((p) => p.status === "occupied").length;

  const queue = [
    {
      label: "Leases awaiting signature",
      count: badgeCounts.pendingLeases,
      href: "/leases",
      icon: FileText,
      tone: "warn" as Tone,
    },
    {
      label: "Bookings to approve",
      count: badgeCounts.pendingBookings,
      href: "/bookings",
      icon: CalendarCheck,
      tone: "brand" as Tone,
    },
    {
      label: "Payment proofs to verify",
      count: badgeCounts.billsToVerify,
      href: "/rent",
      icon: Banknote,
      tone: "info" as Tone,
    },
    {
      label: "Open maintenance requests",
      count: badgeCounts.openMaintenance,
      href: "/maintenance",
      icon: Wrench,
      tone: "bad" as Tone,
    },
    {
      label: "Unanswered inquiries",
      count: badgeCounts.openInquiries,
      href: "/inquiries",
      icon: CircleAlert,
      tone: "warn" as Tone,
    },
    {
      label: "Provider applications",
      count: badgeCounts.providerApplications,
      href: "/service-providers",
      icon: Users,
      tone: "ok" as Tone,
    },
  ];

  const urgent = maintenanceRequests
    .filter((m) => ["urgent", "high"].includes(m.priority) && m.status !== "resolved")
    .slice(0, 4);

  const upcoming = bookings
    .filter((b) => new Date(b.startDatetime).getTime() > NOW)
    .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime))
    .slice(0, 5);

  const statusSlices = [
    { label: "Available", value: properties.filter((p) => p.status === "available").length, color: "var(--ok)" },
    { label: "Occupied", value: occupied, color: "var(--brand)" },
    { label: "Under maintenance", value: properties.filter((p) => p.status === "maintenance").length, color: "var(--warn)" },
    { label: "Unlisted", value: properties.filter((p) => p.status === "unlisted").length, color: "var(--ink-subtle)" },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Platform health across properties, tenancies, bookings and money."
        actions={
          <>
            <Button>Last 7 months</Button>
            <Button variant="primary">
              Export report
              <ArrowRight className="size-4" />
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue this month"
          value={compactMoney(monthRevenue)}
          delta={8.4}
          hint="vs. September"
          icon={<Banknote className="size-4" />}
          trend={revenueSeries.rent.map((v, i) => v + revenueSeries.bookings[i])}
        />
        <StatCard
          label="Properties listed"
          value={String(properties.length)}
          delta={12.5}
          hint={`${properties.filter((p) => p.isListedInMarketplace).length} in marketplace`}
          icon={<Building2 className="size-4" />}
          href="/properties"
          trend={propertyGrowthSeries}
        />
        <StatCard
          label="Active leases"
          value={String(activeLeases)}
          delta={5.1}
          hint={`${badgeCounts.pendingLeases} pending`}
          icon={<FileText className="size-4" />}
          href="/leases"
          trend={occupancySeries}
        />
        <StatCard
          label="New users"
          value={String(last(newUsersSeries))}
          delta={-7.7}
          hint="this month"
          icon={<Users className="size-4" />}
          href="/users"
          trend={newUsersSeries}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Revenue by stream"
            description="Rent collection, venue bookings, subscriptions and credit sales."
            action={<Badge tone="brand">Apr – Oct 2026</Badge>}
          />
          <CardBody>
            <BarChart
              labels={monthLabels}
              stacked
              series={[
                { name: "Rent", color: "var(--brand)", values: revenueSeries.rent },
                { name: "Bookings", color: "#38bdf8", values: revenueSeries.bookings },
                { name: "Subscriptions", color: "#34d399", values: revenueSeries.subscriptions },
                { name: "Credits", color: "#fbbf24", values: revenueSeries.credits },
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Needs attention" description="Items waiting on an admin." />
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
          <CardHeader title="Portfolio status" description={`${properties.length} properties`} />
          <CardBody>
            <Donut slices={statusSlices} totalLabel="properties" />
            <div className="border-line mt-5 border-t pt-4">
              <Progress
                value={occupied}
                max={properties.length}
                tone="brand"
                label="Occupancy rate"
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Rent collection"
            description="Across all bills raised this cycle."
          />
          <CardBody className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-ink-subtle text-xs">Collected</p>
                <p className="text-ok mt-1 text-xl font-semibold tabular-nums">
                  {compactMoney(collected)}
                </p>
              </div>
              <div>
                <p className="text-ink-subtle text-xs">Outstanding</p>
                <p className="text-bad mt-1 text-xl font-semibold tabular-nums">
                  {compactMoney(outstanding)}
                </p>
              </div>
            </div>
            <Progress
              value={collected}
              max={collected + outstanding}
              tone="ok"
              label="Collection rate"
            />
            <ul className="space-y-2.5">
              {(
                [
                  ["Paid", "paid", "ok"],
                  ["Pending verification", "pending_verification", "warn"],
                  ["Unpaid", "unpaid", "info"],
                  ["Overdue", "overdue", "bad"],
                ] as const
              ).map(([label, status]) => {
                const rows = rentBills.filter((b) => b.status === status);
                return (
                  <li key={status} className="flex items-center justify-between text-[13px]">
                    <span className="text-ink-muted flex items-center gap-2">
                      <StatusBadge status={status} />
                      {label !== "Paid" && <span className="text-ink-subtle">{rows.length}</span>}
                    </span>
                    <span className="text-ink font-medium tabular-nums">
                      {money(rows.reduce((sum, b) => sum + b.amount, 0))}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Booking volume"
            description={`${bookings.length} bookings, ${badgeCounts.pendingBookings} awaiting approval`}
          />
          <CardBody>
            <BarChart
              labels={monthLabels}
              height={150}
              formatValue={(v) => String(v)}
              series={[{ name: "Bookings", color: "var(--brand)", values: bookingVolumeSeries }]}
            />
            <ul className="border-line mt-4 space-y-3 border-t pt-4">
              {upcoming.slice(0, 3).map((booking) => (
                <li key={booking.id} className="flex items-start gap-2.5">
                  <Clock className="text-ink-subtle mt-0.5 size-3.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-ink truncate text-[13px] font-medium">{booking.purpose}</p>
                    <p className="text-ink-subtle truncate text-xs">
                      {booking.unit?.name ?? booking.property.title} ·{" "}
                      {formatDate(booking.startDatetime)}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="High-priority maintenance"
            description="Urgent and high severity requests still open."
            action={
              <Link href="/maintenance">
                <Button size="sm" variant="ghost">
                  View all <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            }
          />
          {urgent.length === 0 ? (
            <CardBody>
              <EmptyState
                icon={<Wrench className="size-5" />}
                title="Nothing urgent"
                description="Every high-priority request has been resolved."
              />
            </CardBody>
          ) : (
            <ul>
              {urgent.map((request) => (
                <li
                  key={request.id}
                  className="border-line flex items-start gap-3 border-b px-5 py-3.5 last:border-0"
                >
                  <span
                    className={
                      request.priority === "urgent"
                        ? "bg-bad-soft text-bad grid size-8 shrink-0 place-items-center rounded-lg"
                        : "bg-warn-soft text-warn grid size-8 shrink-0 place-items-center rounded-lg"
                    }
                  >
                    <Wrench className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-ink truncate text-[13px] font-medium">{request.title}</p>
                    <p className="text-ink-subtle truncate text-xs">
                      {request.property.title} · {request.tenant.fullName} ·{" "}
                      {relativeTime(request.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Recent activity" description="Latest events across the platform." />
          <CardBody>
            <ol className="relative space-y-4 pl-5">
              <span className="bg-line absolute top-1.5 bottom-1.5 left-[5px] w-px" />
              {activityFeed.slice(0, 6).map((event) => (
                <li key={event.id} className="relative">
                  <span
                    className="border-surface absolute top-1 -left-5 size-2.5 rounded-full border-2"
                    style={{ background: `var(--${event.tone === "brand" ? "brand" : event.tone})` }}
                  />
                  <p className="text-ink text-[13px] leading-5">
                    <span className="font-medium">{event.who}</span>{" "}
                    <span className="text-ink-muted">{event.action}</span>{" "}
                    <span className="font-medium">{event.target}</span>
                  </p>
                  <p className="text-ink-subtle mt-0.5 text-xs">{relativeTime(event.at)}</p>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Subscription mix"
            description={`${subscriptionPlans.reduce((s, p) => s + (p.subscribers ?? 0), 0)} subscribers`}
            action={
              <Link href="/subscriptions">
                <Button size="sm" variant="ghost">
                  Manage plans <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {subscriptionPlans.map((plan, index) => (
              <div key={plan.id}>
                <div className="mb-1 flex items-baseline justify-between text-[13px]">
                  <span className="text-ink font-medium">{plan.displayName}</span>
                  <span className="text-ink-muted tabular-nums">
                    {plan.subscribers} · {money(plan.priceMonthly)}/mo
                  </span>
                </div>
                <Progress
                  value={plan.subscribers ?? 0}
                  max={subscriptionPlans[0].subscribers ?? 1}
                  tone={(["brand", "ok", "warn", "bad"] as const)[index % 4]}
                />
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Roster"
            description="Who is on the platform right now."
          />
          <CardBody>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  ["Landlords", users.filter((u) => u.roles.includes("landlord")).length],
                  ["Tenants", users.filter((u) => u.roles.includes("tenant")).length],
                  ["Providers", serviceProviders.length],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="bg-surface-muted rounded-xl p-3">
                  <p className="text-ink-subtle text-xs">{label}</p>
                  <p className="text-ink mt-1 text-xl font-semibold tabular-nums">{value}</p>
                </div>
              ))}
            </div>
            <div className="border-line mt-4 space-y-3 border-t pt-4">
              <p className="text-ink-subtle text-xs font-medium">Newest sign-ups</p>
              {users.slice(-4).reverse().map((person) => (
                <div key={person.id} className="flex items-center justify-between gap-3">
                  <UserCell name={person.fullName} meta={person.email} />
                  <span className="text-ink-subtle shrink-0 text-xs">
                    {relativeTime(person.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <p className="text-ink-subtle mt-6 text-center text-xs">
        {inquiries.length} inquiries · {leases.length} leases · {bookings.length} bookings tracked
      </p>
    </>
  );
}
