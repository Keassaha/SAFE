// Vercel / Supabase : variables injectées (POSTGRES_*) et alias vers DATABASE_URL / DIRECT_URL
if (typeof process !== "undefined") {
  if (!process.env.DATABASE_URL?.trim()) {
    const url = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
    if (url) process.env.DATABASE_URL = url;
  }
  // Prisma exige une DIRECT_URL non vide si définie dans schema ; une ligne DIRECT_URL= vide dans .env casse tout
  if (!process.env.DIRECT_URL?.trim()) {
    const direct =
      process.env.POSTGRES_URL_NON_POOLING?.trim() ||
      process.env.SUPABASE_DB_URL?.trim() ||
      process.env.DATABASE_URL?.trim();
    if (direct) process.env.DIRECT_URL = direct;
  }
}

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
