/**
 * Ce qu'un dossier peut envoyer aujourd'hui (lot 0.5).
 *
 * Doctrine : docs/product/SPEC_SAFE_CORRESPONDANCE_ASSISTEE.md §22.
 *
 * ── Pourquoi ce fichier existe ───────────────────────────────────────────────
 * SAFE sait envoyer un document rédigé et une facture. Les deux gestes existent
 * et fonctionnent, mais ils vivent chacun au fond d'un écran différent : le
 * document dans l'éditeur du portail d'édition, la facture dans l'aperçu de la
 * facture. Depuis l'onglet Correspondance d'un dossier, rien n'y menait.
 *
 * Le lot 0.5 ne construit aucun envoi. Il rend atteignables ceux qui existent,
 * ce que le §4.2 de la règle de build nomme comme prioritaire.
 *
 * Ce module ne contient QUE les règles : ce qui est envoyable, et par qui. Pur,
 * donc testable sans base et sans session.
 */

/** Un document rédigé du dossier, rendu en PDF au moment de l'envoi. */
export interface DocumentEnvoyable {
  id: string;
  titre: string;
  type: string;
  statut: string;
}

export interface FactureEnvoyable {
  id: string;
  numero: string;
  invoiceStatus: string | null;
  montantTotal: number;
}

export interface DroitsEnvoi {
  /** `canManageDossiers` côté appelant : qui gère le dossier transmet ses pièces. */
  peutEnvoyerDocuments: boolean;
  /** `canManageInvoices` : la facture reste au périmètre comptable. */
  peutEnvoyerFactures: boolean;
}

/**
 * Statuts d'où l'envoi de facture est offert.
 *
 * Repris À L'IDENTIQUE de `FacturePreviewActions` (`canIssue`), qui est
 * aujourd'hui le seul écran d'où l'on envoie une facture. Le lot 0.5 déplace un
 * bouton, il ne change pas la règle qui décide s'il s'affiche : une facture
 * déjà transmise ne se renvoie pas d'ici, et une facture annulée non plus.
 */
export const STATUTS_FACTURE_ENVOYABLE = ["DRAFT", "READY_TO_ISSUE"] as const;

export function factureEstEnvoyable(invoiceStatus: string | null | undefined): boolean {
  if (!invoiceStatus) {
    // `invoiceStatus` est nullable au schéma, avec DRAFT en valeur par défaut.
    // Une facture dont la colonne est nulle est un brouillon, comme l'écran de
    // la facture le suppose déjà (`invoiceStatus == null` y vaut brouillon).
    return true;
  }
  return (STATUTS_FACTURE_ENVOYABLE as readonly string[]).includes(invoiceStatus);
}

/** Un document au statut brouillon reste envoyable, mais l'écran doit le dire. */
export function documentEstBrouillon(statut: string): boolean {
  return statut === "brouillon";
}

export interface SourcesEnvoyables {
  documents: DocumentEnvoyable[];
  factures: FactureEnvoyable[];
}

/**
 * Retient ce que cet utilisateur peut réellement transmettre.
 *
 * Le filtre par droit est appliqué ICI plutôt qu'à l'affichage : une liste
 * envoyée au navigateur est une liste divulguée, même si le bouton est masqué.
 */
export function filtrerEnvoyables(
  sources: SourcesEnvoyables,
  droits: DroitsEnvoi,
): SourcesEnvoyables {
  return {
    documents: droits.peutEnvoyerDocuments ? sources.documents : [],
    factures: droits.peutEnvoyerFactures ? sources.factures.filter((f) => factureEstEnvoyable(f.invoiceStatus)) : [],
  };
}

/** Rien à proposer : l'écran doit alors expliquer pourquoi, pas rester muet. */
export function aucunEnvoiPossible(retenues: SourcesEnvoyables): boolean {
  return retenues.documents.length === 0 && retenues.factures.length === 0;
}
