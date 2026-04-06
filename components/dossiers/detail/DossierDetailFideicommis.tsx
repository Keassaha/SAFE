"use client";

/**
 * Onglet 08 — Fidéicommis
 * Solde actuel, tableau mouvements (entrée/sortie), validation AVOCAT/ADMIN, alerte si solde &lt; 0
 */
export function DossierDetailFideicommis({ dossierId }: { dossierId: string }) {
  return (
    <div className="rounded-safe-sm border border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-bg)] p-6">
      <p className="text-sm text-[var(--safe-text-secondary)]">
        Fidéicommis — Dossier {dossierId}
      </p>
      <p className="mt-2 text-xs text-[var(--safe-text-secondary)] opacity-80">
        Solde, mouvements PENDING/VALIDATED, rapport de réconciliation PDF
      </p>
    </div>
  );
}
