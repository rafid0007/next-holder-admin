"use client";

import { useCallback, useMemo, useState } from "react";
import { Coins, Gift, Package, Wallet } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, SearchInput, Select, Switch, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState, FilterBar, PageHeader, StatCard } from "@/components/ui/misc";
import { CardSkeleton, ErrorState, TableSkeleton } from "@/components/ui/states";
import { useApi } from "@/lib/api/hooks";
import {
  getMyWallet, grantCredits, listCreditPackages, listCreditTransactions, listUsers,
} from "@/lib/api/resources";
import type { ApiCreditTransaction } from "@/lib/api/types";
import { humanize, money, number, relativeTime } from "@/lib/utils";

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
  const [grantUserId, setGrantUserId] = useState("");
  const [grantAmount, setGrantAmount] = useState("");
  const [grantReason, setGrantReason] = useState("");

  const packageFeed = useApi(useCallback(() => listCreditPackages(), []));
  // Both are scoped to the caller: there is no cross-user wallet or ledger view.
  const walletFeed = useApi(useCallback(() => getMyWallet().catch(() => null), []));
  const txFeed = useApi(useCallback(() => listCreditTransactions(), []));

  const creditPackages = useMemo(() => packageFeed.data ?? [], [packageFeed.data]);
  const transactions: ApiCreditTransaction[] = useMemo(
    () => txFeed.data?.results ?? [],
    [txFeed.data],
  );

  const ledger = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((transaction) => {
      if (typeFilter !== "all" && transaction.transactionType !== typeFilter) return false;
      if (q && !`${transaction.description} ${transaction.referenceId}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [transactions, query, typeFilter]);

  const balance = walletFeed.data?.balance ?? 0;
  const spent = transactions
    .filter((t) => t.transactionType === "deduction")
    .reduce((sum, t) => sum + t.amount, 0);
  const purchased = transactions
    .filter((t) => t.transactionType === "purchase")
    .reduce((sum, t) => sum + t.amount, 0);

  const columns: Column<ApiCreditTransaction>[] = [
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
        <span className="text-ink-subtle text-xs">
          {row.scope ? humanize(row.scope) : "—"}
          {row.sourceType && ` · ${humanize(row.sourceType)}`}
        </span>
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
        {walletFeed.loading && !walletFeed.data ? (
          Array.from({ length: 4 }, (_, i) => (
            <Card key={i}>
              <CardSkeleton />
            </Card>
          ))
        ) : (
          <>
            <StatCard
              label="Your balance"
              value={number(balance)}
              icon={<Wallet className="size-4" />}
              hint="credits available"
            />
            <StatCard label="Credits purchased" value={number(purchased)} hint="in this ledger" />
            <StatCard
              label="Credits spent"
              value={number(spent)}
              icon={<Coins className="size-4" />}
              hint="unlocks and pro actions"
            />
            <StatCard
              label="Packages on sale"
              value={number(creditPackages.filter((p) => p.isActive).length)}
              icon={<Package className="size-4" />}
            />
          </>
        )}
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Packages"
            description="What users can buy, and the price per credit."
          />
          {packageFeed.error ? (
            <CardBody>
              <ErrorState
                error={packageFeed.error}
                onRetry={packageFeed.refetch}
                resource="packages"
              />
            </CardBody>
          ) : packageFeed.loading && !packageFeed.data ? (
            <CardSkeleton />
          ) : creditPackages.length === 0 ? (
            <CardBody>
              <EmptyState
                icon={<Package className="size-5" />}
                title="No packages configured"
                description="Create one so users can top up their wallet."
              />
            </CardBody>
          ) : (
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
                      {number(pack.credits)} credits ·{" "}
                      {money(Number(pack.price) / Math.max(pack.credits, 1))} per credit
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
          )}
        </Card>

        <Card>
          <CardHeader title="Your wallet" description="Balance by scope." />
          {walletFeed.data ? (
            <CardBody className="space-y-2.5">
              {Object.entries(walletFeed.data.scopeBalances ?? {}).map(([scope, amount]) => (
                <div key={scope} className="flex items-center justify-between text-[13px]">
                  <span className="text-ink-muted">{humanize(scope)}</span>
                  <span className="text-ink font-medium tabular-nums">{number(amount)}</span>
                </div>
              ))}
              {Object.keys(walletFeed.data.scopeBalances ?? {}).length === 0 && (
                <p className="text-ink-subtle text-[13px]">No scoped balances.</p>
              )}
            </CardBody>
          ) : (
            <CardBody>
              <EmptyState
                icon={<Wallet className="size-5" />}
                title="No wallet"
                description="A wallet is created on the first credit transaction."
              />
            </CardBody>
          )}
        </Card>
      </div>

      <Card>
        <Tabs
          items={[
            { id: "ledger", label: "Transaction ledger", count: txFeed.data?.count },
            { id: "wallets", label: "Wallets" },
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
            {txFeed.error ? (
              <CardBody>
                <ErrorState error={txFeed.error} onRetry={txFeed.refetch} resource="the ledger" />
              </CardBody>
            ) : txFeed.loading && !txFeed.data ? (
              <TableSkeleton rows={6} columns={5} />
            ) : ledger.length === 0 ? (
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
          <CardBody>
            <EmptyState
              icon={<Wallet className="size-5" />}
              title="Needs a staff endpoint"
              description="/credits/wallet returns only the caller's wallet. Listing every user's balance needs a staff-scoped endpoint — see API-GAPS.md in the backend."
            />
          </CardBody>
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
            <Button
              variant="primary"
              disabled={!grantUserId || !grantAmount}
              onClick={async () => {
                await grantCredits({
                  userId: Number(grantUserId),
                  amount: Number(grantAmount),
                  description: grantReason,
                });
                setGrantOpen(false);
                txFeed.refetch();
                walletFeed.refetch();
              }}
            >
              Grant credits
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <GrantFields
            userId={grantUserId}
            setUserId={setGrantUserId}
            amount={grantAmount}
            setAmount={setGrantAmount}
            reason={grantReason}
            setReason={setGrantReason}
          />
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

/** The user picker needs the staff-or-landlord user list, so it loads lazily. */
function GrantFields({
  userId,
  setUserId,
  amount,
  setAmount,
  reason,
  setReason,
}: {
  userId: string;
  setUserId: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  reason: string;
  setReason: (v: string) => void;
}) {
  const people = useApi(useCallback(() => listUsers().catch(() => null), []));

  return (
    <>
      <Field label="User">
        <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
          <option value="">Select a user…</option>
          {(people.data?.results ?? []).map((person) => (
            <option key={person.id} value={person.id}>
              {person.fullName} — {person.email}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Credits">
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="25"
        />
      </Field>
      <Field label="Reason" hint="Appears in the user's transaction history.">
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Goodwill after a failed unlock."
        />
      </Field>
    </>
  );
}
