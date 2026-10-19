/**
 * Wire types for the `/admin/` staff API, mirroring
 * `next-holder-backend/docs/admin-panel-api.md` field for field.
 * Money and decimals arrive as strings; datetimes as "2026-10-19T09:58:30+0000".
 */
import type {
  ApiBookingListItem, ApiContact, ApiLeaseListItem, ApiProperty, ApiPropertyDetail,
  ApiRentBill, ApiServiceProviderApplication, Amenity, PropertyCategory, PropertyType,
  SubscriptionTier, UserRole,
} from "./types";

/* ------------------------------ permissions ----------------------------- */

export type PermissionCode =
  | "dashboard.view" | "analytics.view" | "finance.view"
  | "users.view" | "users.suspend" | "users.verify" | "users.roles"
  | "subscriptions.view" | "subscriptions.manage" | "plans.manage"
  | "credits.view" | "credits.grant" | "credit_packages.manage"
  | "listings.view" | "listings.moderate"
  | "providers.view" | "providers.review"
  | "reports.view" | "reports.resolve"
  | "complaints.view" | "complaints.manage"
  | "operations.view" | "promotions.view" | "promotions.manage"
  | "taxonomy.manage" | "geo.manage"
  | "staff.view" | "staff.manage" | "audit.view";

export interface AdminRoleRef {
  id: number;
  name: string;
  slug: string;
}

export interface AdminMe {
  id: number;
  fullName: string;
  email: string;
  isSuperuser: boolean;
  roles: AdminRoleRef[];
  permissions: PermissionCode[];
}

export interface PermissionCatalogEntry {
  code: PermissionCode;
  group: string;
  label: string;
}

