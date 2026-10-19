"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Bath, BedDouble, Eye, Heart, Key, Store } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchInput, Select } from "@/components/ui/field";
import { DataTable, type Column } from "@/components/ui/table";
import { SegmentedControl } from "@/components/ui/tabs";
import { EmptyState, FilterBar, PageHeader, Progress, StatCard } from "@/components/ui/misc";
import { Donut } from "@/components/charts/donut";
import { CardSkeleton, ErrorState, TableSkeleton } from "@/components/ui/states";
import { useApi } from "@/lib/api/hooks";
import { listMarketplace } from "@/lib/api/resources";
import { PropertyThumb } from "../properties/page";
import type { ApiMarketplaceProperty } from "@/lib/api/types";
import { humanize, money, number } from "@/lib/utils";

export default function MarketplacePage() {
  const [query, setQuery] = useState("");
  const [listingType, setListingType] = useState("all");
  const [view, setView] = useState("table");

  // The public marketplace endpoint only ever returns listed properties, so
  // there is no "hidden" view here — that lives on the Properties screen.
  const feed = useApi(
    useCallback(
      () => listMarketplace(listingType === "all" ? {} : { listingType }),
      [listingType],
    ),
  );
  const listed: ApiMarketplaceProperty[] = useMemo(
    () => feed.data?.results ?? [],
    [feed.data],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listed.filter(
      (property) =>
        !q || `${property.title} ${property.neighborhood} ${property.city}`.toLowerCase().includes(q),
    );
  }, [listed, query]);

  const totalViews = listed.reduce((sum, p) => sum + p.viewCount, 0);
  const unlockedByMe = listed.filter((p) => p.isUnlocked).length;
  const favouritedByMe = listed.filter((p) => p.isFavorited).length;

  const columns: Column<ApiMarketplaceProperty>[] = [
    {
      key: "title",
      header: "Listing",
      sortValue: (row) => row.title,
      cell: (row) => (
        <Link href={`/properties/${row.id}`} className="focus-ring group flex items-center gap-3">
          <PropertyThumb image={row.primaryImage?.imageUrl} className="size-9 rounded-lg" />
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
      sortValue: (row) => Number(row.rentAmount),
      cell: (row) => (
        <span className="text-ink text-[13px] font-medium tabular-nums">{money(row.rentAmount)}</span>
      ),
    },
    {
      key: "views",
      header: "Views",
      align: "right",
      sortValue: (row) => row.viewCount,
      cell: (row) => (
        <span className="text-ink-muted flex items-center justify-end gap-1 text-[13px] tabular-nums">
          <Eye className="text-ink-subtle size-3.5" />
          {number(row.viewCount)}
        </span>
      ),
    },
    {
      key: "units",
      header: "Units",
      align: "right",
      hideOnMobile: true,
      sortValue: (row) => row.unitCount,
      cell: (row) => (
        <span className="text-ink-muted text-[13px] tabular-nums">
          {row.hasUnits ? number(row.unitCount) : "—"}
        </span>
      ),
    },
    {
      key: "mine",
      header: "You",
      align: "right",
      cell: (row) => (
        <span className="flex justify-end gap-1.5">
          {row.isUnlocked && (
            <Badge tone="ok">
              <Key className="size-3" /> Unlocked
            </Badge>
          )}
          {row.isFavorited && (
            <Badge tone="brand">
              <Heart className="size-3" /> Saved
            </Badge>
          )}
          {!row.isUnlocked && !row.isFavorited && (
            <span className="text-ink-subtle text-xs">—</span>
          )}
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
        {feed.loading && !feed.data ? (
          Array.from({ length: 4 }, (_, i) => (
            <Card key={i}>
              <CardSkeleton />
            </Card>
          ))
        ) : (
          <>
            <StatCard
              label="Live listings"
              value={number(feed.data?.count ?? 0)}
              hint="publicly discoverable"
              icon={<Store className="size-4" />}
            />
            <StatCard label="Total views" value={number(totalViews)} hint="across this page" />
            <StatCard
              label="Unlocked by you"
              value={number(unlockedByMe)}
              hint="2 credits each"
              icon={<Key className="size-4" />}
            />
            <StatCard label="Saved by you" value={number(favouritedByMe)} />
          </>
        )}
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Listing mix" description="Live listings by intent." />
          <CardBody>
            <Donut
              totalLabel="live listings"
              slices={[
                {
                  label: "For rent",
                  value: listed.filter((p) => p.listingType === "for_rent").length,
                  color: "var(--brand)",
                },
                {
                  label: "For book",
                  value: listed.filter((p) => p.listingType === "for_book").length,
                  color: "#38bdf8",
                },
                {
                  label: "For sale",
                  value: listed.filter((p) => p.listingType === "for_sale").length,
                  color: "#34d399",
                },
              ]}
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Most viewed" description="Listings ranked by view count." />
          <CardBody className="space-y-3.5">
            {listed.length === 0 ? (
              <EmptyState
                icon={<Store className="size-5" />}
                title="Nothing listed yet"
                description="Properties appear here once they are listed in the marketplace."
              />
            ) : (
              [...listed]
                .sort((a, b) => b.viewCount - a.viewCount)
                .slice(0, 6)
                .map((property) => (
                  <div key={property.id}>
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
                      <Link
                        href={`/properties/${property.id}`}
                        className="text-ink focus-ring min-w-0 truncate font-medium hover:underline"
                      >
                        {property.title}
                      </Link>
                      <span className="text-ink-muted shrink-0 tabular-nums">
                        {number(property.viewCount)} views
                      </span>
                    </div>
                    <Progress
                      value={property.viewCount}
                      max={Math.max(1, ...listed.map((p) => p.viewCount))}
                      tone="brand"
                    />
                  </div>
                ))
            )}
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

        {feed.error ? (
          <CardBody>
            <ErrorState error={feed.error} onRetry={feed.refetch} resource="the marketplace" />
          </CardBody>
        ) : feed.loading && !feed.data ? (
          <TableSkeleton rows={6} columns={5} />
        ) : rows.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<Store className="size-5" />}
              title="No listings match"
              description="Clear the search or change the listing type."
            />
          </CardBody>
        ) : view === "table" ? (
          <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} pageSize={10} />
        ) : (
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((property) => (
                <div
                  key={property.id}
                  className="border-line bg-surface overflow-hidden rounded-xl border"
                >
                  <div className="bg-surface-hover relative h-32">
                    <PropertyThumb
                      image={property.primaryImage?.imageUrl}
                      className="h-32 w-full"
                    />
                    <span className="absolute top-2.5 left-2.5">
                      <Badge tone="ok">
                        <Eye className="size-3" /> Live
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
                      {[property.neighborhood, property.city].filter(Boolean).join(", ")}
                    </p>
                    <p className="text-ink mt-2.5 text-[15px] font-semibold tabular-nums">
                      {money(property.rentAmount)}
                    </p>
                    <div className="border-line text-ink-muted mt-3 flex items-center gap-3 border-t pt-3 text-xs">
                      <span className="flex items-center gap-1">
                        <Eye className="size-3.5" /> {number(property.viewCount)}
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
              ))}
            </div>
          </CardBody>
        )}
      </Card>
    </>
  );
}
