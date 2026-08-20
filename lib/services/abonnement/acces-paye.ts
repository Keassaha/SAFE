/**
 * SAFE — Prolongation de l'accès d'un cabinet abonné après encaissement.
 *
 * Contexte : SAFE Inc. encaisse ses abonnements par virement Interac, qui n'a
 * pas d'API. L'accès ne peut donc pas venir d'un webhook. Il vient d'une
 * facture, émise par SAFE Inc. via son propre module de facturation (dog food,
 * ADR-006), et payée. Le pont est `Client.cabinetAbonneId`.
 *
 * Ce service est un NO-OP pour toute facture ordinaire d'un cabinet d'avocats :
 * la sortie se fait au premier test, sur un champ déjà chargé.
 *
 * Doctrine : l'accès est une ÉCHÉANCE, pas un statut. On ne « réactive » rien,
 * on repousse une date. Elle expire d'elle-même si plus personne ne paie, ce
 * qui supprime toute tâche de désactivation à ne pas oublier.
 */

import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";

type DbClient = PrismaClient | Prisma.TransactionClient;

/** Tolérance monétaire, alignée sur le reste du module facturation. */
const EPSILON = 0.005;

export type RaisonNonProlongation =
  | "facture_introuvable"
  | "pas_un_abonnement"
  | "deja_prolongee"
  | "solde_restant";

export type DecisionProlongation =
  | { prolonger: false; raison: RaisonNonProlongation }
  | { prolonger: true; nouvelleEcheance: Date; depuis: Date; mois: number };

/**
 * Ajoute `mois` mois à une date, en BUTANT sur la fin du mois d'arrivée.
 *
 * `setMonth` seul déborde : 31 janvier + 1 mois donne le 3 mars. Un abonné payé
 * le 31 gagnerait deux jours chaque mois, et un abonné payé le 31 janvier
 * verrait son accès sauter février entier. On ramène donc au dernier jour réel
 * du mois d'arrivée.
 *
 * L'heure est conservée : l'échéance vaut jusqu'à la fin de la journée dans les
 * faits, puisque la comparaison d'accès est un `>=`.
 */
export function ajouterMois(date: Date, mois: number): Date {
  const jour = date.getUTCDate();
  const resultat = new Date(date.getTime());
  resultat.setUTCDate(1);
  resultat.setUTCMonth(resultat.getUTCMonth() + mois);
  const dernierJourDuMois = new Date(
    Date.UTC(resultat.getUTCFullYear(), resultat.getUTCMonth() + 1, 0),
  ).getUTCDate();
  resultat.setUTCDate(Math.min(jour, dernierJourDuMois));
  return resultat;
}

/**
 * Décide si un encaissement prolonge un accès, et jusqu'à quand.
 *
 * Pure : aucune lecture, aucune écriture, aucune horloge implicite. C'est la
 * règle métier, et elle se teste sans base.
 *
 * Quatre refus, dans cet ordre :
 *   1. la facture ne représente pas un abonnement → rien à faire ;
 *   2. elle a DÉJÀ prolongé un accès → idempotence, un paiement rejoué,
 *      corrigé ou réalloué n'offre pas un second mois ;
 *   3. il reste un solde → un paiement partiel n'achète pas un mois.
 *
 * Point de départ : la plus tardive entre aujourd'hui et l'échéance en cours.
 *   - payé en avance → les mois s'empilent, l'abonné ne perd rien ;
 *   - payé en retard → le mois court à partir du paiement, jamais rétroactif,
 *     donc on ne vend jamais des jours déjà écoulés.
 */
export function deciderProlongation(input: {
  cabinetAbonneId: string | null | undefined;
  balanceDue: number;
  dejaProlongeJusquau: Date | null | undefined;
  accesActuel: Date | null | undefined;
  moisCouverts: number | null | undefined;
  maintenant: Date;
}): DecisionProlongation {
  if (!input.cabinetAbonneId) return { prolonger: false, raison: "pas_un_abonnement" };
  if (input.dejaProlongeJusquau) return { prolonger: false, raison: "deja_prolongee" };
  if (input.balanceDue > EPSILON) return { prolonger: false, raison: "solde_restant" };

  const accesActuel = input.accesActuel ?? null;
  const depuis =
    accesActuel && accesActuel.getTime() > input.maintenant.getTime()
      ? accesActuel
      : input.maintenant;

  // NULL vaut un mois. Un nombre absurde (0, négatif, non entier) est ramené à
  // 1 plutôt que de produire une échéance dans le passé.
  const brut = input.moisCouverts ?? 1;
  const mois = Number.isInteger(brut) && brut > 0 ? brut : 1;

  return { prolonger: true, nouvelleEcheance: ajouterMois(depuis, mois), depuis, mois };
}

