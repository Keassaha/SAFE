"use client";

import { AlertTriangle, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils/format";
import {
  registreHeadRowClass,
  registreHeadCellClass,
  registreRowClass,
  registreCellClass,
  registreCellMutedClass,
  registreCellNumClass,
  RegistrePlainHeader,
} from "@/components/ui/registre";
import type { DossierFinAnnee } from "@/lib/rapports/dossier-fin-annee";

/**
 * Le dossier de fin d'année.
 *
 * Spec : docs/accounting/SPEC_DEPENSES_ET_PREPARATION_FISCALE.md §3 (lot 4).
 *
 * CE QU'IL REMPLACE
 *
 * Quatre lignes, toutes du côté revenus, sous un titre qui promettait un rapport
 * d'impôts. Un écran qui donne le sentiment d'être prêt sans porter la moindre
 * déduction est pire qu'un écran absent.
 *
 * ORDRE DE LECTURE
 *
 * Le net à remettre d'abord : c'est le chiffre qui n'existait nulle part, et celui
 * pour lequel on ouvre cette page. Les zones d'incertitude juste après, parce
 * qu'elles QUALIFIENT ce chiffre : les repousser en bas de page reviendrait à
 * présenter un total comme définitif alors qu'il ne l'est pas. Le détail ensuite.
 */
export function DossierFinAnneeSection({ dossier }: { dossier: DossierFinAnnee }) {
  const t = useTranslations("reportsUi");
  const { taxes, revenus, totaux, depensesParCategorie, incertitudes, sansPiece } = dossier;

  return (
    <div className="space-y-6">
      <h3 className="flex items-center gap-2 text-sm font-medium tracking-tight text-si-ink">
        <FileText className="h-4 w-4" aria-hidden />
        {t("dossierFinAnneeTitre", { year: dossier.annee })}
      </h3>

      {/* ── Le chiffre pour lequel on ouvre la page ────────────────────────── */}
      <div className="rounded-lg border border-si-line bg-si-surface px-5 py-4">
        <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-si-muted">
          {t("netARemettre")}
        </p>
        <p className="mt-1 font-serif text-[28px] tabular-nums text-si-ink">
          {formatCurrency(taxes.netARemettre)}
        </p>
        <p className="mt-1.5 text-[13px] text-si-muted">
          {t("netARemettreDetail", {
            collectee: formatCurrency(taxes.collectee),
            payee: formatCurrency(taxes.payeeReclamable),
          })}
        </p>
      </div>

      {/* ── Ce qui qualifie le chiffre ci-dessus ───────────────────────────── */}
      {incertitudes.length > 0 ? (
        <section aria-label={t("zonesIncertitude")} className="space-y-2">
          <h4 className="flex items-center gap-1.5 text-[13px] font-medium text-si-ink">
            <AlertTriangle className="h-3.5 w-3.5 text-si-amber-ink" aria-hidden />
            {t("zonesIncertitude")}
          </h4>
          <ul className="space-y-2">
            {incertitudes.map((i) => (
              <li
                key={i.code}
                className="rounded-md border border-si-line bg-si-canvas px-3.5 py-2.5"
              >
                <p className="text-[13px] leading-relaxed text-si-ink">{i.message}</p>
                {i.nombre != null || i.montant != null ? (
                  <p className="mt-1 text-[12px] tabular-nums text-si-muted">
                    {[
                      i.nombre != null ? t("nDepenses", { n: i.nombre }) : null,
                      i.montant != null ? formatCurrency(i.montant) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ── Dépenses par catégorie ─────────────────────────────────────────── */}
      <section aria-label={t("depensesParCategorie")} className="space-y-2">
        <h4 className="text-[13px] font-medium text-si-ink">{t("depensesParCategorie")}</h4>
        {depensesParCategorie.length === 0 ? (
          <p className="text-[13px] text-si-muted">{t("aucuneDepense")}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-si-line bg-si-surface">
            <table className="w-full border-collapse">
              <thead>
                <tr className={registreHeadRowClass}>
                  {/* Colonne porteuse large, métadonnées comprimées. */}
                  <th className={`${registreHeadCellClass} w-[34%]`}>
                    <RegistrePlainHeader label={t("colCategorieRapport")} />
                  </th>
                  <th className={registreHeadCellClass}>
                    <RegistrePlainHeader label={t("colMontantHt")} align="right" />
                  </th>
                  <th className={registreHeadCellClass}>
                    <RegistrePlainHeader label={t("colTaxePayee")} align="right" />
                  </th>
                  <th className={registreHeadCellClass}>
                    <RegistrePlainHeader label={t("colTaxeRecuperable")} align="right" />
                  </th>
                  <th className={registreHeadCellClass}>
                    <RegistrePlainHeader label={t("colDeductible")} align="right" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {depensesParCategorie.map((l) => (
                  <tr key={l.code ?? l.nom} className={registreRowClass}>
                    <td className={registreCellClass}>
                      {l.nom}
                      <span className="ml-2 text-[12px] text-si-muted">
                        {t("nDepenses", { n: l.nombre })}
                      </span>
                    </td>
                    <td className={registreCellNumClass}>{formatCurrency(l.montantHt)}</td>
                    <td className={registreCellNumClass}>
                      <span className="text-si-muted">{formatCurrency(l.taxePayee)}</span>
                    </td>
                    <td className={registreCellNumClass}>{formatCurrency(l.taxeReclamable)}</td>
                    <td className={registreCellNumClass}>
                      {/* Un taux, jamais un montant : le plafond québécois
                          s'applique au cumul et n'est pas calculable ici. */}
                      {l.tauxDeductible == null
                        ? t("deductibleIndetermine")
                        : `${Math.round(l.tauxDeductible * 100)} %`}
                      {l.plafondApplicable ? (
                        <span className="ml-1 text-si-amber-ink" title={t("plafondInfobulle")}>
                          *
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-si-line">
                  <td className={`${registreCellClass} font-medium`}>{t("total")}</td>
                  <td className={`${registreCellNumClass} font-medium`}>
                    {formatCurrency(totaux.montantHt)}
                  </td>
                  <td className={registreCellNumClass}>{formatCurrency(totaux.taxePayee)}</td>
                  <td className={`${registreCellNumClass} font-medium`}>
                    {formatCurrency(totaux.taxeReclamable)}
                  </td>
                  <td className={registreCellMutedClass} />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Revenus et débours, en appui ───────────────────────────────────── */}
      <section aria-label={t("revenus")} className="grid gap-3 sm:grid-cols-3">
        {[
          { label: t("billedRevenueTotal"), value: revenus.factureHt },
          { label: t("paymentsReceived"), value: revenus.encaisse },
          { label: t("deboursRefactures"), value: dossier.deboursRefactures },
        ].map((c) => (
          <div key={c.label} className="rounded-md border border-si-line bg-si-surface px-4 py-3">
            <p className="text-[12px] text-si-muted">{c.label}</p>
            <p className="mt-0.5 tabular-nums text-[15px] text-si-ink">{formatCurrency(c.value)}</p>
          </div>
        ))}
      </section>

      <p className="text-[12px] leading-relaxed text-si-muted">
        {sansPiece.nombre > 0
          ? t("dossierNoteAvecPieces", { n: sansPiece.nombre })
          : t("dossierNote")}
      </p>
    </div>
  );
}
