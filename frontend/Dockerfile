# Production image for the Next.js app. `next build` needs the backend reachable
# (generateStaticParams fetches the catalog) and needs its runtime env vars already set
# (JWT_SECRET, NEXT_PUBLIC_ASSET_URL, ...) since Server Components evaluate at build time —
# pass them as build args, matching what backend/env vars this app already requires.
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG BACKEND_URL
ARG NEXT_PUBLIC_ASSET_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_PAYMENT_PROVIDER
ARG JWT_SECRET
ENV BACKEND_URL=$BACKEND_URL \
    NEXT_PUBLIC_ASSET_URL=$NEXT_PUBLIC_ASSET_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_PAYMENT_PROVIDER=$NEXT_PUBLIC_PAYMENT_PROVIDER \
    JWT_SECRET=$JWT_SECRET \
    NODE_ENV=production

RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

RUN groupadd --system app && useradd --system --gid app app \
  && chown -R app:app /app
USER app

EXPOSE 3000

# JWT_SECRET/BACKEND_URL are also required at runtime (server-side request handling) —
# supply the same values here via `docker run --env-file`, never baked in beyond the
# build-time NEXT_PUBLIC_* values above (those are, by design, visible in the browser bundle).
CMD ["npm", "run", "start"]
