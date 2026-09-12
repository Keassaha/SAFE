"use client";

/**
 * SAFE — Le tableau des dépenses du cabinet.
 *
 * Le journal des dépenses affichait `ExpensesJournalTable`, qui liste les
 * lignes d'un relevé bancaire importé (`BankImportTransaction`). Un cabinet
 * qui n'importe pas de relevé y lisait « aucune transaction » avec treize
 * dépenses en base. Ce tableau-ci montre les dépenses.
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Paperclip } from "lucide-react";
import { useFormatteurs } from "@/lib/i18n/formatteurs";
import type { DepenseListe } from "@/lib/expense-journal/charger";
import {
  etatDepense,
  etatTaxe,
  taxeTotale,
  type EtatDepense,
} from "@/lib/expense-journal/etat-depense";

interface DepensesTableProps {
  depenses: DepenseListe[];
  categories: Array<{ id: string; name: string }>;
}

/** Les mois présents dans les données, du plus récent au plus ancien. */
function moisDisponibles(depenses: DepenseListe[]): string[] {
  const vus = new Set<string>();
  for (const d of depenses) vus.add(d.date.slice(0, 7));
  return [...vus].sort().reverse();
}

export function DepensesTable({ depenses, categories }: DepensesTableProps) {
  const t = useTranslations("expenseJournal");
  const { formatCurrency, intlLocale } = useFormatteurs();

  const mois = useMemo(() => moisDisponibles(depenses), [depenses]);
  const [moisChoisi, setMoisChoisi] = useState<string>("");
  const [categorie, setCategorie] = useState<string>("");
  const [etat, setEtat] = useState<EtatDepense | "">("");

  const visibles = useMemo(
    () =>
      depenses.filter((d) => {
        if (moisChoisi && d.date.slice(0, 7) !== moisChoisi) return false;
        if (categorie === "__sans__" ? d.categoryName !== null : categorie && d.categoryName !== categorie) {
          return false;
        }
        if (etat && etatDepense(d) !== etat) return false;
        return true;
      }),
    [depenses, moisChoisi, categorie, etat],
  );

  const total = visibles.reduce((somme, d) => somme + d.montant, 0);
  /* Ce qui est inscrit mais pas encore validé n'est PAS encore dans les livres :
     le bandeau « Dépenses » du haut de page compte le journal général, ce
     tableau compte tout ce qui est saisi. Sans cette phrase, l'écran affiche
     deux totaux différents et laisse deviner lequel est le bon. */
  const horsLivres = visibles
    .filter((d) => etatDepense(d) !== "validee")
    .reduce((somme, d) => somme + d.montant, 0);

  const nomDuMois = (aaaaMm: string) => {
    const [a, m] = aaaaMm.split("-").map(Number);
    return new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric" }).format(
      new Date(a, m - 1, 1),
    );
  };

  const jour = (iso: string) =>
    new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "short", timeZone: "UTC" }).format(
      new Date(iso),
    );

  const champ =
    "h-tap rounded-md border border-si-line bg-si-surface2 px-3 text-[12.5px] text-si-body outline-none transition-colors hover:border-si-muted focus:border-si-border-strong";

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <select value={moisChoisi} onChange={(e) => setMoisChoisi(e.target.value)} className={champ}>
          <option value="">{t("allMonths")}</option>
          {mois.map((m) => (
            <option key={m} value={m}>
              {nomDuMois(m)}
            </option>
          ))}
        </select>
        <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className={champ}>
          <option value="">{t("allCategories")}</option>
          <option value="__sans__">{t("uncategorized")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={etat}
          onChange={(e) => setEtat(e.target.value as EtatDepense | "")}
          className={champ}
        >
          <option value="">{t("allStates")}</option>
          <option value="a_classer">{t("stateToSort")}</option>
          <option value="a_valider">{t("stateToValidate")}</option>
          <option value="validee">{t("stateValidated")}</option>
        </select>
        <p className="ml-auto text-[12.5px] text-si-muted">
          <span className="tabular-nums">
            {t("countAndTotal", { count: visibles.length, total: formatCurrency(total) })}
          </span>
          {horsLivres > 0 && (
            <span className="tabular-nums text-si-amber-ink">
              {" · "}
              {t("notInBooksYet", { amount: formatCurrency(horsLivres) })}
            </span>
          )}
        </p>
      </div>

      {/* Les colonnes ont des largeurs fixes : sous ~780 px, c'est la PAGE qui
          se mettrait à défiler de gauche à droite. */}
      <div className="-mx-1 overflow-x-auto px-1">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="border-b border-si-ink">
              <th className={enTete}>{t("colDate")}</th>
              <th className={enTete}>{t("colSupplier")}</th>
              <th className={enTete}>{t("colCategory")}</th>
              <th className={`${enTete} text-right`}>{t("colTaxes")}</th>
              <th className={`${enTete} text-right`}>{t("colAmount")}</th>
              <th className={`${enTete} text-center`}>{t("colReceipt")}</th>
              <th className={enTete}>{t("colState")}</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((d) => {
              const e = etatDepense(d);
              const taxe = etatTaxe(d);
              return (
                <tr key={d.id} className="border-b border-si-line last:border-b-0">
                  <td className="whitespace-nowrap px-2 py-2.5 text-[13px] text-si-muted">
                    {jour(d.date)}
                  </td>
                  <td className="px-2 py-2.5 text-[13.5px] text-si-ink">{d.libelle}</td>
                  <td className="px-2 py-2.5 text-[13px]">
                    {d.categoryName ? (
                      <span className="text-si-body">{d.categoryName}</span>
                    ) : (
                      <span className="text-si-muted">—</span>
                    )}
                  </td>
                  {/* La taxe et son statut vont ENSEMBLE : un montant de taxe
                      sans dire s'il est réclamable n'apprend rien. */}
                  <td className="whitespace-nowrap px-2 py-2.5 text-right text-[13px] tabular-nums">
                    {taxe === "sans_taxe" ? (
                      <span className="text-si-subtle">{t("taxNone")}</span>
                    ) : taxe === "inconnue" ? (
                      <span className="text-si-subtle">{t("taxUnknown")}</span>
                    ) : (
                      <>
                        <span className="text-si-ink">{formatCurrency(taxeTotale(d))}</span>
                        <span
                          className={`ml-2 rounded px-1.5 py-0.5 text-[10.5px] ${
                            taxe === "confirmee"
                              ? "text-si-verified"
                              : "bg-si-amber/[0.13] text-si-amber-ink"
                          }`}
                        >
                          {taxe === "confirmee" ? t("taxConfirmed") : t("taxEstimated")}
                        </span>
                      </>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-right text-[13.5px] font-medium tabular-nums text-si-ink">
                    {formatCurrency(d.montant)}
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    {d.aUnePiece ? (
                      <Paperclip
                        size={13}
                        className="inline-block text-si-muted"
                        aria-label={t("colReceipt")}
                      />
                    ) : (
                      <span className="text-si-subtle">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-[12px]">
                    <span
                      className={`mr-1.5 inline-block h-[5px] w-[5px] rounded-full align-middle ${
                        e === "validee" ? "bg-si-verified" : "bg-si-amber"
                      }`}
                      aria-hidden
                    />
                    <span className={e === "validee" ? "text-si-muted" : "text-si-amber-ink"}>
                      {e === "validee"
                        ? t("stateValidated")
                        : e === "a_valider"
                          ? t("stateToValidate")
                          : t("stateToSort")}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {visibles.length === 0 && (
        <p className="px-2 py-6 text-[13px] text-si-muted">
          {depenses.length === 0 ? t("noExpensesYet") : t("noExpensesForFilters")}
        </p>
      )}
    </div>
  );
}

const enTete =
  "px-2 pb-2 pt-2.5 text-left text-[10px] font-medium uppercase tracking-[0.08em] text-si-muted";
