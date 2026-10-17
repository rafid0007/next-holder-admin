import {
  Banknote,
  Bell,
  Building2,
  CalendarCheck,
  Coins,
  CreditCard,
  FileText,
  LayoutDashboard,
  MapPinned,
  MessageSquare,
  Settings,
  Store,
  Tags,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Pending-work counter shown as a pill in the sidebar. */
  badgeKey?: BadgeKey;
}

export type BadgeKey =
  | "pendingLeases"
  | "pendingBookings"
  | "billsToVerify"
  | "openMaintenance"
  | "openInquiries"
  | "providerApplications"
  | "unreadNotifications";

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Portfolio",
    items: [
      { href: "/properties", label: "Properties", icon: Building2 },
      { href: "/marketplace", label: "Marketplace", icon: Store },
      { href: "/leases", label: "Leases", icon: FileText, badgeKey: "pendingLeases" },
      { href: "/bookings", label: "Bookings", icon: CalendarCheck, badgeKey: "pendingBookings" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/rent", label: "Rent & bills", icon: Banknote, badgeKey: "billsToVerify" },
      { href: "/maintenance", label: "Maintenance", icon: Wrench, badgeKey: "openMaintenance" },
      { href: "/inquiries", label: "Inquiries", icon: MessageSquare, badgeKey: "openInquiries" },
      {
        href: "/service-providers",
        label: "Service providers",
        icon: Users,
        badgeKey: "providerApplications",
      },
    ],
  },
  {
    title: "Accounts & billing",
    items: [
      { href: "/users", label: "Users", icon: Users },
      { href: "/subscriptions", label: "Subscriptions", icon: CreditCard },
      { href: "/credits", label: "Credits", icon: Coins },
    ],
  },
  {
    title: "Configuration",
    items: [
      { href: "/taxonomy", label: "Taxonomy", icon: Tags },
      { href: "/geo", label: "Locations", icon: MapPinned },
      { href: "/notifications", label: "Notifications", icon: Bell, badgeKey: "unreadNotifications" },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

/** Flat lookup used by the command palette and the topbar breadcrumb. */
export const navItems = navSections.flatMap((section) =>
  section.items.map((item) => ({ ...item, section: section.title })),
);
