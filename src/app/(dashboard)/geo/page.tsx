"use client";

import { useCallback, useMemo, useState } from "react";
import { MapPin, MapPinned, Plus, Trash2 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, SearchInput, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState, FilterBar, PageHeader, StatCard } from "@/components/ui/misc";
import { ErrorState, InlineError, TableSkeleton } from "@/components/ui/states";
import { RequirePermission } from "@/components/layout/permission-gate";
import { ApiError } from "@/lib/api/client";
import { useApi } from "@/lib/api/hooks";
import { createGeoNode, deleteGeoNode, listAdminGeo } from "@/lib/api/admin";
import type { AdminGeoNode } from "@/lib/api/admin-types";
import { humanize, number } from "@/lib/utils";

type Level = "divisions" | "districts" | "thanas" | "areas";
const singular = { divisions: "division", districts: "district", thanas: "thana", areas: "area" } as const;

export default function GeoPage() {
  return (
    <RequirePermission codes={["geo.manage"]}>
      <Geo />
    </RequirePermission>
  );
}

function Geo() {
  const [level, setLevel] = useState<Level>("divisions");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const feed = useApi(
    useCallback(
      () => listAdminGeo(level, { search: search.trim() || undefined }),
      [level, search],
    ),
  );
  // Divisions double as the parent picker for the create form.
  const divisions = useApi(useCallback(() => listAdminGeo("divisions", { page_size: 100 }), []));

  const rows = useMemo(() => feed.data?.results ?? [], [feed.data]);

  const parentOf = (node: AdminGeoNode) =>
    node.thanaName ?? node.districtName ?? node.divisionName ?? "—";

  const columns: Column<AdminGeoNode>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <span className="flex items-center gap-2.5">
          <span className="bg-surface-hover text-ink-subtle grid size-8 shrink-0 place-items-center rounded-lg">
            <MapPin className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="text-ink block truncate text-[13px] font-medium">{row.name}</span>
            <span className="text-ink-subtle block truncate font-mono text-xs">/{row.slug}</span>
          </span>
        </span>
      ),
    },
    {
      key: "parent",
      header: "Parent",
      hideOnMobile: true,
      cell: (row) => <span className="text-ink-muted text-[13px]">{parentOf(row)}</span>,
    },
    {
      key: "type",
      header: "Type",
      hideOnMobile: true,
      cell: (row) =>
        row.areaType ? <Badge tone="neutral">{humanize(row.areaType)}</Badge> : (
          <span className="text-ink-subtle text-xs">—</span>
        ),
    },
    {
      key: "coords",
      header: "Coordinates",
      align: "right",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-ink-subtle font-mono text-xs">
          {row.latitude && row.longitude
            ? `${Number(row.latitude).toFixed(3)}, ${Number(row.longitude).toFixed(3)}`
            : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (row) => (
        <Button
          size="icon"
          variant="ghost"
          aria-label={`Delete ${row.name}`}
          onClick={async () => {
            try {
              await deleteGeoNode(singular[level], row.id);
              feed.refetch();
            } catch {
              /* the 409 explains itself in the list once refetched */
            }
          }}
        >
          <Trash2 className="size-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Locations"
        description="The Bangladesh administrative hierarchy used for addresses and search."
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> Add location
          </Button>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Divisions"
          value={number(divisions.data?.count ?? 0)}
          icon={<MapPinned className="size-4" />}
        />
        <StatCard
          label={`${humanize(level)} loaded`}
          value={number(feed.data?.count ?? 0)}
          hint="matching the filter"
        />
        <StatCard label="On this page" value={number(rows.length)} />
        <StatCard
          label="With coordinates"
          value={number(rows.filter((r) => r.latitude && r.longitude).length)}
        />
      </div>

      <Card>
        <Tabs
          items={(["divisions", "districts", "thanas", "areas"] as Level[]).map((id) => ({
            id,
            label: humanize(id),
          }))}
          value={level}
          onChange={(id) => setLevel(id as Level)}
          className="px-3"
        />
        <FilterBar>
          <SearchInput
            placeholder="Search by name or slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80"
          />
          <span className="text-ink-subtle ml-auto text-[13px]">
            {number(feed.data?.count ?? 0)} total
          </span>
        </FilterBar>

        {feed.error ? (
          <CardBody>
            <ErrorState error={feed.error} onRetry={feed.refetch} resource="locations" />
          </CardBody>
        ) : feed.loading && !feed.data ? (
          <TableSkeleton rows={8} columns={4} />
        ) : rows.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<MapPinned className="size-5" />}
              title="No locations match"
              description="Try a different name or switch level."
            />
          </CardBody>
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} pageSize={15} />
        )}
      </Card>

      <p className="text-ink-subtle mt-4 text-center text-xs">
        Deleting a node removes everything under it, and is refused while any property or provider
        still references it.
      </p>

      <CreateLocationModal
        open={createOpen}
        level={level}
        divisions={divisions.data?.results ?? []}
        onClose={() => setCreateOpen(false)}
        onDone={feed.refetch}
      />
    </>
  );
}

function CreateLocationModal({
  open,
  level,
  divisions,
  onClose,
  onDone,
}: {
  open: boolean;
  level: Level;
  divisions: AdminGeoNode[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [target, setTarget] = useState<Level>(level);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiError | null>(null);

  // Districts hang off divisions; deeper levels need their own parent list.
  const parents = useApi(
    useCallback(() => {
      if (target === "districts") return Promise.resolve({ results: divisions } as never);
      if (target === "thanas") return listAdminGeo("districts", { page_size: 100 });
      if (target === "areas") return listAdminGeo("thanas", { page_size: 100 });
      return Promise.resolve({ results: [] } as never);
    }, [target, divisions]),
  );

  const parentField = { districts: "divisionId", thanas: "districtId", areas: "thanaId" } as const;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Add a location"
      description="New nodes slot into the existing division → district → thana → area chain."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={busy || !name.trim() || (target !== "divisions" && !parentId)}
            onClick={async () => {
              setBusy(true);
              setFailure(null);
              try {
                await createGeoNode(target, {
                  name,
                  ...(target === "divisions"
                    ? {}
                    : { [parentField[target as keyof typeof parentField]]: Number(parentId) }),
                  ...(latitude ? { latitude } : {}),
                  ...(longitude ? { longitude } : {}),
                });
                onDone();
                onClose();
                setName("");
              } catch (caught) {
                setFailure(caught instanceof ApiError ? caught : new ApiError(0, "Could not create"));
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Adding…" : "Add location"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {failure && <InlineError error={failure} />}
        <Field label="Level">
          <Select value={target} onChange={(e) => setTarget(e.target.value as Level)}>
            <option value="divisions">Division</option>
            <option value="districts">District</option>
            <option value="thanas">Thana</option>
            <option value="areas">Area</option>
          </Select>
        </Field>
        {target !== "divisions" && (
          <Field label="Parent" hint="Required for anything below a division.">
            <Select value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">Select a parent…</option>
              {((parents.data as { results?: AdminGeoNode[] } | null)?.results ?? []).map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Banasree" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Latitude">
            <Input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="23.7651" />
          </Field>
          <Field label="Longitude">
            <Input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="90.4260" />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
