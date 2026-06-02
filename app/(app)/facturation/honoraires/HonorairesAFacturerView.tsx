"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import { useFacturationHonoraires } from "@/lib/hooks/useFacturation";
import { useTempsContext } from "@/lib/hooks/useTemps";
import { MIN_AMOUNT_TO_BILL } from "@/lib/invoice-calculations";
import type { FacturationHonorairesQueryInput } from "@/lib/validations/facturation";
import { Search, Eye, FileText, FilePlus2, Loader2, ArrowLeft } from "lucide-react";

const ICON_BTN_BASE =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-base focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-forest-500 focus-visible:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed";
const ICON_BTN_OUTLINE =
  "border border-forest-700/30 text-forest-700 bg-white hover:bg-forest-50";
const ICON_BTN_GHOST =
  "border border-transparent text-forest-700 hover:bg-forest-50";
const ICON_BTN_PRIMARY = "bg-forest-700 text-forest-50 hover:opacity-90";

interface HonorairesAFacturerViewProps {
  cabinetId: string;
  role: string;
  /** En mode embedded, le hero gradient et le lien retour sont masqués pour intégration dans /facturation. */
  embedded?: boolean;
}

export function HonorairesAFacturerView({ cabinetId, role, embedded = false }: HonorairesAFacturerViewProps) {
  const router = useRouter();
  const t = useTranslations("billingUi");
  const [filters, setFilters] = useState<FacturationHonorairesQueryInput>({});
  const [searchQ, setSearchQ] = useState("");

  const effectiveFilters = useMemo(
    () => ({ ...filters, ...(searchQ.trim() ? { q: searchQ.trim() } : {}) }),
    [filters, searchQ]
  );

  const { data, isLoading } = useFacturationHonoraires(effectiveFilters);
  const { data: context } = useTempsContext(cabinetId);
  void role;

  const rows = data?.rows ?? [];
  const dossiers = context?.dossiers ?? [];
  const users = context?.users ?? [];

  const handlePreparerFacture = (clientId: string) => {
    router.push(`${routes.facturationFactureNouvelle}?clientId=${encodeURIComponent(clientId)}`);
  };

  return (
    <div className="space-y-6">
      {!embedded && (
        <header className="rounded-safe bg-gradient-to-r from-[#051F20] via-[#0B2B26] to-[#163832] text-white p-6 shadow-lg">
          <Link
            href={routes.facturation}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
            {t("backToOverview")}
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{t("feesToBill")}</h1>
              <p className="mt-1 text-white/80 text-sm">
                {t("feesToBillSubtitle")}
              </p>
              <p className="mt-1 text-white/70 text-xs">
                {t("minAmountToBillHint", { amount: MIN_AMOUNT_TO_BILL })}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href={routes.temps}>
                <Button
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                >
                  {t("timesheet")}
                </Button>
              </Link>
            </div>
          </div>
        </header>
      )}

      <Card>
        <CardHeader title={t("filters")} />
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 min-w-[200px]">
              <Search className="w-4 h-4 text-neutral-500" />
              <input
                type="search"
                placeholder={t("searchClientPlaceholder")}
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="flex-1 rounded-safe-sm border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-600">{t("lawyer")}</label>
              <select
                value={filters.userId ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, userId: e.target.value || undefined }))
                }
                className="rounded-safe-sm border border-neutral-300 px-3 py-2 text-sm min-w-[160px]"
              >
                <option value="">{t("all")}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-600">{t("matter")}</label>
              <select
                value={filters.dossierId ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, dossierId: e.target.value || undefined }))
                }
                className="rounded-safe-sm border border-neutral-300 px-3 py-2 text-sm min-w-[200px]"
              >
                <option value="">{t("all")}</option>
                {dossiers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.numeroDossier ?? d.reference ?? "—"} — {d.intitule}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-600">{t("from")}</label>
              <input
                type="date"
                value={filters.dateFrom ? String(filters.dateFrom).slice(0, 10) : ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    dateFrom: e.target.value ? new Date(e.target.value) : undefined,
                  }))
                }
                className="rounded-safe-sm border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-600">{t("to")}</label>
              <input
                type="date"
                value={filters.dateTo ? String(filters.dateTo).slice(0, 10) : ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    dateTo: e.target.value ? new Date(e.target.value) : undefined,
                  }))
                }
                className="rounded-safe-sm border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title={t("byClient")} />
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-neutral-500 py-8 text-center">
              {t("noFeesForCriteria")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="text-left py-3 px-3 font-medium">{t("client")}</th>
                    <th className="text-right py-3 px-3 font-medium">{t("entries")}</th>
                    <th className="text-right py-3 px-3 font-medium">{t("totalHours")}</th>
                    <th className="text-right py-3 px-3 font-medium">{t("totalFees")}</th>
                    <th className="text-right py-3 px-3 font-medium">{t("totalDisbursements")}</th>
                    <th className="text-right py-3 px-3 font-medium">{t("totalFlatFees")}</th>
                    <th className="text-right py-3 px-3 font-medium">{t("estimatedTaxes")}</th>
                    <th className="text-right py-3 px-3 font-medium">{t("totalToBill")}</th>
                    <th className="text-left py-3 px-3 font-medium">{t("lastDate")}</th>
                    <th className="text-right py-3 px-3 font-medium">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const selectableCount =
                      row.timeEntryIds.length + row.expenseIds.length + row.registreTacheIds.length;
                    const firstDraftInvoiceId = row.draftInvoiceIds?.[0] ?? null;
                    return (
                    <tr
                      key={row.clientId}
                      className="border-b border-neutral-100 hover:bg-neutral-50/80"
                    >
                      <td className="py-3 px-3 font-medium">{row.clientName}</td>
                      <td className="py-3 px-3 text-right">{row.count}</td>
                      <td className="py-3 px-3 text-right">
                        {row.totalHeures.toFixed(1)} h
                      </td>
                      <td className="py-3 px-3 text-right">
                        {formatCurrency(row.totalHonoraires)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {formatCurrency(row.totalDebours)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {formatCurrency(row.totalForfaits)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {formatCurrency(row.taxesEstimees)}
                      </td>
                      <td className="py-3 px-3 text-right font-medium">
                        {formatCurrency(row.totalAFacturer)}
                      </td>
                      <td className="py-3 px-3 text-neutral-600">
                        {formatDate(row.lastDate)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {firstDraftInvoiceId && (
                            <Link
                              href={routes.facturationFactureApercu(firstDraftInvoiceId)}
                              aria-label={t("viewInvoice")}
                              title={t("viewInvoice")}
                              className={`${ICON_BTN_BASE} ${ICON_BTN_OUTLINE}`}
                            >
                              <FileText className="h-4 w-4" aria-hidden />
                            </Link>
                          )}
                          <Link
                            href={routes.facturationHonorairesClient(row.clientId)}
                            aria-label={t("viewDetail")}
                            title={t("viewDetail")}
                            className={`${ICON_BTN_BASE} ${ICON_BTN_GHOST}`}
                          >
                            <Eye className="h-4 w-4" aria-hidden />
                          </Link>
                          <button
                            type="button"
                            disabled={selectableCount === 0 || row.totalAFacturer < MIN_AMOUNT_TO_BILL}
                            aria-label={t("prepareInvoice")}
                            title={
                              selectableCount === 0
                                ? t("allItemsAlreadyDrafted")
                                : row.totalAFacturer < MIN_AMOUNT_TO_BILL
                                ? t("minToBillTitle", { amount: MIN_AMOUNT_TO_BILL })
                                : t("prepareInvoice")
                            }
                            onClick={() => handlePreparerFacture(row.clientId)}
                            className={`${ICON_BTN_BASE} ${ICON_BTN_PRIMARY}`}
                          >
                            <FilePlus2 className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
