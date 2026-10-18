"""Seed the throwaway verification database with one landlord and a few properties."""
from decimal import Decimal
from datetime import date, timedelta

from apps.accounts.models import User, UserRole
from apps.properties.models import (
    Property, PropertyCategory, PropertyType, Amenity, PropertyUnit, PropertyStatus, ListingType,
)
from apps.geo.models import Division, District, Thana, Area
from apps.subscriptions.models import SubscriptionPlan, SubscriptionTier, UserSubscription
from apps.leases.models import Lease, LeaseStatus
from apps.maintenance.models import MaintenanceRequest
from apps.rent.models import RentBill, BillStatus, BillType
from apps.inquiries.models import PropertyInquiry

landlord, _ = User.objects.get_or_create(
    email="landlord@nextholder.test",
    defaults=dict(full_name="Nusrat Jahan", phone_number="+8801711002233",
                  roles=["landlord", "tenant"], current_role=UserRole.LANDLORD, is_verified=True),
)
landlord.set_password("verify-pass-123")
landlord.roles = ["landlord", "tenant"]
landlord.current_role = UserRole.LANDLORD
landlord.save()

tenant, _ = User.objects.get_or_create(
    email="tenant@nextholder.test",
    defaults=dict(full_name="Sadia Rahman", phone_number="+8801911778899",
                  roles=["tenant"], current_role=UserRole.TENANT, is_verified=True),
)
tenant.set_password("verify-pass-123")
tenant.save()

residential, _ = PropertyCategory.objects.get_or_create(
    slug="residential", defaults=dict(name="Residential", order=1))
event, _ = PropertyCategory.objects.get_or_create(
    slug="event-bookable", defaults=dict(name="Event & bookable", order=3))
apartment, _ = PropertyType.objects.get_or_create(
    category=residential, slug="apartment", defaults=dict(name="Apartment", order=1))
rooftop, _ = PropertyType.objects.get_or_create(
    category=event, slug="rooftop-venue", defaults=dict(name="Rooftop venue", order=1))

for name in ["Lift", "Generator backup", "Car parking", "CCTV"]:
    Amenity.objects.get_or_create(slug=name.lower().replace(" ", "-"), defaults=dict(name=name))
amenities = list(Amenity.objects.all())

# Geo hierarchy. Creating a property requires division/district/thana, so the
# form's cascading pickers need something to offer.
dhaka_div, _ = Division.objects.get_or_create(slug="dhaka", defaults=dict(name="Dhaka"))
ctg_div, _ = Division.objects.get_or_create(slug="chattogram", defaults=dict(name="Chattogram"))
dhaka_dist, _ = District.objects.get_or_create(
    division=dhaka_div, slug="dhaka", defaults=dict(name="Dhaka"))
ctg_dist, _ = District.objects.get_or_create(
    division=ctg_div, slug="chattogram", defaults=dict(name="Chattogram"))
thanas = {}
for district, names in [(dhaka_dist, ["Gulshan", "Dhanmondi", "Mirpur", "Uttara", "Baridhara"]),
                        (ctg_dist, ["Khulshi", "Panchlaish"])]:
    for name in names:
        thanas[name], _ = Thana.objects.get_or_create(
            district=district, slug=name.lower(), defaults=dict(name=name))
for thana_name, area_names in [("Gulshan", ["Gulshan 1", "Gulshan 2"]),
                               ("Dhanmondi", ["Road 27", "Jigatola"]),
                               ("Mirpur", ["Mirpur DOHS", "Pallabi"]),
                               ("Uttara", ["Sector 7", "Sector 13"]),
                               ("Baridhara", ["Baridhara DOHS", "Diplomatic Zone"]),
                               ("Khulshi", ["South Khulshi"]),
                               ("Panchlaish", ["Mehedibag"])]:
    for area_name in area_names:
        Area.objects.get_or_create(
            thana=thanas[thana_name], slug=area_name.lower().replace(" ", "-"),
            defaults=dict(name=area_name, area_type="neighbourhood"))

# Signing up puts a landlord on the Free plan, whose 2-property limit would
# reject every create from the console. Move the seeded landlord onto Basic so
# the create path is exercisable; drop its limit here to see the rejection.
plan, _ = SubscriptionPlan.objects.get_or_create(
    tier=SubscriptionTier.BASIC,
    defaults=dict(display_name="Basic", max_properties=10, monthly_credits=50,
                  price_monthly=Decimal(500), price_yearly=Decimal(5000)),
)
UserSubscription.objects.update_or_create(user=landlord, defaults=dict(plan=plan, is_active=True))

