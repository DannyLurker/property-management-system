import type { RoomStatus } from "@pms/db";

export const ROOM_STATUS_MOVES: Record<RoomStatus, readonly RoomStatus[]> = {
  DIRTY: ["CLEAN", "OUT_OF_ORDER"],
  CLEAN: ["DIRTY", "INSPECTED", "OUT_OF_ORDER"],
  INSPECTED: ["DIRTY", "OUT_OF_ORDER"],
  OUT_OF_ORDER: ["DIRTY", "CLEAN"],
};

export function isAllowedMove(from: RoomStatus, to: RoomStatus): boolean {
  return ROOM_STATUS_MOVES[from].includes(to);
}
