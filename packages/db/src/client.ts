import "dotenv/config";
import { PrismaClient } from "../generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Single instance per process. A new pool per import exhausts connections.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as { db?: PrismaClient };

export const db = globalForPrisma.db ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.db = db;
