"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { auditLog, crew, employee, job, jobContract, jobCrewAssignment, jobEmployeeAssignment, jobPayment, jobTruckAssignment, storageItem, storageRecord, truck } from "@/db/app-schema";
import { requireTenantRole } from "@/lib/tenant";
import { rangesOverlap } from "@/lib/scheduling";

const id = z.string().uuid();
const jobId = (formData: FormData) => id.parse(formData.get("jobId"));
const text = (max: number) => z.string().trim().max(max);

export async function createCrew(formData: FormData) {
  const tenant = await requireTenantRole(["owner", "admin"]);
  const name = text(100).min(2).parse(formData.get("name"));
  const leaderName = text(100).parse(formData.get("leaderName") || "") || null;
  await db.insert(crew).values({ organizationId: tenant.organization.id, name, leaderName });
  revalidatePath("/app/jobs");
}

export async function assignCrew(formData: FormData) {
  const tenant = await requireTenantRole(["owner", "admin", "member"]);
  const currentJobId = jobId(formData);
  const crewId = id.parse(formData.get("crewId"));
  const role = text(60).parse(formData.get("role") || "assigned");
  const [ownedJob] = await db.select({ id: job.id }).from(job).where(and(eq(job.id, currentJobId), eq(job.organizationId, tenant.organization.id))).limit(1);
  const [ownedCrew] = await db.select({ id: crew.id }).from(crew).where(and(eq(crew.id, crewId), eq(crew.organizationId, tenant.organization.id))).limit(1);
  if (!ownedJob || !ownedCrew) throw new Error("Job or crew not found in this company.");
  await db.transaction(async (tx) => {
    await tx.insert(jobCrewAssignment).values({ organizationId: tenant.organization.id, jobId: currentJobId, crewId, role }).onConflictDoNothing();
    await tx.insert(auditLog).values({ organizationId: tenant.organization.id, userId: tenant.session.user.id, action: "job.crew_assigned", entityType: "job", entityId: currentJobId, metadata: { crewId, role } });
  });
  revalidatePath(`/app/jobs/${currentJobId}`);
}

export async function createEmployee(formData: FormData) {
  const tenant = await requireTenantRole(["owner", "admin"]);
  const firstName = text(80).min(1).parse(formData.get("firstName"));
  const lastName = text(80).min(1).parse(formData.get("lastName"));
  const email = text(200).parse(formData.get("email") || "") || null;
  const phone = text(60).parse(formData.get("phone") || "") || null;
  const role = text(60).parse(formData.get("role") || "mover");
  await db.insert(employee).values({ organizationId: tenant.organization.id, firstName, lastName, email, phone, role });
  revalidatePath("/app/jobs");
  revalidatePath("/app/settings");
}

export async function createTruck(formData: FormData) {
  const tenant = await requireTenantRole(["owner", "admin"]);
  const unitNumber = text(40).min(1).parse(formData.get("unitNumber"));
  const truckType = text(80).parse(formData.get("truckType") || "moving truck");
  const capacity = text(80).parse(formData.get("capacity") || "") || null;
  await db.insert(truck).values({ organizationId: tenant.organization.id, unitNumber, truckType, capacity });
  revalidatePath("/app/jobs");
  revalidatePath("/app/settings");
}

