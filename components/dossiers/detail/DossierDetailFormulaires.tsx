"use client";

/**
 * Onglet — Formulaires
 * Formulaires administratifs et documents types liés au dossier
 */
export function DossierDetailFormulaires({ dossierId }: { dossierId: string }) {
  return (
    <div className="rounded-lg border border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-bg)] p-6">
      <p className="text-sm text-[var(--safe-text-secondary)]">
        Formulaires — Dossier {dossierId}
      </p>
      <p className="mt-2 text-xs text-[var(--safe-text-secondary)] opacity-80">
        Formulaires administratifs, modèles et documents types rattachés au dossier
      </p>
    </div>
  );
}
