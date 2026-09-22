import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as appSchema from "@/db/app-schema";
import * as authSchema from "@/db/auth-schema";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://moving_commander:development@127.0.0.1:5432/moving_commander";

const client = postgres(connectionString, {
  max: process.env.NODE_ENV === "production" ? 10 : 1,
  prepare: false,
});

export const schema = { ...authSchema, ...appSchema };
export const db = drizzle(client, { schema });
