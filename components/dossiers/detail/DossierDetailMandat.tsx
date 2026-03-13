"use client";

/**
 * Onglet 02 — Mandat
 * Formulaire d'ouverture + checklist documents du mandat (8 documents, dont 3 obligatoires)
 */
export function DossierDetailMandat({ dossierId }: { dossierId: string }) {
  return (
    <div className="rounded-lg border border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-bg)] p-6">
      <p className="text-sm text-[var(--safe-text-secondary)]">
        Section Mandat — Dossier {dossierId}
      </p>
      <p className="mt-2 text-xs text-[var(--safe-text-secondary)] opacity-80">
        Ouverture (numéro CAB-AAAA-XXXX, avocat, type cause) + Checklist 8 documents
      </p>
    </div>
  );
}
