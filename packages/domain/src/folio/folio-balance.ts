import type { PrismaClient } from "@pms/db";
import { NotFoundError } from "../errors.js";

export interface FolioBalance {
  linesTotal: number;
  paidTotal: number;
  balance: number;
}

export class FolioBalanceReader {
  constructor(private readonly db: PrismaClient) {}

  async read(folioId: string): Promise<FolioBalance> {
    const folio = await this.db.folio.findUnique({
      where: { id: folioId },
      select: { id: true },
    });
    if (folio === null) {
      throw new NotFoundError(`Folio ${folioId} is missing`);
    }

    const [lines, payments] = await Promise.all([
      this.db.folioLine.aggregate({
        where: { folioId },
        _sum: { amount: true },
      }),
      this.db.payment.aggregate({
        where: { folioId, state: "PAID" },
        _sum: { amount: true },
      }),
    ]);

    const linesTotal = lines._sum.amount?.toNumber() ?? 0;
    const paidTotal = payments._sum.amount?.toNumber() ?? 0;
    return { linesTotal, paidTotal, balance: linesTotal - paidTotal };
  }
}
