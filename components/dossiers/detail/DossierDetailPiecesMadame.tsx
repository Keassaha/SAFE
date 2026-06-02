"use client";

import { useTranslations } from "next-intl";

/**
 * Onglet 03 — Pièces Madame (préfixe P-)
 * Liste P-1 à P-35, filtres par catégorie, bordereau PDF
 */
export function DossierDetailPiecesMadame({ dossierId }: { dossierId: string }) {
  const t = useTranslations("matterDetailUi");
  return (
    <div className="rounded-safe-sm border border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-bg)] p-6">
      <p className="text-sm text-[var(--safe-text-secondary)]">
        {t("exhibitsPlaintiffTitle", { id: dossierId })}
      </p>
      <p className="mt-2 text-xs text-[var(--safe-text-secondary)] opacity-80">
        {t("exhibitsPlaintiffHint")}
      </p>
    </div>
  );
}
