import "server-only";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { member, organization } from "@/db/auth-schema";
import { organizationProfile } from "@/db/app-schema";
import { auth } from "@/lib/auth";
import { hasPlatformAdminAccess } from "@/lib/platform-access";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function getUserOrganizations(userId: string) {
  return db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      role: member.role,
    })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(eq(member.userId, userId));
}

export async function requireTenant() {
  const session = await requireUser();
  const memberships = await getUserOrganizations(session.user.id);
  if (memberships.length === 0) {
    if (hasPlatformAdminAccess(session.user)) redirect("/platform");
    redirect("/onboarding");
  }

  const activeOrganizationId = session.session.activeOrganizationId;
  const active = memberships.find((item) => item.id === activeOrganizationId) ?? memberships[0];

  if (activeOrganizationId !== active.id) {
    await auth.api.setActiveOrganization({
      body: { organizationId: active.id },
      headers: await headers(),
    });
  }

  const [profile] = await db
    .select()
    .from(organizationProfile)
    .where(eq(organizationProfile.organizationId, active.id))
    .limit(1);

  return { session, organization: active, profile: profile ?? null };
}

export async function requireTenantRole(allowedRoles: string[]) {
  const tenant = await requireTenant();
  if (!allowedRoles.includes(tenant.organization.role)) redirect("/app");
  return tenant;
}

export async function isOrganizationMember(userId: string, organizationId: string) {
  const [membership] = await db
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.userId, userId), eq(member.organizationId, organizationId)))
    .limit(1);
  return Boolean(membership);
}