export async function assignEmployee(formData: FormData) {
  const tenant = await requireTenantRole(["owner", "admin", "member"]);
  const currentJobId = jobId(formData);
  const employeeId = id.parse(formData.get("employeeId"));
  const role = text(60).parse(formData.get("role") || "mover");
  const [ownedJob] = await db.select({ id: job.id }).from(job).where(and(eq(job.id, currentJobId), eq(job.organizationId, tenant.organization.id))).limit(1);
  const [ownedEmployee] = await db.select({ id: employee.id }).from(employee).where(and(eq(employee.id, employeeId), eq(employee.organizationId, tenant.organization.id), eq(employee.active, true))).limit(1);
  if (!ownedJob || !ownedEmployee) throw new Error("Job or employee not found in this company.");
  const [currentJob] = await db.select({ scheduledStart: job.scheduledStart, scheduledEnd: job.scheduledEnd }).from(job).where(eq(job.id, currentJobId)).limit(1);
  const existingAssignments = await db.select({ scheduledStart: job.scheduledStart, scheduledEnd: job.scheduledEnd }).from(jobEmployeeAssignment).innerJoin(job, eq(jobEmployeeAssignment.jobId, job.id)).where(and(eq(jobEmployeeAssignment.employeeId, employeeId), eq(jobEmployeeAssignment.organizationId, tenant.organization.id), ne(job.id, currentJobId)));
  if (currentJob && existingAssignments.some((existing) => rangesOverlap({ start: currentJob.scheduledStart, end: currentJob.scheduledEnd }, { start: existing.scheduledStart, end: existing.scheduledEnd }))) throw new Error("That employee is already assigned to an overlapping scheduled job.");
  await db.transaction(async (tx) => {
    await tx.insert(jobEmployeeAssignment).values({ organizationId: tenant.organization.id, jobId: currentJobId, employeeId, role }).onConflictDoNothing();
    await tx.insert(auditLog).values({ organizationId: tenant.organization.id, userId: tenant.session.user.id, action: "job.employee_assigned", entityType: "job", entityId: currentJobId, metadata: { employeeId, role } });
  });
  revalidatePath(`/app/jobs/${currentJobId}`);
}

export async function assignTruck(formData: FormData) {
  const tenant = await requireTenantRole(["owner", "admin", "member"]);
  const currentJobId = jobId(formData);
  const truckId = id.parse(formData.get("truckId"));
  const role = text(60).parse(formData.get("role") || "primary");
  const [ownedJob] = await db.select({ id: job.id }).from(job).where(and(eq(job.id, currentJobId), eq(job.organizationId, tenant.organization.id))).limit(1);
  const [ownedTruck] = await db.select({ id: truck.id }).from(truck).where(and(eq(truck.id, truckId), eq(truck.organizationId, tenant.organization.id), eq(truck.active, true))).limit(1);
  if (!ownedJob || !ownedTruck) throw new Error("Job or truck not found in this company.");
  const [currentJob] = await db.select({ scheduledStart: job.scheduledStart, scheduledEnd: job.scheduledEnd }).from(job).where(eq(job.id, currentJobId)).limit(1);
  const existingAssignments = await db.select({ scheduledStart: job.scheduledStart, scheduledEnd: job.scheduledEnd }).from(jobTruckAssignment).innerJoin(job, eq(jobTruckAssignment.jobId, job.id)).where(and(eq(jobTruckAssignment.truckId, truckId), eq(jobTruckAssignment.organizationId, tenant.organization.id), ne(job.id, currentJobId)));
  if (currentJob && existingAssignments.some((existing) => rangesOverlap({ start: currentJob.scheduledStart, end: currentJob.scheduledEnd }, { start: existing.scheduledStart, end: existing.scheduledEnd }))) throw new Error("That truck is already assigned to an overlapping scheduled job.");
  await db.transaction(async (tx) => {
    await tx.insert(jobTruckAssignment).values({ organizationId: tenant.organization.id, jobId: currentJobId, truckId, role }).onConflictDoNothing();
    await tx.insert(auditLog).values({ organizationId: tenant.organization.id, userId: tenant.session.user.id, action: "job.truck_assigned", entityType: "job", entityId: currentJobId, metadata: { truckId, role } });
  });
  revalidatePath(`/app/jobs/${currentJobId}`);
}

export async function saveJobContract(formData: FormData) {
  const tenant = await requireTenantRole(["owner", "admin", "member"]);
  const currentJobId = jobId(formData);
  const status = z.enum(["pending", "sent", "signed", "declined"]).parse(formData.get("status"));
  const documentUrl = text(1000).parse(formData.get("documentUrl") || "") || null;
  const terms = text(4000).parse(formData.get("terms") || "");
  const [ownedJob] = await db.select({ id: job.id }).from(job).where(and(eq(job.id, currentJobId), eq(job.organizationId, tenant.organization.id))).limit(1);
  if (!ownedJob) throw new Error("Job not found in this company.");
  await db.transaction(async (tx) => {
    await tx.insert(jobContract).values({ organizationId: tenant.organization.id, jobId: currentJobId, status, documentUrl, signedAt: status === "signed" ? new Date() : null, termsSnapshot: { terms } }).onConflictDoUpdate({ target: jobContract.jobId, set: { status, documentUrl, signedAt: status === "signed" ? new Date() : null, termsSnapshot: { terms }, updatedAt: new Date() } });
    await tx.update(job).set({ contractStatus: status, updatedAt: new Date() }).where(and(eq(job.id, currentJobId), eq(job.organizationId, tenant.organization.id)));
    await tx.insert(auditLog).values({ organizationId: tenant.organization.id, userId: tenant.session.user.id, action: "job.contract_updated", entityType: "job", entityId: currentJobId, metadata: { status } });
  });
  revalidatePath(`/app/jobs/${currentJobId}`);
}

