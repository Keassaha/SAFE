"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import { useFacturationHonorairesDetail } from "@/lib/hooks/useFacturation";
import { MIN_AMOUNT_TO_BILL } from "@/lib/invoice-calculations";
import { applyTaxes, toInvoiceTaxColumns, toDisplayTaxes, getDefaultTaxConfig } from "@/lib/billing/taxes";
import type { CabinetTaxConfig } from "@/lib/billing/types";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";

interface HonorairesDetailClientViewProps {
  clientId: string;
  role: string;
}

export function HonorairesDetailClientView({ clientId, role }: HonorairesDetailClientViewProps) {
  const router = useRouter();
  const { data, isLoading } = useFacturationHonorairesDetail(clientId);
  void role;

  const entries = useMemo(() => data?.entries ?? [], [data?.entries]);
  const expenses = useMemo(() => data?.expenses ?? [], [data?.expenses]);
  const registreTaches = useMemo(() => data?.registreTaches ?? [], [data?.registreTaches]);
  const draftInvoiceId = useMemo(() => {
    return (
      entries.find((e) => e.isDrafted)?.invoiceId ??
      expenses.find((e) => e.isDrafted)?.invoiceId ??
      registreTaches.find((t) => t.isDrafted)?.invoiceId ??
      null
    );
  }, [entries, expenses, registreTaches]);
  const clientName = data?.clientName ?? "Client";

  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<Set<string>>(new Set());
  const [selectedRegistreTacheIds, setSelectedRegistreTacheIds] = useState<Set<string>>(new Set());
  const hasInitializedSelection = useRef(false);

  useEffect(() => {
    if ((entries.length > 0 || expenses.length > 0 || registreTaches.length > 0) && !hasInitializedSelection.current) {
      hasInitializedSelection.current = true;
      setSelectedEntryIds(new Set(entries.filter((e) => !e.isDrafted).map((e) => e.id)));
      setSelectedExpenseIds(new Set(expenses.filter((e) => !e.isDrafted).map((e) => e.id)));
      setSelectedRegistreTacheIds(new Set(registreTaches.filter((t) => !t.isDrafted).map((t) => t.id)));
    }
  }, [entries, expenses, registreTaches]);

  // Régime de taxes du cabinet (Ontario -> TVH 13 %, Québec -> TPS + TVQ),
  // fourni par l'API. Fallback QC si absent. Source de vérité = serveur à la création.
  const taxConfig: CabinetTaxConfig = useMemo(
    () => (data?.taxConfig as CabinetTaxConfig | undefined) ?? getDefaultTaxConfig("QC"),
    [data?.taxConfig]
  );

  const { totalHonoraires, totalDebours, totalForfaits, totalAjustements, totalRabais, totalHeures, tps, tvq, hst, isHst, totalTTC } = useMemo(() => {
    const selectedEntries = entries.filter((e) => selectedEntryIds.has(e.id));
    const selectedExpenses = expenses.filter((e) => selectedExpenseIds.has(e.id));
    const selectedTaches = registreTaches.filter((t) => selectedRegistreTacheIds.has(t.id));
    const totalHonoraires = selectedEntries.reduce((s, e) => s + e.montant, 0);
    const totalDebours = selectedExpenses.reduce((s, e) => s + e.amount, 0);
    const totalForfaits = selectedTaches.reduce((s, t) => s + t.amount, 0);
    const totalAjustements = selectedTaches.reduce((s, t) => s + t.ajustement, 0);
    const totalRabais = selectedTaches.reduce((s, t) => s + t.rabais, 0);
    const totalHeures = selectedEntries.reduce((s, e) => s + e.dureeMinutes, 0) / 60;
    const subtotal = totalHonoraires + totalDebours + totalForfaits;
    const subtotalTaxable =
      selectedEntries.reduce((s, e) => s + ((e.taxable ?? true) ? e.montant : 0), 0) +
      selectedExpenses.reduce((s, e) => s + (e.taxable ? e.amount : 0), 0) +
      selectedTaches.reduce((s, t) => s + (t.taxable ? t.amount : 0), 0);
    const applied = applyTaxes(subtotalTaxable, true, taxConfig);
    const cols = toInvoiceTaxColumns(applied, taxConfig.mode);
    const display = toDisplayTaxes(cols.tps, cols.tvq, taxConfig.mode);
    const total = Math.round((subtotal + applied.taxesTotal) * 100) / 100;
    return {
      totalHonoraires,
      totalDebours,
      totalForfaits,
      totalAjustements,
      totalRabais,
      totalHeures,
      tps: display.tps,
      tvq: display.tvq,
      hst: display.hst,
      isHst: taxConfig.mode === "hst",
      totalTTC: total,
    };
  }, [entries, expenses, registreTaches, selectedEntryIds, selectedExpenseIds, selectedRegistreTacheIds, taxConfig]);

  const totalSelected = selectedEntryIds.size + selectedExpenseIds.size + selectedRegistreTacheIds.size;

  /** Lignes pour l’ébauche : honoraires puis débours, avec date et description */
  const draftLines = useMemo(() => {
    const selectedEntries = entries.filter((e) => selectedEntryIds.has(e.id));
    const selectedExpenses = expenses.filter((e) => selectedExpenseIds.has(e.id));
    const selectedTaches = registreTaches.filter((t) => selectedRegistreTacheIds.has(t.id));
    const lines: { id: string; date: Date; description: string; amount: number; type: "honoraire" | "débours" | "forfait" | "rabais" }[] = [];
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
    for (const t of selectedTaches) {
      lines.push({
        id: `tache-${t.id}`,
        date: new Date(t.date),
        description:
          t.ajustement !== 0
            ? `${t.description} (ajustement ${t.ajustement > 0 ? "+" : ""}${formatCurrency(t.ajustement)})`
            : t.description,
        amount: t.montantBase + t.ajustement,
        type: "forfait",
      });
      if (t.rabais > 0) {
        lines.push({
          id: `rabais-${t.id}`,
          date: new Date(t.date),
          description: t.rabaisRaison ? `Rabais — ${t.rabaisRaison}` : `Rabais — ${t.description}`,
          amount: -Math.abs(t.rabais),
          type: "rabais",
        });
      }
    }
    lines.sort((a, b) => a.date.getTime() - b.date.getTime());
    return lines;
  }, [entries, expenses, registreTaches, selectedEntryIds, selectedExpenseIds, selectedRegistreTacheIds]);

  const toggleEntry = (id: string) => {
    if (entries.find((entry) => entry.id === id)?.isDrafted) return;
    setSelectedEntryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpense = (id: string) => {
    if (expenses.find((expense) => expense.id === id)?.isDrafted) return;
    setSelectedExpenseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleRegistreTache = (id: string) => {
    if (registreTaches.find((tache) => tache.id === id)?.isDrafted) return;
    setSelectedRegistreTacheIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllEntries = () => {
    const selectable = entries.filter((e) => !e.isDrafted);
    if (selectedEntryIds.size === selectable.length) {
      setSelectedEntryIds(new Set());
    } else {
      setSelectedEntryIds(new Set(selectable.map((e) => e.id)));
    }
  };

  const toggleAllExpenses = () => {
    const selectable = expenses.filter((e) => !e.isDrafted);
    if (selectedExpenseIds.size === selectable.length) {
      setSelectedExpenseIds(new Set());
    } else {
      setSelectedExpenseIds(new Set(selectable.map((e) => e.id)));
    }
  };

  const toggleAllRegistreTaches = () => {
    const selectable = registreTaches.filter((t) => !t.isDrafted);
    if (selectedRegistreTacheIds.size === selectable.length) {
      setSelectedRegistreTacheIds(new Set());
    } else {
      setSelectedRegistreTacheIds(new Set(selectable.map((t) => t.id)));
    }
  };

  const handlePreparerFacture = () => {
    if (totalSelected === 0) {
      alert("Sélectionnez au moins une fiche de temps, un débours ou une tâche.");
      return;
    }
    const params = new URLSearchParams({ clientId });
    const timeEntryIds = Array.from(selectedEntryIds);
    const expenseIds = Array.from(selectedExpenseIds);
    const registreTacheIds = Array.from(selectedRegistreTacheIds);
    if (timeEntryIds.length > 0) params.set("timeEntryIds", timeEntryIds.join(","));
    if (expenseIds.length > 0) params.set("expenseIds", expenseIds.join(","));
    if (registreTacheIds.length > 0) params.set("registreTacheIds", registreTacheIds.join(","));
    router.push(`${routes.facturationFactureNouvelle}?${params.toString()}`);
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
                        <td className={line.type === "rabais" ? "py-2 px-4 text-emerald-700" : "py-2 px-4"}>
                          {line.description}
                        </td>
                        <td className={`py-2 px-4 text-right font-medium ${line.type === "rabais" ? "text-emerald-700" : ""}`}>
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
                  <span className="text-neutral-600">Sous-total forfaits</span>
                  <span>{formatCurrency(totalForfaits)}</span>
                </div>
                {totalAjustements !== 0 && (
                  <div className="flex justify-between text-sm text-amber-700">
                    <span>Ajustements inclus</span>
                    <span>{totalAjustements > 0 ? "+" : ""}{formatCurrency(totalAjustements)}</span>
                  </div>
                )}
                {totalRabais > 0 && (
                  <div className="flex justify-between text-sm text-emerald-700">
                    <span>Rabais accordés</span>
                    <span>-{formatCurrency(totalRabais)}</span>
                  </div>
                )}
                {isHst ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">TVH (13 %)</span>
                    <span>{formatCurrency(hst)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">TPS (5 %)</span>
                      <span>{formatCurrency(tps)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">TVQ (9,975 %)</span>
                      <span>{formatCurrency(tvq)}</span>
                    </div>
                  </>
                )}
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
                onClick={handlePreparerFacture}
                disabled={totalSelected === 0 || totalTTC < MIN_AMOUNT_TO_BILL}
                title={
                  totalTTC < MIN_AMOUNT_TO_BILL && totalSelected > 0
                    ? `Le total doit être ≥ ${MIN_AMOUNT_TO_BILL} $ pour facturer.`
                    : undefined
                }
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                Préparer la facture
              </Button>
              {draftInvoiceId && (
                <Link href={routes.facturationFactureApercu(draftInvoiceId)}>
                  <Button variant="secondary" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Voir facture en cours
                  </Button>
                </Link>
              )}
            </div>
          }
        />
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : entries.length === 0 && expenses.length === 0 && registreTaches.length === 0 ? (
            <p className="text-neutral-500 py-8 text-center">
              Aucune fiche de temps, débours ni tâche à facturer pour ce client.
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
                                disabled={e.isDrafted}
                                onChange={() => toggleEntry(e.id)}
                                aria-label={`Inclure ${e.description ?? "ligne"}`}
                              />
                            </td>
                            <td className="py-2 px-3 text-neutral-600">{formatDate(e.date)}</td>
                            <td className="py-2 px-3">{e.userNom}</td>
                            <td className="py-2 px-3">
                              {e.description ?? "—"}
                              {e.isDrafted && (
                                <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800">
                                  Facture {e.invoiceNumero ?? "en cours"}
                                </span>
                              )}
                            </td>
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
                                disabled={e.isDrafted}
                                onChange={() => toggleExpense(e.id)}
                                aria-label={`Inclure ${e.description}`}
                              />
                            </td>
                            <td className="py-2 px-3 text-neutral-600">{formatDate(e.date)}</td>
                            <td className="py-2 px-3">
                              {e.description}
                              {e.isDrafted && (
                                <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800">
                                  Facture {e.invoiceNumero ?? "en cours"}
                                </span>
                              )}
                            </td>
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
              {registreTaches.length > 0 && (
                <>
                  <h3 className="text-sm font-medium text-neutral-700 mb-2 tracking-tight">Tâches forfaitaires</h3>
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-200 bg-neutral-50">
                          <th className="w-10 py-3 px-3">
                            <input
                              type="checkbox"
                              checked={registreTaches.length > 0 && selectedRegistreTacheIds.size === registreTaches.length}
                              onChange={toggleAllRegistreTaches}
                              aria-label="Tout sélectionner (tâches)"
                            />
                          </th>
                          <th className="text-left py-3 px-3 font-medium">Date</th>
                          <th className="text-left py-3 px-3 font-medium">Dossier</th>
                          <th className="text-left py-3 px-3 font-medium">Description</th>
                          <th className="text-right py-3 px-3 font-medium">Base</th>
                          <th className="text-right py-3 px-3 font-medium">Ajust.</th>
                          <th className="text-right py-3 px-3 font-medium">Rabais</th>
                          <th className="text-right py-3 px-3 font-medium">Total</th>
                          <th className="text-right py-3 px-3 font-medium">Taxable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registreTaches.map((t) => (
                          <tr
                            key={t.id}
                            className="border-b border-neutral-100 hover:bg-neutral-50/80"
                          >
                            <td className="py-2 px-3">
                              <input
                                type="checkbox"
                                checked={selectedRegistreTacheIds.has(t.id)}
                                disabled={t.isDrafted}
                                onChange={() => toggleRegistreTache(t.id)}
                                aria-label={`Inclure ${t.description}`}
                              />
                            </td>
                            <td className="py-2 px-3 text-neutral-600">{formatDate(t.date)}</td>
                            <td className="py-2 px-3">{t.dossierIntitule ?? "—"}</td>
                            <td className="py-2 px-3">
                              {t.description}
                              {t.isDrafted && (
                                <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800">
                                  Facture {t.invoiceNumero ?? "en cours"}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right">{formatCurrency(t.montantBase)}</td>
                            <td className={`py-2 px-3 text-right ${t.ajustement !== 0 ? "text-amber-700 font-medium" : "text-neutral-400"}`}>
                              {t.ajustement !== 0 ? `${t.ajustement > 0 ? "+" : ""}${formatCurrency(t.ajustement)}` : "—"}
                            </td>
                            <td className={`py-2 px-3 text-right ${t.rabais > 0 ? "text-emerald-700 font-medium" : "text-neutral-400"}`}>
                              {t.rabais > 0 ? `-${formatCurrency(t.rabais)}` : "—"}
                              {t.rabaisRaison && (
                                <p className="text-[10px] font-normal text-neutral-400">{t.rabaisRaison}</p>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-medium">{formatCurrency(t.amount)}</td>
                            <td className="py-2 px-3 text-right">{t.taxable ? "Oui" : "Non"}</td>
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
                  <span className="text-neutral-600">Sous-total forfaits</span>
                  <span className="font-medium">{formatCurrency(totalForfaits)}</span>
                </div>
                {totalAjustements !== 0 && (
                  <div className="flex justify-between text-sm text-amber-700">
                    <span>Ajustements inclus</span>
                    <span className="font-medium">{totalAjustements > 0 ? "+" : ""}{formatCurrency(totalAjustements)}</span>
                  </div>
                )}
                {totalRabais > 0 && (
                  <div className="flex justify-between text-sm text-emerald-700">
                    <span>Rabais accordés</span>
                    <span className="font-medium">-{formatCurrency(totalRabais)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Total heures sélectionnées</span>
                  <span>{totalHeures.toFixed(1)} h</span>
                </div>
                {isHst ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">TVH (13 %)</span>
                    <span>{formatCurrency(hst)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">TPS (5 %)</span>
                      <span>{formatCurrency(tps)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">TVQ (9,975 %)</span>
                      <span>{formatCurrency(tvq)}</span>
                    </div>
                  </>
                )}
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
