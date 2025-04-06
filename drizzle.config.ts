import "dotenv/config"
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  out: "./drizzle",
  schema: "./lib/server/db/schema.ts",
  dialect: "postgresql",
  tablesFilter: ["sokoverse_*"],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
