"use client";

import Link from "next/link";
import { LockKeyhole, PlugZap, ShieldAlert } from "lucide-react";
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

/** The backend answers, but has no `/admin/` namespace. */
export function NoAdminApi({ baseUrl }: { baseUrl: string }) {
  return (
    <div className="grid min-h-dvh place-items-center px-5">
      <Card className="w-full max-w-lg">
        <CardBody className="py-10">
          <EmptyState
            icon={<PlugZap className="size-5" />}
            title="This backend has no admin API"
            description="The console needs /api/v1/admin/, which ships on the backend's dev branch. The server answered but returned 404 for every admin route, so it is running an older build."
          />
          <div className="border-line bg-surface-muted mt-5 rounded-xl border p-3.5">
            <p className="text-ink-subtle text-xs">Currently pointed at</p>
            <p className="text-ink mt-1 font-mono text-[13px] break-all">{baseUrl}</p>
          </div>
          <p className="text-ink-muted mt-4 text-[13px] leading-6">
            Deploy the <code className="font-mono text-xs">dev</code> branch there and run its
            migrations, or set <code className="font-mono text-xs">NEXT_PUBLIC_API_BASE_URL</code>{" "}
            back to a server that has it and restart the dev server.
          </p>
        </CardBody>
      </Card>
    </div>
  );
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
