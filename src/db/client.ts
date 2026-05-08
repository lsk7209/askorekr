import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { getDatabaseConfig } from "@/env";
import * as schema from "./schema";

const client = createClient(getDatabaseConfig());

export const db = drizzle(client, { schema });
