/**
 * Étape 4 de « Reprendre un client » : ce qui est MAINTENANT dans SAFE pour ce
 * mandat. Lu en base, jamais recalculé depuis l'écran : le récapitulatif doit
 * dire ce qui a été écrit, pas ce qu'on a cru écrire.
 *
 * Il ne compte que les pièces reprises (`estReprise`). Sur un mandat existant
 * qui a déjà une vie dans SAFE, ses factures ordinaires ne se mêlent pas au
 * bilan de la reprise.
 */

import { prisma } from "@/lib/db";
import { nomDuClient } from "@/lib/services/reprise-un-client/contexte";

export interface FactureRecap {
  id: string;
  numero: string;
  dateEmission: string;
  heures: number;
  total: number;
  encaisse: number;
  resteDu: number;
  statut: "payee" | "partielle" | "impayee";
  mode: string | null;
}

export interface RecapitulatifMandat {
  client: { id: string; nom: string; identiteVerifiee: boolean };
  mandat: { id: string; intitule: string; tauxHoraire: number | null };
  factures: FactureRecap[];
  totaux: {
    facture: number;
    encaisse: number;
    resteDu: number;
    heures: number;
    forfaits: number;
    debours: number;
    ecritures: number;
  };
  periode: { debut: string | null; fin: string | null };
  /** Solde déclaré ou mouvementé en fidéicommis pour ce mandat ; `null` si aucun mouvement. */
  fideicommis: number | null;
}

const auSou = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export async function chargerRecapitulatif(
  cabinetId: string,
  dossierId: string,
): Promise<RecapitulatifMandat | null> {
  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId },
    select: {
      id: true,
      intitule: true,
      tauxHoraire: true,
      client: { select: { id: true, raisonSociale: true, prenom: true, nom: true, identityVerified: true } },
    },
  });
  if (!dossier?.client) return null;

  const factures = await prisma.invoice.findMany({
    where: { cabinetId, dossierId, estReprise: true },
    select: {
      id: true,
      numero: true,
      dateEmission: true,
      montantTotal: true,
      montantPaye: true,
      balanceDue: true,
      payments: { select: { id: true, paymentMethod: true }, take: 1 },
      invoiceLines: { select: { id: true } },
    },
    orderBy: { dateEmission: "asc" },
  });

  const idsFactures = factures.map((f) => f.id);
  const idsLignes = factures.flatMap((f) => f.invoiceLines.map((l) => l.id));
  const idsPaiements = factures.flatMap((f) => f.payments.map((p) => p.id));

  const [temps, forfaits, debours] = await Promise.all([
    prisma.timeEntry.groupBy({
      by: ["invoiceId"],
      where: { cabinetId, invoiceId: { in: idsFactures } },
      _sum: { dureeMinutes: true },
    }),
    prisma.registreTache.count({ where: { cabinetId, invoiceLineId: { in: idsLignes } } }),
    prisma.deboursDossier.findMany({ where: { cabinetId, factureId: { in: idsFactures } }, select: { id: true } }),
  ]);

  // Les écritures se reconnaissent à leur pièce source : la facture, son
  // paiement, ses débours. Une écriture de correction porte un suffixe de
  // version (`#v2`), d'où la comparaison par préfixe.
  const sources = [...idsFactures, ...idsPaiements, ...debours.map((d) => d.id)];
  const ecritures =
    sources.length === 0
      ? 0
      : await prisma.journalGeneralEntry.count({
          where: { cabinetId, OR: sources.map((id) => ({ sourceId: { startsWith: id } })) },
        });

  // Le solde vient du compte de fidéicommis du dossier, qui le tient à jour à
  // chaque mouvement : le recalculer ici depuis les mouvements serait fragile
  // (une correction peut être positive ou négative).
  const [compteFiducie, mouvementsFiducie] = await Promise.all([
    prisma.trustAccount.findFirst({ where: { cabinetId, matterId: dossierId }, select: { currentBalance: true } }),
    prisma.trustTransaction.count({ where: { cabinetId, dossierId } }),
  ]);
  const fideicommis = mouvementsFiducie > 0 ? auSou(compteFiducie?.currentBalance ?? 0) : null;

  const minutesParFacture = new Map(temps.map((t) => [t.invoiceId, t._sum.dureeMinutes ?? 0]));

  const lignes: FactureRecap[] = factures.map((f) => {
    const encaisse = auSou(f.montantPaye ?? 0);
    const total = auSou(f.montantTotal ?? 0);
    const reste = auSou(Math.max(0, total - encaisse));
    return {
      id: f.id,
      numero: f.numero,
      dateEmission: f.dateEmission.toISOString().slice(0, 10),
      heures: auSou((minutesParFacture.get(f.id) ?? 0) / 60),
      total,
      encaisse,
      resteDu: reste,
      statut: encaisse <= 0 ? "impayee" : reste > 0 ? "partielle" : "payee",
      mode: f.payments[0]?.paymentMethod ? String(f.payments[0].paymentMethod) : null,
    };
  });

  const somme = (cle: "total" | "encaisse" | "resteDu" | "heures") =>
    auSou(lignes.reduce((s, l) => s + l[cle], 0));

  return {
    client: {
      id: dossier.client.id,
      nom: nomDuClient(dossier.client),
      identiteVerifiee: Boolean(dossier.client.identityVerified),
    },
    mandat: { id: dossier.id, intitule: dossier.intitule, tauxHoraire: dossier.tauxHoraire ?? null },
    factures: lignes,
    totaux: {
      facture: somme("total"),
      encaisse: somme("encaisse"),
      resteDu: somme("resteDu"),
      heures: somme("heures"),
      forfaits,
      debours: debours.length,
      ecritures,
    },
    periode: {
      debut: lignes[0]?.dateEmission ?? null,
      fin: lignes[lignes.length - 1]?.dateEmission ?? null,
    },
    fideicommis,
  };
}
