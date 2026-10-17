"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Ban, Bath, BedDouble, Building2, CalendarCheck, Copy, FileText,
  Image as ImageIcon, MapPin, Pencil, Ruler, Send, Store, Users, Wrench,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/field";
import { DataTable } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import {
  Avatar, DefinitionList, EmptyState, PageHeader,
} from "@/components/ui/misc";
import {
  CardSkeleton, ErrorState, InlineError, Skeleton, TableSkeleton,
} from "@/components/ui/states";
import { ApiError } from "@/lib/api/client";
import { useApi, useApiWhen, type QueryState } from "@/lib/api/hooks";
import {
  getProperty, listPropertyBills, listPropertyBookings, listPropertyInquiries,
  listPropertyLeases, listPropertyMaintenance, listUnits, toggleMarketplaceListing,
} from "@/lib/api/resources";
import type { ApiPropertyDetail, Paginated } from "@/lib/api/types";
import { cn, formatDate, formatDateTime, humanize, money, number } from "@/lib/utils";

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [tab, setTab] = useState("overview");

  const property = useApi(useCallback(() => getProperty(id), [id]));

  const units = useApiWhen(tab === "units", useCallback(() => listUnits(id), [id]));
  const leases = useApiWhen(tab === "leases", useCallback(() => listPropertyLeases(id), [id]));
  const bookings = useApiWhen(tab === "bookings", useCallback(() => listPropertyBookings(id), [id]));
  const bills = useApiWhen(tab === "bills", useCallback(() => listPropertyBills(id), [id]));
  const maintenance = useApiWhen(
    tab === "maintenance",
    useCallback(() => listPropertyMaintenance(id), [id]),
  );
  const inquiries = useApiWhen(
    tab === "inquiries",
    useCallback(() => listPropertyInquiries(id), [id]),
  );

  if (property.error) {
    return (
      <>
        <BackLink />
        <Card>
          <CardBody className="py-10">
            <ErrorState
              error={property.error}
              onRetry={property.refetch}
              resource="this property"
            />
          </CardBody>
        </Card>
      </>
    );
  }

  if (!property.data) return <DetailSkeleton />;

  const data = property.data;
  const address = [data.street, data.neighborhood, data.city].filter(Boolean).join(", ");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "units", label: "Units", count: countOf(units) },
    { id: "leases", label: "Leases", count: pageCount(leases) },
    { id: "bookings", label: "Bookings", count: pageCount(bookings) },
    { id: "bills", label: "Bills", count: pageCount(bills) },
    { id: "maintenance", label: "Maintenance", count: pageCount(maintenance) },
    { id: "inquiries", label: "Inquiries", count: pageCount(inquiries) },
  ];

  return (
    <>
      <BackLink />

      <PageHeader
        title={data.title}
        description={`${address} · ${data.propertyType.name}`}
        actions={
          <>
            <Button>
              <Copy className="size-4" /> Duplicate
            </Button>
            <Button>
              <Pencil className="size-4" /> Edit
            </Button>
            <Button variant="danger" disabled={data.isLocked}>
              <Ban className="size-4" /> Unlist
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={data.status} />
          <Badge tone={data.listingType === "for_book" ? "info" : "neutral"}>
            {humanize(data.listingType)}
          </Badge>
          {data.isLocked && <Badge tone="warn">Locked by active tenancy</Badge>}
          {data.isMarketplaceExpired && <Badge tone="bad">Marketplace window expired</Badge>}
          {data.holding && <Badge tone="neutral">Holding {data.holding.number}</Badge>}
        </div>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <Gallery images={data.images} />
            <CardBody>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { icon: BedDouble, label: "Bedrooms", value: number(data.bedrooms) },
                  { icon: Bath, label: "Bathrooms", value: number(data.bathrooms) },
                  {
                    icon: Ruler,
                    label: "Area",
                    value: data.areaSqft ? `${number(Number(data.areaSqft))} sqft` : "—",
                  },
                  { icon: Users, label: "Total rooms", value: number(data.rooms) },
                ].map((spec) => (
                  <div key={spec.label} className="bg-surface-muted rounded-xl p-3">
                    <spec.icon className="text-ink-subtle size-4" />
                    <p className="text-ink mt-2 text-[15px] font-semibold tabular-nums">
                      {spec.value}
                    </p>
                    <p className="text-ink-subtle text-xs">{spec.label}</p>
                  </div>
                ))}
              </div>

              <p className="text-ink-muted mt-4 text-[13px] leading-6">{data.description}</p>
              {data.additionalInfo && (
                <p className="text-ink-subtle mt-2 text-[13px] leading-6">{data.additionalInfo}</p>
              )}

              {(data.hasDrawingRoom ||
                data.hasDiningRoom ||
                data.hasKitchen ||
                data.hasStorageRoom) && (
                <div className="border-line mt-4 border-t pt-4">
                  <p className="text-ink-subtle mb-2 text-xs font-medium">Rooms</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.hasDrawingRoom && <Badge tone="neutral">Drawing room</Badge>}
                    {data.hasDiningRoom && <Badge tone="neutral">Dining room</Badge>}
                    {data.hasKitchen && <Badge tone="neutral">Kitchen</Badge>}
                    {data.hasStorageRoom && <Badge tone="neutral">Storage room</Badge>}
                  </div>
                </div>
              )}

              {data.amenities.length > 0 && (
                <div className="border-line mt-4 border-t pt-4">
                  <p className="text-ink-subtle mb-2 text-xs font-medium">Amenities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.amenities.map((amenity) => (
                      <Badge key={amenity.id} tone="neutral">
                        {amenity.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <Tabs items={tabs} value={tab} onChange={setTab} className="px-3" />

            {tab === "overview" && (
              <CardBody>
                <DefinitionList
                  items={[
                    { label: "Property ID", value: `#${data.id}` },
                    { label: "Category", value: data.propertyCategory.name },
                    { label: "Type", value: data.propertyType.name },
                    {
                      label: data.listingType === "for_book" ? "Price per slot" : "Monthly price",
                      value: money(data.rentAmount),
                    },
                    { label: "Security deposit", value: money(data.depositAmount) },
                    { label: "Confirmation amount", value: money(data.confirmationAmount) },
                    {
                      label: "Cancellation window",
                      value:
                        data.cancellationDeadlineHours != null
                          ? `${data.cancellationDeadlineHours} hours`
                          : "—",
                    },
                    { label: "Available from", value: formatDate(data.availableFrom) },
                    { label: "Floor / flat", value: [data.floorNumber, data.flatNumber].filter(Boolean).join(" / ") || "—" },
                    { label: "Division", value: data.division?.name ?? "—" },
                    { label: "District", value: data.district?.name ?? "—" },
                    { label: "Thana", value: data.thana?.name ?? "—" },
                    { label: "Area", value: data.area?.name ?? "—" },
                    { label: "Views", value: number(data.viewCount) },
                    { label: "Created", value: formatDate(data.createdAt) },
                    { label: "Last updated", value: formatDate(data.updatedAt) },
                  ]}
                />
              </CardBody>
            )}

            {tab === "units" && (
              <TabPanel
                state={units}
                resource="units"
                isEmpty={(d) => d.length === 0}
                empty={
                  <EmptyState
                    icon={<Building2 className="size-5" />}
                    title="No units defined"
                    description="Bookable properties can be split into units so each can be reserved separately."
                    action={<Button variant="primary">Add a unit</Button>}
                  />
                }
              >
                {(rows) => (
                  <DataTable
                    rows={rows}
                    rowKey={(row) => row.id}
                    columns={[
                      {
                        key: "name",
                        header: "Unit",
                        cell: (row) => (
                          <span>
                            <span className="text-ink block text-[13px] font-medium">{row.name}</span>
                            {row.description && (
                              <span className="text-ink-subtle block max-w-72 truncate text-xs">
                                {row.description}
                              </span>
                            )}
                          </span>
                        ),
                      },
                      {
                        key: "capacity",
                        header: "Capacity",
                        hideOnMobile: true,
                        cell: (row) => (
                          <span className="text-ink-muted text-[13px] tabular-nums">
                            {row.capacity ?? "—"}
                          </span>
                        ),
                      },
                      {
                        key: "confirmation",
                        header: "Confirmation amount",
                        align: "right",
                        cell: (row) => (
                          <span className="text-ink text-[13px] tabular-nums">
                            {money(row.confirmationAmount)}
                          </span>
                        ),
                      },
                      {
                        key: "status",
                        header: "State",
                        cell: (row) => (
                          <Badge tone={row.isActive ? "ok" : "neutral"}>
                            {row.isActive ? "Active" : "Inactive"}
                          </Badge>
                        ),
                      },
                    ]}
                  />
                )}
              </TabPanel>
            )}

            {tab === "leases" && (
              <TabPanel
                state={leases}
                resource="leases"
                isEmpty={(d) => d.results.length === 0}
                empty={<EmptyState icon={<FileText className="size-5" />} title="No leases yet" />}
              >
                {(page) => (
                  <DataTable
                    rows={page.results}
                    rowKey={(row) => row.id}
                    columns={[
                      {
                        key: "tenant",
                        header: "Tenant",
                        cell: (row) => (
                          <span className="flex items-center gap-2.5">
                            <Avatar name={row.tenant.fullName} />
                            <span className="min-w-0">
                              <span className="text-ink block truncate text-[13px] font-medium">
                                {row.tenant.fullName}
                              </span>
                              <span className="text-ink-subtle block truncate text-xs">
                                {row.tenant.email}
                              </span>
                            </span>
                          </span>
                        ),
                      },
                      {
                        key: "term",
                        header: "Term",
                        hideOnMobile: true,
                        cell: (row) => (
                          <span className="text-ink-muted text-xs whitespace-nowrap">
                            {formatDate(row.startDate)} → {formatDate(row.endDate)}
                          </span>
                        ),
                      },
                      {
                        key: "rent",
                        header: "Rent",
                        align: "right",
                        cell: (row) => (
                          <span className="text-ink text-[13px] tabular-nums">
                            {money(row.rentAmount)}
                          </span>
                        ),
                      },
                      { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
                    ]}
                  />
                )}
              </TabPanel>
            )}

            {tab === "bookings" && (
              <TabPanel
                state={bookings}
                resource="bookings"
                isEmpty={(d) => d.results.length === 0}
                empty={<EmptyState icon={<CalendarCheck className="size-5" />} title="No bookings yet" />}
              >
                {(page) => (
                  <DataTable
                    rows={page.results}
                    rowKey={(row) => row.id}
                    columns={[
                      {
                        key: "purpose",
                        header: "Purpose",
                        cell: (row) => (
                          <span>
                            <span className="text-ink block max-w-56 truncate text-[13px] font-medium">
                              {row.purpose}
                            </span>
                            <span className="text-ink-subtle block truncate text-xs">
                              {row.unitName ?? "Whole property"}
                              {row.isManualBooking && " · manual"}
                            </span>
                          </span>
                        ),
                      },
                      {
                        key: "when",
                        header: "When",
                        hideOnMobile: true,
                        cell: (row) => (
                          <span className="text-ink-muted text-xs">
                            {formatDateTime(row.startDatetime)}
                          </span>
                        ),
                      },
                      {
                        key: "amount",
                        header: "Amount",
                        align: "right",
                        cell: (row) => (
                          <span className="text-ink text-[13px] tabular-nums">
                            {money(row.finalAmount ?? row.confirmationAmountPaid)}
                          </span>
                        ),
                      },
                      {
                        key: "payment",
                        header: "Payment",
                        hideOnMobile: true,
                        cell: (row) => <StatusBadge status={row.paymentStatus} />,
                      },
                      { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
                    ]}
                  />
                )}
              </TabPanel>
            )}

            {tab === "bills" && (
              <TabPanel
                state={bills}
                resource="bills"
                isEmpty={(d) => d.results.length === 0}
                empty={<EmptyState icon={<FileText className="size-5" />} title="No bills raised" />}
              >
                {(page) => (
                  <DataTable
                    rows={page.results}
                    rowKey={(row) => row.id}
                    columns={[
                      {
                        key: "title",
                        header: "Bill",
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
                        key: "tenant",
                        header: "Tenant",
                        hideOnMobile: true,
                        cell: (row) => (
                          <span className="text-ink-muted text-[13px]">{row.tenant.fullName}</span>
                        ),
                      },
                      {
                        key: "due",
                        header: "Due",
                        hideOnMobile: true,
                        cell: (row) => (
                          <span className="text-ink-muted text-xs">{formatDate(row.dueDate)}</span>
                        ),
                      },
                      {
                        key: "amount",
                        header: "Amount",
                        align: "right",
                        cell: (row) => (
                          <span className="text-ink text-[13px] tabular-nums">
                            {money(row.amount)}
                          </span>
                        ),
                      },
                      { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
                    ]}
                  />
                )}
              </TabPanel>
            )}

            {tab === "maintenance" && (
              <TabPanel
                state={maintenance}
                resource="maintenance requests"
                isEmpty={(d) => d.results.length === 0}
                empty={<EmptyState icon={<Wrench className="size-5" />} title="No maintenance requests" />}
              >
                {(page) => (
                  <DataTable
                    rows={page.results}
                    rowKey={(row) => row.id}
                    columns={[
                      {
                        key: "title",
                        header: "Request",
                        cell: (row) => (
                          <span>
                            <span className="text-ink block max-w-64 truncate text-[13px] font-medium">
                              {row.title}
                            </span>
                            <span className="text-ink-subtle block text-xs">
                              {humanize(row.category)} · {row.tenant.fullName}
                            </span>
                          </span>
                        ),
                      },
                      {
                        key: "priority",
                        header: "Priority",
                        hideOnMobile: true,
                        cell: (row) => <StatusBadge status={row.priority} />,
                      },
                      { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
                      {
                        key: "created",
                        header: "Raised",
                        align: "right",
                        hideOnMobile: true,
                        cell: (row) => (
                          <span className="text-ink-muted text-xs">{formatDate(row.createdAt)}</span>
                        ),
                      },
                    ]}
                  />
                )}
              </TabPanel>
            )}

            {tab === "inquiries" && (
              <TabPanel
                state={inquiries}
                resource="inquiries"
                isEmpty={(d) => d.results.length === 0}
                empty={<EmptyState icon={<Send className="size-5" />} title="No inquiries" />}
              >
                {(page) => (
                  <ul>
                    {page.results.map((inquiry) => (
                      <li
                        key={inquiry.id}
                        className="border-line flex gap-3 border-b px-5 py-4 last:border-0"
                      >
                        <Avatar name={inquiry.name} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-ink text-[13px] font-medium">{inquiry.name}</p>
                            <StatusBadge status={inquiry.status} />
                          </div>
                          <p className="text-ink-muted mt-1 text-[13px] leading-5">
                            {inquiry.message}
                          </p>
                          <p className="text-ink-subtle mt-1 text-xs">
                            {[inquiry.phone, inquiry.email].filter(Boolean).join(" · ")}
                            {" — "}
                            {formatDateTime(inquiry.createdAt)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </TabPanel>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <MarketplaceCard property={data} onChanged={property.refetch} />

          <Card>
            <CardHeader title="Location" />
            <CardBody>
              <div className="bg-surface-hover border-line relative grid h-32 place-items-center rounded-xl border">
                <MapPin className="text-ink-subtle size-6" />
                {data.latitude && data.longitude && (
                  <span className="text-ink-subtle absolute bottom-2 font-mono text-[11px]">
                    {Number(data.latitude).toFixed(4)}, {Number(data.longitude).toFixed(4)}
                  </span>
                )}
              </div>
              <p className="text-ink-muted mt-3 text-[13px] leading-6">
                {data.street}
                {data.neighborhood && (
                  <>
                    <br />
                    {data.neighborhood}
                  </>
                )}
                <br />
                {[data.city, data.state].filter(Boolean).join(", ")}
                <br />
                {[data.zipCode, data.country].filter(Boolean).join(" · ")}
              </p>
            </CardBody>
          </Card>

          {data.videoUrl && (
            <Card>
              <CardHeader title="Video tour" />
              <CardBody>
                <video
                  src={data.videoUrl}
                  controls
                  className="border-line w-full rounded-xl border"
                />
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function BackLink() {
  return (
    <Link
      href="/properties"
      className="text-ink-muted hover:text-ink focus-ring mb-4 inline-flex items-center gap-1.5 rounded text-[13px]"
    >
      <ArrowLeft className="size-3.5" /> All properties
    </Link>
  );
}

/** Renders the right thing for whichever state a tab's request is in. */
function TabPanel<T>({
  state,
  resource,
  isEmpty,
  empty,
  children,
}: {
  state: QueryState<T>;
  resource: string;
  isEmpty: (data: T) => boolean;
  empty: React.ReactNode;
  children: (data: T) => React.ReactNode;
}) {
  if (state.error) {
    return (
      <CardBody>
        <ErrorState error={state.error} onRetry={state.refetch} resource={resource} />
      </CardBody>
    );
  }
  if (!state.data) return <TableSkeleton rows={4} columns={4} />;
  if (isEmpty(state.data)) return <CardBody>{empty}</CardBody>;
  return <>{children(state.data)}</>;
}

function MarketplaceCard({
  property,
  onChanged,
}: {
  property: ApiPropertyDetail;
  onChanged: () => void;
}) {
  const [listed, setListed] = useState(property.isListedInMarketplace);
  const [failure, setFailure] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  async function toggle(next: boolean) {
    setListed(next); // optimistic
    setBusy(true);
    setFailure(null);
    try {
      const updated = await toggleMarketplaceListing(property.id);
      setListed(updated.isListedInMarketplace);
      onChanged();
    } catch (caught) {
      setListed(!next); // revert
      setFailure(
        caught instanceof ApiError
          ? caught
          : new ApiError(0, "Could not update the marketplace listing"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Marketplace" description="Visibility and unlock economics." />
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-ink flex items-center gap-1.5 text-[13px] font-medium">
              <Store className="size-3.5" /> Listed publicly
            </p>
            <p className="text-ink-subtle text-xs">Costs tenants 2 credits to unlock.</p>
          </div>
          <span className={cn(busy && "pointer-events-none opacity-60")}>
            <Switch checked={listed} onChange={toggle} label="Listed in marketplace" />
          </span>
        </div>

        {failure && <InlineError error={failure} />}

        <DefinitionList
          items={[
            { label: "Views", value: number(property.viewCount) },
            { label: "Photos", value: number(property.images.length) },
            {
              label: "Window",
              value: property.isMarketplaceExpired ? "Expired" : "Open",
            },
            { label: "Locked", value: property.isLocked ? "Yes" : "No" },
          ]}
        />
      </CardBody>
    </Card>
  );
}

function Gallery({ images }: { images: ApiPropertyDetail["images"] }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="bg-surface-hover relative grid h-52 place-items-center rounded-t-[--radius-card]">
        <div className="text-center">
          <ImageIcon className="text-ink-subtle mx-auto size-7" />
          <p className="text-ink-subtle mt-2 text-xs">No photos uploaded</p>
        </div>
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div>
      <div className="bg-surface-hover relative h-52 overflow-hidden rounded-t-[--radius-card]">
        {current.imageUrl ? (
          <Image
            src={current.imageUrl}
            alt={current.caption || "Property photo"}
            fill
            unoptimized
            sizes="(max-width: 1024px) 100vw, 640px"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center">
            <Building2 className="text-ink-subtle size-10" />
          </div>
        )}
        <span className="text-ink-muted bg-surface/85 absolute right-3 bottom-3 flex items-center gap-1.5 rounded-md px-2 py-1 text-xs backdrop-blur-sm">
          <ImageIcon className="size-3.5" /> {active + 1} / {images.length}
        </span>
      </div>

      {images.length > 1 && (
        <div className="border-line flex gap-2 overflow-x-auto border-b px-3 py-2.5">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show photo ${index + 1}`}
              className={cn(
                "focus-ring relative size-12 shrink-0 overflow-hidden rounded-lg border transition-colors",
                index === active ? "border-brand" : "border-line",
              )}
            >
              {image.imageUrl ? (
                <Image
                  src={image.imageUrl}
                  alt=""
                  fill
                  unoptimized
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <span className="bg-surface-hover grid h-full place-items-center">
                  <Building2 className="text-ink-subtle size-4" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <>
      <BackLink />
      <div className="mb-6 space-y-2">
        <Skeleton className="h-6 w-80" />
        <Skeleton className="h-3.5 w-56" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <Skeleton className="h-52 w-full rounded-t-[--radius-card] rounded-b-none" />
            <CardBody>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            </CardBody>
          </Card>
          <Card>
            <TableSkeleton rows={4} columns={4} />
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardSkeleton />
          </Card>
          <Card>
            <CardSkeleton />
          </Card>
        </div>
      </div>
    </>
  );
}

const countOf = <T,>(state: QueryState<T[]>) => state.data?.length;
const pageCount = <T,>(state: QueryState<Paginated<T>>) => state.data?.count;
