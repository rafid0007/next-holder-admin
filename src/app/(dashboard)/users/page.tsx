"use client";

import { useCallback, useMemo, useState } from "react";
import {
  BadgeCheck, ShieldCheck, ShieldOff, UserCog, Users as UsersIcon,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, SearchInput, Select, Textarea } from "@/components/ui/field";
import { Drawer, Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import {
  Avatar, DefinitionList, EmptyState, FilterBar, PageHeader, StatCard,
} from "@/components/ui/misc";
import { CardSkeleton, ErrorState, InlineError, TableSkeleton } from "@/components/ui/states";
import { RequirePermission } from "@/components/layout/permission-gate";
import { ApiError } from "@/lib/api/client";
import { useApi, useApiWhen } from "@/lib/api/hooks";
import { useAdminSession } from "@/lib/api/admin-session";
import {
  getAdminUser, getDashboardStats, getUserActivity, listAdminUsers, reactivateUser,
  setUserRoles, suspendUser, unverifyUser, verifyUser,
} from "@/lib/api/admin";
import type { AdminUser, AdminUserDetail } from "@/lib/api/admin-types";
import { formatDate, formatDateTime, humanize, number, relativeTime } from "@/lib/utils";

const roleTone = { landlord: "brand", tenant: "info", service_provider: "ok" } as const;

export default function UsersPage() {
  return (
    <RequirePermission codes={["users.view"]}>
      <Users />
    </RequirePermission>
  );
}

function Users() {
  const { can } = useAdminSession();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [state, setState] = useState("all");
  const [ordering, setOrdering] = useState("-createdAt");
  const [openId, setOpenId] = useState<number | null>(null);

  const feed = useApi(
    useCallback(
      () =>
        listAdminUsers({
          role: tab === "all" || tab === "provisional" || tab === "staff" ? undefined : tab,
          isProvisional: tab === "provisional" ? true : undefined,
          isStaff: tab === "staff" ? true : undefined,
          isVerified: state === "verified" ? true : state === "unverified" ? false : undefined,
          isSuspended: state === "suspended" ? true : undefined,
          search: search.trim() || undefined,
          ordering,
        }),
      [tab, state, search, ordering],
    ),
  );
  const stats = useApi(
    useCallback(
      () => (can("dashboard.view") ? getDashboardStats() : Promise.resolve(null)),
      [can],
    ),
  );

  const rows = useMemo(() => feed.data?.results ?? [], [feed.data]);
  const counts = stats.data?.users;

  const tabs = [
    { id: "all", label: "All", count: counts?.total },
    { id: "landlord", label: "Landlords", count: counts?.landlords },
    { id: "tenant", label: "Tenants", count: counts?.tenants },
    { id: "service_provider", label: "Providers", count: counts?.serviceProviders },
    { id: "provisional", label: "Provisional" },
    { id: "staff", label: "Staff", count: counts?.staff },
  ];

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      header: "User",
      cell: (row) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={row.fullName} />
          <span className="min-w-0">
            <span className="text-ink flex items-center gap-1.5 text-[13px] font-medium">
              <span className="truncate">{row.fullName}</span>
              {row.isVerified && <BadgeCheck className="text-ok size-3.5 shrink-0" />}
              {row.isStaff && <ShieldCheck className="text-brand size-3.5 shrink-0" />}
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
          {row.roles.map((role) => (
            <Badge key={role} tone={roleTone[role]}>
              {humanize(role)}
            </Badge>
          ))}
        </span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-ink-muted text-[13px] tabular-nums">{row.phoneNumber || "—"}</span>
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
      key: "joined",
      header: "Joined",
      hideOnMobile: true,
      cell: (row) => <span className="text-ink-muted text-xs">{relativeTime(row.createdAt)}</span>,
    },
    {
      key: "state",
      header: "State",
      cell: (row) => (
        <span className="flex flex-wrap gap-1">
          {row.suspendedAt && <Badge tone="bad">Suspended</Badge>}
          {row.isProvisional && <Badge tone="warn">Provisional</Badge>}
          {!row.suspendedAt && !row.isProvisional && (
            <Badge tone={row.isVerified ? "ok" : "neutral"}>
              {row.isVerified ? "Verified" : "Unverified"}
            </Badge>
          )}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (row) => (
        <Button
          size="sm"
          variant="subtle"
          onClick={(event) => {
            event.stopPropagation();
            setOpenId(row.id);
          }}
        >
          Open
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        description="Every account on the platform, with suspension, verification and role changes."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.loading && !stats.data ? (
          Array.from({ length: 4 }, (_, i) => (
            <Card key={i}>
              <CardSkeleton />
            </Card>
          ))
        ) : (
          <>
            <StatCard
              label="Total users"
              value={number(counts?.total ?? feed.data?.count ?? 0)}
              hint={`${number(counts?.newLast30Days ?? 0)} in the last 30 days`}
              icon={<UsersIcon className="size-4" />}
            />
            <StatCard label="Landlords" value={number(counts?.landlords ?? 0)} />
            <StatCard label="Suspended" value={number(counts?.suspended ?? 0)} hint="cannot sign in" />
            <StatCard label="Staff" value={number(counts?.staff ?? 0)} hint="with admin access" />
          </>
        )}
      </div>

      <Card>
        <Tabs items={tabs} value={tab} onChange={setTab} className="px-3" />
        <FilterBar>
          <SearchInput
            placeholder="Search name, email or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80"
          />
          <Select
            aria-label="State"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-auto"
          >
            <option value="all">Any state</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="suspended">Suspended</option>
          </Select>
          <Select
            aria-label="Sort"
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="w-auto"
          >
            <option value="-createdAt">Newest first</option>
            <option value="createdAt">Oldest first</option>
            <option value="fullName">Name A–Z</option>
            <option value="-lastLogin">Recently active</option>
          </Select>
        </FilterBar>

        {feed.error ? (
          <CardBody>
            <ErrorState error={feed.error} onRetry={feed.refetch} resource="users" />
          </CardBody>
        ) : feed.loading && !feed.data ? (
          <TableSkeleton rows={6} columns={5} />
        ) : rows.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<UsersIcon className="size-5" />}
              title="No users match"
              description="Try a different tab or clear the search."
            />
          </CardBody>
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} pageSize={10} />
        )}
      </Card>

      <UserDrawer userId={openId} onClose={() => setOpenId(null)} onChanged={feed.refetch} />
    </>
  );
}

