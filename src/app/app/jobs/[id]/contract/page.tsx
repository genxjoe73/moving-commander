import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { customer, job, jobContract } from "@/db/app-schema";
import { requireTenant } from "@/lib/tenant";

export default async function JobContractPage({ params }: { params: Promise<{ id: string }> }) {
  const tenant = await requireTenant();
  const { id } = await params;
  const [record, contract] = await Promise.all([
    db.select({ job, customer }).from(job).leftJoin(customer, eq(job.customerId, customer.id)).where(and(eq(job.id, id), eq(job.organizationId, tenant.organization.id))).limit(1),
    db.select().from(jobContract).where(and(eq(jobContract.jobId, id), eq(jobContract.organizationId, tenant.organization.id))).limit(1),
  ]);
  if (!record[0]) notFound();
  const item = record[0].job;
  const person = record[0].customer;
  const contractRecord = contract[0];
  const terms = String((contractRecord?.termsSnapshot as { terms?: string } | null)?.terms || "No contract terms have been entered yet.");
  return <><header className="app-header"><div><p className="eyebrow">CONTRACT PREVIEW</p><h1>{item.jobNumber}</h1><p>{person?.companyName || [person?.firstName, person?.lastName].filter(Boolean).join(" ") || "Unassigned customer"} · contract status: {contractRecord?.status || "pending"}</p></div><Link className="secondary-button" href={`/app/jobs/${item.id}`}>Back to job</Link></header><section className="editor-card"><div className="record-summary"><div><p className="eyebrow">MOVE CONTRACT</p><h2>{item.jobNumber}</h2></div><div className="record-meta"><strong>{contractRecord?.status || "pending"}</strong>{contractRecord?.signedAt && <small>Signed {contractRecord.signedAt.toLocaleString()}</small>}</div></div><dl className="settings-card"><dt>Customer</dt><dd>{person?.companyName || [person?.firstName, person?.lastName].filter(Boolean).join(" ") || "Unassigned customer"}</dd><dt>Origin</dt><dd>{item.originAddress || "Not provided"}</dd><dt>Destination</dt><dd>{item.destinationAddress || "Not provided"}</dd><dt>Document</dt><dd>{contractRecord?.documentUrl ? <a href={contractRecord.documentUrl} target="_blank" rel="noreferrer">Open linked document</a> : "No document link"}</dd></dl><div className="record-notes">{terms}</div><p className="field-help">This preview does not create a signature or accounting entry. Those integrations can be added after the contract rules are confirmed.</p></section></>;
}
