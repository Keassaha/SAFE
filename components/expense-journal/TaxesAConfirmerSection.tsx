"use client";
import { useFormatteurs } from "@/lib/i18n/formatteurs";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  RegistreFeuille,
  registreHeadRowClass,
  registreHeadCellClass,
  registreRowClass,
  registreCellClass,
  registreCellMutedClass,
  registreCellNumClass,
  RegistrePlainHeader,
  RegistreAucunResultat,
} from "@/components/ui/registre";
import { Button } from "@/components/ui/Button";
import { ConfirmerTaxeModal } from "./ConfirmerTaxeModal";
import { RepriseHistoriqueBanniere } from "./RepriseHistoriqueBanniere";
import { editCabinetExpense } from "@/app/(app)/journal/depenses/actions";

/**
 * Les dépenses dont la taxe n'est qu'estimée.
 *
 * Spec : docs/accounting/SPEC_DEPENSES_ET_PREPARATION_FISCALE.md §2.1, lot 1.
 *
 * UNE INTENTION (§0 M2) : confirmer la taxe. Cette liste SE VIDE, elle ne se
 * consulte pas. C'est la contrepartie à l'écran du fait qu'une taxe estimée n'est
 * pas réclamable : tant qu'une ligne est ici, l'argent qu'elle porte n'est pas
 * récupérable, et le cabinet remet trop.
 *
 * Le montant en tête n'est pas une décoration : c'est la somme en jeu, et c'est ce
 * qui justifie d'ouvrir la liste plutôt que de la refermer.
 */

export type DepenseATaxeEstimee = {
  id: string;
  date: string;
  libelle: string;
  categorieName: string | null;
  montant: number;
  tps: number;
  tvq: number;
};

export function TaxesAConfirmerSection({
  depenses,
  sansOrigine,
  canWrite = true,
}: {
  depenses: DepenseATaxeEstimee[];
  /** Dépenses antérieures au lot 1, dont la taxe n'a jamais été calculée. */
  sansOrigine: number;
  canWrite?: boolean;
}) {
  const t = useTranslations("accountingUi");
  const { formatCurrency, formatCalendarDate } = useFormatteurs();
  const router = useRouter();
  const [cible, setCible] = useState<DepenseATaxeEstimee | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, startTransition] = useTransition();

  const enJeu = depenses.reduce((s, d) => s + d.tps + d.tvq, 0);

  function confirmer(choix: { tps: number; tvq: number } | { sansTaxe: true }) {
    if (!cible) return;
    setErreur(null);
    startTransition(async () => {
      const res = await editCabinetExpense(
        cible.id,
        "sansTaxe" in choix ? { sansTaxe: true } : { tps: choix.tps, tvq: choix.tvq },
      );
      if (!res.success) {
        setErreur(res.error);
        return;
      }
      setCible(null);
      router.refresh();
    });
  }

  return (
    <section className="space-y-3">
      {/* Contexte, puis information décisive, puis action (§5 H3). Le compte et le
          montant en jeu tiennent sur une ligne : deux chiffres, pas quatre tuiles. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-serif text-[19px] text-si-ink">{t("taxesAConfirmerTitre")}</h2>
        {depenses.length > 0 ? (
          <p className="text-[13px] text-si-muted">
            {t("taxesAConfirmerCompte", { n: depenses.length })} ·{" "}
            <span className="tabular-nums text-si-ink">{formatCurrency(enJeu)}</span>{" "}
            {t("taxesAConfirmerEnJeu")}
          </p>
        ) : null}
      </div>

      <p className="max-w-2xl text-[13px] leading-relaxed text-si-muted">
        {t("taxesAConfirmerExplication")}
      </p>

      {/* La dette d'historique passe AVANT la file : tant qu'elle n'est pas
          reprise, la file ci-dessous est incomplète et le total sous-évalué. */}
      {canWrite ? <RepriseHistoriqueBanniere compte={sansOrigine} /> : null}

      <RegistreFeuille ariaLabel={t("taxesAConfirmerTitre")}>
        {depenses.length === 0 ? (
          <RegistreAucunResultat message={t("taxesAConfirmerVide")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className={registreHeadRowClass}>
                  <th className={registreHeadCellClass}>
                    <RegistrePlainHeader label={t("colDate")} />
                  </th>
                  {/* Colonne porteuse large, métadonnées comprimées (§10 A15). */}
                  <th className={`${registreHeadCellClass} w-[40%]`}>
                    <RegistrePlainHeader label={t("colDepense")} />
                  </th>
                  <th className={registreHeadCellClass}>
                    <RegistrePlainHeader label={t("colCategorie")} />
                  </th>
                  <th className={registreHeadCellClass}>
                    <RegistrePlainHeader label={t("colMontant")} align="right" />
                  </th>
                  <th className={registreHeadCellClass}>
                    <RegistrePlainHeader label={t("colTaxeEstimee")} align="right" />
                  </th>
                  <th className={registreHeadCellClass}>
                    <span className="sr-only">{t("taxeConfirmerAction")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {depenses.map((d) => (
                  <tr key={d.id} className={registreRowClass}>
                    <td className={`${registreCellMutedClass} whitespace-nowrap`}>
                      {formatCalendarDate(d.date)}
                    </td>
                    <td className={registreCellClass}>{d.libelle}</td>
                    <td className={registreCellMutedClass}>{d.categorieName ?? "—"}</td>
                    <td className={registreCellNumClass}>{formatCurrency(d.montant)}</td>
                    <td className={registreCellNumClass}>
                      {/* La taxe estimée est atténuée : elle est là pour aider à
                          reconnaître le montant sur le reçu, pas pour faire nombre. */}
                      <span className="text-si-muted">{formatCurrency(d.tps + d.tvq)}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {canWrite ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setErreur(null);
                            setCible(d);
                          }}
                        >
                          {t("taxeConfirmerAction")}
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </RegistreFeuille>

      <ConfirmerTaxeModal
        open={cible !== null}
        onClose={() => setCible(null)}
        onConfirm={confirmer}
        submitting={enCours}
        error={erreur}
        depense={
          cible
            ? {
                date: cible.date,
                libelle: cible.libelle,
                montant: cible.montant,
                tpsEstimee: cible.tps,
                tvqEstimee: cible.tvq,
              }
            : null
        }
      />
    </section>
  );
}
