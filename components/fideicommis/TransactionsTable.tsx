"use client";

import { useTranslations } from "next-intl";
import { useFormatteurs } from "@/lib/i18n/formatteurs";
import { useTrustTransactions, type TrustTransactionRow } from "@/lib/hooks/useFideicommis";
import { clientDisplayName } from "@/lib/clients/normalize-name";
import {
  RegistreAucunResultat,
  RegistreBarreOutils,
  RegistreFeuille,
  RegistrePagination,
  registreCellClass,
  registreCellMutedClass,
  registreCellNumClass,
  registreChampClass,
  registreHeadCellClass,
  registreHeadRowClass,
  registreRowClass,
  registreSelectClass,
  RegistrePlainHeader,
  usePaginationLocale,
} from "@/components/ui/registre";

export interface FiltresOperations {
  clientId: string;
  dossierId: string;
  dateFrom: string;
  dateTo: string;
}

export type OperationRangee = Pick<
  TrustTransactionRow,
  "id" | "date" | "amount" | "type" | "balanceAfter" | "description" | "note" | "reference" | "client" | "dossier"
>;

/**
 * Le grand livre du fidéicommis, dans la grammaire du registre.
 *
 * Sept colonnes au lieu de neuf : le dossier se lit sous le client, la
 * référence sous la description. Dépôt, Retrait et Solde restent trois
 * colonnes, parce que c'est la forme du grand livre qu'un inspecteur lit.
 * Une correction se signale en ambre et en toutes lettres.
 */
