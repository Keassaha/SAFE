// Vercel Postgres injecte souvent POSTGRES_URL ou POSTGRES_PRISMA_URL
if (typeof process !== "undefined" && !process.env.DATABASE_URL?.trim()) {
  const url = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
  if (url) process.env.DATABASE_URL = url;
}

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
