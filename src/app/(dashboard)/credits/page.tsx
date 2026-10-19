"use client";

import { useCallback, useMemo, useState } from "react";
import { Coins, Gift, Package, Wallet } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, SearchInput, Select, Switch, Textarea } from "@/components/ui/field";
import { Drawer, Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import {
  DefinitionList, EmptyState, FilterBar, PageHeader, StatCard, UserCell,
} from "@/components/ui/misc";
import { CardSkeleton, ErrorState, InlineError, TableSkeleton } from "@/components/ui/states";
import { RequirePermission } from "@/components/layout/permission-gate";
import { ApiError } from "@/lib/api/client";
import { useApi, useApiWhen } from "@/lib/api/hooks";
import { useAdminSession } from "@/lib/api/admin-session";
import {
  createCreditPackage, deductCreditsAdmin, getCreditWallet, getDashboardStats,
  grantCreditsAdmin, listAdminCreditTransactions, listAdminUsers, listCreditPackagesAdmin,
  listCreditWallets, refundCreditsAdmin, updateCreditPackage,
} from "@/lib/api/admin";
import type { AdminCreditTransaction, AdminCreditWallet } from "@/lib/api/admin-types";
import { formatDateTime, humanize, money, number, relativeTime } from "@/lib/utils";

const creditTone: Record<string, "ok" | "bad" | "warn" | "info" | "neutral"> = {
  purchase: "ok", bonus: "ok", grant: "ok", refund: "info", release: "info",
  deduction: "bad", capture: "bad", expire: "bad", reserve: "warn", adjust: "neutral",
};
const inflows = ["purchase", "bonus", "grant", "refund", "release"];

export default function CreditsPage() {
  return (
    <RequirePermission codes={["credits.view"]}>
      <Credits />
    </RequirePermission>
  );
}

function Credits() {
  const { can } = useAdminSession();
  const [tab, setTab] = useState("ledger");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [movement, setMovement] = useState<"grant" | "refund" | "deduct" | null>(null);
  const [packageOpen, setPackageOpen] = useState(false);
  const [walletUser, setWalletUser] = useState<number | null>(null);

  const packages = useApi(useCallback(() => listCreditPackagesAdmin(), []));
  const wallets = useApi(
    useCallback(() => listCreditWallets({ search: search.trim() || undefined }), [search]),
  );
  const ledger = useApi(
    useCallback(
      () => listAdminCreditTransactions({ type: typeFilter === "all" ? undefined : typeFilter }),
      [typeFilter],
    ),
  );
  const stats = useApi(
    useCallback(
      () => (can("dashboard.view") ? getDashboardStats() : Promise.resolve(null)),
      [can],
    ),
  );

  const txRows = useMemo(() => ledger.data?.results ?? [], [ledger.data]);
  const walletRows = useMemo(() => wallets.data?.results ?? [], [wallets.data]);

  const txColumns: Column<AdminCreditTransaction>[] = [
    { key: "user", header: "User", cell: (row) => <UserCell name={row.user.fullName} meta={row.user.email} /> },
    {
      key: "type",
      header: "Type",
      cell: (row) => (
        <Badge tone={creditTone[row.transactionType] ?? "neutral"}>
          {humanize(row.transactionType)}
        </Badge>
      ),
    },
    {
      key: "description",
      header: "Description",
      hideOnMobile: true,
      cell: (row) => (
        <span className="block max-w-72">
          <span className="text-ink-muted block truncate text-[13px]">{row.description}</span>
          <span className="text-ink-subtle block truncate text-xs">
            {[humanize(row.scope), humanize(row.sourceType)].filter(Boolean).join(" · ")}
          </span>
        </span>
      ),
    },
    {
      key: "amount",
      header: "Change",
      align: "right",
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
      cell: (row) => (
        <span className="text-ink-subtle text-xs whitespace-nowrap">
          {relativeTime(row.createdAt)}
        </span>
      ),
    },
  ];

  const walletColumns: Column<AdminCreditWallet>[] = [
    { key: "user", header: "User", cell: (row) => <UserCell name={row.user.fullName} meta={row.user.email} /> },
    {
      key: "balance",
      header: "Available",
      align: "right",
      cell: (row) => (
        <span className="text-ink text-[13px] font-medium tabular-nums">{number(row.balance)}</span>
      ),
    },
    {
      key: "reserved",
      header: "Reserved",
      align: "right",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-ink-muted text-[13px] tabular-nums">{number(row.reserved)}</span>
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
      cell: (row) => (
        <Button size="sm" variant="ghost" onClick={() => setWalletUser(row.user.id)}>
          Open
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Credits"
        description="Packages on sale, every wallet on the platform, and the full ledger."
        actions={
          <>
            {can("credit_packages.manage") && (
              <Button onClick={() => setPackageOpen(true)}>
                <Package className="size-4" /> New package
              </Button>
            )}
            {can("credits.grant") && (
              <Button variant="primary" onClick={() => setMovement("grant")}>
                <Gift className="size-4" /> Grant credits
              </Button>
            )}
          </>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Credits outstanding"
          value={number(stats.data?.credits.outstandingBalance ?? 0)}
          icon={<Coins className="size-4" />}
          hint="held in user wallets"
        />
        <StatCard label="Wallets" value={number(wallets.data?.count ?? 0)} icon={<Wallet className="size-4" />} />
        <StatCard label="Ledger entries" value={number(ledger.data?.count ?? 0)} />
        <StatCard
          label="Packages on sale"
          value={number((packages.data ?? []).filter((p) => p.isActive).length)}
          icon={<Package className="size-4" />}
        />
      </div>

      <Card className="mb-4">
        <CardHeader title="Packages" description="What users can buy, and the price per credit." />
        {packages.error ? (
          <CardBody>
            <ErrorState error={packages.error} onRetry={packages.refetch} resource="packages" />
          </CardBody>
        ) : packages.loading && !packages.data ? (
          <CardSkeleton />
        ) : (packages.data ?? []).length === 0 ? (
          <CardBody>
            <EmptyState icon={<Package className="size-5" />} title="No packages configured" />
          </CardBody>
        ) : (
          <ul className="grid sm:grid-cols-2 xl:grid-cols-4">
            {(packages.data ?? []).map((pack) => (
              <li key={pack.id} className="border-line border-b p-5 sm:border-r last:border-r-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-ink text-[13px] font-medium">{pack.name}</p>
                  <Badge tone={pack.isActive ? "ok" : "neutral"}>
                    {pack.isActive ? "On sale" : "Retired"}
                  </Badge>
                </div>
                <p className="text-ink mt-2 text-xl font-semibold tabular-nums">
                  {money(pack.price)}
                </p>
                <p className="text-ink-subtle text-xs tabular-nums">
                  {number(pack.credits)} credits ·{" "}
                  {money(Number(pack.price) / Math.max(pack.credits, 1))} each
                </p>
                {can("credit_packages.manage") && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2"
                    onClick={async () => {
                      await updateCreditPackage(pack.id, { isActive: !pack.isActive });
                      packages.refetch();
                    }}
                  >
                    {pack.isActive ? "Retire" : "Put on sale"}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <Tabs
          items={[
            { id: "ledger", label: "Transaction ledger", count: ledger.data?.count },
            { id: "wallets", label: "Wallets", count: wallets.data?.count },
          ]}
          value={tab}
          onChange={setTab}
          className="px-3"
        />

        {tab === "ledger" ? (
          <>
            <FilterBar>
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
            {ledger.error ? (
              <CardBody>
                <ErrorState error={ledger.error} onRetry={ledger.refetch} resource="the ledger" />
              </CardBody>
            ) : ledger.loading && !ledger.data ? (
              <TableSkeleton rows={6} columns={5} />
            ) : txRows.length === 0 ? (
              <CardBody>
                <EmptyState icon={<Coins className="size-5" />} title="No transactions" />
              </CardBody>
            ) : (
              <DataTable columns={txColumns} rows={txRows} rowKey={(row) => row.id} pageSize={12} />
            )}
          </>
        ) : (
          <>
            <FilterBar>
              <SearchInput
                placeholder="Search user name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-80"
              />
            </FilterBar>
            {wallets.error ? (
              <CardBody>
                <ErrorState error={wallets.error} onRetry={wallets.refetch} resource="wallets" />
              </CardBody>
            ) : wallets.loading && !wallets.data ? (
              <TableSkeleton rows={6} columns={4} />
            ) : walletRows.length === 0 ? (
              <CardBody>
                <EmptyState icon={<Wallet className="size-5" />} title="No wallets match" />
              </CardBody>
            ) : (
              <DataTable
                columns={walletColumns}
                rows={walletRows}
                rowKey={(row) => row.id}
                pageSize={12}
              />
            )}
          </>
        )}
      </Card>

      <WalletDrawer userId={walletUser} onClose={() => setWalletUser(null)} />

      <MovementModal
        kind={movement}
        onClose={() => setMovement(null)}
        onDone={() => {
          ledger.refetch();
          wallets.refetch();
        }}
      />

      <NewPackageModal
        open={packageOpen}
        onClose={() => setPackageOpen(false)}
        onDone={packages.refetch}
      />
    </>
  );
}

function WalletDrawer({ userId, onClose }: { userId: number | null; onClose: () => void }) {
  const wallet = useApiWhen(
    userId != null,
    useCallback(() => (userId != null ? getCreditWallet(userId) : Promise.resolve(null)), [userId]),
  );
  const data = wallet.data;

  return (
    <Drawer
      open={userId != null}
      onClose={onClose}
      title={data?.user.fullName ?? "Wallet"}
      subtitle={data?.user.email}
    >
      {wallet.error ? (
        <ErrorState error={wallet.error} onRetry={wallet.refetch} resource="this wallet" />
      ) : !data ? (
        <CardSkeleton className="p-0" />
      ) : (
        <div className="space-y-5">
          <div className="bg-surface-muted border-line rounded-xl border p-4">
            <p className="text-ink-subtle text-xs">Available balance</p>
            <p className="text-ink mt-1 text-2xl font-semibold tabular-nums">
              {number(data.balance)}
            </p>
          </div>

          <div>
            <p className="text-ink mb-2 text-[13px] font-medium">By scope</p>
            <DefinitionList
              items={Object.entries(data.scopeBalances ?? {}).map(([scope, amount]) => ({
                label: humanize(scope),
                value: number(amount),
              }))}
            />
          </div>

          <div>
            <p className="text-ink mb-2 text-[13px] font-medium">
              Live buckets ({data.buckets.length})
            </p>
            {data.buckets.length === 0 ? (
              <EmptyState icon={<Coins className="size-5" />} title="No live credit grants" />
            ) : (
              <ul className="space-y-2">
                {data.buckets.map((bucket) => (
                  <li key={bucket.id} className="bg-surface-muted rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone="neutral">{humanize(bucket.sourceType)}</Badge>
                      <span className="text-ink text-[13px] font-medium tabular-nums">
                        {number(bucket.remainingAmount)} / {number(bucket.originalAmount)}
                      </span>
                    </div>
                    <p className="text-ink-subtle mt-1.5 text-xs">
                      {humanize(bucket.scope)}
                      {bucket.expiresAt && ` · expires ${formatDateTime(bucket.expiresAt)}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}

function MovementModal({
  kind,
  onClose,
  onDone,
}: {
  kind: "grant" | "refund" | "deduct" | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const people = useApi(useCallback(() => listAdminUsers({ page_size: 100 }), []));
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [scope, setScope] = useState("user_action");
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiError | null>(null);

  const title =
    kind === "deduct" ? "Deduct credits" : kind === "refund" ? "Refund credits" : "Grant credits";

  return (
    <Modal
      open={kind != null}
      onClose={onClose}
      title={title}
      description="Writes a ledger entry and an audit record. The user sees the description in their history."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant={kind === "deduct" ? "danger" : "primary"}
            disabled={busy || !userId || !amount}
            onClick={async () => {
              setBusy(true);
              setFailure(null);
              const body = {
                userId: Number(userId),
                amount: Number(amount),
                scope,
                description: description || undefined,
                reason: reason || undefined,
              };
              try {
                if (kind === "deduct") await deductCreditsAdmin(body);
                else if (kind === "refund") await refundCreditsAdmin(body);
                else await grantCreditsAdmin(body);
                onDone();
                onClose();
                setAmount("");
                setDescription("");
                setReason("");
              } catch (caught) {
                setFailure(caught instanceof ApiError ? caught : new ApiError(0, "Could not apply"));
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Applying…" : title}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {failure && <InlineError error={failure} />}
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Credits">
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="25"
            />
          </Field>
          <Field label="Scope">
            <Select value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="user_action">User action</option>
              <option value="pro_action">Pro action</option>
              <option value="boost">Boost</option>
            </Select>
          </Field>
        </div>
        <Field label="Description" hint="Shown in the user's transaction history.">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Goodwill credit"
          />
        </Field>
        <Field label="Reason" hint="Audit only.">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Support ticket #123"
          />
        </Field>
      </div>
    </Modal>
  );
}

function NewPackageModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [credits, setCredits] = useState("");
  const [price, setPrice] = useState("");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiError | null>(null);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="New credit package"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={busy || !name || !credits || !price}
            onClick={async () => {
              setBusy(true);
              setFailure(null);
              try {
                await createCreditPackage({
                  name,
                  credits: Number(credits),
                  price,
                  isActive: active,
                });
                onDone();
                onClose();
                setName("");
                setCredits("");
                setPrice("");
              } catch (caught) {
                setFailure(caught instanceof ApiError ? caught : new ApiError(0, "Could not create"));
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Creating…" : "Create package"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {failure && <InlineError error={failure} />}
        <Field label="Package name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Value pack" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Credits">
            <Input
              type="number"
              min={1}
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              placeholder="150"
            />
          </Field>
          <Field label="Price (৳)">
            <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1100.00" />
          </Field>
        </div>
        <div className="border-line bg-surface-muted flex items-center justify-between rounded-xl border p-4">
          <div>
            <p className="text-ink text-[13px] font-medium">On sale immediately</p>
            <p className="text-ink-subtle text-xs">Shown in the app&rsquo;s purchase screen.</p>
          </div>
          <Switch checked={active} onChange={setActive} label="Package on sale" />
        </div>
      </div>
    </Modal>
  );
}
