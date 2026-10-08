import type { PrismaClient, Room, RoomType } from "@pms/db";
import { toDayUTC } from "../dates.js";
import { ValidationError } from "../errors.js";
import { SELLABLE_STATUSES } from "../rooms/sellable.js";

const ACTIVE_STATES = ["RESERVED", "CHECKED_IN"] as const;

export type FreeRoom = Room & { type: RoomType };

export class AvailabilityReader {
  constructor(private readonly db: PrismaClient) {}

  async freeRooms(checkIn: Date, checkOut: Date): Promise<FreeRoom[]> {
    const start = toDayUTC(checkIn);
    const end = toDayUTC(checkOut);
    if (end <= start) {
      throw new ValidationError("Checkout must fall after checkin");
    }

    return this.db.room.findMany({
      where: {
        status: { in: [...SELLABLE_STATUSES] },
        reservations: {
          none: {
            state: { in: [...ACTIVE_STATES] },
            checkIn: { lt: end },
            checkOut: { gt: start },
          },
        },
      },
      include: { type: true },
      orderBy: { number: "asc" },
    });
  }
}
