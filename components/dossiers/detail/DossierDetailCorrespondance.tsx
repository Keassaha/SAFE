"use client";

import { useTranslations } from "next-intl";

/**
 * Onglet 07 — Correspondance
 * Timeline chronologique : type (badge), titre, date, expéditeur/destinataire, PDF, notes
 */
export function DossierDetailCorrespondance({ dossierId }: { dossierId: string }) {
  const t = useTranslations("matterDetailUi");
  return (
    <div className="rounded-lg border border-si-line bg-si-surface p-6">
      <p className="text-sm text-si-muted">
        {t("correspondenceTitle", { id: dossierId })}
      </p>
      <p className="mt-2 text-xs text-si-muted opacity-80">
        {t("correspondenceHint")}
      </p>
    </div>
  );
}
