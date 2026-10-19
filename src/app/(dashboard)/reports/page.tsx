"use client";

import { useCallback, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { SegmentedControl } from "@/components/ui/tabs";
import { EmptyState, PageHeader, StatCard } from "@/components/ui/misc";
import { CardSkeleton, ErrorState } from "@/components/ui/states";
import { BarChart } from "@/components/charts/bar-chart";
import { RequirePermission } from "@/components/layout/permission-gate";
import { useApi } from "@/lib/api/hooks";
import { useAdminSession } from "@/lib/api/admin-session";
import { getAdminReportOverview, getTimeseries } from "@/lib/api/admin";
import type { TimeseriesMetric } from "@/lib/api/admin-types";
import { compactMoney, money, number } from "@/lib/utils";

const metrics: { id: TimeseriesMetric; label: string; money: boolean; finance: boolean }[] = [
  { id: "signups", label: "Sign-ups", money: false, finance: false },
  { id: "properties", label: "New properties", money: false, finance: false },
  { id: "bookings", label: "New bookings", money: false, finance: false },
  { id: "credits_purchased", label: "Credits purchased", money: false, finance: false },
  { id: "booking_revenue", label: "Booking revenue", money: true, finance: true },
  { id: "rent", label: "Rent collected", money: true, finance: true },
];

export default function ReportsPage() {
  return (
    <RequirePermission codes={["analytics.view"]}>
      <Reports />
    </RequirePermission>
  );
}

function Reports() {
  const { can } = useAdminSession();
  const [metric, setMetric] = useState<TimeseriesMetric>("signups");
  const [bucket, setBucket] = useState("month");

  const available = metrics.filter((m) => !m.finance || can("finance.view"));
  const active = metrics.find((m) => m.id === metric)!;

  const series = useApi(
    useCallback(() => getTimeseries(metric, { bucket }), [metric, bucket]),
  );
  const overview = useApi(useCallback(() => getAdminReportOverview(), []));

  const points = series.data?.points ?? [];
  const total = points.reduce((sum, p) => sum + Number(p.value), 0);
  const peak = points.reduce((max, p) => Math.max(max, Number(p.value)), 0);

  return (
    <>
      <PageHeader
        title="Reports"
        description="Platform trends over time, straight from the timeseries endpoint."
        actions={
          <SegmentedControl
            value={bucket}
            onChange={setBucket}
            items={[
              { id: "day", label: "Day" },
              { id: "week", label: "Week" },
              { id: "month", label: "Month" },
            ]}
          />
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overview.loading && !overview.data ? (
          Array.from({ length: 4 }, (_, i) => (
            <Card key={i}>
              <CardSkeleton />
            </Card>
          ))
        ) : (
          <>
            <StatCard
              label="Active leases"
              value={number(overview.data?.activeLeases ?? 0)}
              hint={`${number(overview.data?.activeTenants ?? 0)} tenants`}
            />
            <StatCard
              label="Confirmed bookings"
              value={number(overview.data?.totalConfirmedBookings ?? 0)}
            />
            <StatCard
              label="Unpaid bills"
              value={number(overview.data?.unpaidBills ?? 0)}
              hint={money(overview.data?.totalUnpaidAmount)}
            />
            <StatCard
              label="Maintenance pending"
              value={number(overview.data?.pendingMaintenanceRequests ?? 0)}
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader
          title={active.label}
          description={
            series.data
              ? `${series.data.dateFrom} → ${series.data.dateTo}, by ${series.data.bucket}`
              : "Loading the range…"
          }
          action={
            <Select
              aria-label="Metric"
              value={metric}
              onChange={(e) => setMetric(e.target.value as TimeseriesMetric)}
              className="w-auto"
            >
              {available.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </Select>
          }
        />
        {series.error ? (
          <CardBody>
            <ErrorState error={series.error} onRetry={series.refetch} resource="the series" />
          </CardBody>
        ) : series.loading && !series.data ? (
          <CardSkeleton />
        ) : points.length === 0 || peak === 0 ? (
          <CardBody>
            <EmptyState
              icon={<TrendingUp className="size-5" />}
              title="No activity in this range"
              description="Every bucket came back as zero."
            />
          </CardBody>
        ) : (
          <CardBody>
            <BarChart
              labels={points.map((p) => p.bucket)}
              formatValue={active.money ? compactMoney : (v) => String(Math.round(v))}
              series={[
                {
                  name: active.label,
                  color: "var(--brand)",
                  values: points.map((p) => Number(p.value)),
                },
              ]}
            />
            <div className="border-line mt-5 grid grid-cols-3 gap-4 border-t pt-4 text-[13px]">
              <div>
                <p className="text-ink-subtle text-xs">Total</p>
                <p className="text-ink mt-1 font-semibold tabular-nums">
                  {active.money ? money(total) : number(Math.round(total))}
                </p>
              </div>
              <div>
                <p className="text-ink-subtle text-xs">Peak bucket</p>
                <p className="text-ink mt-1 font-semibold tabular-nums">
                  {active.money ? money(peak) : number(Math.round(peak))}
                </p>
              </div>
              <div>
                <p className="text-ink-subtle text-xs">Buckets</p>
                <p className="text-ink mt-1 font-semibold tabular-nums">{points.length}</p>
              </div>
            </div>
          </CardBody>
        )}
      </Card>

      {!can("finance.view") && (
        <p className="text-ink-subtle mt-4 text-center text-xs">
          Revenue metrics need the finance.view permission.
        </p>
      )}
    </>
  );
}