export function TrustTransactionsRegistre({ rangees }: { rangees: OperationRangee[] }) {
  const tf = useTranslations("fideicommis");
  const tc = useTranslations("common");
  const { formatCurrency, formatCalendarDate } = useFormatteurs();
  const TYPE_LABELS: Record<string, string> = {
    deposit: tf("typeDeposit"),
    withdrawal: tf("typeWithdrawal"),
    correction: tf("typeCorrection"),
  };
  return (
    <div className="overflow-x-auto">
      {/* Largeurs fixées : sans elles, un intitulé de dossier long poussait le
          tableau hors de l'écran au lieu de se tronquer dans sa cellule. */}
      <table className="w-full min-w-[960px] table-fixed border-collapse">
        <thead>
          <tr className={registreHeadRowClass}>
            <th scope="col" className={`w-[112px] ${registreHeadCellClass}`}>
              <RegistrePlainHeader label={tc("date")} />
            </th>
            <th scope="col" className={`w-[30%] ${registreHeadCellClass}`}>
              <RegistrePlainHeader label={tf("colClientMatter")} />
            </th>
            <th scope="col" className={`w-[110px] ${registreHeadCellClass}`}>
              <RegistrePlainHeader label={tc("type")} />
            </th>
            <th scope="col" className={registreHeadCellClass}>
              <RegistrePlainHeader label={tf("colDescriptionReference")} />
            </th>
            <th scope="col" className={`w-[140px] ${registreHeadCellClass} text-right`}>
              <RegistrePlainHeader label={tf("typeDeposit")} align="right" />
            </th>
            <th scope="col" className={`w-[140px] ${registreHeadCellClass} text-right`}>
              <RegistrePlainHeader label={tf("typeWithdrawal")} align="right" />
            </th>
            <th scope="col" className={`w-[150px] ${registreHeadCellClass} text-right`}>
              <RegistrePlainHeader label={tc("balance")} align="right" />
            </th>
          </tr>
        </thead>
        <tbody>
          {rangees.map((t) => {
            const correction = t.type === "correction";
            const description = t.description ?? t.note ?? null;
            return (
              <tr key={t.id} className={registreRowClass}>
                <td className={`whitespace-nowrap ${registreCellMutedClass}`}>{formatCalendarDate(t.date)}</td>
                <td className={registreCellClass}>
                  <span className="block truncate text-[14px] font-medium leading-5 text-si-ink">
                    {t.client ? clientDisplayName(t.client) : "—"}
                  </span>
                  <span className="block truncate text-[12px] leading-4 text-si-muted">
                    {t.dossier ? (
                      <>
                        {t.dossier.numeroDossier ? <span className="font-mono">{t.dossier.numeroDossier} · </span> : null}
                        {t.dossier.intitule}
                      </>
                    ) : (
                      tf("noMatter")
                    )}
                  </span>
                </td>
                <td className={`whitespace-nowrap ${registreCellMutedClass} ${correction ? "font-medium text-si-amber-ink" : ""}`}>
                  {TYPE_LABELS[t.type] ?? t.type}
                </td>
                <td className={registreCellClass}>
                  {description ? (
                    <span className="block truncate" title={description}>
                      {description}
                    </span>
                  ) : (
                    <span className="text-si-muted">—</span>
                  )}
                  {t.reference ? (
                    <span className="block font-mono text-[12px] leading-4 text-si-muted">{t.reference}</span>
                  ) : null}
                </td>
                <td className={`whitespace-nowrap ${registreCellNumClass}`}>
                  {t.amount > 0 ? formatCurrency(t.amount) : <span className="text-si-muted">—</span>}
                </td>
                <td className={`whitespace-nowrap ${registreCellNumClass}`}>
                  {t.amount < 0 ? formatCurrency(Math.abs(t.amount)) : <span className="text-si-muted">—</span>}
                </td>
                <td className={`whitespace-nowrap ${registreCellNumClass}`}>
                  {t.balanceAfter != null ? formatCurrency(t.balanceAfter) : <span className="text-si-muted">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface TransactionsTableProps {
  cabinetId: string | null;
  clients: { id: string; raisonSociale: string | null; prenom: string | null; nom: string | null }[];
  dossiers: { id: string; clientId: string; intitule: string; numeroDossier: string | null }[];
  filtres: FiltresOperations;
  onFiltres: (f: FiltresOperations) => void;
}

/** Le registre branché : filtres dans la barre, pagination par 20. */
export function TransactionsTable({ cabinetId, clients, dossiers, filtres, onFiltres }: TransactionsTableProps) {
  const tf = useTranslations("fideicommis");
  const tc = useTranslations("common");
  const { data, isLoading } = useTrustTransactions(cabinetId, {
    clientId: filtres.clientId || undefined,
    dossierId: filtres.dossierId || undefined,
    dateFrom: filtres.dateFrom || undefined,
    dateTo: filtres.dateTo || undefined,
    limit: 200,
  });
  const transactions = data?.transactions ?? [];
  const page = usePaginationLocale(transactions);
  const dossiersDuClient = filtres.clientId ? dossiers.filter((d) => d.clientId === filtres.clientId) : dossiers;
  const filtreActif = Boolean(filtres.clientId || filtres.dossierId || filtres.dateFrom || filtres.dateTo);

  return (
    <RegistreFeuille ariaLabel={tf("registerLabel")}>
      {/* Les deux listes occupent l'emplacement de la recherche, plafonné à
          384 px pour un champ texte : elles s'y empilaient. `rechercheLarge`
          lève le plafond, et les deux tiennent sur une ligne (2026-10-01). */}
      <RegistreBarreOutils
        rechercheLarge
        recherche={
          <div className="flex flex-wrap gap-2 lg:flex-nowrap">
            <select
              value={filtres.clientId}
              onChange={(e) => onFiltres({ ...filtres, clientId: e.target.value, dossierId: "" })}
              aria-label={tc("client")}
              className={`${registreSelectClass} max-w-[240px]`}
            >
              <option value="">{tf("filterClientAll")}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {clientDisplayName(c)}
                </option>
              ))}
            </select>
            <select
              value={filtres.dossierId}
              onChange={(e) => onFiltres({ ...filtres, dossierId: e.target.value })}
              aria-label={tc("dossier")}
              className={`${registreSelectClass} max-w-[240px]`}
            >
              <option value="">{tf("filterMatterAll")}</option>
              {dossiersDuClient.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.numeroDossier ? `${d.numeroDossier} – ` : ""}
                  {d.intitule}
                </option>
              ))}
            </select>
          </div>
        }
        filtres={
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-[13px] text-si-muted">
              {tf("filterFrom")}
              <input
                type="date"
                value={filtres.dateFrom}
                onChange={(e) => onFiltres({ ...filtres, dateFrom: e.target.value })}
                className={`${registreChampClass} px-2`}
              />
            </label>
            <label className="flex items-center gap-1.5 text-[13px] text-si-muted">
              {tf("filterTo")}
              <input
                type="date"
                value={filtres.dateTo}
                onChange={(e) => onFiltres({ ...filtres, dateTo: e.target.value })}
                className={`${registreChampClass} px-2`}
              />
            </label>
            <span className="text-[13px] text-si-muted">{tf("operationsCount", { count: transactions.length })}</span>
          </div>
        }
      />
      {isLoading ? (
        <p className="px-6 py-10 text-center text-sm text-si-muted" role="status">
          {tc("loading")}
        </p>
      ) : transactions.length === 0 ? (
        <RegistreAucunResultat message={filtreActif ? tf("noOperationsMatch") : tf("noTransactions")} />
      ) : (
        <>
          <TrustTransactionsRegistre rangees={page.tranche} />
          <RegistrePagination
            totalCount={page.total}
            currentPage={page.page}
            resume={tc("paginationRange", { start: page.debut + 1, end: page.fin, total: page.total })}
            labelPage={tc("paginationPage", { current: page.page, total: page.totalPages })}
            labelPrecedent={tc("previous")}
            labelSuivant={tc("next")}
            onPageChange={page.setPage}
          />
        </>
      )}
    </RegistreFeuille>
  );
}
