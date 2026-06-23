"use client";

import { useTranslations } from "next-intl";

/**
 * Onglet 08 — Fidéicommis
 * Solde actuel, tableau mouvements (entrée/sortie), validation AVOCAT/ADMIN, alerte si solde &lt; 0
 */
export function DossierDetailFideicommis({ dossierId }: { dossierId: string }) {
  const t = useTranslations("matterDetailUi");
  return (
    <div className="rounded-lg border border-si-line bg-si-surface p-6">
      <p className="text-sm text-si-muted">
        {t("trustAccountTitle", { id: dossierId })}
      </p>
      <p className="mt-2 text-xs text-si-muted opacity-80">
        {t("trustAccountHint")}
      </p>
    </div>
  );
}
