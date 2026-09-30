"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CorrectionsReprise } from "@/components/clients/reprise/CorrectionsReprise";
import { RepriseUnClient } from "./RepriseUnClient";

/**
 * L'onglet « Exercices précédents » de SAFE Import.
 *
 * Décision CEO du 2026-09-30 (Q1) : un client à la fois. Le dépôt en lot de
 * plusieurs clients (`components/clients/reprise/ReprisePage.tsx`) n'est plus
 * proposé ici. Son code est CONSERVÉ, prêt à revenir quand la démarche sera
 * documentée et maîtrisée : seule la porte est retirée.
 */
export function ExercicesPrecedents() {
  const t = useTranslations("repriseUnClient.onglets");
  const [vue, setVue] = useState<"reprendre" | "corriger">("reprendre");

  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-lg border border-si-line bg-si-surface2 p-0.5">
        {(["reprendre", "corriger"] as const).map((cle) => (
          <button
            key={cle}
            type="button"
            aria-pressed={vue === cle}
            onClick={() => setVue(cle)}
            className={`min-h-8 rounded-[6px] px-3 text-[13px] font-medium transition-all ${
              vue === cle ? "bg-si-surface text-si-ink shadow-[0_1px_2px_rgba(22,24,23,0.10)]" : "text-si-muted hover:text-si-ink"
            }`}
          >
            {t(cle)}
          </button>
        ))}
      </div>

      {vue === "corriger" && <CorrectionsReprise />}
      {/* Gardé monté pendant une correction : on ne perd pas le client en cours. */}
      <div className={vue === "reprendre" ? "" : "hidden"}>
        <RepriseUnClient onCorriger={() => setVue("corriger")} />
      </div>
    </div>
  );
}
