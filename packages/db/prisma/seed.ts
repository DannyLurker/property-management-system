import { db } from "../src/client";

const types = [
  { code: "MOD", name: "Moderate Room", sizeM2: 15, bedSetup: "1 Queen Bed", bathSetup: "Entry Level", baseRate: 450000, count: 20, floor: 1, prefix: "1" },
  { code: "SUP-D", name: "Superior Double", sizeM2: 20, bedSetup: "1 Queen/Double Bed", bathSetup: "Standing Shower", baseRate: 550000, count: 40, floor: 2, prefix: "2" },
  { code: "SUP-T", name: "Superior Twin", sizeM2: 20, bedSetup: "2 Single Beds", bathSetup: "Standing Shower", baseRate: 550000, count: 35, floor: 3, prefix: "3" },
  { code: "DLX", name: "Deluxe Room", sizeM2: 24, bedSetup: "1 King Bed", bathSetup: "Bathtub", baseRate: 750000, count: 15, floor: 4, prefix: "4" },
  { code: "JSU", name: "Junior Suite", sizeM2: 38, bedSetup: "1 King Bed, Living Room", bathSetup: "Jacuzzi", baseRate: 1200000, count: 5, floor: 5, prefix: "5" },
  { code: "BIZ", name: "BIZ Suite", sizeM2: 49.5, bedSetup: "1 King Bed, Living Room, Kitchen", bathSetup: "Jacuzzi", baseRate: 2000000, count: 2, floor: 6, prefix: "6" },
] as const;

async function main() {
  for (const t of types) {
    const roomType = await db.roomType.upsert({
      where: { code: t.code },
      update: { name: t.name, sizeM2: t.sizeM2, bedSetup: t.bedSetup, bathSetup: t.bathSetup, baseRate: t.baseRate },
      create: { code: t.code, name: t.name, sizeM2: t.sizeM2, bedSetup: t.bedSetup, bathSetup: t.bathSetup, baseRate: t.baseRate },
    });
    for (let i = 1; i <= t.count; i += 1) {
      const number = `${t.prefix}${String(i).padStart(2, "0")}`;
      await db.room.upsert({
        where: { number },
        update: { typeId: roomType.id },
        create: { number, floor: t.floor, typeId: roomType.id },
      });
    }
  }
  const rooms = await db.room.count();
  console.log(`Seeded ${rooms} rooms.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
