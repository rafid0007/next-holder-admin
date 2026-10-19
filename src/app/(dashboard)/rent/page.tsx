"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Banknote, FileText, Receipt } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { SearchInput, Select } from "@/components/ui/field";
import { Drawer } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import {
  DefinitionList, EmptyState, FilterBar, PageHeader, Progress, StatCard, UserCell,
} from "@/components/ui/misc";
import { CardSkeleton, ErrorState, TableSkeleton } from "@/components/ui/states";
import { Donut } from "@/components/charts/donut";
import { RequirePermission } from "@/components/layout/permission-gate";
import { useApi } from "@/lib/api/hooks";
import { useAdminSession } from "@/lib/api/admin-session";
import { getAdminReportOverview, listAdminRentBills } from "@/lib/api/admin";
import type { AdminRentBill } from "@/lib/api/admin-types";
import { formatDate, formatDateTime, humanize, money, number } from "@/lib/utils";

const tabs = [
  { id: "all", label: "All" },
  { id: "pending_verification", label: "To verify" },
  { id: "unpaid", label: "Unpaid" },
  { id: "overdue", label: "Overdue" },
  { id: "paid", label: "Paid" },
];

export default function RentPage() {
  return (
    <RequirePermission codes={["operations.view"]}>
      <Rent />
    </RequirePermission>
  );
}

