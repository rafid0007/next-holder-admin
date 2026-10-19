/**
 * Types mirroring next-holder-backend's v1 serializers.
 * The API speaks camelCase on the wire even though Django models are snake_case.
 */

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
  current_page: number;
  results: T[];
}

/* ------------------------------- accounts ------------------------------- */

export type UserRole = "tenant" | "landlord" | "service_provider";

export interface User {
  id: number;
  email: string;
  fullName: string;
  phoneNumber: string;
  roles: UserRole[];
  currentRole: UserRole;
  address?: string;
  occupation?: string;
  nationalId?: string | null;
  profileImage?: string | null;
  isVerified: boolean;
  isActive: boolean;
  isProvisional?: boolean;
  createdAt: string;
  updatedAt?: string;
}

/* ------------------------------ properties ------------------------------ */

export type ListingType = "for_rent" | "for_sale" | "for_book";
export type PropertyStatus = "available" | "occupied" | "maintenance" | "unlisted";

export interface PropertyCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  order: number;
  types?: PropertyType[];
}

export interface PropertyType {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  order: number;
  categoryId?: number;
}

export interface Amenity {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  order: number;
  applicableTypes?: number[];
}

export interface GeoNode {
  id: number;
  name: string;
}

export interface Holding {
  id: number;
  number: string;
  division?: GeoNode | null;
  district?: GeoNode | null;
  thana?: GeoNode | null;
  area?: GeoNode | null;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
  neighborhood?: string;
}

export interface PropertyUnit {
  id: number;
  name: string;
  description?: string;
  capacity?: number | null;
  confirmationAmount?: string | null;
  isActive: boolean;
}

export interface Property {
  id: number;
  title: string;
  description: string;
  landlord: Pick<User, "id" | "fullName" | "email">;
  category: PropertyCategory;
  propertyType: PropertyType;
  holding?: Holding | null;
  listingType: ListingType;
  status: PropertyStatus;
  isListedInMarketplace: boolean;
  isLocked: boolean;
  street: string;
  city: string;
  state: string;
  neighborhood?: string;
  rentAmount: number;
  depositAmount?: number | null;
  areaSqft?: number | null;
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  rooms: number;
  availableFrom?: string | null;
  unitsCount?: number;
  imagesCount?: number;
  primaryImage?: string | null;
  amenities?: Amenity[];
  createdAt: string;
}

export type TransferStatus = "pending" | "accepted" | "rejected" | "cancelled" | "expired";

export interface TransferRequest {
  id: number;
  property: Pick<Property, "id" | "title">;
  fromLandlord: Pick<User, "id" | "fullName">;
  toLandlord: Pick<User, "id" | "fullName">;
  status: TransferStatus;
  message?: string;
  createdAt: string;
}

/* -------------------------------- leases -------------------------------- */

export type LeaseStatus = "pending" | "active" | "expired" | "terminated";

export interface Lease {
  id: number;
  property: Pick<Property, "id" | "title" | "city">;
  landlord: Pick<User, "id" | "fullName">;
  tenant: Pick<User, "id" | "fullName" | "email">;
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount?: number | null;
  status: LeaseStatus;
  contractDocument?: string | null;
  createdAt: string;
}

/* ------------------------------- bookings ------------------------------- */

export type BookingStatus = "pending" | "confirmed" | "rejected" | "cancelled";
export type BookingPaymentStatus =
  | "unpaid"
  | "awaiting_payment"
  | "paid"
  | "partially_refunded"
  | "refunded";

export interface Booking {
  id: number;
  property: Pick<Property, "id" | "title">;
  unit?: Pick<PropertyUnit, "id" | "name"> | null;
  booker?: Pick<User, "id" | "fullName" | "email"> | null;
  manualCustomerName?: string;
  manualCustomerPhone?: string;
  isManual: boolean;
  startDatetime: string;
  endDatetime: string;
  purpose: string;
  numGuests?: number | null;
  status: BookingStatus;
  paymentStatus: BookingPaymentStatus;
  finalAmount: number;
  discountAmount?: number;
  promoCode?: string;
  createdAt: string;
}

export type BlockReason = "maintenance" | "blocked" | "closed" | "unavailable" | "out_of_service";

