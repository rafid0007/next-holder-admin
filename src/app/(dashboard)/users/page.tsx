"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck, GitMerge, MailWarning, ShieldCheck, ShieldOff, UserPlus, Users as UsersIcon,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, SearchInput, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import {
  Avatar, DefinitionList, EmptyState, FilterBar, PageHeader, StatCard, UserCell,
} from "@/components/ui/misc";
import { BarChart } from "@/components/charts/bar-chart";
import { creditWallets, monthLabels, newUsersSeries, properties, users, userSubscriptions } from "@/lib/mock/data";
import type { User } from "@/lib/api/types";
import { formatDate, humanize, number, relativeTime } from "@/lib/utils";

const roleTone = { landlord: "brand", tenant: "info", service_provider: "ok" } as const;

export default function UsersPage() {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [verified, setVerified] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);

  const tabs = useMemo(
    () => [
      { id: "all", label: "All", count: users.length },
      { id: "landlord", label: "Landlords", count: users.filter((u) => u.roles.includes("landlord")).length },
      { id: "tenant", label: "Tenants", count: users.filter((u) => u.roles.includes("tenant")).length },
      { id: "service_provider", label: "Providers", count: users.filter((u) => u.roles.includes("service_provider")).length },
      { id: "provisional", label: "Provisional", count: users.filter((u) => u.isProvisional).length },
    ],
    [],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((person) => {
      if (tab === "provisional" && !person.isProvisional) return false;
      if (!["all", "provisional"].includes(tab) && !person.roles.includes(tab as User["roles"][number]))
        return false;
      if (verified === "verified" && !person.isVerified) return false;
      if (verified === "unverified" && person.isVerified) return false;
      if (verified === "inactive" && person.isActive) return false;
      if (q && !`${person.fullName} ${person.email} ${person.phoneNumber}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [tab, query, verified]);

  const columns: Column<User>[] = [
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
      key: "properties",
      header: "Properties",
      align: "center",
      hideOnMobile: true,
      sortValue: (row) => properties.filter((p) => p.landlord.id === row.id).length,
      cell: (row) => {
        const count = properties.filter((p) => p.landlord.id === row.id).length;
        return (
          <span className="text-ink-muted text-[13px] tabular-nums">{count > 0 ? count : "—"}</span>
        );
      },
    },
    {
      key: "credits",
      header: "Credits",
      align: "right",
      hideOnMobile: true,
      cell: (row) => {
        const wallet = creditWallets.find((w) => w.user.id === row.id);
        return (
          <span className="text-ink-muted text-[13px] tabular-nums">
            {wallet ? number(wallet.balance) : "—"}
          </span>
        );
      },
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
        <StatCard
          label="Total users"
          value={String(users.length)}
          delta={14.2}
          icon={<UsersIcon className="size-4" />}
          trend={newUsersSeries}
        />
        <StatCard
          label="Verified"
          value={`${Math.round((users.filter((u) => u.isVerified).length / users.length) * 100)}%`}
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
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Sign-ups" description="New accounts created per month." />
          <CardBody>
            <BarChart
              labels={monthLabels}
              formatValue={(v) => String(v)}
              series={[{ name: "New users", color: "var(--brand)", values: newUsersSeries }]}
            />
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

        {rows.length === 0 ? (
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
            expandedContent={(person) => {
              const subscription = userSubscriptions.find((s) => s.user.id === person.id);
              const wallet = creditWallets.find((w) => w.user.id === person.id);
              return (
                <div className="grid gap-5 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <DefinitionList
                      items={[
                        { label: "User ID", value: `#${person.id}` },
                        { label: "Current role", value: humanize(person.currentRole) },
                        { label: "Occupation", value: person.occupation || "—" },
                        { label: "Joined", value: formatDate(person.createdAt) },
                        {
                          label: "Subscription",
                          value: subscription
                            ? `${subscription.plan.displayName} (${subscription.isActive ? "active" : "lapsed"})`
                            : "None",
                        },
                        {
                          label: "Credit balance",
                          value: wallet ? `${number(wallet.balance)} credits` : "No wallet",
                        },
                        {
                          label: "Properties owned",
                          value: number(properties.filter((p) => p.landlord.id === person.id).length),
                        },
                        { label: "National ID", value: person.nationalId || "Not provided" },
                      ]}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    {!person.isVerified && (
                      <Button variant="primary">
                        <ShieldCheck className="size-4" /> Mark verified
                      </Button>
                    )}
                    <Button>Grant credits</Button>
                    <Button>Reset password</Button>
                    <Button variant="danger">
                      <ShieldOff className="size-4" />
                      {person.isActive ? "Disable account" : "Re-enable account"}
                    </Button>
                  </div>
                </div>
              );
            }}
          />
        )}
      </Card>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Provision a tenant"
        description="Creates a placeholder account a landlord can attach a lease to before the tenant signs up."
        footer={
          <>
            <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setInviteOpen(false)}>
              Create tenant
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Full name">
            <Input placeholder="Jahid Hasan" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone number" hint="Used to match the account at sign-up.">
              <Input placeholder="+8801711111199" />
            </Field>
            <Field label="Contact email" hint="Optional.">
              <Input type="email" placeholder="jahid@example.com" />
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
    </>
  );
}
