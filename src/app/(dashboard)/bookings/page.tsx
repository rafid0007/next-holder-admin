"use client";

import { useCallback, useMemo, useState } from "react";
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
  DefinitionList, EmptyState, FilterBar, PageHeader, Progress, StatCard, UserCell,
} from "@/components/ui/misc";
import { CardSkeleton, ErrorState, TableSkeleton } from "@/components/ui/states";
import { useApi } from "@/lib/api/hooks";
import {
  cancelBooking, confirmBooking, getBookingFinanceSummary, getBookingReportOverview,
  listAllProperties, listBookings, listUnits, rejectBooking,
} from "@/lib/api/resources";
import type { ApiBookingListItem } from "@/lib/api/types";
import { formatDateTime, humanize, money } from "@/lib/utils";

export default function BookingsPage() {
  const [tab, setTab] = useState("pending");
  const [query, setQuery] = useState("");
  const [manualOpen, setManualOpen] = useState(false);

  const feed = useApi(useCallback(() => listBookings(), []));
  const finance = useApi(useCallback(() => getBookingFinanceSummary(), []));
  const report = useApi(useCallback(() => getBookingReportOverview(), []));
  const properties = useApi(useCallback(() => listAllProperties(), []));

  const bookings: ApiBookingListItem[] = useMemo(() => feed.data?.results ?? [], [feed.data]);

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
    [bookings],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (tab !== "all" && booking.status !== tab) return false;
      const who = booking.bookerEmail || "";
      if (q && !`${booking.purpose} ${booking.propertyTitle} ${who}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [bookings, tab, query]);

  const columns: Column<ApiBookingListItem>[] = [
    {
      key: "purpose",
      header: "Booking",
      sortValue: (row) => row.purpose,
      cell: (row) => (
        <span className="block max-w-56">
          <span className="text-ink block truncate text-[13px] font-medium">{row.purpose}</span>
          <span className="text-ink-subtle block truncate text-xs">
            {row.unitName ?? "Whole property"}
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
      key: "customer",
      header: "Customer",
      cell: (row) => (
        <UserCell
          name={row.bookerEmail || "Walk-in customer"}
          meta={row.isManualBooking ? "manual booking" : undefined}
        />
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
      sortValue: (row) => Number(row.finalAmount ?? 0),
      cell: (row) => (
        <span className="text-ink text-[13px] font-medium tabular-nums">
          {money(row.finalAmount ?? row.confirmationAmountPaid)}
          {Number(row.discountAmount) > 0 ? (
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
          {row.isManualBooking && <Badge tone="neutral">Manual</Badge>}
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
        {finance.loading && !finance.data ? (
          Array.from({ length: 4 }, (_, i) => (
            <Card key={i}>
              <CardSkeleton />
            </Card>
          ))
        ) : (
          <>
            <StatCard
              label="Paid revenue"
              value={money(finance.data?.paidRevenue)}
              hint="confirmed and settled"
            />
            <StatCard
              label="Pending revenue"
              value={money(finance.data?.pendingRevenue)}
              hint="awaiting payment"
            />
            <StatCard
              label="Refunded"
              value={money(finance.data?.refundedAmount)}
              hint="returned to bookers"
            />
            <StatCard
              label="Confirmed"
              value={`${finance.data?.confirmedBookings ?? 0} / ${finance.data?.totalBookings ?? 0}`}
              hint="of all bookings"
            />
          </>
        )}
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Bookings by status"
            description="Straight from the landlord report endpoint."
          />
          {report.error ? (
            <CardBody>
              <ErrorState error={report.error} onRetry={report.refetch} resource="the report" />
            </CardBody>
          ) : report.loading && !report.data ? (
            <CardSkeleton />
          ) : (
            <CardBody className="space-y-3.5">
              {Object.entries(report.data?.byStatus ?? {}).map(([status, count], index) => (
                <div key={status}>
                  <div className="mb-1 flex items-baseline justify-between text-[13px]">
                    <span className="text-ink font-medium">{humanize(status)}</span>
                    <span className="text-ink-muted tabular-nums">{count}</span>
                  </div>
                  <Progress
                    value={count}
                    max={Math.max(report.data?.totalBookings ?? 1, 1)}
                    tone={(["brand", "ok", "warn", "bad"] as const)[index % 4]}
                  />
                </div>
              ))}
              {Object.keys(report.data?.byStatus ?? {}).length === 0 && (
                <EmptyState
                  icon={<CalendarCheck className="size-5" />}
                  title="No bookings yet"
                  description="Status counts appear once bookings exist."
                />
              )}
            </CardBody>
          )}
        </Card>

        <Card>
          <CardHeader title="Health" description="Rates across every booking." />
          <CardBody>
            <DefinitionList
              items={[
                { label: "Total bookings", value: report.data?.totalBookings ?? "—" },
                { label: "Revenue", value: money(report.data?.revenue) },
                {
                  label: "Cancellation rate",
                  value:
                    report.data != null ? `${(report.data.cancellationRate * 100).toFixed(1)}%` : "—",
                },
                {
                  label: "Avg. time to confirm",
                  value:
                    report.data != null
                      ? `${report.data.averageConfirmationHours.toFixed(1)} hrs`
                      : "—",
                },
              ]}
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
            {(properties.data ?? [])
              .filter((p) => p.listingType === "for_book")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
          </Select>
        </FilterBar>

        {feed.error ? (
          <CardBody>
            <ErrorState error={feed.error} onRetry={feed.refetch} resource="bookings" />
          </CardBody>
        ) : feed.loading && !feed.data ? (
          <TableSkeleton rows={6} columns={5} />
        ) : rows.length === 0 ? (
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
              <BookingActions booking={booking} onChanged={feed.refetch} />
            )}
          />
        )}
      </Card>

      <Card className="mt-4">
        <CardHeader
          title="Availability blocks & discounts"
          description="Both are configured per property."
        />
        <CardBody>
          <EmptyState
            icon={<Tag className="size-5" />}
            title="Managed on each property"
            description="The API exposes blocks and discounts only under /properties/{id}/, with no platform-wide list. Open a bookable property to see and edit them."
            action={
              <Link href="/properties">
                <Button>Go to properties</Button>
              </Link>
            }
          />
        </CardBody>
      </Card>

      <ManualBookingModal open={manualOpen} onClose={() => setManualOpen(false)} />
    </>
  );
}

function ManualBookingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const properties = useApi(useCallback(() => listAllProperties(), []));
  const bookable = useMemo(
    () => (properties.data ?? []).filter((p) => p.listingType === "for_book"),
    [properties.data],
  );
  const [propertyId, setPropertyId] = useState("");
  const selectedId = Number(propertyId) || bookable[0]?.id;
  const unitList = useApi(
    useCallback(() => (selectedId ? listUnits(selectedId) : Promise.resolve([])), [selectedId]),
  );
  const units = unitList.data ?? [];

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
              {bookable.map((p) => (
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

function BookingActions({
  booking,
  onChanged,
}: {
  booking: ApiBookingListItem;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <DefinitionList
          items={[
            { label: "Booking ID", value: `#${booking.id}` },
            { label: "Guests", value: booking.numGuests ?? "—" },
            { label: "Promo code", value: booking.promoCode || "—" },
            { label: "Discount", value: money(booking.discountAmount) },
            { label: "Confirmation paid", value: money(booking.confirmationAmountPaid) },
            { label: "Created", value: formatDateTime(booking.createdAt) },
            { label: "Booker", value: booking.bookerEmail || "Walk-in" },
            {
              label: "Source",
              value: booking.isManualBooking ? "Manual (landlord)" : "Tenant app",
            },
          ]}
        />
      </div>
      <div className="flex flex-col gap-2">
        {booking.status === "pending" && (
          <>
            <Button variant="primary" disabled={busy} onClick={() => run(() => confirmBooking(booking.id))}>
              <CheckCircle2 className="size-4" /> Confirm booking
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => run(() => rejectBooking(booking.id, "Rejected from the admin console."))}
            >
              <XCircle className="size-4" /> Reject
            </Button>
          </>
        )}
        {booking.status === "confirmed" && (
          <>
            <Button disabled={busy}>
              <CircleDollarSign className="size-4" /> Record offline payment
            </Button>
            <Button disabled={busy}>
              <Undo2 className="size-4" /> Issue refund
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => run(() => cancelBooking(booking.id, "Cancelled from the admin console."))}
            >
              <Ban className="size-4" /> Cancel booking
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
