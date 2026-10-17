"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bath, BedDouble, Building2, Eye, EyeOff, Heart, Key, Store } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { SearchInput, Select, Switch } from "@/components/ui/field";
import { DataTable, type Column } from "@/components/ui/table";
import { SegmentedControl } from "@/components/ui/tabs";
import { EmptyState, FilterBar, PageHeader, Progress, StatCard } from "@/components/ui/misc";
import { Donut } from "@/components/charts/donut";
import { properties } from "@/lib/mock/data";
import type { Property } from "@/lib/api/types";
import { humanize, money, number } from "@/lib/utils";

/** Engagement figures the marketplace endpoints expose per listing. */
const engagement = (id: number) => ({
  unlocks: ((id * 7) % 23) + 2,
  favorites: ((id * 11) % 41) + 5,
  views: ((id * 37) % 480) + 60,
});

export default function MarketplacePage() {
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState("listed");
  const [listingType, setListingType] = useState("all");
  const [view, setView] = useState("table");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return properties.filter((property) => {
      if (visibility === "listed" && !property.isListedInMarketplace) return false;
      if (visibility === "hidden" && property.isListedInMarketplace) return false;
      if (listingType !== "all" && property.listingType !== listingType) return false;
      if (q && !`${property.title} ${property.neighborhood} ${property.city}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [query, visibility, listingType]);

  const listed = properties.filter((p) => p.isListedInMarketplace);
  const totalUnlocks = listed.reduce((sum, p) => sum + engagement(p.id).unlocks, 0);
  const totalFavorites = listed.reduce((sum, p) => sum + engagement(p.id).favorites, 0);

  const columns: Column<Property>[] = [
    {
      key: "title",
      header: "Listing",
      sortValue: (row) => row.title,
      cell: (row) => (
        <Link href={`/properties/${row.id}`} className="focus-ring group flex items-center gap-3">
          <span className="bg-surface-hover text-ink-subtle grid size-9 shrink-0 place-items-center rounded-lg">
            <Building2 className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="text-ink block max-w-56 truncate text-[13px] font-medium group-hover:underline">
              {row.title}
            </span>
            <span className="text-ink-subtle block truncate text-xs">
              {row.neighborhood}, {row.city}
            </span>
          </span>
        </Link>
      ),
    },
    {
      key: "listingType",
      header: "Type",
      hideOnMobile: true,
      cell: (row) => <Badge tone={row.listingType === "for_book" ? "info" : "neutral"}>{humanize(row.listingType)}</Badge>,
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      sortValue: (row) => row.rentAmount,
      cell: (row) => (
        <span className="text-ink text-[13px] font-medium tabular-nums">{money(row.rentAmount)}</span>
      ),
    },
    {
      key: "views",
      header: "Views",
      align: "right",
      hideOnMobile: true,
      sortValue: (row) => engagement(row.id).views,
      cell: (row) => (
        <span className="text-ink-muted text-[13px] tabular-nums">{number(engagement(row.id).views)}</span>
      ),
    },
    {
      key: "unlocks",
      header: "Unlocks",
      align: "right",
      sortValue: (row) => engagement(row.id).unlocks,
      cell: (row) => (
        <span className="text-ink flex items-center justify-end gap-1 text-[13px] tabular-nums">
          <Key className="text-ink-subtle size-3.5" />
          {engagement(row.id).unlocks}
        </span>
      ),
    },
    {
      key: "favorites",
      header: "Saves",
      align: "right",
      hideOnMobile: true,
      sortValue: (row) => engagement(row.id).favorites,
      cell: (row) => (
        <span className="text-ink-muted flex items-center justify-end gap-1 text-[13px] tabular-nums">
          <Heart className="size-3.5" />
          {engagement(row.id).favorites}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "visibility",
      header: "Listed",
      align: "right",
      cell: (row) => (
        <span className="flex justify-end">
          <ListingToggle initial={row.isListedInMarketplace} />
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Marketplace"
        description="What tenants can discover publicly, and how often they spend credits to unlock contact details."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Live listings"
          value={String(listed.length)}
          hint={`${properties.length - listed.length} hidden`}
          icon={<Store className="size-4" />}
        />
        <StatCard label="Address unlocks" value={number(totalUnlocks)} delta={17.3} hint="2 credits each" />
        <StatCard label="Credits spent on unlocks" value={number(totalUnlocks * 2)} delta={17.3} />
        <StatCard label="Saved listings" value={number(totalFavorites)} delta={9.8} />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Listing mix" description="Live listings by intent." />
          <CardBody>
            <Donut
              totalLabel="live listings"
              slices={[
                { label: "For rent", value: listed.filter((p) => p.listingType === "for_rent").length, color: "var(--brand)" },
                { label: "For book", value: listed.filter((p) => p.listingType === "for_book").length, color: "#38bdf8" },
                { label: "For sale", value: listed.filter((p) => p.listingType === "for_sale").length, color: "#34d399" },
              ]}
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Top performers" description="Listings ranked by unlocks." />
          <CardBody className="space-y-3.5">
            {[...listed]
              .sort((a, b) => engagement(b.id).unlocks - engagement(a.id).unlocks)
              .slice(0, 6)
              .map((property) => {
                const stats = engagement(property.id);
                return (
                  <div key={property.id}>
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
                      <Link
                        href={`/properties/${property.id}`}
                        className="text-ink focus-ring min-w-0 truncate font-medium hover:underline"
                      >
                        {property.title}
                      </Link>
                      <span className="text-ink-muted shrink-0 tabular-nums">
                        {stats.unlocks} unlocks · {stats.views} views
                      </span>
                    </div>
                    <Progress value={stats.unlocks} max={25} tone="brand" />
                  </div>
                );
              })}
          </CardBody>
        </Card>
      </div>

      <Card>
        <FilterBar>
          <SearchInput
            placeholder="Search listing or area…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-72"
          />
          <Select
            aria-label="Visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-auto"
          >
            <option value="listed">Live in marketplace</option>
            <option value="hidden">Hidden</option>
            <option value="all">All properties</option>
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
          <div className="ml-auto">
            <SegmentedControl
              value={view}
              onChange={setView}
              items={[
                { id: "table", label: "Table" },
                { id: "grid", label: "Cards" },
              ]}
            />
          </div>
        </FilterBar>

        {rows.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<Store className="size-5" />}
              title="No listings match"
              description="Adjust the visibility filter or clear the search."
            />
          </CardBody>
        ) : view === "table" ? (
          <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} pageSize={10} />
        ) : (
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((property) => {
                const stats = engagement(property.id);
                return (
                  <div
                    key={property.id}
                    className="border-line bg-surface overflow-hidden rounded-xl border"
                  >
                    <div className="bg-surface-hover relative grid h-32 place-items-center">
                      <Building2 className="text-ink-subtle size-7" />
                      <span className="absolute top-2.5 left-2.5">
                        <Badge tone={property.isListedInMarketplace ? "ok" : "neutral"}>
                          {property.isListedInMarketplace ? (
                            <>
                              <Eye className="size-3" /> Live
                            </>
                          ) : (
                            <>
                              <EyeOff className="size-3" /> Hidden
                            </>
                          )}
                        </Badge>
                      </span>
                    </div>
                    <div className="p-4">
                      <Link
                        href={`/properties/${property.id}`}
                        className="text-ink focus-ring block truncate text-[13px] font-medium hover:underline"
                      >
                        {property.title}
                      </Link>
                      <p className="text-ink-subtle mt-0.5 truncate text-xs">
                        {property.neighborhood}, {property.city}
                      </p>
                      <p className="text-ink mt-2.5 text-[15px] font-semibold tabular-nums">
                        {money(property.rentAmount)}
                      </p>
                      <div className="border-line text-ink-muted mt-3 flex items-center gap-3 border-t pt-3 text-xs">
                        <span className="flex items-center gap-1">
                          <Key className="size-3.5" /> {stats.unlocks}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="size-3.5" /> {stats.favorites}
                        </span>
                        {property.bedrooms > 0 && (
                          <span className="flex items-center gap-1">
                            <BedDouble className="size-3.5" /> {property.bedrooms}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Bath className="size-3.5" /> {property.bathrooms}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        )}
      </Card>
    </>
  );
}

function ListingToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  return <Switch checked={on} onChange={setOn} label="Listed in marketplace" />;
}
