"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { auditLog, crew, employee, employeeCompensation, employeeTimeLog, job, jobCharge, jobContract, jobCrewAssignment, jobDamage, jobEmployeeAssignment, jobInvoice, jobNote, jobPayment, jobStop, jobTruckAssignment, storageItem, storageRecord, truck } from "@/db/app-schema";
import { requireTenantRole } from "@/lib/tenant";
import { rangesOverlap } from "@/lib/scheduling";

const id = z.string().uuid();
const jobId = (formData: FormData) => id.parse(formData.get("jobId"));
const text = (max: number) => z.string().trim().max(max);
const dateInput = z.string().trim().refine((value) => !value || !Number.isNaN(Date.parse(value)), "Enter a valid date and time.");

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

export async function saveEmployeeCompensation(formData: FormData) {
  const tenant = await requireTenantRole(["owner", "admin"]);
  const employeeId = id.parse(formData.get("employeeId"));
  const payType = z.enum(["hourly", "salary", "contract"]).parse(formData.get("payType"));
  const baseRate = z.coerce.number().finite().min(0).max(10000000).parse(formData.get("baseRate"));
  const overtimeMultiplier = z.coerce.number().finite().min(0).max(10).parse(formData.get("overtimeMultiplier"));
  const notes = text(1000).parse(formData.get("notes") || "") || null;
  const [ownedEmployee] = await db.select({ id: employee.id }).from(employee).where(and(eq(employee.id, employeeId), eq(employee.organizationId, tenant.organization.id))).limit(1);
  if (!ownedEmployee) throw new Error("Employee not found in this company.");
  await db.insert(employeeCompensation).values({ organizationId: tenant.organization.id, employeeId, payType, baseRate: baseRate.toFixed(2), overtimeMultiplier: overtimeMultiplier.toFixed(3), notes }).onConflictDoUpdate({ target: employeeCompensation.employeeId, set: { payType, baseRate: baseRate.toFixed(2), overtimeMultiplier: overtimeMultiplier.toFixed(3), notes, updatedAt: new Date() } });
  await db.insert(auditLog).values({ organizationId: tenant.organization.id, userId: tenant.session.user.id, action: "employee.compensation_updated", entityType: "employee", entityId: employeeId, metadata: { payType, baseRate } });
  revalidatePath("/app/employees");
}

export async function createEmployeeTimeLog(formData: FormData) {
  const tenant = await requireTenantRole(["owner", "admin", "member"]);
  const employeeId = id.parse(formData.get("employeeId"));
  const jobIdValue = formData.get("jobId")?.toString() || "";
  const jobIdValueParsed = jobIdValue ? id.parse(jobIdValue) : null;
  const payCode = z.enum(["regular", "overtime", "pto", "training"]).parse(formData.get("payCode"));
  const clockInValue = dateInput.parse(formData.get("clockIn"));
  const clockOutValue = dateInput.parse(formData.get("clockOut") || "");
  const notes = text(2000).parse(formData.get("notes") || "") || null;
  if (!clockInValue) throw new Error("Clock-in time is required.");
  if (clockOutValue && new Date(clockOutValue) <= new Date(clockInValue)) throw new Error("Clock-out must be after clock-in.");
  const [ownedEmployee] = await db.select({ id: employee.id }).from(employee).where(and(eq(employee.id, employeeId), eq(employee.organizationId, tenant.organization.id), eq(employee.active, true))).limit(1);
  if (!ownedEmployee) throw new Error("Employee not found in this company.");
  if (jobIdValueParsed) {
    const [ownedJob] = await db.select({ id: job.id }).from(job).where(and(eq(job.id, jobIdValueParsed), eq(job.organizationId, tenant.organization.id))).limit(1);
    if (!ownedJob) throw new Error("Job not found in this company.");
  }
  const [created] = await db.insert(employeeTimeLog).values({ organizationId: tenant.organization.id, employeeId, jobId: jobIdValueParsed, payCode, clockIn: new Date(clockInValue), clockOut: clockOutValue ? new Date(clockOutValue) : null, notes }).returning({ id: employeeTimeLog.id });
  await db.insert(auditLog).values({ organizationId: tenant.organization.id, userId: tenant.session.user.id, action: "employee.time_log_created", entityType: "employee_time_log", entityId: created.id, metadata: { employeeId, jobId: jobIdValueParsed, payCode } });
  revalidatePath("/app/employees");
}

