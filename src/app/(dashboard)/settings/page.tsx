"use client";

import { useState } from "react";
import {
  Building2, Coins, Database, Globe, KeyRound, Moon, Plug, Shield, Sun, Users,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch } from "@/components/ui/field";
import { Tabs } from "@/components/ui/tabs";
import { DefinitionList, PageHeader } from "@/components/ui/misc";
import { useTheme } from "@/components/layout/theme-provider";
import { API_BASE_URL } from "@/lib/api/client";

export default function SettingsPage() {
  const [tab, setTab] = useState("platform");
  const { theme, toggle } = useTheme();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Platform-wide defaults, admin access and the backend this console talks to."
      />

      <Card>
        <Tabs
          items={[
            { id: "platform", label: "Platform" },
            { id: "appearance", label: "Appearance" },
            { id: "access", label: "Access & roles" },
            { id: "integrations", label: "Integrations" },
          ]}
          value={tab}
          onChange={setTab}
          className="px-3"
        />

        {tab === "platform" && (
          <CardBody className="space-y-8">
            <section>
              <h2 className="text-ink flex items-center gap-2 text-[15px] font-semibold">
                <Coins className="size-4" /> Credit economy
              </h2>
              <p className="text-ink-muted mt-1 text-[13px]">
                Costs applied when users spend credits. Changing these affects new actions only.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Field label="Marketplace unlock cost" hint="Credits per address + contact unlock.">
                  <Input type="number" defaultValue={2} />
                </Field>
                <Field label="Signup bonus credits">
                  <Input type="number" defaultValue={5} />
                </Field>
                <Field label="Credit expiry (days)" hint="0 means promotional credits never expire.">
                  <Input type="number" defaultValue={90} />
                </Field>
              </div>
            </section>

            <section className="border-line border-t pt-6">
              <h2 className="text-ink flex items-center gap-2 text-[15px] font-semibold">
                <Building2 className="size-4" /> Properties & bookings
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Field label="Default cancellation window (hours)">
                  <Input type="number" defaultValue={48} />
                </Field>
                <Field label="Max images per property">
                  <Input type="number" defaultValue={25} />
                </Field>
                <Field label="Default page size">
                  <Select defaultValue="20">
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </Select>
                </Field>
              </div>
              <div className="mt-4 space-y-3">
                <ToggleRow
                  title="Auto-expire leases past their end date"
                  description="Runs nightly and moves active leases to expired."
                  defaultOn
                />
                <ToggleRow
                  title="Require payment proof before marking rent paid"
                  description="Landlords cannot mark a bill paid without a tenant-submitted proof."
                  defaultOn
                />
                <ToggleRow
                  title="Allow manual bookings without a customer account"
                  description="Lets landlords record walk-in bookings by name and phone only."
                  defaultOn
                />
                <ToggleRow
                  title="Auto-approve bookings when payment clears"
                  description="Skips landlord confirmation for fully paid bookings."
                />
              </div>
            </section>

            <section className="border-line border-t pt-6">
              <h2 className="text-ink flex items-center gap-2 text-[15px] font-semibold">
                <Users className="size-4" /> Verification
              </h2>
              <div className="mt-4 space-y-3">
                <ToggleRow
                  title="Require National ID for landlord verification"
                  description="Unverified landlords cannot list in the marketplace."
                  defaultOn
                />
                <ToggleRow
                  title="Require document review for service providers"
                  description="New providers stay in pending verification until an admin approves."
                  defaultOn
                />
              </div>
            </section>

            <div className="border-line flex items-center justify-end gap-2 border-t pt-6">
              <Button>Discard changes</Button>
              <Button variant="primary">Save settings</Button>
            </div>
          </CardBody>
        )}

        {tab === "appearance" && (
          <CardBody className="space-y-6">
            <section>
              <h2 className="text-ink text-[15px] font-semibold">Theme</h2>
              <p className="text-ink-muted mt-1 text-[13px]">
                Stored per browser; the console follows your system preference until you choose.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => theme === "dark" && toggle()}
                  className={`focus-ring flex-1 rounded-xl border p-4 text-left transition-colors ${
                    theme === "light" ? "border-brand bg-brand-soft/50" : "border-line-strong"
                  }`}
                >
                  <Sun className="text-ink-muted size-4" />
                  <p className="text-ink mt-2 text-[13px] font-medium">Light</p>
                  <p className="text-ink-subtle text-xs">Neutral slate surfaces.</p>
                </button>
                <button
                  type="button"
                  onClick={() => theme === "light" && toggle()}
                  className={`focus-ring flex-1 rounded-xl border p-4 text-left transition-colors ${
                    theme === "dark" ? "border-brand bg-brand-soft/50" : "border-line-strong"
                  }`}
                >
                  <Moon className="text-ink-muted size-4" />
                  <p className="text-ink mt-2 text-[13px] font-medium">Dark</p>
                  <p className="text-ink-subtle text-xs">Low-glare for long sessions.</p>
                </button>
              </div>
            </section>

            <section className="border-line border-t pt-6">
              <h2 className="text-ink text-[15px] font-semibold">Density & formats</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Field label="Table density">
                  <Select defaultValue="comfortable">
                    <option value="compact">Compact</option>
                    <option value="comfortable">Comfortable</option>
                  </Select>
                </Field>
                <Field label="Currency">
                  <Select defaultValue="BDT">
                    <option value="BDT">৳ Bangladeshi taka</option>
                    <option value="USD">$ US dollar</option>
                  </Select>
                </Field>
                <Field label="Date format">
                  <Select defaultValue="dmy">
                    <option value="dmy">17 Oct 2026</option>
                    <option value="iso">2026-10-17</option>
                  </Select>
                </Field>
              </div>
            </section>
          </CardBody>
        )}

        {tab === "access" && (
          <CardBody className="space-y-6">
            <section>
              <h2 className="text-ink flex items-center gap-2 text-[15px] font-semibold">
                <Shield className="size-4" /> Admin accounts
              </h2>
              <p className="text-ink-muted mt-1 text-[13px]">
                Console access is granted to Django staff users. Object-level permissions still
                apply to landlord and tenant data.
              </p>
              <ul className="divide-line mt-4 divide-y">
                {[
                  { name: "Rafid Mostafa", email: "admin@nextholder.app", role: "Superuser" },
                  { name: "Support desk", email: "support@nextholder.app", role: "Staff" },
                  { name: "Finance", email: "finance@nextholder.app", role: "Staff (read-only)" },
                ].map((admin) => (
                  <li key={admin.email} className="flex items-center gap-3 py-3 first:pt-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-ink text-[13px] font-medium">{admin.name}</p>
                      <p className="text-ink-subtle truncate text-xs">{admin.email}</p>
                    </div>
                    <Badge tone={admin.role === "Superuser" ? "brand" : "neutral"}>
                      {admin.role}
                    </Badge>
                    <Button size="sm" variant="ghost">
                      Manage
                    </Button>
                  </li>
                ))}
              </ul>
              <Button className="mt-4">Invite an admin</Button>
            </section>

            <section className="border-line border-t pt-6">
              <h2 className="text-ink flex items-center gap-2 text-[15px] font-semibold">
                <KeyRound className="size-4" /> Session & tokens
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Field label="Access token lifetime (minutes)">
                  <Input type="number" defaultValue={60} />
                </Field>
                <Field label="Refresh token lifetime (days)">
                  <Input type="number" defaultValue={7} />
                </Field>
                <Field label="Password reset code expiry (minutes)">
                  <Input type="number" defaultValue={15} />
                </Field>
              </div>
              <div className="mt-4 space-y-3">
                <ToggleRow
                  title="Rotate refresh tokens on use"
                  description="Each refresh issues a new token and blacklists the old one."
                  defaultOn
                />
                <ToggleRow
                  title="Require re-authentication for destructive actions"
                  description="Asks for the admin password before terminating leases or deleting data."
                />
              </div>
            </section>
          </CardBody>
        )}

        {tab === "integrations" && (
          <CardBody className="space-y-6">
            <section>
              <h2 className="text-ink flex items-center gap-2 text-[15px] font-semibold">
                <Globe className="size-4" /> Backend connection
              </h2>
              <p className="text-ink-muted mt-1 text-[13px]">
                Set with <code className="font-mono text-xs">NEXT_PUBLIC_API_BASE_URL</code>.
              </p>
              <div className="mt-4">
                <DefinitionList
                  items={[
                    { label: "API base URL", value: <code className="font-mono text-xs">{API_BASE_URL}</code> },
                    { label: "API version", value: "v1" },
                    { label: "Auth scheme", value: "JWT bearer (Simple JWT)" },
                    { label: "Schema", value: <code className="font-mono text-xs">/api/schema</code> },
                    { label: "Swagger UI", value: <code className="font-mono text-xs">/api/docs</code> },
                    { label: "Health check", value: <code className="font-mono text-xs">/health</code> },
                  ]}
                />
              </div>
            </section>

            <section className="border-line border-t pt-6">
              <h2 className="text-ink flex items-center gap-2 text-[15px] font-semibold">
                <Plug className="size-4" /> Services
              </h2>
              <ul className="divide-line mt-4 divide-y">
                {[
                  { name: "Cloudinary", purpose: "Property images, videos and documents", state: "Connected", tone: "ok" as const },
                  { name: "Payment gateway", purpose: "Booking and subscription payments", state: "Webhook only", tone: "warn" as const },
                  { name: "Email delivery", purpose: "Lease and billing notifications", state: "Templates ready, sender unset", tone: "warn" as const },
                  { name: "Redis cache", purpose: "Marketplace listing cache", state: "Not configured", tone: "neutral" as const },
                  { name: "Sentry", purpose: "Error monitoring", state: "Not configured", tone: "neutral" as const },
                  { name: "Celery", purpose: "Lease expiry and billing cron jobs", state: "Not configured", tone: "neutral" as const },
                ].map((service) => (
                  <li key={service.name} className="flex items-center gap-3 py-3 first:pt-0">
                    <span className="bg-surface-hover text-ink-subtle grid size-8 shrink-0 place-items-center rounded-lg">
                      <Database className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-ink text-[13px] font-medium">{service.name}</p>
                      <p className="text-ink-subtle truncate text-xs">{service.purpose}</p>
                    </div>
                    <Badge tone={service.tone}>{service.state}</Badge>
                    <Button size="sm" variant="ghost">
                      Configure
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          </CardBody>
        )}
      </Card>
    </>
  );
}

function ToggleRow({
  title,
  description,
  defaultOn = false,
}: {
  title: string;
  description: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="border-line bg-surface-muted flex items-center justify-between gap-4 rounded-xl border p-4">
      <div className="min-w-0">
        <p className="text-ink text-[13px] font-medium">{title}</p>
        <p className="text-ink-subtle mt-0.5 text-xs leading-5">{description}</p>
      </div>
      <Switch checked={on} onChange={setOn} label={title} />
    </div>
  );
}
