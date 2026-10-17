"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Banknote, CalendarClock, CheckCircle2, FileText, Plus, Receipt, RefreshCcw, XCircle,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, SearchInput, Select, Textarea } from "@/components/ui/field";
import { Drawer, Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import {
  DefinitionList, EmptyState, FilterBar, PageHeader, Progress, StatCard, UserCell,
} from "@/components/ui/misc";
import { Donut } from "@/components/charts/donut";
import { NOW, billSchedules, leases, rentBills } from "@/lib/mock/data";
import type { RentBill } from "@/lib/api/types";
import { formatDate, formatDateTime, humanize, money } from "@/lib/utils";

export default function RentPage() {
  const [tab, setTab] = useState("pending_verification");
  const [query, setQuery] = useState("");
  const [billType, setBillType] = useState("all");
  const [reviewing, setReviewing] = useState<RentBill | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const tabs = useMemo(
    () =>
      [
        { id: "pending_verification", label: "To verify" },
        { id: "unpaid", label: "Unpaid" },
        { id: "overdue", label: "Overdue" },
        { id: "paid", label: "Paid" },
        { id: "all", label: "All" },
      ].map((t) => ({
        ...t,
        count: t.id === "all" ? rentBills.length : rentBills.filter((b) => b.status === t.id).length,
      })),
    [],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rentBills.filter((bill) => {
      if (tab !== "all" && bill.status !== tab) return false;
      if (billType !== "all" && bill.billType !== billType) return false;
      if (q && !`${bill.title} ${bill.property.title} ${bill.tenant.fullName}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [tab, query, billType]);

  const totals = (statuses: RentBill["status"][]) =>
    rentBills.filter((b) => statuses.includes(b.status)).reduce((sum, b) => sum + b.amount, 0);

  const collected = totals(["paid"]);
  const overdue = totals(["overdue"]);
  const pending = totals(["pending_verification"]);
  const unpaid = totals(["unpaid"]);

  const columns: Column<RentBill>[] = [
    {
      key: "title",
      header: "Bill",
      sortValue: (row) => row.title,
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
          href={`/properties/${row.property.id}`}
          className="focus-ring text-ink-muted block max-w-44 truncate text-[13px] hover:underline"
        >
          {row.property.title}
        </Link>
      ),
    },
    {
      key: "tenant",
      header: "Tenant",
      sortValue: (row) => row.tenant.fullName,
      cell: (row) => <UserCell name={row.tenant.fullName} />,
    },
    {
      key: "due",
      header: "Due date",
      hideOnMobile: true,
      sortValue: (row) => row.dueDate,
      cell: (row) => {
        const late =
          new Date(row.dueDate).getTime() < NOW &&
          !["paid", "cancelled"].includes(row.status);
        return (
          <span className={late ? "text-bad text-xs font-medium" : "text-ink-muted text-xs"}>
            {formatDate(row.dueDate)}
          </span>
        );
      },
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortValue: (row) => row.amount,
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
      cell: (row) =>
        row.status === "pending_verification" ? (
          <Button
            size="sm"
            variant="subtle"
            onClick={(event) => {
              event.stopPropagation();
              setReviewing(row);
            }}
          >
            Review
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Rent & bills"
        description="Bills raised against leases, payment proofs submitted by tenants, and recurring schedules."
        actions={
          <>
            <Button>
              <Receipt className="size-4" /> Export ledger
            </Button>
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> Raise a bill
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Collected" value={money(collected)} delta={9.1} icon={<Banknote className="size-4" />} />
        <StatCard label="Awaiting verification" value={money(pending)} hint={`${rentBills.filter((b) => b.status === "pending_verification").length} proofs`} />
        <StatCard label="Unpaid" value={money(unpaid)} hint="not yet due" />
        <StatCard label="Overdue" value={money(overdue)} delta={-3.2} hint="chase these" />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Collection health" description="Share of billed value by state." />
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
                max={collected + pending + unpaid + overdue}
                tone="ok"
                label="Collection rate"
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Lease coverage" description="Active leases with a recurring schedule." />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-muted rounded-xl p-3">
                <p className="text-ink-subtle text-xs">Active leases</p>
                <p className="text-ink mt-1 text-xl font-semibold tabular-nums">
                  {leases.filter((l) => l.status === "active").length}
                </p>
              </div>
              <div className="bg-surface-muted rounded-xl p-3">
                <p className="text-ink-subtle text-xs">Active schedules</p>
                <p className="text-ink mt-1 text-xl font-semibold tabular-nums">
                  {billSchedules.filter((s) => s.isActive).length}
                </p>
              </div>
            </div>
            <Progress
              value={billSchedules.filter((s) => s.isActive).length}
              max={leases.filter((l) => l.status === "active").length}
              tone="brand"
              label="Leases on autopilot"
            />
            <p className="text-ink-muted text-[13px] leading-5">
              Leases without a schedule need bills raised by hand each cycle.
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <Tabs items={tabs} value={tab} onChange={setTab} className="px-3" />
        <FilterBar>
          <SearchInput
            placeholder="Search bill, property or tenant…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-80"
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

        {rows.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<FileText className="size-5" />}
              title="No bills in this state"
              description="Nothing matches the current tab and filters."
            />
          </CardBody>
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} pageSize={10} />
        )}
      </Card>

      <Card className="mt-4">
        <CardHeader
          title="Recurring schedules"
          description="Bills generated automatically on each cycle."
          action={<Button size="sm">New schedule</Button>}
        />
        <DataTable
          rows={billSchedules}
          rowKey={(row) => row.id}
          pageSize={5}
          columns={[
            {
              key: "title",
              header: "Schedule",
              cell: (row) => (
                <span>
                  <span className="text-ink block text-[13px] font-medium">{row.title}</span>
                  <span className="text-ink-subtle block text-xs">
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
                <span className="text-ink-muted block max-w-44 truncate text-[13px]">
                  {row.property.title}
                </span>
              ),
            },
            { key: "tenant", header: "Tenant", hideOnMobile: true, cell: (row) => <UserCell name={row.tenant.fullName} /> },
            {
              key: "next",
              header: "Next due",
              hideOnMobile: true,
              cell: (row) => (
                <span className="text-ink-muted flex items-center gap-1.5 text-xs">
                  <CalendarClock className="size-3.5" />
                  {formatDate(row.nextDueDate)}
                </span>
              ),
            },
            {
              key: "amount",
              header: "Amount",
              align: "right",
              cell: (row) => (
                <span className="text-ink text-[13px] font-medium tabular-nums">
                  {money(row.amount)}
                </span>
              ),
            },
            {
              key: "state",
              header: "State",
              cell: (row) => (
                <Badge tone={row.isActive ? "ok" : "neutral"}>
                  {row.isActive ? "Running" : "Paused"}
                </Badge>
              ),
            },
            {
              key: "actions",
              header: "",
              align: "right",
              cell: (row) =>
                row.isActive ? (
                  <Button size="sm" variant="ghost">
                    <RefreshCcw className="size-3.5" /> Cancel
                  </Button>
                ) : null,
            },
          ]}
        />
      </Card>

      <Drawer
        open={reviewing != null}
        onClose={() => setReviewing(null)}
        title={reviewing ? `Verify ${reviewing.title}` : ""}
        subtitle={reviewing?.property.title}
        footer={
          <>
            <Button variant="danger" onClick={() => setReviewing(null)}>
              <XCircle className="size-4" /> Reject
            </Button>
            <Button variant="primary" onClick={() => setReviewing(null)}>
              <CheckCircle2 className="size-4" /> Approve payment
            </Button>
          </>
        }
      >
        {reviewing && (
          <div className="space-y-5">
            <div className="bg-surface-muted border-line rounded-xl border p-4">
              <p className="text-ink-subtle text-xs">Amount billed</p>
              <p className="text-ink mt-1 text-2xl font-semibold tabular-nums">
                {money(reviewing.amount)}
              </p>
              {reviewing.paymentProof &&
                reviewing.paymentProof.paidAmount !== reviewing.amount && (
                  <p className="text-bad mt-1.5 text-[13px]">
                    Tenant reported {money(reviewing.paymentProof.paidAmount)} — a shortfall of{" "}
                    {money(reviewing.amount - reviewing.paymentProof.paidAmount)}.
                  </p>
                )}
            </div>

            <DefinitionList
              items={[
                { label: "Tenant", value: reviewing.tenant.fullName },
                { label: "Landlord", value: reviewing.landlord.fullName },
                { label: "Bill type", value: humanize(reviewing.billType) },
                { label: "Due date", value: formatDate(reviewing.dueDate) },
                {
                  label: "Payment method",
                  value: reviewing.paymentProof
                    ? humanize(reviewing.paymentProof.paymentMethod)
                    : "—",
                },
                {
                  label: "Reference",
                  value: reviewing.paymentProof?.transactionReference || "—",
                },
                {
                  label: "Paid at",
                  value: reviewing.paymentProof ? formatDateTime(reviewing.paymentProof.paidAt) : "—",
                },
                { label: "Raised", value: formatDate(reviewing.createdAt) },
              ]}
            />

            <div>
              <p className="text-ink mb-2 text-[13px] font-medium">Proof document</p>
              {reviewing.paymentProof?.proofDocument ? (
                <div className="border-line bg-surface-hover grid h-40 place-items-center rounded-xl border">
                  <div className="text-center">
                    <Receipt className="text-ink-subtle mx-auto size-6" />
                    <p className="text-ink-muted mt-2 text-[13px]">
                      {reviewing.paymentProof.proofDocument}
                    </p>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<Receipt className="size-5" />}
                  title="No document attached"
                  description="The tenant marked this as paid in cash without uploading a receipt."
                />
              )}
            </div>

            <Field label="Rejection note" hint="Shown to the tenant if you reject the proof.">
              <Textarea placeholder="The reference number does not match our bank statement." />
            </Field>
          </div>
        )}
      </Drawer>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Raise a bill"
        description="One-off or recurring, billed against an active lease."
        footer={
          <>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setCreateOpen(false)}>
              Raise bill
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Lease">
            <Select>
              {leases
                .filter((l) => l.status === "active")
                .map((lease) => (
                  <option key={lease.id} value={lease.id}>
                    {lease.property.title} — {lease.tenant.fullName}
                  </option>
                ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bill type">
              <Select>
                <option value="rent">Rent</option>
                <option value="utility">Utility</option>
                <option value="service_charge">Service charge</option>
                <option value="maintenance">Maintenance</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Frequency">
              <Select>
                <option value="one_time">One-time</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </Select>
            </Field>
            <Field label="Title">
              <Input placeholder="November rent" />
            </Field>
            <Field label="Amount (৳)">
              <Input type="number" placeholder="85000" />
            </Field>
            <Field label="Due date">
              <Input type="date" />
            </Field>
          </div>
          <Field label="Description" hint="Optional note shown to the tenant.">
            <Textarea placeholder="Includes ৳6,500 service charge for the month." />
          </Field>
        </div>
      </Modal>
    </>
  );
}
