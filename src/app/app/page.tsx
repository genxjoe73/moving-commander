import { count, eq } from "drizzle-orm";
import Link from "next/link";

import { db } from "@/db";
import { customer, job, lead, quote } from "@/db/app-schema";
import { requireTenant } from "@/lib/tenant";

export default async function DashboardPage() {
  const { organization, profile } = await requireTenant();
  const organizationId = organization.id;
  const [[leadCount], [customerCount], [quoteCount], [jobCount]] = await Promise.all([
    db.select({ value: count() }).from(lead).where(eq(lead.organizationId, organizationId)),
    db.select({ value: count() }).from(customer).where(eq(customer.organizationId, organizationId)),
    db.select({ value: count() }).from(quote).where(eq(quote.organizationId, organizationId)),
    db.select({ value: count() }).from(job).where(eq(job.organizationId, organizationId)),
  ]);
  const stats = [["Leads", leadCount.value, "/app/leads"], ["Customers", customerCount.value, "/app/customers"], ["Quotes", quoteCount.value, "/app/quotes"], ["Jobs", jobCount.value, "/app/jobs"]] as const;
  return <><header className="app-header"><div><p className="eyebrow">COMMAND CENTER</p><h1>{organization.name}</h1><p>Your tenant is active and isolated from every other subscriber.</p></div><Link className="primary-button" href="/app/settings">Continue setup</Link></header><section className="stat-grid">{stats.map(([label, value, href]) => <Link className="stat-card" href={href} key={label}><span>{label}</span><strong>{value}</strong><small>Open {label.toLowerCase()} →</small></Link>)}</section><section className="module-panel"><div><p className="eyebrow">FOUNDATION STATUS</p><h2>Ready for operational modules</h2></div><ul><li><strong>Tenant isolation</strong><span>Organization-scoped records and membership checks</span></li><li><strong>Authentication</strong><span>Secure sessions and company ownership</span></li><li><strong>Legacy retrofit</strong><span>Legacy IDs and import batches reserved in the schema</span></li><li><strong>Subscription</strong><span>{profile?.subscriptionStatus ?? "trial"} / {profile?.subscriptionTier ?? "founding"}</span></li></ul></section></>;
}

