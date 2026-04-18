import { defineConfig } from "drizzle-kit";
import { getConfig } from "./src/config";

const config = getConfig();

export default defineConfig({
  schema: "./src/infra/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: config.db.url,
  },
  verbose: true,
});
