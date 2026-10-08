import { expect, it } from "vitest";
import { toDayUTC } from "../dates.js";

it("should correctly keep June 1st when receiving a local time Date", () => {
  const localDate = new Date(2036, 5, 1); // June, 1  2036 local time
  const normalized = toDayUTC(localDate);

  expect(normalized.getUTCFullYear()).toBe(2036);
  expect(normalized.getUTCMonth()).toBe(5); // Month index 5 = June
  expect(normalized.getUTCDate()).toBe(1); // Still on 1st, not 31st!
});
