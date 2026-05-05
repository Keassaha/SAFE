import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Formate un numéro de facture (format ANNEE-XXX).
 * Utilisé pour les tests unitaires et par getNextInvoiceNumero.
 */
export function formatInvoiceNumero(year: number, sequence: number): string {
  return `${year}-${String(sequence).padStart(3, "0")}`;
}

/**
 * Génère le prochain numéro de facture pour le cabinet (format ANNEE-XXX).
 *
 * Concurrence : si un `client` Prisma de transaction est fourni, acquiert un
 * advisory lock Postgres `pg_advisory_xact_lock` sur `(cabinetId, year)`.
 * Le verrou tient jusqu'au commit/rollback de la transaction parente — il
 * englobe donc count() ET le `invoice.create()` qui suit côté caller. Deux
 * transactions concurrentes générant un numéro pour le même cabinet/année
 * se sérialisent automatiquement.
 *
 * Sans client (mode legacy / appel hors transaction) : pas de lock — la
 * contrainte unique `@@unique([cabinetId, numero])` reste le filet de
 * sécurité de dernier recours (collision → P2002 côté caller).
 */
export async function getNextInvoiceNumero(
  cabinetId: string,
  client: DbClient = prisma,
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  // Lock advisory : sérialise les générations de numéro pour ce cabinet/année.
  // `client === prisma` signifie qu'on n'est pas dans une transaction parente —
  // un advisory_xact_lock serait libéré immédiatement, donc inutile. On compte
  // dans ce cas la contrainte unique pour empêcher la collision.
  if (client !== prisma) {
    await client.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`invoice-numero:${cabinetId}:${year}`}))`;
  }

  const count = await client.invoice.count({
    where: {
      cabinetId,
      dateEmission: { gte: yearStart, lt: yearEnd },
    },
  });

  const sequence = count + 1;
  return formatInvoiceNumero(year, sequence);
}
