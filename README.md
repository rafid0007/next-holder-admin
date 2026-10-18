# Next Holder — Admin console

Admin panel for the **next-holder-backend** property management platform (Django REST
Framework, `/api/v1`). Built with Next.js 16 (App Router), TypeScript and Tailwind v4.

```bash
npm install
npm run dev       # http://localhost:3000
```

**`/login`, `/properties` and `/properties/[id]` read live data from the API.** Every other
screen still renders from a fixture set in `src/lib/mock/data.ts`, shaped like the v1 serializer
responses, so the rest of the console works without the backend running. The typed API client and
the full endpoint map are already in place — see **Wiring it to the backend** below.

---

## Screens

✅ marks a screen that is wired to the live API; the rest read fixtures.

| Route | What it covers | Backing endpoints |
| --- | --- | --- |
| `/` | Revenue by stream, work queue, portfolio status, rent collection, booking volume, activity feed | `landlord/finance/summary`, `landlord/reports/overview`, `bookings/reports/overview` |
| `/properties` ✅ | Listings with status tabs, table/grid views, create flow, ownership transfers | `properties/`, `properties/transfer-requests/` |
| `/properties/[id]` ✅ | Photo gallery, specs, amenities, marketplace toggle, units, leases, bookings, bills, maintenance, inquiries | `properties/{id}/…` plus each related list filtered by `propertyId` |
| `/marketplace` | Public visibility, unlock and favourite economics, per-listing engagement | `marketplace/properties/`, `…/unlock`, `…/favorite` |
| `/leases` | Lifecycle tabs, expandable rows with activate / terminate / upload contract, create flow | `leases/`, `…/activate`, `…/terminate` |
| `/bookings` | Approval queue, revenue and volume charts, manual bookings, availability blocks, discounts | `bookings/`, `bookings/manual`, `properties/{id}/availability-blocks` |
| `/rent` | Bills by state, collection donut, payment-proof review drawer, recurring schedules | `rent/bills/`, `…/verify-payment`, `rent/bill-schedules/` |
| `/maintenance` | Pipeline board, category breakdown, request drawer with status changes, comments and forward-to-provider | `maintenance/requests/…` |
| `/inquiries` | Two-pane inbox with reply and close | `property-inquiries/`, `…/reply`, `…/close` |
| `/service-providers` | Verification applications with document review, active providers, work orders | `service-providers/admin/applications/…`, `…/work-orders/` |
| `/users` | Landlords, tenants and providers; verification, provisional tenants, per-user drawer | `auth/users`, `auth/tenants/…` |
| `/subscriptions` | Plan cards, limits and credit allowances, subscriber table with usage against limits | `subscriptions/plans/`, `subscriptions/me` |
| `/credits` | Packages, wallets, full transaction ledger, admin grant | `credits/packages`, `credits/transactions`, `credits/admin/grant` |
| `/taxonomy` | Categories → types master/detail, amenities and their applicable types | `properties/categories/…`, `properties/amenities/…` |
| `/geo` | Division → district → thana → area browser, coverage, reverse lookup | `geo/divisions`, `geo/districts`, `geo/thanas`, `geo/areas`, `geo/reverse-admin` |
| `/notifications` | Inbox, delivery channel matrix, announcement composer | `notifications/`, `…/read`, `…/read-all` |
| `/settings` | Credit economy, property/booking defaults, verification rules, admin access, integrations | platform configuration |
| `/login` ✅ | JWT sign-in by email or phone | `auth/signin`, `auth/token/refresh` |

Shell features: collapsible grouped sidebar with live work-queue counts, ⌘K command palette
over pages / properties / people, notification dropdown, light and dark themes.

---

## Project layout

```
src/
  app/
    layout.tsx              root layout, fonts, theme bootstrap
    globals.css             design tokens (light + dark), Tailwind v4 theme
    login/                  standalone auth screen
    (dashboard)/            sidebar + topbar shell and every admin screen
  components/
    ui/                     button, badge, card, field, table, tabs, modal, drawer, misc
    charts/                 bar chart and donut, hand-rolled SVG (no chart dependency)
    layout/                 sidebar, topbar, command palette, theme, nav config
  lib/
    api/types.ts            TypeScript mirror of the v1 serializers
    api/endpoints.ts        every backend route in one place
    api/client.ts           fetch wrapper: JWT, refresh-on-401, DRF error shape
    mock/data.ts            fixture data, swap for real calls per screen
    utils.ts                money / date / status formatters
```

### Design system

Tokens live on `:root` in `globals.css` and are redefined under `[data-theme="dark"]`:
surfaces (`canvas`, `surface`, `surface-muted`, `surface-hover`), lines, three ink weights,
one indigo brand accent and four semantic tones (`ok`, `warn`, `bad`, `info`). Components only
ever reference the tokens, so the whole console re-themes from that one block.

`StatusBadge` maps every `TextChoices` value in the backend — lease, booking, bill, provider,
work-order and verification states — onto a tone, so one component renders them all consistently.

---

## Running against the backend