function UserDrawer({
  userId,
  onClose,
  onChanged,
}: {
  userId: number | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { can } = useAdminSession();
  const [action, setAction] = useState<"suspend" | "roles" | null>(null);

  const detail = useApiWhen<AdminUserDetail | null>(
    userId != null,
    useCallback(() => (userId != null ? getAdminUser(userId) : Promise.resolve(null)), [userId]),
  );
  const activity = useApiWhen(
    userId != null,
    useCallback(() => (userId != null ? getUserActivity(userId) : Promise.resolve(null)), [userId]),
  );

  const user = detail.data;
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      detail.refetch();
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Drawer
        open={userId != null}
        onClose={onClose}
        title={user?.fullName ?? "User"}
        subtitle={user?.email}
      >
        {detail.error ? (
          <ErrorState error={detail.error} onRetry={detail.refetch} resource="this user" />
        ) : !user ? (
          <CardSkeleton className="p-0" />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {user.roles.map((role) => (
                <Badge key={role} tone={roleTone[role]}>
                  {humanize(role)}
                </Badge>
              ))}
              {user.suspendedAt && <Badge tone="bad">Suspended</Badge>}
              {user.isStaff && <Badge tone="brand">Staff</Badge>}
              {user.isProvisional && <Badge tone="warn">Provisional</Badge>}
            </div>

            {user.suspendedAt && (
              <div className="bg-bad-soft border-bad/25 rounded-xl border p-3.5">
                <p className="text-bad text-[13px] font-medium">
                  Suspended {formatDate(user.suspendedAt)}
                </p>
                <p className="text-bad mt-1 text-xs leading-5">
                  {user.suspensionReason || "No reason recorded."}
                  {user.suspendedBy && ` — ${user.suspendedBy.email}`}
                </p>
              </div>
            )}

            <DefinitionList
              items={[
                { label: "User ID", value: `#${user.id}` },
                { label: "Phone", value: user.phoneNumber || "—" },
                { label: "Current role", value: humanize(user.currentRole) },
                { label: "Joined", value: formatDate(user.createdAt) },
                { label: "Last login", value: user.lastLogin ? formatDateTime(user.lastLogin) : "Never" },
                { label: "Verified", value: user.isVerified ? "Yes" : "No" },
                { label: "Occupation", value: user.occupation || "—" },
                { label: "National ID", value: user.nationalId || "—" },
                {
                  label: "Subscription",
                  value: user.subscription
                    ? `${user.subscription.displayName}${user.subscription.isActive ? "" : " (lapsed)"}`
                    : "None",
                },
                {
                  label: "Wallet",
                  value: user.wallet ? `${number(user.wallet.balance)} credits` : "No wallet",
                },
                {
                  label: "Provider profile",
                  value: user.serviceProvider
                    ? `${user.serviceProvider.businessName} · ${humanize(user.serviceProvider.status)}`
                    : "—",
                },
              ]}
            />

            {activity.data && (
              <div>
                <p className="text-ink mb-2 text-[13px] font-medium">Activity</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {(
                    [
                      ["Properties", activity.data.counts.properties],
                      ["Leases", activity.data.counts.leasesAsLandlord + activity.data.counts.leasesAsTenant],
                      ["Bookings", activity.data.counts.bookingsAsLandlord + activity.data.counts.bookingsAsBooker],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="bg-surface-muted rounded-xl p-3">
                      <p className="text-ink-subtle text-xs">{label}</p>
                      <p className="text-ink mt-1 text-lg font-semibold tabular-nums">{value}</p>
                    </div>
                  ))}
                </div>
                {activity.data.recentProperties.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {activity.data.recentProperties.slice(0, 4).map((property) => (
                      <li key={property.id} className="text-ink-muted truncate text-xs">
                        {property.title} · {humanize(property.status)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="border-line flex flex-wrap gap-2 border-t pt-4">
              {can("users.verify") && !user.isProvisional && (
                <Button
                  disabled={busy}
                  onClick={() =>
                    run(() => (user.isVerified ? unverifyUser(user.id) : verifyUser(user.id)))
                  }
                >
                  <BadgeCheck className="size-4" />
                  {user.isVerified ? "Remove verification" : "Mark verified"}
                </Button>
              )}
              {can("users.roles") && !user.isProvisional && (
                <Button disabled={busy} onClick={() => setAction("roles")}>
                  <UserCog className="size-4" /> Change roles
                </Button>
              )}
              {can("users.suspend") &&
                (user.suspendedAt ? (
                  <Button variant="primary" disabled={busy} onClick={() => run(() => reactivateUser(user.id))}>
                    Reactivate
                  </Button>
                ) : (
                  <Button variant="danger" disabled={busy} onClick={() => setAction("suspend")}>
                    <ShieldOff className="size-4" /> Suspend
                  </Button>
                ))}
            </div>
          </div>
        )}
      </Drawer>

      {user && (
        <>
          <SuspendModal
            open={action === "suspend"}
            user={user}
            onClose={() => setAction(null)}
            onDone={() => {
              detail.refetch();
              onChanged();
            }}
          />
          <RolesModal
            open={action === "roles"}
            user={user}
            onClose={() => setAction(null)}
            onDone={() => {
              detail.refetch();
              onChanged();
            }}
          />
        </>
      )}
    </>
  );
}

function SuspendModal({
  open,
  user,
  onClose,
  onDone,
}: {
  open: boolean;
  user: AdminUserDetail;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiError | null>(null);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={`Suspend ${user.fullName}`}
      description="They are signed out everywhere immediately and cannot sign in again until reactivated."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="danger"
            disabled={busy || !reason.trim()}
            onClick={async () => {
              setBusy(true);
              setFailure(null);
              try {
                await suspendUser(user.id, reason, notify);
                onDone();
                onClose();
                setReason("");
              } catch (caught) {
                setFailure(
                  caught instanceof ApiError ? caught : new ApiError(0, "Could not suspend"),
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Suspending…" : "Suspend account"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {failure && <InlineError error={failure} />}
        <Field label="Reason" hint="Required. Kept on the audit log, shown to staff only.">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Chargeback fraud"
          />
        </Field>
        <label className="text-ink-muted flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
            className="accent-brand size-4"
          />
          Send them an in-app notification
        </label>
      </div>
    </Modal>
  );
}

function RolesModal({
  open,
  user,
  onClose,
  onDone,
}: {
  open: boolean;
  user: AdminUserDetail;
  onClose: () => void;
  onDone: () => void;
}) {
  const [roles, setRoles] = useState<string[]>(
    user.roles.filter((r) => r !== "service_provider"),
  );
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiError | null>(null);

  const toggle = (role: string) =>
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={`Roles for ${user.fullName}`}
      description="Only tenant and landlord can be set here. The service provider role comes from approving an application."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={busy || roles.length === 0}
            onClick={async () => {
              setBusy(true);
              setFailure(null);
              try {
                await setUserRoles(user.id, { roles, reason: reason || undefined });
                onDone();
                onClose();
              } catch (caught) {
                setFailure(
                  caught instanceof ApiError ? caught : new ApiError(0, "Could not update roles"),
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Saving…" : "Save roles"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {failure && <InlineError error={failure} />}
        <div className="space-y-2">
          {["tenant", "landlord"].map((role) => (
            <label
              key={role}
              className="border-line bg-surface-muted flex items-center gap-3 rounded-xl border p-3 text-[13px]"
            >
              <input
                type="checkbox"
                checked={roles.includes(role)}
                onChange={() => toggle(role)}
                className="accent-brand size-4"
              />
              <span className="text-ink font-medium">{humanize(role)}</span>
            </label>
          ))}
        </div>
        {user.roles.includes("service_provider") && (
          <p className="text-ink-subtle text-xs">
            This account also holds the service provider role, which is preserved.
          </p>
        )}
        <Field label="Reason" hint="Optional, stored on the audit log.">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Requested by user"
          />
        </Field>
      </div>
    </Modal>
  );
}
