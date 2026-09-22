import { count, eq } from "drizzle-orm";
import Link from "next/link";

import { db } from "@/db";
import { member, organization } from "@/db/auth-schema";
import { organizationProfile } from "@/db/app-schema";
import { requirePlatformAdmin } from "@/lib/platform";

export default async function PlatformPage() {
  const session = await requirePlatformAdmin();
  const tenants = await db
    .select({ id: organization.id, name: organization.name, slug: organization.slug, createdAt: organization.createdAt, status: organizationProfile.subscriptionStatus, tier: organizationProfile.subscriptionTier, members: count(member.id) })
    .from(organization)
    .leftJoin(organizationProfile, eq(organizationProfile.organizationId, organization.id))
    .leftJoin(member, eq(member.organizationId, organization.id))
    .groupBy(organization.id, organizationProfile.subscriptionStatus, organizationProfile.subscriptionTier);

  return <main className="platform-page"><header className="app-header"><div><p className="eyebrow">PLATFORM ADMINISTRATION</p><h1>Moving Commander tenants</h1><p>Signed in as {session.user.email}. Brent’s email can be authorized through the PLATFORM_ADMIN_EMAILS environment variable.</p></div><Link className="secondary-button" href="/app">Tenant app</Link></header><section className="settings-card"><table className="tenant-table"><thead><tr><th>Company</th><th>Slug</th><th>Subscription</th><th>Members</th><th>Created</th></tr></thead><tbody>{tenants.map((tenant) => <tr key={tenant.id}><td>{tenant.name}</td><td>{tenant.slug}</td><td>{tenant.status ?? "setup pending"} / {tenant.tier ?? "—"}</td><td>{tenant.members}</td><td>{tenant.createdAt.toLocaleDateString()}</td></tr>)}</tbody></table></section></main>;
}

