import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { addStorageItem, closeStorageRecord, createStorageRecord } from "@/app/actions/job-operations";
import { db } from "@/db";
import { customer, job, storageItem, storageRecord } from "@/db/app-schema";
import { requireTenant } from "@/lib/tenant";

export default async function JobStoragePage({ params }: { params: Promise<{ id: string }> }) {
  const tenant = await requireTenant();
  const { id } = await params;
  const [record, storage] = await Promise.all([
    db.select({ job, customer }).from(job).leftJoin(customer, eq(job.customerId, customer.id)).where(and(eq(job.id, id), eq(job.organizationId, tenant.organization.id))).limit(1),
    db.select().from(storageRecord).where(and(eq(storageRecord.jobId, id), eq(storageRecord.organizationId, tenant.organization.id))).orderBy(desc(storageRecord.createdAt)),
  ]);
  if (!record[0]) notFound();
  const item = record[0].job;
  const person = record[0].customer;
  const items = storage.length ? await db.select().from(storageItem).where(and(eq(storageItem.storageRecordId, storage[0].id), eq(storageItem.organizationId, tenant.organization.id))) : [];
  return <><header className="app-header"><div><p className="eyebrow">STORAGE OPERATIONS</p><h1>{item.jobNumber}</h1><p>{person?.companyName || [person?.firstName, person?.lastName].filter(Boolean).join(" ") || "Unassigned customer"} · storage inventory and exit tracking</p></div><Link className="secondary-button" href={`/app/jobs/${item.id}`}>Back to job</Link></header><div className="workspace-grid"><section className="workspace-panel"><p className="eyebrow">RECORDS</p><h2>{storage.length} storage records</h2>{storage.length ? storage.map((storageRecordItem) => <article className="record-card" key={storageRecordItem.id}><strong>{storageRecordItem.location || "Unassigned location"}</strong><span>{storageRecordItem.status} · ${Number(storageRecordItem.monthlyRate).toFixed(2)} / month</span><small>Entered {storageRecordItem.entryDate?.toLocaleDateString() || "—"}{storageRecordItem.exitDate ? ` · Exited ${storageRecordItem.exitDate.toLocaleDateString()}` : ""}</small>{storageRecordItem.notes && <small>{storageRecordItem.notes}</small>}{items.filter((storedItem) => storedItem.storageRecordId === storageRecordItem.id).map((storedItem) => <small key={storedItem.id}>{storedItem.quantity} × {storedItem.description}{storedItem.barcode ? ` · ${storedItem.barcode}` : ""}</small>)}{storageRecordItem.status !== "exited" && <><form action={addStorageItem} className="record-form inline-form"><input type="hidden" name="jobId" value={item.id} /><input type="hidden" name="storageRecordId" value={storageRecordItem.id} /><div className="form-row"><input name="description" placeholder="Stored item" required /><input name="quantity" type="number" min="1" defaultValue="1" /><input name="condition" placeholder="Condition" /><input name="barcode" placeholder="Barcode" /><button className="secondary-button">Add item</button></div></form><form action={closeStorageRecord}><input type="hidden" name="jobId" value={item.id} /><input type="hidden" name="storageRecordId" value={storageRecordItem.id} /><button className="secondary-button">Record exit</button></form></>}</article>) : <div className="inline-empty"><h3>No storage records</h3><p>Open a record when goods enter storage.</p></div>}</section><aside className="workspace-panel"><p className="eyebrow">NEW RECORD</p><h2>Open storage</h2><form action={createStorageRecord} className="record-form"><input type="hidden" name="jobId" value={item.id} /><label>Location<input name="location" placeholder="Warehouse A / Bay 4" /></label><label>Monthly rate<input name="monthlyRate" type="number" min="0" step="0.01" defaultValue="0" /></label><label>Notes<textarea name="notes" rows={4} /></label><button className="primary-button">Open storage record</button></form></aside></div></>;
}
