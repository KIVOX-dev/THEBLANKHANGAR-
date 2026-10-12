# The Blank Hangar

A full-stack e-commerce storefront and admin panel for a men's streetwear D2C brand.
It is two separate apps that talk over HTTP:

- **`frontend/`**: Next.js 16 (App Router) with the storefront, the admin UI, and a thin
  Backend-for-Frontend (BFF) proxy under `app/api/**`.
- **`backend/`**: Express 5 + TypeScript API with all business logic, Prisma + MongoDB, and JWT auth.

```
THEBLANKHANGAR/
├── frontend/             Storefront (/), admin panel (/admin), BFF routes (app/api/**)
├── backend/              REST API, Prisma schema + seed, uploads, tests
├── scripts/              check-pricing-drift.mjs (CI guardrail)
├── .github/workflows/    CI: typecheck, lint, unit, integration and E2E smoke tests
└── docker-compose.yml    Optional local MongoDB replica set
```

## How it fits together

The browser only talks to the frontend (`localhost:3000`), never to the backend
(`localhost:4000`). Each `frontend/app/api/**/route.ts` forwards the request to the backend,
attaches the signed-in user's token, and returns the response.

- The JWT lives in an httpOnly cookie on the frontend's domain, so client JS can't read it.
- There is no browser-to-backend CORS surface. Server-to-server calls aren't subject to CORS.
- Server Components fetch through `frontend/lib/api-client.ts` and `admin-api-client.ts`.
  The frontend has no direct database access.

## Stack

| Layer    | Tech |
| -------- | ---- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Zustand, `jose`, Recharts |
| Backend  | Express 5, TypeScript, Prisma **v6**, MongoDB, `jose`, `bcryptjs`, `multer`, `zod` |
| Testing  | Vitest (unit + integration), Playwright (E2E smoke), ESLint |

> **Keep Prisma on v6.** Prisma v7 dropped the MongoDB connector. Don't run
> `npm i prisma@latest` in `backend/`.

## Getting started

Prerequisites: Node 22+ and a MongoDB **replica set**. Order creation and stock moves use
transactions, which standalone MongoDB doesn't support.

### 1. Database

- **MongoDB Atlas** (recommended): create a cluster and use its connection string. Allow your
  IP under Network Access.
- **Local Docker**: run `docker compose up -d` from the repo root. The connection string is
  `mongodb://localhost:27017/blankhangar?replicaSet=rs0&directConnection=true`.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env      # then fill in DATABASE_URL and JWT_SECRET
npm run db:push           # sync the Prisma schema to MongoDB
npm run db:seed           # demo data (clears existing data first)
npm run dev               # http://localhost:4000
```

Generate a secret with `openssl rand -base64 32`. `GET /health` returns `{ "ok": true }`
when the API is up.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env      # JWT_SECRET must equal the backend's
npm run dev               # http://localhost:3000
```

Both servers must be running. The storefront is at `/` and the admin panel at `/admin`.
Admin and staff sign in at `/admin/login`. Customers use `/login`.

### Seeded accounts (development only)

| Role     | Email                    | Password       |
| -------- | ------------------------ | -------------- |
| Admin    | admin@theblankhangar.com | Admin@12345    |
| Staff    | staff@theblankhangar.com | Staff@12345    |
| Customer | customer@example.com     | Customer@12345 |

The admin email and password come from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in
`backend/.env`. Change all three passwords before any real deployment.

The seed creates the T-Shirts category (Shirts, Bottomwear, Hoodies and Accessories are
marked "Coming Soon"), about ten products with per-size stock, a sample order with tracking
history, coupons, store settings, and placeholder artwork.

## Environment variables

**Backend (`backend/.env`)**

| Variable | Purpose |
| -------- | ------- |
| `DATABASE_URL` | MongoDB connection string (replica set) |
| `PORT` | API port (default 4000) |
| `FRONTEND_ORIGIN` | Frontend origin allowed by CORS (for direct API testing) |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Token signing. The secret must match the frontend's |
| `PAYMENT_PROVIDER` | `mock` (default) or `razorpay` |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Needed only for `razorpay` |
| `STORAGE_DRIVER` | `local` (writes to `public/uploads`) or `b2` (Backblaze B2) |
| `B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_NAME`, `B2_S3_ENDPOINT`, `B2_REGION` | Needed for `b2` |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Admin account created by the seed |

**Frontend (`frontend/.env`)**

| Variable | Purpose |
| -------- | ------- |
| `BACKEND_URL` | Server-side base URL of the API |
| `NEXT_PUBLIC_ASSET_URL` | Browser-visible base URL for backend-served images |
| `JWT_SECRET` | Must match the backend's |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (sitemap, metadata) |
| `NEXT_PUBLIC_PAYMENT_PROVIDER` | Display-only label at checkout |