export interface AvailabilityBlock {
  id: number;
  property: Pick<Property, "id" | "title">;
  unit?: Pick<PropertyUnit, "id" | "name"> | null;
  startDatetime: string;
  endDatetime: string;
  reason: BlockReason;
  note?: string;
}

export interface BookingDiscount {
  id: number;
  name: string;
  property: Pick<Property, "id" | "title">;
  scope: "property" | "unit";
  discountType: "percent" | "fixed";
  value: number;
  promoCode?: string;
  startDate?: string | null;
  endDate?: string | null;
  minSlots?: number | null;
  isActive: boolean;
}

/* --------------------------------- rent --------------------------------- */

export type BillType = "rent" | "utility" | "service_charge" | "maintenance" | "other";
export type BillStatus =
  | "unpaid"
  | "pending_verification"
  | "paid"
  | "rejected"
  | "overdue"
  | "cancelled";
export type BillFrequency = "one_time" | "monthly" | "yearly";
export type PaymentMethod = "cash" | "bank_transfer" | "mobile_banking" | "card" | "other";

export interface RentBill {
  id: number;
  title: string;
  billType: BillType;
  property: Pick<Property, "id" | "title">;
  tenant: Pick<User, "id" | "fullName">;
  landlord: Pick<User, "id" | "fullName">;
  amount: number;
  dueDate: string;
  status: BillStatus;
  frequency: BillFrequency;
  paymentProof?: {
    paymentMethod: PaymentMethod;
    transactionReference?: string;
    paidAmount: number;
    paidAt: string;
    proofDocument?: string | null;
  } | null;
  createdAt: string;
}

export interface BillSchedule {
  id: number;
  title: string;
  billType: BillType;
  property: Pick<Property, "id" | "title">;
  tenant: Pick<User, "id" | "fullName">;
  amount: number;
  frequency: BillFrequency;
  nextDueDate: string;
  endDate?: string | null;
  isActive: boolean;
}

/* ----------------------------- maintenance ------------------------------ */

export type MaintenancePriority = "low" | "medium" | "high" | "urgent";
export type MaintenanceCategory =
  | "plumbing"
  | "electrical"
  | "structural"
  | "appliance"
  | "pest"
  | "other";
export type MaintenanceStatus =
  | "pending"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "rejected"
  | "cancelled";

