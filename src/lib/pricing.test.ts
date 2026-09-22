import { describe, expect, it } from "vitest";

import { calculateQuote, longHaulTariffBase, roundBillableHours, warehouseItem225Base } from "./pricing";

describe("quote pricing", () => {
  it("rounds billable time to the tariff quarter-hour", () => {
    expect(roundBillableHours(2.01)).toBe(2.25);
    expect(roundBillableHours(2.26)).toBe(2.5);
  });

  it("calculates local maximum labor, trip, surcharge, and tax", () => {
    const result = calculateQuote({ pricingModel: "local_hourly", tariffRule: "local_max_2018", hours: 2.01, foremen: 1, movers: 2, trucks: 1, equipment: 1, overtime: false, tripMiles: 10, tripRate: 4, weight: 3000, overrideTripCharge: false, discountPercent: 0, surchargePercent: 10, salesTaxPercent: 8.25, taxExempt: false });
    expect(result.billableHours).toBe(2.25);
    expect(result.baseCharge).toBe(797.18);
    expect(result.tripCharge).toBe(40);
    expect(result.surcharge).toBe(83.72);
    expect(result.total).toBe(996.87);
    expect(result.warnings).toContain("Hours rounded from 2.01 to 2.25 under Item 22.");
  });

  it("reads the captured Section 3 tariff table", () => {
    expect(longHaulTariffBase(1, 1000)).toBe(1897);
    expect(longHaulTariffBase(1, 24000)).toBe(12436.05);
  });

  it("reads the captured Item 225 warehouse table", () => {
    expect(warehouseItem225Base(1000)).toBe(131);
    expect(warehouseItem225Base(24000)).toBe(971.8);
  });
});
