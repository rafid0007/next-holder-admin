"use client";

import { useState } from "react";
import { KeyRound, Mail, UserRound } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Avatar, DefinitionList, PageHeader } from "@/components/ui/misc";
import { CardSkeleton } from "@/components/ui/states";
import { useAdminSession } from "@/lib/api/admin-session";
import { ApiError, fieldErrors } from "@/lib/api/client";
import { changeEmail, changePassword } from "@/lib/api/resources";
import { adminRoleLabel } from "@/lib/utils";

export default function AccountPage() {
  const { me } = useAdminSession();

  if (!me) {
    return <CardSkeleton />;
  }

  return (
    <>
      <PageHeader title="Account" description="Your own sign-in details for the console." />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card>
          <CardBody className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={me.fullName || me.email} size="lg" />
              <div className="min-w-0">
                <p className="text-ink truncate text-[15px] font-semibold">{me.fullName || "—"}</p>
                <p className="text-ink-subtle truncate text-[13px]">{me.email}</p>
              </div>
            </div>
            <DefinitionList
              items={[
                { label: "Access", value: <Badge tone={me.isSuperuser ? "brand" : "neutral"}>{adminRoleLabel(me)}</Badge> },
                {
                  label: "Staff roles",
                  value: me.roles.length ? me.roles.map((role) => role.name).join(", ") : "—",
                },
              ]}
            />
          </CardBody>
        </Card>

        <div className="space-y-5">
          <ChangeEmailCard currentEmail={me.email} />
          <ChangePasswordCard />
        </div>
      </div>
    </>
  );
}

function SectionTitle({ icon: Icon, title, description }: {
  icon: typeof UserRound;
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-ink flex items-center gap-2 text-[15px] font-semibold">
        <Icon className="size-4" /> {title}
      </h2>
      <p className="text-ink-muted mt-1 text-[13px]">{description}</p>
    </div>
  );
}

/** Generic message for errors that aren't tied to one field. */
function formError(error: ApiError | null, fields: Record<string, string>, known: string[]) {
  if (!error) return null;
  const unclaimed = Object.entries(fields).filter(([key]) => !known.includes(key));
  if (unclaimed.length) return unclaimed.map(([, message]) => message).join(" ");
  return Object.keys(fields).length ? null : error.message;
}

function ChangeEmailCard({ currentEmail }: { currentEmail: string }) {
  const { refetch } = useAdminSession();
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const errors = error ? fieldErrors(error) : {};
  const general = formError(error, errors, ["newEmail", "currentPassword"]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setDone(null);
    try {
      const user = await changeEmail({ currentPassword, newEmail });
      setDone(`Your email is now ${user.email}. Use it the next time you sign in.`);
      setNewEmail("");
      setCurrentPassword("");
      refetch();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError(0, "Could not change your email."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={submit} className="space-y-4">
          <SectionTitle
            icon={Mail}
            title="Email address"
            description={`You sign in with ${currentEmail}. Confirm with your password to change it.`}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="New email" error={errors.newEmail}>
              <Input
                type="email"
                autoComplete="email"
                required
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
              />
            </Field>
            <Field label="Current password" error={errors.currentPassword}>
              <Input
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </Field>
          </div>
          {general && <p className="text-bad text-xs">{general}</p>}
          {done && <p className="text-ok text-xs">{done}</p>}
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={saving || !newEmail || !currentPassword}>
              {saving ? "Saving…" : "Change email"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [done, setDone] = useState(false);

  const errors = error ? fieldErrors(error) : {};
  const general = formError(error, errors, ["currentPassword", "newPassword", "confirmNewPassword"]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setDone(false);
    try {
      await changePassword({ currentPassword, newPassword, confirmNewPassword });
      setDone(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError(0, "Could not change your password."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={submit} className="space-y-4">
          <SectionTitle
            icon={KeyRound}
            title="Password"
            description="Changing it signs you out everywhere else; this browser stays signed in."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Current password" error={errors.currentPassword}>
              <Input
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </Field>
            <Field label="New password" error={errors.newPassword}>
              <Input
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </Field>
            <Field label="Confirm new password" error={errors.confirmNewPassword}>
              <Input
                type="password"
                autoComplete="new-password"
                required
                value={confirmNewPassword}
                onChange={(event) => setConfirmNewPassword(event.target.value)}
              />
            </Field>
          </div>
          {general && <p className="text-bad text-xs">{general}</p>}
          {done && <p className="text-ok text-xs">Password changed.</p>}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={saving || !currentPassword || !newPassword || !confirmNewPassword}
            >
              {saving ? "Saving…" : "Change password"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
