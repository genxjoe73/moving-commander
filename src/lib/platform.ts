import "server-only";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/tenant";

export async function requirePlatformAdmin() {
  const session = await requireUser();
  const configured = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const platformRole = "platformRole" in session.user ? session.user.platformRole : undefined;
  if (platformRole !== "admin" && !configured.includes(session.user.email.toLowerCase())) redirect("/app");
  return session;
}

