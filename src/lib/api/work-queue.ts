"use client";

import { useCallback } from "react";
import { useApi } from "./hooks";
import { listAdminBookings, listAdminRentBills, getDashboardStats } from "./admin";
import { listNotifications } from "./resources";
import { useAdminSession } from "./admin-session";
import type { BadgeKey } from "@/components/layout/nav";

export type WorkQueue = Partial<Record<BadgeKey, number>>;

/**
 * Counts for the sidebar's pending-work pills. Mounted once by the dashboard
 * layout, so this runs per session rather than per navigation. Each request is
 * allowed to fail quietly — a missing permission should not blank the nav.
 */
export function useWorkQueue(): WorkQueue {
  const { can } = useAdminSession();
  const quiet = <T,>(promise: Promise<T>) => promise.catch(() => null);

  const stats = useApi(
    useCallback(
      () => (can("dashboard.view") ? quiet(getDashboardStats()) : Promise.resolve(null)),
      [can],
    ),
  );
  const bookings = useApi(
    useCallback(
      () =>
        can("operations.view")
          ? quiet(listAdminBookings({ status: "pending", page_size: 1 }))
          : Promise.resolve(null),
      [can],
    ),
  );
  const bills = useApi(
    useCallback(
      () =>
        can("operations.view")
          ? quiet(listAdminRentBills({ status: "pending_verification", page_size: 1 }))
          : Promise.resolve(null),
      [can],
    ),
  );
  const notifications = useApi(
    useCallback(() => quiet(listNotifications({ status: "unread" })), []),
  );

  const moderation = stats.data?.moderation;

  return {
    pendingBookings: bookings.data?.count ?? stats.data?.bookings.pending,
    billsToVerify: bills.data?.count,
    providerApplications: moderation?.pendingProviderApplications,
    openModeration:
      moderation != null
        ? moderation.openProvisionalReports + moderation.openComplaints
        : undefined,
    unreadNotifications: notifications.data?.count,
  };
}
