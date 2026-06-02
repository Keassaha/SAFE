"use client";

import { useTranslations } from "next-intl";

/**
 * Onglet 06 — Jugements
 * Tableau : type, dispositions, date jugement, délai appel (J+30), rappel auto J+25
 */
export function DossierDetailJugements({ dossierId }: { dossierId: string }) {
  const t = useTranslations("matterDetailUi");
  return (
    <div className="rounded-safe-sm border border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-bg)] p-6">
      <p className="text-sm text-[var(--safe-text-secondary)]">
        {t("judgmentsTitle", { id: dossierId })}
      </p>
      <p className="mt-2 text-xs text-[var(--safe-text-secondary)] opacity-80">
        {t("judgmentsHint")}
      </p>
    </div>
  );
}
