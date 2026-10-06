-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('CLEAN', 'DIRTY', 'OUT_OF_ORDER');

-- CreateTable
CREATE TABLE "RoomType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sizeM2" DOUBLE PRECISION NOT NULL,
    "bedSetup" TEXT NOT NULL,
    "bathSetup" TEXT NOT NULL,
    "baseRate" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "RoomType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'CLEAN',
    "typeId" TEXT NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoomType_code_key" ON "RoomType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Room_number_key" ON "Room"("number");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
