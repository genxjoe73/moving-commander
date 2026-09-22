"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { auditLog, customer, lead, quote } from "@/db/app-schema";
import { createQuoteNumber, leadInputSchema } from "@/lib/leads";
import { requireTenant } from "@/lib/tenant";

const statusSchema = z.enum(["new", "contacted", "qualified", "quoted", "won", "lost"]);

export type LeadActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export async function createLead(_state: LeadActionState, formData: FormData): Promise<LeadActionState> {
  const tenant = await requireTenant();
  const parsed = leadInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const [created] = await db.transaction(async (tx) => {
    const inserted = await tx.insert(lead).values({
      organizationId: tenant.organization.id,
      ...parsed.data,
    }).returning({ id: lead.id });

    await tx.insert(auditLog).values({
      organizationId: tenant.organization.id,
      userId: tenant.session.user.id,
      action: "lead.created",
      entityType: "lead",
      entityId: inserted[0].id,
      metadata: { source: "manual" },
    });
    return inserted;
  });

  revalidatePath("/app");
  revalidatePath("/app/leads");
  redirect(`/app/leads?created=${created.id}`);
}

export async function updateLeadStatus(formData: FormData) {
  const tenant = await requireTenant();
  const id = z.string().uuid().parse(formData.get("id"));
  const status = statusSchema.parse(formData.get("status"));

  const [updated] = await db.update(lead)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(lead.id, id), eq(lead.organizationId, tenant.organization.id)))
    .returning({ id: lead.id });
  if (!updated) return;

  await db.insert(auditLog).values({
    organizationId: tenant.organization.id,
    userId: tenant.session.user.id,
    action: "lead.status_changed",
    entityType: "lead",
    entityId: id,
    metadata: { status },
  });
  revalidatePath("/app");
  revalidatePath("/app/leads");
}

export async function convertLeadToQuote(formData: FormData) {
  const tenant = await requireTenant();
  const id = z.string().uuid().parse(formData.get("id"));
  const [sourceLead] = await db.select().from(lead)
    .where(and(eq(lead.id, id), eq(lead.organizationId, tenant.organization.id)))
    .limit(1);
  if (!sourceLead || sourceLead.status === "lost") return;

  const quoteNumber = createQuoteNumber();
  await db.transaction(async (tx) => {
    let customerId: string;
    const [existingCustomer] = await tx.select({ id: customer.id }).from(customer)
      .where(and(eq(customer.organizationId, tenant.organization.id), eq(customer.leadId, sourceLead.id)))
      .limit(1);

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const [createdCustomer] = await tx.insert(customer).values({
        organizationId: tenant.organization.id,
        leadId: sourceLead.id,
        firstName: sourceLead.firstName,
        lastName: sourceLead.lastName,
        companyName: sourceLead.companyName,
        email: sourceLead.email,
        phone: sourceLead.phone,
      }).returning({ id: customer.id });
      customerId = createdCustomer.id;
    }

    const [createdQuote] = await tx.insert(quote).values({
      organizationId: tenant.organization.id,
      customerId,
      leadId: sourceLead.id,
      quoteNumber,
      moveDate: sourceLead.moveDate,
    }).returning({ id: quote.id });

    await tx.update(lead).set({ status: "quoted", updatedAt: new Date() })
      .where(and(eq(lead.id, sourceLead.id), eq(lead.organizationId, tenant.organization.id)));
    await tx.insert(auditLog).values({
      organizationId: tenant.organization.id,
      userId: tenant.session.user.id,
      action: "lead.converted_to_quote",
      entityType: "lead",
      entityId: sourceLead.id,
      metadata: { customerId, quoteId: createdQuote.id, quoteNumber },
    });
  });

  revalidatePath("/app");
  revalidatePath("/app/leads");
  revalidatePath("/app/customers");
  revalidatePath("/app/quotes");
  redirect("/app/quotes");
}
