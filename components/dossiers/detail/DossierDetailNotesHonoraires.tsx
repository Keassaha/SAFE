"use client";

import { useTranslations } from "next-intl";

/**
 * Onglet 09 — Notes & Honoraires
 * Sous-onglets : Notes (éditeur riche, types, confidentiel) | Honoraires (time entries, débours, factures)
 */
export function DossierDetailNotesHonoraires({ dossierId }: { dossierId: string }) {
  const t = useTranslations("matterDetailUi");
  return (
    <div className="rounded-safe-sm border border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-bg)] p-6">
      <p className="text-sm text-[var(--safe-text-secondary)]">
        {t("notesFeesTitle", { id: dossierId })}
      </p>
      <p className="mt-2 text-xs text-[var(--safe-text-secondary)] opacity-80">
        {t("notesFeesHint")}
      </p>
    </div>
  );
}
