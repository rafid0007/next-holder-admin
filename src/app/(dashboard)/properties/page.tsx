"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bath, BedDouble, Building2, Eye, MoreHorizontal, Plus, RefreshCcw, Ruler, Store, Upload,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, SearchInput, Select, Switch, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/table";
import { SegmentedControl, Tabs } from "@/components/ui/tabs";
import { EmptyState, FilterBar, PageHeader, StatCard } from "@/components/ui/misc";
import { CardSkeleton, ErrorState, TableSkeleton } from "@/components/ui/states";
import { useApi } from "@/lib/api/hooks";
import {
  acceptTransfer, listAllProperties, listTransferRequests, rejectTransfer,
} from "@/lib/api/resources";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiProperty, ApiTransferRequest, PropertyCategory } from "@/lib/api/types";
import { cn, formatDate, humanize, money, number } from "@/lib/utils";

const statusTabs = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "occupied", label: "Occupied" },
  { id: "maintenance", label: "Maintenance" },
  { id: "unlisted", label: "Unlisted" },
];

export default function PropertiesPage() {
  const [tab, setTab] = useState("all");
  const [view, setView] = useState("table");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [listingType, setListingType] = useState("all");
  const [city, setCity] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);

  const properties = useApi(useCallback(() => listAllProperties(), []));
  const transfers = useApi(useCallback(() => listTransferRequests(), []));

  const all = useMemo(() => properties.data ?? [], [properties.data]);

  const cities = useMemo(
    () => Array.from(new Set(all.map((p) => p.city).filter(Boolean))).sort(),
    [all],
  );

  const categories = useMemo(() => {
    const seen = new Map<number, PropertyCategory>();
    for (const property of all) seen.set(property.propertyCategory.id, property.propertyCategory);
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [all]);

  // Applied in the browser: GET /properties/ filters only by the geo hierarchy.
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((p) => {
      if (tab !== "all" && p.status !== tab) return false;
      if (categoryId !== "all" && p.propertyCategory.id !== Number(categoryId)) return false;
      if (listingType !== "all" && p.listingType !== listingType) return false;
      if (city !== "all" && p.city !== city) return false;
      if (q && !`${p.title} ${p.neighborhood} ${p.city} ${p.street}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [all, tab, query, categoryId, listingType, city]);

  const counts = useMemo(
    () =>
      statusTabs.map((t) => ({
        ...t,
        count: t.id === "all" ? all.length : all.filter((p) => p.status === t.id).length,
      })),
    [all],
  );

  const listed = all.filter((p) => p.isListedInMarketplace).length;
  const occupied = all.filter((p) => p.status === "occupied").length;
  const pendingTransfers = (transfers.data ?? []).filter((t) => t.status === "pending").length;

  const columns: Column<ApiProperty>[] = [
    {
      key: "title",
      header: "Property",
      sortValue: (row) => row.title,
      cell: (row) => (
        <Link href={`/properties/${row.id}`} className="focus-ring group flex items-center gap-3">
          <PropertyThumb image={row.primaryImage?.imageUrl} className="size-9 rounded-lg" />
          <span className="min-w-0">
            <span className="text-ink block max-w-64 truncate text-[13px] font-medium group-hover:underline">
              {row.title}
            </span>
            <span className="text-ink-subtle block truncate text-xs">
              {[row.neighborhood, row.city].filter(Boolean).join(", ")} · {row.propertyType.name}
            </span>
          </span>
        </Link>
      ),
    },
    {
      key: "category",
      header: "Category",
      hideOnMobile: true,
      sortValue: (row) => row.propertyCategory.name,
      cell: (row) => (
        <span className="text-ink-muted text-[13px]">{row.propertyCategory.name}</span>
      ),
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
      sortValue: (row) => row.viewCount,
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
      sortValue: (row) => Number(row.rentAmount),
      cell: (row) => (
        <span className="text-ink text-[13px] font-medium tabular-nums">
          {money(row.rentAmount)}
          {row.listingType === "for_book" && (
            <span className="text-ink-subtle font-normal"> /slot</span>
          )}
          {row.listingType === "for_rent" && (
            <span className="text-ink-subtle font-normal"> /mo</span>
          )}
        </span>
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
      width: "48px",
      cell: () => (
        <Button size="icon" variant="ghost" aria-label="Row actions">
          <MoreHorizontal className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Properties"
        description="Listings owned by the signed-in landlord, with tenancy state and marketplace visibility."
        actions={
          <>
            <Button onClick={properties.refetch} disabled={properties.loading}>
              <RefreshCcw className={cn("size-4", properties.loading && "animate-spin")} />
              Refresh
            </Button>
            <Button>
              <Upload className="size-4" /> Import
            </Button>
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> Add property
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {properties.loading && !properties.data ? (
          Array.from({ length: 4 }, (_, i) => (
            <Card key={i}>
              <CardSkeleton />
            </Card>
          ))
        ) : (
          <>
            <StatCard label="Total properties" value={number(all.length)} hint="in your portfolio" />
            <StatCard
              label="In marketplace"
              value={number(listed)}
              hint={`${number(all.length - listed)} hidden`}
            />
            <StatCard
              label="Occupied"
              value={all.length ? `${Math.round((occupied / all.length) * 100)}%` : "—"}
              hint="occupancy"
            />
            <StatCard
              label="Pending transfers"
              value={number(pendingTransfers)}
              hint="awaiting acceptance"
            />
          </>
        )}
      </div>

      <Card>
        <Tabs items={counts} value={tab} onChange={setTab} className="px-3" />
        <FilterBar>
          <SearchInput
            placeholder="Search title, area or address…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-72"
          />
          <Select
            aria-label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-auto"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
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
          <Select aria-label="City" value={city} onChange={(e) => setCity(e.target.value)} className="w-auto">
            <option value="all">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
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

        {properties.error ? (
          <CardBody>
            <ErrorState
              error={properties.error}
              onRetry={properties.refetch}
              resource="properties"
            />
          </CardBody>
        ) : properties.loading && !properties.data ? (
          <TableSkeleton rows={6} columns={6} />
        ) : rows.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<Building2 className="size-5" />}
              title={all.length === 0 ? "No properties yet" : "No properties match these filters"}
              description={
                all.length === 0
                  ? "Add the first property to this landlord account to see it here."
                  : "Clear a filter or widen the search to see more listings."
              }
              action={
                all.length === 0 ? (
                  <Button variant="primary" onClick={() => setCreateOpen(true)}>
                    <Plus className="size-4" /> Add property
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setQuery("");
                      setCategoryId("all");
                      setListingType("all");
                      setCity("all");
                      setTab("all");
                    }}
                  >
                    Reset filters
                  </Button>
                )
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

      <Card className="mt-4">
        <CardHeader
          title="Ownership transfers"
          description="Transfer requests you have sent or received, pending acceptance."
        />
        {transfers.error ? (
          <CardBody>
            <ErrorState
              error={transfers.error}
              onRetry={transfers.refetch}
              resource="transfer requests"
            />
          </CardBody>
        ) : transfers.loading && !transfers.data ? (
          <TableSkeleton rows={3} columns={5} />
        ) : (transfers.data ?? []).length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<Building2 className="size-5" />}
              title="No transfer requests"
              description="Ownership handovers you send or receive will appear here."
            />
          </CardBody>
        ) : (
          <DataTable
            rows={transfers.data ?? []}
            rowKey={(row) => row.id}
            pageSize={5}
            columns={transferColumns(transfers.refetch)}
          />
        )}
      </Card>

      <CreatePropertyModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={properties.refetch}
        categories={categories}
      />
    </>
  );
}

function transferColumns(onChanged: () => void): Column<ApiTransferRequest>[] {
  return [
    {
      key: "property",
      header: "Property",
      cell: (row) => (
        <Link
          href={`/properties/${row.property}`}
          className="focus-ring text-ink block max-w-56 truncate text-[13px] font-medium hover:underline"
        >
          {row.propertyTitle}
        </Link>
      ),
    },
    {
      key: "from",
      header: "From",
      hideOnMobile: true,
      cell: (row) => <span className="text-ink-muted text-[13px]">{row.fromLandlord.fullName}</span>,
    },
    {
      key: "to",
      header: "To",
      hideOnMobile: true,
      cell: (row) => <span className="text-ink-muted text-[13px]">{row.toLandlord.fullName}</span>,
    },
    {
      key: "sent",
      header: "Requested",
      hideOnMobile: true,
      sortValue: (row) => row.sentAt,
      cell: (row) => <span className="text-ink-muted text-xs">{formatDate(row.sentAt)}</span>,
    },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (row) =>
        row.status === "pending" ? <TransferActions request={row} onChanged={onChanged} /> : null,
    },
  ];
}

function TransferActions({
  request,
  onChanged,
}: {
  request: ApiTransferRequest;
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
    <div className="flex justify-end gap-1.5">
      <Button
        size="sm"
        variant="subtle"
        disabled={busy}
        onClick={() => run(() => acceptTransfer(request.id))}
      >
        Accept
      </Button>
      <Button
        size="sm"
        variant="danger"
        disabled={busy}
        onClick={() => run(() => rejectTransfer(request.id, "Declined from the admin console."))}
      >
        Reject
      </Button>
    </div>
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

function PropertyCard({ property }: { property: ApiProperty }) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className="focus-ring border-line bg-surface hover:shadow-raised group block overflow-hidden rounded-xl border transition-shadow"
    >
      <div className="bg-surface-hover relative h-36">
        <PropertyThumb image={property.primaryImage?.imageUrl} className="h-36 w-full" />
        <span className="absolute top-2.5 left-2.5">
          <StatusBadge status={property.status} />
        </span>
      </div>
      <div className="p-4">
        <p className="text-ink truncate text-[13px] font-medium group-hover:underline">
          {property.title}
        </p>
        <p className="text-ink-subtle mt-0.5 truncate text-xs">
          {[property.neighborhood, property.city].filter(Boolean).join(", ")}
        </p>
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

function CreatePropertyModal({
  open,
  onClose,
  onCreated,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  categories: PropertyCategory[];
}) {
  const [categoryId, setCategoryId] = useState("");
  const [listInMarketplace, setListInMarketplace] = useState(true);
  const [busy, setBusy] = useState(false);

  // Types and amenities come from the taxonomy endpoints, not from the listings.
  const taxonomy = useApi(
    useCallback(
      () => api.get<PropertyCategory[]>(endpoints.properties.categories),
      [],
    ),
  );
  const amenities = useApi(
    useCallback(
      () => api.get<{ id: number; name: string; isActive: boolean }[]>(endpoints.properties.amenities),
      [],
    ),
  );

  const categoryOptions = taxonomy.data ?? categories;
  const selectedCategory =
    categoryOptions.find((c) => String(c.id) === categoryId) ?? categoryOptions[0];
  const types = selectedCategory?.types ?? [];
  const [picked, setPicked] = useState<number[]>([]);

  async function submit() {
    setBusy(true);
    try {
      // POST /properties/ takes PropertyCreateUpdateSerializer and creates the
      // property under the authenticated landlord.
      onCreated();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a property"
      description="Creating a property counts against the landlord's subscription limit."
      size="lg"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={busy} onClick={submit}>
            Create property
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Title" hint="Shown in the marketplace and all admin lists.">
          <Input placeholder="e.g. Gulshan 2 — 3 bed family apartment" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Property type">
            <Select>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Listing type">
            <Select>
              <option value="for_rent">For rent</option>
              <option value="for_sale">For sale</option>
              <option value="for_book">For book</option>
            </Select>
          </Field>
          <Field label="Holding number" hint="Lazily created if it does not exist yet.">
            <Input placeholder="H-102" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Monthly rent (৳)">
            <Input type="number" placeholder="48000" />
          </Field>
          <Field label="Deposit (৳)">
            <Input type="number" placeholder="96000" />
          </Field>
          <Field label="Area (sqft)">
            <Input type="number" placeholder="1400" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Bedrooms">
            <Input type="number" defaultValue={2} />
          </Field>
          <Field label="Bathrooms">
            <Input type="number" defaultValue={2} />
          </Field>
          <Field label="Balconies">
            <Input type="number" defaultValue={1} />
          </Field>
          <Field label="Total rooms">
            <Input type="number" defaultValue={4} />
          </Field>
        </div>

        <Field label="Address">
          <Input placeholder="House 9, Road 27" />
        </Field>

        <Field label="Description">
          <Textarea placeholder="Describe the space, utilities and nearby landmarks…" />
        </Field>

        <div>
          <p className="text-ink mb-2 text-[13px] font-medium">Amenities</p>
          <div className="flex flex-wrap gap-2">
            {(amenities.data ?? [])
              .filter((a) => a.isActive)
              .map((amenity) => {
                const on = picked.includes(amenity.id);
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() =>
                      setPicked((prev) =>
                        on ? prev.filter((id) => id !== amenity.id) : [...prev, amenity.id],
                      )
                    }
                    className={cn(
                      "focus-ring rounded-lg border px-2.5 py-1 text-[13px] transition-colors",
                      on
                        ? "bg-brand-soft border-brand/30 text-brand-ink"
                        : "border-line-strong text-ink-muted hover:bg-surface-hover",
                    )}
                  >
                    {amenity.name}
                  </button>
                );
              })}
            {amenities.loading && <span className="text-ink-subtle text-[13px]">Loading…</span>}
          </div>
        </div>

        <div className="border-line bg-surface-muted flex items-center justify-between rounded-xl border p-4">
          <div>
            <p className="text-ink text-[13px] font-medium">List in marketplace immediately</p>
            <p className="text-ink-subtle text-xs">
              Tenants can discover it and spend credits to unlock contact details.
            </p>
          </div>
          <Switch
            checked={listInMarketplace}
            onChange={setListInMarketplace}
            label="List in marketplace"
          />
        </div>
      </div>
    </Modal>
  );
}
