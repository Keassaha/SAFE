"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { UserRole } from "@prisma/client";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import {
  useFacturationHonorairesDetail,
  useCreerFactureDepuisTemps,
  useCreerEtEnvoyerFactureDepuisTemps,
} from "@/lib/hooks/useFacturation";
import { TPS_RATE, TVQ_RATE, MIN_AMOUNT_TO_BILL } from "@/lib/invoice-calculations";
import { ArrowLeft, FileText, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

interface HonorairesDetailClientViewProps {
  clientId: string;
  role: string;
}

export function HonorairesDetailClientView({ clientId, role }: HonorairesDetailClientViewProps) {
  const router = useRouter();
  const { data, isLoading } = useFacturationHonorairesDetail(clientId);
  const creerMutation = useCreerFactureDepuisTemps();
  const creerEtEnvoyerMutation = useCreerEtEnvoyerFactureDepuisTemps();
  const canCreateAndSend =
    role === ("admin_cabinet" satisfies UserRole) ||
    role === ("comptabilite" satisfies UserRole);

  const entries = useMemo(() => data?.entries ?? [], [data?.entries]);
  const expenses = useMemo(() => data?.expenses ?? [], [data?.expenses]);
  const clientName = data?.clientName ?? "Client";

  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<Set<string>>(new Set());
  const hasInitializedSelection = useRef(false);

  useEffect(() => {
    if ((entries.length > 0 || expenses.length > 0) && !hasInitializedSelection.current) {
      hasInitializedSelection.current = true;
      setSelectedEntryIds(new Set(entries.map((e) => e.id)));
      setSelectedExpenseIds(new Set(expenses.map((e) => e.id)));
    }
  }, [entries, expenses]);

  const { totalHonoraires, totalDebours, totalHeures, tps, tvq, totalTTC } = useMemo(() => {
    const selectedEntries = entries.filter((e) => selectedEntryIds.has(e.id));
    const selectedExpenses = expenses.filter((e) => selectedExpenseIds.has(e.id));
    const totalHonoraires = selectedEntries.reduce((s, e) => s + e.montant, 0);
    const totalDebours = selectedExpenses.reduce((s, e) => s + e.amount, 0);
    const totalHeures = selectedEntries.reduce((s, e) => s + e.dureeMinutes, 0) / 60;
    const subtotal = totalHonoraires + totalDebours;
    const tpsVal = Math.round(subtotal * TPS_RATE * 100) / 100;
    const tvqVal = Math.round(subtotal * TVQ_RATE * 100) / 100;
    const total = Math.round((subtotal + tpsVal + tvqVal) * 100) / 100;
    return {
      totalHonoraires,
      totalDebours,
      totalHeures,
      tps: tpsVal,
      tvq: tvqVal,
      totalTTC: total,
    };
  }, [entries, expenses, selectedEntryIds, selectedExpenseIds]);

  const totalSelected = selectedEntryIds.size + selectedExpenseIds.size;

  /** Lignes pour l’ébauche : honoraires puis débours, avec date et description */
  const draftLines = useMemo(() => {
    const selectedEntries = entries.filter((e) => selectedEntryIds.has(e.id));
    const selectedExpenses = expenses.filter((e) => selectedExpenseIds.has(e.id));
    const lines: { id: string; date: Date; description: string; amount: number; type: "honoraire" | "débours" }[] = [];
    for (const e of selectedEntries) {
      lines.push({
        id: e.id,
        date: new Date(e.date),
        description: e.description ?? "Honoraires",
        amount: e.montant,
        type: "honoraire",
      });
    }
    for (const e of selectedExpenses) {
      lines.push({
        id: `exp-${e.id}`,
        date: new Date(e.date),
        description: e.description || (e.vendorName ? `Débours — ${e.vendorName}` : "Débours"),
        amount: e.amount,
        type: "débours",
      });
    }
    lines.sort((a, b) => a.date.getTime() - b.date.getTime());
    return lines;
  }, [entries, expenses, selectedEntryIds, selectedExpenseIds]);

  const toggleEntry = (id: string) => {
    setSelectedEntryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpense = (id: string) => {
    setSelectedExpenseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllEntries = () => {
    if (selectedEntryIds.size === entries.length) {
      setSelectedEntryIds(new Set());
    } else {
      setSelectedEntryIds(new Set(entries.map((e) => e.id)));
    }
  };

  const toggleAllExpenses = () => {
    if (selectedExpenseIds.size === expenses.length) {
      setSelectedExpenseIds(new Set());
    } else {
      setSelectedExpenseIds(new Set(expenses.map((e) => e.id)));
    }
  };

  const handleCreerFacture = async () => {
    const timeEntryIds = Array.from(selectedEntryIds);
    const expenseIds = Array.from(selectedExpenseIds);
    if (timeEntryIds.length === 0 && expenseIds.length === 0) {
      alert("Sélectionnez au moins une fiche de temps ou un débours.");
      return;
    }
    try {
      const { invoiceId } = await creerMutation.mutateAsync({
        clientId,
        timeEntryIds: timeEntryIds.length ? timeEntryIds : [],
        expenseIds: expenseIds.length ? expenseIds : undefined,
      });
      router.push(routes.facturationFactureEdit(invoiceId));
    } catch (e) {
      console.error(e);
      alert((e as Error).message ?? "Erreur lors de la création de la facture");
    }
  };

  const handleCreerEtEnvoyerFacture = async () => {
    const timeEntryIds = Array.from(selectedEntryIds);
    const expenseIds = Array.from(selectedExpenseIds);
    if (timeEntryIds.length === 0 && expenseIds.length === 0) {
      alert("Sélectionnez au moins une fiche de temps ou un débours.");
      return;
    }
    try {
      const { invoiceId } = await creerEtEnvoyerMutation.mutateAsync({
        clientId,
        timeEntryIds: timeEntryIds.length ? timeEntryIds : [],
        expenseIds: expenseIds.length ? expenseIds : undefined,
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
      <header className="rounded-safe bg-gradient-to-r from-[#051F20] via-[#0B2B26] to-[#163832] text-white p-6 shadow-lg">
        <Link
          href={routes.facturationHonoraires}
          className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux honoraires à facturer
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Détail — {clientName}</h1>
        <p className="mt-1 text-white/80 text-sm">
          Cochez les lignes à inclure dans la facture, puis créez la facture.
        </p>
        <p className="mt-1 text-white/70 text-xs">
          Le client peut être facturé lorsque le total est supérieur ou égal à {MIN_AMOUNT_TO_BILL}&nbsp;$.
        </p>
      </header>

      {/* Ébauche de la facture — prévisualisation sans générer */}
      <Card>
        <CardHeader title="Ébauche de la facture" />
        <CardContent>
          {draftLines.length === 0 ? (
            <p className="text-neutral-500 py-6 text-center text-sm">
              Cochez des fiches de temps ou des débours ci-dessous pour voir l’ébauche.
            </p>
          ) : (
            <div className="rounded-safe-sm border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-start">
                <div>
                  <p className="text-xs uppercase tracking-wider text-neutral-500 font-medium">
                    Ébauche — non émise
                  </p>
                  <p className="text-lg font-semibold text-neutral-900 mt-0.5">{clientName}</p>
                  <p className="text-sm text-neutral-500 mt-1">
                    Date d’émission prévue : {formatDate(new Date())}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="text-left py-3 px-4 font-medium text-neutral-700">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-700">Description</th>
                      <th className="text-right py-3 px-4 font-medium text-neutral-700">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draftLines.map((line) => (
                      <tr key={line.id} className="border-b border-neutral-100">
                        <td className="py-2 px-4 text-neutral-600">{formatDate(line.date)}</td>
                        <td className="py-2 px-4">{line.description}</td>
                        <td className="py-2 px-4 text-right font-medium">
                          {formatCurrency(line.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50/80 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Sous-total honoraires</span>
                  <span>{formatCurrency(totalHonoraires)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Sous-total débours</span>
                  <span>{formatCurrency(totalDebours)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">TPS (5 %)</span>
                  <span>{formatCurrency(tps)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">TVQ (9,975 %)</span>
                  <span>{formatCurrency(tvq)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 mt-2 border-t border-neutral-200">
                  <span>Total à facturer</span>
                  <span>{formatCurrency(totalTTC)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Fiches de temps"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                onClick={handleCreerFacture}
                disabled={
                  creerMutation.isPending ||
                  creerEtEnvoyerMutation.isPending ||
                  totalSelected === 0 ||
                  totalTTC < MIN_AMOUNT_TO_BILL
                }
                title={
                  totalTTC < MIN_AMOUNT_TO_BILL && totalSelected > 0
                    ? `Le total doit être ≥ ${MIN_AMOUNT_TO_BILL} $ pour facturer.`
                    : undefined
                }
                className="gap-2"
              >
                {creerMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                Créer la facture
              </Button>
              {canCreateAndSend ? (
                <Button
                  variant="secondary"
                  onClick={handleCreerEtEnvoyerFacture}
                  disabled={
                    creerMutation.isPending ||
                    creerEtEnvoyerMutation.isPending ||
                    totalSelected === 0 ||
                    totalTTC < MIN_AMOUNT_TO_BILL
                  }
                  title={
                    totalTTC < MIN_AMOUNT_TO_BILL && totalSelected > 0
                      ? `Le total doit être ≥ ${MIN_AMOUNT_TO_BILL} $ pour facturer.`
                      : undefined
                  }
                  className="gap-2"
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
          }
        />
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : entries.length === 0 && expenses.length === 0 ? (
            <p className="text-neutral-500 py-8 text-center">
              Aucune fiche de temps ni débours à facturer pour ce client.
            </p>
          ) : (
            <>
              {entries.length > 0 && (
                <>
                  <h3 className="text-sm font-medium text-neutral-700 mb-2 tracking-tight">Fiches de temps</h3>
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-200 bg-neutral-50">
                          <th className="w-10 py-3 px-3">
                            <input
                              type="checkbox"
                              checked={entries.length > 0 && selectedEntryIds.size === entries.length}
                              onChange={toggleAllEntries}
                              aria-label="Tout sélectionner (temps)"
                            />
                          </th>
                          <th className="text-left py-3 px-3 font-medium">Date</th>
                          <th className="text-left py-3 px-3 font-medium">Professionnel</th>
                          <th className="text-left py-3 px-3 font-medium">Description</th>
                          <th className="text-right py-3 px-3 font-medium">Durée</th>
                          <th className="text-right py-3 px-3 font-medium">Taux</th>
                          <th className="text-right py-3 px-3 font-medium">Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((e) => (
                          <tr
                            key={e.id}
                            className="border-b border-neutral-100 hover:bg-neutral-50/80"
                          >
                            <td className="py-2 px-3">
                              <input
                                type="checkbox"
                                checked={selectedEntryIds.has(e.id)}
                                onChange={() => toggleEntry(e.id)}
                                aria-label={`Inclure ${e.description ?? "ligne"}`}
                              />
                            </td>
                            <td className="py-2 px-3 text-neutral-600">{formatDate(e.date)}</td>
                            <td className="py-2 px-3">{e.userNom}</td>
                            <td className="py-2 px-3">{e.description ?? "—"}</td>
                            <td className="py-2 px-3 text-right">
                              {(e.dureeMinutes / 60).toFixed(1)} h
                            </td>
                            <td className="py-2 px-3 text-right">
                              {formatCurrency(e.tauxHoraire)}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {formatCurrency(e.montant)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {expenses.length > 0 && (
                <>
                  <h3 className="text-sm font-medium text-neutral-700 mb-2 tracking-tight">Débours</h3>
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-200 bg-neutral-50">
                          <th className="w-10 py-3 px-3">
                            <input
                              type="checkbox"
                              checked={expenses.length > 0 && selectedExpenseIds.size === expenses.length}
                              onChange={toggleAllExpenses}
                              aria-label="Tout sélectionner (débours)"
                            />
                          </th>
                          <th className="text-left py-3 px-3 font-medium">Date</th>
                          <th className="text-left py-3 px-3 font-medium">Description</th>
                          <th className="text-left py-3 px-3 font-medium">Fournisseur</th>
                          <th className="text-right py-3 px-3 font-medium">Montant</th>
                          <th className="text-right py-3 px-3 font-medium">Taxable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((e) => (
                          <tr
                            key={e.id}
                            className="border-b border-neutral-100 hover:bg-neutral-50/80"
                          >
                            <td className="py-2 px-3">
                              <input
                                type="checkbox"
                                checked={selectedExpenseIds.has(e.id)}
                                onChange={() => toggleExpense(e.id)}
                                aria-label={`Inclure ${e.description}`}
                              />
                            </td>
                            <td className="py-2 px-3 text-neutral-600">{formatDate(e.date)}</td>
                            <td className="py-2 px-3">{e.description}</td>
                            <td className="py-2 px-3">{e.vendorName ?? "—"}</td>
                            <td className="py-2 px-3 text-right">{formatCurrency(e.amount)}</td>
                            <td className="py-2 px-3 text-right">{e.taxable ? "Oui" : "Non"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <div className="mt-6 p-4 rounded-safe-sm bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Sous-total honoraires</span>
                  <span className="font-medium">{formatCurrency(totalHonoraires)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Sous-total débours</span>
                  <span className="font-medium">{formatCurrency(totalDebours)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Total heures sélectionnées</span>
                  <span>{totalHeures.toFixed(1)} h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">TPS (5 %)</span>
                  <span>{formatCurrency(tps)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">TVQ (9,975 %)</span>
                  <span>{formatCurrency(tvq)}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t border-neutral-200">
                  <span>Total à facturer</span>
                  <span>{formatCurrency(totalTTC)}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
