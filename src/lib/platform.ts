import "server-only";

import { redirect } from "next/navigation";

import { hasPlatformAdminAccess } from "@/lib/platform-access";
import { requireUser } from "@/lib/tenant";

export async function requirePlatformAdmin() {
  const session = await requireUser();
  if (!hasPlatformAdminAccess(session.user)) redirect("/app");
  return session;
}
