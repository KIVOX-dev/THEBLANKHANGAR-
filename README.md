# THE BLANK HANGAR

A full-stack e-commerce storefront and admin panel for a men's streetwear D2C brand — a
standalone **Next.js frontend** and a standalone **Express/TypeScript API backend**, talking
to each other over HTTP.

## Architecture

```
THEBLANKHANGAR/
├── frontend/            Next.js 16 (App Router) — storefront, admin UI, and a thin
│                        Backend-for-Frontend (BFF) proxy layer under app/api/**
├── backend/             Express API — all business logic, Prisma/MongoDB, JWT auth
├── docker-compose.yml   Optional local MongoDB replica set (Atlas works with no setup)
├── requirements.txt     (in each folder) plain-text dependency reference — package.json is
│                        the real source of truth; this is human-readable only
└── README.md
```

**The browser only ever talks to the frontend** (`localhost:3000`), never directly to the
backend (`localhost:4000`). Every `frontend/app/api/**/route.ts` file is a thin proxy: it
forwards the request to the backend, attaching the signed-in user's session token, and
relays the response back unchanged. This is a standard Backend-for-Frontend (BFF) pattern —
it means:

- No CORS exposure to the browser (server-to-server calls aren't subject to CORS at all).
- The JWT lives only in an httpOnly cookie set by the frontend's own domain — it's never
  visible to client-side JavaScript.
- Server Components that need data (product listings, account pages, admin pages) call
  `frontend/lib/api-client.ts` / `admin-api-client.ts`, which fetch from the backend
  server-side — the frontend has **no direct database access** anywhere.

## Stack

**Frontend** (`frontend/`): Next.js 16 (App Router) + TypeScript + Tailwind CSS v4, Zustand
(cart/wishlist), `jose` for JWT verification, Recharts for the admin dashboard.

**Backend** (`backend/`): Express 5 + TypeScript, Prisma ORM v6 + MongoDB, `jose` for JWT
signing/verification, `bcryptjs` for password hashing, `multer` for image uploads, `zod` for
request validation.

### Why Prisma v6, not v7

Prisma ORM v7 removed the MongoDB connector entirely. `backend/package.json` pins `prisma`
and `@prisma/client` to `^6`. Do not run `npm i prisma@latest` in `backend/` — it will break
the database layer.

## Setup

### 1. Backend

```bash
cd backend
npm install
```

**Database** — MongoDB, and it must run as a replica set (Prisma uses transactions for order
creation and stock movements, which standalone MongoDB doesn't support).

- **Option A — MongoDB Atlas** (recommended, zero local setup): create a free cluster, copy
  the connection string into `backend/.env` as `DATABASE_URL`.
- **Option B — local Docker**: from the repo root, `docker compose up -d` starts a
  single-node replica set at `mongodb://localhost:27017/blankhangar?replicaSet=rs0&directConnection=true`.

Copy `backend/.env.example` to `backend/.env` and fill in `DATABASE_URL` and `JWT_SECRET`
(generate one with `openssl rand -base64 32`). Everything else has a sane default (mock
payments, local image storage on port 4000).

```bash
npm run db:push
npm run db:seed
```

The seed creates the T-Shirts category (plus Shirts/Bottomwear/Hoodies/Accessories marked
"Coming Soon"), ~10 products with size-variant stock, a sample order with a full tracking
history, coupons, store settings, and generated/downloaded placeholder artwork.

Seeded logins:

| Role     | Email                     | Password       |
| -------- | -------------------------- | --------------- |
| Admin    | admin@theblankhangar.com   | Admin@12345     |
| Staff    | staff@theblankhangar.com   | Staff@12345     |
| Customer | customer@example.com       | Customer@12345  |

```bash
npm run dev
```

Runs at `http://localhost:4000`. `GET /health` returns `{ ok: true }` once it's up.

### 2. Frontend

```bash
cd frontend
npm install
```

Copy `frontend/.env.example` to `frontend/.env`. **`JWT_SECRET` must match the backend's
exactly** — both sides verify the same signed token. `BACKEND_URL` (server-side only) and
`NEXT_PUBLIC_ASSET_URL` (browser-visible, for image URLs) both default to
`http://localhost:4000`.

```bash
npm run dev
```

Runs at `http://localhost:3000`. Storefront at `/`, admin panel at `/admin` (staff/admin
accounts only — `/admin/login` is a separate login form from the customer one at `/login`).

**Both servers need to be running** for the app to work — two terminals, `npm run dev` in
each.

## Scripts

**Backend** (`backend/`):

| Command             | What it does                                      |
| -------------------- | -------------------------------------------------- |
| `npm run dev`         | Start the API with hot reload (`tsx watch`)        |
| `npm start`           | Start the API (no watch)                           |
| `npm run typecheck`   | Type-check without emitting                        |
| `npm run db:push`     | Sync `prisma/schema.prisma` to MongoDB              |
| `npm run db:seed`     | Reseed demo data (destructive — clears prior data)  |
| `npm run db:studio`   | Open Prisma Studio                                  |

**Frontend** (`frontend/`):

| Command         | What it does                                    |
| ----------------- | -------------------------------------------------- |
| `npm run dev`      | Start the dev server                               |
| `npm run build`    | Production build (also type-checks everything)     |
| `npm start`        | Run the production build                           |

## Notable design decisions

- **BFF proxy, not direct browser→backend calls** (see Architecture above) — the single
  biggest structural decision, chosen to avoid exposing CORS/JWT-in-JS risk to the browser
  while still giving the backend a genuinely separate process/deploy target.
- **`requireUser`/`requireStaff`/`requireAdmin` kept the same names and shapes** on the
  frontend (`frontend/lib/session.ts`, JWT-cookie-backed) as they had when this was a single
  NextAuth-based app — the ~24 pages and route handlers that call them needed only an import
  path change, not a rewrite.
- **Image paths are relative in the database, absolute at render time**: `assetUrl()`
  (`frontend/lib/assets.ts`) prefixes `/uploads/...` paths with `NEXT_PUBLIC_ASSET_URL` only
  at the point a component renders an `<Image>` — never centrally for data that round-trips
  back into an admin save (settings hero banners, product images), so editing and re-saving
  can't accidentally bake in a stale backend URL.
- **Real-time-enough updates without websockets**: the customer order-tracking page and the
  PDP's size availability both poll their API endpoints every ~8s (`frontend/hooks/
  usePolling.ts`), pausing while the tab is hidden. An admin stock edit or status change is
  visible without a page reload.
- **Stock is never trusted from the client**: `backend/src/services/orders.ts` re-prices the
  cart from the database at checkout and decrements stock inside a transaction guarded by a
  `stock >= quantity` condition, so two customers racing for the last unit can't both win.
- **Category growth needs no schema change**: `Category.comingSoon` plus a flat category list
  driven from the DB means adding "Hoodies" later is a data change (flip the flag, add
  products) — the mega menu, mobile nav and footer all render from the same query.
- **Payments are provider-shaped, not mock-shaped**: `PaymentProvider`
  (`backend/src/modules/payments/provider.ts`) is an interface with one method to create an
  intent and one to verify it. The mock implementation satisfies both synchronously; Razorpay
  implements the same interface using its Orders API — switching is a
  `PAYMENT_PROVIDER=razorpay` env change on the backend, not a rewrite.
- **Audit trail**: every stock change — manual admin edit, order deduction, or
  cancellation/return restock — writes a `StockLog` row with a reason and (where applicable)
  the acting admin, visible on each product's edit page.

## Known simplifications

- Single JWT (7-day expiry) via one httpOnly cookie — no refresh-token rotation.
- No shared-types package between `frontend/` and `backend/` — DTO shapes are duplicated in
  `frontend/types/` and kept in sync by hand. Small maintenance cost, avoids a monorepo tool.
- `docker-compose.yml` covers only local MongoDB; the two app servers run natively via
  `npm run dev` in each folder, not containerized.
- CORS on the backend is configured (`FRONTEND_ORIGIN` env var) but isn't load-bearing for
  normal use — the browser only ever calls the frontend, per the BFF design above. It exists
  for direct backend testing (Postman/curl) and defense-in-depth.
- Payments run through the mock provider until real Razorpay keys are supplied.
- Reviews have no moderation queue.
- The delivery pincode checker validates format and returns an indicative window; it isn't
  wired to a live courier API.
- The in-memory rate limiter on the backend's auth endpoints is fine for a single
  instance/demo; a multi-instance production deploy needs a shared store (e.g. Redis).
- Product/category/banner imagery is generated placeholder art / downloaded free-license
  stock photography, not original photography (see `backend/public/uploads/photos/CREDITS.md`).
#   T H E B L A N K H A N G A R -  
 