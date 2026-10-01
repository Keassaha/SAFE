"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CorrectionsReprise } from "@/components/clients/reprise/CorrectionsReprise";
import { RepriseParDepot } from "./RepriseParDepot";
import { Lien } from "./ui";

/**
 * L'onglet « Exercices précédents » de SAFE Import : UN espace de travail,
 * aligné sur les onglets (version intégrée, validée le 2026-10-01).
 *
 * Il n'y a plus de sélecteur entre « Reprendre un client » et « Corriger une
 * écriture » : c'était un troisième étage de navigation, et il répétait le
 * titre de la section. L'autre vue est un lien, en haut à droite de l'espace.
 *
 * Le dépôt multi-clients (`components/clients/reprise/ReprisePage.tsx`) reste
 * conservé, sans porte (décision CEO du 2026-09-30).
 */
export function ExercicesPrecedents() {
  const t = useTranslations("repriseUnClient.onglets");
  const [vue, setVue] = useState<"reprendre" | "corriger">("reprendre");
  const autre = vue === "reprendre" ? "corriger" : "reprendre";

  return (
    // `overflow-clip` et non `overflow-hidden` : le pied collant de l'écran
    // doit coller au bas de la fenêtre, et `hidden` en ferait un conteneur de
    // défilement qui l'en empêcherait.
    <div className="overflow-clip rounded-xl border border-si-line bg-si-surface text-[14px] shadow-[0_1px_2px_rgba(22,24,23,0.04)]">
      <div className="flex items-baseline justify-between gap-4 border-b border-si-line2 px-7 py-4">
        <span className="font-medium text-si-ink">{t(vue)}</span>
        <Lien onClick={() => setVue(autre)}>{t(autre)}</Lien>
      </div>
      {vue === "corriger" && (
        <div className="p-7">
          <CorrectionsReprise />
        </div>
      )}
      {/* Gardé monté pendant une correction : on ne perd pas le client en cours. */}
      <div className={vue === "reprendre" ? "" : "hidden"}>
        <RepriseParDepot />
      </div>
    </div>
  );
}
