"use client";

/**
 * Onglet 03 — Pièces Madame (préfixe P-)
 * Liste P-1 à P-35, filtres par catégorie, bordereau PDF
 */
export function DossierDetailPiecesMadame({ dossierId }: { dossierId: string }) {
  return (
    <div className="rounded-lg border border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-bg)] p-6">
      <p className="text-sm text-[var(--safe-text-secondary)]">
        Pièces Madame (P-1 à P-35) — Dossier {dossierId}
      </p>
      <p className="mt-2 text-xs text-[var(--safe-text-secondary)] opacity-80">
        Liste numérotée, statut (Reçu / Manquant / Demandé), upload, bordereau PDF
      </p>
    </div>
  );
}
