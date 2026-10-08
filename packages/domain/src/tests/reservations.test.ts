import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@pms/db";
import { ConflictError, NotFoundError, ValidationError } from "../errors.js";
import { ReservationBooker } from "../reservations/reservations.js";
import { RoomStatusFlipper } from "../rooms/room-status.js";

const TAG = "t-book";
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

describe("ReservationBooker", () => {
  let guestId = "";
  let roomId = "";

  beforeAll(async () => {
    await clearTagRows();
    const guest = await db.guest.create({ data: { name: TAG } });
    guestId = guest.id;
    const rooms = await db.room.findMany({
      orderBy: { number: "asc" },
      take: 3,
    });
    roomId = rooms[2]?.id ?? "";
  });

  afterAll(async () => {
    await clearTagRows();
    await db.$disconnect();
  });

  it("AC-3 books a stay with its folio in one transaction", async () => {
    const stay = await new ReservationBooker(db).book({
      guestId,
      roomId,
      checkIn: day("2034-06-10"),
      checkOut: day("2034-06-12"),
      source: "WALK_IN",
      staffId: TAG,
    });
    expect(stay.state).toBe("RESERVED");
    const folio = await db.folio.findUnique({
      where: { reservationId: stay.id },
    });
    expect(folio).not.toBeNull();
  });

  it("AC-3 rejects dates that clash with an active stay", async () => {
    await expect(
      new ReservationBooker(db).book({
        guestId,
        roomId,
        checkIn: day("2034-06-11"),
        checkOut: day("2034-06-13"),
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("AC-3 lets exactly one of two simultaneous bookings win", async () => {
    const rooms = await db.room.findMany({
      orderBy: { number: "desc" },
      take: 2,
    });
    const room = rooms[1];
    if (!room) {
      throw new Error("seed rooms are missing");
    }
    const booker = new ReservationBooker(db);
    const attempt = (suffix: string): Promise<unknown> =>
      booker.book({
        guestId,
        roomId: room.id,
        checkIn: day("2034-09-10"),
        checkOut: day("2034-09-12"),
        staffId: `${TAG}-${suffix}`,
      });
    const [first, second] = await Promise.allSettled([
      attempt("a"),
      attempt("b"),
    ]);
    const won = [first, second].filter(
      (outcome) => outcome.status === "fulfilled",
    );
    const lost = [first, second].filter(
      (outcome) => outcome.status === "rejected",
    );

    expect(won).toHaveLength(1);
    expect(lost).toHaveLength(1);
    expect((lost[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      ConflictError,
    );
  });

  it("allows the same dates once the old stay is cancelled", async () => {
    const room = await db.room.findFirstOrThrow({
      orderBy: { number: "desc" },
    });
    await db.reservation.create({
      data: {
        guestId,
        roomId: room.id,
        checkIn: day("2034-07-10"),
        checkOut: day("2034-07-12"),
        state: "CANCELLED",
      },
    });
    const stay = await new ReservationBooker(db).book({
      guestId,
      roomId: room.id,
      checkIn: day("2034-07-10"),
      checkOut: day("2034-07-12"),
    });
    expect(stay.state).toBe("RESERVED");
  });

  it("AC-7 rejects booking a room that is not sellable", async () => {
    const rooms = await db.room.findMany({
      orderBy: { number: "asc" },
      skip: 3,
      take: 1,
    });
    const room = rooms[0];
    if (!room) {
      throw new Error("seed rooms are missing");
    }
    const flipper = new RoomStatusFlipper(db);
    await flipper.flip(room.id, "OUT_OF_ORDER", TAG);
    try {
      await expect(
        new ReservationBooker(db).book({
          guestId,
          roomId: room.id,
          checkIn: day("2034-10-10"),
          checkOut: day("2034-10-12"),
        }),
      ).rejects.toThrow("Room is not sellable");
    } finally {
      await flipper.flip(room.id, "DIRTY", TAG);
      await flipper.flip(room.id, "CLEAN", TAG);
    }
  });

  it("rejects a checkout that does not fall after checkin", async () => {
    await expect(
      new ReservationBooker(db).book({
        guestId,
        roomId,
        checkIn: day("2034-06-12"),
        checkOut: day("2034-06-12"),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws NotFoundError for a missing room or guest", async () => {
    await expect(
      new ReservationBooker(db).book({
        guestId,
        roomId: "no-such-room",
        checkIn: day("2034-08-10"),
        checkOut: day("2034-08-11"),
      }),
    ).rejects.toThrow(NotFoundError);
    await expect(
      new ReservationBooker(db).book({
        guestId: "no-such-guest",
        roomId,
        checkIn: day("2034-08-10"),
        checkOut: day("2034-08-11"),
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
