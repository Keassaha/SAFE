/**
 * Erreurs du service Documents.
 *
 * Fichier séparé car `lib/services/document.ts` est un module `"use server"`
 * (Server Actions) où seules des fonctions async peuvent être exportées —
 * une classe d'erreur ne peut donc pas y vivre.
 */

/** Levée quand un document rattaché à un client/dossier ne peut être supprimé (rétention Barreau). */
export class DocumentRetentionError extends Error {
  constructor() {
    super("DOCUMENT_RETENTION");
    this.name = "DocumentRetentionError";
  }
}
