"use client";

import { useCallback } from "react";
import { useApi } from "./hooks";
import { listBills, listBookings, listInquiries, listLeases, listMaintenance, listNotifications } from "./resources";
import type { BadgeKey } from "@/components/layout/nav";

export type WorkQueue = Partial<Record<BadgeKey, number>>;

/**
 * Counts for the sidebar's pending-work pills. The sidebar is mounted once by
 * the dashboard layout, so this runs per session rather than per navigation.
 * Every request is allowed to fail quietly — a 403 on one resource should not
 * blank the whole navigation.
 */
export function useWorkQueue(): WorkQueue {
  const quiet = <T,>(promise: Promise<T>) => promise.catch(() => null);

  const leases = useApi(useCallback(() => quiet(listLeases()), []));
  const bookings = useApi(useCallback(() => quiet(listBookings({ status: "pending" })), []));
  const bills = useApi(useCallback(() => quiet(listBills({ status: "pending_verification" })), []));
  const maintenance = useApi(useCallback(() => quiet(listMaintenance({ status: "pending" })), []));
  const inquiries = useApi(useCallback(() => quiet(listInquiries({ status: "open" })), []));
  const notifications = useApi(useCallback(() => quiet(listNotifications({ status: "unread" })), []));

  return {
    pendingLeases: (leases.data?.results ?? []).filter((l) => l.status === "pending").length,
    pendingBookings: bookings.data?.count,
    billsToVerify: bills.data?.count,
    openMaintenance: maintenance.data?.count,
    openInquiries: inquiries.data?.count,
    unreadNotifications: notifications.data?.count,
  };
}
