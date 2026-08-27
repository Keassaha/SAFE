"use client";

import { useTranslations } from "next-intl";
import { useFormatteurs } from "@/lib/i18n/formatteurs";

interface DossierSummaryCardsProps {
  totalDossiers: number;
  actifsCount: number;
  cloturesCount: number;
  totalActes?: number;
  actesEnCours?: number;
  actesUrgents?: number;
  actesTermines?: number;
}

/**
 * Barre de synthèse du registre dossiers.
 *
 * Ce n'était pas une barre : c'étaient sept cartes à icône, à 16 px d'arrondi
 * là où le référentiel §2.4 en demande 8 à 10, qui se soulevaient au survol
 * sans être cliquables et entraient en cascade. Elles poussaient la liste sous
 * la ligne de flottaison alors que la liste EST la page. C'est le même geste
 * que la refonte §9.1 a fait sur les clients, puis sur la facturation ; les
 * dossiers étaient le dernier écran à ne pas l'avoir suivi.
 *
 * ── Ce que la refonte décide en plus ────────────────────────────────────────
 *
 * DEUX FAMILLES, PAS UNE SÉRIE DE SEPT. Trois de ces mesures comptent des
 * dossiers, quatre comptent des actes. Alignées à intervalle égal, elles se
 * lisaient comme une seule suite, et « Terminés » semblait un état de dossier.
 * L'espace encode le groupe (E3) : écart court à l'intérieur d'une famille,
 * écart franc entre les deux. C'est aussi là que la ligne se replie quand la
 * largeur manque.
 *
 * LE POURCENTAGE PASSE PAR `Intl`. Il s'écrivait `${n}${t("ofTotal")}`, ce qui
 * donnait « 93% du total » sans l'espace que le français demande devant le
 * signe. `Intl` la pose, et ne pose rien en anglais.
 */
export function DossierSummaryCards({
  totalDossiers,
  actifsCount,
  cloturesCount,
  totalActes = 0,
  actesEnCours = 0,
  actesUrgents = 0,
  actesTermines = 0,
}: DossierSummaryCardsProps) {
  const t = useTranslations("matters");
  const { intlLocale } = useFormatteurs();

  const pourcent = (part: number, tout: number) =>
    new Intl.NumberFormat(intlLocale, { style: "percent" }).format(tout > 0 ? part / tout : 0);

  const familles: {
    cle: string;
    label: string;
    valeur: number;
    appoint: string | null;
    attention?: boolean;
  }[][] = [
    [
      { cle: "total", label: t("totalMatters"), valeur: totalDossiers, appoint: null },
      {
        cle: "actifs",
        label: t("activeMatters"),
        valeur: actifsCount,
        appoint: `${pourcent(actifsCount, totalDossiers)} ${t("ofTotal")}`,
      },
      { cle: "clotures", label: t("closedMatters"), valeur: cloturesCount, appoint: null },
    ],
    [
      {
        cle: "actes",
        label: t("totalActs"),
        valeur: totalActes,
        appoint: `${pourcent(actesTermines, totalActes)} ${t("completed")}`,
      },
      { cle: "encours", label: t("inProgress"), valeur: actesEnCours, appoint: null },
      {
        cle: "urgents",
        label: t("urgentOverdue"),
        valeur: actesUrgents,
        appoint: null,
        /* L'ambre ne s'allume qu'au-dessus de zéro : « 0 acte urgent » est une
           bonne nouvelle, pas une alerte. Le libellé porte le sens des deux
           côtés, donc la couleur ne travaille jamais seule (C3, WCAG 1.4.1). */
        attention: actesUrgents > 0,
      },
      { cle: "termines", label: t("completed2"), valeur: actesTermines, appoint: null },
    ],
  ];

  return (
    <dl className="flex flex-col gap-y-5 border-b border-si-line pb-5 lg:flex-row lg:gap-x-14">
      {familles.map((famille, i) => (
        <div
          key={i}
          className="grid grid-cols-2 gap-x-8 gap-y-4 min-[560px]:grid-cols-4 lg:flex lg:gap-x-8"
        >
          {famille.map(({ cle, label, valeur, appoint, attention }) => (
            <div key={cle} className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-si-muted">
                {label}
              </dt>
              <dd className="mt-1.5 flex items-baseline gap-2">
                {/* 18 px sous `sm` : un nombre à cinq chiffres ne tient pas en
                    22 px dans une demi-colonne de 375 px. */}
                <span
                  className={`font-mono text-[18px] font-medium leading-[24px] tabular-nums sm:text-[22px] sm:leading-[26px] ${
                    attention ? "text-si-amber-ink" : "text-si-ink"
                  }`}
                >
                  {valeur.toLocaleString(intlLocale)}
                </span>
                {appoint && <span className="truncate text-[12px] text-si-muted">{appoint}</span>}
              </dd>
            </div>
          ))}
        </div>
      ))}
    </dl>
  );
}
