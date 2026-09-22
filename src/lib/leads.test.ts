import { describe, expect, it } from "vitest";

import { createQuoteNumber, leadInputSchema } from "./leads";

const validLead = {
  firstName: "Brent",
  lastName: "Davis",
  companyName: "",
  email: "brent@example.com",
  phone: "555-0100",
  moveDate: "2026-10-15",
  originPostalCode: "76010",
  destinationPostalCode: "76102",
  notes: "Needs a two-truck estimate",
};

describe("lead intake", () => {
  it("normalizes a valid manual lead", () => {
    const result = leadInputSchema.parse(validLead);
    expect(result.companyName).toBeNull();
    expect(result.moveDate).toEqual(new Date("2026-10-15T12:00:00"));
  });

  it("requires a person or company name", () => {
    const result = leadInputSchema.safeParse({ ...validLead, firstName: "", lastName: "", companyName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects malformed email and dates", () => {
    expect(leadInputSchema.safeParse({ ...validLead, email: "not-an-email" }).success).toBe(false);
    expect(leadInputSchema.safeParse({ ...validLead, moveDate: "10/15/26" }).success).toBe(false);
  });

  it("creates readable collision-resistant quote numbers", () => {
    expect(createQuoteNumber(new Date("2026-09-21T15:00:00Z"), "abcdef12-0000-0000-0000-000000000000")).toBe("MC-20260921-ABCDEF");
  });
});
