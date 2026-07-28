/**
 * Erreurs du service Documents.
 *
 * Fichier séparé à l'origine parce que `lib/services/document.ts` portait
 * `"use server"` (seules des fonctions async y sont exportables). Cette directive
 * a été retirée à l'audit du 2026-07-28, mais la séparation est conservée : elle
 * garde les erreurs importables depuis un composant client sans tirer le service.
 */

/** Levée quand un document rattaché à un client/dossier ne peut être supprimé (rétention Barreau). */
export class DocumentRetentionError extends Error {
  constructor() {
    super("DOCUMENT_RETENTION");
    this.name = "DocumentRetentionError";
  }
}
