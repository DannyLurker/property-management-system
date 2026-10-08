// Contract: every helper in this package works with calendar days.
// Hotel dates are date only values with no time math. toDayUTC keeps the
// caller's local calendar day (the day the hotel means) and stores it as
// UTC midnight, which is what @db.Date columns hold. Callers pass a Date
// built from the hotel calendar; any time part is dropped.
export function toDayUTC(value: Date): Date {
  return new Date(
    Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()),
  );
}
