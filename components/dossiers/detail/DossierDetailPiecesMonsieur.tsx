"use client";

import { useTranslations } from "next-intl";

/**
 * Onglet 04 — Pièces Monsieur (préfixe D-)
 * Liste D-1 à D-15, même structure que Madame
 */
export function DossierDetailPiecesMonsieur({ dossierId }: { dossierId: string }) {
  const t = useTranslations("matterDetailUi");
  return (
    <div className="rounded-safe-sm border border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-bg)] p-6">
      <p className="text-sm text-[var(--safe-text-secondary)]">
        {t("exhibitsDefendantTitle", { id: dossierId })}
      </p>
      <p className="mt-2 text-xs text-[var(--safe-text-secondary)] opacity-80">
        {t("exhibitsDefendantHint")}
      </p>
    </div>
  );
}
