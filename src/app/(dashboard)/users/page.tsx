"use client";

import { useCallback, useMemo, useState } from "react";
import {
  BadgeCheck, GitMerge, MailWarning, UserPlus, Users as UsersIcon,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, SearchInput, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import {
  Avatar, DefinitionList, EmptyState, FilterBar, PageHeader, Progress, StatCard, UserCell,
} from "@/components/ui/misc";
import { CardSkeleton, ErrorState, InlineError, TableSkeleton } from "@/components/ui/states";
import { ApiError } from "@/lib/api/client";
import { useApi } from "@/lib/api/hooks";
import { listUsers, provisionTenant } from "@/lib/api/resources";
import type { ApiUserListItem, UserRole } from "@/lib/api/types";
import { formatDate, humanize, relativeTime } from "@/lib/utils";

const roleTone = { landlord: "brand", tenant: "info", service_provider: "ok" } as const;

export default function UsersPage() {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [verified, setVerified] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);

  // `search` and `role` are server-side; the rest is filtered here.
  const directory = useApi(useCallback(() => listUsers(), []));
  const users: ApiUserListItem[] = useMemo(
    () => directory.data?.results ?? [],
    [directory.data],
  );

  const tabs = useMemo(
    () => [
      { id: "all", label: "All", count: users.length },
      { id: "landlord", label: "Landlords", count: users.filter((u) => u.roles.includes("landlord")).length },
      { id: "tenant", label: "Tenants", count: users.filter((u) => u.roles.includes("tenant")).length },
      { id: "service_provider", label: "Providers", count: users.filter((u) => u.roles.includes("service_provider")).length },
      { id: "provisional", label: "Provisional", count: users.filter((u) => u.isProvisional).length },
    ],
    [users],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((person) => {
      if (tab === "provisional" && !person.isProvisional) return false;
      if (!["all", "provisional"].includes(tab) && !person.roles.includes(tab as UserRole))
        return false;
      if (verified === "verified" && !person.isVerified) return false;
      if (verified === "unverified" && person.isVerified) return false;
      if (verified === "inactive" && person.isActive) return false;
      if (q && !`${person.fullName} ${person.email} ${person.phoneNumber}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [users, tab, query, verified]);

  const columns: Column<ApiUserListItem>[] = [
    {
      key: "name",
      header: "User",
      sortValue: (row) => row.fullName,
      cell: (row) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={row.fullName} />
          <span className="min-w-0">
            <span className="text-ink flex items-center gap-1.5 text-[13px] font-medium">
              <span className="truncate">{row.fullName}</span>
              {row.isVerified && <BadgeCheck className="text-ok size-3.5 shrink-0" />}
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
      cell: (row) => <span className="text-ink-muted text-[13px] tabular-nums">{row.phoneNumber}</span>,
    },
    {
      key: "role",
      header: "Signed in as",
      align: "center",
      hideOnMobile: true,
      sortValue: (row) => row.currentRole,
      cell: (row) => (
        <span className="text-ink-muted text-[13px]">{humanize(row.currentRole)}</span>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      hideOnMobile: true,
      sortValue: (row) => row.createdAt,
      cell: (row) => <span className="text-ink-muted text-xs">{relativeTime(row.createdAt)}</span>,
    },
    {
      key: "state",
      header: "State",
      cell: (row) => (
        <span className="flex flex-wrap gap-1">
          {!row.isActive && <Badge tone="bad">Disabled</Badge>}
          {row.isProvisional && <Badge tone="warn">Provisional</Badge>}
          {row.isActive && !row.isProvisional && (
            <Badge tone={row.isVerified ? "ok" : "neutral"}>
              {row.isVerified ? "Verified" : "Unverified"}
            </Badge>
          )}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        description="Landlords, tenants and service providers, including provisional tenants created by landlords."
        actions={
          <Button variant="primary" onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-4" /> Provision tenant
          </Button>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {directory.loading && !directory.data ? (
          Array.from({ length: 4 }, (_, i) => (
            <Card key={i}>
              <CardSkeleton />
            </Card>
          ))
        ) : (
          <>
        <StatCard
          label="Total users"
          value={String(users.length)}
          icon={<UsersIcon className="size-4" />}
        />
        <StatCard
          label="Verified"
          value={users.length ? `${Math.round((users.filter((u) => u.isVerified).length / users.length) * 100)}%` : "—"}
          hint={`${users.filter((u) => !u.isVerified).length} awaiting verification`}
        />
        <StatCard
          label="Provisional tenants"
          value={String(users.filter((u) => u.isProvisional).length)}
          hint="created by landlords"
        />
        <StatCard
          label="Disabled accounts"
          value={String(users.filter((u) => !u.isActive).length)}
          hint="no sign-in allowed"
        />
          </>
        )}
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Roles"
            description="How the loaded accounts break down. A user can hold more than one role."
          />
          <CardBody className="space-y-3.5">
            {(["landlord", "tenant", "service_provider"] as UserRole[]).map((role, index) => {
              const count = users.filter((u) => u.roles.includes(role)).length;
              return (
                <div key={role}>
                  <div className="mb-1 flex items-baseline justify-between text-[13px]">
                    <span className="text-ink font-medium">{humanize(role)}</span>
                    <span className="text-ink-muted tabular-nums">{count}</span>
                  </div>
                  <Progress
                    value={count}
                    max={Math.max(users.length, 1)}
                    tone={(["brand", "ok", "warn"] as const)[index]}
                  />
                </div>
              );
            })}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Provisional tenants"
            description="Merge these into real accounts once the tenant signs up."
          />
          {users.filter((u) => u.isProvisional).length === 0 ? (
            <CardBody>
              <EmptyState icon={<MailWarning className="size-5" />} title="None pending" />
            </CardBody>
          ) : (
            <ul>
              {users
                .filter((u) => u.isProvisional)
                .map((person) => (
                  <li
                    key={person.id}
                    className="border-line flex items-center gap-3 border-b px-5 py-3.5 last:border-0"
                  >
                    <UserCell name={person.fullName} meta={person.phoneNumber} />
                    <Button size="sm" variant="subtle" className="ml-auto">
                      <GitMerge className="size-3.5" /> Merge
                    </Button>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <Tabs items={tabs} value={tab} onChange={setTab} className="px-3" />
        <FilterBar>
          <SearchInput
            placeholder="Search name, email or phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-80"
          />
          <Select
            aria-label="Verification"
            value={verified}
            onChange={(e) => setVerified(e.target.value)}
            className="w-auto"
          >
            <option value="all">Any state</option>
            <option value="verified">Verified only</option>
            <option value="unverified">Unverified only</option>
            <option value="inactive">Disabled accounts</option>
          </Select>
        </FilterBar>

        {directory.error ? (
          <CardBody>
            <ErrorState error={directory.error} onRetry={directory.refetch} resource="users" />
          </CardBody>
        ) : directory.loading && !directory.data ? (
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
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            pageSize={10}
            expandedContent={(person) => (
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <DefinitionList
                    items={[
                      { label: "User ID", value: `#${person.id}` },
                      { label: "Email", value: person.email },
                      { label: "Phone", value: person.phoneNumber || "—" },
                      { label: "Roles", value: person.roles.map(humanize).join(", ") },
                      { label: "Current role", value: humanize(person.currentRole) },
                      { label: "Joined", value: formatDate(person.createdAt) },
                      { label: "Verified", value: person.isVerified ? "Yes" : "No" },
                      { label: "Account", value: person.isActive ? "Active" : "Disabled" },
                    ]}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-ink-subtle text-xs leading-5">
                    Per-user properties, wallet and subscription need staff-scoped endpoints that
                    the API does not expose yet.
                  </p>
                </div>
              </div>
            )}
          />
        )}
      </Card>

      <ProvisionTenantModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onCreated={directory.refetch}
      />
    </>
  );
}

function ProvisionTenantModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiError | null>(null);

  async function submit() {
    setBusy(true);
    setFailure(null);
    try {
      await provisionTenant({ fullName, phoneNumber, contactEmail: contactEmail || undefined });
      onCreated();
      onClose();
      setFullName("");
      setPhoneNumber("");
      setContactEmail("");
    } catch (caught) {
      setFailure(
        caught instanceof ApiError ? caught : new ApiError(0, "Could not create the tenant"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
      <Modal
        open={open}
        onClose={onClose}
        title="Provision a tenant"
        description="Creates a placeholder account a landlord can attach a lease to before the tenant signs up."
        footer={
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" disabled={busy || !fullName || !phoneNumber} onClick={submit}>
              {busy ? "Creating…" : "Create tenant"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {failure && <InlineError error={failure} />}
          <Field
            label="Full name"
            error={fieldError(failure, "fullName")}
          >
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jahid Hasan"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Phone number"
              hint="Used to match the account at sign-up."
              error={fieldError(failure, "phoneNumber")}
            >
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+8801711111199"
              />
            </Field>
            <Field
              label="Contact email"
              hint="Optional."
              error={fieldError(failure, "contactEmail")}
            >
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="jahid@example.com"
              />
            </Field>
          </div>
          <div className="bg-warn-soft border-warn/25 rounded-xl border p-3.5">
            <p className="text-warn text-[13px] leading-5">
              Provisional accounts cannot sign in. When the real tenant registers with the same
              phone number, merge the two so the lease history follows them.
            </p>
          </div>
        </div>
    </Modal>
  );
}

/** Pulls one field's message out of the backend's `details` map. */
function fieldError(error: ApiError | null, field: string) {
  const raw = error?.details?.[field];
  if (!raw) return undefined;
  return Array.isArray(raw) ? String(raw[0]) : String(raw);
}
