// Prisma config - loads dotenv only if available (local dev)
import { defineConfig } from "prisma/config";

try { require("dotenv/config"); } catch (e) { /* production: env vars from system */ }

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
