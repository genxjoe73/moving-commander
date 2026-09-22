import { asc, eq } from "drizzle-orm";
import Link from "next/link";

import { db } from "@/db";
import { customer, job } from "@/db/app-schema";
import { requireTenant } from "@/lib/tenant";

export default async function JobsCalendarPage() {
  const tenant = await requireTenant();
  const records = await db.select({ id: job.id, jobNumber: job.jobNumber, status: job.status, scheduledStart: job.scheduledStart, scheduledEnd: job.scheduledEnd, originAddress: job.originAddress, destinationAddress: job.destinationAddress, customerName: customer.companyName, firstName: customer.firstName, lastName: customer.lastName }).from(job).leftJoin(customer, eq(job.customerId, customer.id)).where(eq(job.organizationId, tenant.organization.id)).orderBy(asc(job.scheduledStart), asc(job.jobNumber)).limit(500);
  const grouped = new Map<string, typeof records>();
  for (const record of records) {
    const key = record.scheduledStart ? new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(record.scheduledStart) : "Unscheduled";
    grouped.set(key, [...(grouped.get(key) || []), record]);
  }
  return <><header className="app-header"><div><p className="eyebrow">DISPATCH CALENDAR</p><h1>Schedule calendar</h1><p>Review scheduled work by day, then open a job for dispatch, activity, storage, billing, or contract details.</p></div><Link className="secondary-button" href="/app/jobs">Back to jobs</Link></header><section className="workspace-panel">{grouped.size ? Array.from(grouped.entries()).map(([day, dayJobs]) => <section className="record-list" key={day}><p className="eyebrow">{day}</p>{dayJobs.map((item) => <article className="record-card" key={item.id}><div className="record-summary"><div><span className={`status-pill status-${item.status}`}>{item.status.replace("_", " ")}</span><h3><Link href={`/app/jobs/${item.id}`}>{item.jobNumber}</Link></h3><p>{item.customerName || [item.firstName, item.lastName].filter(Boolean).join(" ") || "Unassigned customer"}</p></div><div className="record-meta"><span>{item.scheduledStart ? new Intl.DateTimeFormat("en-US", { timeStyle: "short" }).format(item.scheduledStart) : "No time set"}</span><small>{item.scheduledEnd ? `Until ${new Intl.DateTimeFormat("en-US", { timeStyle: "short" }).format(item.scheduledEnd)}` : "Open-ended"}</small></div></div><p className="record-notes">{[item.originAddress, item.destinationAddress].filter(Boolean).join(" → ") || "Addresses pending"}</p></article>)}</section>) : <div className="inline-empty"><h3>No jobs scheduled</h3><p>Create a job to populate the dispatch calendar.</p></div>}</section></>;
}
