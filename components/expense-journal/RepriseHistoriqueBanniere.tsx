"use client";
import { useFormatteurs } from "@/lib/i18n/formatteurs";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import {
  simulerRepriseTaxes,
  appliquerRepriseTaxes,
} from "@/app/(app)/journal/depenses/actions";

/**
 * Les dépenses antérieures au calcul de taxe.
 *
 * Spec : SPEC_DEPENSES_ET_PREPARATION_FISCALE.md §6, arbitrage CEO n° 4.
 *
 * DEUX TEMPS, PAS UN BOUTON
 *
 * Une reprise en masse qui s'exécute d'un clic est exactement ce qu'un cabinet ne
 * peut pas défendre en vérification. On montre d'abord ce que ça donnerait, en
 * chiffres, et on n'écrit que sur un second geste. C'est U1 : séquencer plutôt que
 * déverser.
 *
 * La bannière disparaît d'elle-même quand il n'y a plus rien à reprendre. Elle
 * n'est pas un réglage, c'est une dette ponctuelle.
 */
export function RepriseHistoriqueBanniere({ compte }: { compte: number }) {
  const t = useTranslations("accountingUi");
  const { formatCurrency } = useFormatteurs();
  const router = useRouter();
  const [resume, setResume] = useState<{
    examinees: number;
    estimees: number;
    sansTaxe: number;
    taxeEstimee: number;
  } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, startTransition] = useTransition();

  if (compte === 0) return null;

  function simuler() {
    setErreur(null);
    startTransition(async () => {
      const r = await simulerRepriseTaxes();
      if (!r.success) setErreur(r.error);
      else setResume(r.resume);
    });
  }

  function appliquer() {
    setErreur(null);
    startTransition(async () => {
      const r = await appliquerRepriseTaxes();
      if (!r.success) {
        setErreur(r.error);
        return;
      }
      setResume(null);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-si-line bg-si-surface px-4 py-3.5">
      <p className="text-[13px] text-si-ink">
        {t("repriseTitre", { n: compte })}
      </p>
      <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-si-muted">
        {t("repriseExplication")}
      </p>

      {/* Le résultat de la simulation, en chiffres, avant toute écriture. */}
      {resume ? (
        <p className="mt-2.5 text-[13px] text-si-ink">
          {t("repriseSimulation", {
            estimees: resume.estimees,
            sansTaxe: resume.sansTaxe,
          })}{" "}
          <span className="tabular-nums">{formatCurrency(resume.taxeEstimee)}</span>{" "}
          {t("repriseSimulationTaxe")}
        </p>
      ) : null}

      {erreur ? (
        <p className="mt-2 text-[13px] text-si-danger-ink" role="alert">
          {erreur}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {resume ? (
          <Button type="button" variant="primary" size="sm" disabled={enCours} onClick={appliquer}>
            {t("repriseAppliquer")}
          </Button>
        ) : (
          <Button type="button" variant="secondary" size="sm" disabled={enCours} onClick={simuler}>
            {t("repriseSimuler")}
          </Button>
        )}
      </div>
    </div>
  );
}
