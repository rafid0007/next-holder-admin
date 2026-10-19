"use client";

import Link from "next/link";
import { LockKeyhole, ShieldAlert } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { CardSkeleton } from "@/components/ui/states";
import { useAdminSession } from "@/lib/api/admin-session";
import type { PermissionCode } from "@/lib/api/admin-types";

/**
 * Wraps a page so it renders only for an admin holding `codes`. Without the
 * permission the page says so rather than firing requests that 403.
 */
export function RequirePermission({
  codes,
  children,
}: {
  codes: PermissionCode[];
  children: React.ReactNode;
}) {
  const { ready, can, me } = useAdminSession();

  if (!ready) {
    return (
      <Card>
        <CardSkeleton />
      </Card>
    );
  }

  if (!me) return null; // the layout already shows the no-access screen

  if (!can(...codes)) {
    return (
      <Card>
        <CardBody className="py-12">
          <EmptyState
            icon={<LockKeyhole className="size-5" />}
            title="You do not have access to this page"
            description={`It needs the ${codes.join(" and ")} permission. Ask a super admin to add it to one of your roles.`}
            action={
              <Link href="/">
                <Button>Back to dashboard</Button>
              </Link>
            }
          />
        </CardBody>
      </Card>
    );
  }

  return <>{children}</>;
}

/** Full-screen state for a signed-in user who is not an admin at all. */
export function NoAdminAccess({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="grid min-h-dvh place-items-center px-5">
      <Card className="w-full max-w-md">
        <CardBody className="py-10">
          <EmptyState
            icon={<ShieldAlert className="size-5" />}
            title="This account is not an admin"
            description="Admin access needs a staff account with at least one role. A super admin can grant one from Staff & roles."
            action={
              <Button variant="primary" onClick={onSignOut}>
                Sign out
              </Button>
            }
          />
        </CardBody>
      </Card>
    </div>
  );
}
