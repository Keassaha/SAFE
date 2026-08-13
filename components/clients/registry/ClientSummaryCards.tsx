"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils/format";
import { toIntlLocale } from "@/lib/i18n/locale";

interface ClientSummaryCardsProps {
  totalClients: number;
  activeClients: number;
  activeCasesCount: number;
  unbilledAmount: number;
}

/**
 * Barre de synthèse du registre clients.
 *
 * Ce n'était pas une barre : c'étaient quatre cartes à icône qui se soulevaient
 * au survol et entraient en cascade. Elles poussaient la liste sous la ligne de
 * flottaison alors que la liste EST la page (refonte §9.1). Les quatre mesures
 * sont conservées, leur poids visuel ne l'est pas : plus de cadre, plus
 * d'icône, plus de mouvement. La respiration vient de l'espace et d'un filet.
 */
export function ClientSummaryCards({
  totalClients,
  activeClients,
  activeCasesCount,
  unbilledAmount,
}: ClientSummaryCardsProps) {
  const t = useTranslations("clients");
  const locale = useLocale();
  const intlLocale = toIntlLocale(locale);
  const activePercent = totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0;

  const mesures = [
    {
      label: t("totalClients"),
      valeur: totalClients.toLocaleString(intlLocale),
      appoint: null as string | null,
      appointVerifie: false,
    },
    {
      label: t("activeClients"),
      valeur: activeClients.toLocaleString(intlLocale),
      appoint: `${activePercent} %`,
      appointVerifie: true,
    },
    {
      label: t("activeMatters"),
      valeur: activeCasesCount.toLocaleString(intlLocale),
      appoint: null,
      appointVerifie: false,
    },
    {
      label: t("unbilledAmount"),
      valeur: formatCurrency(unbilledAmount, "CAD", locale),
      appoint: null,
      appointVerifie: false,
    },
  ];

  return (
    /* Une seule colonne sous 400 px : à deux colonnes, un montant à sept
       chiffres pousse la page en défilement horizontal (MB3, reflow 320 px). */
    <dl className="grid grid-cols-1 gap-x-8 gap-y-4 border-b border-si-line pb-5 min-[400px]:grid-cols-2 sm:gap-y-5 lg:flex lg:gap-x-12">
      {mesures.map(({ label, valeur, appoint, appointVerifie }) => (
        <div key={label} className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-si-muted">
            {label}
          </dt>
          <dd className="mt-1.5 flex items-baseline gap-2">
            {/* 18 px sous `sm` : « 1 325 636,55 $ » ne tient pas en 22 px dans
                une demi-colonne de 375 px, et un montant qui déborde de la
                page est pire qu'un montant plus petit. */}
            <span className="font-mono text-[18px] leading-[24px] font-medium text-si-ink tabular-nums sm:text-[22px] sm:leading-[26px]">
              {valeur}
            </span>
            {appoint && (
              <span
                className={`text-[12px] ${appointVerifie ? "text-si-verified" : "text-si-muted"}`}
              >
                {appoint}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
