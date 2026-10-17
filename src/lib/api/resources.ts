import { api, request } from "./client";
import { endpoints } from "./endpoints";
import type {
  Amenity,
  ApiArea,
  ApiBookingListItem,
  ApiDistrict,
  ApiDivision,
  ApiInquiryListItem,
  ApiLeaseListItem,
  ApiMaintenanceListItem,
  ApiProperty,
  ApiPropertyCreateRequest,
  ApiPropertyDetail,
  ApiPropertyUnit,
  ApiPropertyUpdateRequest,
  ApiRentBill,
  ApiThana,
  ApiTransferRequest,
  Paginated,
  PropertyCategory,
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

export const listDistricts = (divisionId: number) =>
  api.get<ApiDistrict[]>(endpoints.geo.districts, { divisionId });

export const listThanas = (districtId: number) =>
  api.get<ApiThana[]>(endpoints.geo.thanas, { districtId });

export const listAreas = (thanaId: number) =>
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
