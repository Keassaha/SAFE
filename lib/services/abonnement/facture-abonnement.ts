/**
 * SAFE — Émission de la facture d'abonnement d'un cabinet abonné.
 *
 * Le maillon qui manquait. `prolongerAccesApresPaiement` sait repousser
 * l'échéance d'accès quand une facture d'abonnement est payée, et lit pour cela
 * `Invoice.accesMoisCouverts`. Aucun code n'écrivait ce champ : la chaîne
 * attendait une facture que rien ne savait créer, et l'encaissement Interac
 * n'avait aucun point d'entrée dans les livres de SAFE Inc.
 *
 * La facture naît ici, puis passe par `issueInvoice` comme n'importe quelle
 * facture du module : même numérotation séquentielle sous verrou (conformité
 * Barreau, séquence sans trou), même écriture au journal, même piste d'audit.
 * SAFE Inc. se facture avec son propre logiciel (dog food, ADR-006) ; lui
 * fabriquer un chemin parallèle reviendrait à sortir son chiffre d'affaires de
 * ses propres livres, ce qui est précisément le trou qu'on rebouche.
 */

import { prisma } from "@/lib/db";
import { issueInvoice, recalculateInvoiceTotals } from "@/lib/services/billing/invoice-service";
import { makeProvisionalInvoiceNumero } from "@/lib/facturation/numero-facture";
import { ajouterMois } from "@/lib/services/abonnement/acces-paye";

export type RefusEmission =
  | "cabinet_introuvable"
  | "pas_de_fiche_abonne"
  | "montant_absent"
  | "mois_invalide";

export class EmissionFactureAbonnementError extends Error {
  constructor(readonly raison: RefusEmission, message: string) {
    super(message);
    this.name = "EmissionFactureAbonnementError";
  }
}

/**
 * Un encaissement couvre entre un et douze mois.
 *
 * Le plancher écarte le zéro, qui produirait une facture n'ouvrant aucun droit.
 * Le plafond n'est pas une règle commerciale : c'est un garde-fou de saisie.
 * Une faute de frappe qui offrirait huit ans d'accès ne doit pas franchir la
 * porte silencieusement.
 */
export const MOIS_COUVERTS_MAX = 12;

export function validerMoisCouverts(valeur: unknown): number {
  const n = typeof valeur === "number" ? valeur : Number(valeur);
  if (!Number.isInteger(n) || n < 1 || n > MOIS_COUVERTS_MAX) {
    throw new EmissionFactureAbonnementError(
      "mois_invalide",
      `Le nombre de mois couverts doit être un entier entre 1 et ${MOIS_COUVERTS_MAX}.`,
    );
  }
  return n;
}

/**
 * Ce que la facture dira. Calculé à part pour qu'une simulation puisse
 * l'afficher sans rien écrire : on ne demande pas à quelqu'un d'approuver une
 * écriture comptable qu'il n'a pas lue.
 */
export function preparerFactureAbonnement(input: {
  nomCabinet: string;
  montantMensuel: number;
  mois: number;
  dateEmission: Date;
}): { description: string; montant: number; dateEcheance: Date; periodeFin: Date } {
  const periodeFin = ajouterMois(input.dateEmission, input.mois);
  return {
    description:
      input.mois === 1
        ? `Abonnement SAFE — 1 mois`
        : `Abonnement SAFE — ${input.mois} mois`,
    montant: Number((input.montantMensuel * input.mois).toFixed(2)),
    // L'échéance est le jour même : le virement est déjà arrivé quand la
    // facture s'écrit. Une échéance future ferait apparaître un retard qui
    // n'existe pas dans le suivi des impayés.
    dateEcheance: input.dateEmission,
    periodeFin,
  };
}

/**
 * Émet la facture d'abonnement et retourne de quoi enregistrer le paiement.
 *
 * N'encaisse rien : l'encaissement reste `createPayment`, qui déclenche à son
 * tour la prolongation d'accès. Les deux gestes restent séparés parce qu'ils le
 * sont dans la réalité — une facture peut exister sans que l'argent soit
 * arrivé.
 */
export async function emettreFactureAbonnement(params: {
  cabinetAbonneId: string;
  mois: number;
  dateEmission: Date;
  emisParId?: string | null;
}): Promise<{ invoiceId: string; montant: number; description: string; periodeFin: Date }> {
  const mois = validerMoisCouverts(params.mois);

  const abonne = await prisma.cabinet.findUnique({
    where: { id: params.cabinetAbonneId },
    select: {
      id: true,
      nom: true,
      abonnementMontantMensuel: true,
      ficheAbonne: { select: { id: true, cabinetId: true } },
    },
  });
  if (!abonne) {
    throw new EmissionFactureAbonnementError(
      "cabinet_introuvable",
      `Aucun cabinet abonné « ${params.cabinetAbonneId} ».`,
    );
  }
  if (!abonne.ficheAbonne) {
    throw new EmissionFactureAbonnementError(
      "pas_de_fiche_abonne",
      `Le cabinet « ${abonne.nom} » n'a pas de fiche client chez SAFE Inc. Provisionnez-le d'abord.`,
    );
  }
  if (abonne.abonnementMontantMensuel == null) {
    throw new EmissionFactureAbonnementError(
      "montant_absent",
      `Aucun montant mensuel enregistré pour « ${abonne.nom} ». Rien ne permet de chiffrer la facture.`,
    );
  }

  const prepare = preparerFactureAbonnement({
    nomCabinet: abonne.nom,
    montantMensuel: Number(abonne.abonnementMontantMensuel),
    mois,
    dateEmission: params.dateEmission,
  });

  const facture = await prisma.invoice.create({
    data: {
      cabinetId: abonne.ficheAbonne.cabinetId,
      clientId: abonne.ficheAbonne.id,
      numero: makeProvisionalInvoiceNumero(),
      dateEmission: params.dateEmission,
      dateEcheance: prepare.dateEcheance,
      // Le champ que `prolongerAccesApresPaiement` attendait depuis le début.
      accesMoisCouverts: mois,
      invoiceLines: {
        create: {
          description: prepare.description,
          quantite: mois,
          tauxUnitaire: Number(abonne.abonnementMontantMensuel),
          montant: prepare.montant,
          lineType: "fee",
          sourceType: "manual",
          serviceDate: params.dateEmission,
          // SAFE Inc. n'est pas inscrite à la TPS/TVQ : aucune taxe ne se
          // facture, et surtout aucune ne se perçoit au nom d'un régime auquel
          // l'entreprise n'est pas inscrite.
          taxable: false,
        },
      },
    },
    select: { id: true },
  });

  await recalculateInvoiceTotals(facture.id);
  await issueInvoice({
    invoiceId: facture.id,
    approvedById: params.emisParId ?? null,
    cabinetId: abonne.ficheAbonne.cabinetId,
  });

  return {
    invoiceId: facture.id,
    montant: prepare.montant,
    description: prepare.description,
    periodeFin: prepare.periodeFin,
  };
}
