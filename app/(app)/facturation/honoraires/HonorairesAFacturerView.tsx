"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import {
  useFacturationHonoraires,
  useCreerFactureDepuisTemps,
  useCreerEtEnvoyerFactureDepuisTemps,
} from "@/lib/hooks/useFacturation";
import { useTempsContext } from "@/lib/hooks/useTemps";
import { MIN_AMOUNT_TO_BILL } from "@/lib/invoice-calculations";
import type { FacturationHonorairesQueryInput } from "@/lib/validations/facturation";
import { Search, Eye, FileText, Loader2, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

interface HonorairesAFacturerViewProps {
  cabinetId: string;
  role: string;
}

export function HonorairesAFacturerView({ cabinetId, role }: HonorairesAFacturerViewProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<FacturationHonorairesQueryInput>({});
  const [searchQ, setSearchQ] = useState("");

  const effectiveFilters = useMemo(
    () => ({ ...filters, ...(searchQ.trim() ? { q: searchQ.trim() } : {}) }),
    [filters, searchQ]
  );

  const { data, isLoading } = useFacturationHonoraires(effectiveFilters);
  const { data: context } = useTempsContext(cabinetId);
  const creerMutation = useCreerFactureDepuisTemps();
  const creerEtEnvoyerMutation = useCreerEtEnvoyerFactureDepuisTemps();
  const canCreateAndSend =
    role === ("admin_cabinet" satisfies UserRole) ||
    role === ("comptabilite" satisfies UserRole);

  const rows = data?.rows ?? [];
  const dossiers = context?.dossiers ?? [];
  const users = context?.users ?? [];

  const handleGenererFacture = async (
    clientId: string,
    timeEntryIds: string[],
    dossierId?: string | null,
    expenseIds?: string[]
  ) => {
    try {
      const { invoiceId } = await creerMutation.mutateAsync({
        clientId,
        dossierId: dossierId ?? undefined,
        timeEntryIds,
        expenseIds: expenseIds ?? [],
      });
      router.push(routes.facturationFactureEdit(invoiceId));
    } catch (e) {
      console.error(e);
      alert((e as Error).message ?? "Erreur lors de la création de la facture");
    }
  };

  const handleCreerEtEnvoyerFacture = async (
    clientId: string,
    timeEntryIds: string[],
    dossierId?: string | null,
    expenseIds?: string[]
  ) => {
    try {
      const { invoiceId } = await creerEtEnvoyerMutation.mutateAsync({
        clientId,
        dossierId: dossierId ?? undefined,
        timeEntryIds,
        expenseIds: expenseIds ?? [],
      });
      toast.success("Facture créée et marquée comme envoyée.");
      router.push(routes.facturationFactureEdit(invoiceId));
    } catch (e) {
      console.error(e);
      alert((e as Error).message ?? "Erreur lors de la création et de l'envoi de la facture");
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-xl bg-[var(--safe-sidebar-bg)] text-white p-6">
        <Link
          href={routes.facturation}
          className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-3"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
          Retour à la vue d&apos;ensemble
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Honoraires à facturer</h1>
            <p className="mt-1 text-white/80 text-sm">
              Regroupez les fiches de temps non facturées par client et générez des factures.
            </p>
            <p className="mt-1 text-white/70 text-xs">
              Le client peut être facturé lorsque le total est supérieur ou égal à {MIN_AMOUNT_TO_BILL}&nbsp;$.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={routes.temps}>
              <Button
                variant="secondary"
                className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                Fiche de temps
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader title="Filtres" />
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 min-w-[200px]">
              <Search className="w-4 h-4 text-neutral-500" />
              <input
                type="search"
                placeholder="Rechercher un client..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-600">Avocat</label>
              <select
                value={filters.userId ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, userId: e.target.value || undefined }))
                }
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm min-w-[160px]"
              >
                <option value="">Tous</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-600">Dossier</label>
              <select
                value={filters.dossierId ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, dossierId: e.target.value || undefined }))
                }
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm min-w-[200px]"
              >
                <option value="">Tous</option>
                {dossiers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.numeroDossier ?? d.reference ?? "—"} — {d.intitule}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-600">Du</label>
              <input
                type="date"
                value={filters.dateFrom ? String(filters.dateFrom).slice(0, 10) : ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    dateFrom: e.target.value ? new Date(e.target.value) : undefined,
                  }))
                }
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-600">Au</label>
              <input
                type="date"
                value={filters.dateTo ? String(filters.dateTo).slice(0, 10) : ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    dateTo: e.target.value ? new Date(e.target.value) : undefined,
                  }))
                }
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Par client" />
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-neutral-500 py-8 text-center">
              Aucun honoraire à facturer pour les critères sélectionnés.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="text-left py-3 px-3 font-medium">Client</th>
                    <th className="text-right py-3 px-3 font-medium">Entrées</th>
                    <th className="text-right py-3 px-3 font-medium">Total heures</th>
                    <th className="text-right py-3 px-3 font-medium">Total honoraires</th>
                    <th className="text-right py-3 px-3 font-medium">Total débours</th>
                    <th className="text-right py-3 px-3 font-medium">Taxes estimées</th>
                    <th className="text-right py-3 px-3 font-medium">Total à facturer</th>
                    <th className="text-left py-3 px-3 font-medium">Dernière date</th>
                    <th className="text-right py-3 px-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
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
                          <Link href={routes.facturationHonorairesClient(row.clientId)}>
                            <Button variant="tertiary" className="gap-1">
                              <Eye className="w-4 h-4" />
                              Voir le détail
                            </Button>
                          </Link>
                          <Button
                            variant="primary"
                            className="gap-1"
                            disabled={
                              creerMutation.isPending ||
                              creerEtEnvoyerMutation.isPending ||
                              row.totalAFacturer < MIN_AMOUNT_TO_BILL
                            }
                            title={
                              row.totalAFacturer < MIN_AMOUNT_TO_BILL
                                ? `Le total doit être ≥ ${MIN_AMOUNT_TO_BILL} $ pour facturer.`
                                : undefined
                            }
                            onClick={() =>
                              handleGenererFacture(
                                row.clientId,
                                row.timeEntryIds,
                                undefined,
                                row.expenseIds
                              )
                            }
                          >
                            {creerMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                            Générer la facture
                          </Button>
                          {canCreateAndSend ? (
                            <Button
                              variant="secondary"
                              className="gap-1"
                              disabled={
                                creerMutation.isPending ||
                                creerEtEnvoyerMutation.isPending ||
                                row.totalAFacturer < MIN_AMOUNT_TO_BILL
                              }
                              title={
                                row.totalAFacturer < MIN_AMOUNT_TO_BILL
                                  ? `Le total doit être ≥ ${MIN_AMOUNT_TO_BILL} $ pour facturer.`
                                  : undefined
                              }
                              onClick={() =>
                                handleCreerEtEnvoyerFacture(
                                  row.clientId,
                                  row.timeEntryIds,
                                  undefined,
                                  row.expenseIds
                                )
                              }
                            >
                              {creerEtEnvoyerMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                              Créer et envoyer
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