export interface MaintenanceRequest {
  id: number;
  title: string;
  description: string;
  property: Pick<Property, "id" | "title">;
  tenant: Pick<User, "id" | "fullName">;
  landlord: Pick<User, "id" | "fullName">;
  priority: MaintenancePriority;
  category: MaintenanceCategory;
  status: MaintenanceStatus;
  commentsCount: number;
  mediaCount: number;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------ inquiries ------------------------------- */

export type InquiryStatus = "open" | "replied" | "closed";

export interface PropertyInquiry {
  id: number;
  property: Pick<Property, "id" | "title">;
  sender?: Pick<User, "id" | "fullName"> | null;
  name: string;
  phone?: string;
  email?: string;
  message: string;
  status: InquiryStatus;
  repliesCount: number;
  createdAt: string;
}

/* ---------------------------- subscriptions ----------------------------- */

export type SubscriptionTier = "free" | "basic" | "premium" | "enterprise";

export interface SubscriptionPlan {
  id: number;
  tier: SubscriptionTier;
  displayName: string;
  maxProperties: number;
  monthlyCredits: number;
  priceMonthly: number;
  priceYearly: number;
  features: Record<string, string | number | boolean>;
  isActive: boolean;
  subscribers?: number;
}

export interface UserSubscription {
  id: number;
  user: Pick<User, "id" | "fullName" | "email">;
  plan: Pick<SubscriptionPlan, "id" | "tier" | "displayName">;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  autoRenew: boolean;
  propertiesUsed: number;
}

/* -------------------------------- credits ------------------------------- */

export type CreditTransactionType =
  | "purchase"
  | "deduction"
  | "refund"
  | "bonus"
  | "grant"
  | "reserve"
  | "capture"
  | "release"
  | "expire"
  | "adjust";
export type CreditScope = "user_action" | "pro_action" | "boost";

export interface CreditPackage {
  id: number;
  name: string;
  credits: number;
  price: number;
  isActive: boolean;
}

export interface CreditWallet {
  id: number;
  user: Pick<User, "id" | "fullName" | "email">;
  balance: number;
  reserved: number;
  updatedAt: string;
}

export interface CreditTransaction {
  id: number;
  user: Pick<User, "id" | "fullName">;
  transactionType: CreditTransactionType;
  scope?: CreditScope;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

/* --------------------------- service providers -------------------------- */

export type ProviderStatus =
  | "draft"
  | "pending_verification"
  | "active"
  | "paused"
  | "suspended"
  | "subscription_expired"
  | "hidden";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface ServiceProvider {
  id: number;
  businessName: string;
  providerType: "individual" | "organization";
  owner: Pick<User, "id" | "fullName" | "email" | "phoneNumber">;
  status: ProviderStatus;
  verificationStatus: VerificationStatus;
  categories: string[];
  serviceAreas: string[];
  rating?: number | null;
  completedJobs: number;
  documentsCount: number;
  plan?: "starter" | "professional" | "business";
  submittedAt: string;
}

export type WorkOrderStatus =
  | "scheduled"
  | "in_progress"
  | "completed_by_provider"
  | "confirmed"
  | "disputed"
  | "cancelled";

export interface ServiceWorkOrder {
  id: number;
  reference: string;
  provider: Pick<ServiceProvider, "id" | "businessName">;
  requester: Pick<User, "id" | "fullName">;
  serviceType: string;
  amount: number;
  status: WorkOrderStatus;
  scheduledFor?: string | null;
  createdAt: string;
}

/* ----------------------------- notifications ---------------------------- */

export type NotificationType =
  | "lease"
  | "booking"
  | "maintenance"
  | "rent_bill"
  | "service_provider"
  | "general";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  targetUrl?: string;
  isRead: boolean;
  createdAt: string;
}

/* --------------------------------- geo ---------------------------------- */

export interface GeoRow {
  id: number;
  name: string;
  parent?: string;
  level: "division" | "district" | "thana" | "area";
  childrenCount?: number;
  propertiesCount?: number;
}

/* =========================================================================
   Wire types — exactly what next-holder-backend's v1 serializers return.
   The types above describe what the screens want to display; these describe
   what the API actually sends, field for field. DRF serialises DecimalField
   as a string by default (COERCE_DECIMAL_TO_STRING is not overridden), so
   every money field here is `string`, not `number`.
   ========================================================================= */

export interface ApiGeoNode {
  id: number;
  name: string;
  slug: string;
}

export interface ApiContact {
  id: number;
  fullName: string;
  email: string;
}

export interface ApiPropertyImage {
  id: number;
  imageUrl: string | null;
  caption: string;
  order: number;
  isPrimary: boolean;
  uploadedAt: string;
}

export interface ApiHolding {
  id: number;
  number: string;
  division: ApiGeoNode | null;
  district: ApiGeoNode | null;
  thana: ApiGeoNode | null;
  area: ApiGeoNode | null;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  neighborhood: string;
  latitude: string | null;
  longitude: string | null;
}

/** `PropertyListSerializer`. Note there is no landlord field: the list endpoint
 *  is scoped to the authenticated landlord's own properties. */
export interface ApiProperty {
  id: number;
  title: string;
  description: string;
  additionalInfo: string;
  propertyCategory: PropertyCategory;
  propertyType: PropertyType;
  holding: ApiHolding | null;
  listingType: ListingType;
  status: PropertyStatus;
  isListedInMarketplace: boolean;
  /** Set when the property exceeds the landlord's plan limit; read-only until freed. */
  isLocked: boolean;
  confirmationAmount: string | null;
  cancellationDeadlineHours: number | null;
  availableFrom: string | null;
  isMarketplaceExpired: boolean;
  division: ApiGeoNode | null;
  district: ApiGeoNode | null;
  thana: ApiGeoNode | null;
  area: ApiGeoNode | null;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  neighborhood: string;
  latitude: string | null;
  longitude: string | null;
  contactInfo: Record<string, unknown> | null;
  rentAmount: string;
  depositAmount: string | null;
  areaSqft: string | null;
  floorNumber: string;
  flatNumber: string;
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  rooms: number;
  hasDrawingRoom: boolean;
  hasDiningRoom: boolean;
  hasKitchen: boolean;
  hasStorageRoom: boolean;
  amenities: Amenity[];
  primaryImage: ApiPropertyImage | null;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
}

/** `PropertyDetailSerializer` — the list shape plus every image and the video. */
export interface ApiPropertyDetail extends ApiProperty {
  images: ApiPropertyImage[];
  videoUrl: string | null;
}

export interface ApiPropertyUnit {
  id: number;
  name: string;
  description: string;
  capacity: number | null;
  confirmationAmount: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiTransferRequest {
  id: number;
  property: number;
  propertyTitle: string;
  fromLandlord: ApiContact;
  toLandlord: ApiContact;
  status: TransferStatus;
  message: string;
  rejectionReason: string;
  sentAt: string;
  respondedAt: string | null;
  expiresAt: string | null;
}

export interface ApiLeaseListItem {
  id: number;
  propertyTitle: string;
  propertyCity: string;
  holdingId: number | null;
  holdingNumber: string | null;
  tenant: ApiContact & { phoneNumber?: string };
  landlord: ApiContact;
  startDate: string;
  endDate: string;
  rentAmount: string;
  depositAmount: string | null;
  status: LeaseStatus;
  createdAt: string;
}

export interface ApiBookingListItem {
  id: number;
  propertyId: number;
  propertyTitle: string;
  propertyCity: string;
  unitId: number | null;
  unitName: string | null;
  groupId: number | null;
  landlordEmail: string;
  bookerEmail: string;
  startDatetime: string;
  endDatetime: string;
  purpose: string;
  numGuests: number | null;
  status: BookingStatus;
  paymentStatus: BookingPaymentStatus;
  confirmationAmountPaid: string;
  createdAt: string;
  isManualBooking: boolean;
  promoCode: string;
  discountAmount: string;
  finalAmount: string | null;
}

export interface ApiRentBill {
  id: number;
  propertyTitle: string;
  tenant: ApiContact;
  landlord: ApiContact;
  billType: BillType;
  title: string;
  amount: string;
  dueDate: string;
  status: BillStatus;
  frequency: BillFrequency;
  scheduleId: number | null;
  description: string;
  paymentProof: {
    paymentMethod: PaymentMethod;
    transactionReference: string;
    paidAmount: string;
    paidAt: string;
    proofDocument: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiMaintenanceListItem {
  id: number;
  propertyTitle: string;
  tenant: ApiContact;
  landlord: ApiContact;
  title: string;
  priority: MaintenancePriority;
  category: MaintenanceCategory;
  status: MaintenanceStatus;
  createdAt: string;
}

export interface ApiInquiryListItem {
  id: number;
  propertyTitle: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
}

/** `/auth/signin` response. */
export interface SignInResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    phoneNumber: string;
    roles: UserRole[];
    currentRole: UserRole;
    isVerified: boolean;
    profileImage: string | null;
  };
}

/* =========================================================================
   Write types — what the v1 serializers *accept*. Mirrors
   `PropertyCreateUpdateSerializer` field for field: the keys are the
   serializer's own names (camelCase aliases over snake_case model fields),
   related records are referenced by primary key, and DecimalFields are sent
   as strings so no float rounding happens on the way out.
   ========================================================================= */

/** `ContactInfoSerializer` — note the snake_case keys; it is a plain
 *  `serializers.Serializer` over the model's JSONField, not an alias layer. */
export interface ApiContactInfoRequest {
  person_name: string;
  phone: string;
  email: string;
  whatsapp_number?: string;
  availability?: {
    is_24_hours: boolean;
    start_time?: string;
    end_time?: string;
  };
}

/**
 * `POST /properties/` body. Required here mirrors required there: the fields
 * without a model default or `required=False`, plus the geo hierarchy down to
 * thana (`areaId` is optional, and any ancestor left out is derived from the
 * deepest node supplied).
 */
export interface ApiPropertyCreateRequest {
  title: string;
  description: string;
  additionalInfo?: string;
  /** `PropertyCategory` id, active ones only. */
  propertyCategory: number;
  /** `PropertyType` id — must belong to `propertyCategory`. */
  propertyType: number;
  /** Write-only holding *number*; the backend resolves or creates the Holding. */
  holdingNumber?: string;
  listingType?: ListingType;
  confirmationAmount?: string;
  cancellationDeadlineHours?: number | null;
  /** `YYYY-MM-DD`; the backend snaps it to the 1st of that month. */
  availableFrom?: string | null;
  divisionId: number;
  districtId: number;
  thanaId: number;
  areaId?: number | null;
  street: string;
  city: string;
  state: string;
  country?: string;
  zipCode?: string;
  neighborhood?: string;
  latitude?: string | null;
  longitude?: string | null;
  contactInfo?: ApiContactInfoRequest | null;
  rentAmount: string;
  depositAmount?: string | null;
  areaSqft?: string | null;
  floorNumber?: string;
  flatNumber?: string;
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  rooms?: number;
  hasDrawingRoom?: boolean;
  hasDiningRoom?: boolean;
  hasKitchen?: boolean;
  hasStorageRoom?: boolean;
  /** `Amenity` ids; replaces the whole set on update. */
  amenities?: number[];
}

/** `PATCH /properties/{id}/` — the view passes `partial=True`, so every field
 *  is optional and anything omitted keeps its stored value. */
export type ApiPropertyUpdateRequest = Partial<ApiPropertyCreateRequest>;

/** `GET /geo/divisions/`, and the shape every deeper level extends. */
export interface ApiDivision {
  id: number;
  name: string;
  slug: string;
  latitude: string | null;
  longitude: string | null;
}

export interface ApiDistrict extends ApiDivision {
  divisionId: number;
  divisionName: string;
}

export interface ApiThana extends ApiDistrict {
  districtId: number;
  districtName: string;
}

export interface ApiArea extends ApiThana {
  areaType: string;
  thanaId: number;
  thanaName: string;
}

/* ---------------------- accounts, notifications ------------------------- */

export interface ApiUserListItem {
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
}

export interface ApiNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  targetUrl: string;
  isRead: boolean;
  createdAt: string;
}

/* ------------------------ credits, subscriptions ------------------------ */

export interface ApiCreditPackage {
  id: number;
  name: string;
  credits: number;
  price: string;
  isActive: boolean;
}

/** `GET /credits/wallet` — the authenticated user's own wallet only. */
export interface ApiCreditWallet {
  id: number;
  balance: number;
  scopeBalances: Record<string, number>;
}

export interface ApiCreditTransaction {
  id: number;
  transactionType: CreditTransactionType;
  scope: string;
  sourceType: string;
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId: string;
  createdAt: string;
}

export interface ApiSubscriptionPlan {
  id: number;
  tier: SubscriptionTier;
  displayName: string;
  maxProperties: number;
  monthlyCredits: number;
  priceMonthly: string;
  priceYearly: string;
  features: Record<string, unknown>;
  isActive: boolean;
}

/** `GET /subscriptions/me` — the authenticated user's own subscription. */
export interface ApiUserSubscription {
  id: number;
  plan: ApiSubscriptionPlan;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  autoRenew: boolean;
  createdAt: string;
}

/* --------------------------------- geo ---------------------------------- */

export interface ApiDivision {
  id: number;
  name: string;
  slug: string;
  latitude: string | null;
  longitude: string | null;
}

export interface ApiDistrict extends ApiDivision {
  divisionId: number;
  divisionName: string;
}

export interface ApiThana extends ApiDivision {
  districtId: number;
  districtName: string;
  divisionId: number;
  divisionName: string;
}

export interface ApiArea extends ApiDivision {
  areaType: string;
  thanaId: number;
  thanaName: string;
  districtId: number;
  districtName: string;
  divisionId: number;
  divisionName: string;
}

/* ------------------------------ marketplace ----------------------------- */

export interface ApiMarketplaceProperty {
  id: number;
  title: string;
  description: string;
  propertyCategory: PropertyCategory;
  propertyType: PropertyType;
  listingType: ListingType;
  division: ApiGeoNode | null;
  district: ApiGeoNode | null;
  thana: ApiGeoNode | null;
  area: ApiGeoNode | null;
  city: string;
  state: string;
  neighborhood: string;
  country: string;
  rentAmount: string;
  areaSqft: string | null;
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  amenities: Amenity[];
  primaryImage: ApiPropertyImage | null;
  isUnlocked: boolean;
  isFavorited: boolean;
  viewCount: number;
  unitCount: number;
  hasUnits: boolean;
  hasSlotTemplates: boolean;
  lowestBookingPrice: string | null;
  highestBookingPrice: string | null;
  minCapacity: number | null;
  maxCapacity: number | null;
}

/* --------------------------- finance & reports -------------------------- */

export interface ApiLandlordFinanceSummary {
  totalIncome: string;
  rentIncome: string;
  bookingIncome: string;
  saleIncome: string;
  pendingPayments: string;
  overduePayments: string;
  netIncome: string;
}

export interface ApiLandlordFinanceTransaction {
  id: number;
  source: string;
  type: string;
  amount: string;
  status: string;
  propertyTitle: string;
  description: string;
  date: string;
}

export interface ApiLandlordReportOverview {
  totalProperties: number;
  listedProperties: number;
  occupiedProperties: number;
  activeTenants: number;
  activeLeases: number;
  pendingMaintenanceRequests: number;
  unpaidBills: number;
  totalUnpaidAmount: string;
  totalConfirmedBookings: number;
}

export interface ApiBookingFinanceSummary {
  period: { startDate: string | null; endDate: string | null };
  totalBookings: number;
  confirmedBookings: number;
  totalRevenue: string;
  paidRevenue: string;
  pendingRevenue: string;
  refundedAmount: string;
}

export interface ApiBookingReportOverview {
  totalBookings: number;
  byStatus: Record<string, number>;
  revenue: string;
  cancellationRate: number;
  averageConfirmationHours: number;
}

/* ---------------------------- rent schedules ---------------------------- */

export interface ApiBillSchedule {
  id: number;
  propertyTitle: string;
  tenant: ApiContact;
  billType: BillType;
  title: string;
  amount: string;
  frequency: BillFrequency;
  nextDueDate: string;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
}

/* --------------------------- service providers -------------------------- */

export interface ApiServiceProviderDocument {
  id: number;
  documentType: string;
  fileUrl: string | null;
  note: string;
  uploadedAt: string;
}

export interface ApiServiceOffering {
  id: number;
  [key: string]: unknown;
}

/** `GET /service-providers/admin/applications/` — staff only. */
export interface ApiServiceProviderApplication {
  id: number;
  userId: number;
  userEmail: string;
  userFullName: string;
  providerType: "individual" | "organization";
  businessName: string;
  tagline: string;
  bio: string;
  yearsExperience: number;
  status: ProviderStatus;
  verificationStatus: VerificationStatus;
  rejectionReason: string;
  approvedAt: string | null;
  createdAt: string;
  documents: ApiServiceProviderDocument[];
  offerings: ApiServiceOffering[];
}

export interface ApiServiceWorkOrder {
  id: number;
  requestId: number;
  requestTitle: string;
  acceptedQuoteId: number | null;
  providerId: number;
  providerName: string;
  requesterId: number;
  finalQuoteAmount: string;
  providerCreditsSpent: number;
  relatedPropertyId: number | null;
  status: WorkOrderStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  confirmedAt: string | null;
  closedAt: string | null;
  hasReview: boolean;
  requesterContact: Record<string, unknown> | null;
  createdAt: string;
}

export interface ApiServiceArea {
  id: number;
  name: string;
  city: string;
  areaType: string;
  thanaId: number | null;
  districtId: number | null;
  areaMultiplier: string;
  isActive: boolean;
}

export interface ApiServiceCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  isActive: boolean;
  types: { id: number; name: string; slug: string; isActive: boolean }[];
}

/** `MaintenanceRequestSerializer` — the detail endpoint, with thread and media. */
export interface ApiMaintenanceDetail extends ApiMaintenanceListItem {
  description: string;
  updatedAt: string;
  media: { id: number; fileUrl: string | null; uploadedAt: string }[];
  comments: {
    id: number;
    message: string;
    createdAt: string;
    author?: { id: number; fullName: string } | null;
  }[];
}
