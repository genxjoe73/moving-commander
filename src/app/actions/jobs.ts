"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { auditLog, job, quote } from "@/db/app-schema";
import { requireTenantRole } from "@/lib/tenant";

const optionalUuid = z.union([z.literal(""), z.string().uuid()]).transform((value) => value || null);
const jobSchema = z.object({
  jobNumber: z.string().trim().min(2).max(40),
  quoteId: optionalUuid,
  scheduledStart: z.string().trim(),
  scheduledEnd: z.string().trim(),
  crewCount: z.coerce.number().int().min(0).max(100),
  truckCount: z.coerce.number().int().min(0).max(100),
  originAddress: z.string().trim().max(500),
  destinationAddress: z.string().trim().max(500),
  dispatchNotes: z.string().trim().max(4000),
});
const statusSchema = z.enum(["scheduled", "dispatched", "in_progress", "completed", "cancelled"]);
const dateInput = z.string().trim().refine((value) => !value || !Number.isNaN(Date.parse(value)), "Enter a valid date and time.");

const jobUpdateSchema = z.object({
  id: z.string().uuid(),
  status: statusSchema,
  scheduledStart: dateInput,
  scheduledEnd: dateInput,
  actualStart: dateInput,
  actualEnd: dateInput,
  crewCount: z.coerce.number().int().min(0).max(100),
  truckCount: z.coerce.number().int().min(0).max(100),
  originAddress: z.string().trim().max(500),
  destinationAddress: z.string().trim().max(500),
  dispatchNotes: z.string().trim().max(4000),
}).superRefine((data, ctx) => {
  if (data.scheduledStart && data.scheduledEnd && new Date(data.scheduledEnd) < new Date(data.scheduledStart)) {
    ctx.addIssue({ code: "custom", path: ["scheduledEnd"], message: "The scheduled end must be after the scheduled start." });
  }
  if (data.actualStart && data.actualEnd && new Date(data.actualEnd) < new Date(data.actualStart)) {
    ctx.addIssue({ code: "custom", path: ["actualEnd"], message: "The actual end must be after the actual start." });
  }
});

export async function createJob(formData: FormData) {
  const tenant = await requireTenantRole(["owner", "admin", "member"]);
  const parsed = jobSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Check the job number and scheduling fields.");
  const data = parsed.data;
  let customerId: string | null = null;
  let quoteNumber: string | null = null;
  if (data.quoteId) {
    const [sourceQuote] = await db.select({ customerId: quote.customerId, quoteNumber: quote.quoteNumber }).from(quote).where(and(eq(quote.id, data.quoteId), eq(quote.organizationId, tenant.organization.id))).limit(1);
    if (!sourceQuote) throw new Error("That quote was not found in this company.");
    customerId = sourceQuote.customerId;
    quoteNumber = sourceQuote.quoteNumber;
  }
  const [created] = await db.transaction(async (tx) => {
    const inserted = await tx.insert(job).values({ organizationId: tenant.organization.id, customerId, quoteId: data.quoteId, jobNumber: data.jobNumber, scheduledStart: data.scheduledStart ? new Date(data.scheduledStart) : null, scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : null, crewCount: data.crewCount, truckCount: data.truckCount, originAddress: data.originAddress || null, destinationAddress: data.destinationAddress || null, dispatchNotes: data.dispatchNotes || null }).returning({ id: job.id });
    await tx.insert(auditLog).values({ organizationId: tenant.organization.id, userId: tenant.session.user.id, action: "job.created", entityType: "job", entityId: inserted[0].id, metadata: { quoteId: data.quoteId, quoteNumber } });
    return inserted;
  });
  revalidatePath("/app");
  revalidatePath("/app/jobs");
  redirect(`/app/jobs?created=${created.id}`);
}

export async function updateJobStatus(formData: FormData) {
  const tenant = await requireTenantRole(["owner", "admin", "member"]);
  const id = z.string().uuid().parse(formData.get("id"));
  const status = statusSchema.parse(formData.get("status"));
  const [updated] = await db.update(job).set({ status, updatedAt: new Date() }).where(and(eq(job.id, id), eq(job.organizationId, tenant.organization.id))).returning({ id: job.id });
  if (!updated) return;
  await db.insert(auditLog).values({ organizationId: tenant.organization.id, userId: tenant.session.user.id, action: "job.status_changed", entityType: "job", entityId: id, metadata: { status } });
  revalidatePath("/app");
  revalidatePath("/app/jobs");
}

export async function updateJob(formData: FormData) {
  const tenant = await requireTenantRole(["owner", "admin", "member"]);
  const parsed = jobUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Check the job details.");
  const data = parsed.data;
  const [updated] = await db.update(job).set({
    status: data.status,
    scheduledStart: data.scheduledStart ? new Date(data.scheduledStart) : null,
    scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : null,
    actualStart: data.actualStart ? new Date(data.actualStart) : null,
    actualEnd: data.actualEnd ? new Date(data.actualEnd) : null,
    crewCount: data.crewCount,
    truckCount: data.truckCount,
    originAddress: data.originAddress || null,
    destinationAddress: data.destinationAddress || null,
    dispatchNotes: data.dispatchNotes || null,
    updatedAt: new Date(),
  }).where(and(eq(job.id, data.id), eq(job.organizationId, tenant.organization.id))).returning({ id: job.id });
  if (!updated) return;
  await db.insert(auditLog).values({
    organizationId: tenant.organization.id,
    userId: tenant.session.user.id,
    action: "job.updated",
    entityType: "job",
    entityId: data.id,
    metadata: { status: data.status, scheduledStart: data.scheduledStart || null, scheduledEnd: data.scheduledEnd || null },
  });
  revalidatePath("/app");
  revalidatePath("/app/jobs");
  revalidatePath(`/app/jobs/${data.id}`);
}
