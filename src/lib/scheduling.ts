export type ScheduleRange = { start: Date | null; end: Date | null };

export function rangesOverlap(left: ScheduleRange, right: ScheduleRange) {
  if (!left.start || !left.end || !right.start || !right.end) return false;
  return left.start < right.end && right.start < left.end;
}
