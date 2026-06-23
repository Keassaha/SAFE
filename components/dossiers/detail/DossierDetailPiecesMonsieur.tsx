"use client";

import { useTranslations } from "next-intl";

/**
 * Onglet 04 — Pièces Monsieur (préfixe D-)
 * Liste D-1 à D-15, même structure que Madame
 */
export function DossierDetailPiecesMonsieur({ dossierId }: { dossierId: string }) {
  const t = useTranslations("matterDetailUi");
  return (
    <div className="rounded-lg border border-si-line bg-si-surface p-6">
      <p className="text-sm text-si-muted">
        {t("exhibitsDefendantTitle", { id: dossierId })}
      </p>
      <p className="mt-2 text-xs text-si-muted opacity-80">
        {t("exhibitsDefendantHint")}
      </p>
    </div>
  );
}
