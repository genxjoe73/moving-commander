import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { addJobPayment, saveJobInvoice } from "@/app/actions/job-operations";
import { db } from "@/db";
import { customer, job, jobCharge, jobInvoice, jobPayment } from "@/db/app-schema";
import { requireTenant } from "@/lib/tenant";

export default async function JobBillingPage({ params }: { params: Promise<{ id: string }> }) {
  const tenant = await requireTenant();
  const { id } = await params;
  const [record, invoice, charges, payments] = await Promise.all([
    db.select({ job, customer }).from(job).leftJoin(customer, eq(job.customerId, customer.id)).where(and(eq(job.id, id), eq(job.organizationId, tenant.organization.id))).limit(1),
    db.select().from(jobInvoice).where(and(eq(jobInvoice.jobId, id), eq(jobInvoice.organizationId, tenant.organization.id))).limit(1),
    db.select().from(jobCharge).where(and(eq(jobCharge.jobId, id), eq(jobCharge.organizationId, tenant.organization.id))).orderBy(desc(jobCharge.createdAt)),
    db.select().from(jobPayment).where(and(eq(jobPayment.jobId, id), eq(jobPayment.organizationId, tenant.organization.id))).orderBy(desc(jobPayment.createdAt)),
  ]);
  if (!record[0]) notFound();
  const item = record[0].job;
  const person = record[0].customer;
  const invoiceRecord = invoice[0];
  const paid = payments.filter((payment) => payment.status === "paid").reduce((total, payment) => total + Number(payment.amount), 0);
  const invoicedTotal = Number(invoiceRecord?.total || 0);
  const chargesTotal = charges.filter((charge) => charge.status !== "waived").reduce((total, charge) => total + Number(charge.amount), 0);
  return <><header className="app-header"><div><p className="eyebrow">BILLING WORKFLOW</p><h1>{item.jobNumber}</h1><p>{person?.companyName || [person?.firstName, person?.lastName].filter(Boolean).join(" ") || "Unassigned customer"} · invoice and payment tracking</p></div><Link className="secondary-button" href={`/app/jobs/${item.id}`}>Back to job</Link></header><div className="operations-grid"><section className="workspace-panel"><p className="eyebrow">INVOICE</p><h2>{invoiceRecord?.invoiceNumber || "No invoice"}</h2><form action={saveJobInvoice} className="record-form"><input type="hidden" name="jobId" value={item.id} /><label>Invoice number<input name="invoiceNumber" required defaultValue={invoiceRecord?.invoiceNumber || `INV-${item.jobNumber}`} /></label><label>Status<select name="status" defaultValue={invoiceRecord?.status || "draft"}><option>draft</option><option>sent</option><option>partially_paid</option><option>paid</option><option>void</option></select></label><div className="form-row"><label>Subtotal<input name="subtotal" type="number" min="0" step="0.01" defaultValue={invoiceRecord?.subtotal || chargesTotal.toFixed(2)} /></label><label>Tax<input name="tax" type="number" min="0" step="0.01" defaultValue={invoiceRecord?.tax || "0"} /></label></div><label>Total<input name="total" type="number" min="0" step="0.01" defaultValue={invoiceRecord?.total || chargesTotal.toFixed(2)} /></label><label>Due date<input name="dueDate" type="date" defaultValue={invoiceRecord?.dueDate ? invoiceRecord.dueDate.toISOString().slice(0, 10) : ""} /></label><label>Notes<textarea name="notes" rows={4} defaultValue={invoiceRecord?.notes || ""} /></label><button className="primary-button">Save invoice</button></form></section><section className="workspace-panel"><p className="eyebrow">PAYMENT SUMMARY</p><h2>${paid.toFixed(2)} paid</h2><p className="panel-intro">${Math.max(invoicedTotal - paid, 0).toFixed(2)} outstanding · {payments.length} payment entries</p>{payments.map((payment) => <div className="record-card" key={payment.id}><strong>${Number(payment.amount).toFixed(2)}</strong><span>{payment.status} · {payment.method}{payment.reference ? ` · ${payment.reference}` : ""}</span></div>)}<form action={addJobPayment} className="record-form"><input type="hidden" name="jobId" value={item.id} /><label>Amount<input name="amount" type="number" min="0.01" step="0.01" required /></label><div className="form-row"><label>Method<select name="method"><option>card</option><option>cash</option><option>check</option><option>ach</option><option>unrecorded</option></select></label><label>Status<select name="status"><option>pending</option><option>authorized</option><option>paid</option><option>refunded</option><option>void</option></select></label></div><label>Reference<input name="reference" /></label><button className="secondary-button">Record payment</button></form></section><section className="workspace-panel"><p className="eyebrow">CHARGES</p><h2>${chargesTotal.toFixed(2)} billable charges</h2>{charges.map((charge) => <div className="record-card" key={charge.id}><strong>{charge.description}</strong><span>${Number(charge.amount).toFixed(2)} · {charge.status}</span></div>)}</section></div></>;
}
