"use client";

import { useMemo, useState } from "react";
import { Coins, Gift, Package, Plus, Wallet } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, SearchInput, Select, Switch, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import {
  EmptyState, FilterBar, PageHeader, Progress, StatCard, UserCell,
} from "@/components/ui/misc";
import { BarChart } from "@/components/charts/bar-chart";
import {
  creditPackages, creditTransactions, creditWallets, monthLabels, revenueSeries, users,
} from "@/lib/mock/data";
import type { CreditTransaction } from "@/lib/api/types";
import { formatDateTime, humanize, money, number, relativeTime } from "@/lib/utils";

const creditTone = {
  purchase: "ok",
  bonus: "ok",
  grant: "ok",
  refund: "info",
  release: "info",
  deduction: "bad",
  capture: "bad",
  expire: "bad",
  reserve: "warn",
  adjust: "neutral",
} as const;

const inflows = ["purchase", "bonus", "grant", "refund", "release"];

export default function CreditsPage() {
  const [tab, setTab] = useState("ledger");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [grantOpen, setGrantOpen] = useState(false);
  const [packageOpen, setPackageOpen] = useState(false);

  const ledger = useMemo(() => {
    const q = query.trim().toLowerCase();
    return creditTransactions.filter((transaction) => {
      if (typeFilter !== "all" && transaction.transactionType !== typeFilter) return false;
      if (q && !`${transaction.user.fullName} ${transaction.description}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [query, typeFilter]);

  const circulating = creditWallets.reduce((sum, w) => sum + w.balance, 0);
  const reserved = creditWallets.reduce((sum, w) => sum + w.reserved, 0);
  const spent = creditTransactions
    .filter((t) => t.transactionType === "deduction")
    .reduce((sum, t) => sum + t.amount, 0);

  const columns: Column<CreditTransaction>[] = [
    {
      key: "user",
      header: "User",
      sortValue: (row) => row.user.fullName,
      cell: (row) => <UserCell name={row.user.fullName} />,
    },
    {
      key: "type",
      header: "Type",
      cell: (row) => (
        <Badge tone={creditTone[row.transactionType]}>{humanize(row.transactionType)}</Badge>
      ),
    },
    {
      key: "description",
      header: "Description",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-ink-muted block max-w-80 truncate text-[13px]">
          {row.description}
        </span>
      ),
    },
    {
      key: "scope",
      header: "Scope",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-ink-subtle text-xs">{row.scope ? humanize(row.scope) : "—"}</span>
      ),
    },
    {
      key: "amount",
      header: "Change",
      align: "right",
      sortValue: (row) => row.amount,
      cell: (row) => {
        const positive = inflows.includes(row.transactionType);
        return (
          <span
            className={
              positive
                ? "text-ok text-[13px] font-medium tabular-nums"
                : "text-bad text-[13px] font-medium tabular-nums"
            }
          >
            {positive ? "+" : "−"}
            {number(row.amount)}
          </span>
        );
      },
    },
    {
      key: "balance",
      header: "Balance after",
      align: "right",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-ink-muted text-[13px] tabular-nums">{number(row.balanceAfter)}</span>
      ),
    },
    {
      key: "when",
      header: "When",
      align: "right",
      sortValue: (row) => row.createdAt,
      cell: (row) => (
        <span className="text-ink-subtle text-xs whitespace-nowrap">
          {relativeTime(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Credits"
        description="The credit economy: packages on sale, wallet balances and the full transaction ledger."
        actions={
          <>
            <Button onClick={() => setPackageOpen(true)}>
              <Package className="size-4" /> New package
            </Button>
            <Button variant="primary" onClick={() => setGrantOpen(true)}>
              <Gift className="size-4" /> Grant credits
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Credits in circulation"
          value={number(circulating)}
          icon={<Coins className="size-4" />}
          hint={`${number(reserved)} reserved`}
        />
        <StatCard
          label="Credit sales"
          value={money(revenueSeries.credits[revenueSeries.credits.length - 1])}
          delta={13.7}
          trend={revenueSeries.credits}
        />
        <StatCard label="Credits spent" value={number(spent)} hint="unlocks and pro actions" />
        <StatCard
          label="Active wallets"
          value={String(creditWallets.length)}
          icon={<Wallet className="size-4" />}
        />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Credit revenue" description="Monthly income from package purchases." />
          <CardBody>
            <BarChart
              labels={monthLabels}
              series={[{ name: "Credit sales", color: "#fbbf24", values: revenueSeries.credits }]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Packages"
            description="What users can buy, and the price per credit."
          />
          <ul>
            {creditPackages.map((pack) => (
              <li
                key={pack.id}
                className="border-line flex items-center gap-3 border-b px-5 py-3.5 last:border-0"
              >
                <span className="bg-warn-soft text-warn grid size-8 shrink-0 place-items-center rounded-lg">
                  <Coins className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-ink truncate text-[13px] font-medium">{pack.name}</p>
                  <p className="text-ink-subtle text-xs tabular-nums">
                    {number(pack.credits)} credits · {money(pack.price / pack.credits)} per credit
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-ink text-[13px] font-medium tabular-nums">
                    {money(pack.price)}
                  </p>
                  <Badge tone={pack.isActive ? "ok" : "neutral"}>
                    {pack.isActive ? "On sale" : "Retired"}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <Tabs
          items={[
            { id: "ledger", label: "Transaction ledger", count: creditTransactions.length },
            { id: "wallets", label: "Wallets", count: creditWallets.length },
          ]}
          value={tab}
          onChange={setTab}
          className="px-3"
        />

        {tab === "ledger" ? (
          <>
            <FilterBar>
              <SearchInput
                placeholder="Search user or description…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full sm:w-80"
              />
              <Select
                aria-label="Transaction type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-auto"
              >
                <option value="all">All types</option>
                {Object.keys(creditTone).map((type) => (
                  <option key={type} value={type}>
                    {humanize(type)}
                  </option>
                ))}
              </Select>
            </FilterBar>
            {ledger.length === 0 ? (
              <CardBody>
                <EmptyState
                  icon={<Coins className="size-5" />}
                  title="No transactions match"
                  description="Clear the type filter or search for a different user."
                />
              </CardBody>
            ) : (
              <DataTable columns={columns} rows={ledger} rowKey={(row) => row.id} pageSize={10} />
            )}
          </>
        ) : (
          <DataTable
            rows={creditWallets}
            rowKey={(row) => row.id}
            pageSize={10}
            columns={[
              {
                key: "user",
                header: "User",
                sortValue: (row) => row.user.fullName,
                cell: (row) => <UserCell name={row.user.fullName} meta={row.user.email} />,
              },
              {
                key: "balance",
                header: "Available",
                align: "right",
                sortValue: (row) => row.balance,
                cell: (row) => (
                  <span className="text-ink text-[13px] font-medium tabular-nums">
                    {number(row.balance)}
                  </span>
                ),
              },
              {
                key: "reserved",
                header: "Reserved",
                align: "right",
                hideOnMobile: true,
                cell: (row) => (
                  <span className="text-ink-muted text-[13px] tabular-nums">
                    {number(row.reserved)}
                  </span>
                ),
              },
              {
                key: "share",
                header: "Share of circulation",
                hideOnMobile: true,
                cell: (row) => (
                  <span className="block w-36">
                    <Progress value={row.balance} max={circulating} tone="brand" />
                  </span>
                ),
              },
              {
                key: "updated",
                header: "Last activity",
                hideOnMobile: true,
                cell: (row) => (
                  <span className="text-ink-subtle text-xs">{formatDateTime(row.updatedAt)}</span>
                ),
              },
              {
                key: "actions",
                header: "",
                align: "right",
                cell: () => (
                  <Button size="sm" variant="ghost">
                    <Plus className="size-3.5" /> Grant
                  </Button>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Modal
        open={grantOpen}
        onClose={() => setGrantOpen(false)}
        title="Grant credits"
        description="Writes a `grant` entry to the ledger; the wallet balance follows from the ledger."
        footer={
          <>
            <Button onClick={() => setGrantOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setGrantOpen(false)}>
              Grant credits
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="User">
            <Select>
              {users.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.fullName} — {person.email}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Credits">
              <Input type="number" placeholder="25" />
            </Field>
            <Field label="Scope">
              <Select>
                <option value="user_action">User action</option>
                <option value="pro_action">Pro action</option>
                <option value="boost">Boost</option>
              </Select>
            </Field>
          </div>
          <Field label="Reason" hint="Appears in the user's transaction history.">
            <Textarea placeholder="Goodwill after a failed unlock on 14 Oct." />
          </Field>
        </div>
      </Modal>

      <Modal
        open={packageOpen}
        onClose={() => setPackageOpen(false)}
        title="New credit package"
        size="sm"
        footer={
          <>
            <Button onClick={() => setPackageOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setPackageOpen(false)}>
              Create package
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Package name">
            <Input placeholder="Value pack" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Credits">
              <Input type="number" placeholder="150" />
            </Field>
            <Field label="Price (৳)">
              <Input type="number" placeholder="1100" />
            </Field>
          </div>
          <PackageActiveToggle />
        </div>
      </Modal>
    </>
  );
}

function PackageActiveToggle() {
  const [on, setOn] = useState(true);
  return (
    <div className="border-line bg-surface-muted flex items-center justify-between rounded-xl border p-4">
      <div>
        <p className="text-ink text-[13px] font-medium">On sale immediately</p>
        <p className="text-ink-subtle text-xs">Shown in the app’s credit purchase screen.</p>
      </div>
      <Switch checked={on} onChange={setOn} label="Package on sale" />
    </div>
  );
}
