"use client";

import { useTranslations } from "next-intl";

/**
 * Onglet 02 — Mandat
 * Formulaire d'ouverture + checklist documents du mandat (8 documents, dont 3 obligatoires)
 */
export function DossierDetailMandat({ dossierId }: { dossierId: string }) {
  const t = useTranslations("matterDetailUi");
  return (
    <div className="rounded-safe-sm border border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-bg)] p-6">
      <p className="text-sm text-[var(--safe-text-secondary)]">
        {t("mandateTitle", { id: dossierId })}
      </p>
      <p className="mt-2 text-xs text-[var(--safe-text-secondary)] opacity-80">
        {t("mandateHint")}
      </p>
    </div>
  );
}
