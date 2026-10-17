/**
 * Deterministic sample data shaped exactly like the v1 API responses, so every
 * screen renders without a running backend. Swap a page's import for the
 * matching `api`/`endpoints` call and the components stay unchanged.
 */
import type {
  Amenity,
  AvailabilityBlock,
  BillSchedule,
  Booking,
  BookingDiscount,
  CreditPackage,
  CreditTransaction,
  CreditWallet,
  GeoRow,
  Lease,
  MaintenanceRequest,
  Notification,
  Property,
  PropertyCategory,
  PropertyInquiry,
  PropertyUnit,
  RentBill,
  ServiceProvider,
  ServiceWorkOrder,
  SubscriptionPlan,
  TransferRequest,
  User,
  UserSubscription,
} from "@/lib/api/types";

const DAY = 86_400_000;
/** Fixed "now" keeps snapshots and dates stable between renders. */
export const NOW = new Date("2026-10-17T09:30:00Z").getTime();
const ago = (days: number, hours = 0) => new Date(NOW - days * DAY - hours * 3_600_000).toISOString();
const ahead = (days: number, hours = 0) => new Date(NOW + days * DAY + hours * 3_600_000).toISOString();
const date = (days: number) => new Date(NOW + days * DAY).toISOString().slice(0, 10);

/* --------------------------------- users --------------------------------- */

export const users: User[] = [
  { id: 1, email: "nusrat.jahan@gmail.com", fullName: "Nusrat Jahan", phoneNumber: "+8801711002233", roles: ["landlord"], currentRole: "landlord", occupation: "Property investor", isVerified: true, isActive: true, createdAt: ago(412) },
  { id: 2, email: "arif.hossain@gmail.com", fullName: "Arif Hossain", phoneNumber: "+8801811445566", roles: ["landlord", "tenant"], currentRole: "landlord", occupation: "Business owner", isVerified: true, isActive: true, createdAt: ago(366) },
  { id: 3, email: "sadia.rahman@gmail.com", fullName: "Sadia Rahman", phoneNumber: "+8801911778899", roles: ["tenant"], currentRole: "tenant", occupation: "Software engineer", isVerified: true, isActive: true, createdAt: ago(240) },
  { id: 4, email: "tanvir.ahmed@gmail.com", fullName: "Tanvir Ahmed", phoneNumber: "+8801611223344", roles: ["tenant"], currentRole: "tenant", occupation: "Banker", isVerified: false, isActive: true, createdAt: ago(188) },
  { id: 5, email: "rownak.chowdhury@gmail.com", fullName: "Rownak Chowdhury", phoneNumber: "+8801511334455", roles: ["landlord"], currentRole: "landlord", occupation: "Retired", isVerified: true, isActive: true, createdAt: ago(165) },
  { id: 6, email: "mehedi.hasan@gmail.com", fullName: "Mehedi Hasan", phoneNumber: "+8801711556677", roles: ["service_provider"], currentRole: "service_provider", occupation: "Electrician", isVerified: true, isActive: true, createdAt: ago(142) },
  { id: 7, email: "farhana.akter@gmail.com", fullName: "Farhana Akter", phoneNumber: "+8801911667788", roles: ["tenant"], currentRole: "tenant", occupation: "Doctor", isVerified: true, isActive: true, createdAt: ago(121) },
  { id: 8, email: "imran.kabir@gmail.com", fullName: "Imran Kabir", phoneNumber: "+8801811990011", roles: ["landlord", "service_provider"], currentRole: "landlord", occupation: "Contractor", isVerified: true, isActive: true, createdAt: ago(96) },
  { id: 9, email: "shahriar.islam@gmail.com", fullName: "Shahriar Islam", phoneNumber: "+8801611778800", roles: ["tenant"], currentRole: "tenant", occupation: "Student", isVerified: false, isActive: true, createdAt: ago(64) },
  { id: 10, email: "nabila.karim@gmail.com", fullName: "Nabila Karim", phoneNumber: "+8801511889900", roles: ["landlord"], currentRole: "landlord", occupation: "Architect", isVerified: true, isActive: true, createdAt: ago(48) },
  { id: 11, email: "provisional.tenant@nextholder.app", fullName: "Jahid Hasan", phoneNumber: "+8801711111199", roles: ["tenant"], currentRole: "tenant", isVerified: false, isActive: true, isProvisional: true, createdAt: ago(22) },
  { id: 12, email: "rafiul.alam@gmail.com", fullName: "Rafiul Alam", phoneNumber: "+8801911222233", roles: ["service_provider"], currentRole: "service_provider", occupation: "Plumber", isVerified: false, isActive: false, createdAt: ago(14) },
  { id: 13, email: "momota.begum@gmail.com", fullName: "Momota Begum", phoneNumber: "+8801611334400", roles: ["tenant"], currentRole: "tenant", occupation: "Teacher", isVerified: true, isActive: true, createdAt: ago(9) },
  { id: 14, email: "sabbir.khan@gmail.com", fullName: "Sabbir Khan", phoneNumber: "+8801811556600", roles: ["landlord"], currentRole: "landlord", occupation: "Entrepreneur", isVerified: false, isActive: true, createdAt: ago(4) },
  { id: 15, email: "ishrat.binte@gmail.com", fullName: "Ishrat Binte", phoneNumber: "+8801511667700", roles: ["tenant"], currentRole: "tenant", occupation: "Designer", isVerified: true, isActive: true, createdAt: ago(1) },
];

const user = (id: number) => {
  const found = users.find((u) => u.id === id)!;
  return { id: found.id, fullName: found.fullName, email: found.email };
};

/* ------------------------------- taxonomy -------------------------------- */

export const categories: PropertyCategory[] = [
  {
    id: 1, name: "Residential", slug: "residential", description: "Homes for long-term living", isActive: true, order: 1,
    types: [
      { id: 1, name: "Apartment", slug: "apartment", isActive: true, order: 1 },
      { id: 2, name: "Duplex", slug: "duplex", isActive: true, order: 2 },
      { id: 3, name: "Independent house", slug: "independent-house", isActive: true, order: 3 },
      { id: 4, name: "Sublet / room", slug: "sublet-room", isActive: true, order: 4 },
    ],
  },
  {
    id: 2, name: "Commercial", slug: "commercial", description: "Office, retail and industrial space", isActive: true, order: 2,
    types: [
      { id: 5, name: "Office floor", slug: "office-floor", isActive: true, order: 1 },
      { id: 6, name: "Shop", slug: "shop", isActive: true, order: 2 },
      { id: 7, name: "Warehouse", slug: "warehouse", isActive: true, order: 3 },
    ],
  },
  {
    id: 3, name: "Event & bookable", slug: "event-bookable", description: "Hourly and daily bookable venues", isActive: true, order: 3,
    types: [
      { id: 8, name: "Community centre", slug: "community-centre", isActive: true, order: 1 },
      { id: 9, name: "Rooftop venue", slug: "rooftop-venue", isActive: true, order: 2 },
      { id: 10, name: "Conference room", slug: "conference-room", isActive: true, order: 3 },
    ],
  },
  {
    id: 4, name: "Land", slug: "land", description: "Plots and agricultural land", isActive: false, order: 4,
    types: [{ id: 11, name: "Residential plot", slug: "residential-plot", isActive: true, order: 1 }],
  },
];