Never commit `.env` files. They hold the database credentials and the JWT secret.

## Scripts

**Backend**

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | API with hot reload |
| `npm start` | API without watch |
| `npm run typecheck` | Type-check only |
| `npm test` | Unit tests |
| `npm run test:integration` | Integration tests (needs a MongoDB replica set) |
| `npm run db:push` | Sync the schema to MongoDB |
| `npm run db:seed` | Re-seed demo data. **Destructive** |
| `npm run db:studio` | Prisma Studio |
| `npm run build:vercel` | Bundle the API for Vercel (`api/index.js`) |

**Frontend**

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Dev server |
| `npm run build` | Production build (type-checks too) |
| `npm start` | Run the production build |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Unit tests |
| `npm run test:e2e` | Playwright smoke test |

## Admin tips

- A product appears on the storefront only when its **Status is Live**. Drafts and archived
  products are hidden everywhere.
- The home page's **New Arrivals** shows products with **New arrival** ticked. **Featured**
  and **Bestseller** work the same way.
- Customers can only buy sizes that have stock.

## Deployment

The **backend runs on Render** and the **frontend on Vercel** (or any Next.js host).

**Backend (Render)**: `render.yaml` at the repo root is a Blueprint. Create a Blueprint
instance from it, or make a Web Service manually with root directory `backend`, build command
`npm install --include=dev` and start command `npm start`. Health check path: `/health`.
Enter the secret values in the dashboard: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN`,
`B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`, and the seed admin credentials.

**Frontend (Vercel)**: set the project root to `frontend`, with
`BACKEND_URL` and `NEXT_PUBLIC_ASSET_URL` both set to the Render URL, `JWT_SECRET` identical to
the backend's, and `NEXT_PUBLIC_SITE_URL` set to the site's URL.

**Image storage (Backblaze B2)**: set `STORAGE_DRIVER=b2` with the `B2_*` variables. Images go
to a private bucket and the API streams them at `/uploads/*`, so keys never reach the browser.
MongoDB stores only data, with image paths as plain strings. Render's disk is ephemeral, so
don't use the `local` driver there.

**Database (Atlas)**: allow Render's outbound IPs in Network Access (or `0.0.0.0/0`) and use a
strong password. Seed once from your machine with `npm run db:seed`. With
`STORAGE_DRIVER=b2` it also uploads the seed images.

A `Dockerfile` for each app is also provided for container hosting.

## Design decisions

- **BFF proxy**: keeps the JWT out of client JS and avoids CORS, while the backend stays a
  separately deployable service.
- **Server-side pricing**: `backend/src/services/orders.ts` re-prices the cart from the
  database at checkout and decrements stock in a transaction guarded by `stock >= quantity`,
  so two buyers can't both take the last unit. The frontend's `pricing.ts` is display-only,
  and `scripts/check-pricing-drift.mjs` fails CI if it diverges from the backend copy.
- **Relative image paths in the database**: `assetUrl()` (`frontend/lib/assets.ts`) adds
  `NEXT_PUBLIC_ASSET_URL` only when rendering, so re-saving in admin never stores a stale host.
- **Polling, not websockets**: order tracking and PDP size availability poll every ~8s and
  pause while the tab is hidden (`frontend/hooks/usePolling.ts`).
- **Provider-shaped payments**: `PaymentProvider` (`backend/src/modules/payments/provider.ts`)
  has create and verify methods. Switching from mock to Razorpay is a
  `PAYMENT_PROVIDER=razorpay` env change.
- **Categories are data**: `Category.comingSoon` drives the menus and footer, so launching a
  new category needs no schema change.
- **Stock audit trail**: every stock change writes a `StockLog` row with a reason and the
  acting admin, shown on each product's edit page.

## CI

`.github/workflows/ci.yml` runs backend typecheck, `prisma validate` and unit tests, frontend
lint, typecheck and unit tests, the pricing drift check, and an integration + Playwright E2E
job against a local MongoDB replica set.

## Known limitations

- A single 7-day JWT in one httpOnly cookie, with no refresh-token rotation.
- DTO types are duplicated between `frontend/types/` and the backend and kept in sync by hand.
- Payments use the mock provider until Razorpay keys are supplied.
- The auth rate limiter is in-memory. A multi-instance deploy needs a shared store such as Redis.
- Reviews have no moderation queue.
- The pincode checker validates format and returns an indicative window. It has no courier API.
- Seed imagery is generated placeholder art and free-license photos
  (see `backend/public/uploads/photos/CREDITS.md`), not original photography.
