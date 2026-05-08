import { defineConfig } from "drizzle-kit";
import { getDatabaseConfig } from "./src/env";

const database = getDatabaseConfig();

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: database.url
  }
});