export const amenities: Amenity[] = [
  { id: 1, name: "Lift", slug: "lift", isActive: true, order: 1, applicableTypes: [1, 2, 5] },
  { id: 2, name: "Generator backup", slug: "generator", isActive: true, order: 2, applicableTypes: [1, 2, 3, 5] },
  { id: 3, name: "Car parking", slug: "parking", isActive: true, order: 3, applicableTypes: [1, 2, 3, 5, 6] },
  { id: 4, name: "Gas line", slug: "gas-line", isActive: true, order: 4, applicableTypes: [1, 2, 3] },
  { id: 5, name: "Security guard", slug: "security", isActive: true, order: 5, applicableTypes: [1, 2, 5, 8] },
  { id: 6, name: "CCTV", slug: "cctv", isActive: true, order: 6, applicableTypes: [1, 5, 6, 8] },
  { id: 7, name: "Rooftop access", slug: "rooftop", isActive: true, order: 7, applicableTypes: [1, 9] },
  { id: 8, name: "Furnished", slug: "furnished", isActive: true, order: 8, applicableTypes: [1, 4, 10] },
  { id: 9, name: "Air conditioning", slug: "air-conditioning", isActive: true, order: 9, applicableTypes: [1, 5, 8, 10] },
  { id: 10, name: "Prayer room", slug: "prayer-room", isActive: false, order: 10, applicableTypes: [8] },
];

const type = (id: number) =>
  categories.flatMap((c) => c.types ?? []).find((t) => t.id === id)!;
const category = (id: number) => {
  const found = categories.find((c) => c.id === id)!;
  return {
    id: found.id,
    name: found.name,
    slug: found.slug,
    description: found.description,
    isActive: found.isActive,
    order: found.order,
  };
};

/* ------------------------------ properties ------------------------------- */

interface Seed {
  id: number;
  title: string;
  landlord: number;
  categoryId: number;
  typeId: number;
  listingType: Property["listingType"];
  status: Property["status"];
  listed: boolean;
  street: string;
  city: string;
  state: string;
  neighborhood: string;
  rent: number;
  deposit?: number;
  sqft: number;
  bed: number;
  bath: number;
  units?: number;
  images: number;
  days: number;
}

const seeds: Seed[] = [
  { id: 101, title: "Gulshan 2 — 3 bed family apartment", landlord: 1, categoryId: 1, typeId: 1, listingType: "for_rent", status: "occupied", listed: false, street: "House 42, Road 11", city: "Dhaka", state: "Dhaka", neighborhood: "Gulshan 2", rent: 85000, deposit: 170000, sqft: 2100, bed: 3, bath: 3, images: 12, days: 320 },
  { id: 102, title: "Dhanmondi 27 — 2 bed with lake view", landlord: 1, categoryId: 1, typeId: 1, listingType: "for_rent", status: "available", listed: true, street: "House 9, Road 27", city: "Dhaka", state: "Dhaka", neighborhood: "Dhanmondi", rent: 48000, deposit: 96000, sqft: 1400, bed: 2, bath: 2, images: 9, days: 240 },
  { id: 103, title: "Bashundhara R/A — Duplex, Block K", landlord: 2, categoryId: 1, typeId: 2, listingType: "for_rent", status: "occupied", listed: false, street: "Plot 16, Block K", city: "Dhaka", state: "Dhaka", neighborhood: "Bashundhara R/A", rent: 125000, deposit: 250000, sqft: 3400, bed: 5, bath: 4, images: 18, days: 290 },
  { id: 104, title: "Banani — Office floor, 4,200 sqft", landlord: 2, categoryId: 2, typeId: 5, listingType: "for_rent", status: "available", listed: true, street: "Road 17, Kemal Ataturk Ave", city: "Dhaka", state: "Dhaka", neighborhood: "Banani", rent: 310000, deposit: 620000, sqft: 4200, bed: 0, bath: 4, images: 14, days: 180 },
  { id: 105, title: "Uttara Sector 7 — Rooftop event venue", landlord: 5, categoryId: 3, typeId: 9, listingType: "for_book", status: "available", listed: true, street: "House 3, Road 12, Sector 7", city: "Dhaka", state: "Dhaka", neighborhood: "Uttara", rent: 18000, sqft: 2600, bed: 0, bath: 2, units: 3, images: 21, days: 150 },
  { id: 106, title: "Mirpur DOHS — 3 bed, semi-furnished", landlord: 5, categoryId: 1, typeId: 1, listingType: "for_rent", status: "available", listed: true, street: "House 522, Road 9", city: "Dhaka", state: "Dhaka", neighborhood: "Mirpur DOHS", rent: 42000, deposit: 84000, sqft: 1550, bed: 3, bath: 2, images: 8, days: 132 },
  { id: 107, title: "Agrabad — Shop space, ground floor", landlord: 8, categoryId: 2, typeId: 6, listingType: "for_rent", status: "occupied", listed: false, street: "Sheikh Mujib Road", city: "Chattogram", state: "Chattogram", neighborhood: "Agrabad", rent: 65000, deposit: 130000, sqft: 900, bed: 0, bath: 1, images: 6, days: 118 },
  { id: 108, title: "Khulshi — Independent house with garden", landlord: 8, categoryId: 1, typeId: 3, listingType: "for_sale", status: "available", listed: true, street: "Road 2, South Khulshi", city: "Chattogram", state: "Chattogram", neighborhood: "Khulshi", rent: 15500000, sqft: 4800, bed: 6, bath: 5, images: 24, days: 96 },
  { id: 109, title: "Mohammadpur — Sublet, single room", landlord: 10, categoryId: 1, typeId: 4, listingType: "for_rent", status: "available", listed: true, street: "Block C, Shahjahan Road", city: "Dhaka", state: "Dhaka", neighborhood: "Mohammadpur", rent: 11000, sqft: 180, bed: 1, bath: 1, images: 4, days: 84 },
  { id: 110, title: "Gulshan 1 — Conference room, hourly", landlord: 10, categoryId: 3, typeId: 10, listingType: "for_book", status: "available", listed: true, street: "Level 7, Gulshan Circle 1", city: "Dhaka", state: "Dhaka", neighborhood: "Gulshan 1", rent: 4500, sqft: 650, bed: 0, bath: 2, units: 4, images: 11, days: 72 },
  { id: 111, title: "Baridhara DOHS — 4 bed on high floor", landlord: 1, categoryId: 1, typeId: 1, listingType: "for_rent", status: "maintenance", listed: false, street: "House 310, Road 5", city: "Dhaka", state: "Dhaka", neighborhood: "Baridhara DOHS", rent: 95000, deposit: 190000, sqft: 2600, bed: 4, bath: 4, images: 16, days: 61 },
  { id: 112, title: "Tejgaon — Warehouse, 11,000 sqft", landlord: 2, categoryId: 2, typeId: 7, listingType: "for_rent", status: "available", listed: true, street: "Industrial Area, Tejgaon", city: "Dhaka", state: "Dhaka", neighborhood: "Tejgaon", rent: 420000, deposit: 840000, sqft: 11000, bed: 0, bath: 3, images: 10, days: 54 },
  { id: 113, title: "Sylhet Zindabazar — 2 bed apartment", landlord: 14, categoryId: 1, typeId: 1, listingType: "for_rent", status: "available", listed: true, street: "Zindabazar Main Road", city: "Sylhet", state: "Sylhet", neighborhood: "Zindabazar", rent: 26000, deposit: 52000, sqft: 1150, bed: 2, bath: 2, images: 7, days: 41 },
  { id: 114, title: "Rajshahi — Community centre hall", landlord: 14, categoryId: 3, typeId: 8, listingType: "for_book", status: "available", listed: true, street: "Greater Road, Shaheb Bazar", city: "Rajshahi", state: "Rajshahi", neighborhood: "Shaheb Bazar", rent: 32000, sqft: 5200, bed: 0, bath: 4, units: 2, images: 13, days: 33 },
  { id: 115, title: "Niketan — 3 bed, fully furnished", landlord: 10, categoryId: 1, typeId: 1, listingType: "for_rent", status: "occupied", listed: false, street: "House 24, Road 4, Niketan", city: "Dhaka", state: "Dhaka", neighborhood: "Gulshan", rent: 72000, deposit: 144000, sqft: 1850, bed: 3, bath: 3, images: 15, days: 27 },
  { id: 116, title: "Savar — Independent house, 5 katha", landlord: 5, categoryId: 1, typeId: 3, listingType: "for_rent", status: "unlisted", listed: false, street: "Bank Town, Savar", city: "Dhaka", state: "Dhaka", neighborhood: "Savar", rent: 38000, sqft: 2200, bed: 4, bath: 3, images: 5, days: 19 },
  { id: 117, title: "Bashundhara — Office suite, 1,800 sqft", landlord: 8, categoryId: 2, typeId: 5, listingType: "for_rent", status: "available", listed: true, street: "Block B, Bashundhara R/A", city: "Dhaka", state: "Dhaka", neighborhood: "Bashundhara R/A", rent: 145000, deposit: 290000, sqft: 1800, bed: 0, bath: 2, images: 9, days: 11 },
  { id: 118, title: "Chandgaon — 2 bed, new building", landlord: 14, categoryId: 1, typeId: 1, listingType: "for_rent", status: "available", listed: false, street: "Chandgaon Residential Area", city: "Chattogram", state: "Chattogram", neighborhood: "Chandgaon", rent: 22000, deposit: 44000, sqft: 1050, bed: 2, bath: 2, images: 3, days: 3 },
];

