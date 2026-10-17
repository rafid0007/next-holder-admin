"use client";

import { useState } from "react";
import { Check, CreditCard, Pencil, Plus, TrendingUp, X } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable } from "@/components/ui/table";
import { PageHeader, Progress, StatCard, UserCell } from "@/components/ui/misc";
import { BarChart } from "@/components/charts/bar-chart";
import { monthLabels, revenueSeries, subscriptionPlans, userSubscriptions } from "@/lib/mock/data";
import type { SubscriptionPlan } from "@/lib/api/types";
import { cn, formatDate, humanize, money, number } from "@/lib/utils";

const featureLabels: Record<string, string> = {
  marketplaceListing: "Marketplace listing",
  support: "Support",
  bookingTools: "Booking tools",
  analytics: "Analytics & reports",
};

export default function SubscriptionsPage() {
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const totalSubscribers = subscriptionPlans.reduce((sum, p) => sum + (p.subscribers ?? 0), 0);
  const mrr = subscriptionPlans.reduce(
    (sum, p) => sum + p.priceMonthly * (p.subscribers ?? 0),
    0,
  );
  const paying = subscriptionPlans
    .filter((p) => p.tier !== "free")
    .reduce((sum, p) => sum + (p.subscribers ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Subscriptions"
        description="Plan tiers, their property limits and monthly credit allowances, plus who is on each."
        actions={
          <Button variant="primary">
            <Plus className="size-4" /> New plan
          </Button>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Monthly recurring revenue"
          value={money(mrr)}
          delta={7.4}
          icon={<CreditCard className="size-4" />}
          trend={revenueSeries.subscriptions}
        />
        <StatCard label="Total subscribers" value={number(totalSubscribers)} delta={5.9} />
        <StatCard
          label="Paying subscribers"
          value={number(paying)}
          hint={`${Math.round((paying / totalSubscribers) * 100)}% conversion`}
          icon={<TrendingUp className="size-4" />}
        />
        <StatCard
          label="Average revenue per user"
          value={money(Math.round(mrr / totalSubscribers))}
          delta={1.8}
        />
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {subscriptionPlans.map((plan) => (
          <Card key={plan.id} className={cn("flex flex-col", plan.tier === "premium" && "border-brand/40")}>
            <CardBody className="flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-ink text-[15px] font-semibold">{plan.displayName}</p>
                  <p className="text-ink-subtle text-xs">{humanize(plan.tier)} tier</p>
                </div>
                {plan.tier === "premium" && <Badge tone="brand">Most popular</Badge>}
              </div>

              <p className="text-ink mt-4 text-2xl font-semibold tabular-nums">
                {plan.priceMonthly === 0 ? "Free" : money(plan.priceMonthly)}
                {plan.priceMonthly > 0 && (
                  <span className="text-ink-subtle text-sm font-normal">/mo</span>
                )}
              </p>
              {plan.priceYearly > 0 && (
                <p className="text-ink-subtle text-xs">
                  or {money(plan.priceYearly)}/year — 2 months free
                </p>
              )}

              <ul className="mt-4 space-y-2 text-[13px]">
                <li className="text-ink-muted flex items-center gap-2">
                  <Check className="text-ok size-3.5 shrink-0" />
                  {number(plan.maxProperties)} properties
                </li>
                <li className="text-ink-muted flex items-center gap-2">
                  <Check className="text-ok size-3.5 shrink-0" />
                  {number(plan.monthlyCredits)} credits monthly
                </li>
                {Object.entries(plan.features).map(([key, value]) => (
                  <li key={key} className="text-ink-muted flex items-center gap-2">
                    {value === false ? (
                      <X className="text-ink-subtle size-3.5 shrink-0" />
                    ) : (
                      <Check className="text-ok size-3.5 shrink-0" />
                    )}
                    <span className={value === false ? "text-ink-subtle line-through" : undefined}>
                      {featureLabels[key] ?? humanize(key)}
                      {typeof value === "string" && `: ${value}`}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="border-line mt-5 border-t pt-4">
                <Progress
                  value={plan.subscribers ?? 0}
                  max={totalSubscribers}
                  label={`${number(plan.subscribers)} subscribers`}
                  tone="brand"
                />
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Button size="sm" className="flex-1 justify-center" onClick={() => setEditing(plan)}>
                  <Pencil className="size-3.5" /> Edit
                </Button>
                <Badge tone={plan.isActive ? "ok" : "neutral"}>
                  {plan.isActive ? "Active" : "Hidden"}
                </Badge>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Subscription revenue"
            description="Monthly plan income across all tiers."
          />
          <CardBody>
            <BarChart
              labels={monthLabels}
              series={[
                { name: "Subscriptions", color: "var(--brand)", values: revenueSeries.subscriptions },
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Plan distribution" description="Share of all subscribers." />
          <CardBody className="space-y-3.5">
            {subscriptionPlans.map((plan, index) => (
              <div key={plan.id}>
                <div className="mb-1 flex items-baseline justify-between text-[13px]">
                  <span className="text-ink font-medium">{plan.displayName}</span>
                  <span className="text-ink-muted tabular-nums">
                    {Math.round(((plan.subscribers ?? 0) / totalSubscribers) * 100)}%
                  </span>
                </div>
                <Progress
                  value={plan.subscribers ?? 0}
                  max={totalSubscribers}
                  tone={(["brand", "ok", "warn", "bad"] as const)[index % 4]}
                />
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Subscriber accounts"
          description="Individual subscriptions, their renewal state and property usage."
        />
        <DataTable
          rows={userSubscriptions}
          rowKey={(row) => row.id}
          pageSize={8}
          columns={[
            {
              key: "user",
              header: "Subscriber",
              sortValue: (row) => row.user.fullName,
              cell: (row) => <UserCell name={row.user.fullName} meta={row.user.email} />,
            },
            {
              key: "plan",
              header: "Plan",
              cell: (row) => <Badge tone="brand">{row.plan.displayName}</Badge>,
            },
            {
              key: "usage",
              header: "Property usage",
              hideOnMobile: true,
              cell: (row) => {
                const plan = subscriptionPlans.find((p) => p.id === row.plan.id)!;
                return (
                  <span className="block w-36">
                    <Progress
                      value={row.propertiesUsed}
                      max={plan.maxProperties}
                      tone={row.propertiesUsed >= plan.maxProperties ? "bad" : "brand"}
                      label={`${row.propertiesUsed} / ${number(plan.maxProperties)}`}
                    />
                  </span>
                );
              },
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
                <Badge tone={row.isActive ? "ok" : "bad"}>
                  {row.isActive ? "Active" : "Lapsed"}
                </Badge>
              ),
            },
            {
              key: "actions",
              header: "",
              align: "right",
              cell: (row) => (
                <Button size="sm" variant="ghost">
                  {row.isActive ? "Change plan" : "Reactivate"}
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <EditPlanModal plan={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function EditPlanModal({ plan, onClose }: { plan: SubscriptionPlan | null; onClose: () => void }) {
  const [active, setActive] = useState(true);

  return (
    <Modal
      open={plan != null}
      onClose={onClose}
      title={plan ? `Edit ${plan.displayName}` : ""}
      description="Changes apply to new billing cycles; existing subscribers keep their current limits until renewal."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onClose}>
            Save plan
          </Button>
        </>
      }
    >
      {plan && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Display name">
              <Input defaultValue={plan.displayName} />
            </Field>
            <Field label="Tier">
              <Select defaultValue={plan.tier}>
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </Select>
            </Field>
            <Field label="Monthly price (৳)">
              <Input type="number" defaultValue={plan.priceMonthly} />
            </Field>
            <Field label="Yearly price (৳)">
              <Input type="number" defaultValue={plan.priceYearly} />
            </Field>
            <Field label="Max properties" hint="Enforced when a landlord creates a property.">
              <Input type="number" defaultValue={plan.maxProperties} />
            </Field>
            <Field label="Monthly credits">
              <Input type="number" defaultValue={plan.monthlyCredits} />
            </Field>
          </div>

          <div className="border-line bg-surface-muted flex items-center justify-between rounded-xl border p-4">
            <div>
              <p className="text-ink text-[13px] font-medium">Available for new subscribers</p>
              <p className="text-ink-subtle text-xs">
                Hiding a plan keeps existing subscribers on it.
              </p>
            </div>
            <Switch checked={active} onChange={setActive} label="Plan is active" />
          </div>
        </div>
      )}
    </Modal>
  );
}
