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
