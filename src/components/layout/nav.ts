import {
  Banknote, Bell, Building2, CalendarCheck, Coins, CreditCard, FileText, Gavel, LayoutDashboard,
  MapPinned, MessageSquare, Receipt, Settings, ShieldCheck, Store, Tags, Ticket, TrendingUp,
  Users, Wrench, ScrollText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PermissionCode } from "@/lib/api/admin-types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Hidden unless the admin holds at least one of these. Omitted = always shown. */
  permissions?: PermissionCode[];
  /** Pending-work counter shown as a pill in the sidebar. */
  badgeKey?: BadgeKey;
  /** Reads a user-scoped endpoint because the admin API has no equivalent yet. */
  landlordScoped?: boolean;
}

export type BadgeKey =
  | "pendingBookings"
  | "billsToVerify"
  | "providerApplications"
  | "openModeration"
  | "unreadNotifications";

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, permissions: ["dashboard.view"] },
      { href: "/reports", label: "Reports", icon: TrendingUp, permissions: ["analytics.view"] },
    ],
  },
  {
    title: "Portfolio",
    items: [
      { href: "/properties", label: "Properties", icon: Building2, permissions: ["listings.view"] },
      { href: "/marketplace", label: "Marketplace", icon: Store },
      { href: "/leases", label: "Leases", icon: FileText, permissions: ["operations.view"] },
      {
        href: "/bookings",
        label: "Bookings",
        icon: CalendarCheck,
        permissions: ["operations.view"],
        badgeKey: "pendingBookings",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        href: "/rent",
        label: "Rent & bills",
        icon: Banknote,
        permissions: ["operations.view"],
        badgeKey: "billsToVerify",
      },
      { href: "/payments", label: "Payments", icon: Receipt, permissions: ["operations.view"] },
      { href: "/promotions", label: "Promotions", icon: Ticket, permissions: ["promotions.view"] },
      { href: "/maintenance", label: "Maintenance", icon: Wrench, landlordScoped: true },
      { href: "/inquiries", label: "Inquiries", icon: MessageSquare, landlordScoped: true },
    ],
  },
  {
    title: "Trust & safety",
    items: [
      {
        href: "/service-providers",
        label: "Service providers",
        icon: ShieldCheck,
        permissions: ["providers.view"],
        badgeKey: "providerApplications",
      },
      {
        href: "/moderation",
        label: "Moderation",
        icon: Gavel,
        permissions: ["reports.view", "complaints.view"],
        badgeKey: "openModeration",
      },
    ],
  },
  {
    title: "Accounts & billing",
    items: [
      { href: "/users", label: "Users", icon: Users, permissions: ["users.view"] },
      {
        href: "/subscriptions",
        label: "Subscriptions",
        icon: CreditCard,
        permissions: ["subscriptions.view"],
      },
      { href: "/credits", label: "Credits", icon: Coins, permissions: ["credits.view"] },
    ],
  },
  {
    title: "Configuration",
    items: [
      { href: "/taxonomy", label: "Taxonomy", icon: Tags, permissions: ["listings.view"] },
      { href: "/geo", label: "Locations", icon: MapPinned, permissions: ["geo.manage"] },
      { href: "/staff", label: "Staff & roles", icon: ShieldCheck, permissions: ["staff.view"] },
      { href: "/audit", label: "Audit log", icon: ScrollText, permissions: ["audit.view"] },
      {
        href: "/notifications",
        label: "Notifications",
        icon: Bell,
        badgeKey: "unreadNotifications",
      },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

/** Flat lookup used by the command palette and the topbar breadcrumb. */
export const navItems = navSections.flatMap((section) =>
  section.items.map((item) => ({ ...item, section: section.title })),
);
