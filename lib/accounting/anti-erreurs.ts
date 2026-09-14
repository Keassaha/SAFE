/**
 * Contrôles anti-erreurs comptables (doctrine §8). Fonctions PURES et testables.
 *
 * Objectif : rendre SAFE difficile à mal utiliser. On distingue :
 *   - les BLOCAGES (throw) — un état comptablement invalide ;
 *   - les AVERTISSEMENTS (GuardWarning) — un état permis mais risqué, à signaler.
 *
 * Le moteur applique déjà les blocages durs côté fidéicommis (solde négatif,
 * transfert sans facture, cross-client) ; ce module couvre les contrôles de saisie
 * côté facturation / paiements / débours.
 */

import type { DossierStatut, DeboursStatut } from "@prisma/client";

export interface GuardWarning {
  code: string;
  message: string;
  /**
   * La facture visée, quand l'avertissement en vise une.
   *
   * Sert à l'écran, qui offre alors le geste de réparation sur place plutôt que
   * de renvoyer l'utilisateur chercher la facture ailleurs. Absent sur les
   * avertissements qui ne portent sur aucune facture précise.
   */
  invoiceId?: string;
  invoiceNumero?: string;
}

/** Dossiers considérés fermés (plus d'activité courante attendue). */
export const CLOSED_DOSSIER_STATUSES: readonly DossierStatut[] = ["cloture", "archive"];

/**
 * Avertissement (non bloquant) : un paiement enregistré sans être appliqué à une
 * facture. Légitime (acompte, paiement anticipé) mais à signaler pour éviter les
 * encaissements orphelins jamais alloués.
 */
export function warnPaymentWithoutInvoice(hasInvoice: boolean): GuardWarning | null {
  if (hasInvoice) return null;
  return {
    code: "PAYMENT_WITHOUT_INVOICE",
    message:
      "Paiement enregistré sans facture associée. Pensez à l'allouer à une facture pour réduire les comptes à recevoir.",
  };
}

/**
 * Avertissement (non bloquant) : de l'argent entre sur une facture dont AUCUNE
 * transmission au client n'est enregistrée.
 *
 * Ce n'est pas une faute. Le cabinet a pu la poster, la remettre en main propre
 * ou l'envoyer depuis son propre courriel : le règlement reconnaît ces canaux
 * (art. 56(2) B-1 r.5 · s. 9(1)3 By-Law 9), et SAFE ne peut pas les prouver.
 * C'est une incohérence tant que la transmission n'est pas déclarée, parce que
 * le même règlement n'ouvre le retrait du fidéicommis que pour la facturation
 * « qui a été envoyée ».
 *
 * Volontairement un AVERTISSEMENT et non un blocage. Refuser d'inscrire un
 * paiement réellement reçu ferait mentir SAFE sur le compte en banque, et
 * refuser le geste pousserait au contournement — donc à la perte de traçabilité
 * qu'on cherchait à éviter. Le raisonnement complet vit dans
 * `lib/compliance/invoice-delivery.ts`.
 *
 * ⚠️ `deliveredAt`, jamais `sentAt`. `sentAt` n'est posé que par l'envoi
 * courriel de SAFE : une facture postée l'a toujours à `null` bien qu'elle ait
 * été régulièrement transmise. C'est l'erreur corrigée le 2026-09-13.
 */
export function warnPaymentOnUndeliveredInvoice(params: {
  invoiceId?: string | null;
  invoiceNumero?: string | null;
  /** `Invoice.deliveredAt`. Null = aucune transmission enregistrée. */
  deliveredAt?: Date | null;
}): GuardWarning | null {
  // Pas de facture : c'est l'autre avertissement qui parle, pas celui-ci.
  if (!params.invoiceId) return null;
  if (params.deliveredAt) return null;
  const numero = params.invoiceNumero?.trim();
  return {
    code: "PAYMENT_ON_UNDELIVERED_INVOICE",
    message: numero
      ? `La facture ${numero} n'a jamais été transmise au client. Déclarez la transmission si vous l'avez postée, remise en main propre ou envoyée autrement.`
      : "Cette facture n'a jamais été transmise au client. Déclarez la transmission si vous l'avez postée, remise en main propre ou envoyée autrement.",
    invoiceId: params.invoiceId,
    ...(numero ? { invoiceNumero: numero } : {}),
  };
}

/**
 * Blocage : une facture doit toujours être rattachée à un client. Sans client, la
 * créance n'est pas imputable et fausse les comptes à recevoir.
 */
export function assertInvoiceHasClient(params: { clientId?: string | null }): void {
  if (!params.clientId || !params.clientId.trim()) {
    throw new Error("Une facture doit être rattachée à un client.");
  }
}

/**
 * Avertissement (non bloquant) : facture sans dossier. Permis (honoraires hors
 * dossier) mais signalé pour la traçabilité.
 */
export function warnInvoiceWithoutDossier(params: {
  dossierId?: string | null;
}): GuardWarning | null {
  if (params.dossierId && params.dossierId.trim()) return null;
  return {
    code: "INVOICE_WITHOUT_DOSSIER",
    message: "Facture sans dossier associé. Rattachez-la à un dossier pour la traçabilité.",
  };
}

/**
 * Avertissement (non bloquant) : un débours refacturable et non facturé sur un
 * dossier fermé/archivé. Risque d'oublier de le refacturer avant la fermeture.
 */
export function warnUnbilledDeboursOnClosedDossier(params: {
  statutDebours: DeboursStatut;
  dossierStatut: DossierStatut;
  refacturable: boolean;
}): GuardWarning | null {
  if (!params.refacturable) return null;
  if (params.statutDebours !== "NON_FACTURE") return null;
  if (!CLOSED_DOSSIER_STATUSES.includes(params.dossierStatut)) return null;
  return {
    code: "UNBILLED_DEBOURS_ON_CLOSED_DOSSIER",
    message:
      "Débours non facturé sur un dossier fermé. Refacturez-le ou radiez-le avant la fermeture définitive.",
  };
}
