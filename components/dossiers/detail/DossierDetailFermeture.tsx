"use client";

/**
 * Onglet 10 — Fermeture
 * Checklist 12 étapes, bouton "Fermer officiellement" → statut FERMÉ, rappel 7 ans, email avocat
 */
export function DossierDetailFermeture({
  dossierId,
  statutDossier,
}: {
  dossierId: string;
  statutDossier: string;
}) {
  const isFerme = statutDossier === "cloture" || statutDossier === "FERMÉ";
  return (
    <div className="rounded-lg border border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-bg)] p-6">
      <p className="text-sm text-[var(--safe-text-secondary)]">
        Fermeture — Dossier {dossierId}
      </p>
      <p className="mt-2 text-xs text-[var(--safe-text-secondary)] opacity-80">
        {isFerme
          ? "Dossier déjà fermé."
          : "Checklist 12 étapes, Fermer officiellement → rappel destruction 7 ans"}
      </p>
    </div>
  );
}
