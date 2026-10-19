/** Typed calls against the `/admin/` staff API. */
import { api } from "./client";
import { admin } from "./endpoints";
import type { Paginated } from "./types";
import type {
  AdminBooking, AdminBookingDiscount, AdminCategory, AdminCreditPackage, AdminCreditTransaction,
  AdminCreditWallet, AdminCreditWalletDetail, AdminGeoNode, AdminLease, AdminMe, AdminPayment,
  AdminProperty, AdminPropertyDetail, AdminRentBill, AdminServiceArea, AdminSpPlan,
  AdminSubscription, AdminSubscriptionPlan, AdminUser, AdminUserActivity, AdminUserDetail,
  ApiServiceProviderApplication, AuditLogEntry, BookingComplaint, DashboardStats,
  PermissionCatalogEntry, PermissionCode, ProvisionalReport, StaffMember, StaffRole, Timeseries,
  TimeseriesMetric, AdminAmenity,
} from "./admin-types";

type Query = Record<string, string | number | boolean | undefined>;

const page = (query: Query = {}) => ({ page_size: 50, ...query });

/* ---- session ---- */

export const getAdminMe = () => api.get<AdminMe>(admin.me);
export const listPermissionCatalog = () =>
  api.get<PermissionCatalogEntry[]>(admin.permissions);

/* ---- staff & roles ---- */

export const listRoles = () => api.get<StaffRole[]>(admin.roles);
export const createRole = (body: {
  name: string;
  description?: string;
  permissions: PermissionCode[];
}) => api.post<StaffRole>(admin.roles, body);
export const updateRole = (
  id: number,
  body: { name?: string; description?: string; permissions?: PermissionCode[] },
) => api.patch<StaffRole>(admin.role(id), body);
export const deleteRole = (id: number) => api.delete<void>(admin.role(id));

export const listStaff = (query: Query = {}) =>
  api.list<StaffMember>(admin.staff, page(query));
export const setStaffRoles = (userId: number, roleIds: number[]) =>
  api.put<StaffMember>(admin.staffRoles(userId), { roleIds });

/* ---- audit ---- */

export const listAuditLogs = (query: Query = {}) =>
  api.list<AuditLogEntry>(admin.auditLogs, page(query));
export const listUserAuditLogs = (id: number, query: Query = {}) =>
  api.list<AuditLogEntry>(admin.userAuditLogs(id), page(query));

/* ---- users ---- */

export const listAdminUsers = (query: Query = {}) =>
  api.list<AdminUser>(admin.users, page(query));
export const getAdminUser = (id: number) => api.get<AdminUserDetail>(admin.user(id));
export const getUserActivity = (id: number) =>
  api.get<AdminUserActivity>(admin.userActivity(id));

export const suspendUser = (id: number, reason: string, notify = true) =>
  api.post<AdminUserDetail>(admin.suspendUser(id), { reason, notify });
export const reactivateUser = (id: number, reason?: string) =>
  api.post<AdminUserDetail>(admin.reactivateUser(id), reason ? { reason } : {});
export const verifyUser = (id: number, reason?: string) =>
  api.post<AdminUserDetail>(admin.verifyUser(id), reason ? { reason } : {});
export const unverifyUser = (id: number, reason?: string) =>
  api.post<AdminUserDetail>(admin.unverifyUser(id), reason ? { reason } : {});
export const setUserRoles = (
  id: number,
  body: { roles: string[]; currentRole?: string; reason?: string },
) => api.patch<AdminUserDetail>(admin.userRoles(id), body);
export const setUserSubscription = (
  id: number,
  body: { planId: number; endDate?: string; autoRenew?: boolean; isActive?: boolean; reason?: string },
) => api.put<AdminSubscription>(admin.userSubscription(id), body);

/* ---- subscriptions ---- */

export const listSubscriptionPlansAdmin = () =>
  api.get<AdminSubscriptionPlan[]>(admin.subscriptionPlans);
