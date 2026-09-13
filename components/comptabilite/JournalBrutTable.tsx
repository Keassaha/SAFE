"use client";
import { useFormatteurs } from "@/lib/i18n/formatteurs";

import { useTranslations } from "next-intl";
import { provenanceEcriture } from "@/lib/comptabilite/provenance";
import type { JournalEntryRow } from "@/types/journal";
import { JOURNAL_TRANSACTION_TYPE_LABELS } from "@/types/journal";
import { displayJournalAmounts } from "@/lib/accounting/journal-display";
import {
  RegistreAucunResultat,
  registreCellClass,
  registreCellMutedClass,
  registreCellNumClass,
  registreHeadCellClass,
  registreHeadRowClass,
  registreRowClass,
  RegistrePlainHeader,
} from "@/components/ui/registre";

/**
 * Le journal brut, vue par défaut depuis le 2026-09-09 : « en rouge on voit
 * que c'est sorti et en vert que c'est entré, c'est plus simple » (CEO).
 *
 * Il avait huit colonnes et ses propres classes ; le client se tronquait à
 * 180 px pour faire tenir le reste. Six colonnes dans la grammaire du
 * registre : le dossier sous le client, la pièce sous la provenance, et deux
 * montants qui gardent leurs couleurs. Demande CEO du 2026-09-12.
 */
export function JournalBrutTable({
  entries,
  onAnnuler,
}: {
  entries: JournalEntryRow[];
  /** Fourni ET au moins une ligne annulable : une colonne d'action apparaît. */
  onAnnuler?: (entry: JournalEntryRow) => void;
}) {
  const t = useTranslations("accountingUi");
  const { formatCurrency, formatCalendarDate } = useFormatteurs();
  const avecCorrection = Boolean(onAnnuler) && entries.some((e) => e.annulable);

  if (entries.length === 0) {
    return <RegistreAucunResultat message={`${t("emptyTitle")} ${t("emptyHint")}`} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] table-fixed border-collapse">
        <thead>
          <tr className={registreHeadRowClass}>
            <th scope="col" className={`w-[112px] ${registreHeadCellClass}`}><RegistrePlainHeader label={t("date")} /></th>
            <th scope="col" className={`w-[150px] ${registreHeadCellClass}`}><RegistrePlainHeader label={t("type")} /></th>
            <th scope="col" className={registreHeadCellClass}><RegistrePlainHeader label={t("colClientMatter")} /></th>
            <th scope="col" className={`w-[22%] ${registreHeadCellClass}`}><RegistrePlainHeader label={t("colSourceVoucher")} /></th>
            <th scope="col" className={`w-[140px] ${registreHeadCellClass} text-right`}><RegistrePlainHeader label={t("moneyIn")} align="right" /></th>
            <th scope="col" className={`w-[140px] ${registreHeadCellClass} text-right`}><RegistrePlainHeader label={t("moneyOut")} align="right" /></th>
            {avecCorrection ? (
              <th scope="col" className={`w-[120px] ${registreHeadCellClass} text-right`}>
                <span className="sr-only">{t("actions")}</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const display = displayJournalAmounts(e);
            const prov = provenanceEcriture(e);
            const piece = e.documentIdentifier ?? e.reference;
            return (
              <tr key={e.id} className={registreRowClass}>
                <td className={`whitespace-nowrap ${registreCellMutedClass}`}>{formatCalendarDate(e.dateTransaction)}</td>
                <td className={`whitespace-nowrap ${registreCellClass}`}>{JOURNAL_TRANSACTION_TYPE_LABELS[e.typeTransaction]}</td>
                <td className={registreCellClass}>
                  <span className="block truncate text-[14px] font-medium leading-5 text-si-ink" title={e.clientName ?? undefined}>
                    {e.clientName ?? <span className="font-normal text-si-muted">{t("firmOnly")}</span>}
                  </span>
                  {e.dossierLabel ? (
                    <span className="block truncate font-mono text-[12px] leading-4 text-si-muted" title={e.dossierLabel}>
                      {e.dossierLabel}
                    </span>
                  ) : null}
                </td>
                <td className={registreCellMutedClass}>
                  <span className="block truncate">{prov ?? "—"}</span>
                  {piece ? <span className="block truncate font-mono text-[12px] leading-4" title={piece}>{piece}</span> : null}
                </td>
                <td className={`whitespace-nowrap ${registreCellNumClass} text-si-verified`}>
                  {display.inAmount > 0 ? formatCurrency(display.inAmount) : <span className="text-si-muted">—</span>}
                </td>
                <td className={`whitespace-nowrap ${registreCellNumClass} text-si-danger-ink`}>
                  {display.outAmount > 0 ? formatCurrency(display.outAmount) : <span className="text-si-muted">—</span>}
                </td>
                {avecCorrection ? (
                  <td className={`whitespace-nowrap text-right ${registreCellClass}`}>
                    {e.annulable ? (
                      <button
                        type="button"
                        onClick={() => onAnnuler?.(e)}
                        className="min-h-tap inline-flex items-center rounded-md px-2 text-[13px] text-si-muted transition-colors hover:text-si-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified"
                      >
                        {t("cancelEntry")}
                      </button>
                    ) : (
                      <span className="text-[12px] text-si-muted">—</span>
                    )}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
