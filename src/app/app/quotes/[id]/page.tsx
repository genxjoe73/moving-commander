import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { customer, quote } from "@/db/app-schema";
import { QuoteEditor } from "@/components/quote-editor";
import { requireTenant } from "@/lib/tenant";

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const tenant = await requireTenant();
  const { id } = await params;
  const [record] = await db.select({ quote, customer }).from(quote).leftJoin(customer, eq(quote.customerId, customer.id)).where(and(eq(quote.id, id), eq(quote.organizationId, tenant.organization.id))).limit(1);
  if (!record) notFound();
  const item = record.quote;
  const person = record.customer;
  return <><header className="app-header"><div><p className="eyebrow">QUOTE EDITOR</p><h1>{item.quoteNumber}</h1><p>Build a compliant estimate, preserve the calculation snapshot, and keep the legacy defaults traceable.</p></div></header><QuoteEditor customerName={person?.companyName || [person?.firstName, person?.lastName].filter(Boolean).join(" ") || "Unassigned customer"} values={{ id: item.id, moveDate: item.moveDate ? item.moveDate.toISOString().slice(0, 10) : "", pricingModel: item.pricingModel as "local_hourly" | "long_haul" | "flat_rate", tariffRule: item.tariffRule as "local_max_2018" | "section_3_long_haul" | "item_225_warehouse" | "manual", originAddress: item.originAddress || "", destinationAddress: item.destinationAddress || "", fromCity: item.fromCity || "", fromState: item.fromState || "", fromPostalCode: item.fromPostalCode || "", toCity: item.toCity || "", toState: item.toState || "", toPostalCode: item.toPostalCode || "", hours: Number(item.estimatedHours), foremen: Number(item.foremanCount), movers: Number(item.moverCount), trucks: Number(item.truckCount), equipment: Number(item.equipmentCount), weight: Number(item.estimatedWeight), tripMiles: Number(item.tripMiles), hourlyRate: Number(item.hourlyRate), tripRate: Number(item.tripRate), flatRate: Number(item.flatRateAmount), discountPercent: Number(item.discountPercent), surchargePercent: Number(item.surchargePercent), salesTaxPercent: Number(item.salesTaxPercent), taxExempt: item.taxExempt, overtime: item.overtime, overrideTripCharge: item.overrideTripCharge, notes: item.notes || "" }} /></>;
}
