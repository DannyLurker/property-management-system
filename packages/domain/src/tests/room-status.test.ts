import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { RoomStatus } from "@pms/db";
import { db } from "@pms/db";
import { NotFoundError, ValidationError } from "../errors.js";
import { RoomStatusFlipper } from "../rooms/room-status.js";

const TAG = "t-flip";

async function resetToClean(id: string): Promise<void> {
  const flipper = new RoomStatusFlipper(db);
  const room = await db.room.findUniqueOrThrow({ where: { id } });
  if (room.status === "OUT_OF_ORDER") {
    await flipper.flip(id, "DIRTY", TAG);
  }
  const current = await db.room.findUniqueOrThrow({ where: { id } });
  if (current.status !== "CLEAN") {
    await flipper.flip(id, "CLEAN", TAG);
  }
}

describe("RoomStatusFlipper", () => {
  let roomId = "";
  let home: RoomStatus = "CLEAN";

  beforeAll(async () => {
    await db.statusLog.deleteMany({ where: { staffId: TAG } });
    const rooms = await db.room.findMany({
      orderBy: { number: "asc" },
      take: 4,
    });
    const room = rooms[3];
    if (!room) {
      throw new Error("seed rooms are missing");
    }
    roomId = room.id;
    await resetToClean(roomId);
    home = "CLEAN";
  });

  afterAll(async () => {
    await db.statusLog.deleteMany({ where: { staffId: TAG } });
    await db.$disconnect();
  });

  it("AC-6 writes the room row plus one log row together", async () => {
    const target = home === "DIRTY" ? "CLEAN" : "DIRTY";
    const result = await new RoomStatusFlipper(db).flip(
      roomId,
      target,
      TAG,
    );
    expect(result.room.status).toBe(target);
    expect(result.log.roomId).toBe(roomId);
    expect(result.log.fromStatus).toBe(home);
    expect(result.log.toStatus).toBe(target);
    expect(result.log.staffId).toBe(TAG);

    const restored = await new RoomStatusFlipper(db).flip(
      roomId,
      home,
      TAG,
    );
    expect(restored.room.status).toBe(home);
  });

  it("AC-8 rejects moves outside the transition map", async () => {
    await new RoomStatusFlipper(db).flip(roomId, "DIRTY", TAG);
    try {
      await expect(
        new RoomStatusFlipper(db).flip(roomId, "INSPECTED", TAG),
      ).rejects.toThrow("cannot move from DIRTY to INSPECTED");
    } finally {
      await resetToClean(roomId);
    }
  });

  it("AC-8 records the performing actor on a supervisor flip", async () => {
    const result = await new RoomStatusFlipper(db).flip(
      roomId,
      "OUT_OF_ORDER",
      TAG,
    );
    try {
      expect(result.log.staffId).toBe(TAG);
      expect(result.log.fromStatus).toBe("CLEAN");
      expect(result.log.toStatus).toBe("OUT_OF_ORDER");
    } finally {
      await resetToClean(roomId);
    }
  });

  it("rejects a flip to the status the room already carries", async () => {
    await expect(
      new RoomStatusFlipper(db).flip(roomId, home, TAG),
    ).rejects.toThrow(ValidationError);
  });

  it("rejects a flip with a blank staff id", async () => {
    const target = home === "DIRTY" ? "CLEAN" : "DIRTY";
    await expect(
      new RoomStatusFlipper(db).flip(roomId, target, "  "),
    ).rejects.toThrow(ValidationError);
  });

  it("throws NotFoundError for a missing room", async () => {
    await expect(
      new RoomStatusFlipper(db).flip("no-such-room", "DIRTY", TAG),
    ).rejects.toThrow(NotFoundError);
  });
});
