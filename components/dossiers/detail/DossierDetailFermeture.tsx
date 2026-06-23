"use client";

import { useTranslations } from "next-intl";

/**
 * Onglet 10 — Fermeture
 * Checklist 12 étapes, bouton "Fermer officiellement" → statut FERMÉ, rappel 7 ans, email avocat
 */
export function DossierDetailFermeture({
  dossierId,
  statutDossier = "",
}: {
  dossierId: string;
  statutDossier?: string;
}) {
  const t = useTranslations("matterDetailUi");
  const isFerme = statutDossier === "cloture" || statutDossier === "FERMÉ";
  return (
    <div className="rounded-lg border border-si-line bg-si-surface p-6">
      <p className="text-sm text-si-muted">
        {t("closureTitle", { id: dossierId })}
      </p>
      <p className="mt-2 text-xs text-si-muted opacity-80">
        {isFerme ? t("closureAlreadyClosed") : t("closureHint")}
      </p>
    </div>
  );
}