export const properties: Property[] = seeds.map((s) => ({
  id: s.id,
  title: s.title,
  description:
    "Well-maintained space with reliable utilities, lift access and dedicated parking. Walking distance from main road transport and local markets.",
  landlord: user(s.landlord),
  category: category(s.categoryId),
  propertyType: type(s.typeId),
  holding: {
    id: 900 + s.id,
    number: `H-${s.id}`,
    street: s.street,
    city: s.city,
    state: s.state,
    country: "Bangladesh",
    neighborhood: s.neighborhood,
    division: { id: 1, name: s.state },
    district: { id: 2, name: s.city },
  },
  listingType: s.listingType,
  status: s.status,
  isListedInMarketplace: s.listed,
  isLocked: s.status === "occupied",
  street: s.street,
  city: s.city,
  state: s.state,
  neighborhood: s.neighborhood,
  rentAmount: s.rent,
  depositAmount: s.deposit ?? null,
  areaSqft: s.sqft,
  bedrooms: s.bed,
  bathrooms: s.bath,
  balconies: s.bed > 2 ? 2 : 1,
  rooms: s.bed + 2,
  availableFrom: s.status === "available" ? date(7) : null,
  unitsCount: s.units ?? 0,
  imagesCount: s.images,
  amenities: amenities.filter((a) => a.applicableTypes?.includes(s.typeId)).slice(0, 5),
  createdAt: ago(s.days),
}));

const prop = (id: number) => {
  const found = properties.find((p) => p.id === id)!;
  return { id: found.id, title: found.title, city: found.city };
};

export const propertyUnits: Record<number, PropertyUnit[]> = {
  105: [
    { id: 1, name: "Rooftop — main deck", capacity: 180, confirmationAmount: "5000", isActive: true },
    { id: 2, name: "Rooftop — covered lounge", capacity: 60, confirmationAmount: "2500", isActive: true },
    { id: 3, name: "Ground-floor prep kitchen", capacity: 12, confirmationAmount: "1000", isActive: false },
  ],
  110: [
    { id: 4, name: "Boardroom A (14 seats)", capacity: 14, confirmationAmount: "1500", isActive: true },
    { id: 5, name: "Boardroom B (8 seats)", capacity: 8, confirmationAmount: "1000", isActive: true },
    { id: 6, name: "Huddle room", capacity: 4, confirmationAmount: "500", isActive: true },
    { id: 7, name: "Training hall", capacity: 40, confirmationAmount: "3000", isActive: true },
  ],
  114: [
    { id: 8, name: "Main hall", capacity: 450, confirmationAmount: "10000", isActive: true },
    { id: 9, name: "Side banquet room", capacity: 120, confirmationAmount: "4000", isActive: true },
  ],
};

export const transferRequests: TransferRequest[] = [
  { id: 1, property: prop(106), fromLandlord: { id: 5, fullName: "Rownak Chowdhury" }, toLandlord: { id: 10, fullName: "Nabila Karim" }, status: "pending", message: "Handing over management after relocation.", createdAt: ago(2) },
  { id: 2, property: prop(116), fromLandlord: { id: 5, fullName: "Rownak Chowdhury" }, toLandlord: { id: 14, fullName: "Sabbir Khan" }, status: "pending", createdAt: ago(5) },
  { id: 3, property: prop(107), fromLandlord: { id: 8, fullName: "Imran Kabir" }, toLandlord: { id: 2, fullName: "Arif Hossain" }, status: "accepted", createdAt: ago(23) },
  { id: 4, property: prop(109), fromLandlord: { id: 10, fullName: "Nabila Karim" }, toLandlord: { id: 1, fullName: "Nusrat Jahan" }, status: "rejected", createdAt: ago(40) },
];

/* -------------------------------- leases --------------------------------- */

export const leases: Lease[] = [
  { id: 1, property: prop(101), landlord: { id: 1, fullName: "Nusrat Jahan" }, tenant: user(3), startDate: date(-300), endDate: date(65), rentAmount: 85000, depositAmount: 170000, status: "active", contractDocument: "lease-101.pdf", createdAt: ago(305) },
  { id: 2, property: prop(103), landlord: { id: 2, fullName: "Arif Hossain" }, tenant: user(7), startDate: date(-250), endDate: date(115), rentAmount: 125000, depositAmount: 250000, status: "active", contractDocument: "lease-103.pdf", createdAt: ago(256) },
  { id: 3, property: prop(107), landlord: { id: 8, fullName: "Imran Kabir" }, tenant: user(4), startDate: date(-180), endDate: date(185), rentAmount: 65000, depositAmount: 130000, status: "active", createdAt: ago(186) },
  { id: 4, property: prop(115), landlord: { id: 10, fullName: "Nabila Karim" }, tenant: user(13), startDate: date(-20), endDate: date(345), rentAmount: 72000, depositAmount: 144000, status: "active", contractDocument: "lease-115.pdf", createdAt: ago(24) },
  { id: 5, property: prop(102), landlord: { id: 1, fullName: "Nusrat Jahan" }, tenant: user(15), startDate: date(6), endDate: date(371), rentAmount: 48000, depositAmount: 96000, status: "pending", createdAt: ago(2) },
  { id: 6, property: prop(106), landlord: { id: 5, fullName: "Rownak Chowdhury" }, tenant: user(9), startDate: date(14), endDate: date(379), rentAmount: 42000, depositAmount: 84000, status: "pending", createdAt: ago(1) },
  { id: 7, property: prop(113), landlord: { id: 14, fullName: "Sabbir Khan" }, tenant: user(11), startDate: date(10), endDate: date(375), rentAmount: 26000, status: "pending", createdAt: ago(4) },
  { id: 8, property: prop(111), landlord: { id: 1, fullName: "Nusrat Jahan" }, tenant: user(4), startDate: date(-420), endDate: date(-55), rentAmount: 92000, depositAmount: 184000, status: "expired", createdAt: ago(425) },
  { id: 9, property: prop(109), landlord: { id: 10, fullName: "Nabila Karim" }, tenant: user(9), startDate: date(-150), endDate: date(-30), rentAmount: 11000, status: "terminated", createdAt: ago(155) },
  { id: 10, property: prop(118), landlord: { id: 14, fullName: "Sabbir Khan" }, tenant: user(13), startDate: date(-390), endDate: date(-25), rentAmount: 21000, depositAmount: 42000, status: "expired", createdAt: ago(395) },
];

