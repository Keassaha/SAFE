"use client";

import { useTranslations } from "next-intl";
import { RepriseParDepot } from "./RepriseParDepot";

/**
 * L'onglet « Exercices précédents » de SAFE Import : UN espace de travail,
 * aligné sur les onglets (version intégrée, validée le 2026-10-01).
 *
 * « Corriger une écriture » n'y vit plus (décision CEO du 2026-10-01) : une
 * facture reprise se corrige là où elle vit, depuis sa page en Facturation ou
 * depuis la fin du client qu'on vient de reprendre (`CorrigerFacture`).
 *
 * Le dépôt multi-clients (`components/clients/reprise/ReprisePage.tsx`) reste
 * conservé, sans porte (décision CEO du 2026-09-30).
 */
export function ExercicesPrecedents() {
  const t = useTranslations("repriseUnClient.onglets");

  return (
    // `overflow-clip` et non `overflow-hidden` : le pied collant de l'écran
    // doit coller au bas de la fenêtre, et `hidden` en ferait un conteneur de
    // défilement qui l'en empêcherait.
    <div className="overflow-clip rounded-xl border border-si-line bg-si-surface text-[14px] shadow-[0_1px_2px_rgba(22,24,23,0.04)]">
      <div className="border-b border-si-line2 px-7 py-4">
        <span className="font-medium text-si-ink">{t("reprendre")}</span>
      </div>
      <RepriseParDepot />
    </div>
  );
}
