"use client";

import { useTranslations } from "next-intl";

/**
 * Onglet 06 — Jugements
 * Tableau : type, dispositions, date jugement, délai appel (J+30), rappel auto J+25
 */
export function DossierDetailJugements({ dossierId }: { dossierId: string }) {
  const t = useTranslations("matterDetailUi");
  return (
    <div className="rounded-lg border border-si-line bg-[var(--safe-neutral-bg)] p-6">
      <p className="text-sm text-si-muted">
        {t("judgmentsTitle", { id: dossierId })}
      </p>
      <p className="mt-2 text-xs text-si-muted opacity-80">
        {t("judgmentsHint")}
      </p>
    </div>
  );
}
