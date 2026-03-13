"use client";

/**
 * Onglet 05 — Procédures
 * Tableau : type, description, dates dépôt/signification, statut, fichier PDF
 */
export function DossierDetailProcedures({ dossierId }: { dossierId: string }) {
  return (
    <div className="rounded-lg border border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-bg)] p-6">
      <p className="text-sm text-[var(--safe-text-secondary)]">
        Procédures — Dossier {dossierId}
      </p>
      <p className="mt-2 text-xs text-[var(--safe-text-secondary)] opacity-80">
        Tableau + Ajouter une procédure, types (Demande introductive, Défense, etc.)
      </p>
    </div>
  );
}
