"use client";

import { useTranslations } from "next-intl";

/**
 * Onglet — Formulaires
 * Formulaires administratifs et documents types liés au dossier
 */
export function DossierDetailFormulaires({ dossierId }: { dossierId: string }) {
  const t = useTranslations("matterDetailUi");
  return (
    <div className="rounded-lg border border-si-line bg-[var(--safe-neutral-bg)] p-6">
      <p className="text-sm text-si-muted">
        {t("formsTitle", { id: dossierId })}
      </p>
      <p className="mt-2 text-xs text-si-muted opacity-80">
        {t("formsHint")}
      </p>
    </div>
  );
}
