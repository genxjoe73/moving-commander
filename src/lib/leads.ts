import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).transform((value) => value || null);

export const leadInputSchema = z.object({
  firstName: optionalText(80),
  lastName: optionalText(80),
  companyName: optionalText(140),
  email: z.union([z.literal(""), z.string().trim().email()]).transform((value) => value || null),
  phone: optionalText(40),
  moveDate: z.union([z.literal(""), z.iso.date()]).transform((value) => value ? new Date(`${value}T12:00:00`) : null),
  originPostalCode: optionalText(20),
  destinationPostalCode: optionalText(20),
  notes: optionalText(4000),
}).refine((value) => value.firstName || value.lastName || value.companyName, {
  message: "Enter a customer or company name.",
  path: ["firstName"],
});

export function createQuoteNumber(now = new Date(), random = crypto.randomUUID()) {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `MC-${date}-${random.slice(0, 6).toUpperCase()}`;
}