/* ------------------------------- bookings -------------------------------- */

export const bookings: Booking[] = [
  { id: 1, property: prop(105), unit: { id: 1, name: "Rooftop — main deck" }, booker: user(3), isManual: false, startDatetime: ahead(3, 10), endDatetime: ahead(3, 16), purpose: "Wedding reception", numGuests: 150, status: "pending", paymentStatus: "awaiting_payment", finalAmount: 54000, createdAt: ago(0, 4) },
  { id: 2, property: prop(110), unit: { id: 4, name: "Boardroom A (14 seats)" }, booker: user(7), isManual: false, startDatetime: ahead(1, 3), endDatetime: ahead(1, 7), purpose: "Quarterly board meeting", numGuests: 12, status: "confirmed", paymentStatus: "paid", finalAmount: 18000, discountAmount: 2000, promoCode: "BOARD10", createdAt: ago(2) },
  { id: 3, property: prop(114), unit: { id: 8, name: "Main hall" }, booker: null, manualCustomerName: "Rajshahi Chamber of Commerce", manualCustomerPhone: "+8801711445599", isManual: true, startDatetime: ahead(9, 8), endDatetime: ahead(9, 18), purpose: "Annual general meeting", numGuests: 400, status: "confirmed", paymentStatus: "paid", finalAmount: 96000, createdAt: ago(6) },
  { id: 4, property: prop(105), unit: { id: 2, name: "Rooftop — covered lounge" }, booker: user(15), isManual: false, startDatetime: ahead(5, 14), endDatetime: ahead(5, 20), purpose: "Birthday party", numGuests: 45, status: "pending", paymentStatus: "unpaid", finalAmount: 27000, createdAt: ago(0, 9) },
  { id: 5, property: prop(110), unit: { id: 7, name: "Training hall" }, booker: user(4), isManual: false, startDatetime: ahead(2, 4), endDatetime: ahead(2, 12), purpose: "Staff training", numGuests: 35, status: "confirmed", paymentStatus: "paid", finalAmount: 36000, createdAt: ago(3) },
  { id: 6, property: prop(114), unit: { id: 9, name: "Side banquet room" }, booker: user(13), isManual: false, startDatetime: ago(4, 6), endDatetime: ago(4, 1), purpose: "Family gathering", numGuests: 80, status: "confirmed", paymentStatus: "paid", finalAmount: 28000, createdAt: ago(12) },
  { id: 7, property: prop(105), unit: { id: 1, name: "Rooftop — main deck" }, booker: user(9), isManual: false, startDatetime: ago(8, 5), endDatetime: ago(8, 0), purpose: "Corporate iftar", numGuests: 120, status: "cancelled", paymentStatus: "refunded", finalAmount: 48000, createdAt: ago(18) },
  { id: 8, property: prop(110), unit: { id: 5, name: "Boardroom B (8 seats)" }, booker: user(11), isManual: false, startDatetime: ahead(4, 6), endDatetime: ahead(4, 9), purpose: "Client pitch", numGuests: 6, status: "pending", paymentStatus: "unpaid", finalAmount: 9000, createdAt: ago(0, 16) },
  { id: 9, property: prop(114), unit: { id: 8, name: "Main hall" }, booker: user(7), isManual: false, startDatetime: ago(15, 8), endDatetime: ago(15, 2), purpose: "Product launch", numGuests: 300, status: "rejected", paymentStatus: "unpaid", finalAmount: 88000, createdAt: ago(21) },
  { id: 10, property: prop(105), unit: { id: 2, name: "Rooftop — covered lounge" }, booker: null, manualCustomerName: "Walk-in — Mr. Sohel", manualCustomerPhone: "+8801911553366", isManual: true, startDatetime: ahead(7, 15), endDatetime: ahead(7, 21), purpose: "Engagement ceremony", numGuests: 55, status: "confirmed", paymentStatus: "paid", finalAmount: 31000, createdAt: ago(1) },
  { id: 11, property: prop(110), unit: { id: 6, name: "Huddle room" }, booker: user(15), isManual: false, startDatetime: ahead(1, 9), endDatetime: ahead(1, 11), purpose: "Interview panel", numGuests: 4, status: "confirmed", paymentStatus: "partially_refunded", finalAmount: 4500, createdAt: ago(5) },
  { id: 12, property: prop(114), unit: { id: 9, name: "Side banquet room" }, booker: user(3), isManual: false, startDatetime: ahead(12, 7), endDatetime: ahead(12, 15), purpose: "School reunion", numGuests: 110, status: "pending", paymentStatus: "awaiting_payment", finalAmount: 34000, createdAt: ago(0, 2) },
];

export const availabilityBlocks: AvailabilityBlock[] = [
  { id: 1, property: prop(105), unit: { id: 1, name: "Rooftop — main deck" }, startDatetime: ahead(14), endDatetime: ahead(17), reason: "maintenance", note: "Waterproofing work on the deck." },
  { id: 2, property: prop(110), unit: null, startDatetime: ahead(20), endDatetime: ahead(22), reason: "closed", note: "Office closed for Eid holidays." },
  { id: 3, property: prop(114), unit: { id: 8, name: "Main hall" }, startDatetime: ahead(28), endDatetime: ahead(29), reason: "blocked", note: "Owner's private event." },
];

export const bookingDiscounts: BookingDiscount[] = [
  { id: 1, name: "Weekday boardroom offer", property: prop(110), scope: "property", discountType: "percent", value: 10, promoCode: "BOARD10", startDate: date(-30), endDate: date(60), minSlots: 2, isActive: true },
  { id: 2, name: "Rooftop early-bird", property: prop(105), scope: "unit", discountType: "fixed", value: 4000, promoCode: "ROOF4K", startDate: date(-10), endDate: date(20), minSlots: null, isActive: true },
  { id: 3, name: "Monsoon hall discount", property: prop(114), scope: "property", discountType: "percent", value: 15, startDate: date(-90), endDate: date(-10), isActive: false },
];

/* ------------------------------ rent & bills ----------------------------- */

