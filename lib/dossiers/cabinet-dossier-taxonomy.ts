/**
 * Chargement (serveur) de la taxonomie de dossiers d'un cabinet depuis la base.
 *
 * Pont entre Prisma et le module pur `lib/dossiers/taxonomy.ts`. Lit
 * `Cabinet.config.dossierTaxonomy` et retourne `null` si absent/malformé
 * (→ l'appelant retombe sur la numérotation legacy `AAAA-NNN`).
 *
 * Même pattern défensif que `lib/billing/cabinet-tax-config.ts`.
 */
import { prisma } from "@/lib/db";
import { parseDossierTaxonomy, type DossierTaxonomy } from "./taxonomy";
import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function getCabinetDossierTaxonomyById(
  cabinetId: string,
  client: DbClient = prisma,
): Promise<DossierTaxonomy | null> {
  // Défensif : certains clients de transaction (ou mocks de test partiels)
  // n'exposent pas le délégué `cabinet`. On retombe alors sur null (legacy).
  if (!client?.cabinet?.findUnique) return null;

  const cabinet = await client.cabinet.findUnique({
    where: { id: cabinetId },
    select: { config: true },
  });

  let config: unknown = null;
  try {
    config = cabinet?.config ? JSON.parse(cabinet.config) : null;
  } catch {
    config = null;
  }
  return parseDossierTaxonomy(config);
}
