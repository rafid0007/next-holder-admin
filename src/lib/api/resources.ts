import { api, request } from "./client";
import { endpoints } from "./endpoints";
import type {
  Amenity,
  ApiArea,
  ApiBillSchedule,
  ApiBookingFinanceSummary,
  ApiBookingListItem,
  ApiBookingReportOverview,
  ApiCreditPackage,
  ApiCreditTransaction,
  ApiCreditWallet,
  ApiDistrict,
  ApiDivision,
  ApiInquiryListItem,
  ApiLandlordFinanceSummary,
  ApiLandlordFinanceTransaction,
  ApiLandlordReportOverview,
  ApiLeaseListItem,
  ApiMaintenanceDetail,
  ApiMaintenanceListItem,
  ApiMarketplaceProperty,
  ApiNotification,
  ApiProperty,
  ApiPropertyCreateRequest,
  ApiPropertyDetail,
  ApiPropertyUnit,
  ApiPropertyUpdateRequest,
  ApiRentBill,
  ApiServiceArea,
  ApiServiceCategory,
  ApiServiceProviderApplication,
  ApiServiceWorkOrder,
  ApiSubscriptionPlan,
  ApiThana,
  ApiTransferRequest,
  ApiUserListItem,
  ApiUserSubscription,
  Paginated,
  PropertyCategory,
  PropertyType,
  SignInResponse,
} from "./types";

const MAX_PAGE_SIZE = 100; // StandardResultsSetPagination.max_page_size
const MAX_PAGES = 10; // 1,000 properties — above the largest subscription limit

/**
 * `GET /properties/` only filters by the geo hierarchy, so status, category,
 * listing type, city and free-text search are applied in the browser. That
 * needs the whole set, which is bounded: the endpoint returns only the
 * authenticated landlord's own properties, capped by their subscription's
 * `max_properties`. We page through at the maximum page size and stop at
 * MAX_PAGES. If the backend grows real filter params, pass them through here
 * and drop the client-side pass in the page.
 */
export async function listAllProperties(): Promise<ApiProperty[]> {
  const all: ApiProperty[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await api.list<ApiProperty>(endpoints.properties.list, {
      page,
      page_size: MAX_PAGE_SIZE,
    });
    all.push(...response.results);
    if (!response.next) break;
  }

  return all;
}

export const getProperty = (id: number) =>
  api.get<ApiPropertyDetail>(endpoints.properties.detail(id));

/** `POST /properties/` — the property is created under the authenticated
 *  landlord, after `SubscriptionService.check_property_limit` has had its say. */
export const createProperty = (body: ApiPropertyCreateRequest) =>
  api.post<ApiPropertyDetail>(endpoints.properties.list, body);

/** `PATCH /properties/{id}/`. Partial: omitted fields keep their stored value,
 *  but `amenities` replaces the whole set when present. */
export const updateProperty = (id: number, body: ApiPropertyUpdateRequest) =>
  api.patch<ApiPropertyDetail>(endpoints.properties.detail(id), body);

/* ---- taxonomy and geo, for the property form's pickers ---- */

/** Categories come back with their active types nested. */
export const listCategories = () =>
  api.get<PropertyCategory[]>(endpoints.properties.categories);

export const listAmenities = () => api.get<Amenity[]>(endpoints.properties.amenities);

export const listDivisions = () => api.get<ApiDivision[]>(endpoints.geo.divisions);

export const listDistricts = (divisionId?: number) =>
  api.get<ApiDistrict[]>(endpoints.geo.districts, { divisionId });

export const listThanas = (districtId?: number) =>
  api.get<ApiThana[]>(endpoints.geo.thanas, { districtId });

export const listAreas = (thanaId?: number) =>
  api.get<ApiArea[]>(endpoints.geo.areas, { thanaId });

export const toggleMarketplaceListing = (id: number) =>
  api.patch<ApiPropertyDetail>(endpoints.properties.toggleListing(id));

export const deleteProperty = (id: number) =>
  api.delete<void>(endpoints.properties.detail(id));

export const duplicateProperty = (id: number) =>
  api.post<ApiPropertyDetail>(endpoints.properties.duplicate(id));

export const listUnits = (propertyId: number) =>
  api.get<ApiPropertyUnit[]>(endpoints.properties.units(propertyId));

/** Un-paginated: the view returns a plain array. */
export const listTransferRequests = () =>
  api.get<ApiTransferRequest[]>(endpoints.properties.transferRequests);

export const acceptTransfer = (id: number) =>
  api.post<ApiTransferRequest>(endpoints.properties.acceptTransfer(id));

export const rejectTransfer = (id: number, rejectionReason: string) =>
  api.post<ApiTransferRequest>(endpoints.properties.rejectTransfer(id), { rejectionReason });