export const rentBills: RentBill[] = [
  { id: 1, title: "October rent", billType: "rent", property: prop(101), tenant: { id: 3, fullName: "Sadia Rahman" }, landlord: { id: 1, fullName: "Nusrat Jahan" }, amount: 85000, dueDate: date(-2), status: "pending_verification", frequency: "monthly", paymentProof: { paymentMethod: "bank_transfer", transactionReference: "TXN-8842190", paidAmount: 85000, paidAt: ago(1), proofDocument: "receipt-oct.pdf" }, createdAt: ago(16) },
  { id: 2, title: "October rent", billType: "rent", property: prop(103), tenant: { id: 7, fullName: "Farhana Akter" }, landlord: { id: 2, fullName: "Arif Hossain" }, amount: 125000, dueDate: date(-2), status: "paid", frequency: "monthly", paymentProof: { paymentMethod: "mobile_banking", transactionReference: "BKASH-77310", paidAmount: 125000, paidAt: ago(3), proofDocument: "bkash-oct.png" }, createdAt: ago(16) },
  { id: 3, title: "October rent", billType: "rent", property: prop(107), tenant: { id: 4, fullName: "Tanvir Ahmed" }, landlord: { id: 8, fullName: "Imran Kabir" }, amount: 65000, dueDate: date(-12), status: "overdue", frequency: "monthly", createdAt: ago(26) },
  { id: 4, title: "Service charge — October", billType: "service_charge", property: prop(101), tenant: { id: 3, fullName: "Sadia Rahman" }, landlord: { id: 1, fullName: "Nusrat Jahan" }, amount: 6500, dueDate: date(3), status: "unpaid", frequency: "monthly", createdAt: ago(14) },
  { id: 5, title: "Water & gas bill", billType: "utility", property: prop(103), tenant: { id: 7, fullName: "Farhana Akter" }, landlord: { id: 2, fullName: "Arif Hossain" }, amount: 4200, dueDate: date(5), status: "unpaid", frequency: "monthly", createdAt: ago(10) },
  { id: 6, title: "October rent", billType: "rent", property: prop(115), tenant: { id: 13, fullName: "Momota Begum" }, landlord: { id: 10, fullName: "Nabila Karim" }, amount: 72000, dueDate: date(1), status: "pending_verification", frequency: "monthly", paymentProof: { paymentMethod: "cash", paidAmount: 72000, paidAt: ago(0, 6) }, createdAt: ago(12) },
  { id: 7, title: "Lift repair cost share", billType: "maintenance", property: prop(101), tenant: { id: 3, fullName: "Sadia Rahman" }, landlord: { id: 1, fullName: "Nusrat Jahan" }, amount: 3000, dueDate: date(-20), status: "paid", frequency: "one_time", paymentProof: { paymentMethod: "cash", paidAmount: 3000, paidAt: ago(22) }, createdAt: ago(34) },
  { id: 8, title: "September rent", billType: "rent", property: prop(101), tenant: { id: 3, fullName: "Sadia Rahman" }, landlord: { id: 1, fullName: "Nusrat Jahan" }, amount: 85000, dueDate: date(-32), status: "paid", frequency: "monthly", paymentProof: { paymentMethod: "bank_transfer", transactionReference: "TXN-8731044", paidAmount: 85000, paidAt: ago(33) }, createdAt: ago(46) },
  { id: 9, title: "September rent", billType: "rent", property: prop(107), tenant: { id: 4, fullName: "Tanvir Ahmed" }, landlord: { id: 8, fullName: "Imran Kabir" }, amount: 65000, dueDate: date(-42), status: "rejected", frequency: "monthly", paymentProof: { paymentMethod: "other", transactionReference: "unclear-screenshot", paidAmount: 45000, paidAt: ago(44) }, createdAt: ago(56) },
  { id: 10, title: "Advance — November rent", billType: "rent", property: prop(115), tenant: { id: 13, fullName: "Momota Begum" }, landlord: { id: 10, fullName: "Nabila Karim" }, amount: 72000, dueDate: date(31), status: "unpaid", frequency: "monthly", createdAt: ago(1) },
  { id: 11, title: "Generator fuel share", billType: "other", property: prop(103), tenant: { id: 7, fullName: "Farhana Akter" }, landlord: { id: 2, fullName: "Arif Hossain" }, amount: 1800, dueDate: date(-8), status: "cancelled", frequency: "one_time", createdAt: ago(18) },
  { id: 12, title: "October rent", billType: "rent", property: prop(109), tenant: { id: 9, fullName: "Shahriar Islam" }, landlord: { id: 10, fullName: "Nabila Karim" }, amount: 11000, dueDate: date(-6), status: "overdue", frequency: "monthly", createdAt: ago(20) },
];

export const billSchedules: BillSchedule[] = [
  { id: 1, title: "Monthly rent", billType: "rent", property: prop(101), tenant: { id: 3, fullName: "Sadia Rahman" }, amount: 85000, frequency: "monthly", nextDueDate: date(14), endDate: date(65), isActive: true },
  { id: 2, title: "Monthly rent", billType: "rent", property: prop(103), tenant: { id: 7, fullName: "Farhana Akter" }, amount: 125000, frequency: "monthly", nextDueDate: date(14), endDate: date(115), isActive: true },
  { id: 3, title: "Service charge", billType: "service_charge", property: prop(101), tenant: { id: 3, fullName: "Sadia Rahman" }, amount: 6500, frequency: "monthly", nextDueDate: date(17), endDate: null, isActive: true },
  { id: 4, title: "Monthly rent", billType: "rent", property: prop(115), tenant: { id: 13, fullName: "Momota Begum" }, amount: 72000, frequency: "monthly", nextDueDate: date(14), endDate: date(345), isActive: true },
  { id: 5, title: "Annual maintenance fund", billType: "maintenance", property: prop(107), tenant: { id: 4, fullName: "Tanvir Ahmed" }, amount: 24000, frequency: "yearly", nextDueDate: date(88), endDate: null, isActive: false },
];

/* ------------------------------ maintenance ------------------------------ */

export const maintenanceRequests: MaintenanceRequest[] = [
  { id: 1, title: "Kitchen pipe leaking under the sink", description: "Water pooling under the sink since last night; the cabinet base is already soaked.", property: prop(101), tenant: { id: 3, fullName: "Sadia Rahman" }, landlord: { id: 1, fullName: "Nusrat Jahan" }, priority: "urgent", category: "plumbing", status: "pending", commentsCount: 0, mediaCount: 3, createdAt: ago(0, 5), updatedAt: ago(0, 5) },
  { id: 2, title: "Bedroom AC not cooling", description: "Outdoor unit runs but no cold air. Possibly a gas leak.", property: prop(103), tenant: { id: 7, fullName: "Farhana Akter" }, landlord: { id: 2, fullName: "Arif Hossain" }, priority: "high", category: "appliance", status: "in_progress", commentsCount: 4, mediaCount: 1, createdAt: ago(3), updatedAt: ago(1) },
  { id: 3, title: "Lift stuck between floors 4 and 5", description: "Lift halted twice today with passengers inside.", property: prop(101), tenant: { id: 3, fullName: "Sadia Rahman" }, landlord: { id: 1, fullName: "Nusrat Jahan" }, priority: "urgent", category: "electrical", status: "acknowledged", commentsCount: 2, mediaCount: 0, createdAt: ago(1), updatedAt: ago(0, 8) },
  { id: 4, title: "Bathroom wall seepage", description: "Damp patch spreading on the shared wall after the rain.", property: prop(107), tenant: { id: 4, fullName: "Tanvir Ahmed" }, landlord: { id: 8, fullName: "Imran Kabir" }, priority: "medium", category: "structural", status: "pending", commentsCount: 1, mediaCount: 2, createdAt: ago(2), updatedAt: ago(2) },
  { id: 5, title: "Cockroach problem in the kitchen", description: "Needs pest control; it has been getting worse for two weeks.", property: prop(115), tenant: { id: 13, fullName: "Momota Begum" }, landlord: { id: 10, fullName: "Nabila Karim" }, priority: "low", category: "pest", status: "in_progress", commentsCount: 3, mediaCount: 0, createdAt: ago(6), updatedAt: ago(2) },
  { id: 6, title: "Main door lock jamming", description: "Key turns only halfway; it takes several attempts to open.", property: prop(103), tenant: { id: 7, fullName: "Farhana Akter" }, landlord: { id: 2, fullName: "Arif Hossain" }, priority: "medium", category: "other", status: "resolved", commentsCount: 5, mediaCount: 1, createdAt: ago(14), updatedAt: ago(9) },
  { id: 7, title: "No water supply on the 6th floor", description: "Pump seems not to be reaching the upper floors since Friday.", property: prop(101), tenant: { id: 3, fullName: "Sadia Rahman" }, landlord: { id: 1, fullName: "Nusrat Jahan" }, priority: "high", category: "plumbing", status: "resolved", commentsCount: 6, mediaCount: 0, createdAt: ago(22), updatedAt: ago(18) },
  { id: 8, title: "Request to repaint the living room", description: "Walls have not been painted since move-in three years ago.", property: prop(115), tenant: { id: 13, fullName: "Momota Begum" }, landlord: { id: 10, fullName: "Nabila Karim" }, priority: "low", category: "other", status: "rejected", commentsCount: 2, mediaCount: 4, createdAt: ago(30), updatedAt: ago(27) },
  { id: 9, title: "Shop shutter motor burnt out", description: "Shutter must be opened manually; motor smells burnt.", property: prop(107), tenant: { id: 4, fullName: "Tanvir Ahmed" }, landlord: { id: 8, fullName: "Imran Kabir" }, priority: "high", category: "electrical", status: "pending", commentsCount: 0, mediaCount: 1, createdAt: ago(0, 11), updatedAt: ago(0, 11) },
];

