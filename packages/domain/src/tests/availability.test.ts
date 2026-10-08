import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AvailabilityReader } from "../reservations/availability.js";
import { db } from "@pms/db";
import { ValidationError } from "../errors.js";
import { ReservationBooker } from "../reservations/reservations.js";
import { RoomStatusFlipper } from "../rooms/room-status.js";

const TAG = "t-avail";
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
  await db.reservation.deleteMany({
    where: { guest: { name: TAG } },
  });
  await db.guest.deleteMany({ where: { name: TAG } });
  await db.statusLog.deleteMany({ where: { staffId: TAG } });
}

describe("AvailabilityReader", () => {
  let roomId = "";
  let freedRoomId = "";

  beforeAll(async () => {
    await clearTagRows();
    const rooms = await db.room.findMany({
      orderBy: { number: "asc" },
      take: 2,
    });
    roomId = rooms[1]?.id ?? "";
    freedRoomId = rooms[0]?.id ?? "";
    const guest = await db.guest.create({ data: { name: TAG } });
    await new ReservationBooker(db).book({
      guestId: guest.id,
      roomId,
      checkIn: day("2033-05-10"),
      checkOut: day("2033-05-12"),
      staffId: TAG,
    });
    await db.reservation.create({
      data: {
        guestId: guest.id,
        roomId: freedRoomId,
        checkIn: day("2033-06-10"),
        checkOut: day("2033-06-12"),
        state: "CANCELLED",
      },
    });
  });

  afterAll(async () => {
    await clearTagRows();
    await db.$disconnect();
  });

  it("AC-3 hides the booked room over booked dates", async () => {
    const free = await new AvailabilityReader(db).freeRooms(
      day("2033-05-11"),
      day("2033-05-12"),
    );

    expect(free.some((room) => room.id === roomId)).toBe(false);
  });

  it("AC-3 shows the room again starting on the checkout day", async () => {
    const free = await new AvailabilityReader(db).freeRooms(
      day("2033-05-12"),
      day("2033-05-13"),
    );

    expect(free.some((room) => room.id === roomId)).toBe(true);
  });

  it("AC-3 keeps a room with only cancelled stays in the free list", async () => {
    const free = await new AvailabilityReader(db).freeRooms(
      day("2033-06-10"),
      day("2033-06-12"),
    );
    expect(free.some((room) => room.id === freedRoomId)).toBe(true);
  });

  it("AC-7 hides DIRTY rooms even with no clash", async () => {
    const flipper = new RoomStatusFlipper(db);
    await flipper.flip(freedRoomId, "DIRTY", TAG);
    try {
      const free = await new AvailabilityReader(db).freeRooms(
        day("2033-06-10"),
        day("2033-06-12"),
      );
      expect(free.some((room) => room.id === freedRoomId)).toBe(false);
    } finally {
      await flipper.flip(freedRoomId, "CLEAN", TAG);
    }
  });

  it("AC-7 returns full rows carrying their type", async () => {
    const free = await new AvailabilityReader(db).freeRooms(
      day("2033-05-12"),
      day("2033-05-13"),
    );
    expect(free.length).toBeGreaterThan(0);
    expect(free[0]?.type.code).toBeDefined();
  });

  it("rejects a checkout that does not fall after checkin", async () => {
    await expect(
      new AvailabilityReader(db).freeRooms(
        day("2033-05-12"),
        day("2033-05-12"),
      ),
    ).rejects.toThrow(ValidationError);
  });
});
