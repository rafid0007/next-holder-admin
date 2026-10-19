"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Ticket } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchInput, Select, Switch } from "@/components/ui/field";
import { DataTable, type Column } from "@/components/ui/table";
import { EmptyState, FilterBar, PageHeader, StatCard, UserCell } from "@/components/ui/misc";
import { ErrorState, TableSkeleton } from "@/components/ui/states";
import { RequirePermission } from "@/components/layout/permission-gate";
import { useApi } from "@/lib/api/hooks";
import { useAdminSession } from "@/lib/api/admin-session";
import { listAdminBookingDiscounts, setDiscountActive } from "@/lib/api/admin";
import type { AdminBookingDiscount } from "@/lib/api/admin-types";
import { formatDate, humanize, money, number } from "@/lib/utils";

export default function PromotionsPage() {
  return (
    <RequirePermission codes={["promotions.view"]}>
      <Promotions />
    </RequirePermission>
  );
}

function Promotions() {
  const { can } = useAdminSession();
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("all");

  const feed = useApi(
    useCallback(
      () =>
        listAdminBookingDiscounts({
          search: search.trim() || undefined,
          isActive: active === "all" ? undefined : active === "active",
        }),
      [search, active],
    ),
  );

  const rows = useMemo(() => feed.data?.results ?? [], [feed.data]);

  const columns: Column<AdminBookingDiscount>[] = [
    {
      key: "name",
      header: "Discount",
      cell: (row) => (
        <span className="block max-w-64">
          <span className="text-ink block truncate text-[13px] font-medium">{row.name}</span>
          <span className="text-ink-subtle block truncate text-xs">
            {row.discountType === "percentage" || row.discountType === "percent"
              ? `${Number(row.value)}% off`
              : `${money(row.value)} off`}
            {" · "}
            {humanize(row.scope)} scope
          </span>
        </span>
      ),
    },
    {
      key: "promo",
      header: "Promo code",
      cell: (row) =>
        row.promoCode ? (
          <span className="text-ink bg-surface-hover rounded px-1.5 py-0.5 font-mono text-xs">
            {row.promoCode}
          </span>
        ) : (
          <span className="text-ink-subtle text-xs">Automatic</span>
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
      key: "landlord",
      header: "Landlord",
      hideOnMobile: true,
      cell: (row) => <UserCell name={row.landlord.fullName} meta={row.landlord.email} />,
    },
    {
      key: "window",
      header: "Window",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-ink-muted text-xs whitespace-nowrap">
          {row.startDate ? formatDate(row.startDate) : "Always"}
          {row.endDate ? ` → ${formatDate(row.endDate)}` : ""}
        </span>
      ),
    },
    {
      key: "state",
      header: "State",
      align: "right",
      cell: (row) =>
        can("promotions.manage") ? (
          <span className="flex justify-end">
            <DiscountToggle discount={row} onChanged={feed.refetch} />
          </span>
        ) : (
          <Badge tone={row.isActive ? "ok" : "neutral"}>
            {row.isActive ? "Active" : "Off"}
          </Badge>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Promotions"
        description="Booking discounts and promo codes created by landlords. Staff can switch them on or off."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Discounts" value={number(feed.data?.count ?? 0)} icon={<Ticket className="size-4" />} />
        <StatCard label="Active" value={number(rows.filter((d) => d.isActive).length)} />
        <StatCard label="With a promo code" value={number(rows.filter((d) => d.promoCode).length)} />
        <StatCard
          label="Percentage based"
          value={number(rows.filter((d) => d.discountType.startsWith("percent")).length)}
        />
      </div>

      <Card>
        <FilterBar>
          <SearchInput
            placeholder="Search name, code or property…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80"
          />
          <Select
            aria-label="State"
            value={active}
            onChange={(e) => setActive(e.target.value)}
            className="w-auto"
          >
            <option value="all">Any state</option>
            <option value="active">Active only</option>
            <option value="inactive">Off only</option>
          </Select>
        </FilterBar>

        {feed.error ? (
          <CardBody>
            <ErrorState error={feed.error} onRetry={feed.refetch} resource="discounts" />
          </CardBody>
        ) : feed.loading && !feed.data ? (
          <TableSkeleton rows={5} columns={5} />
        ) : rows.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<Ticket className="size-5" />}
              title="No discounts"
              description="Landlords create these on their own properties; staff can only switch them off."
            />
          </CardBody>
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} pageSize={10} />
        )}
      </Card>
    </>
  );
}

function DiscountToggle({
  discount,
  onChanged,
}: {
  discount: AdminBookingDiscount;
  onChanged: () => void;
}) {
  const [on, setOn] = useState(discount.isActive);
  const [busy, setBusy] = useState(false);

  async function toggle(next: boolean) {
    setOn(next);
    setBusy(true);
    try {
      await setDiscountActive(discount.id, next);
      onChanged();
    } catch {
      setOn(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className={busy ? "pointer-events-none opacity-60" : undefined}>
      <Switch checked={on} onChange={toggle} label={`${discount.name} active`} />
    </span>
  );
}