/* ------------------------------- inquiries ------------------------------- */

export const inquiries: PropertyInquiry[] = [
  { id: 1, property: prop(102), sender: { id: 15, fullName: "Ishrat Binte" }, name: "Ishrat Binte", phone: "+8801511667700", email: "ishrat.binte@gmail.com", message: "Is the flat available from the 1st of next month? Can I visit this weekend?", status: "open", repliesCount: 0, createdAt: ago(0, 3) },
  { id: 2, property: prop(104), sender: null, name: "Zahid Enterprises", phone: "+8801711889911", email: "info@zahident.com.bd", message: "We need around 4,000 sqft of office space. Is the rent negotiable for a 3-year term?", status: "open", repliesCount: 0, createdAt: ago(0, 7) },
  { id: 3, property: prop(108), sender: { id: 3, fullName: "Sadia Rahman" }, name: "Sadia Rahman", phone: "+8801911778899", message: "What is the asking price and is a bank loan arrangement possible?", status: "replied", repliesCount: 2, createdAt: ago(2) },
  { id: 4, property: prop(106), sender: { id: 9, fullName: "Shahriar Islam" }, name: "Shahriar Islam", phone: "+8801611778800", message: "Are bachelors allowed? I am a student at NSU.", status: "replied", repliesCount: 1, createdAt: ago(4) },
  { id: 5, property: prop(112), sender: null, name: "Nahar Logistics", phone: "+8801811220033", email: "ops@naharlogistics.com", message: "Looking for warehouse space with truck access. Can we schedule a site visit?", status: "open", repliesCount: 0, createdAt: ago(1) },
  { id: 6, property: prop(113), sender: { id: 11, fullName: "Jahid Hasan" }, name: "Jahid Hasan", phone: "+8801711111199", message: "Is there a lift in the building?", status: "closed", repliesCount: 3, createdAt: ago(12) },
  { id: 7, property: prop(117), sender: null, name: "BrightPath Consulting", email: "hr@brightpath.io", message: "Interested in the office suite for a 12-person team. Please share floor plans.", status: "open", repliesCount: 0, createdAt: ago(0, 1) },
  { id: 8, property: prop(109), sender: { id: 13, fullName: "Momota Begum" }, name: "Momota Begum", phone: "+8801611334400", message: "Is the room furnished? Does the rent include utility bills?", status: "closed", repliesCount: 2, createdAt: ago(20) },
];

/* ---------------------------- subscriptions ------------------------------ */

export const subscriptionPlans: SubscriptionPlan[] = [
  { id: 1, tier: "free", displayName: "Free", maxProperties: 1, monthlyCredits: 5, priceMonthly: 0, priceYearly: 0, isActive: true, subscribers: 1840, features: { marketplaceListing: true, support: "Community", bookingTools: false, analytics: false } },
  { id: 2, tier: "basic", displayName: "Basic", maxProperties: 5, monthlyCredits: 30, priceMonthly: 500, priceYearly: 5000, isActive: true, subscribers: 612, features: { marketplaceListing: true, support: "Email", bookingTools: true, analytics: false } },
  { id: 3, tier: "premium", displayName: "Premium", maxProperties: 25, monthlyCredits: 120, priceMonthly: 1500, priceYearly: 15000, isActive: true, subscribers: 203, features: { marketplaceListing: true, support: "Priority", bookingTools: true, analytics: true } },
  { id: 4, tier: "enterprise", displayName: "Enterprise", maxProperties: 500, monthlyCredits: 600, priceMonthly: 6000, priceYearly: 60000, isActive: true, subscribers: 24, features: { marketplaceListing: true, support: "Dedicated manager", bookingTools: true, analytics: true } },
];

export const userSubscriptions: UserSubscription[] = [
  { id: 1, user: user(1), plan: { id: 3, tier: "premium", displayName: "Premium" }, startDate: date(-300), endDate: date(65), isActive: true, autoRenew: true, propertiesUsed: 3 },
  { id: 2, user: user(2), plan: { id: 4, tier: "enterprise", displayName: "Enterprise" }, startDate: date(-280), endDate: date(85), isActive: true, autoRenew: true, propertiesUsed: 3 },
  { id: 3, user: user(5), plan: { id: 2, tier: "basic", displayName: "Basic" }, startDate: date(-150), endDate: date(-5), isActive: false, autoRenew: false, propertiesUsed: 3 },
  { id: 4, user: user(8), plan: { id: 3, tier: "premium", displayName: "Premium" }, startDate: date(-90), endDate: date(275), isActive: true, autoRenew: true, propertiesUsed: 3 },
  { id: 5, user: user(10), plan: { id: 2, tier: "basic", displayName: "Basic" }, startDate: date(-40), endDate: date(325), isActive: true, autoRenew: false, propertiesUsed: 3 },
  { id: 6, user: user(14), plan: { id: 1, tier: "free", displayName: "Free" }, startDate: date(-4), endDate: null, isActive: true, autoRenew: false, propertiesUsed: 3 },
];

/* -------------------------------- credits -------------------------------- */

export const creditPackages: CreditPackage[] = [
  { id: 1, name: "Starter pack", credits: 20, price: 200, isActive: true },
  { id: 2, name: "Standard pack", credits: 60, price: 500, isActive: true },
  { id: 3, name: "Value pack", credits: 150, price: 1100, isActive: true },
  { id: 4, name: "Pro pack", credits: 400, price: 2600, isActive: true },
  { id: 5, name: "Eid bonus pack", credits: 100, price: 600, isActive: false },
];

export const creditWallets: CreditWallet[] = [
  { id: 1, user: user(3), balance: 46, reserved: 4, updatedAt: ago(0, 3) },
  { id: 2, user: user(4), balance: 12, reserved: 0, updatedAt: ago(1) },
  { id: 3, user: user(7), balance: 128, reserved: 10, updatedAt: ago(0, 6) },
  { id: 4, user: user(9), balance: 2, reserved: 0, updatedAt: ago(4) },
  { id: 5, user: user(13), balance: 64, reserved: 6, updatedAt: ago(2) },
  { id: 6, user: user(15), balance: 18, reserved: 2, updatedAt: ago(0, 1) },
];

export const creditTransactions: CreditTransaction[] = [
  { id: 1, user: { id: 3, fullName: "Sadia Rahman" }, transactionType: "deduction", scope: "user_action", amount: 2, balanceAfter: 46, description: "Unlocked address & contact — Dhanmondi 27", createdAt: ago(0, 3) },
  { id: 2, user: { id: 7, fullName: "Farhana Akter" }, transactionType: "purchase", scope: "user_action", amount: 150, balanceAfter: 128, description: "Purchased Value pack", createdAt: ago(0, 6) },
  { id: 3, user: { id: 15, fullName: "Ishrat Binte" }, transactionType: "bonus", scope: "user_action", amount: 5, balanceAfter: 18, description: "Signup bonus", createdAt: ago(0, 20) },
  { id: 4, user: { id: 13, fullName: "Momota Begum" }, transactionType: "reserve", scope: "user_action", amount: 6, balanceAfter: 64, description: "Reserved for booking #12", createdAt: ago(1) },
  { id: 5, user: { id: 4, fullName: "Tanvir Ahmed" }, transactionType: "deduction", scope: "user_action", amount: 2, balanceAfter: 12, description: "Unlocked address & contact — Banani office floor", createdAt: ago(1) },
  { id: 6, user: { id: 9, fullName: "Shahriar Islam" }, transactionType: "expire", scope: "user_action", amount: 10, balanceAfter: 2, description: "Promotional credits expired", createdAt: ago(4) },
  { id: 7, user: { id: 3, fullName: "Sadia Rahman" }, transactionType: "grant", scope: "user_action", amount: 25, balanceAfter: 48, description: "Admin grant — goodwill after failed unlock", createdAt: ago(5) },
  { id: 8, user: { id: 7, fullName: "Farhana Akter" }, transactionType: "capture", scope: "pro_action", amount: 10, balanceAfter: 118, description: "Captured reservation for work order WO-2291", createdAt: ago(6) },
  { id: 9, user: { id: 13, fullName: "Momota Begum" }, transactionType: "refund", scope: "user_action", amount: 2, balanceAfter: 70, description: "Refund — duplicate unlock", createdAt: ago(8) },
  { id: 10, user: { id: 15, fullName: "Ishrat Binte" }, transactionType: "release", scope: "user_action", amount: 2, balanceAfter: 20, description: "Released hold — booking cancelled", createdAt: ago(9) },
];

