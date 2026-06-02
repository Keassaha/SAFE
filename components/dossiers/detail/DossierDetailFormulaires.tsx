"use client";

import { useTranslations } from "next-intl";

/**
 * Onglet — Formulaires
 * Formulaires administratifs et documents types liés au dossier
 */
export function DossierDetailFormulaires({ dossierId }: { dossierId: string }) {
  const t = useTranslations("matterDetailUi");
  return (
    <div className="rounded-safe-sm border border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-bg)] p-6">
      <p className="text-sm text-[var(--safe-text-secondary)]">
        {t("formsTitle", { id: dossierId })}
      </p>
      <p className="mt-2 text-xs text-[var(--safe-text-secondary)] opacity-80">
        {t("formsHint")}
      </p>
    </div>
  );
}
