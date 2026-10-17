"use client";

import { useState } from "react";
import { ChevronRight, GripVertical, Plus, Sparkles, Tags, Trash2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/table";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { amenities, categories, properties } from "@/lib/mock/data";
import { cn, number } from "@/lib/utils";

export default function TaxonomyPage() {
  const [tab, setTab] = useState("categories");
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [createOpen, setCreateOpen] = useState<"category" | "type" | "amenity" | null>(null);

  const selected = categories.find((c) => c.id === activeCategory)!;
  const types = selected.types ?? [];

  const typeUsage = (typeId: number) =>
    properties.filter((p) => p.propertyType.id === typeId).length;

  return (
    <>
      <PageHeader
        title="Taxonomy"
        description="Property categories, the types inside each, and the amenities a type can offer."
        actions={
          <Button
            variant="primary"
            onClick={() =>
              setCreateOpen(tab === "amenities" ? "amenity" : tab === "types" ? "type" : "category")
            }
          >
            <Plus className="size-4" />
            {tab === "amenities" ? "New amenity" : tab === "types" ? "New type" : "New category"}
          </Button>
        }
      />

      <Card>
        <Tabs
          items={[
            { id: "categories", label: "Categories & types", count: categories.length },
            { id: "amenities", label: "Amenities", count: amenities.length },
          ]}
          value={tab}
          onChange={setTab}
          className="px-3"
        />

        {tab === "categories" ? (
          <div className="grid lg:grid-cols-[18rem_1fr]">
            <ul className="border-line lg:border-r">
              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    type="button"
                    onClick={() => setActiveCategory(category.id)}
                    className={cn(
                      "border-line focus-ring flex w-full items-center gap-3 border-b px-5 py-3.5 text-left transition-colors",
                      activeCategory === category.id
                        ? "bg-brand-soft/60"
                        : "hover:bg-surface-hover",
                    )}
                  >
                    <GripVertical className="text-ink-subtle size-3.5 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="text-ink block truncate text-[13px] font-medium">
                        {category.name}
                      </span>
                      <span className="text-ink-subtle block truncate text-xs">
                        {category.types?.length ?? 0} types · /{category.slug}
                      </span>
                    </span>
                    {!category.isActive && <Badge tone="neutral">Off</Badge>}
                    <ChevronRight className="text-ink-subtle size-3.5 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>

            <div>
              <CardHeader
                title={selected.name}
                description={selected.description}
                action={
                  <>
                    <Badge tone={selected.isActive ? "ok" : "neutral"}>
                      {selected.isActive ? "Active" : "Hidden"}
                    </Badge>
                    <Button size="sm" onClick={() => setCreateOpen("type")}>
                      <Plus className="size-3.5" /> Add type
                    </Button>
                  </>
                }
              />
              {types.length === 0 ? (
                <CardBody>
                  <EmptyState
                    icon={<Tags className="size-5" />}
                    title="No types in this category"
                    description="Types are what landlords pick when creating a property."
                  />
                </CardBody>
              ) : (
                <DataTable
                  rows={types}
                  rowKey={(row) => row.id}
                  pageSize={10}
                  columns={[
                    {
                      key: "name",
                      header: "Type",
                      sortValue: (row) => row.order,
                      cell: (row) => (
                        <span className="flex items-center gap-2.5">
                          <GripVertical className="text-ink-subtle size-3.5" />
                          <span>
                            <span className="text-ink block text-[13px] font-medium">
                              {row.name}
                            </span>
                            <span className="text-ink-subtle block font-mono text-xs">
                              /{row.slug}
                            </span>
                          </span>
                        </span>
                      ),
                    },
                    {
                      key: "usage",
                      header: "Properties",
                      align: "right",
                      sortValue: (row) => typeUsage(row.id),
                      cell: (row) => (
                        <span className="text-ink-muted text-[13px] tabular-nums">
                          {number(typeUsage(row.id))}
                        </span>
                      ),
                    },
                    {
                      key: "amenities",
                      header: "Amenities allowed",
                      align: "right",
                      hideOnMobile: true,
                      cell: (row) => (
                        <span className="text-ink-muted text-[13px] tabular-nums">
                          {amenities.filter((a) => a.applicableTypes?.includes(row.id)).length}
                        </span>
                      ),
                    },
                    {
                      key: "state",
                      header: "State",
                      cell: (row) => (
                        <Badge tone={row.isActive ? "ok" : "neutral"}>
                          {row.isActive ? "Active" : "Hidden"}
                        </Badge>
                      ),
                    },
                    {
                      key: "actions",
                      header: "",
                      align: "right",
                      cell: (row) => (
                        <span className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost">
                            Edit
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Delete ${row.name}`}
                            disabled={typeUsage(row.id) > 0}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </span>
                      ),
                    },
                  ]}
                />
              )}
            </div>
          </div>
        ) : (
          <DataTable
            rows={amenities}
            rowKey={(row) => row.id}
            pageSize={12}
            columns={[
              {
                key: "name",
                header: "Amenity",
                sortValue: (row) => row.order,
                cell: (row) => (
                  <span className="flex items-center gap-2.5">
                    <span className="bg-brand-soft text-brand-ink grid size-8 shrink-0 place-items-center rounded-lg">
                      <Sparkles className="size-4" />
                    </span>
                    <span>
                      <span className="text-ink block text-[13px] font-medium">{row.name}</span>
                      <span className="text-ink-subtle block font-mono text-xs">/{row.slug}</span>
                    </span>
                  </span>
                ),
              },
              {
                key: "types",
                header: "Applies to",
                hideOnMobile: true,
                cell: (row) => {
                  const names = categories
                    .flatMap((c) => c.types ?? [])
                    .filter((t) => row.applicableTypes?.includes(t.id))
                    .map((t) => t.name);
                  return (
                    <span className="flex max-w-80 flex-wrap gap-1">
                      {names.slice(0, 3).map((name) => (
                        <Badge key={name} tone="neutral">
                          {name}
                        </Badge>
                      ))}
                      {names.length > 3 && <Badge tone="neutral">+{names.length - 3}</Badge>}
                    </span>
                  );
                },
              },
              {
                key: "usage",
                header: "Used by",
                align: "right",
                cell: (row) => (
                  <span className="text-ink-muted text-[13px] tabular-nums">
                    {properties.filter((p) => p.amenities?.some((a) => a.id === row.id)).length}
                  </span>
                ),
              },
              {
                key: "state",
                header: "State",
                cell: (row) => (
                  <Badge tone={row.isActive ? "ok" : "neutral"}>
                    {row.isActive ? "Active" : "Hidden"}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "",
                align: "right",
                cell: () => (
                  <Button size="sm" variant="ghost">
                    Edit
                  </Button>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Modal
        open={createOpen != null}
        onClose={() => setCreateOpen(null)}
        size="sm"
        title={
          createOpen === "amenity"
            ? "New amenity"
            : createOpen === "type"
              ? "New property type"
              : "New category"
        }
        description="Slugs are generated from the name and used by the mobile app."
        footer={
          <>
            <Button onClick={() => setCreateOpen(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => setCreateOpen(null)}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {createOpen === "type" && (
            <Field label="Parent category">
              <Select defaultValue={String(activeCategory)}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Name">
            <Input
              placeholder={
                createOpen === "amenity"
                  ? "Swimming pool"
                  : createOpen === "type"
                    ? "Studio apartment"
                    : "Short-stay"
              }
            />
          </Field>
          {createOpen === "category" && (
            <Field label="Description">
              <Textarea placeholder="Short description shown in the app's category picker." />
            </Field>
          )}
          <Field label="Display order" hint="Lower numbers appear first.">
            <Input type="number" defaultValue={10} />
          </Field>
          <TaxonomyActiveToggle />
        </div>
      </Modal>
    </>
  );
}

function TaxonomyActiveToggle() {
  const [on, setOn] = useState(true);
  return (
    <div className="border-line bg-surface-muted flex items-center justify-between rounded-xl border p-4">
      <div>
        <p className="text-ink text-[13px] font-medium">Visible to landlords</p>
        <p className="text-ink-subtle text-xs">Hidden entries stay on existing properties.</p>
      </div>
      <Switch checked={on} onChange={setOn} label="Visible to landlords" />
    </div>
  );
}
