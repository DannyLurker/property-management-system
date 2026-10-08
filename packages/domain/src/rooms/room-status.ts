import type {
  PrismaClient,
  Room,
  RoomStatus,
  StatusLog,
} from "@pms/db";
import { NotFoundError, ValidationError } from "../errors.js";
import { isAllowedMove } from "./transitions.js";

export interface StatusFlip {
  room: Room;
  log: StatusLog;
}

export class RoomStatusFlipper {
  constructor(private readonly db: PrismaClient) {}

  async flip(
    roomId: string,
    toStatus: RoomStatus,
    staffId: string,
  ): Promise<StatusFlip> {
    if (staffId.trim().length === 0) {
      throw new ValidationError("A staff id is required to flip status");
    }

    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Room" WHERE id = ${roomId} FOR UPDATE`;

      const room = await tx.room.findUnique({ where: { id: roomId } });
      if (room === null) {
        throw new NotFoundError(`Room ${roomId} is missing`);
      }
      if (room.status === toStatus) {
        throw new ValidationError("Room already carries that status");
      }
      if (!isAllowedMove(room.status, toStatus)) {
        throw new ValidationError(
          `Room cannot move from ${room.status} to ${toStatus}`,
        );
      }

      const updated = await tx.room.update({
        where: { id: roomId },
        data: { status: toStatus },
      });
      const log = await tx.statusLog.create({
        data: {
          roomId,
          fromStatus: room.status,
          toStatus,
          staffId,
        },
      });
      return { room: updated, log };
    });
  }
}
