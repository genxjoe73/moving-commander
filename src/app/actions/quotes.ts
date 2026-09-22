"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { auditLog, quote } from "@/db/app-schema";
import { calculateQuote } from "@/lib/pricing";
import { requireTenantRole } from "@/lib/tenant";

const numberField = (max = 100000000) => z.coerce.number().finite().min(0).max(max);
const dateField = z.union([z.literal(""), z.iso.date()]);

const quoteSchema = z.object({
  id: z.string().uuid(),
  moveDate: dateField,
  pricingModel: z.enum(["local_hourly", "long_haul", "flat_rate"]),
  tariffRule: z.enum(["local_max_2018", "section_3_long_haul", "item_225_warehouse", "manual"]),
  originAddress: z.string().trim().max(500),
  destinationAddress: z.string().trim().max(500),
  fromCity: z.string().trim().max(80),
  fromState: z.string().trim().max(40),
  fromPostalCode: z.string().trim().max(20),
  toCity: z.string().trim().max(80),
  toState: z.string().trim().max(40),
  toPostalCode: z.string().trim().max(20),
  hours: numberField(1000),
  foremen: numberField(100),
  movers: numberField(100),
  trucks: numberField(100),
  equipment: numberField(100),
  weight: numberField(1000000),
  tripMiles: numberField(100000),
  hourlyRate: numberField(100000),
  tripRate: numberField(100000),
  flatRate: numberField(100000000),
  discountPercent: numberField(100),
  surchargePercent: numberField(100),
  salesTaxPercent: numberField(100),
  taxExempt: z.enum(["on"]).optional(),
  overtime: z.enum(["on"]).optional(),
  overrideTripCharge: z.enum(["on"]).optional(),
  notes: z.string().trim().max(4000),
});

export async function saveQuote(formData: FormData) {
  const tenant = await requireTenantRole(["owner", "admin", "member"]);
  const parsed = quoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Quote data is invalid. Please check the fields and try again.");

  const data = parsed.data;
  const [existing] = await db.select({ id: quote.id }).from(quote)
    .where(and(eq(quote.id, data.id), eq(quote.organizationId, tenant.organization.id))).limit(1);
  if (!existing) throw new Error("Quote not found in this company.");

  const pricingInput = {
    pricingModel: data.pricingModel,
    tariffRule: data.tariffRule,
    hours: data.hours,
    foremen: data.foremen,
    movers: data.movers,
    trucks: data.trucks,
    equipment: data.equipment,
    overtime: Boolean(data.overtime),
    hourlyRate: data.hourlyRate,
    flatRate: data.flatRate,
    tripMiles: data.tripMiles,
    tripRate: data.tripRate,
    weight: data.weight,
    overrideTripCharge: Boolean(data.overrideTripCharge),
    discountPercent: data.discountPercent,
    surchargePercent: data.surchargePercent,
    salesTaxPercent: data.salesTaxPercent,
    taxExempt: Boolean(data.taxExempt),
  } as const;
  const calculated = calculateQuote(pricingInput);

  await db.transaction(async (tx) => {
    await tx.update(quote).set({
      moveDate: data.moveDate ? new Date(`${data.moveDate}T12:00:00`) : null,
      pricingModel: data.pricingModel,
      tariffRule: data.tariffRule,
      originAddress: data.originAddress || null,
      destinationAddress: data.destinationAddress || null,
      fromCity: data.fromCity || null,
      fromState: data.fromState || null,
      fromPostalCode: data.fromPostalCode || null,
      toCity: data.toCity || null,
      toState: data.toState || null,
      toPostalCode: data.toPostalCode || null,
      estimatedHours: data.hours.toFixed(2),
      foremanCount: data.foremen.toFixed(2),
      moverCount: data.movers.toFixed(2),
      truckCount: data.trucks.toFixed(2),
      equipmentCount: data.equipment.toFixed(2),
      estimatedWeight: data.weight.toFixed(2),
      tripMiles: data.tripMiles.toFixed(2),
      hourlyRate: data.hourlyRate.toFixed(2),
      tripRate: data.tripRate.toFixed(2),
      tripCharge: calculated.tripCharge.toFixed(2),
      flatRateAmount: data.flatRate.toFixed(2),
      discountPercent: data.discountPercent.toFixed(3),
      surchargePercent: Math.min(30, data.surchargePercent).toFixed(3),
      salesTaxPercent: data.salesTaxPercent.toFixed(4),
      salesTax: calculated.salesTax.toFixed(2),
      taxExempt: Boolean(data.taxExempt),
      overtime: Boolean(data.overtime),
      overrideTripCharge: Boolean(data.overrideTripCharge),
      notes: data.notes || null,
      quoteDetails: { ...data, taxExempt: Boolean(data.taxExempt), overtime: Boolean(data.overtime), overrideTripCharge: Boolean(data.overrideTripCharge) },
      calculationSnapshot: { ...calculated, pricingInput, calculatedAt: new Date().toISOString(), tariffVersion: "MAX-4-2018" },
      estimatedTotal: calculated.total.toFixed(2),
      total: calculated.total.toFixed(2),
      updatedAt: new Date(),
    }).where(and(eq(quote.id, data.id), eq(quote.organizationId, tenant.organization.id)));
    await tx.insert(auditLog).values({ organizationId: tenant.organization.id, userId: tenant.session.user.id, action: "quote.recalculated", entityType: "quote", entityId: data.id, metadata: { total: calculated.total, warnings: calculated.warnings, tariffRule: data.tariffRule } });
  });

  revalidatePath("/app");
  revalidatePath("/app/quotes");
  revalidatePath(`/app/quotes/${data.id}`);
  redirect(`/app/quotes/${data.id}?saved=1`);
}
