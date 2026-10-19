"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, CreditCard, Pencil, Plus, TrendingUp, X } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DefinitionList, EmptyState, PageHeader } from "@/components/ui/misc";
import { CardSkeleton, ErrorState } from "@/components/ui/states";
import { useApi } from "@/lib/api/hooks";
import { getMySubscription, listSubscriptionPlans } from "@/lib/api/resources";
import type { ApiSubscriptionPlan } from "@/lib/api/types";
import { cn, formatDate, humanize, money, number } from "@/lib/utils";

export default function SubscriptionsPage() {
  const [editing, setEditing] = useState<ApiSubscriptionPlan | null>(null);

  const planFeed = useApi(useCallback(() => listSubscriptionPlans(), []));
  // There is no endpoint listing everyone's subscriptions, only the caller's.
  const mine = useApi(useCallback(() => getMySubscription().catch(() => null), []));

  const plans = useMemo(() => planFeed.data ?? [], [planFeed.data]);

  return (
    <>
      <PageHeader
        title="Subscriptions"
        description="Plan tiers, their property limits and monthly credit allowances."
        actions={
          <Button variant="primary">
            <Plus className="size-4" /> New plan
          </Button>
        }
      />

      {planFeed.error ? (
        <Card>
          <CardBody className="py-10">
            <ErrorState error={planFeed.error} onRetry={planFeed.refetch} resource="plans" />
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {planFeed.loading && !planFeed.data
              ? Array.from({ length: 4 }, (_, i) => (
                  <Card key={i}>
                    <CardSkeleton />
                  </Card>
                ))
              : plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={cn("flex flex-col", plan.tier === "premium" && "border-brand/40")}
                  >
                    <CardBody className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-ink text-[15px] font-semibold">{plan.displayName}</p>
                          <p className="text-ink-subtle text-xs">{humanize(plan.tier)} tier</p>
                        </div>
                        {mine.data?.plan.id === plan.id && <Badge tone="brand">Your plan</Badge>}
                      </div>

                      <p className="text-ink mt-4 text-2xl font-semibold tabular-nums">
                        {Number(plan.priceMonthly) === 0 ? "Free" : money(plan.priceMonthly)}
                        {Number(plan.priceMonthly) > 0 && (
                          <span className="text-ink-subtle text-sm font-normal">/mo</span>
                        )}
                      </p>
                      {Number(plan.priceYearly) > 0 && (
                        <p className="text-ink-subtle text-xs">
                          or {money(plan.priceYearly)}/year
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
                        {Object.entries(plan.features ?? {}).map(([key, value]) => (
                          <li key={key} className="text-ink-muted flex items-center gap-2">
                            {value === false ? (
                              <X className="text-ink-subtle size-3.5 shrink-0" />
                            ) : (
                              <Check className="text-ok size-3.5 shrink-0" />
                            )}
                            <span
                              className={value === false ? "text-ink-subtle line-through" : undefined}
                            >
                              {humanize(key)}
                              {typeof value === "string" && `: ${value}`}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-auto flex items-center gap-2 pt-5">
                        <Button
                          size="sm"
                          className="flex-1 justify-center"
                          onClick={() => setEditing(plan)}
                        >
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

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Your subscription"
                description="The only subscription the API exposes to a non-staff caller."
              />
              {mine.loading && !mine.data ? (
                <CardSkeleton />
              ) : mine.data ? (
                <CardBody className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-ink text-[15px] font-semibold">
                        {mine.data.plan.displayName}
                      </p>
                      <p className="text-ink-subtle text-xs">
                        {formatDate(mine.data.startDate)} →{" "}
                        {mine.data.endDate ? formatDate(mine.data.endDate) : "open"}
                      </p>
                    </div>
                    <Badge tone={mine.data.isActive ? "ok" : "bad"}>
                      {mine.data.isActive ? "Active" : "Lapsed"}
                    </Badge>
                  </div>
                  <DefinitionList
                    items={[
                      { label: "Property limit", value: number(mine.data.plan.maxProperties) },
                      { label: "Monthly credits", value: number(mine.data.plan.monthlyCredits) },
                      { label: "Auto-renew", value: mine.data.autoRenew ? "On" : "Off" },
                      { label: "Monthly price", value: money(mine.data.plan.priceMonthly) },
                    ]}
                  />
                </CardBody>
              ) : (
                <CardBody>
                  <EmptyState
                    icon={<CreditCard className="size-5" />}
                    title="No subscription"
                    description="This account is not on a plan yet."
                  />
                </CardBody>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Subscribers"
                description="Who is on each plan, across the platform."
              />
              <CardBody>
                <EmptyState
                  icon={<TrendingUp className="size-5" />}
                  title="Needs a staff endpoint"
                  description="The API exposes /subscriptions/me only. Listing every user's subscription, with counts per plan and revenue, needs a staff-scoped endpoint — see API-GAPS.md in the backend."
                />
              </CardBody>
            </Card>
          </div>
        </>
      )}

      <EditPlanModal plan={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function EditPlanModal({ plan, onClose }: { plan: ApiSubscriptionPlan | null; onClose: () => void }) {
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
