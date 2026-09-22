import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { customer } from "@/db/app-schema";
import { requireTenant } from "@/lib/tenant";

export async function CustomersWorkspace() {
  const tenant = await requireTenant();
  const records = await db.select().from(customer)
    .where(eq(customer.organizationId, tenant.organization.id))
    .orderBy(desc(customer.createdAt))
    .limit(200);

  return <><header className="app-header"><div><p className="eyebrow">CUSTOMER RECORDS</p><h1>Customers</h1><p>Customer records created from qualified leads stay inside the active company tenant.</p></div></header><section className="workspace-panel"><div className="section-heading"><p className="eyebrow">DIRECTORY</p><h2>{records.length} customers</h2></div>{records.length === 0 ? <div className="inline-empty"><h3>No customers yet</h3><p>Convert a lead to create the first customer and draft quote.</p></div> : <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Customer</th><th>Email</th><th>Phone</th><th>Created</th></tr></thead><tbody>{records.map((item) => <tr key={item.id}><td><strong>{item.companyName || [item.firstName, item.lastName].filter(Boolean).join(" ") || "Unnamed customer"}</strong></td><td>{item.email || "—"}</td><td>{item.phone || "—"}</td><td>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(item.createdAt)}</td></tr>)}</tbody></table></div>}</section></>;
}
