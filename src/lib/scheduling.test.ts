import { describe, expect, it } from "vitest";

import { rangesOverlap } from "./scheduling";

const date = (value: string) => new Date(`2026-10-15T${value}:00Z`);

describe("rangesOverlap", () => {
  it("detects overlapping assignments", () => {
    expect(rangesOverlap({ start: date("09:00"), end: date("12:00") }, { start: date("11:00"), end: date("13:00") })).toBe(true);
  });

  it("allows adjacent assignments", () => {
    expect(rangesOverlap({ start: date("09:00"), end: date("12:00") }, { start: date("12:00"), end: date("14:00") })).toBe(false);
  });

  it("does not block unscheduled work", () => {
    expect(rangesOverlap({ start: date("09:00"), end: null }, { start: date("09:30"), end: date("10:30") })).toBe(false);
  });
});