/* --------------------------- service providers --------------------------- */

export const serviceProviders: ServiceProvider[] = [
  { id: 1, businessName: "Hasan Electric Works", providerType: "individual", owner: { id: 6, fullName: "Mehedi Hasan", email: "mehedi.hasan@gmail.com", phoneNumber: "+8801711556677" }, status: "pending_verification", verificationStatus: "pending", categories: ["Electrical"], serviceAreas: ["Gulshan", "Banani", "Baridhara"], rating: null, completedJobs: 0, documentsCount: 3, plan: "starter", submittedAt: ago(0, 8) },
  { id: 2, businessName: "Alam Plumbing Services", providerType: "individual", owner: { id: 12, fullName: "Rafiul Alam", email: "rafiul.alam@gmail.com", phoneNumber: "+8801911222233" }, status: "pending_verification", verificationStatus: "pending", categories: ["Plumbing"], serviceAreas: ["Mirpur", "Mohammadpur"], rating: null, completedJobs: 0, documentsCount: 2, plan: "starter", submittedAt: ago(1) },
  { id: 3, businessName: "CityFix Maintenance Ltd.", providerType: "organization", owner: { id: 8, fullName: "Imran Kabir", email: "imran.kabir@gmail.com", phoneNumber: "+8801811990011" }, status: "active", verificationStatus: "verified", categories: ["Electrical", "Plumbing", "Carpentry"], serviceAreas: ["Dhaka North", "Dhaka South"], rating: 4.7, completedJobs: 146, documentsCount: 6, plan: "business", submittedAt: ago(96) },
  { id: 4, businessName: "GreenPest Control", providerType: "organization", owner: { id: 2, fullName: "Arif Hossain", email: "arif.hossain@gmail.com", phoneNumber: "+8801811445566" }, status: "active", verificationStatus: "verified", categories: ["Pest control", "Cleaning"], serviceAreas: ["Dhaka North", "Uttara"], rating: 4.4, completedJobs: 88, documentsCount: 5, plan: "professional", submittedAt: ago(140) },
  { id: 5, businessName: "Chattogram Cool AC Care", providerType: "individual", owner: { id: 14, fullName: "Sabbir Khan", email: "sabbir.khan@gmail.com", phoneNumber: "+8801811556600" }, status: "paused", verificationStatus: "verified", categories: ["Appliance repair"], serviceAreas: ["Chattogram"], rating: 4.1, completedJobs: 31, documentsCount: 4, plan: "starter", submittedAt: ago(70) },
  { id: 6, businessName: "Quick Shift Movers", providerType: "organization", owner: { id: 5, fullName: "Rownak Chowdhury", email: "rownak.chowdhury@gmail.com", phoneNumber: "+8801511334455" }, status: "suspended", verificationStatus: "rejected", categories: ["Moving"], serviceAreas: ["Dhaka North"], rating: 2.8, completedJobs: 19, documentsCount: 2, plan: "starter", submittedAt: ago(55) },
  { id: 7, businessName: "Sylhet Interior Studio", providerType: "organization", owner: { id: 10, fullName: "Nabila Karim", email: "nabila.karim@gmail.com", phoneNumber: "+8801511889900" }, status: "subscription_expired", verificationStatus: "verified", categories: ["Interior", "Carpentry"], serviceAreas: ["Sylhet"], rating: 4.9, completedJobs: 52, documentsCount: 5, plan: "professional", submittedAt: ago(200) },
  { id: 8, businessName: "Nipun Cleaning Crew", providerType: "individual", owner: { id: 1, fullName: "Nusrat Jahan", email: "nusrat.jahan@gmail.com", phoneNumber: "+8801711002233" }, status: "pending_verification", verificationStatus: "pending", categories: ["Cleaning"], serviceAreas: ["Dhanmondi", "Mohammadpur"], rating: null, completedJobs: 0, documentsCount: 1, plan: "starter", submittedAt: ago(2) },
];

export const workOrders: ServiceWorkOrder[] = [
  { id: 1, reference: "WO-2314", provider: { id: 3, businessName: "CityFix Maintenance Ltd." }, requester: { id: 1, fullName: "Nusrat Jahan" }, serviceType: "Lift electrical repair", amount: 18500, status: "in_progress", scheduledFor: ahead(0, 6), createdAt: ago(1) },
  { id: 2, reference: "WO-2309", provider: { id: 4, businessName: "GreenPest Control" }, requester: { id: 10, fullName: "Nabila Karim" }, serviceType: "Kitchen pest treatment", amount: 4200, status: "scheduled", scheduledFor: ahead(2, 4), createdAt: ago(3) },
  { id: 3, reference: "WO-2301", provider: { id: 3, businessName: "CityFix Maintenance Ltd." }, requester: { id: 2, fullName: "Arif Hossain" }, serviceType: "AC gas refill & servicing", amount: 6800, status: "completed_by_provider", scheduledFor: ago(1, 3), createdAt: ago(5) },
  { id: 4, reference: "WO-2288", provider: { id: 7, businessName: "Sylhet Interior Studio" }, requester: { id: 14, fullName: "Sabbir Khan" }, serviceType: "Living room repaint", amount: 42000, status: "confirmed", scheduledFor: ago(8), createdAt: ago(15) },
  { id: 5, reference: "WO-2276", provider: { id: 6, businessName: "Quick Shift Movers" }, requester: { id: 9, fullName: "Shahriar Islam" }, serviceType: "Household move, Mirpur → Uttara", amount: 11000, status: "disputed", scheduledFor: ago(12), createdAt: ago(20) },
  { id: 6, reference: "WO-2265", provider: { id: 5, businessName: "Chattogram Cool AC Care" }, requester: { id: 8, fullName: "Imran Kabir" }, serviceType: "Shutter motor replacement", amount: 9500, status: "cancelled", scheduledFor: null, createdAt: ago(26) },
];

/* ----------------------------- notifications ----------------------------- */

