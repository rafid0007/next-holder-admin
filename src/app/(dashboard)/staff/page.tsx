"use client";

import { useCallback, useMemo, useState } from "react";
import { Plus, ShieldCheck, Trash2, UserCog } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, SearchInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { Avatar, EmptyState, FilterBar, PageHeader, StatCard } from "@/components/ui/misc";
import { ErrorState, InlineError, TableSkeleton } from "@/components/ui/states";
import { RequirePermission } from "@/components/layout/permission-gate";
import { ApiError } from "@/lib/api/client";
import { useApi } from "@/lib/api/hooks";
import { useAdminSession } from "@/lib/api/admin-session";
import {
  createRole, deleteRole, listPermissionCatalog, listRoles, listStaff, setStaffRoles, updateRole,
} from "@/lib/api/admin";
import type { PermissionCode, StaffMember, StaffRole } from "@/lib/api/admin-types";
import { cn, number, relativeTime } from "@/lib/utils";

export default function StaffPage() {
  return (
    <RequirePermission codes={["staff.view"]}>
      <Staff />
    </RequirePermission>
  );
}

function Staff() {
  const { can } = useAdminSession();
  const [tab, setTab] = useState("people");
  const [search, setSearch] = useState("");
  const [editingRole, setEditingRole] = useState<StaffRole | "new" | null>(null);
  const [assigning, setAssigning] = useState<StaffMember | null>(null);

  const people = useApi(
    useCallback(() => listStaff({ search: search.trim() || undefined }), [search]),
  );
  const roles = useApi(useCallback(() => listRoles(), []));

  const staff = useMemo(() => people.data?.results ?? [], [people.data]);
  const roleList = useMemo(() => roles.data ?? [], [roles.data]);

  const staffColumns: Column<StaffMember>[] = [
    {
      key: "name",
      header: "Member",
      cell: (row) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={row.fullName} />
          <span className="min-w-0">
            <span className="text-ink flex items-center gap-1.5 text-[13px] font-medium">
              <span className="truncate">{row.fullName}</span>
              {row.isSuperuser && <ShieldCheck className="text-brand size-3.5 shrink-0" />}
            </span>
            <span className="text-ink-subtle block truncate text-xs">{row.email}</span>
          </span>
        </span>
      ),
    },
    {
      key: "roles",
      header: "Roles",
      cell: (row) => (
        <span className="flex flex-wrap gap-1">
          {row.isSuperuser && <Badge tone="brand">Superuser</Badge>}
          {row.roles.map((role) => (
            <Badge key={role.id} tone="neutral">
              {role.name}
            </Badge>
          ))}
          {!row.isSuperuser && row.roles.length === 0 && (
            <span className="text-ink-subtle text-xs">No roles</span>
          )}
        </span>
      ),
    },
    {
      key: "lastLogin",
      header: "Last seen",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-ink-muted text-xs">
          {row.lastLogin ? relativeTime(row.lastLogin) : "Never"}
        </span>
      ),
    },
    {
      key: "state",
      header: "State",
      cell: (row) => (
        <Badge tone={row.isActive ? "ok" : "bad"}>{row.isActive ? "Active" : "Disabled"}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (row) =>
        can("staff.manage") ? (
          <Button size="sm" variant="ghost" onClick={() => setAssigning(row)}>
            <UserCog className="size-3.5" /> Roles
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Staff & roles"
        description="Who can reach the admin console, and what each role is allowed to do."
        actions={
          can("staff.manage") && (
            <Button variant="primary" onClick={() => setEditingRole("new")}>
              <Plus className="size-4" /> New role
            </Button>
          )
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Staff members" value={number(people.data?.count ?? 0)} icon={<ShieldCheck className="size-4" />} />
        <StatCard label="Roles" value={number(roleList.length)} />
        <StatCard
          label="Superusers"
          value={number(staff.filter((s) => s.isSuperuser).length)}
          hint="hold every permission"
        />
        <StatCard
          label="Custom roles"
          value={number(roleList.filter((r) => !r.isSystem).length)}
          hint={`${number(roleList.filter((r) => r.isSystem).length)} system`}
        />
      </div>

      <Card>
        <Tabs
          items={[
            { id: "people", label: "Staff", count: people.data?.count },
            { id: "roles", label: "Roles", count: roleList.length },
          ]}
          value={tab}
          onChange={setTab}
          className="px-3"
        />

        {tab === "people" ? (
          <>
            <FilterBar>
              <SearchInput
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-80"
              />
            </FilterBar>
            {people.error ? (
              <CardBody>
                <ErrorState error={people.error} onRetry={people.refetch} resource="staff" />
              </CardBody>
            ) : people.loading && !people.data ? (
              <TableSkeleton rows={4} columns={4} />
            ) : staff.length === 0 ? (
              <CardBody>
                <EmptyState
                  icon={<ShieldCheck className="size-5" />}
                  title="No staff match"
                  description="Grant a role to any existing user to make them staff."
                />
              </CardBody>
            ) : (
              <DataTable columns={staffColumns} rows={staff} rowKey={(row) => row.id} pageSize={10} />
            )}
          </>
        ) : roles.error ? (
          <CardBody>
            <ErrorState error={roles.error} onRetry={roles.refetch} resource="roles" />
          </CardBody>
        ) : roles.loading && !roles.data ? (
          <TableSkeleton rows={4} columns={3} />
        ) : (
          <ul>
            {roleList.map((role) => (
              <li
                key={role.id}
                className="border-line flex items-start gap-4 border-b px-5 py-4 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-ink text-[13px] font-medium">{role.name}</p>
                    {role.isSystem && <Badge tone="neutral">System</Badge>}
                    <Badge tone="brand">{role.memberCount} member{role.memberCount === 1 ? "" : "s"}</Badge>
                  </div>
                  {role.description && (
                    <p className="text-ink-muted mt-1 text-xs">{role.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {role.permissions.slice(0, 8).map((code) => (
                      <span
                        key={code}
                        className="bg-surface-hover text-ink-muted rounded px-1.5 py-0.5 font-mono text-[11px]"
                      >
                        {code}
                      </span>
                    ))}
                    {role.permissions.length > 8 && (
                      <span className="text-ink-subtle text-[11px]">
                        +{role.permissions.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
                {can("staff.manage") && !role.isSystem && (
                  <div className="flex shrink-0 gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => setEditingRole(role)}>
                      Edit
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Delete ${role.name}`}
                      disabled={role.memberCount > 0}
                      onClick={async () => {
                        await deleteRole(role.id);
                        roles.refetch();
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <RoleModal
        role={editingRole}
        onClose={() => setEditingRole(null)}
        onDone={() => {
          roles.refetch();
          people.refetch();
        }}
      />
      <AssignRolesModal
        member={assigning}
        roles={roleList}
        onClose={() => setAssigning(null)}
        onDone={people.refetch}
      />
    </>
  );
}

function RoleModal({
  role,
  onClose,
  onDone,
}: {
  role: StaffRole | "new" | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const existing = role && role !== "new" ? role : null;
  const catalog = useApi(useCallback(() => listPermissionCatalog(), []));
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [picked, setPicked] = useState<PermissionCode[]>([]);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiError | null>(null);
  const [seeded, setSeeded] = useState<number | "new" | null>(null);

  // Seed the form the first time a given role opens, without an effect.
  const key = existing ? existing.id : role === "new" ? "new" : null;
  if (role && key !== seeded) {
    setSeeded(key);
    setName(existing?.name ?? "");
    setDescription(existing?.description ?? "");
    setPicked(existing?.permissions ?? []);
    setFailure(null);
  }

  const entries = catalog.data;
  const groups = useMemo(() => {
    const byGroup = new Map<string, typeof entries>();
    for (const entry of entries ?? []) {
      const list = byGroup.get(entry.group) ?? [];
      list.push(entry);
      byGroup.set(entry.group, list);
    }
    return [...byGroup.entries()];
  }, [entries]);

  const toggle = (code: PermissionCode) =>
    setPicked((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));

  return (
    <Modal
      open={role != null}
      onClose={onClose}
      size="lg"
      title={existing ? `Edit ${existing.name}` : "New role"}
      description="A role is a named set of permissions. You can only grant codes you hold yourself."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={busy || !name.trim() || picked.length === 0}
            onClick={async () => {
              setBusy(true);
              setFailure(null);
              try {
                if (existing) {
                  await updateRole(existing.id, { name, description, permissions: picked });
                } else {
                  await createRole({ name, description, permissions: picked });
                }
                onDone();
                onClose();
              } catch (caught) {
                setFailure(
                  caught instanceof ApiError ? caught : new ApiError(0, "Could not save the role"),
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Saving…" : existing ? "Save role" : "Create role"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {failure && <InlineError error={failure} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Content editor" />
          </Field>
          <Field label="Description">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Edits taxonomy"
            />
          </Field>
        </div>

        <div>
          <p className="text-ink mb-2 text-[13px] font-medium">
            Permissions ({picked.length} selected)
          </p>
          <div className="space-y-4">
            {groups.map(([group, entries]) => (
              <div key={group}>
                <p className="text-ink-subtle mb-1.5 text-xs font-semibold tracking-wider uppercase">
                  {group}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(entries ?? []).map((entry) => {
                    const on = picked.includes(entry.code);
                    return (
                      <button
                        key={entry.code}
                        type="button"
                        title={entry.label}
                        onClick={() => toggle(entry.code)}
                        className={cn(
                          "focus-ring rounded-lg border px-2.5 py-1 font-mono text-[11px] transition-colors",
                          on
                            ? "bg-brand-soft border-brand/30 text-brand-ink"
                            : "border-line-strong text-ink-muted hover:bg-surface-hover",
                        )}
                      >
                        {entry.code}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {catalog.loading && <p className="text-ink-subtle text-[13px]">Loading the catalog…</p>}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function AssignRolesModal({
  member,
  roles,
  onClose,
  onDone,
}: {
  member: StaffMember | null;
  roles: StaffRole[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [picked, setPicked] = useState<number[]>([]);
  const [seeded, setSeeded] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiError | null>(null);

  if (member && member.id !== seeded) {
    setSeeded(member.id);
    setPicked(member.roles.map((r) => r.id));
    setFailure(null);
  }

  const toggle = (id: number) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));

  return (
    <Modal
      open={member != null}
      onClose={onClose}
      size="sm"
      title={member ? `Roles for ${member.fullName}` : ""}
      description="Removing every role revokes admin access entirely."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant={picked.length === 0 ? "danger" : "primary"}
            disabled={busy}
            onClick={async () => {
              if (!member) return;
              setBusy(true);
              setFailure(null);
              try {
                await setStaffRoles(member.id, picked);
                onDone();
                onClose();
              } catch (caught) {
                setFailure(
                  caught instanceof ApiError ? caught : new ApiError(0, "Could not set roles"),
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Saving…" : picked.length === 0 ? "Revoke admin access" : "Save roles"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {failure && <InlineError error={failure} />}
        {roles.map((role) => (
          <label
            key={role.id}
            className="border-line bg-surface-muted flex items-start gap-3 rounded-xl border p-3 text-[13px]"
          >
            <input
              type="checkbox"
              checked={picked.includes(role.id)}
              onChange={() => toggle(role.id)}
              className="accent-brand mt-0.5 size-4"
            />
            <span className="min-w-0">
              <span className="text-ink block font-medium">{role.name}</span>
              <span className="text-ink-subtle block text-xs">
                {role.description || `${role.permissions.length} permissions`}
              </span>
            </span>
          </label>
        ))}
      </div>
    </Modal>
  );
}