export async function updateEmployeeTimeLogStatus(formData: FormData) {
  const tenant = await requireTenantRole(["owner", "admin"]);
  const timeLogId = id.parse(formData.get("timeLogId"));
  const status = z.enum(["submitted", "approved", "rejected"]).parse(formData.get("status"));
  const [updated] = await db.update(employeeTimeLog).set({ status, updatedAt: new Date() }).where(and(eq(employeeTimeLog.id, timeLogId), eq(employeeTimeLog.organizationId, tenant.organization.id))).returning({ id: employeeTimeLog.id });
  if (!updated) return;
  await db.insert(auditLog).values({ organizationId: tenant.organization.id, userId: tenant.session.user.id, action: "employee.time_log_status_changed", entityType: "employee_time_log", entityId: timeLogId, metadata: { status } });
  revalidatePath("/app/employees");
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

async function removeAssignment(formData: FormData, assignmentTable: typeof jobCrewAssignment | typeof jobEmployeeAssignment | typeof jobTruckAssignment, action: string) {
  const tenant = await requireTenantRole(["owner", "admin", "member"]);
  const currentJobId = jobId(formData);
  const assignmentId = id.parse(formData.get("assignmentId"));
  const [removed] = await db.delete(assignmentTable).where(and(eq(assignmentTable.id, assignmentId), eq(assignmentTable.jobId, currentJobId), eq(assignmentTable.organizationId, tenant.organization.id))).returning({ id: assignmentTable.id });
  if (!removed) return;
  await db.insert(auditLog).values({ organizationId: tenant.organization.id, userId: tenant.session.user.id, action, entityType: "job", entityId: currentJobId, metadata: { assignmentId } });
  revalidatePath(`/app/jobs/${currentJobId}`);
  revalidatePath(`/app/jobs/${currentJobId}/dispatch`);
}

export async function removeCrewAssignment(formData: FormData) {
  return removeAssignment(formData, jobCrewAssignment, "job.crew_unassigned");
}

export async function removeEmployeeAssignment(formData: FormData) {
  return removeAssignment(formData, jobEmployeeAssignment, "job.employee_unassigned");
}

export async function removeTruckAssignment(formData: FormData) {
  return removeAssignment(formData, jobTruckAssignment, "job.truck_unassigned");
}

export async function addJobStop(formData: FormData) {
  const tenant = await requireTenantRole(["owner", "admin", "member"]);
  const currentJobId = jobId(formData);
  const sequence = z.coerce.number().int().min(1).max(100).parse(formData.get("sequence"));
  const stopType = text(40).parse(formData.get("stopType") || "pickup");
  const address = text(500).min(1).parse(formData.get("address"));
  const scheduledArrivalValue = dateInput.parse(formData.get("scheduledArrival") || "");
  const notes = text(2000).parse(formData.get("notes") || "") || null;
  const [ownedJob] = await db.select({ id: job.id }).from(job).where(and(eq(job.id, currentJobId), eq(job.organizationId, tenant.organization.id))).limit(1);
  if (!ownedJob) throw new Error("Job not found in this company.");
  const [created] = await db.insert(jobStop).values({ organizationId: tenant.organization.id, jobId: currentJobId, sequence, stopType, address, scheduledArrival: scheduledArrivalValue ? new Date(scheduledArrivalValue) : null, notes }).returning({ id: jobStop.id });
  await db.insert(auditLog).values({ organizationId: tenant.organization.id, userId: tenant.session.user.id, action: "job.stop_added", entityType: "job", entityId: currentJobId, metadata: { stopId: created.id, sequence, stopType } });
  revalidatePath(`/app/jobs/${currentJobId}`);
}

export async function addJobNote(formData: FormData) {
  const tenant = await requireTenantRole(["owner", "admin", "member"]);
  const currentJobId = jobId(formData);
  const body = text(5000).min(1).parse(formData.get("body"));
  const [ownedJob] = await db.select({ id: job.id }).from(job).where(and(eq(job.id, currentJobId), eq(job.organizationId, tenant.organization.id))).limit(1);
  if (!ownedJob) throw new Error("Job not found in this company.");
  const [created] = await db.insert(jobNote).values({ organizationId: tenant.organization.id, jobId: currentJobId, authorUserId: tenant.session.user.id, body }).returning({ id: jobNote.id });
  await db.insert(auditLog).values({ organizationId: tenant.organization.id, userId: tenant.session.user.id, action: "job.note_added", entityType: "job", entityId: currentJobId, metadata: { noteId: created.id } });
  revalidatePath(`/app/jobs/${currentJobId}`);
}

export async function reportJobDamage(formData: FormData) {
  const tenant = await requireTenantRole(["owner", "admin", "member"]);
  const currentJobId = jobId(formData);
  const description = text(1000).min(1).parse(formData.get("description"));
  const location = text(200).parse(formData.get("location") || "") || null;
  const estimatedAmount = z.coerce.number().finite().min(0).max(100000000).parse(formData.get("estimatedAmount"));
  const [ownedJob] = await db.select({ id: job.id }).from(job).where(and(eq(job.id, currentJobId), eq(job.organizationId, tenant.organization.id))).limit(1);
  if (!ownedJob) throw new Error("Job not found in this company.");
  const [created] = await db.insert(jobDamage).values({ organizationId: tenant.organization.id, jobId: currentJobId, description, location, estimatedAmount: estimatedAmount.toFixed(2) }).returning({ id: jobDamage.id });
  await db.insert(auditLog).values({ organizationId: tenant.organization.id, userId: tenant.session.user.id, action: "job.damage_reported", entityType: "job", entityId: currentJobId, metadata: { damageId: created.id, estimatedAmount } });
  revalidatePath(`/app/jobs/${currentJobId}`);
}

export async function addJobCharge(formData: FormData) {
  const tenant = await requireTenantRole(["owner", "admin", "member"]);
  const currentJobId = jobId(formData);
  const description = text(500).min(1).parse(formData.get("description"));
  const amount = z.coerce.number().finite().positive().max(100000000).parse(formData.get("amount"));
  const status = z.enum(["pending", "approved", "invoiced", "waived"]).parse(formData.get("status"));
  const [ownedJob] = await db.select({ id: job.id }).from(job).where(and(eq(job.id, currentJobId), eq(job.organizationId, tenant.organization.id))).limit(1);
  if (!ownedJob) throw new Error("Job not found in this company.");
  const [created] = await db.insert(jobCharge).values({ organizationId: tenant.organization.id, jobId: currentJobId, description, amount: amount.toFixed(2), status }).returning({ id: jobCharge.id });
  await db.insert(auditLog).values({ organizationId: tenant.organization.id, userId: tenant.session.user.id, action: "job.charge_added", entityType: "job", entityId: currentJobId, metadata: { chargeId: created.id, amount, status } });
  revalidatePath(`/app/jobs/${currentJobId}`);
}

export async function saveJobInvoice(formData: FormData) {
  const tenant = await requireTenantRole(["owner", "admin"]);
  const currentJobId = jobId(formData);
  const invoiceNumber = text(80).min(1).parse(formData.get("invoiceNumber"));
  const status = z.enum(["draft", "sent", "partially_paid", "paid", "void"]).parse(formData.get("status"));
  const subtotal = z.coerce.number().finite().min(0).max(100000000).parse(formData.get("subtotal"));
  const tax = z.coerce.number().finite().min(0).max(100000000).parse(formData.get("tax"));
  const total = z.coerce.number().finite().min(0).max(100000000).parse(formData.get("total"));
  const dueDate = dateInput.parse(formData.get("dueDate") || "");
  const notes = text(4000).parse(formData.get("notes") || "") || null;
  const [ownedJob] = await db.select({ id: job.id }).from(job).where(and(eq(job.id, currentJobId), eq(job.organizationId, tenant.organization.id))).limit(1);
  if (!ownedJob) throw new Error("Job not found in this company.");
  await db.insert(jobInvoice).values({ organizationId: tenant.organization.id, jobId: currentJobId, invoiceNumber, status, subtotal: subtotal.toFixed(2), tax: tax.toFixed(2), total: total.toFixed(2), dueDate: dueDate ? new Date(dueDate) : null, notes }).onConflictDoUpdate({ target: jobInvoice.jobId, set: { invoiceNumber, status, subtotal: subtotal.toFixed(2), tax: tax.toFixed(2), total: total.toFixed(2), dueDate: dueDate ? new Date(dueDate) : null, notes, updatedAt: new Date() } });
  await db.insert(auditLog).values({ organizationId: tenant.organization.id, userId: tenant.session.user.id, action: "job.invoice_updated", entityType: "job", entityId: currentJobId, metadata: { invoiceNumber, status, total } });
  revalidatePath(`/app/jobs/${currentJobId}`);
  revalidatePath(`/app/jobs/${currentJobId}/billing`);
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

export async function closeStorageRecord(formData: FormData) {
  const tenant = await requireTenantRole(["owner", "admin", "member"]);
  const currentJobId = jobId(formData);
  const storageRecordId = id.parse(formData.get("storageRecordId"));
  const [ownedRecord] = await db.select({ id: storageRecord.id, status: storageRecord.status }).from(storageRecord).where(and(eq(storageRecord.id, storageRecordId), eq(storageRecord.organizationId, tenant.organization.id), eq(storageRecord.jobId, currentJobId))).limit(1);
  if (!ownedRecord) throw new Error("Storage record not found in this company.");
  if (ownedRecord.status === "exited") return;
  await db.update(storageRecord).set({ status: "exited", exitDate: new Date(), updatedAt: new Date() }).where(and(eq(storageRecord.id, storageRecordId), eq(storageRecord.organizationId, tenant.organization.id)));
  await db.insert(auditLog).values({ organizationId: tenant.organization.id, userId: tenant.session.user.id, action: "storage_record.closed", entityType: "storage_record", entityId: storageRecordId, metadata: { jobId: currentJobId } });
  revalidatePath(`/app/jobs/${currentJobId}`);
  revalidatePath(`/app/jobs/${currentJobId}/storage`);
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