export const notifications: Notification[] = [
  { id: 1, type: "maintenance", title: "Urgent maintenance request", message: "Sadia Rahman reported a kitchen pipe leak at Gulshan 2 — 3 bed family apartment.", targetUrl: "/maintenance", isRead: false, createdAt: ago(0, 5) },
  { id: 2, type: "booking", title: "New booking awaiting approval", message: "Wedding reception on the Uttara rooftop deck for 150 guests.", targetUrl: "/bookings", isRead: false, createdAt: ago(0, 4) },
  { id: 3, type: "rent_bill", title: "Payment proof submitted", message: "Momota Begum uploaded a cash receipt for October rent at Niketan.", targetUrl: "/rent", isRead: false, createdAt: ago(0, 6) },
  { id: 4, type: "service_provider", title: "Provider application received", message: "Hasan Electric Works submitted 3 verification documents.", targetUrl: "/service-providers", isRead: false, createdAt: ago(0, 8) },
  { id: 5, type: "lease", title: "Lease awaiting tenant signature", message: "Dhanmondi 27 lease for Ishrat Binte has been pending for 2 days.", targetUrl: "/leases", isRead: true, createdAt: ago(2) },
  { id: 6, type: "rent_bill", title: "Bill overdue", message: "Agrabad shop rent is 12 days overdue (৳65,000).", targetUrl: "/rent", isRead: true, createdAt: ago(3) },
  { id: 7, type: "general", title: "Monthly credits granted", message: "Subscription credits were issued to 839 active subscribers.", isRead: true, createdAt: ago(16) },
  { id: 8, type: "booking", title: "Booking cancelled", message: "Corporate iftar booking was cancelled and fully refunded.", targetUrl: "/bookings", isRead: true, createdAt: ago(18) },
];

/* ----------------------------------- geo ---------------------------------- */

export const geoRows: GeoRow[] = [
  { id: 1, name: "Dhaka", level: "division", childrenCount: 13, propertiesCount: 12 },
  { id: 2, name: "Chattogram", level: "division", childrenCount: 11, propertiesCount: 3 },
  { id: 3, name: "Sylhet", level: "division", childrenCount: 4, propertiesCount: 1 },
  { id: 4, name: "Rajshahi", level: "division", childrenCount: 8, propertiesCount: 1 },
  { id: 5, name: "Khulna", level: "division", childrenCount: 10, propertiesCount: 0 },
  { id: 6, name: "Barishal", level: "division", childrenCount: 6, propertiesCount: 0 },
  { id: 7, name: "Rangpur", level: "division", childrenCount: 8, propertiesCount: 0 },
  { id: 8, name: "Mymensingh", level: "division", childrenCount: 4, propertiesCount: 0 },
];

export const geoDistricts: GeoRow[] = [
  { id: 11, name: "Dhaka", parent: "Dhaka", level: "district", childrenCount: 41, propertiesCount: 11 },
  { id: 12, name: "Gazipur", parent: "Dhaka", level: "district", childrenCount: 9, propertiesCount: 1 },
  { id: 13, name: "Narayanganj", parent: "Dhaka", level: "district", childrenCount: 7, propertiesCount: 0 },
  { id: 14, name: "Chattogram", parent: "Chattogram", level: "district", childrenCount: 16, propertiesCount: 3 },
  { id: 15, name: "Cox's Bazar", parent: "Chattogram", level: "district", childrenCount: 9, propertiesCount: 0 },
  { id: 16, name: "Sylhet", parent: "Sylhet", level: "district", childrenCount: 13, propertiesCount: 1 },
  { id: 17, name: "Rajshahi", parent: "Rajshahi", level: "district", childrenCount: 9, propertiesCount: 1 },
];

export const geoThanas: GeoRow[] = [
  { id: 21, name: "Gulshan", parent: "Dhaka", level: "thana", childrenCount: 12, propertiesCount: 3 },
  { id: 22, name: "Dhanmondi", parent: "Dhaka", level: "thana", childrenCount: 9, propertiesCount: 1 },
  { id: 23, name: "Uttara West", parent: "Dhaka", level: "thana", childrenCount: 14, propertiesCount: 1 },
  { id: 24, name: "Badda", parent: "Dhaka", level: "thana", childrenCount: 8, propertiesCount: 2 },
  { id: 25, name: "Tejgaon", parent: "Dhaka", level: "thana", childrenCount: 6, propertiesCount: 1 },
  { id: 26, name: "Mirpur", parent: "Dhaka", level: "thana", childrenCount: 11, propertiesCount: 1 },
  { id: 27, name: "Mohammadpur", parent: "Dhaka", level: "thana", childrenCount: 10, propertiesCount: 1 },
  { id: 28, name: "Double Mooring", parent: "Chattogram", level: "thana", childrenCount: 7, propertiesCount: 1 },
  { id: 29, name: "Khulshi", parent: "Chattogram", level: "thana", childrenCount: 5, propertiesCount: 1 },
];

export const geoAreas: GeoRow[] = [
  { id: 31, name: "Gulshan 1", parent: "Gulshan", level: "area", propertiesCount: 1 },
  { id: 32, name: "Gulshan 2", parent: "Gulshan", level: "area", propertiesCount: 1 },
  { id: 33, name: "Niketan", parent: "Gulshan", level: "area", propertiesCount: 1 },
  { id: 34, name: "Dhanmondi 27", parent: "Dhanmondi", level: "area", propertiesCount: 1 },
  { id: 35, name: "Sector 7", parent: "Uttara West", level: "area", propertiesCount: 1 },
  { id: 36, name: "Bashundhara R/A", parent: "Badda", level: "area", propertiesCount: 2 },
  { id: 37, name: "Agrabad", parent: "Double Mooring", level: "area", propertiesCount: 1 },
  { id: 38, name: "South Khulshi", parent: "Khulshi", level: "area", propertiesCount: 1 },
];

/* ---------------------------- derived analytics --------------------------- */

export const badgeCounts = {
  pendingLeases: leases.filter((l) => l.status === "pending").length,
  pendingBookings: bookings.filter((b) => b.status === "pending").length,
  billsToVerify: rentBills.filter((b) => b.status === "pending_verification").length,
  openMaintenance: maintenanceRequests.filter((m) =>
    ["pending", "acknowledged", "in_progress"].includes(m.status),
  ).length,
  openInquiries: inquiries.filter((i) => i.status === "open").length,
  providerApplications: serviceProviders.filter((p) => p.status === "pending_verification").length,
  unreadNotifications: notifications.filter((n) => !n.isRead).length,
};

export const monthLabels = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

export const revenueSeries = {
  rent: [612000, 648000, 655000, 701000, 718000, 742000, 769000],
  bookings: [118000, 142000, 96000, 164000, 188000, 173000, 214000],
  subscriptions: [84000, 88000, 91000, 96000, 102000, 108000, 116000],
  credits: [32000, 28000, 41000, 38000, 44000, 51000, 58000],
};

export const occupancySeries = [71, 73, 72, 76, 78, 77, 81];
export const newUsersSeries = [48, 62, 55, 78, 91, 84, 103];
export const bookingVolumeSeries = [26, 31, 22, 38, 44, 41, 52];
export const propertyGrowthSeries = [9, 10, 11, 13, 14, 16, 18];

export const activityFeed = [
  { id: 1, who: "Sadia Rahman", action: "submitted payment proof for", target: "October rent — Gulshan 2", at: ago(0, 1), tone: "info" as const },
  { id: 2, who: "Hasan Electric Works", action: "applied for provider verification in", target: "Electrical / Gulshan", at: ago(0, 8), tone: "warn" as const },
  { id: 3, who: "Ishrat Binte", action: "requested a booking for", target: "Uttara rooftop — main deck", at: ago(0, 9), tone: "brand" as const },
  { id: 4, who: "Nabila Karim", action: "activated a lease for", target: "Niketan — 3 bed furnished", at: ago(1) , tone: "ok" as const },
  { id: 5, who: "Tanvir Ahmed", action: "went overdue on", target: "Agrabad shop rent (12 days)", at: ago(1, 4), tone: "bad" as const },
  { id: 6, who: "Farhana Akter", action: "purchased", target: "Value pack — 150 credits", at: ago(1, 9), tone: "info" as const },
  { id: 7, who: "Rownak Chowdhury", action: "initiated a property transfer of", target: "Mirpur DOHS — 3 bed", at: ago(2), tone: "brand" as const },
];