Only `/login`, `/properties` and `/properties/[id]` read live data. The other screens render
fixtures whichever backend you point at — see
[What the current API cannot do yet](#what-the-current-api-cannot-do-yet) for why.

### Against a hosted deployment

1. Set the URL in `.env.local` (`cp .env.example .env.local` first). End it at `/api/v1`, with no
   trailing slash:

   ```bash
   NEXT_PUBLIC_API_BASE_URL=https://your-host.com/api/v1
   ```

   `NEXT_PUBLIC_*` values are inlined at build time, so restart `npm run dev` after changing it.
   The Settings page shows which API the console is pointed at, under Integrations.

2. On the **server**, add the console's origin to `CORS_ALLOWED_ORIGINS` (`http://localhost:3000`
   while developing) and restart it. `config/settings/prod.py` sets `CORS_ALLOW_ALL_ORIGINS =
   False`, so this is required — and a browser reports a CORS rejection as a plain network
   failure, so the console will say it could not reach the API even though the server is healthy.

3. `npm run dev`, sign in at `/login` with a landlord account on that deployment, open
   `/properties`.

Anything you do there writes straight through: the marketplace toggle, create and edit have no
staging step.

### Against a local Django server

```bash
cd ../next-holder-backend
.venv/bin/python manage.py migrate
.venv/bin/python manage.py runserver 8000
```

`.env.example` already points at `http://localhost:8000/api/v1`, so no config change is needed.

You then need a landlord account that owns some properties, since `/properties` lists only the
signed-in landlord's own portfolio. Either:

- **Seeded fixtures in a throwaway database** — `scripts/README.md` has the commands, and signs
  you in as `landlord@nextholder.test` / `verify-pass-123`.
- **Your own account**, then add properties through the console's "Add property" form:

  ```bash
  curl -X POST http://localhost:8000/api/v1/auth/signup \
    -H 'Content-Type: application/json' \
    -d '{"email":"you@example.com","password":"your-password","confirmPassword":"your-password",
         "fullName":"Your Name","phoneNumber":"+8801700000000","roles":["landlord"]}'
  ```

### If every property request returns 403

`IsLandlord` checks `current_role == 'landlord'`, not whether `landlord` appears in `roles`.
Signup sets `current_role` from the first role you pass, so the call above is fine — but an
existing account sitting in the tenant role is rejected on every property endpoint. The console
has no role switcher yet; switch over the API:

```bash
curl -X POST http://localhost:8000/api/v1/auth/switch-role \
  -H 'Content-Type: application/json' -H 'Authorization: Bearer <access-token>' \
  -d '{"role":"landlord"}'
```

### How the wired screens are built

`src/lib/api/hooks.ts` holds `useApi`, a small fetch hook: it keeps the previous data on screen
while a refetch is in flight, drops superseded responses, and derives `loading` rather than
setting it from inside an effect. `src/lib/api/resources.ts` holds the typed calls each screen
makes. Pass the fetcher through `useCallback` so it stays stable:

```tsx
const properties = useApi(useCallback(() => listAllProperties(), []));
```

Tab panels on the detail page use `useApiWhen(tab === "units", …)` so a tab only fetches when it
is first opened, and keeps what it loaded when you switch away.

`src/components/ui/states.tsx` turns an `ApiError` into something actionable: 401 offers a sign-in
link, 403 explains the ownership scoping, a network failure points at `NEXT_PUBLIC_API_BASE_URL`,
and anything else shows the backend's own message with a retry.

### Wiring another screen

Replace a page's mock import with a real call:

```ts
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { Property } from "@/lib/api/types";

const page = await api.list<Property>(endpoints.properties.list, { page: 1, page_size: 20 });
//    page.results / page.count / page.total_pages / page.current_page
```

The client attaches the bearer token, retries once through `auth/token/refresh` on a 401, and
turns the backend's `{ error, details, status_code }` body into a typed `ApiError`.

Two things to keep in mind when reading the responses:

- **Money comes back as a string.** DRF serialises `DecimalField` to a string and the backend does
  not override `COERCE_DECIMAL_TO_STRING`, so `rentAmount` is `"85000.00"`. The `Api*` types in
  `src/lib/api/types.ts` reflect that, and `money()` accepts either form.
- **The field names are the serializer's, not the model's.** A property's category arrives as
  `propertyCategory`, a transfer request carries `propertyTitle` and `sentAt` rather than a nested
  property and `createdAt`.

### What the current API cannot do yet

These are real constraints the wired screens work around, not omissions in the UI:

- **`GET /properties/` is scoped to one landlord** (`IsAuthenticated, IsLandlord`, via
  `PropertyService.get_landlord_properties`), so the list shows the signed-in landlord's own
  portfolio, not every property on the platform. There is no staff-wide property endpoint, and no
  landlord field on the response — which is why the list has no landlord column.
- **It filters only on the geo hierarchy** (`divisionId`, `districtId`, `thanaId`, `areaId`,
  `hasGeo`). Status, category, listing type, city and free-text search are applied in the browser
  over the full set, which `listAllProperties()` pages through at `page_size=100`. If those filters
  land server-side, pass them through `listAllProperties` and delete the client-side pass.
- **Several fixture-backed panels need endpoints that do not exist**: platform-wide finance (the
  existing summary is scoped to one landlord), cross-tenant credit wallet listing, and per-listing
  marketplace engagement counts. Each needs a staff-scoped endpoint before it can show live data.

Property creation is still a form-only flow: `POST /properties/` exists and
`PropertyCreateUpdateSerializer` defines the payload, but the modal does not submit yet.
