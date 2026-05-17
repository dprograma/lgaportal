import { defineConfig } from "prisma/config";
import { config } from "dotenv";

// Prisma CLI reads .env automatically but NOT .env.local (Next.js convention).
// Load .env.local first so DATABASE_URL is available during migrate/generate.
config({ path: ".env.local" });

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