export const cancelTransfer = (id: number) =>
  api.post<ApiTransferRequest>(endpoints.properties.cancelTransfer(id));

/* ---- related records, all filterable by propertyId ---- */

const firstPage = { page: 1, page_size: 50 };

export const listPropertyLeases = (propertyId: number) =>
  api.list<ApiLeaseListItem>(endpoints.leases.list, { ...firstPage, propertyId });

export const listPropertyBookings = (propertyId: number) =>
  api.list<ApiBookingListItem>(endpoints.bookings.list, {
    ...firstPage,
    propertyId,
    role: "landlord",
  });

export const listPropertyBills = (propertyId: number) =>
  api.list<ApiRentBill>(endpoints.rent.bills, { ...firstPage, propertyId });

export const listPropertyMaintenance = (propertyId: number) =>
  api.list<ApiMaintenanceListItem>(endpoints.maintenance.list, { ...firstPage, propertyId });

export const listPropertyInquiries = (propertyId: number) =>
  api.list<ApiInquiryListItem>(endpoints.inquiries.list, {
    ...firstPage,
    propertyId,
    role: "owner",
  });

/* ---- auth ---- */

/** The backend takes `identifier` (email or phone), not `email`. */
export const signIn = (identifier: string, password: string) =>
  request<SignInResponse>(endpoints.auth.signin, {
    method: "POST",
    body: { identifier, password },
    noRetry: true,
  });

/** Pulls a paginated response down to its rows for callers that only need those. */
export const rows = <T>(page: Paginated<T> | null): T[] => page?.results ?? [];

/* ======================= the rest of the console ========================= */

/* ---- accounts ---- */

export const listUsers = (query: { page?: number; search?: string; role?: string } = {}) =>
  api.list<ApiUserListItem>(endpoints.auth.users, { page_size: 50, ...query });

export const provisionTenant = (body: {
  fullName: string;
  phoneNumber: string;
  contactEmail?: string;
}) => api.post<ApiUserListItem>(endpoints.auth.provisionTenant, body);

/* ---- notifications ---- */

export const listNotifications = (query: { status?: string; type?: string } = {}) =>
  api.list<ApiNotification>(endpoints.notifications.list, { page_size: 50, ...query });

export const markNotificationRead = (id: number) =>
  api.patch<ApiNotification>(endpoints.notifications.read(id));

export const markAllNotificationsRead = () =>
  api.post<{ updated: number }>(endpoints.notifications.readAll);

/* ---- taxonomy writes ---- */

export const createCategory = (body: Partial<PropertyCategory>) =>
  api.post<PropertyCategory>(endpoints.properties.categories, body);

export const createPropertyType = (categoryId: number, body: Partial<PropertyType>) =>
  api.post<PropertyType>(endpoints.properties.categoryTypes(categoryId), body);

export const createAmenity = (body: Partial<Amenity>) =>
  api.post<Amenity>(endpoints.properties.amenities, body);

/* ---- leases ---- */

export const listLeases = (query: { page?: number; propertyId?: number; sortBy?: string } = {}) =>
  api.list<ApiLeaseListItem>(endpoints.leases.list, { page_size: 50, ...query });

export const activateLease = (id: number) => api.post<unknown>(endpoints.leases.activate(id));
export const terminateLease = (id: number, reason?: string) =>
  api.post<unknown>(endpoints.leases.terminate(id), reason ? { reason } : undefined);

/* ---- bookings ---- */

export const listBookings = (
  query: { page?: number; status?: string; propertyId?: number; role?: string } = {},
) => api.list<ApiBookingListItem>(endpoints.bookings.list, { page_size: 50, role: "landlord", ...query });

export const confirmBooking = (id: number) => api.post<unknown>(endpoints.bookings.confirm(id));
export const rejectBooking = (id: number, rejectionReason: string) =>
  api.post<unknown>(endpoints.bookings.reject(id), { rejectionReason });
export const cancelBooking = (id: number, cancellationReason: string) =>
  api.post<unknown>(endpoints.bookings.cancel(id), { cancellationReason });

export const getBookingFinanceSummary = (query: { propertyId?: number } = {}) =>
  api.get<ApiBookingFinanceSummary>(endpoints.bookings.financeSummary, {
    role: "landlord",
    ...query,
  });

export const getBookingReportOverview = () =>
  api.get<ApiBookingReportOverview>(endpoints.bookings.reportOverview, { role: "landlord" });

export const listAvailabilityBlocks = (propertyId: number) =>
  api.get<unknown[]>(endpoints.properties.availabilityBlocks(propertyId));

export const listBookingDiscounts = (propertyId: number) =>
  api.get<unknown[]>(endpoints.properties.bookingDiscounts(propertyId));

