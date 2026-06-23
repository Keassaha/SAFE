"use client";

import { useTranslations } from "next-intl";

/**
 * Onglet 03 — Pièces Madame (préfixe P-)
 * Liste P-1 à P-35, filtres par catégorie, bordereau PDF
 */
export function DossierDetailPiecesMadame({ dossierId }: { dossierId: string }) {
  const t = useTranslations("matterDetailUi");
  return (
    <div className="rounded-lg border border-si-line bg-si-surface p-6">
      <p className="text-sm text-si-muted">
        {t("exhibitsPlaintiffTitle", { id: dossierId })}
      </p>
      <p className="mt-2 text-xs text-si-muted opacity-80">
        {t("exhibitsPlaintiffHint")}
      </p>
    </div>
  );
}
