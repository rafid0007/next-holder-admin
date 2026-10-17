"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Ban, CalendarCheck, CheckCircle2, CircleDollarSign, Plus, Receipt, Tag, Undo2, XCircle,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, SearchInput, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import {
  DefinitionList, EmptyState, FilterBar, PageHeader, StatCard, UserCell,
} from "@/components/ui/misc";
import { BarChart } from "@/components/charts/bar-chart";
import {
  availabilityBlocks, bookingDiscounts, bookingVolumeSeries, bookings, monthLabels, properties,
  propertyUnits, revenueSeries,
} from "@/lib/mock/data";
import type { Booking } from "@/lib/api/types";
import { formatDate, formatDateTime, humanize, money } from "@/lib/utils";

export default function BookingsPage() {
  const [tab, setTab] = useState("pending");
  const [query, setQuery] = useState("");
  const [manualOpen, setManualOpen] = useState(false);

  const tabs = useMemo(
    () =>
      [
        { id: "pending", label: "Pending" },
        { id: "confirmed", label: "Confirmed" },
        { id: "rejected", label: "Rejected" },
        { id: "cancelled", label: "Cancelled" },
        { id: "all", label: "All" },
      ].map((t) => ({
        ...t,
        count: t.id === "all" ? bookings.length : bookings.filter((b) => b.status === t.id).length,
      })),
    [],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (tab !== "all" && booking.status !== tab) return false;
      const who = booking.booker?.fullName ?? booking.manualCustomerName ?? "";
      if (q && !`${booking.purpose} ${booking.property.title} ${who}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [tab, query]);

  const paidRevenue = bookings
    .filter((b) => b.paymentStatus === "paid")
    .reduce((sum, b) => sum + b.finalAmount, 0);
  const awaiting = bookings
    .filter((b) => b.paymentStatus === "awaiting_payment" || b.paymentStatus === "unpaid")
    .reduce((sum, b) => sum + b.finalAmount, 0);

  const columns: Column<Booking>[] = [
    {
      key: "purpose",
      header: "Booking",
      sortValue: (row) => row.purpose,
      cell: (row) => (
        <span className="block max-w-56">
          <span className="text-ink block truncate text-[13px] font-medium">{row.purpose}</span>
          <span className="text-ink-subtle block truncate text-xs">
            {row.unit?.name ?? "Whole property"}
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
      key: "customer",
      header: "Customer",
      cell: (row) =>
        row.isManual ? (
          <span>
            <UserCell
              name={row.manualCustomerName ?? "Walk-in"}
              meta={row.manualCustomerPhone}
            />
          </span>
        ) : (
          <UserCell name={row.booker!.fullName} meta={row.booker!.email} />
        ),
    },
    {
      key: "when",
      header: "Slot",
      hideOnMobile: true,
      sortValue: (row) => row.startDatetime,
      cell: (row) => (
        <span className="text-ink-muted text-xs whitespace-nowrap">
          {formatDateTime(row.startDatetime)}
          <span className="text-ink-subtle block">
            to {formatDateTime(row.endDatetime).split(", ").pop()}
          </span>
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortValue: (row) => row.finalAmount,
      cell: (row) => (
        <span className="text-ink text-[13px] font-medium tabular-nums">
          {money(row.finalAmount)}
          {row.discountAmount ? (
            <span className="text-ok block text-[11px] font-normal">
              −{money(row.discountAmount)}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      key: "payment",
      header: "Payment",
      cell: (row) => <StatusBadge status={row.paymentStatus} />,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => row.status,
      cell: (row) => (
        <span className="flex items-center gap-1.5">
          <StatusBadge status={row.status} />
          {row.isManual && <Badge tone="neutral">Manual</Badge>}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Bookings"
        description="Short-term reservations of bookable venues, units and rooms."
        actions={
          <>
            <Button>
              <Receipt className="size-4" /> Finance report
            </Button>
            <Button variant="primary" onClick={() => setManualOpen(true)}>
              <Plus className="size-4" /> Manual booking
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Paid revenue" value={money(paidRevenue)} delta={23.7} hint="all bookings" />
        <StatCard label="Awaiting payment" value={money(awaiting)} hint={`${bookings.filter((b) => b.paymentStatus !== "paid").length} bookings`} />
        <StatCard label="Pending approval" value={String(bookings.filter((b) => b.status === "pending").length)} hint="needs a decision" />
        <StatCard
          label="Confirmation rate"
          value={`${Math.round((bookings.filter((b) => b.status === "confirmed").length / bookings.length) * 100)}%`}
          delta={6.4}
        />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Booking revenue" description="Monthly confirmed booking income." />
          <CardBody>
            <BarChart
              labels={monthLabels}
              series={[{ name: "Booking revenue", color: "var(--brand)", values: revenueSeries.bookings }]}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Volume" description="Bookings created per month." />
          <CardBody>
            <BarChart
              labels={monthLabels}
              height={160}
              formatValue={(v) => String(v)}
              series={[{ name: "Bookings", color: "#38bdf8", values: bookingVolumeSeries }]}
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <Tabs items={tabs} value={tab} onChange={setTab} className="px-3" />
        <FilterBar>
          <SearchInput
            placeholder="Search purpose, venue or customer…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-80"
          />
          <Select aria-label="Property" className="w-auto">
            <option value="all">All bookable properties</option>
            {properties
              .filter((p) => p.listingType === "for_book")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
          </Select>
        </FilterBar>

        {rows.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<CalendarCheck className="size-5" />}
              title="No bookings in this state"
              description="Nothing matches the current tab and search."
            />
          </CardBody>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            pageSize={10}
            expandedContent={(booking) => (
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <DefinitionList
                    items={[
                      { label: "Booking ID", value: `#${booking.id}` },
                      { label: "Guests", value: booking.numGuests ?? "—" },
                      { label: "Promo code", value: booking.promoCode ?? "—" },
                      { label: "Discount", value: money(booking.discountAmount ?? 0) },
                      { label: "Created", value: formatDateTime(booking.createdAt) },
                      { label: "Source", value: booking.isManual ? "Manual (landlord)" : "Tenant app" },
                    ]}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  {booking.status === "pending" && (
                    <>
                      <Button variant="primary">
                        <CheckCircle2 className="size-4" /> Confirm booking
                      </Button>
                      <Button variant="danger">
                        <XCircle className="size-4" /> Reject
                      </Button>
                    </>
                  )}
                  {booking.status === "confirmed" && (
                    <>
                      <Button>
                        <CircleDollarSign className="size-4" /> Record offline payment
                      </Button>
                      <Button>
                        <Undo2 className="size-4" /> Issue refund
                      </Button>
                      <Button variant="danger">
                        <Ban className="size-4" /> Cancel booking
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          />
        )}
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Availability blocks"
            description="Dates held back from booking."
            action={<Button size="sm">Add block</Button>}
          />
          {availabilityBlocks.length === 0 ? (
            <CardBody>
              <EmptyState icon={<Ban className="size-5" />} title="No blocks set" />
            </CardBody>
          ) : (
            <ul>
              {availabilityBlocks.map((block) => (
                <li
                  key={block.id}
                  className="border-line flex items-start gap-3 border-b px-5 py-3.5 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-ink truncate text-[13px] font-medium">
                      {block.unit?.name ?? block.property.title}
                    </p>
                    <p className="text-ink-subtle truncate text-xs">
                      {formatDate(block.startDatetime)} → {formatDate(block.endDatetime)}
                      {block.note && ` · ${block.note}`}
                    </p>
                  </div>
                  <Badge tone="warn">{humanize(block.reason)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Discounts & promo codes"
            description="Percent or fixed reductions applied at quote time."
            action={<Button size="sm">Add discount</Button>}
          />
          <ul>
            {bookingDiscounts.map((discount) => (
              <li
                key={discount.id}
                className="border-line flex items-start gap-3 border-b px-5 py-3.5 last:border-0"
              >
                <span className="bg-surface-hover text-ink-subtle grid size-8 shrink-0 place-items-center rounded-lg">
                  <Tag className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-ink truncate text-[13px] font-medium">{discount.name}</p>
                  <p className="text-ink-subtle truncate text-xs">
                    {discount.discountType === "percent"
                      ? `${discount.value}% off`
                      : `${money(discount.value)} off`}
                    {discount.promoCode && ` · code ${discount.promoCode}`} ·{" "}
                    {humanize(discount.scope)} scope
                  </p>
                </div>
                <Badge tone={discount.isActive ? "ok" : "neutral"}>
                  {discount.isActive ? "Active" : "Inactive"}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <ManualBookingModal open={manualOpen} onClose={() => setManualOpen(false)} />
    </>
  );
}

function ManualBookingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [propertyId, setPropertyId] = useState("105");
  const units = propertyUnits[Number(propertyId)] ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record a manual booking"
      description="For walk-in or phone customers who have no account on the platform."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onClose}>
            Create booking
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Property">
            <Select value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
              {properties
                .filter((p) => p.listingType === "for_book")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Unit">
            <Select>
              {units.length === 0 && <option>Whole property</option>}
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer name">
            <Input placeholder="Mr. Sohel Rana" />
          </Field>
          <Field label="Customer phone">
            <Input placeholder="+8801911553366" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts">
            <Input type="datetime-local" />
          </Field>
          <Field label="Ends">
            <Input type="datetime-local" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Purpose" className="sm:col-span-2">
            <Input placeholder="Engagement ceremony" />
          </Field>
          <Field label="Guests">
            <Input type="number" placeholder="55" />
          </Field>
        </div>

        <Field label="Notes" hint="Internal only — not shown to the customer.">
          <Textarea placeholder="Paid ৳10,000 cash as confirmation; balance due on the day." />
        </Field>
      </div>
    </Modal>
  );
}
