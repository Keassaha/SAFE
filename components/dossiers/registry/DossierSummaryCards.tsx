"use client";

import { useTranslations } from "next-intl";

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
  actifsCount,
  cloturesCount,
  totalActes = 0,
  actesUrgents = 0,
}: DossierSummaryCardsProps) {
  const t = useTranslations("matters");

  /* ── Refonte du 2026-10-01 (déc. CEO, maquette validée) ────────────────────
     Les sept mesures en capitales deviennent une ligne d'état, comme celle du
     tableau de bord. Trois d'entre elles ne portaient rien : le total répétait
     actifs + clôturés, le pourcentage répétait le total, et « En cours » /
     « Terminés » ne demandent aucun geste depuis cette page. Restent ce qui
     situe le registre (actifs, clôturés) et ce qui appelle un geste : les
     actes urgents ou en retard, seuls en ambre, seulement au-dessus de zéro.
     Les props `totalDossiers`, `actesEnCours` et `actesTermines` restent
     acceptées pour ne pas casser l'appelant ; elles ne s'affichent plus. */
  const gras = (chunks: React.ReactNode) => <b className="font-medium text-si-ink">{chunks}</b>;

  const mentions: React.ReactNode[] = [
    t.rich("etatActifs", { count: actifsCount, b: gras }),
    t.rich("etatClotures", { count: cloturesCount, b: gras }),
    actesUrgents > 0 ? (
      <span className="inline-flex items-center gap-1.5 text-si-amber-ink">
        <span aria-hidden className="h-1.5 w-1.5 rounded-sm bg-si-amber" />
        {t("etatActesAlerte", { count: actesUrgents })}
      </span>
    ) : totalActes > 0 ? (
      t.rich("etatActesCalme", { count: totalActes, b: gras })
    ) : (
      t("etatAucunActe")
    ),
  ];

  /* « sm:!-mt-3 » : la page empile ses blocs en `space-y-6`, dont la règle
     est plus spécifique qu'une marge simple. Sur écran large, la ligne doit
     coller au titre comme celle du tableau de bord, pas flotter à 30 px
     dessous. Sur téléphone, les boutons passent sous le titre : la ligne
     garde alors l'écart qui la sépare d'eux. */
  return (
    <p className="-mt-2 sm:!-mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[13px] text-si-body">
      {mentions.map((m, i) => (
        /* Le point voyage avec la mention qui le suit : au repli, aucune
           ligne ne se termine sur un séparateur orphelin. */
        <span key={i} className="inline-flex items-center gap-3.5">
          {i > 0 && (
            <span aria-hidden className="text-si-subtle">
              ·
            </span>
          )}
          <span>{m}</span>
        </span>
      ))}
    </p>
  );
}