export async function addJobPayment(formData: FormData) {
  const tenant = await requireTenantRole(["owner", "admin", "member"]);
  const currentJobId = jobId(formData);
  const amount = z.coerce.number().finite().positive().max(100000000).parse(formData.get("amount"));
  const method = text(40).parse(formData.get("method") || "unrecorded");
  const status = z.enum(["pending", "authorized", "paid", "refunded", "void"]).parse(formData.get("status"));
  const reference = text(120).parse(formData.get("reference") || "") || null;
  const [ownedJob] = await db.select({ id: job.id }).from(job).where(and(eq(job.id, currentJobId), eq(job.organizationId, tenant.organization.id))).limit(1);
  if (!ownedJob) throw new Error("Job not found in this company.");
  await db.transaction(async (tx) => {
    await tx.insert(jobPayment).values({ organizationId: tenant.organization.id, jobId: currentJobId, amount: amount.toFixed(2), method, status, reference, paidAt: status === "paid" ? new Date() : null });
    await tx.update(job).set({ paymentStatus: status, updatedAt: new Date() }).where(and(eq(job.id, currentJobId), eq(job.organizationId, tenant.organization.id)));
    await tx.insert(auditLog).values({ organizationId: tenant.organization.id, userId: tenant.session.user.id, action: "job.payment_recorded", entityType: "job", entityId: currentJobId, metadata: { amount, method, status } });
  });
  revalidatePath(`/app/jobs/${currentJobId}`);
}

export async function createStorageRecord(formData: FormData) {
  const tenant = await requireTenantRole(["owner", "admin", "member"]);
  const currentJobId = jobId(formData);
  const location = text(200).parse(formData.get("location") || "") || null;
  const monthlyRate = z.coerce.number().finite().min(0).max(1000000).parse(formData.get("monthlyRate"));
  const notes = text(4000).parse(formData.get("notes") || "") || null;
  const [ownedJob] = await db.select({ id: job.id, customerId: job.customerId }).from(job).where(and(eq(job.id, currentJobId), eq(job.organizationId, tenant.organization.id))).limit(1);
  if (!ownedJob) throw new Error("Job not found in this company.");
  await db.insert(storageRecord).values({ organizationId: tenant.organization.id, jobId: currentJobId, customerId: ownedJob.customerId, location, entryDate: new Date(), monthlyRate: monthlyRate.toFixed(2), notes });
  revalidatePath(`/app/jobs/${currentJobId}`);
}

export async function addStorageItem(formData: FormData) {
  const tenant = await requireTenantRole(["owner", "admin", "member"]);
  const currentJobId = jobId(formData);
  const storageRecordId = id.parse(formData.get("storageRecordId"));
  const description = text(300).min(1).parse(formData.get("description"));
  const quantity = z.coerce.number().int().min(1).max(100000).parse(formData.get("quantity"));
  const condition = text(100).parse(formData.get("condition") || "") || null;
  const barcode = text(100).parse(formData.get("barcode") || "") || null;
  const [ownedRecord] = await db.select({ id: storageRecord.id }).from(storageRecord).where(and(eq(storageRecord.id, storageRecordId), eq(storageRecord.organizationId, tenant.organization.id), eq(storageRecord.jobId, currentJobId))).limit(1);
  if (!ownedRecord) throw new Error("Storage record not found in this company.");
  await db.insert(storageItem).values({ organizationId: tenant.organization.id, storageRecordId, description, quantity, condition, barcode });
  revalidatePath(`/app/jobs/${currentJobId}`);
}
