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
import { parseDossierTaxonomy, localizedLabel, type DossierTaxonomy } from "./taxonomy";
import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

type TaxonomyOption = { value: string; label: string };

/**
 * Options Sujet/Sous-matière localisées, prêtes pour les formulaires de dossier.
 * `undefined` (et non `[]`) quand le cabinet n'a pas de taxonomie → le formulaire
 * retombe sur les types génériques + numérotation legacy.
 */
export interface DossierTaxonomyOptions {
  subjectOptions?: TaxonomyOption[];
  submatterOptions?: Record<string, TaxonomyOption[]>;
}

/** Dérivation pure taxonomie → options localisées (source unique, testable). */
export function deriveTaxonomyOptions(
  taxonomy: DossierTaxonomy | null,
  locale: string,
): DossierTaxonomyOptions {
  if (!taxonomy) return {};
  return {
    subjectOptions: taxonomy.subjects.map((s) => ({
      value: s.code,
      label: localizedLabel(s, locale),
    })),
    submatterOptions: Object.fromEntries(
      Object.entries(taxonomy.submatters).map(([code, list]) => [
        code,
        list.map((m) => ({ value: localizedLabel(m, locale), label: localizedLabel(m, locale) })),
      ]),
    ),
  };
}

/**
 * Charge la taxonomie du cabinet et retourne les options localisées prêtes pour
 * les formulaires. À utiliser par TOUS les points d'entrée de création de dossier
 * (page complète ET modal) pour garantir un rendu identique.
 */
export async function getCabinetDossierTaxonomyOptions(
  cabinetId: string,
  locale: string,
  client: DbClient = prisma,
): Promise<DossierTaxonomyOptions> {
  const taxonomy = await getCabinetDossierTaxonomyById(cabinetId, client);
  return deriveTaxonomyOptions(taxonomy, locale);
}

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
