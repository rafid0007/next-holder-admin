"use client";

import { useMemo, useState } from "react";
import { Building2, MapPin, MapPinned, Plus, Search } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, SearchInput, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState, FilterBar, PageHeader, Progress, StatCard } from "@/components/ui/misc";
import { geoAreas, geoDistricts, geoRows, geoThanas, properties } from "@/lib/mock/data";
import type { GeoRow } from "@/lib/api/types";
import { humanize, number } from "@/lib/utils";

const levels = {
  division: geoRows,
  district: geoDistricts,
  thana: geoThanas,
  area: geoAreas,
} as const;

export default function GeoPage() {
  const [tab, setTab] = useState<keyof typeof levels>("division");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return levels[tab].filter(
      (row) => !q || `${row.name} ${row.parent ?? ""}`.toLowerCase().includes(q),
    );
  }, [tab, query]);

  const covered = geoRows.filter((d) => (d.propertiesCount ?? 0) > 0).length;

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
          value={String(geoRows.length)}
          hint={`${covered} with listings`}
          icon={<MapPinned className="size-4" />}
        />
        <StatCard label="Districts" value={String(geoDistricts.length)} hint="loaded in reference data" />
        <StatCard label="Thanas" value={String(geoThanas.length)} />
        <StatCard
          label="Mapped properties"
          value={`${Math.round((properties.filter((p) => p.holding?.division).length / properties.length) * 100)}%`}
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
            {[...geoRows]
              .sort((a, b) => (b.propertiesCount ?? 0) - (a.propertiesCount ?? 0))
              .map((division) => (
                <div key={division.id}>
                  <div className="mb-1 flex items-baseline justify-between text-[13px]">
                    <span className="text-ink font-medium">{division.name}</span>
                    <span className="text-ink-muted tabular-nums">
                      {number(division.propertiesCount)} listings ·{" "}
                      {number(division.childrenCount)} districts
                    </span>
                  </div>
                  <Progress
                    value={division.propertiesCount ?? 0}
                    max={Math.max(...geoRows.map((d) => d.propertiesCount ?? 0))}
                    tone={(division.propertiesCount ?? 0) > 0 ? "brand" : "warn"}
                  />
                </div>
              ))}
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
          items={(Object.keys(levels) as (keyof typeof levels)[]).map((level) => ({
            id: level,
            label: `${humanize(level)}s`,
            count: levels[level].length,
          }))}
          value={tab}
          onChange={(id) => setTab(id as keyof typeof levels)}
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

        {rows.length === 0 ? (
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
                key: "children",
                header: "Children",
                align: "right",
                hideOnMobile: true,
                sortValue: (row) => row.childrenCount ?? 0,
                cell: (row) => (
                  <span className="text-ink-muted text-[13px] tabular-nums">
                    {row.childrenCount != null ? number(row.childrenCount) : "—"}
                  </span>
                ),
              },
              {
                key: "properties",
                header: "Listings",
                align: "right",
                sortValue: (row) => row.propertiesCount ?? 0,
                cell: (row) => (
                  <span className="text-ink flex items-center justify-end gap-1 text-[13px] tabular-nums">
                    <Building2 className="text-ink-subtle size-3.5" />
                    {number(row.propertiesCount ?? 0)}
                  </span>
                ),
              },
              {
                key: "state",
                header: "State",
                cell: (row) => (
                  <Badge tone={(row.propertiesCount ?? 0) > 0 ? "ok" : "neutral"}>
                    {(row.propertiesCount ?? 0) > 0 ? "In use" : "No listings"}
                  </Badge>
                ),
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
              {geoRows.map((division) => (
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
