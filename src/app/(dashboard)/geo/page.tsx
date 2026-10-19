"use client";

import { useCallback, useMemo, useState } from "react";
import { Building2, MapPin, MapPinned, Plus, Search } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, SearchInput, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState, FilterBar, PageHeader, Progress, StatCard } from "@/components/ui/misc";
import { useApi, useApiWhen } from "@/lib/api/hooks";
import { listAllProperties, listAreas, listDistricts, listDivisions, listThanas } from "@/lib/api/resources";
import { CardSkeleton, ErrorState, TableSkeleton } from "@/components/ui/states";
import type { ApiArea, ApiDistrict, ApiDivision, ApiThana } from "@/lib/api/types";

/** One row shape for all four levels, so a single table renders any of them. */
interface GeoRow {
  id: number;
  name: string;
  parent?: string;
  level: "division" | "district" | "thana" | "area";
}
import { humanize, number } from "@/lib/utils";

type Level = "division" | "district" | "thana" | "area";

export default function GeoPage() {
  const [tab, setTab] = useState<Level>("division");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  // Divisions drive the coverage panel, so they always load. The deeper levels
  // are unfiltered full lists — areas alone run to tens of thousands of rows —
  // so each only loads when its tab is opened.
  const divisions = useApi(useCallback(() => listDivisions(), []));
  const districts = useApiWhen(tab === "district", useCallback(() => listDistricts(), []));
  const thanas = useApiWhen(tab === "thana", useCallback(() => listThanas(), []));
  const areas = useApiWhen(tab === "area", useCallback(() => listAreas(), []));
  const portfolio = useApi(useCallback(() => listAllProperties(), []));

  const active =
    tab === "division" ? divisions : tab === "district" ? districts : tab === "thana" ? thanas : areas;

  const rows = useMemo<GeoRow[]>(() => {
    const q = query.trim().toLowerCase();
    const mapped: GeoRow[] =
      tab === "division"
        ? ((divisions.data as ApiDivision[] | null) ?? []).map((d) => ({
            id: d.id,
            name: d.name,
            level: "division" as const,
          }))
        : tab === "district"
          ? ((districts.data as ApiDistrict[] | null) ?? []).map((d) => ({
              id: d.id,
              name: d.name,
              parent: d.divisionName,
              level: "district" as const,
            }))
          : tab === "thana"
            ? ((thanas.data as ApiThana[] | null) ?? []).map((t) => ({
                id: t.id,
                name: t.name,
                parent: t.districtName,
                level: "thana" as const,
              }))
            : ((areas.data as ApiArea[] | null) ?? []).map((a) => ({
                id: a.id,
                name: a.name,
                parent: a.thanaName,
                level: "area" as const,
              }));
    return mapped.filter((row) => !q || `${row.name} ${row.parent ?? ""}`.toLowerCase().includes(q));
  }, [tab, query, divisions.data, districts.data, thanas.data, areas.data]);

  /** Listings per division, counted from the landlord's own portfolio. */
  const byDivision = useMemo(() => {
    const counts = new Map<string, number>();
    for (const property of portfolio.data ?? []) {
      const name = property.division?.name;
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return counts;
  }, [portfolio.data]);

  const divisionRows = divisions.data ?? [];
  const covered = divisionRows.filter((d) => (byDivision.get(d.name) ?? 0) > 0).length;

  return (
    <>
      <PageHeader
        title="Locations"
        description="The Bangladesh administrative hierarchy — division, district, thana and area — used for addresses and search."
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> Add location
          </Button>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Divisions"
          value={String(divisionRows.length)}
          hint={`${covered} with listings`}
          icon={<MapPinned className="size-4" />}
        />
        <StatCard
          label="Districts"
          value={districts.data ? String(districts.data.length) : "—"}
          hint={districts.data ? "loaded" : "open the tab to load"}
        />
        <StatCard
          label="Thanas"
          value={thanas.data ? String(thanas.data.length) : "—"}
          hint={thanas.data ? "loaded" : "open the tab to load"}
        />
        <StatCard
          label="Mapped properties"
          value={
            (portfolio.data ?? []).length
              ? `${Math.round(
                  ((portfolio.data ?? []).filter((p) => p.division).length /
                    (portfolio.data ?? []).length) *
                    100,
                )}%`
              : "—"
          }
          hint="have a full address chain"
        />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Coverage by division"
            description="Where the platform's listings actually are."
          />
          <CardBody className="space-y-3.5">
            {divisions.loading && !divisions.data ? (
              <CardSkeleton className="p-0" />
            ) : (
              [...divisionRows]
                .sort((a, b) => (byDivision.get(b.name) ?? 0) - (byDivision.get(a.name) ?? 0))
                .map((division) => {
                  const count = byDivision.get(division.name) ?? 0;
                  const peak = Math.max(1, ...divisionRows.map((d) => byDivision.get(d.name) ?? 0));
                  return (
                    <div key={division.id}>
                      <div className="mb-1 flex items-baseline justify-between text-[13px]">
                        <span className="text-ink font-medium">{division.name}</span>
                        <span className="text-ink-muted tabular-nums">
                          {number(count)} listings
                        </span>
                      </div>
                      <Progress value={count} max={peak} tone={count > 0 ? "brand" : "warn"} />
                    </div>
                  );
                })
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Reverse lookup"
            description="Resolve coordinates to the administrative chain."
          />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Latitude">
                <Input placeholder="23.7925" />
              </Field>
              <Field label="Longitude">
                <Input placeholder="90.4078" />
              </Field>
            </div>
            <Button className="w-full justify-center">
              <Search className="size-4" /> Resolve location
            </Button>
            <div className="border-line bg-surface-muted space-y-2 rounded-xl border p-3.5">
              <p className="text-ink-subtle text-xs">Last result</p>
              {["Dhaka", "Dhaka", "Gulshan", "Gulshan 2"].map((name, index) => (
                <div key={index} className="flex items-center gap-2 text-[13px]">
                  <MapPin className="text-ink-subtle size-3.5" />
                  <span className="text-ink-subtle w-16 text-xs">
                    {["Division", "District", "Thana", "Area"][index]}
                  </span>
                  <span className="text-ink font-medium">{name}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <Tabs
          items={(["division", "district", "thana", "area"] as Level[]).map((level) => ({
            id: level,
            label: `${humanize(level)}s`,
          }))}
          value={tab}
          onChange={(id) => setTab(id as Level)}
          className="px-3"
        />
        <FilterBar>
          <SearchInput
            placeholder="Search by name or parent…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-80"
          />
        </FilterBar>

        {active.error ? (
          <CardBody>
            <ErrorState error={active.error} onRetry={active.refetch} resource="locations" />
          </CardBody>
        ) : active.loading && !active.data ? (
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
          <DataTable
            rows={rows}
            rowKey={(row: GeoRow) => row.id}
            pageSize={10}
            columns={[
              {
                key: "name",
                header: "Name",
                sortValue: (row) => row.name,
                cell: (row) => (
                  <span className="flex items-center gap-2.5">
                    <span className="bg-surface-hover text-ink-subtle grid size-8 shrink-0 place-items-center rounded-lg">
                      <MapPin className="size-4" />
                    </span>
                    <span>
                      <span className="text-ink block text-[13px] font-medium">{row.name}</span>
                      <span className="text-ink-subtle block text-xs">{humanize(row.level)}</span>
                    </span>
                  </span>
                ),
              },
              {
                key: "parent",
                header: "Parent",
                hideOnMobile: true,
                cell: (row) => (
                  <span className="text-ink-muted text-[13px]">{row.parent ?? "—"}</span>
                ),
              },
              {
                key: "properties",
                header: "In portfolio",
                align: "right",
                cell: (row) => {
                  const count = (portfolio.data ?? []).filter(
                    (p) =>
                      p.division?.name === row.name ||
                      p.district?.name === row.name ||
                      p.thana?.name === row.name ||
                      p.area?.name === row.name,
                  ).length;
                  return (
                    <span className="text-ink flex items-center justify-end gap-1 text-[13px] tabular-nums">
                      <Building2 className="text-ink-subtle size-3.5" />
                      {number(count)}
                    </span>
                  );
                },
              },
            ]}
          />
        )}
      </Card>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        size="sm"
        title="Add a location"
        description="New nodes slot into the existing division → district → thana → area chain."
        footer={
          <>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setCreateOpen(false)}>
              Add location
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Level">
            <Select defaultValue={tab}>
              <option value="division">Division</option>
              <option value="district">District</option>
              <option value="thana">Thana</option>
              <option value="area">Area</option>
            </Select>
          </Field>
          <Field label="Parent" hint="Leave blank only for a division.">
            <Select>
              {divisionRows.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Name">
            <Input placeholder="Banasree" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Latitude">
              <Input placeholder="23.7651" />
            </Field>
            <Field label="Longitude">
              <Input placeholder="90.4260" />
            </Field>
          </div>
        </div>
      </Modal>
    </>
  );
}
