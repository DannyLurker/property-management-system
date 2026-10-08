import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@pms/db";
import { NotFoundError } from "../errors.js";
import { FolioBalanceReader } from "../folio/folio-balance.js";

const TAG = "t-folio";
const day = (s: string): Date => new Date(`${s}T00:00:00.000Z`);

async function clearTagRows(): Promise<void> {
  const folios = await db.folio.findMany({
    where: { reservation: { guest: { name: TAG } } },
    select: { id: true },
  });
  for (const folio of folios) {
    await db.payment.deleteMany({ where: { folioId: folio.id } });
    await db.folioLine.deleteMany({ where: { folioId: folio.id } });
    await db.folio.delete({ where: { id: folio.id } });
  }
  await db.reservation.deleteMany({ where: { guest: { name: TAG } } });
  await db.guest.deleteMany({ where: { name: TAG } });
}

describe("FolioBalanceReader", () => {
  let folioId = "";

  beforeAll(async () => {
    await clearTagRows();
    const guest = await db.guest.create({ data: { name: TAG } });
    const room = await db.room.findFirstOrThrow({
      orderBy: { number: "asc" },
    });
    const stay = await db.reservation.create({
      data: {
        guestId: guest.id,
        roomId: room.id,
        checkIn: day("2032-04-10"),
        checkOut: day("2032-04-12"),
        folio: { create: {} },
      },
      include: { folio: true },
    });
    folioId = stay.folio?.id ?? "";
    await db.folioLine.createMany({
      data: [
        {
          folioId,
          date: day("2032-04-10"),
          source: "ROOM",
          label: "Room night",
          amount: 500000,
        },
        {
          folioId,
          date: day("2032-04-11"),
          source: "ROOM",
          label: "Room night",
          amount: 500000,
        },
        {
          folioId,
          date: day("2032-04-11"),
          source: "MANUAL",
          label: "Refund",
          amount: -50000,
        },
      ],
    });
    await db.payment.create({
      data: {
        folioId,
        method: "CASH",
        state: "PAID",
        amount: 400000,
        paidAt: new Date(),
      },
    });
    await db.payment.create({
      data: {
        folioId,
        method: "QRIS",
        state: "PENDING",
        amount: 999999,
      },
    });
  });

  afterAll(async () => {
    await clearTagRows();
    await db.$disconnect();
  });

  it("AC-2 totals signed lines minus paid payments at read time", async () => {
    const result = await new FolioBalanceReader(db).read(folioId);
    expect(result.linesTotal).toBe(950000);
    expect(result.paidTotal).toBe(400000);
    expect(result.balance).toBe(550000);
  });

  it("throws NotFoundError for a missing folio", async () => {
    await expect(
      new FolioBalanceReader(db).read("no-such-folio"),
    ).rejects.toThrow(NotFoundError);
  });
});
