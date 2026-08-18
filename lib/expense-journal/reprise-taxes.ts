/**
 * SAFE — Reprise de la taxe des dépenses déjà saisies.
 *
 * Spec : docs/accounting/SPEC_DEPENSES_ET_PREPARATION_FISCALE.md §6, arbitrage CEO n° 4.
 * Moteur : lib/expense-journal/tax-decomposition.ts (lot 1).
 *
 * POURQUOI
 *
 * Le lot 1 décompose la taxe à la création. Les dépenses saisies AVANT lui portent
 * `taxOrigin = NULL` et ne comptent nulle part : ni dans la taxe récupérable, ni
 * dans la liste des taxes à confirmer. Sans reprise, le premier dossier de fin
 * d'année n'a aucune valeur, et le cabinet continue de remettre trop.
 *
 * LA GARANTIE QUI COMPTE
 *
 * Une ligne reprise est marquée ESTIMEE, jamais DECLAREE. La reprise répare le
 * chiffre sans jamais prétendre l'avoir lu sur un reçu. C'est ce qui la rend
 * honnête : elle rend les états justes et laisse la ligne dans la file de
 * confirmation, là où le cabinet décidera avec sa pièce en main.
 *
 * Cette garantie n'est pas déclarative : elle découle du fait qu'aucune valeur
 * déclarée n'est passée au décompteur. Un test la verrouille malgré tout.
 *
 * CE QUE LA REPRISE NE TOUCHE PAS
 *
 * Le montant. Le journal général inscrit `expense.montant`, que la reprise laisse
 * intact : seule la ventilation HT/taxe change. Aucune écriture n'est donc à
 * contrepasser, et la boucle de correction du 2026-08-17 n'a pas à être sollicitée.
 *
 * IDEMPOTENCE
 *
 * Seules les lignes à `taxOrigin = NULL` sont examinées. Relancer la reprise ne
 * retouche donc jamais une ligne déjà traitée, ni une ligne confirmée à la main.
 */

import type { PrismaClient } from "@prisma/client";
import type { CabinetTaxConfig } from "@/lib/billing/types";
import { prisma as defaultPrisma } from "@/lib/db";
import { getCabinetTaxConfigById } from "@/lib/billing/cabinet-tax-config";
import { decomposeExpenseTax } from "./tax-decomposition";

export interface RepriseResume {
  /** Lignes sans origine trouvées. */
  examinees: number;
  /** Lignes qui reçoivent une taxe estimée. */
  estimees: number;
  /** Lignes dont la catégorie ne porte structurellement aucune taxe. */
  sansTaxe: number;
  /** Somme des taxes estimées, en dollars. Ce qui entre dans la file à confirmer. */
  taxeEstimee: number;
}

const VIDE: RepriseResume = { examinees: 0, sansTaxe: 0, estimees: 0, taxeEstimee: 0 };

/** Une ligne telle que la reprise a besoin de la voir. */
export interface LigneAReprendre {
  id: string;
  montant: number;
  categoryCode: string | null;
}

export interface PlanLigne {
  id: string;
  montantHt: number;
  tps: number;
  tvq: number;
  origine: "ESTIMEE" | "AUCUNE";
}

/**
 * Calcule le plan de reprise. Fonction PURE : c'est ici que vivent les garanties,
 * et c'est ici qu'on les teste, sans base.
 */
export function planifierReprise(
  lignes: ReadonlyArray<LigneAReprendre>,
  taxConfig: CabinetTaxConfig,
): { plan: PlanLigne[]; resume: RepriseResume } {
  const plan: PlanLigne[] = [];
  const resume: RepriseResume = { ...VIDE, examinees: lignes.length };

  for (const l of lignes) {
    // Aucune valeur déclarée n'est passée : le décompteur ne PEUT donc pas
    // renvoyer DECLAREE. C'est la garantie centrale de la reprise.
    const t = decomposeExpenseTax({
      montantTtc: l.montant,
      categoryCode: l.categoryCode,
      taxConfig,
    });

    if (t.origine === "DECLAREE") {
      // Inatteignable par construction. Si ça arrive un jour, c'est que le
      // décompteur a changé de contrat : mieux vaut refuser la ligne que de
      // fabriquer une taxe réclamable qu'aucune pièce ne soutient.
      throw new Error(
        `Reprise refusée sur ${l.id} : une reprise ne peut pas produire une taxe déclarée.`,
      );
    }

    if (t.origine === "ESTIMEE") {
      resume.estimees += 1;
      resume.taxeEstimee += t.tps + t.tvq;
    } else {
      resume.sansTaxe += 1;
    }

    plan.push({
      id: l.id,
      montantHt: t.montantHt,
      tps: t.tps,
      tvq: t.tvq,
      origine: t.origine,
    });
  }

  resume.taxeEstimee = Math.round((resume.taxeEstimee + Number.EPSILON) * 100) / 100;
  return { plan, resume };
}

/**
 * Reprend les dépenses sans origine de taxe d'un cabinet.
 *
 * `simulation` calcule et rend le résumé sans rien écrire. À utiliser pour montrer
 * au cabinet ce qui va changer AVANT qu'il l'accepte : une reprise en masse qui
 * s'exécute sans qu'on ait vu son ampleur est exactement ce qu'un cabinet ne peut
 * pas défendre en vérification.
 */
export async function reprendreTaxesHistoriques(params: {
  cabinetId: string;
  simulation?: boolean;
  client?: PrismaClient;
}): Promise<RepriseResume> {
  const { cabinetId, simulation = false } = params;
  const prisma = params.client ?? defaultPrisma;

  const brutes = await prisma.cabinetExpense.findMany({
    where: { cabinetId, taxOrigin: null, typeTransaction: "DEPENSE" },
    select: { id: true, montant: true, category: { select: { code: true } } },
  });
  if (brutes.length === 0) return { ...VIDE };

  const taxConfig = await getCabinetTaxConfigById(cabinetId);
  const { plan, resume } = planifierReprise(
    brutes.map((b) => ({ id: b.id, montant: b.montant, categoryCode: b.category?.code ?? null })),
    taxConfig,
  );

  if (simulation) return resume;

  // Écriture ligne par ligne, sans transaction globale : la reprise peut porter sur
  // des milliers de lignes, et une transaction unique tiendrait un verrou trop
  // longtemps sur une table que le cabinet utilise. L'opération est idempotente,
  // donc une interruption se rattrape en relançant.
  for (const p of plan) {
    await prisma.cabinetExpense.update({
      where: { id: p.id },
      data: {
        montantHt: p.montantHt,
        tps: p.tps,
        tvq: p.tvq,
        montantTtc: undefined,
        taxOrigin: p.origine,
      },
    });
  }

  return resume;
}
