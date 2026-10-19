"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, CreditCard, Pencil, TrendingUp, X } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, SearchInput, Select, Switch } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import {
  EmptyState, FilterBar, PageHeader, Progress, StatCard, UserCell,
} from "@/components/ui/misc";
import { CardSkeleton, ErrorState, InlineError, TableSkeleton } from "@/components/ui/states";
import { RequirePermission } from "@/components/layout/permission-gate";
import { ApiError } from "@/lib/api/client";
import { useApi } from "@/lib/api/hooks";
import { useAdminSession } from "@/lib/api/admin-session";
import {
  createSubscriptionPlan, getSubscriptionStats, listSubscriptionPlansAdmin, listSubscriptions,
  setUserSubscription, updateSubscriptionPlan,
} from "@/lib/api/admin";
import type { AdminSubscription, AdminSubscriptionPlan } from "@/lib/api/admin-types";
import { cn, formatDate, humanize, money, number } from "@/lib/utils";

export default function SubscriptionsPage() {
  return (
    <RequirePermission codes={["subscriptions.view"]}>
      <Subscriptions />
    </RequirePermission>
  );
}

function Subscriptions() {
  const { can } = useAdminSession();
  const [tab, setTab] = useState("plans");
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("all");
  const [editing, setEditing] = useState<AdminSubscriptionPlan | "new" | null>(null);
  const [assigning, setAssigning] = useState<AdminSubscription | null>(null);

  const plans = useApi(useCallback(() => listSubscriptionPlansAdmin(), []));
  const stats = useApi(useCallback(() => getSubscriptionStats(), []));
  const subscribers = useApi(
    useCallback(
      () =>
        listSubscriptions({
          search: search.trim() || undefined,
          tier: tier === "all" ? undefined : tier,
        }),
      [search, tier],
    ),
  );

  const planList = useMemo(() => plans.data ?? [], [plans.data]);
  const rows = useMemo(() => subscribers.data?.results ?? [], [subscribers.data]);
  const totalSubscribers = planList.reduce((sum, p) => sum + p.subscriberCount, 0);

  const columns: Column<AdminSubscription>[] = [
    { key: "user", header: "Subscriber", cell: (row) => <UserCell name={row.user.fullName} meta={row.user.email} /> },
    { key: "plan", header: "Plan", cell: (row) => <Badge tone="brand">{row.plan.displayName}</Badge> },
    {
      key: "usage",
      header: "Property usage",
      hideOnMobile: true,
      cell: (row) => (
        <span className="block w-36">
          <Progress
            value={row.propertiesUsed}
            max={Math.max(row.plan.maxProperties, 1)}
            tone={row.propertiesUsed >= row.plan.maxProperties ? "bad" : "brand"}
            label={`${row.propertiesUsed} / ${number(row.plan.maxProperties)}`}
          />
        </span>
      ),
    },
    {
      key: "period",
      header: "Period",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-ink-muted text-xs whitespace-nowrap">
          {formatDate(row.startDate)} → {row.endDate ? formatDate(row.endDate) : "open"}
        </span>
      ),
    },
    {
      key: "renew",
      header: "Auto-renew",
      align: "center",
      hideOnMobile: true,
      cell: (row) => (
        <Badge tone={row.autoRenew ? "ok" : "neutral"}>{row.autoRenew ? "On" : "Off"}</Badge>
      ),
    },
    {
      key: "state",
      header: "State",
      cell: (row) => (
        <Badge tone={row.isActive ? "ok" : "bad"}>{row.isActive ? "Active" : "Lapsed"}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (row) =>
        can("subscriptions.manage") ? (
          <Button size="sm" variant="ghost" onClick={() => setAssigning(row)}>
            Change plan
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Subscriptions"
        description="Plan tiers and who is on each, across the platform."
        actions={
          can("plans.manage") && (
            <Button variant="primary" onClick={() => setEditing("new")}>
              New plan
            </Button>
          )
        }
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
              label="Estimated MRR"
              value={money(stats.data?.totalEstimatedMrr)}
              hint="landlord plus provider plans"
              icon={<CreditCard className="size-4" />}
            />
            <StatCard label="Landlord MRR" value={money(stats.data?.estimatedMrr)} />
            <StatCard label="Provider MRR" value={money(stats.data?.spEstimatedMrr)} />
            <StatCard
              label="Subscribers"
              value={number(totalSubscribers)}
              icon={<TrendingUp className="size-4" />}
            />
          </>
        )}
      </div>

      <Card>
        <Tabs
          items={[
            { id: "plans", label: "Plans", count: planList.length },
            { id: "subscribers", label: "Subscribers", count: subscribers.data?.count },
          ]}
          value={tab}
          onChange={setTab}
          className="px-3"
        />

        {tab === "plans" ? (
          plans.error ? (
            <CardBody>
              <ErrorState error={plans.error} onRetry={plans.refetch} resource="plans" />
            </CardBody>
          ) : plans.loading && !plans.data ? (
            <CardSkeleton />
          ) : (
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {planList.map((plan) => (
                  <div
                    key={plan.id}
                    className={cn(
                      "border-line flex flex-col rounded-xl border p-4",
                      plan.tier === "premium" && "border-brand/40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-ink text-[15px] font-semibold">{plan.displayName}</p>
                        <p className="text-ink-subtle text-xs">{humanize(plan.tier)} tier</p>
                      </div>
                      <Badge tone={plan.isActive ? "ok" : "neutral"}>
                        {plan.isActive ? "Active" : "Hidden"}
                      </Badge>
                    </div>

                    <p className="text-ink mt-4 text-2xl font-semibold tabular-nums">
                      {Number(plan.priceMonthly) === 0 ? "Free" : money(plan.priceMonthly)}
                      {Number(plan.priceMonthly) > 0 && (
                        <span className="text-ink-subtle text-sm font-normal">/mo</span>
                      )}
                    </p>

                    <ul className="mt-4 space-y-2 text-[13px]">
                      <li className="text-ink-muted flex items-center gap-2">
                        <Check className="text-ok size-3.5 shrink-0" />
                        {number(plan.maxProperties)} properties
                      </li>
                      <li className="text-ink-muted flex items-center gap-2">
                        <Check className="text-ok size-3.5 shrink-0" />
                        {number(plan.monthlyCredits)} credits monthly
                      </li>
                      {Object.entries(plan.features ?? {}).map(([key, value]) => (
                        <li key={key} className="text-ink-muted flex items-center gap-2">
                          {value === false ? (
                            <X className="text-ink-subtle size-3.5 shrink-0" />
                          ) : (
                            <Check className="text-ok size-3.5 shrink-0" />
                          )}
                          <span className={value === false ? "text-ink-subtle line-through" : undefined}>
                            {humanize(key)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="border-line mt-auto border-t pt-4">
                      <Progress
                        value={plan.subscriberCount}
                        max={Math.max(totalSubscribers, 1)}
                        label={`${number(plan.subscriberCount)} subscribers`}
                        tone="brand"
                      />
                      {can("plans.manage") && (
                        <Button
                          size="sm"
                          className="mt-3 w-full justify-center"
                          onClick={() => setEditing(plan)}
                        >
                          <Pencil className="size-3.5" /> Edit
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          )
        ) : (
          <>
            <FilterBar>
              <SearchInput
                placeholder="Search subscriber…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-72"
              />
              <Select aria-label="Tier" value={tier} onChange={(e) => setTier(e.target.value)} className="w-auto">
                <option value="all">All tiers</option>
                {planList.map((plan) => (
                  <option key={plan.id} value={plan.tier}>
                    {plan.displayName}
                  </option>
                ))}
              </Select>
            </FilterBar>
            {subscribers.error ? (
              <CardBody>
                <ErrorState
                  error={subscribers.error}
                  onRetry={subscribers.refetch}
                  resource="subscribers"
                />
              </CardBody>
            ) : subscribers.loading && !subscribers.data ? (
              <TableSkeleton rows={6} columns={5} />
            ) : rows.length === 0 ? (
              <CardBody>
                <EmptyState icon={<CreditCard className="size-5" />} title="No subscribers match" />
              </CardBody>
            ) : (
              <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} pageSize={12} />
            )}
          </>
        )}
      </Card>

      <PlanModal
        plan={editing}
        onClose={() => setEditing(null)}
        onDone={() => {
          plans.refetch();
          stats.refetch();
        }}
      />
      <AssignPlanModal
        subscription={assigning}
        plans={planList}
        onClose={() => setAssigning(null)}
        onDone={() => {
          subscribers.refetch();
          plans.refetch();
        }}
      />
    </>
  );
}

function PlanModal({
  plan,
  onClose,
  onDone,
}: {
  plan: AdminSubscriptionPlan | "new" | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const existing = plan && plan !== "new" ? plan : null;
  const [form, setForm] = useState<Record<string, string>>({});
  const [active, setActive] = useState(true);
  const [seeded, setSeeded] = useState<number | "new" | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiError | null>(null);

  const key = existing ? existing.id : plan === "new" ? "new" : null;
  if (plan && key !== seeded) {
    setSeeded(key);
    setForm({
      tier: existing?.tier ?? "basic",
      displayName: existing?.displayName ?? "",
      maxProperties: String(existing?.maxProperties ?? 5),
      monthlyCredits: String(existing?.monthlyCredits ?? 0),
      priceMonthly: existing?.priceMonthly ?? "0.00",
      priceYearly: existing?.priceYearly ?? "0.00",
    });
    setActive(existing?.isActive ?? true);
    setFailure(null);
  }

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Modal
      open={plan != null}
      onClose={onClose}
      title={existing ? `Edit ${existing.displayName}` : "New plan"}
      description="Tier is unique and cannot be changed after creation. Plans are deactivated, never deleted."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={busy || !form.displayName}
            onClick={async () => {
              setBusy(true);
              setFailure(null);
              const body = {
                displayName: form.displayName,
                maxProperties: Number(form.maxProperties),
                monthlyCredits: Number(form.monthlyCredits),
                priceMonthly: form.priceMonthly,
                priceYearly: form.priceYearly,
                isActive: active,
                ...(existing ? {} : { tier: form.tier }),
              };
              try {
                if (existing) await updateSubscriptionPlan(existing.id, body);
                else await createSubscriptionPlan(body);
                onDone();
                onClose();
              } catch (caught) {
                setFailure(caught instanceof ApiError ? caught : new ApiError(0, "Could not save"));
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Saving…" : existing ? "Save plan" : "Create plan"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {failure && <InlineError error={failure} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Display name">
            <Input value={form.displayName ?? ""} onChange={(e) => set("displayName", e.target.value)} />
          </Field>
          <Field label="Tier" hint={existing ? "Fixed after creation." : undefined}>
            <Select
              value={form.tier ?? "basic"}
              disabled={Boolean(existing)}
              onChange={(e) => set("tier", e.target.value)}
            >
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </Select>
          </Field>
          <Field label="Monthly price (৳)">
            <Input value={form.priceMonthly ?? ""} onChange={(e) => set("priceMonthly", e.target.value)} />
          </Field>
          <Field label="Yearly price (৳)">
            <Input value={form.priceYearly ?? ""} onChange={(e) => set("priceYearly", e.target.value)} />
          </Field>
          <Field label="Max properties">
            <Input
              type="number"
              value={form.maxProperties ?? ""}
              onChange={(e) => set("maxProperties", e.target.value)}
            />
          </Field>
          <Field label="Monthly credits">
            <Input
              type="number"
              value={form.monthlyCredits ?? ""}
              onChange={(e) => set("monthlyCredits", e.target.value)}
            />
          </Field>
        </div>
        <div className="border-line bg-surface-muted flex items-center justify-between rounded-xl border p-4">
          <div>
            <p className="text-ink text-[13px] font-medium">Available to new subscribers</p>
            <p className="text-ink-subtle text-xs">Hiding keeps existing subscribers on it.</p>
          </div>
          <Switch checked={active} onChange={setActive} label="Plan is active" />
        </div>
      </div>
    </Modal>
  );
}

function AssignPlanModal({
  subscription,
  plans,
  onClose,
  onDone,
}: {
  subscription: AdminSubscription | null;
  plans: AdminSubscriptionPlan[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [planId, setPlanId] = useState("");
  const [reason, setReason] = useState("");
  const [seeded, setSeeded] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiError | null>(null);

  if (subscription && subscription.id !== seeded) {
    setSeeded(subscription.id);
    setPlanId(String(subscription.plan.id));
    setFailure(null);
  }

  return (
    <Modal
      open={subscription != null}
      onClose={onClose}
      size="sm"
      title={subscription ? `Change plan for ${subscription.user.fullName}` : ""}
      description="Property locks are recalculated immediately — a downgrade locks the newest properties over the limit."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={busy || !planId}
            onClick={async () => {
              if (!subscription) return;
              setBusy(true);
              setFailure(null);
              try {
                await setUserSubscription(subscription.user.id, {
                  planId: Number(planId),
                  reason: reason || undefined,
                });
                onDone();
                onClose();
                setReason("");
              } catch (caught) {
                setFailure(caught instanceof ApiError ? caught : new ApiError(0, "Could not assign"));
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Saving…" : "Assign plan"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {failure && <InlineError error={failure} />}
        <Field label="Plan">
          <Select value={planId} onChange={(e) => setPlanId(e.target.value)}>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.displayName} — {number(plan.maxProperties)} properties
                {plan.isActive ? "" : " (hidden)"}
              </option>
            ))}
          </Select>
        </Field>
        {subscription && (
          <p className="text-ink-subtle text-xs">
            Currently using {subscription.propertiesUsed} of{" "}
            {number(subscription.plan.maxProperties)} properties.
          </p>
        )}
        <Field label="Reason" hint="Optional, stored on the audit log.">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Promo" />
        </Field>
      </div>
    </Modal>
  );
}
