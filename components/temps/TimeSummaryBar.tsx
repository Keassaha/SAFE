"use client";

import { useLocale, useTranslations } from "next-intl";
import { useFormatteurs } from "@/lib/i18n/formatteurs";
import { formatHeuresDecimales } from "@/lib/temps/duree";

interface TimeSummaryBarProps {
  semaineMinutes: number;
  moisMinutes: number;
  nonFactureMontant: number;
  nonFactureCount: number;
  tauxFacturablePercent: number;
  loading?: boolean;
}

/**
 * Barre de synthèse du temps.
 *
 * Quatre cases en grille, cernées de filets, disaient quatre chiffres : ça
 * faisait tableur (A14). Même grammaire que la barre de la Facturation : pas de
 * cadre, un seul filet, le chiffre et son appoint côte à côte.
 * Demande CEO du 2026-09-12.
 */
export function TimeSummaryBar({
  semaineMinutes,
  moisMinutes,
  nonFactureMontant,
  nonFactureCount,
  tauxFacturablePercent,
  loading,
}: TimeSummaryBarProps) {
  const t = useTranslations("gestionCompUi");
  const tt = useTranslations("temps");
  const { formatCurrency, intlLocale } = useFormatteurs();
  const locale = useLocale();

  const heures = (minutes: number) => tt("hoursShort", { heures: formatHeuresDecimales(minutes, locale) });
  const mesures = [
    { cle: "semaine", label: t("metricThisWeek"), valeur: heures(semaineMinutes) },
    { cle: "mois", label: t("metricThisMonth"), valeur: heures(moisMinutes) },
    {
      cle: "a-facturer",
      label: tt("toBillShort"),
      valeur: formatCurrency(nonFactureMontant),
      appoint: tt("entriesPlural", { count: nonFactureCount }),
    },
    {
      cle: "facturable",
      label: tt("billableShort"),
      valeur: new Intl.NumberFormat(intlLocale, { style: "percent" }).format(tauxFacturablePercent / 100),
      appoint: tt("ofEntries"),
    },
  ];

  return (
    <dl
      aria-label={tt("summaryLabel")}
      aria-busy={loading || undefined}
      className="grid grid-cols-2 gap-x-8 gap-y-4 border-b border-si-line pb-5 sm:gap-y-5 lg:flex lg:gap-x-12"
    >
      {mesures.map(({ cle, label, valeur, appoint }) => (
        <div key={cle} className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-si-muted">{label}</dt>
          <dd className="mt-1.5 flex items-baseline gap-2">
            <span className="font-mono text-[18px] font-medium leading-[24px] tabular-nums text-si-ink sm:text-[22px] sm:leading-[26px]">
              {loading ? "—" : valeur}
            </span>
            {appoint && !loading ? <span className="truncate text-[12px] text-si-muted">{appoint}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
