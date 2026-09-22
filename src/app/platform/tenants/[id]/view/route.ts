import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { organization } from "@/db/auth-schema";
import { requirePlatformAdmin } from "@/lib/platform";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePlatformAdmin();
  const { id } = await params;
  const [tenant] = await db.select({ id: organization.id }).from(organization).where(eq(organization.id, id)).limit(1);
  if (!tenant) redirect("/platform");

  const cookieStore = await cookies();
  cookieStore.set("mc_platform_tenant", tenant.id, {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  redirect("/app");
}
