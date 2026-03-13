"use client";

/**
 * Onglet 04 — Pièces Monsieur (préfixe D-)
 * Liste D-1 à D-15, même structure que Madame
 */
export function DossierDetailPiecesMonsieur({ dossierId }: { dossierId: string }) {
  return (
    <div className="rounded-lg border border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-bg)] p-6">
      <p className="text-sm text-[var(--safe-text-secondary)]">
        Pièces Monsieur (D-1 à D-15) — Dossier {dossierId}
      </p>
      <p className="mt-2 text-xs text-[var(--safe-text-secondary)] opacity-80">
        Liste numérotée, statut, upload, bordereau PDF
      </p>
    </div>
  );
}
