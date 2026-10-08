import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@pms/db";
import { NotFoundError } from "../errors.js";
import { RateLookup } from "../rates/rate-lookup.js";

const TAG = "t-rate";
const day = (s: string): Date => new Date(`${s}T00:00:00.000Z`);

describe("RateLookup", () => {
  let typeId = "";
  let baseRate = 0;

  beforeAll(async () => {
    await db.ratePlan.deleteMany({ where: { name: { startsWith: TAG } } });
    const room = await db.room.findFirstOrThrow({
      orderBy: { number: "asc" },
    });
    const type = await db.roomType.findUniqueOrThrow({
      where: { id: room.typeId },
    });
    typeId = type.id;
    baseRate = type.baseRate.toNumber();
    await db.ratePlan.create({
      data: {
        typeId,
        name: TAG,
        startDate: day("2035-06-01"),
        endDate: day("2035-07-01"),
        price: 888001,
      },
    });
  });

  afterAll(async () => {
    await db.ratePlan.deleteMany({ where: { name: { startsWith: TAG } } });
    await db.$disconnect();
  });

  it("AC-4 returns the plan price inside its date range", async () => {
    const price = await new RateLookup(db).forDate(
      typeId,
      day("2035-06-10"),
    );
    expect(price).toBe(888001);
  });

  it("AC-4 falls back to baseRate outside every range", async () => {
    const price = await new RateLookup(db).forDate(
      typeId,
      day("2035-08-10"),
    );
    expect(price).toBe(baseRate);
  });

  it("treats the plan end date as exclusive", async () => {
    const price = await new RateLookup(db).forDate(
      typeId,
      day("2035-07-01"),
    );
    expect(price).toBe(baseRate);
  });

  it("AC-4 prefers the latest starting plan when ranges overlap", async () => {
    await db.ratePlan.create({
      data: {
        typeId,
        name: `${TAG}-later`,
        startDate: day("2035-06-15"),
        endDate: day("2035-08-01"),
        price: 777002,
      },
    });
    try {
      const price = await new RateLookup(db).forDate(
        typeId,
        day("2035-06-20"),
      );
      expect(price).toBe(777002);
    } finally {
      await db.ratePlan.deleteMany({
        where: { name: `${TAG}-later` },
      });
    }
  });

  it("ignores a time part on the same UTC day", async () => {
    const price = await new RateLookup(db).forDate(
      typeId,
      new Date("2035-06-10T15:30:00.000Z"),
    );
    expect(price).toBe(888001);
  });

  it("throws NotFoundError for a missing room type", async () => {
    await expect(
      new RateLookup(db).forDate("no-such-type", day("2035-06-10")),
    ).rejects.toThrow(NotFoundError);
  });
});
