# Production image for the Express API. Runs the same way `npm start` does locally
# (tsx executing TypeScript directly) — this project has no separate compiled-JS build
# step, so the image mirrors that rather than introducing a new one.
FROM node:22-slim AS deps
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:22-slim AS runtime
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate

RUN groupadd --system app && useradd --system --gid app app \
  && chown -R app:app /app
USER app

EXPOSE 4000

# Secrets (DATABASE_URL, JWT_SECRET, RAZORPAY_*) are supplied at run time via
# `docker run --env-file` / your orchestrator's secret store — never baked into the image.
CMD ["npx", "tsx", "src/server.ts"]
