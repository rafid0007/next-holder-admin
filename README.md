# Next Holder — Admin console

Admin panel for the **next-holder-backend** property management platform (Django REST
Framework, `/api/v1`). Built with Next.js 16 (App Router), TypeScript and Tailwind v4.

```bash
npm install
npm run dev       # http://localhost:3000
```

**Every screen reads live data from the staff API at `/api/v1/admin/`.** There are no fixtures in
the repo. Access is gated by the backend's role-based permissions: `GET /admin/me` decides what the
signed-in admin can see, and the navigation, pages and buttons follow from it. The contract is
`../next-holder-backend/docs/admin-panel-api.md`.

> The `/admin/` API lives on the backend's **`dev`** branch. Point `NEXT_PUBLIC_API_BASE_URL` at a
> server running that branch, with its migrations applied — a database that predates
> `admin_panel/0001_initial` cannot serve it.

---

## Screens

Each page declares the permission it needs; an admin without it never sees the nav entry, and
deep-linking shows an explanation rather than a failed request.

| Route | What it covers | Permission |
| --- | --- | --- |
| `/` | Users, listings, bookings and moderation counters, income by stream | `dashboard.view` |
| `/reports` | Six metrics over time from the timeseries endpoint | `analytics.view` |
| `/properties` | Every landlord's listings with server-side filters, landlord column, hide/unhide | `listings.view` |
| `/properties/[id]` | Any landlord's property: gallery, specs, moderation state, related records | `listings.view` |
| `/marketplace` | The public marketplace as tenants see it | — |
| `/leases` · `/bookings` · `/rent` · `/payments` | Platform-wide operations, read-only | `operations.view` |
| `/promotions` | Landlord discounts and promo codes; staff switch them on or off | `promotions.view` |
| `/maintenance` · `/inquiries` | Landlord-scoped — no admin equivalent yet | — |
| `/service-providers` | Verification applications with documents; approve, reject, suspend, reinstate | `providers.view` |
| `/moderation` | Booking complaints and provisional tenant reports | `reports.view` / `complaints.view` |
| `/users` | Every account; suspend, verify, change roles, see activity | `users.view` |
| `/subscriptions` | Plan CRUD, MRR, subscribers, assigning a user's plan | `subscriptions.view` |
| `/credits` | Packages, every wallet, the full ledger, grant/refund/deduct | `credits.view` |
| `/taxonomy` | Categories, types and amenities, including inactive rows | `listings.view` |
| `/geo` | Division → district → thana → area, with create and cascade delete | `geo.manage` |
| `/staff` | Staff members, role assignment, and a role editor over the permission catalog | `staff.view` |
| `/audit` | Every staff write with before/after snapshots | `audit.view` |
| `/notifications` · `/settings` | The admin's own inbox, and console configuration | — |
| `/login` | JWT sign-in by email or phone | — |

Shell features: permission-filtered sidebar with live work-queue counts, ⌘K command palette,
notification panel, light and dark themes.

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
    work-queue.ts           sidebar pending-work counts
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

Every screen reads live data. Several are scoped to the signed-in landlord rather than the whole
platform, because the API has no staff-wide equivalent yet — see
[What the current API cannot do yet](#what-the-current-api-cannot-do-yet).

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

The backend's `dev` branch closed almost every gap. What is left, and how the console handles it:

- **No admin property create or edit.** `/admin/properties` is read plus hide/unhide, so those
  buttons are gone rather than quietly writing through a landlord route.
- **Operations are read-only.** Confirming a booking, verifying a payment proof and activating a
  lease stay landlord actions, so those screens list and explain instead of acting.
- **Maintenance and inquiries have no admin endpoints.** Both pages carry a banner saying they
  show only the signed-in account's records.
- **No admin work-order list**, so that panel names the endpoint it needs.
- **Still missing per §15 of the spec:** `unlockCount`/`favoriteCount` on listings, a global
  availability-blocks list, `commentsCount`/`mediaCount` on maintenance, `repliesCount` and a
  detail route on inquiries, `requesterName` on work orders, and bulk actions.

