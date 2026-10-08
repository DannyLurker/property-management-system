import type {
  PrismaClient,
  Reservation,
  ReservationSource,
} from "@pms/db";
import { ConflictError, NotFoundError, ValidationError } from "../errors.js";
import { isSellable } from "../rooms/sellable.js";
import { toDayUTC } from "../dates.js";

export interface CreateReservationInput {
  guestId: string;
  roomId: string;
  // UTC midnight date only values, see src/dates.ts for the contract.
  checkIn: Date;
  checkOut: Date;
  source?: ReservationSource;
  staffId?: string;
}

export class ReservationBooker {
  constructor(private readonly db: PrismaClient) {}

  async book(input: CreateReservationInput): Promise<Reservation> {
    const checkIn = toDayUTC(input.checkIn);
    const checkOut = toDayUTC(input.checkOut);
    if (checkOut <= checkIn) {
      throw new ValidationError("Checkout must fall after checkin");
    }

    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Room" WHERE id = ${input.roomId} FOR UPDATE`;

      const room = await tx.room.findUnique({ where: { id: input.roomId } });
      if (room === null) {
        throw new NotFoundError(`Room ${input.roomId} is missing`);
      }
      const guest = await tx.guest.findUnique({
        where: { id: input.guestId },
      });
      if (guest === null) {
        throw new NotFoundError(`Guest ${input.guestId} is missing`);
      }
      if (!isSellable(room.status)) {
        throw new ConflictError("Room is not sellable");
      }

      const clash = await tx.reservation.findFirst({
        where: {
          roomId: input.roomId,
          state: { in: ["RESERVED", "CHECKED_IN"] },
          checkIn: { lt: checkOut },
          checkOut: { gt: checkIn },
        },
        select: { id: true },
      });
      if (clash !== null) {
        throw new ConflictError("Those dates clash with another stay");
      }

      return tx.reservation.create({
        data: {
          guestId: input.guestId,
          roomId: input.roomId,
          checkIn,
          checkOut,
          source: input.source ?? "DIRECT",
          staffId: input.staffId,
          folio: { create: {} },
        },
      });
    });
  }
}
