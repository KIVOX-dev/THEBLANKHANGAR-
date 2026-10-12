import "dotenv/config";

const isProduction = process.env.NODE_ENV === "production";

// Known example values from .env / .env.example — never valid in production.
const PLACEHOLDER_JWT_SECRETS = new Set([
  "dev-only-secret-change-me-in-production-9f3a7c2b8e1d4056",
  "replace-me-with-a-long-random-string",
]);

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function requireJwtSecret(): string {
  const value = required("JWT_SECRET");

  if (isProduction && (PLACEHOLDER_JWT_SECRETS.has(value) || value.length < 32)) {
    throw new Error(
      "JWT_SECRET is a known placeholder or too short for production. Set a unique, random secret of at least 32 characters.",
    );
  }

  return value;
}

function requireSeedAdminCredentials() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (isProduction && (!email || !password)) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set explicitly in production. The documented default admin credentials are only permitted outside production.",
    );
  }

  return {
    seedAdminEmail: email ?? "admin@theblankhangar.com",
    seedAdminPassword: password ?? "Admin@12345",
  };
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: requireJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  paymentProvider: (process.env.PAYMENT_PROVIDER ?? "mock").toLowerCase(),
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
  storageDriver: (process.env.STORAGE_DRIVER ?? "local").toLowerCase(),
  ...requireSeedAdminCredentials(),
};
