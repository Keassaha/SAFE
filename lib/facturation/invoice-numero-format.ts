/**
 * Helpers PURS de numéro de facture (aucune dépendance — importable client + serveur).
 *
 * Conformité Barreau / fisc : la séquence officielle `ANNÉE-XXX` doit être SANS
 * TROU pour les factures émises. Un brouillon porte donc un numéro PROVISOIRE
 * (`BROUILLON-<uuid>`) qui ne consomme aucun numéro de la séquence ; le numéro
 * officiel n'est attribué qu'à l'émission.
 */

export const PROVISIONAL_INVOICE_PREFIX = "BROUILLON-";

/** Formate un numéro de facture officiel (format ANNÉE-XXX). */
export function formatInvoiceNumero(year: number, sequence: number): string {
  return `${year}-${String(sequence).padStart(3, "0")}`;
}

/** Vrai si le numéro est provisoire (brouillon non émis). */
export function isProvisionalInvoiceNumero(numero: string | null | undefined): boolean {
  return !!numero && numero.startsWith(PROVISIONAL_INVOICE_PREFIX);
}

/**
 * Libellé d'affichage : un libellé « brouillon » pour un numéro provisoire (ou
 * absent), sinon le numéro officiel. Le libellé brouillon est paramétrable pour
 * permettre la localisation côté appelant (défaut « Brouillon »).
 */
export function displayInvoiceNumero(
  numero: string | null | undefined,
  draftLabel = "Brouillon",
): string {
  if (!numero) return draftLabel;
  return isProvisionalInvoiceNumero(numero) ? draftLabel : numero;
}
