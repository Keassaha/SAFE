"use client";

import { useTranslations } from "next-intl";

/**
 * Onglet 02 — Mandat
 * Formulaire d'ouverture + checklist documents du mandat (8 documents, dont 3 obligatoires)
 */
export function DossierDetailMandat({ dossierId }: { dossierId: string }) {
  const t = useTranslations("matterDetailUi");
  return (
    <div className="rounded-lg border border-si-line bg-[var(--safe-neutral-bg)] p-6">
      <p className="text-sm text-si-muted">
        {t("mandateTitle", { id: dossierId })}
      </p>
      <p className="mt-2 text-xs text-si-muted opacity-80">
        {t("mandateHint")}
      </p>
    </div>
  );
}