/**
 * Applique la décision pour une facture donnée. Appelée APRÈS la transaction
 * qui a créé ou alloué le paiement, pour que `balanceDue` soit committé.
 *
 * Retourne la décision prise, pour que l'appelant puisse la journaliser sans
 * refaire la lecture.
 */
export async function prolongerAccesApresPaiement(
  invoiceId: string,
  options: { utilisateurId?: string | null; maintenant?: Date; client?: DbClient } = {},
): Promise<DecisionProlongation> {
  const db = options.client ?? prisma;
  const maintenant = options.maintenant ?? new Date();

  const facture = await db.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      numero: true,
      cabinetId: true,
      balanceDue: true,
      accesMoisCouverts: true,
      accesProlongeJusquau: true,
      client: { select: { cabinetAbonneId: true } },
    },
  });
  if (!facture) return { prolonger: false, raison: "facture_introuvable" };

  const cabinetAbonneId = facture.client?.cabinetAbonneId ?? null;
  // Sortie immédiate pour toute facture ordinaire : aucune requête de plus.
  if (!cabinetAbonneId) return { prolonger: false, raison: "pas_un_abonnement" };

  const abonne = await db.cabinet.findUnique({
    where: { id: cabinetAbonneId },
    select: { accesPayeJusquau: true },
  });

  const decision = deciderProlongation({
    cabinetAbonneId,
    balanceDue: facture.balanceDue,
    dejaProlongeJusquau: facture.accesProlongeJusquau,
    accesActuel: abonne?.accesPayeJusquau,
    moisCouverts: facture.accesMoisCouverts,
    maintenant,
  });
  if (!decision.prolonger) return decision;

  await prisma.$transaction(async (tx) => {
    // Verrou consultatif sur l'ABONNÉ : deux factures du même abonné encaissées
    // en même temps liraient sinon la même échéance et se marcheraient dessus,
    // l'une des deux offrant un mois qui disparaît. Même motif et même patron
    // que les verrous du module fidéicommis.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`abonne:${cabinetAbonneId}`}))`;

    // Relecture SOUS verrou : c'est l'état vrai. Le marqueur d'idempotence est
    // revérifié ici, sinon deux requêtes concurrentes sur la MÊME facture
    // passeraient toutes deux la vérification faite hors transaction.
    const sousVerrou = await tx.invoice.findUnique({
      where: { id: invoiceId },
      select: { accesProlongeJusquau: true, balanceDue: true },
    });
    if (!sousVerrou || sousVerrou.accesProlongeJusquau) return;
    if (sousVerrou.balanceDue > EPSILON) return;

    const abonneSousVerrou = await tx.cabinet.findUnique({
      where: { id: cabinetAbonneId },
      select: { accesPayeJusquau: true },
    });
    const finale = deciderProlongation({
      cabinetAbonneId,
      balanceDue: sousVerrou.balanceDue,
      dejaProlongeJusquau: sousVerrou.accesProlongeJusquau,
      accesActuel: abonneSousVerrou?.accesPayeJusquau,
      moisCouverts: facture.accesMoisCouverts,
      maintenant,
    });
    if (!finale.prolonger) return;

    await tx.cabinet.update({
      where: { id: cabinetAbonneId },
      data: { accesPayeJusquau: finale.nouvelleEcheance },
    });
    await tx.invoice.update({
      where: { id: invoiceId },
      data: { accesProlongeJusquau: finale.nouvelleEcheance },
    });
  });

  await createAuditLog({
    cabinetId: facture.cabinetId,
    userId: options.utilisateurId ?? undefined,
    entityType: "Cabinet",
    entityId: cabinetAbonneId,
    action: "update",
    newValues: {
      accesPayeJusquau: decision.nouvelleEcheance,
      motif: "encaissement_abonnement",
      factureId: facture.id,
      factureNumero: facture.numero,
      moisCouverts: decision.mois,
    },
    performedBy: options.utilisateurId ?? undefined,
    performedAt: maintenant,
  });

  return decision;
}
