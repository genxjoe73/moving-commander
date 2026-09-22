export type PricingInput = {
  pricingModel: "local_hourly" | "long_haul" | "flat_rate";
  tariffRule: "local_max_2018" | "section_3_long_haul" | "item_225_warehouse" | "manual";
  hours: number;
  foremen: number;
  movers: number;
  trucks: number;
  equipment: number;
  overtime: boolean;
  hourlyRate?: number;
  flatRate?: number;
  tripMiles: number;
  tripRate: number;
  weight: number;
  overrideTripCharge: boolean;
  discountPercent: number;
  surchargePercent: number;
  salesTaxPercent: number;
  taxExempt: boolean;
};

export type PricingResult = {
  billableHours: number;
  baseCharge: number;
  tripCharge: number;
  discount: number;
  surcharge: number;
  taxableSubtotal: number;
  salesTax: number;
  total: number;
  tariffBase: number;
  warnings: string[];
};

const LOCAL_RATES = { foreman: { regular: 105.3, overtime: 174.25 }, mover: { regular: 94.45, overtime: 141.6 }, vehicle: { regular: 56.85, overtime: 62.55 }, equipment: 3.25 };

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function roundBillableHours(hours: number) {
  return hours <= 0 ? 0 : Math.ceil(hours * 4) / 4;
}

export function calculateQuoteCore(input: PricingInput, tariffBaseOverride = 0): PricingResult {
  const billableHours = roundBillableHours(input.hours);
  const rateMultiplier = input.overtime ? 1.5 : 1;
  const warnings: string[] = [];
  let tariffBase = 0;
  let baseCharge = 0;

  if (input.pricingModel === "flat_rate") {
    baseCharge = Math.max(0, input.flatRate ?? 0);
  } else if (input.pricingModel === "long_haul") {
    tariffBase = Math.max(0, tariffBaseOverride || input.flatRate || 0);
    baseCharge = tariffBase * rateMultiplier;
    if (tariffBase === 0) warnings.push("A tariff base could not be calculated; confirm the rate table before sending.");
  } else {
    const rates = { foreman: input.hourlyRate && input.hourlyRate > 0 ? input.hourlyRate : input.overtime ? LOCAL_RATES.foreman.overtime : LOCAL_RATES.foreman.regular, mover: input.overtime ? LOCAL_RATES.mover.overtime : LOCAL_RATES.mover.regular, vehicle: input.overtime ? LOCAL_RATES.vehicle.overtime : LOCAL_RATES.vehicle.regular };
    baseCharge = billableHours * (input.foremen * rates.foreman + input.movers * rates.mover + input.trucks * rates.vehicle + input.equipment * LOCAL_RATES.equipment * rateMultiplier);
  }

  const tripCharge = input.overrideTripCharge ? Math.max(0, input.flatRate ?? 0) : Math.max(0, input.tripMiles * input.tripRate * input.trucks);
  const gross = baseCharge + tripCharge;
  const discount = gross * Math.max(0, input.discountPercent) / 100;
  const surchargePercent = Math.min(30, Math.max(0, input.surchargePercent));
  const surcharge = (gross - discount) * surchargePercent / 100;
  const taxableSubtotal = Math.max(0, gross - discount + surcharge);
  const salesTax = input.taxExempt ? 0 : taxableSubtotal * Math.max(0, input.salesTaxPercent) / 100;

  if (input.surchargePercent > 30) warnings.push("The tariff surcharge cap is 30%; the surcharge was capped.");
  if (input.pricingModel === "local_hourly" && input.hours > 0 && billableHours !== input.hours) warnings.push(`Hours rounded from ${input.hours} to ${billableHours} under Item 22.`);

  return { billableHours, baseCharge: money(baseCharge), tripCharge: money(tripCharge), discount: money(discount), surcharge: money(surcharge), taxableSubtotal: money(taxableSubtotal), salesTax: money(salesTax), total: money(taxableSubtotal + salesTax), tariffBase: money(tariffBase), warnings };
}
