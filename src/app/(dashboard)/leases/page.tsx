"use client";

import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, FileText, FileUp, Plus, XCircle } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, SearchInput, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import {
  DefinitionList, EmptyState, FilterBar, PageHeader, StatCard, UserCell,
} from "@/components/ui/misc";
import { CardSkeleton, ErrorState, TableSkeleton } from "@/components/ui/states";
import { useApi } from "@/lib/api/hooks";
import { activateLease, listAllProperties, listLeases, terminateLease } from "@/lib/api/resources";
import type { ApiLeaseListItem } from "@/lib/api/types";
import { formatDate, money } from "@/lib/utils";

const DAY = 86_400_000;

export default function LeasesPage() {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  // Scoped to the signed-in landlord; status and search are filtered here
  // because the endpoint takes only holdingId, propertyId and sortBy.
  const feed = useApi(
    useCallback(async () => ({ page: await listLeases(), fetchedAt: Date.now() }), []),
  );
  const leases: ApiLeaseListItem[] = useMemo(
    () => feed.data?.page.results ?? [],
    [feed.data],
  );
  const properties = useApi(useCallback(() => listAllProperties(), []));

  const tabs = useMemo(
    () =>
      [
        { id: "all", label: "All" },
        { id: "pending", label: "Pending" },
        { id: "active", label: "Active" },
        { id: "expired", label: "Expired" },
        { id: "terminated", label: "Terminated" },
      ].map((t) => ({
        ...t,
        count: t.id === "all" ? leases.length : leases.filter((l) => l.status === t.id).length,
      })),
    [leases],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leases.filter((lease) => {
      if (tab !== "all" && lease.status !== tab) return false;
      if (
        q &&
        !`${lease.propertyTitle} ${lease.tenant.fullName} ${lease.landlord.fullName}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });
  }, [leases, tab, query]);

  const activeValue = leases
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + Number(l.rentAmount), 0);

  const expiringSoon = leases.filter(
    (l) =>
      l.status === "active" &&
      new Date(l.endDate).getTime() - (feed.data?.fetchedAt ?? 0) < 90 * DAY,
  );

  const columns: Column<ApiLeaseListItem>[] = [
    {
      key: "property",
      header: "Property",
      sortValue: (row) => row.propertyTitle,
      cell: (row) => (
        <span className="block max-w-56">
          <span className="text-ink block truncate text-[13px] font-medium">
            {row.propertyTitle}
          </span>
          <span className="text-ink-subtle block truncate text-xs">
            {row.propertyCity}
            {row.holdingNumber && ` · ${row.holdingNumber}`}
          </span>
        </span>
      ),
    },
    {
      key: "tenant",
      header: "Tenant",
      sortValue: (row) => row.tenant.fullName,
      cell: (row) => <UserCell name={row.tenant.fullName} meta={row.tenant.email} />,
    },
    {
      key: "landlord",
      header: "Landlord",
      hideOnMobile: true,
      cell: (row) => <span className="text-ink-muted text-[13px]">{row.landlord.fullName}</span>,
    },
    {
      key: "term",
      header: "Term",
      hideOnMobile: true,
      sortValue: (row) => row.startDate,
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
      sortValue: (row) => Number(row.rentAmount),
      cell: (row) => (
        <span className="text-ink text-[13px] font-medium tabular-nums">
          {money(row.rentAmount)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => row.status,
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Leases"
        description="Long-term tenancies from draft through activation, expiry and termination."
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> New lease
          </Button>
        }
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
        <StatCard label="Active leases" value={String(leases.filter((l) => l.status === "active").length)} />
        <StatCard label="Monthly contracted rent" value={money(activeValue)} hint="active leases only" />
        <StatCard label="Awaiting signature" value={String(leases.filter((l) => l.status === "pending").length)} hint="tenant action needed" />
        <StatCard label="Expiring in 90 days" value={String(expiringSoon.length)} hint="plan renewals" />
          </>
        )}
      </div>

      <Card>
        <Tabs items={tabs} value={tab} onChange={setTab} className="px-3" />
        <FilterBar>
          <SearchInput
            placeholder="Search property, tenant or landlord…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-80"
          />
          <Select aria-label="Sort" className="ml-auto w-auto">
            <option>Newest first</option>
            <option>Ending soonest</option>
            <option>Highest rent</option>
          </Select>
        </FilterBar>

        {feed.error ? (
          <CardBody>
            <ErrorState error={feed.error} onRetry={feed.refetch} resource="leases" />
          </CardBody>
        ) : feed.loading && !feed.data ? (
          <TableSkeleton rows={6} columns={5} />
        ) : rows.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<FileText className="size-5" />}
              title="No leases here"
              description="Nothing matches the current tab and search."
            />
          </CardBody>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            pageSize={10}
            expandedContent={(lease) => (
              <LeaseActions lease={lease} onChanged={feed.refetch} />
            )}
          />
        )}
      </Card>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a lease"
        description="The landlord initiates; the tenant activates after reviewing the terms."
        footer={
          <>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setCreateOpen(false)}>
              Send to tenant
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Property">
            <Select>
              {(properties.data ?? [])
                .filter((p) => p.listingType === "for_rent")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
            </Select>
          </Field>
          <Field
            label="Tenant email or phone"
            hint="Provisional tenants can be created from the Users page."
          >
            <Input placeholder="tenant@example.com" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start date">
              <Input type="date" />
            </Field>
            <Field label="End date">
              <Input type="date" />
            </Field>
            <Field label="Monthly rent (৳)">
              <Input type="number" placeholder="48000" />
            </Field>
            <Field label="Security deposit (৳)">
              <Input type="number" placeholder="96000" />
            </Field>
          </div>
          <Field label="Terms and conditions">
            <Textarea placeholder="Payment schedule, notice period, utility responsibilities…" />
          </Field>
        </div>
      </Modal>
    </>
  );
}

function LeaseActions({
  lease,
  onChanged,
}: {
  lease: ApiLeaseListItem;
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
            { label: "Lease ID", value: `#${lease.id}` },
            { label: "Created", value: formatDate(lease.createdAt) },
            { label: "Security deposit", value: money(lease.depositAmount) },
            { label: "Holding", value: lease.holdingNumber ?? "—" },
            { label: "Start date", value: formatDate(lease.startDate) },
            { label: "End date", value: formatDate(lease.endDate) },
            { label: "Tenant email", value: lease.tenant.email },
            { label: "Landlord", value: lease.landlord.fullName },
          ]}
        />
      </div>
      <div className="flex flex-col gap-2">
        {lease.status === "pending" && (
          <Button variant="primary" disabled={busy} onClick={() => run(() => activateLease(lease.id))}>
            <CheckCircle2 className="size-4" /> Activate lease
          </Button>
        )}
        <Button disabled={busy}>
          <FileUp className="size-4" /> Upload contract
        </Button>
        {lease.status === "active" && (
          <Button
            variant="danger"
            disabled={busy}
            onClick={() => run(() => terminateLease(lease.id, "Terminated from the admin console."))}
          >
            <XCircle className="size-4" /> Terminate
          </Button>
        )}
      </div>
    </div>
  );
}
