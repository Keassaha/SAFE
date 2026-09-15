/**
 * SAFE — Ce que l'écran d'entrée d'un client a besoin de savoir.
 *
 * Une seule lecture, faite côté serveur, pour les trois panneaux de droite :
 * l'avancement, le contrôle du fidéicommis, et de quoi annoncer honnêtement
 * l'étendue de la recherche de conflits.
 *
 * Les calculs eux-mêmes vivent dans `lib/clients/entree-client.ts`. Ce fichier
 * ne fait que rassembler les chiffres et les lui passer.
 */

import { prisma } from "@/lib/db";
import {
  ecartFideicommis,
  progressionEntree,
  type EcartFideicommis,
  type ProgressionEntree,
} from "@/lib/clients/entree-client";

export interface ContexteEntree {
  progression: ProgressionEntree;
  fideicommis: EcartFideicommis & {
    /** Nombre de clients pour lesquels un solde a été déclaré. */
    clientsAvecFonds: number;
    /** Période du rapprochement d'où vient le solde bancaire, ex. « 2026-08 ». */
    periodeReleve: string | null;
  };
  /** Étendue de la recherche de conflits, telle qu'elle sera annoncée au cabinet. */
  recherche: { clients: number; parties: number };
}

export async function chargerContexteEntree(cabinetId: string): Promise<ContexteEntree> {
  const [cabinet, entres, misDeCote, soldesClients, dernierRapprochement, nbClients, nbParties] =
    await Promise.all([
      prisma.cabinet.findUnique({
        where: { id: cabinetId },
        select: { objectifEntreeClients: true },
      }),
      prisma.client.count({ where: { cabinetId, entreeCompleteeAt: { not: null } } }),
      prisma.client.count({
        where: { cabinetId, entreeCommenceeAt: { not: null }, entreeCompleteeAt: null },
      }),

      /* Les soldes déclarés à l'entrée, et EUX SEULS.
       *
       * On ne somme pas le solde courant des comptes-clients : un cabinet déjà
       * en service a des mouvements postérieurs à la reprise, et les mêler aux
       * soldes d'ouverture ferait comparer des choux et des carottes avec le
       * relevé du jour de l'arrivée. Le drapeau `estSoldeOuverture` existe
       * précisément pour que cette distinction soit possible. */
      prisma.trustTransaction.findMany({
        where: { cabinetId, estSoldeOuverture: true },
        select: { amount: true },
      }),

      /* Le solde du relevé vient du dernier rapprochement bancaire saisi. Tant
       * qu'il n'y en a aucun, on additionne sans conclure : annoncer un écart
       * contre un relevé imaginaire serait pire que ne rien annoncer. */
      prisma.trustReconciliation.findFirst({
        where: { cabinetId },
        orderBy: { periode: "desc" },
        select: { soldeBancaire: true, periode: true },
      }),

      prisma.client.count({ where: { cabinetId, status: { not: "archive" } } }),
      prisma.dossierPartie.count({ where: { cabinetId, nature: "partie_externe" } }),
    ]);

  const declares = soldesClients.map((s) => s.amount);

  return {
    progression: progressionEntree({
      entres,
      misDeCote,
      objectif: cabinet?.objectifEntreeClients ?? null,
    }),
    fideicommis: {
      ...ecartFideicommis({
        declares,
        soldeReleve: dernierRapprochement?.soldeBancaire ?? null,
      }),
      clientsAvecFonds: declares.length,
      periodeReleve: dernierRapprochement?.periode ?? null,
    },
    recherche: { clients: nbClients, parties: nbParties },
  };
}