/* ---- rent ---- */

export const listBills = (
  query: { page?: number; status?: string; propertyId?: number; billType?: string } = {},
) => api.list<ApiRentBill>(endpoints.rent.bills, { page_size: 50, ...query });

export const verifyBillPayment = (id: number, approve: boolean, note?: string) =>
  api.post<ApiRentBill>(endpoints.rent.verifyPayment(id), { approve, note });

export const listBillSchedules = (query: { page?: number; propertyId?: number } = {}) =>
  api.list<ApiBillSchedule>(endpoints.rent.schedules, { page_size: 50, ...query });

export const cancelBillSchedule = (id: number) =>
  api.post<unknown>(endpoints.rent.cancelSchedule(id));

/* ---- maintenance ---- */

export const listMaintenance = (
  query: { page?: number; status?: string; priority?: string; propertyId?: number } = {},
) => api.list<ApiMaintenanceListItem>(endpoints.maintenance.list, { page_size: 50, ...query });

export const getMaintenanceRequest = (id: number) =>
  api.get<ApiMaintenanceDetail>(endpoints.maintenance.detail(id));

export const updateMaintenanceStatus = (id: number, status: string) =>
  api.patch<unknown>(endpoints.maintenance.status(id), { status });

export const addMaintenanceComment = (id: number, message: string) =>
  api.post<unknown>(endpoints.maintenance.comments(id), { message });

/* ---- inquiries ---- */

export const listInquiries = (
  query: { page?: number; status?: string; propertyId?: number; role?: string } = {},
) => api.list<ApiInquiryListItem>(endpoints.inquiries.list, { page_size: 50, role: "owner", ...query });

export const replyToInquiry = (id: number, message: string) =>
  api.post<unknown>(endpoints.inquiries.reply(id), { message });

export const closeInquiry = (id: number) => api.post<unknown>(endpoints.inquiries.close(id));

/* ---- marketplace ---- */

export const listMarketplace = (query: Record<string, string | number | undefined> = {}) =>
  api.list<ApiMarketplaceProperty>(endpoints.marketplace.properties, { page_size: 50, ...query });

/* ---- subscriptions & credits ---- */

export const listSubscriptionPlans = () =>
  api.get<ApiSubscriptionPlan[]>(endpoints.subscriptions.plans);

export const getMySubscription = () =>
  api.get<ApiUserSubscription>(endpoints.subscriptions.me);

export const listCreditPackages = () =>
  api.get<ApiCreditPackage[]>(endpoints.credits.packages);

export const getMyWallet = () => api.get<ApiCreditWallet>(endpoints.credits.wallet);

export const listCreditTransactions = (query: { page?: number } = {}) =>
  api.list<ApiCreditTransaction>(endpoints.credits.transactions, { page_size: 50, ...query });

export const grantCredits = (body: { userId: number; amount: number; description: string }) =>
  api.post<unknown>(endpoints.credits.adminGrant, body);

/* ---- service providers ---- */

export const listProviderApplications = (query: { page?: number; status?: string } = {}) =>
  api.list<ApiServiceProviderApplication>(endpoints.serviceProviders.applications, {
    page_size: 50,
    ...query,
  });

export const approveProvider = (id: number) =>
  api.post<unknown>(endpoints.serviceProviders.approve(id));
export const rejectProvider = (id: number, rejectionReason: string) =>
  api.post<unknown>(endpoints.serviceProviders.reject(id), { rejectionReason });
export const suspendProvider = (id: number, reason?: string) =>
  api.post<unknown>(endpoints.serviceProviders.suspend(id), reason ? { reason } : undefined);

export const listWorkOrders = (query: { page?: number } = {}) =>
  api.list<ApiServiceWorkOrder>(endpoints.serviceProviders.workOrders, { page_size: 50, ...query });

export const listServiceAreas = () =>
  api.get<ApiServiceArea[]>(endpoints.serviceProviders.areas);

export const listServiceCategories = () =>
  api.get<ApiServiceCategory[]>(endpoints.serviceProviders.categories);

/* ---- landlord finance & reports ---- */

export const getFinanceSummary = (query: { startDate?: string; endDate?: string; propertyId?: number } = {}) =>
  api.get<ApiLandlordFinanceSummary>(endpoints.landlord.financeSummary, query);

export const listFinanceTransactions = (
  query: { source?: string; propertyId?: number; startDate?: string; endDate?: string } = {},
) => api.get<ApiLandlordFinanceTransaction[]>(endpoints.landlord.financeTransactions, query);

export const getReportOverview = (query: { propertyId?: number } = {}) =>
  api.get<ApiLandlordReportOverview>(endpoints.landlord.reportOverview, query);