seeds = [
    ("Gulshan 2 — 3 bed family apartment", apartment, ListingType.FOR_RENT, PropertyStatus.OCCUPIED,
     False, "House 42, Road 11", "Dhaka", "Gulshan 2", 85000, 2100, 3, 3),
    ("Dhanmondi 27 — 2 bed with lake view", apartment, ListingType.FOR_RENT, PropertyStatus.AVAILABLE,
     True, "House 9, Road 27", "Dhaka", "Dhanmondi", 48000, 1400, 2, 2),
    ("Mirpur DOHS — 3 bed, semi-furnished", apartment, ListingType.FOR_RENT, PropertyStatus.AVAILABLE,
     True, "House 522, Road 9", "Dhaka", "Mirpur DOHS", 42000, 1550, 3, 2),
    ("Uttara Sector 7 — Rooftop event venue", rooftop, ListingType.FOR_BOOK, PropertyStatus.AVAILABLE,
     True, "House 3, Road 12, Sector 7", "Dhaka", "Uttara", 18000, 2600, 0, 2),
    ("Khulshi — Independent house with garden", apartment, ListingType.FOR_SALE, PropertyStatus.AVAILABLE,
     True, "Road 2, South Khulshi", "Chattogram", "Khulshi", 15500000, 4800, 6, 5),
    ("Baridhara DOHS — 4 bed on high floor", apartment, ListingType.FOR_RENT, PropertyStatus.MAINTENANCE,
     False, "House 310, Road 5", "Dhaka", "Baridhara DOHS", 95000, 2600, 4, 4),
]

created = []
for (title, ptype, listing, status, listed, street, city, hood, rent, sqft, bed, bath) in seeds:
    prop, _ = Property.objects.get_or_create(
        title=title,
        defaults=dict(
            landlord=landlord, description=(
                "Well-maintained space with reliable utilities, lift access and dedicated "
                "parking. Walking distance from main road transport and local markets."),
            category=ptype.category, property_type=ptype, listing_type=listing, status=status,
            is_listed_in_marketplace=listed, street=street, city=city, state="Dhaka",
            division=thanas[hood.split()[0]].district.division,
            district=thanas[hood.split()[0]].district,
            thana=thanas[hood.split()[0]],
            neighborhood=hood, rent_amount=Decimal(rent), deposit_amount=Decimal(rent * 2),
            area_sqft=Decimal(sqft), bedrooms=bed, bathrooms=bath, balconies=1, rooms=bed + 2,
            has_kitchen=True, has_drawing_room=bed > 2,
            available_from=date.today() + timedelta(days=7),
        ),
    )
    prop.amenities.set(amenities[:3])
    created.append(prop)

venue = created[3]
for unit_name, cap, amount in [("Rooftop — main deck", 180, 5000),
                               ("Rooftop — covered lounge", 60, 2500),
                               ("Ground-floor prep kitchen", 12, 1000)]:
    PropertyUnit.objects.get_or_create(
        property=venue, name=unit_name,
        defaults=dict(capacity=cap, confirmation_amount=Decimal(amount)))

occupied = created[0]
lease, _ = Lease.objects.get_or_create(
    property=occupied, tenant=tenant,
    defaults=dict(landlord=landlord, start_date=date.today() - timedelta(days=300),
                  end_date=date.today() + timedelta(days=65), rent_amount=Decimal(85000),
                  deposit_amount=Decimal(170000), status=LeaseStatus.ACTIVE))

RentBill.objects.get_or_create(
    lease=lease, title="October rent",
    defaults=dict(property=occupied, tenant=tenant, landlord=landlord, bill_type=BillType.RENT,
                  amount=Decimal(85000), due_date=date.today() - timedelta(days=2),
                  status=BillStatus.PENDING_VERIFICATION))
RentBill.objects.get_or_create(
    lease=lease, title="Service charge — October",
    defaults=dict(property=occupied, tenant=tenant, landlord=landlord,
                  bill_type=BillType.SERVICE_CHARGE, amount=Decimal(6500),
                  due_date=date.today() + timedelta(days=3), status=BillStatus.UNPAID))

MaintenanceRequest.objects.get_or_create(
    property=occupied, title="Kitchen pipe leaking under the sink",
    defaults=dict(lease=lease, tenant=tenant, landlord=landlord,
                  description="Water pooling under the sink since last night.",
                  priority="urgent", category="plumbing", status="pending"))

PropertyInquiry.objects.get_or_create(
    property=created[1], name="Ishrat Binte",
    defaults=dict(sender=tenant, phone="+8801511667700", email="ishrat@example.com",
                  message="Is the flat available from the 1st? Can I visit this weekend?"))

print("plan:", plan.display_name, "limit:", plan.max_properties)
print("landlord:", landlord.email, "properties:", Property.objects.filter(landlord=landlord).count())