export const createSubscriptionPlan = (body: Record<string, unknown>) =>
  api.post<AdminSubscriptionPlan>(admin.subscriptionPlans, body);
export const updateSubscriptionPlan = (id: number, body: Record<string, unknown>) =>
  api.patch<AdminSubscriptionPlan>(admin.subscriptionPlan(id), body);

export const listSubscriptions = (query: Query = {}) =>
  api.list<AdminSubscription>(admin.subscriptions, page(query));
export const getSubscriptionStats = () =>
  api.get<import("./admin-types").SubscriptionStats>(admin.subscriptionStats);
export const listSpPlans = () => api.get<AdminSpPlan[]>(admin.spSubscriptionPlans);

/* ---- credits ---- */

export const listCreditPackagesAdmin = () =>
  api.get<AdminCreditPackage[]>(admin.creditPackages);
export const createCreditPackage = (body: {
  name: string;
  credits: number;
  price: string;
  isActive?: boolean;
}) => api.post<AdminCreditPackage>(admin.creditPackages, body);
export const updateCreditPackage = (id: number, body: Record<string, unknown>) =>
  api.patch<AdminCreditPackage>(admin.creditPackage(id), body);
export const deactivateCreditPackage = (id: number) =>
  api.delete<void>(admin.creditPackage(id));

export const listCreditWallets = (query: Query = {}) =>
  api.list<AdminCreditWallet>(admin.creditWallets, page(query));
export const getCreditWallet = (userId: number) =>
  api.get<AdminCreditWalletDetail>(admin.creditWallet(userId));
export const listAdminCreditTransactions = (query: Query = {}) =>
  api.list<AdminCreditTransaction>(admin.creditTransactions, page(query));

interface CreditMovement {
  userId: number;
  amount: number;
  scope?: string;
  description?: string;
  expiresAt?: string | null;
  reason?: string;
}
export const grantCreditsAdmin = (body: CreditMovement) =>
  api.post<AdminCreditWalletDetail>(admin.grantCredits, body);
export const refundCreditsAdmin = (body: CreditMovement) =>
  api.post<AdminCreditWalletDetail>(admin.refundCredits, body);
export const deductCreditsAdmin = (body: CreditMovement) =>
  api.post<AdminCreditWalletDetail>(admin.deductCredits, body);

/* ---- properties ---- */

export const listAdminProperties = (query: Query = {}) =>
  api.list<AdminProperty>(admin.properties, page(query));
export const getAdminProperty = (id: number) =>
  api.get<AdminPropertyDetail>(admin.property(id));
export const hideProperty = (id: number, reason: string, notify = true) =>
  api.post<AdminPropertyDetail>(admin.hideProperty(id), { reason, notify });
export const unhideProperty = (id: number, reason?: string) =>
  api.post<AdminPropertyDetail>(admin.unhideProperty(id), reason ? { reason } : {});

/* ---- provider applications ---- */

export const listAdminProviderApplications = (query: Query = {}) =>
  api.list<ApiServiceProviderApplication>(admin.providerApplications, page(query));
export const approveProviderAdmin = (id: number) =>
  api.post<ApiServiceProviderApplication>(admin.approveProvider(id));
export const rejectProviderAdmin = (id: number, reason?: string) =>
  api.post<ApiServiceProviderApplication>(admin.rejectProvider(id), reason ? { reason } : {});
export const suspendProviderAdmin = (id: number, reason?: string) =>
  api.post<ApiServiceProviderApplication>(admin.suspendProvider(id), reason ? { reason } : {});
export const reinstateProviderAdmin = (id: number, reason?: string) =>
  api.post<ApiServiceProviderApplication>(admin.reinstateProvider(id), reason ? { reason } : {});

/* ---- moderation ---- */

export const listProvisionalReports = (query: Query = {}) =>
  api.list<ProvisionalReport>(admin.provisionalReports, page(query));
