import type { PrismaClient } from "@pms/db";
import { toDayUTC } from "../dates.js";
import { NotFoundError } from "../errors.js";

export class RateLookup {
  constructor(private readonly db: PrismaClient) {}

  async forDate(typeId: string, date: Date): Promise<number> {
    const day = toDayUTC(date);
    const plan = await this.db.ratePlan.findFirst({
      where: {
        typeId,
        startDate: { lte: day },
        endDate: { gt: day },
      },
      orderBy: { startDate: "desc" },
    });
    if (plan !== null) {
      return plan.price.toNumber();
    }

    const roomType = await this.db.roomType.findUnique({
      where: { id: typeId },
      select: { id: true, baseRate: true },
    });
    if (roomType === null) {
      throw new NotFoundError(`Room type ${typeId} is missing`);
    }
    return roomType.baseRate.toNumber();
  }
}
