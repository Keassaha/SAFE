"use client";

import { useTranslations } from "next-intl";
import { useFormatteurs } from "@/lib/i18n/formatteurs";

export interface FacturationMainKpisData {
  facturablesCount: number;
  facturablesSum: number;
  envoyeesCount: number;
  envoyeesSum: number;
  verificationCount: number;
  enRetardCount: number;
  enRetardSum: number;
  tauxEncaissement: number | undefined;
}

/**
 * Barre de synthèse de la facturation.
 *
 * Ce n'était pas une barre : c'étaient cinq cellules cliquables dans une grille
 * pleine, sans arrondi, qui se peignaient en gris au survol ET en gris à la
 * sélection. Les deux états portaient donc exactement la même marque, et le
 * filtre actif ne se distinguait pas d'une cellule survolée.
 *
 * Elles ne filtrent plus. Trois des cinq ne faisaient que doubler le sélecteur
 * de statut de la barre d'outils du registre, juste en dessous ; les deux
 * autres ne filtraient rien. Une mesure se lit, et ce qui se lit n'a pas besoin
 * d'affordance : la question de l'aplat gris disparaît avec le lien.
 *
 * La grammaire est celle du registre clients (`ClientSummaryCards`) : pas de
 * cadre, pas de grille, un seul filet, le chiffre et son appoint côte à côte.
 * `MetricTile` les poussait aux deux bouts de la cellule avec `justify-between`,
 * et l'œil devait traverser le vide pour relier « 15 » à « 33 282,12 $ ».
 */
export function FacturationMainKpis({ kpis }: { kpis: FacturationMainKpisData }) {
  const t = useTranslations("facturation");
  const { formatCurrency, intlLocale } = useFormatteurs();

  const mesures = [
    {
      cle: "billable",
      label: t("billable"),
      valeur: kpis.facturablesCount.toLocaleString(intlLocale),
      appoint: formatCurrency(kpis.facturablesSum),
    },
    {
      cle: "verification",
      label: t("verification"),
      valeur: kpis.verificationCount.toLocaleString(intlLocale),
      appoint: t("pendingApproval"),
    },
    {
      cle: "sent",
      label: t("sent"),
      valeur: kpis.envoyeesCount.toLocaleString(intlLocale),
      appoint: formatCurrency(kpis.envoyeesSum),
    },
    {
      cle: "overdue",
      label: t("overdue"),
      valeur: kpis.enRetardCount.toLocaleString(intlLocale),
      appoint: formatCurrency(kpis.enRetardSum),
      /* Un retard appelle un geste, donc il porte la couleur (C3). Zéro facture
         en retard n'appelle rien : le rouge serait une alerte sur une bonne
         nouvelle. Le libellé « En retard » double la couleur dans les deux cas,
         elle ne travaille jamais seule (WCAG 1.4.1). */
      attention: kpis.enRetardCount > 0,
    },
    {
      cle: "collection",
      label: t("collectionRate"),
      /* `${n} %` collait une espace PLEINE en Geist Mono, large comme un
         chiffre. `Intl` pose l'espace fine insecable en francais et rien en
         anglais, comme `formatCurrency` le fait deja pour le « $ ». */
      valeur:
        typeof kpis.tauxEncaissement === "number"
          ? new Intl.NumberFormat(intlLocale, { style: "percent" }).format(
              kpis.tauxEncaissement / 100,
            )
          : "—",
      appoint: t("paidIssued"),
    },
  ];

  return (
    /* Une seule colonne sous 400 px : à deux colonnes, « 33 282,12 $ » pousse la
       page en défilement horizontal (MB3, reflow à 320 px). */
    <dl
      aria-label={t("financialSummaryLabel")}
      className="grid grid-cols-1 gap-x-8 gap-y-4 border-b border-si-line pb-5 min-[400px]:grid-cols-2 sm:gap-y-5 lg:flex lg:gap-x-12"
    >
      {mesures.map(({ cle, label, valeur, appoint, attention }) => (
        <div key={cle} className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-si-muted">
            {label}
          </dt>
          <dd className="mt-1.5 flex items-baseline gap-2">
            {/* 18 px sous `sm` : un montant à sept chiffres ne tient pas en
                22 px dans une demi-colonne de 375 px. */}
            <span
              className={`font-mono text-[18px] font-medium leading-[24px] tabular-nums sm:text-[22px] sm:leading-[26px] ${
                attention ? "text-si-danger-ink" : "text-si-ink"
              }`}
            >
              {valeur}
            </span>
            <span className="truncate text-[12px] text-si-muted">{appoint}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