function Rent() {
  const { can } = useAdminSession();
  const [tab, setTab] = useState("all");
  const [billType, setBillType] = useState("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<AdminRentBill | null>(null);

  const feed = useApi(
    useCallback(
      () =>
        listAdminRentBills({
          status: tab === "all" ? undefined : tab,
          billType: billType === "all" ? undefined : billType,
        }),
      [tab, billType],
    ),
  );
  const overview = useApi(
    useCallback(
      () => (can("analytics.view") ? getAdminReportOverview() : Promise.resolve(null)),
      [can],
    ),
  );

  const all = useMemo(() => feed.data?.results ?? [], [feed.data]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((bill) =>
      `${bill.title} ${bill.propertyTitle} ${bill.tenant.fullName}`.toLowerCase().includes(q),
    );
  }, [all, search]);

  const sum = (status: string) =>
    all.filter((b) => b.status === status).reduce((acc, b) => acc + Number(b.amount), 0);
  const collected = sum("paid");
  const pending = sum("pending_verification");
  const unpaid = sum("unpaid");
  const overdue = sum("overdue");

  const columns: Column<AdminRentBill>[] = [
    {
      key: "title",
      header: "Bill",
      cell: (row) => (
        <span className="block max-w-56">
          <span className="text-ink block truncate text-[13px] font-medium">{row.title}</span>
          <span className="text-ink-subtle block truncate text-xs">
            {humanize(row.billType)} · {humanize(row.frequency)}
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
          className="focus-ring text-ink-muted block max-w-40 truncate text-[13px] hover:underline"
        >
          {row.propertyTitle}
        </Link>
      ),
    },
    { key: "tenant", header: "Tenant", cell: (row) => <UserCell name={row.tenant.fullName} /> },
    {
      key: "due",
      header: "Due",
      hideOnMobile: true,
      cell: (row) => <span className="text-ink-muted text-xs">{formatDate(row.dueDate)}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (row) => (
        <span className="text-ink text-[13px] font-medium tabular-nums">{money(row.amount)}</span>
      ),
    },
    {
      key: "method",
      header: "Method",
      hideOnMobile: true,
      cell: (row) =>
        row.paymentProof ? (
          <Badge tone="neutral">{humanize(row.paymentProof.paymentMethod)}</Badge>
        ) : (
          <span className="text-ink-subtle text-xs">—</span>
        ),
    },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (row) => (
        <Button size="sm" variant="ghost" onClick={() => setOpen(row)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Rent & bills"
        description="Every bill raised against a lease. Read-only — landlords verify payment proofs."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Collected" value={money(collected)} icon={<Banknote className="size-4" />} hint="on this page" />
        <StatCard label="Awaiting verification" value={money(pending)} />
        <StatCard label="Unpaid" value={money(unpaid)} />
        <StatCard
          label="Overdue"
          value={money(overdue)}
          hint={`${number(overview.data?.unpaidBills ?? 0)} unpaid platform-wide`}
        />
      </div>

      <Card className="mb-4">
        <CardHeader title="Collection health" description="Share of billed value on this page." />
        {feed.loading && !feed.data ? (
          <CardSkeleton />
        ) : collected + pending + unpaid + overdue === 0 ? (
          <CardBody>
            <EmptyState icon={<Receipt className="size-5" />} title="Nothing billed yet" />
          </CardBody>
        ) : (
          <CardBody>
            <Donut
              total={collected + pending + unpaid + overdue}
              totalLabel="billed (৳)"
              slices={[
                { label: "Paid", value: collected, color: "var(--ok)" },
                { label: "Pending verification", value: pending, color: "var(--warn)" },
                { label: "Unpaid", value: unpaid, color: "var(--info)" },
                { label: "Overdue", value: overdue, color: "var(--bad)" },
              ]}
            />
            <div className="border-line mt-5 border-t pt-4">
              <Progress
                value={collected}
                max={Math.max(collected + pending + unpaid + overdue, 1)}
                tone="ok"
                label="Collection rate"
              />
            </div>
          </CardBody>
        )}
      </Card>

      <Card>
        <Tabs items={tabs} value={tab} onChange={setTab} className="px-3" />
        <FilterBar>
          <SearchInput
            placeholder="Search bill, property or tenant…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72"
          />
          <Select
            aria-label="Bill type"
            value={billType}
            onChange={(e) => setBillType(e.target.value)}
            className="w-auto"
          >
            <option value="all">All bill types</option>
            <option value="rent">Rent</option>
            <option value="utility">Utility</option>
            <option value="service_charge">Service charge</option>
            <option value="maintenance">Maintenance</option>
            <option value="other">Other</option>
          </Select>
        </FilterBar>

        {feed.error ? (
          <CardBody>
            <ErrorState error={feed.error} onRetry={feed.refetch} resource="bills" />
          </CardBody>
        ) : feed.loading && !feed.data ? (
          <TableSkeleton rows={6} columns={6} />
        ) : rows.length === 0 ? (
          <CardBody>
            <EmptyState icon={<FileText className="size-5" />} title="No bills match" />
          </CardBody>
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} pageSize={12} />
        )}
      </Card>

      <Drawer
        open={open != null}
        onClose={() => setOpen(null)}
        title={open?.title ?? ""}
        subtitle={open?.propertyTitle}
      >
        {open && (
          <div className="space-y-5">
            <div className="bg-surface-muted border-line rounded-xl border p-4">
              <p className="text-ink-subtle text-xs">Amount billed</p>
              <p className="text-ink mt-1 text-2xl font-semibold tabular-nums">
                {money(open.amount)}
              </p>
            </div>

            <DefinitionList
              items={[
                { label: "Bill ID", value: `#${open.id}` },
                { label: "Status", value: humanize(open.status) },
                { label: "Tenant", value: open.tenant.fullName },
                { label: "Landlord", value: open.landlord.fullName },
                { label: "Bill type", value: humanize(open.billType) },
                { label: "Due date", value: formatDate(open.dueDate) },
                { label: "Raised", value: formatDate(open.createdAt) },
                { label: "Lease", value: open.leaseId ? `#${open.leaseId}` : "—" },
              ]}
            />

            {open.paymentProof ? (
              <div>
                <p className="text-ink mb-2 text-[13px] font-medium">Payment proof</p>
                <DefinitionList
                  items={[
                    { label: "Method", value: humanize(open.paymentProof.paymentMethod) },
                    { label: "Reference", value: open.paymentProof.transactionReference || "—" },
                    { label: "Paid amount", value: money(open.paymentProof.paidAmount) },
                    { label: "Paid at", value: formatDateTime(open.paymentProof.paidAt) },
                  ]}
                />
                {open.paymentProof.proofDocument && (
                  <p className="text-ink-subtle mt-2 truncate text-xs">
                    {open.paymentProof.proofDocument}
                  </p>
                )}
              </div>
            ) : (
              <EmptyState
                icon={<Receipt className="size-5" />}
                title="No payment proof"
                description="The tenant has not submitted one for this bill."
              />
            )}

            <p className="text-ink-subtle text-xs leading-5">
              Verifying a payment is the landlord&rsquo;s action; the admin API exposes bills as
              read-only.
            </p>
          </div>
        )}
      </Drawer>
    </>
  );
}
