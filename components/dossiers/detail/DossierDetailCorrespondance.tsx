"use client";

import { useTranslations } from "next-intl";

/**
 * Onglet 07 — Correspondance
 * Timeline chronologique : type (badge), titre, date, expéditeur/destinataire, PDF, notes
 */
export function DossierDetailCorrespondance({ dossierId }: { dossierId: string }) {
  const t = useTranslations("matterDetailUi");
  return (
    <div className="rounded-safe-sm border border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-bg)] p-6">
      <p className="text-sm text-[var(--safe-text-secondary)]">
        {t("correspondenceTitle", { id: dossierId })}
      </p>
      <p className="mt-2 text-xs text-[var(--safe-text-secondary)] opacity-80">
        {t("correspondenceHint")}
      </p>
    </div>
  );
}
