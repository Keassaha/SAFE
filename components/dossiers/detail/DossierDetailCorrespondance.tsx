"use client";

/**
 * Onglet 07 — Correspondance
 * Timeline chronologique : type (badge), titre, date, expéditeur/destinataire, PDF, notes
 */
export function DossierDetailCorrespondance({ dossierId }: { dossierId: string }) {
  return (
    <div className="rounded-lg border border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-bg)] p-6">
      <p className="text-sm text-[var(--safe-text-secondary)]">
        Correspondance — Dossier {dossierId}
      </p>
      <p className="mt-2 text-xs text-[var(--safe-text-secondary)] opacity-80">
        Timeline (récent → ancien), types colorés, filtre par type et période
      </p>
    </div>
  );
}
