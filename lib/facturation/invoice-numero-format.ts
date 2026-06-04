/**
 * Helpers PURS de numéro de facture (aucune dépendance — importable client + serveur).
 */

export const PROVISIONAL_INVOICE_PREFIX = "BROUILLON-";

/** Formate un numéro de facture officiel (format ANNEE-XXX). */
export function formatInvoiceNumero(year: number, sequence: number): string {
  return `${year}-${String(sequence).padStart(3, "0")}`;
}

/** Vrai si le numéro est provisoire (brouillon non émis). */
export function isProvisionalInvoiceNumero(numero: string | null | undefined): boolean {
  return !!numero && numero.startsWith(PROVISIONAL_INVOICE_PREFIX);
}

/** Libellé d'affichage : « Brouillon » pour un numéro provisoire, sinon le numéro officiel. */
export function displayInvoiceNumero(numero: string | null | undefined): string {
  if (!numero) return "Brouillon";
  return isProvisionalInvoiceNumero(numero) ? "Brouillon" : numero;
}
