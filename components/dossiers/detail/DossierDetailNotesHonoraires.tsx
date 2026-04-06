"use client";

/**
 * Onglet 09 — Notes & Honoraires
 * Sous-onglets : Notes (éditeur riche, types, confidentiel) | Honoraires (time entries, débours, factures)
 */
export function DossierDetailNotesHonoraires({ dossierId }: { dossierId: string }) {
  return (
    <div className="rounded-safe-sm border border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-bg)] p-6">
      <p className="text-sm text-[var(--safe-text-secondary)]">
        Notes & Honoraires — Dossier {dossierId}
      </p>
      <p className="mt-2 text-xs text-[var(--safe-text-secondary)] opacity-80">
        Notes (TipTap/react-quill) | Time entries, débours, factures, Créer une facture
      </p>
    </div>
  );
}
