import fs from "node:fs";
import path from "node:path";

import { calculateQuoteCore } from "./pricing-core";
import type { PricingInput, PricingResult } from "./pricing-core";

export type { PricingInput, PricingResult } from "./pricing-core";

const EXCESS_MILE_RATES = [
  { maxWeight: 1999, rate: 88 },
  { maxWeight: 3999, rate: 172 },
  { maxWeight: 7999, rate: 327 },
  { maxWeight: 11999, rate: 520 },
  { maxWeight: 15999, rate: 686 },
  { maxWeight: Number.POSITIVE_INFINITY, rate: 847 },
];

export { roundBillableHours } from "./pricing-core";

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function csvFiles() {
  return ["section3_p66.csv", "section3_p67.csv", "section3_p68.csv", "section3_p69.csv", "section3_p70.csv", "section3_p71.csv", "section3_p72.csv", "section3_p73.csv"];
}

function parseCsvRow(line: string) {
  return line.split(",").map((value) => value.trim());
}

function rateColumnForWeight(headers: string[], weight: number) {
  const normalizedWeight = Math.max(1000, Math.round(weight));
  if (normalizedWeight > 23999) return "w_23500_23999";
  return headers.find((header) => {
    const match = /^w_(\d+)_(\d+)$/.exec(header);
    return match ? normalizedWeight >= Number(match[1]) && normalizedWeight <= Number(match[2]) : false;
  }) ?? "w_1000_1099";
}

export function longHaulTariffBase(miles: number, weight: number) {
  const safeMiles = Math.max(1, Math.round(miles));
  const safeWeight = Math.max(1000, Math.round(weight));
  const files = csvFiles();
  let lastRow: { headers: string[]; values: string[] } | undefined;

  for (const file of files) {
    const absolutePath = path.join(process.cwd(), "Docs", "tariff_rates", file);
    if (!fs.existsSync(absolutePath)) continue;
    const lines = fs.readFileSync(absolutePath, "utf8").trim().split(/\r?\n/);
    const headers = parseCsvRow(lines[0]);
    for (const line of lines.slice(1)) {
      const values = parseCsvRow(line);
      const milesFrom = Number(values[0]);
      const milesTo = Number(values[1]);
      lastRow = { headers, values };
      if (safeMiles >= milesFrom && safeMiles <= milesTo) {
        const index = headers.indexOf(rateColumnForWeight(headers, safeWeight));
        if (index < 0) continue;
        const base = Number(values[index]);
        if (safeWeight <= 23999) return money(base);
        const excessHundreds = Math.ceil((safeWeight - 23999) / 100);
        return money(base + excessHundreds * Number(values[headers.indexOf("each_addl_100lbs")]));
      }
    }
  }

  if (!lastRow) return 0;
  const index = lastRow.headers.indexOf(rateColumnForWeight(lastRow.headers, safeWeight));
  const base = Number(lastRow.values[index]);
  const extraMiles = Math.max(0, safeMiles - 1000);
  const extraRate = EXCESS_MILE_RATES.find((item) => safeWeight <= item.maxWeight)?.rate ?? 847;
  const excessDistanceCharge = Math.ceil(extraMiles / 100) * extraRate;
  if (safeWeight <= 23999) return money(base + excessDistanceCharge);
  const excessHundreds = Math.ceil((safeWeight - 23999) / 100);
  return money(base + excessDistanceCharge + excessHundreds * Number(lastRow.values[lastRow.headers.indexOf("each_addl_100lbs")]));
}

export function warehouseItem225Base(weight: number) {
  const absolutePath = path.join(process.cwd(), "Docs", "tariff_extracted_rules.md");
  if (!fs.existsSync(absolutePath)) return 0;
  const safeWeight = Math.max(1000, Math.round(weight));
  const rows = fs.readFileSync(absolutePath, "utf8").split(/\r?\n/);
  for (const row of rows) {
    const match = /^\|\s*(\d+)–(\d+)\s*\|\s*\$([\d.]+)\s*\|/.exec(row);
    if (match && safeWeight >= Number(match[1]) && safeWeight <= Number(match[2])) return Number(match[3]);
  }
  return safeWeight > 23999 ? 969 + Math.ceil((safeWeight - 23999) / 100) * 2.8 : 0;
}

export function calculateQuote(input: PricingInput): PricingResult {
  const tariffBase = input.pricingModel !== "long_haul" ? 0 : input.tariffRule === "section_3_long_haul" ? longHaulTariffBase(input.tripMiles, input.weight) : input.tariffRule === "item_225_warehouse" ? warehouseItem225Base(input.weight) : 0;
  return calculateQuoteCore(input, tariffBase);
}
