import { and, asc, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { addJobCharge, addJobNote, addJobStop, reportJobDamage } from "@/app/actions/job-operations";
import { db } from "@/db";
import { customer, job, jobCharge, jobDamage, jobNote, jobStop } from "@/db/app-schema";
import { requireTenant } from "@/lib/tenant";

export default async function JobActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const tenant = await requireTenant();
  const { id } = await params;
  const [record, stops, notes, damages, charges] = await Promise.all([
    db.select({ job, customer }).from(job).leftJoin(customer, eq(job.customerId, customer.id)).where(and(eq(job.id, id), eq(job.organizationId, tenant.organization.id))).limit(1),
    db.select().from(jobStop).where(and(eq(jobStop.jobId, id), eq(jobStop.organizationId, tenant.organization.id))).orderBy(asc(jobStop.sequence)),
    db.select().from(jobNote).where(and(eq(jobNote.jobId, id), eq(jobNote.organizationId, tenant.organization.id))).orderBy(desc(jobNote.createdAt)),
    db.select().from(jobDamage).where(and(eq(jobDamage.jobId, id), eq(jobDamage.organizationId, tenant.organization.id))).orderBy(desc(jobDamage.createdAt)),
    db.select().from(jobCharge).where(and(eq(jobCharge.jobId, id), eq(jobCharge.organizationId, tenant.organization.id))).orderBy(desc(jobCharge.createdAt)),
  ]);
  if (!record[0]) notFound();
  const item = record[0].job;
  const person = record[0].customer;
  const chargeTotal = charges.filter((charge) => charge.status !== "waived").reduce((total, charge) => total + Number(charge.amount), 0);

  return <><header className="app-header"><div><p className="eyebrow">JOB ACTIVITY</p><h1>{item.jobNumber}</h1><p>{person?.companyName || [person?.firstName, person?.lastName].filter(Boolean).join(" ") || "Unassigned customer"} · stops, notes, damages, and charges</p></div><Link className="secondary-button" href={`/app/jobs/${item.id}`}>Back to job</Link></header><div className="operations-grid"><section className="workspace-panel"><p className="eyebrow">STOPS</p><h2>{stops.length} stops</h2>{stops.map((stop) => <div className="record-card" key={stop.id}><strong>{stop.sequence}. {stop.stopType}</strong><span>{stop.address}</span>{stop.scheduledArrival && <small>{new Date(stop.scheduledArrival).toLocaleString()}</small>}{stop.notes && <small>{stop.notes}</small>}</div>)}<form action={addJobStop} className="record-form"><input type="hidden" name="jobId" value={item.id} /><div className="form-row"><label>Sequence<input name="sequence" type="number" min="1" defaultValue={stops.length + 1} /></label><label>Type<select name="stopType"><option>pickup</option><option>delivery</option><option>warehouse</option><option>service</option></select></label></div><label>Address<input name="address" required /></label><label>Arrival<input name="scheduledArrival" type="datetime-local" /></label><label>Notes<textarea name="notes" rows={3} /></label><button className="secondary-button">Add stop</button></form></section><section className="workspace-panel"><p className="eyebrow">NOTES</p><h2>{notes.length} notes</h2>{notes.map((note) => <div className="record-card" key={note.id}><small>{new Date(note.createdAt).toLocaleString()}</small><span>{note.body}</span></div>)}<form action={addJobNote} className="record-form"><input type="hidden" name="jobId" value={item.id} /><label>New job note<textarea name="body" rows={5} required /></label><button className="secondary-button">Add note</button></form></section><section className="workspace-panel"><p className="eyebrow">DAMAGE</p><h2>{damages.length} reports</h2>{damages.map((damage) => <div className="record-card" key={damage.id}><strong>{damage.description}</strong><span>{damage.status} · ${Number(damage.estimatedAmount).toFixed(2)}</span>{damage.location && <small>{damage.location}</small>}</div>)}<form action={reportJobDamage} className="record-form"><input type="hidden" name="jobId" value={item.id} /><label>Description<input name="description" required /></label><label>Location<input name="location" placeholder="Room, item, or stop" /></label><label>Estimated amount<input name="estimatedAmount" type="number" min="0" step="0.01" defaultValue="0" /></label><button className="secondary-button">Report damage</button></form></section><section className="workspace-panel"><p className="eyebrow">CHARGES</p><h2>${chargeTotal.toFixed(2)} active charges</h2>{charges.map((charge) => <div className="record-card" key={charge.id}><strong>{charge.description}</strong><span>${Number(charge.amount).toFixed(2)} · {charge.status}</span></div>)}<form action={addJobCharge} className="record-form"><input type="hidden" name="jobId" value={item.id} /><label>Description<input name="description" required /></label><div className="form-row"><label>Amount<input name="amount" type="number" min="0.01" step="0.01" required /></label><label>Status<select name="status"><option>pending</option><option>approved</option><option>invoiced</option><option>waived</option></select></label></div><button className="secondary-button">Add charge</button></form></section></div></>;
}
