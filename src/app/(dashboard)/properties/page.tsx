"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bath, BedDouble, Building2, Eye, EyeOff, RefreshCcw, Ruler, Store,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, SearchInput, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/table";
import { SegmentedControl, Tabs } from "@/components/ui/tabs";
import { EmptyState, FilterBar, PageHeader, StatCard, UserCell } from "@/components/ui/misc";
import { CardSkeleton, ErrorState, InlineError, TableSkeleton } from "@/components/ui/states";
import { RequirePermission } from "@/components/layout/permission-gate";
import { ApiError } from "@/lib/api/client";
import { useApi } from "@/lib/api/hooks";
import { useAdminSession } from "@/lib/api/admin-session";
import { getDashboardStats, hideProperty, listAdminCategories, listAdminProperties, unhideProperty } from "@/lib/api/admin";
import type { AdminProperty } from "@/lib/api/admin-types";
import { cn, humanize, money, number } from "@/lib/utils";

const statusTabs = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "occupied", label: "Occupied" },
  { id: "maintenance", label: "Maintenance" },
  { id: "unlisted", label: "Unlisted" },
];

export default function PropertiesPage() {
  return (
    <RequirePermission codes={["listings.view"]}>
      <Properties />
    </RequirePermission>
  );
}

function Properties() {
  const { can } = useAdminSession();
  const [tab, setTab] = useState("all");
  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [listingType, setListingType] = useState("all");
  const [hidden, setHidden] = useState("all");
  const [ordering, setOrdering] = useState("-createdAt");
  const [moderating, setModerating] = useState<AdminProperty | null>(null);

  // Every filter is server-side now, so the page holds no client-side pass.
  const feed = useApi(
    useCallback(
      () =>
        listAdminProperties({
          status: tab === "all" ? undefined : tab,
          categoryId: categoryId === "all" ? undefined : Number(categoryId),
          listingType: listingType === "all" ? undefined : listingType,
          isHidden: hidden === "all" ? undefined : hidden === "hidden",
          search: search.trim() || undefined,
          ordering,
        }),
      [tab, categoryId, listingType, hidden, search, ordering],
    ),
  );
  const categories = useApi(useCallback(() => listAdminCategories(), []));
  const stats = useApi(
    useCallback(
      () => (can("dashboard.view") ? getDashboardStats() : Promise.resolve(null)),
      [can],
    ),
  );

  const rows = useMemo(() => feed.data?.results ?? [], [feed.data]);
  const counts = stats.data?.properties;

  const columns: Column<AdminProperty>[] = [
    {
      key: "title",
      header: "Property",
      cell: (row) => (
        <Link href={`/properties/${row.id}`} className="focus-ring group flex items-center gap-3">
          <PropertyThumb image={row.primaryImage?.imageUrl} className="size-9 rounded-lg" />
          <span className="min-w-0">
            <span className="text-ink flex items-center gap-1.5 text-[13px] font-medium">
              <span className="max-w-56 truncate group-hover:underline">{row.title}</span>
              {row.isAdminHidden && <EyeOff className="text-bad size-3.5 shrink-0" />}
            </span>
            <span className="text-ink-subtle block truncate text-xs">
              {[row.neighborhood, row.city].filter(Boolean).join(", ")} · {row.propertyType.name}
            </span>
          </span>
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
      key: "listingType",
      header: "Listing",
      hideOnMobile: true,
      cell: (row) => (
        <div className="flex flex-col items-start gap-1">
          <Badge tone={row.listingType === "for_book" ? "info" : "neutral"}>
            {humanize(row.listingType)}
          </Badge>
          {row.isListedInMarketplace && (
            <span className="text-ink-subtle flex items-center gap-1 text-[11px]">
              <Store className="size-3" /> In marketplace
            </span>
          )}
        </div>
      ),
    },
    {
      key: "specs",
      header: "Specs",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-ink-muted flex items-center gap-2.5 text-xs whitespace-nowrap">
          {row.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <BedDouble className="size-3.5" /> {row.bedrooms}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Bath className="size-3.5" /> {row.bathrooms}
          </span>
          {row.areaSqft && (
            <span className="flex items-center gap-1">
              <Ruler className="size-3.5" /> {number(Number(row.areaSqft))}
            </span>
          )}
        </span>
      ),
    },
    {
      key: "views",
      header: "Views",
      align: "right",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-ink-muted flex items-center justify-end gap-1 text-[13px] tabular-nums">
          <Eye className="text-ink-subtle size-3.5" />
          {number(row.viewCount)}
        </span>
      ),
    },
    {
      key: "rent",
      header: "Price",
      align: "right",
      cell: (row) => (
        <span className="text-ink text-[13px] font-medium tabular-nums">
          {money(row.rentAmount)}
          {row.listingType === "for_rent" && (
            <span className="text-ink-subtle font-normal"> /mo</span>
          )}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span className="flex flex-col items-start gap-1">
          <StatusBadge status={row.status} />
          {row.isAdminHidden && <Badge tone="bad">Hidden</Badge>}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (row) =>
        can("listings.moderate") ? (
          <Button
            size="sm"
            variant={row.isAdminHidden ? "subtle" : "ghost"}
            onClick={(event) => {
              event.stopPropagation();
              setModerating(row);
            }}
          >
            {row.isAdminHidden ? "Unhide" : "Hide"}
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Properties"
        description="Every landlord's listings, including hidden and soft-deleted ones."
        actions={
          <>
            <Button onClick={feed.refetch} disabled={feed.loading}>
              <RefreshCcw className={cn("size-4", feed.loading && "animate-spin")} />
              Refresh
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.loading && !stats.data ? (
          Array.from({ length: 4 }, (_, i) => (
            <Card key={i}>
              <CardSkeleton />
            </Card>
          ))
        ) : (
          <>
            <StatCard
              label="Total properties"
              value={number(counts?.total ?? feed.data?.count ?? 0)}
              hint={`${number(counts?.newLast30Days ?? 0)} in the last 30 days`}
            />
            <StatCard label="In marketplace" value={number(counts?.listed ?? 0)} />
            <StatCard
              label="Occupied"
              value={
                counts?.total
                  ? `${Math.round((counts.occupied / counts.total) * 100)}%`
                  : "—"
              }
              hint="occupancy"
            />
            <StatCard
              label="Hidden by staff"
              value={number(counts?.hidden ?? 0)}
              hint={`${number(counts?.locked ?? 0)} locked by plan limit`}
            />
          </>
        )}
      </div>

      <Card>
        <Tabs items={statusTabs} value={tab} onChange={setTab} className="px-3" />
        <FilterBar>
          <SearchInput
            placeholder="Search title, address or landlord…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72"
          />
          <Select
            aria-label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-auto"
          >
            <option value="all">All categories</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Listing type"
            value={listingType}
            onChange={(e) => setListingType(e.target.value)}
            className="w-auto"
          >
            <option value="all">All listing types</option>
            <option value="for_rent">For rent</option>
            <option value="for_sale">For sale</option>
            <option value="for_book">For book</option>
          </Select>
          <Select
            aria-label="Moderation"
            value={hidden}
            onChange={(e) => setHidden(e.target.value)}
            className="w-auto"
          >
            <option value="all">Any visibility</option>
            <option value="hidden">Hidden by staff</option>
            <option value="visible">Not hidden</option>
          </Select>
          <Select
            aria-label="Sort"
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="w-auto"
          >
            <option value="-createdAt">Newest first</option>
            <option value="createdAt">Oldest first</option>
            <option value="-rentAmount">Highest price</option>
            <option value="rentAmount">Lowest price</option>
            <option value="title">Title A–Z</option>
          </Select>
          <div className="ml-auto">
            <SegmentedControl
              value={view}
              onChange={setView}
              items={[
                { id: "table", label: "Table" },
                { id: "grid", label: "Grid" },
              ]}
            />
          </div>
        </FilterBar>

        {feed.error ? (
          <CardBody>
            <ErrorState error={feed.error} onRetry={feed.refetch} resource="properties" />
          </CardBody>
        ) : feed.loading && !feed.data ? (
          <TableSkeleton rows={6} columns={6} />
        ) : rows.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<Building2 className="size-5" />}
              title="No properties match"
              description="Clear a filter or widen the search."
              action={
                <Button
                  onClick={() => {
                    setSearch("");
                    setCategoryId("all");
                    setListingType("all");
                    setHidden("all");
                    setTab("all");
                  }}
                >
                  Reset filters
                </Button>
              }
            />
          </CardBody>
        ) : view === "table" ? (
          <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} pageSize={10} />
        ) : (
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </CardBody>
        )}
      </Card>

      <ModerationModal
        property={moderating}
        onClose={() => setModerating(null)}
        onDone={feed.refetch}
      />

    </>
  );
}

