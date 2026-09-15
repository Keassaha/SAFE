/**
 * SAFE — Relance de la recherche de conflits, une fois la reprise faite.
 *
 * Charge tout le monde d'un coup, clients et parties, et laisse le module pur
 * `lib/clients/croisement-conflits.ts` décider des rapprochements.
 *
 * Deux lectures, pas deux mille : l'alternative aurait été d'appeler la
 * recherche ordinaire une fois par client, soit N requêtes pour un résultat
 * identique. À trente clients c'est déjà inutile ; à trois cents, c'est une
 * page qui ne répond plus.
 */

import { prisma } from "@/lib/db";
import { clientDisplayName } from "@/lib/clients/normalize-name";
import {
  cleCroisement,
  croiserConflits,
  compterParGravite,
  type Appariement,
  type EntiteCroisement,
  type GraviteAppariement,
} from "@/lib/clients/croisement-conflits";

export interface ResultatCroisement {
  appariements: Appariement[];
  comptes: Record<GraviteAppariement, number>;
  /** Étendue réellement examinée, pour que le « rien trouvé » veuille dire quelque chose. */
  etendue: { clients: number; parties: number };
}

export async function croiserConflitsDuCabinet(cabinetId: string): Promise<ResultatCroisement> {
  const [clients, parties] = await Promise.all([
    prisma.client.findMany({
      where: { cabinetId, status: { not: "archive" } },
      select: { id: true, typeClient: true, raisonSociale: true, prenom: true, nom: true, email: true },
    }),
    prisma.dossierPartie.findMany({
      where: { cabinetId, nature: "partie_externe" },
      select: {
        id: true,
        role: true,
        nomAffiche: true,
        dossierId: true,
        dossier: { select: { intitule: true, clientId: true } },
      },
    }),
  ]);

  const entites: EntiteCroisement[] = [
    ...clients.map((c) => {
      const libelle = clientDisplayName(c, "");
      return {
        id: c.id,
        nature: "client" as const,
        libelle,
        cle: cleCroisement(libelle),
        email: c.email,
      };
    }),
    ...parties.map((p) => ({
      id: p.id,
      // `tiers` et `partie_adverse` ne pèsent pas pareil : un tiers homonyme
      // est un signal, une partie adverse homonyme est un conflit.
      nature: p.role === "tiers" ? ("tiers" as const) : ("partie_adverse" as const),
      libelle: p.nomAffiche ?? "",
      cle: cleCroisement(p.nomAffiche),
      dossierId: p.dossierId,
      dossierIntitule: p.dossier?.intitule ?? null,
      dossierClientId: p.dossier?.clientId ?? null,
    })),
  ];

  const appariements = croiserConflits(entites);

  return {
    appariements,
    comptes: compterParGravite(appariements),
    etendue: { clients: clients.length, parties: parties.length },
  };
}
