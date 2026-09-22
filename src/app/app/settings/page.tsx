import { eq } from "drizzle-orm";

import { completeOnboarding } from "@/app/actions/onboarding";
import { db } from "@/db";
import { office } from "@/db/app-schema";
import { requireTenantRole } from "@/lib/tenant";

export default async function SettingsPage() {
  const { organization, profile } = await requireTenantRole(["owner", "admin"]);
  const offices = await db.select().from(office).where(eq(office.organizationId, organization.id));
  return <><header className="app-header"><div><p className="eyebrow">COMPANY SETUP</p><h1>{organization.name}</h1><p>Tenant identity, subscription, offices, modules, and future import readiness.</p></div></header><section className="settings-grid"><article className="settings-card"><h2>Company</h2><dl><dt>Legal name</dt><dd>{profile?.legalName}</dd><dt>Tenant slug</dt><dd>{organization.slug}</dd><dt>Phone</dt><dd>{profile?.phone || "Not set"}</dd><dt>Location</dt><dd>{[profile?.city, profile?.state].filter(Boolean).join(", ") || "Not set"}</dd></dl></article><article className="settings-card"><h2>Subscription</h2><dl><dt>Status</dt><dd>{profile?.subscriptionStatus}</dd><dt>Tier</dt><dd>{profile?.subscriptionTier}</dd><dt>Enabled modules</dt><dd>{profile?.enabledModules.join(", ")}</dd></dl></article><article className="settings-card"><h2>Offices</h2>{offices.map((item) => <p key={item.id}><strong>{item.name}</strong><br />{[item.city, item.state].filter(Boolean).join(", ")}</p>)}</article><article className="settings-card"><h2>Legacy data</h2><p>No backup is required to operate the new system. A future SQL backup can be imported through reserved legacy IDs and auditable import batches.</p></article></section>{!profile?.onboardingCompletedAt && <form action={completeOnboarding}><button className="primary-button">Mark initial setup complete</button></form>}</>;
}

