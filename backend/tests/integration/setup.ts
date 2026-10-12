import { config } from "dotenv";
import path from "node:path";

// Runs before any test file (and therefore before src/config/env.ts's own `dotenv/config`
// call) so DATABASE_URL etc. point at the local docker-compose mongo, never the real one
// backend/.env carries for local dev.
config({ path: path.resolve(import.meta.dirname, "../../.env.test"), override: true });