export const resolveProvisionalReport = (
  id: number,
  action: "dismiss" | "deactivate_account",
  note?: string,
) => api.post<ProvisionalReport>(admin.resolveProvisionalReport(id), { action, note });

export const listComplaints = (query: Query = {}) =>
  api.list<BookingComplaint>(admin.complaints, page(query));
export const updateComplaint = (
  id: number,
  body: { status?: string; adminNote?: string },
) => api.patch<BookingComplaint>(admin.complaint(id), body);

/* ---- dashboard & reports ---- */

export const getDashboardStats = () => api.get<DashboardStats>(admin.dashboardStats);
export const getAdminFinanceSummary = (query: Query = {}) =>
  api.get<import("./types").ApiLandlordFinanceSummary>(admin.financeSummary, query);
export const getAdminReportOverview = () =>
  api.get<import("./types").ApiLandlordReportOverview>(admin.reportOverview);
export const getAdminBookingsOverview = (query: Query = {}) =>
  api.get<import("./types").ApiBookingReportOverview>(admin.bookingsOverview, query);
export const getTimeseries = (
  metric: TimeseriesMetric,
  query: { bucket?: string; dateFrom?: string; dateTo?: string } = {},
) => api.get<Timeseries>(admin.timeseries, { metric, ...query });

/* ---- operations ---- */

export const listAdminBookings = (query: Query = {}) =>
  api.list<AdminBooking>(admin.bookings, page(query));
export const listAdminLeases = (query: Query = {}) =>
  api.list<AdminLease>(admin.leases, page(query));
export const listAdminRentBills = (query: Query = {}) =>
  api.list<AdminRentBill>(admin.rentBills, page(query));
export const listPayments = (query: Query = {}) =>
  api.list<AdminPayment>(admin.payments, page(query));
export const listAdminBookingDiscounts = (query: Query = {}) =>
  api.list<AdminBookingDiscount>(admin.bookingDiscounts, page(query));
export const setDiscountActive = (id: number, isActive: boolean, reason?: string) =>
  api.patch<AdminBookingDiscount>(admin.bookingDiscount(id), { isActive, reason });

/* ---- configuration ---- */

export const listAdminCategories = () => api.get<AdminCategory[]>(admin.propertyCategories);
export const createAdminCategory = (body: Record<string, unknown>) =>
  api.post<AdminCategory>(admin.propertyCategories, body);
export const updateAdminCategory = (id: number, body: Record<string, unknown>) =>
  api.patch<AdminCategory>(admin.propertyCategory(id), body);
export const createAdminType = (categoryId: number, body: Record<string, unknown>) =>
  api.post<unknown>(admin.categoryTypes(categoryId), body);
export const updateAdminType = (id: number, body: Record<string, unknown>) =>
  api.patch<unknown>(admin.propertyType(id), body);
export const listAdminAmenities = () => api.get<AdminAmenity[]>(admin.amenities);
export const createAdminAmenity = (body: Record<string, unknown>) =>
  api.post<AdminAmenity>(admin.amenities, body);
export const updateAdminAmenity = (id: number, body: Record<string, unknown>) =>
  api.patch<AdminAmenity>(admin.amenity(id), body);

export const listAdminServiceAreas = () => api.get<AdminServiceArea[]>(admin.spAreas);

/** Geo lists are paginated here, unlike the public `/geo/` reads. */
export const listAdminGeo = (
  level: "divisions" | "districts" | "thanas" | "areas",
  query: Query = {},
) => api.list<AdminGeoNode>(admin.geo[level], page(query));

export const createGeoNode = (
  level: "divisions" | "districts" | "thanas" | "areas",
  body: Record<string, unknown>,
) => api.post<AdminGeoNode>(admin.geo[level], body);

export const deleteGeoNode = (
  level: "division" | "district" | "thana" | "area",
  id: number,
) => api.delete<void>(admin.geo[level](id));

export type { Paginated };