export interface StaffRole {
  id: number;
  name: string;
  slug: string;
  description: string;
  permissions: PermissionCode[];
  isSystem: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StaffMember {
  id: number;
  fullName: string;
  email: string;
  isSuperuser: boolean;
  isActive: boolean;
  lastLogin: string | null;
  roles: AdminRoleRef[];
}

/* -------------------------------- audit --------------------------------- */

export interface AuditLogEntry {
  id: number;
  actorId: number | null;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  targetRepr: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  reason: string;
  metadata: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

/* -------------------------------- users --------------------------------- */

export interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  phoneNumber: string;
  roles: UserRole[];
  currentRole: UserRole;
  profileImage: string | null;
  isVerified: boolean;
  isActive: boolean;
  isProvisional: boolean;
  createdAt: string;
  isStaff: boolean;
  isSuperuser: boolean;
  suspendedAt: string | null;
  lastLogin: string | null;
}

export interface AdminUserSubscriptionRef {
  id: number;
  planId: number;
  tier: string;
  displayName: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  autoRenew: boolean;
}

export interface AdminUserDetail extends AdminUser {
  address: string;
  occupation: string;
  nationalId: string | null;
  provisionalContactEmail: string;
  suspensionReason: string;
  suspendedBy: { id: number; email: string } | null;
  subscription: AdminUserSubscriptionRef | null;
  spSubscription: AdminUserSubscriptionRef | null;
  wallet: { id: number; balance: number; scopeBalances: Record<string, number> } | null;
  serviceProvider: {
    id: number;
    status: string;
    verificationStatus: string;
    businessName: string;
  } | null;
}

export interface AdminUserActivity {
  counts: {
    properties: number;
    leasesAsLandlord: number;
    leasesAsTenant: number;
    bookingsAsLandlord: number;
    bookingsAsBooker: number;
    creditTransactions: number;
  };
  recentProperties: { id: number; title: string; status: string; createdAt: string }[];
  recentLeases: {
    id: number; propertyId: number; landlordId: number; tenantId: number;
    status: string; createdAt: string;
  }[];
  recentBookings: {
    id: number; propertyId: number; landlordId: number; bookerId: number;
    status: string; startDatetime: string; createdAt: string;
  }[];
  recentCreditTransactions: {
    id: number; transactionType: string; scope: string; amount: number;
    balanceAfter: number; description: string; createdAt: string;
  }[];
  lastLogin: string | null;
}

/* --------------------------- subscriptions ------------------------------ */

export interface AdminSubscriptionPlan {
  id: number;
  tier: SubscriptionTier;
  displayName: string;
  maxProperties: number;
  monthlyCredits: number;
  priceMonthly: string;
  priceYearly: string;
  features: Record<string, unknown>;
  isActive: boolean;
  subscriberCount: number;
}

export interface AdminSubscription {
  id: number;
  user: ApiContact & { phoneNumber: string };
  plan: AdminSubscriptionPlan;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  autoRenew: boolean;
  propertiesUsed: number;
  createdAt: string;
}

export interface SubscriptionTierStat {
  planId: number;
  tier: string;
  displayName: string;
  subscribers: number;
  estimatedMrr: string;
}

export interface SubscriptionStats {
  tiers: SubscriptionTierStat[];
  estimatedMrr: string;
  spTiers: SubscriptionTierStat[];
  spEstimatedMrr: string;
  totalEstimatedMrr: string;
}

export interface AdminSpPlan {
  id: number;
  tier: string;
  displayName: string;
  monthlyCredits: number;
  proConfirmBaseCost: number;
  maxActiveWorkOrders: number;
  priceMonthly: string;
  priceYearly: string;
  features: Record<string, unknown>;
  isActive: boolean;
  subscriberCount: number;
}

/* -------------------------------- credits ------------------------------- */

export interface AdminCreditPackage {
  id: number;
  name: string;
  credits: number;
  price: string;
  isActive: boolean;
}

export interface AdminCreditWallet {
  id: number;
  user: ApiContact & { phoneNumber: string };
  balance: number;
  reserved: number;
  updatedAt: string;
}

export interface AdminCreditWalletDetail {
  id: number;
  user: ApiContact & { phoneNumber: string };
  balance: number;
  scopeBalances: Record<string, number>;
  buckets: {
    id: number; scope: string; sourceType: string;
    originalAmount: number; remainingAmount: number; reservedAmount: number;
    expiresAt: string | null; createdAt: string;
  }[];
}

export interface AdminCreditTransaction {
  id: number;
  transactionType: string;
  scope: string;
  sourceType: string;
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId: string;
  createdAt: string;
  user: ApiContact & { phoneNumber: string };
  metadata: Record<string, unknown>;
}

/* ------------------------------ properties ------------------------------ */

export interface PropertyModeration {
  isHidden: boolean;
  reason: string;
  hiddenAt: string | null;
  hiddenBy: { id: number; email: string } | null;
}

export interface AdminProperty extends ApiProperty {
  isAdminHidden: boolean;
  landlord: ApiContact & { phoneNumber: string };
  moderation: PropertyModeration;
}

export interface AdminPropertyDetail extends ApiPropertyDetail {
  isAdminHidden: boolean;
  landlord: ApiContact & { phoneNumber: string };
  moderation: PropertyModeration;
}

/* ------------------------------ moderation ------------------------------ */

export type ProvisionalReportStatus = "open" | "dismissed" | "actioned";

export interface ProvisionalReport {
  id: number;
  provisionalTenant: ApiContact & { phoneNumber: string };
  provisionalTenantIsActive: boolean;
  reportedBy: ApiContact & { phoneNumber: string };
  reason: string;
  status: ProvisionalReportStatus;
  tenantReportCount: number;
  resolutionNote: string;
  resolvedBy: ApiContact | null;
  resolvedAt: string | null;
  createdAt: string;
}

export type ComplaintStatus = "open" | "in_progress" | "resolved" | "closed";

export interface BookingComplaint {
  id: number;
  bookingId: number;
  submittedByEmail: string;
  category: "property" | "service" | "safety" | "payment" | "other";
  priority: "low" | "medium" | "high";
  description: string;
  status: ComplaintStatus;
  ownerResolutionNote: string;
  customerResponse: string;
  createdAt: string;
  updatedAt: string;
  propertyId: number;
  propertyTitle: string;
  landlord: ApiContact & { phoneNumber: string };
  submittedBy: ApiContact & { phoneNumber: string };
  adminNote: string;
  adminUpdatedAt: string | null;
}

/* ------------------------- dashboard & reports -------------------------- */

export interface DashboardStats {
  users: {
    total: number; tenants: number; landlords: number; serviceProviders: number;
    newLast30Days: number; suspended: number; staff: number;
  };
  properties: {
    total: number; listed: number; occupied: number; hidden: number;
    locked: number; newLast30Days: number;
  };
  bookings: { pending: number; confirmed: number; newLast30Days: number };
  activeLeases: number;
  moderation: {
    pendingProviderApplications: number;
    openProvisionalReports: number;
    openComplaints: number;
  };
  credits: { outstandingBalance: number };
}

export type TimeseriesMetric =
  | "signups" | "properties" | "bookings"
  | "booking_revenue" | "rent" | "credits_purchased";

export interface Timeseries {
  metric: TimeseriesMetric;
  bucket: "day" | "week" | "month";
  dateFrom: string;
  dateTo: string;
  points: { bucket: string; value: string }[];
}

/* ------------------------------ operations ------------------------------ */

export interface AdminBooking extends ApiBookingListItem {
  landlordId: number;
  bookerId: number;
}

export interface AdminLease extends ApiLeaseListItem {
  propertyId: number;
}

export interface AdminRentBill extends ApiRentBill {
  propertyId: number;
  leaseId: number | null;
}

export interface AdminPayment {
  id: number;
  bookingId: number | null;
  bookingGroupId: number | null;
  amount: string;
  gateway: string;
  externalReference: string;
  idempotencyKey: string;
  status: "initiated" | "succeeded" | "failed" | "refunded";
  gatewayResponse: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBookingDiscount {
  id: number;
  propertyId: number;
  unitId: number | null;
  name: string;
  scope: string;
  discountType: string;
  value: string;
  startDate: string | null;
  endDate: string | null;
  daysOfWeek: number[];
  minSlots: number;
  promoCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  propertyTitle: string;
  landlord: ApiContact & { phoneNumber: string };
}

/* ----------------------------- configuration ---------------------------- */

export interface AdminCategory extends PropertyCategory {
  types: (PropertyType & { categoryId: number })[];
}

export type AdminAmenity = Amenity;

export interface AdminServiceArea {
  id: number;
  name: string;
  city: string;
  areaType: string;
  thanaId: number | null;
  districtId: number | null;
  areaMultiplier: string;
  isActive: boolean;
  centerLat: string | null;
  centerLng: string | null;
}

export interface AdminGeoNode {
  id: number;
  name: string;
  slug: string;
  latitude: string | null;
  longitude: string | null;
  divisionId?: number;
  divisionName?: string;
  districtId?: number;
  districtName?: string;
  thanaId?: number;
  thanaName?: string;
  nameBn?: string;
  areaType?: string;
  aliases?: string[];
}

export type { ApiServiceProviderApplication };
