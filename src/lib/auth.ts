import "server-only";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";

import { db } from "@/db";
import * as authSchema from "@/db/auth-schema";

export const auth = betterAuth({
  appName: "Moving Commander",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  user: {
    additionalFields: {
      platformRole: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
  },
  advanced: {
    database: { joins: true },
  },
  plugins: [
    organization({
      creatorRole: "owner",
      membershipLimit: 100,
    }),
    nextCookies(),
  ],
  trustedOrigins: [
    "http://localhost:3000",
    "https://moving-commander-production.up.railway.app",
  ],
});
