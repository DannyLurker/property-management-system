import type { RoomStatus } from "@pms/db";

export const SELLABLE_STATUSES: readonly RoomStatus[] = [
  "CLEAN",
  "INSPECTED",
];

export function isSellable(status: RoomStatus): boolean {
  return SELLABLE_STATUSES.includes(status);
}
