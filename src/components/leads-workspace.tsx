import { desc, eq } from "drizzle-orm";

import { convertLeadToQuote, updateLeadStatus } from "@/app/actions/leads";
import { db } from "@/db";
import { lead } from "@/db/app-schema";
import { requireTenant } from "@/lib/tenant";
import { LeadForm } from "@/components/lead-form";

const statuses = ["new", "contacted", "qualified", "quoted", "won", "lost"] as const;

function displayName(item: typeof lead.$inferSelect) {
  return item.companyName || [item.firstName, item.lastName].filter(Boolean).join(" ") || "Unnamed lead";
}

export async function LeadsWorkspace() {
  const tenant = await requireTenant();
  const records = await db.select().from(lead)
    .where(eq(lead.organizationId, tenant.organization.id))
    .orderBy(desc(lead.createdAt))
    .limit(200);

  return <>
    <header className="app-header"><div><p className="eyebrow">SALES PIPELINE</p><h1>Leads</h1><p>Capture new opportunities, qualify them, and convert them into customer and quote records.</p></div></header>
    <div className="workspace-grid">
      <section className="workspace-panel"><div className="section-heading"><div><p className="eyebrow">INBOX</p><h2>{records.length} active records</h2></div></div>
        {records.length === 0 ? <div className="inline-empty"><h3>No leads yet</h3><p>Add the first opportunity using the intake form.</p></div> : <div className="record-list">{records.map((item) => <article className="record-card" key={item.id}>
          <div className="record-summary"><div><span className={`status-pill status-${item.status}`}>{item.status}</span><h3>{displayName(item)}</h3><p>{[item.email, item.phone].filter(Boolean).join(" · ") || "No contact details"}</p></div><div className="record-meta"><span>{item.moveDate ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(item.moveDate) : "Move date TBD"}</span><small>{[item.originPostalCode, item.destinationPostalCode].filter(Boolean).join(" → ")}</small></div></div>
          {item.notes ? <p className="record-notes">{item.notes}</p> : null}
          <div className="record-actions"><form action={updateLeadStatus}><input type="hidden" name="id" value={item.id} /><label><span>Stage</span><select name="status" defaultValue={item.status}>{statuses.map((status) => <option value={status} key={status}>{status.replace("_", " ")}</option>)}</select></label><button className="secondary-button">Update</button></form>{item.status !== "quoted" && item.status !== "won" && item.status !== "lost" ? <form action={convertLeadToQuote}><input type="hidden" name="id" value={item.id} /><button className="primary-button">Create customer &amp; quote</button></form> : null}</div>
        </article>)}</div>}
      </section>
      <aside className="workspace-panel intake-panel"><p className="eyebrow">MANUAL INTAKE</p><h2>New lead</h2><p className="panel-intro">Email and partner-source automation will feed the same tenant-owned lead records.</p><LeadForm /></aside>
    </div>
  </>;
}
