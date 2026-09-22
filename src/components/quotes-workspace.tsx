import { desc, eq } from "drizzle-orm";
import Link from "next/link";

import { db } from "@/db";
import { customer, quote } from "@/db/app-schema";
import { requireTenant } from "@/lib/tenant";

export async function QuotesWorkspace() {
  const tenant = await requireTenant();
  const records = await db.select({ id: quote.id, quoteNumber: quote.quoteNumber, status: quote.status, moveDate: quote.moveDate, estimatedTotal: quote.estimatedTotal, createdAt: quote.createdAt, firstName: customer.firstName, lastName: customer.lastName, companyName: customer.companyName })
    .from(quote).leftJoin(customer, eq(quote.customerId, customer.id))
    .where(eq(quote.organizationId, tenant.organization.id))
    .orderBy(desc(quote.createdAt)).limit(200);

  return <><header className="app-header"><div><p className="eyebrow">ESTIMATING</p><h1>Quotes</h1><p>Draft estimates created from qualified opportunities. Rate calculation and tariff rules are captured in each quote.</p></div></header><section className="workspace-panel"><div className="section-heading"><p className="eyebrow">QUOTE REGISTER</p><h2>{records.length} quotes</h2></div>{records.length === 0 ? <div className="inline-empty"><h3>No quotes yet</h3><p>Open Leads and convert a qualified opportunity.</p></div> : <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Quote</th><th>Customer</th><th>Status</th><th>Move date</th><th>Estimate</th></tr></thead><tbody>{records.map((item) => <tr key={item.id}><td><Link href={`/app/quotes/${item.id}`}><strong>{item.quoteNumber}</strong></Link></td><td>{item.companyName || [item.firstName, item.lastName].filter(Boolean).join(" ") || "—"}</td><td><span className={`status-pill status-${item.status}`}>{item.status}</span></td><td>{item.moveDate ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(item.moveDate) : "TBD"}</td><td>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(item.estimatedTotal))}</td></tr>)}</tbody></table></div>}</section></>;
}