function ModerationModal({
  property,
  onClose,
  onDone,
}: {
  property: AdminProperty | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiError | null>(null);
  const hiding = property ? !property.isAdminHidden : true;

  async function submit() {
    if (!property) return;
    setBusy(true);
    setFailure(null);
    try {
      if (hiding) await hideProperty(property.id, reason);
      else await unhideProperty(property.id, reason || undefined);
      setReason("");
      onDone();
      onClose();
    } catch (caught) {
      setFailure(caught instanceof ApiError ? caught : new ApiError(0, "Could not update"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={property != null}
      onClose={onClose}
      size="sm"
      title={hiding ? "Hide this listing" : "Unhide this listing"}
      description={
        hiding
          ? "It leaves the marketplace immediately and the landlord cannot re-list it."
          : "The moderation flag is cleared; the landlord re-lists it themselves."
      }
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant={hiding ? "danger" : "primary"}
            disabled={busy || (hiding && !reason.trim())}
            onClick={submit}
          >
            {busy ? "Saving…" : hiding ? "Hide listing" : "Unhide listing"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {failure && <InlineError error={failure} />}
        {property && (
          <p className="text-ink-muted text-[13px]">
            <span className="text-ink font-medium">{property.title}</span> ·{" "}
            {property.landlord.fullName}
          </p>
        )}
        {!hiding && property?.moderation.reason && (
          <p className="text-ink-subtle text-[13px]">
            Hidden for: {property.moderation.reason}
          </p>
        )}
        <Field
          label="Reason"
          hint={hiding ? "Required, and shown to the landlord." : "Optional, stored on the audit log."}
        >
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={hiding ? "Duplicate listing" : "Resolved with the landlord"}
          />
        </Field>
      </div>
    </Modal>
  );
}

export function PropertyThumb({
  image,
  className,
}: {
  image?: string | null;
  className?: string;
}) {
  if (!image) {
    return (
      <span
        className={cn(
          "bg-surface-hover text-ink-subtle grid shrink-0 place-items-center",
          className,
        )}
      >
        <Building2 className="size-4" />
      </span>
    );
  }
  return (
    <span className={cn("bg-surface-hover relative shrink-0 overflow-hidden", className)}>
      {/* Cloudinary hosts these; `unoptimized` avoids needing a remotePatterns entry. */}
      <Image src={image} alt="" fill unoptimized className="object-cover" sizes="96px" />
    </span>
  );
}

function PropertyCard({ property }: { property: AdminProperty }) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className="focus-ring border-line bg-surface hover:shadow-raised group block overflow-hidden rounded-xl border transition-shadow"
    >
      <div className="bg-surface-hover relative h-36">
        <PropertyThumb image={property.primaryImage?.imageUrl} className="h-36 w-full" />
        <span className="absolute top-2.5 left-2.5 flex gap-1.5">
          <StatusBadge status={property.status} />
          {property.isAdminHidden && <Badge tone="bad">Hidden</Badge>}
        </span>
      </div>
      <div className="p-4">
        <p className="text-ink truncate text-[13px] font-medium group-hover:underline">
          {property.title}
        </p>
        <p className="text-ink-subtle mt-0.5 truncate text-xs">{property.landlord.fullName}</p>
        <div className="mt-3 flex items-end justify-between">
          <span className="text-ink text-[15px] font-semibold tabular-nums">
            {money(property.rentAmount)}
          </span>
          <span className="text-ink-muted flex items-center gap-2 text-xs">
            {property.bedrooms > 0 && (
              <span className="flex items-center gap-1">
                <BedDouble className="size-3.5" />
                {property.bedrooms}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Bath className="size-3.5" />
              {property.bathrooms}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
