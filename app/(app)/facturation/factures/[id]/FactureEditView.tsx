"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import { useFacture, useValiderFacture, useEnvoyerFacture, usePatchFacture, useAnnulerFacture, useDuplicateFacture, useLienClientFacture, useEnvoyerFactureEmail } from "@/lib/hooks/useFacturation";
import { InvoiceTemplate } from "@/components/facturation/InvoiceTemplate";
import { computeBillingTotals, TPS_RATE, TVQ_RATE } from "@/lib/invoice-calculations";
import type { BillingLineRow } from "@/lib/invoice-calculations";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { ArrowLeft, Loader2, CheckCircle, Save, Trash2, Plus, DollarSign, MinusCircle, Copy, FileText, Send, Link2 } from "lucide-react";

type InvoiceItem = {
  id: string;
  date: string;
  description: string;
  userNom: string | null;
  hours: number | null;
  rate: number | null;
  amount: number;
  type: string;
  parentItemId?: string | null;
  parentLineId?: string | null;
  source?: "line" | "item";
  validationComment?: string | null;
};

interface FactureEditViewProps {
  invoiceId: string;
}

export function FactureEditView({ invoiceId }: FactureEditViewProps) {
  const router = useRouter();
  const { data: invoice, isLoading, refetch } = useFacture(invoiceId);
  const validerMutation = useValiderFacture(invoiceId);
  const envoyerMutation = useEnvoyerFacture(invoiceId);
  const patchMutation = usePatchFacture(invoiceId);
  const annulerMutation = useAnnulerFacture(invoiceId);
  const duplicateMutation = useDuplicateFacture(invoiceId);
  const lienClientMutation = useLienClientFacture(invoiceId);
  const envoyerEmailMutation = useEnvoyerFactureEmail(invoiceId);

  const [editedItems, setEditedItems] = useState<InvoiceItem[] | null>(null);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [lienClientOpen, setLienClientOpen] = useState(false);
  const [lienClientUrl, setLienClientUrl] = useState<string | null>(null);
  const [lienClientExpiresAt, setLienClientExpiresAt] = useState<string | null>(null);
  const [lienClientCopied, setLienClientCopied] = useState(false);

  useEffect(() => {
    if (invoice?.items?.length && editedItems === null) {
      setEditedItems(invoice.items as InvoiceItem[]);
    }
  }, [invoice?.items, editedItems]);

  const displayItems = (editedItems ?? invoice?.items ?? []) as InvoiceItem[];

  /** Calcule les totaux à partir des lignes affichées (pour l’aperçu en direct pendant l’édition). */
  const getPreviewTotals = () => {
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const lines: BillingLineRow[] = [];
    for (const i of displayItems) {
      const amount = i.amount;
      if (i.type === "rabais") {
        lines.push({
          lineType: "adjustment",
          lineSubtotal: -Math.abs(amount),
          taxable: false,
          gstAmount: 0,
          qstAmount: 0,
        });
        continue;
      }
      if (i.type === "frais_rappel") {
        lines.push({
          lineType: "fee_after_tax",
          lineSubtotal: amount,
          taxable: false,
          gstAmount: 0,
          qstAmount: 0,
        });
        continue;
      }
      if (i.type === "debours_non_taxable") {
        lines.push({
          lineType: "non_taxable",
          lineSubtotal: amount,
          taxable: false,
          gstAmount: 0,
          qstAmount: 0,
        });
        continue;
      }
      const gst = round2(amount * TPS_RATE);
      const qst = round2(amount * TVQ_RATE);
      if (i.type === "debours_taxable") {
        lines.push({
          lineType: "expense",
          lineSubtotal: amount,
          taxable: true,
          gstAmount: gst,
          qstAmount: qst,
        });
      } else if (i.type === "interets") {
        lines.push({
          lineType: "interest",
          lineSubtotal: amount,
          taxable: true,
          gstAmount: gst,
          qstAmount: qst,
        });
      } else {
        lines.push({
          lineType: "fee",
          lineSubtotal: amount,
          taxable: true,
          gstAmount: gst,
          qstAmount: qst,
        });
      }
    }
    const paid = invoice?.montantPaye ?? 0;
    const trust = (invoice as { trustApplied?: number })?.trustApplied ?? 0;
    const totals = computeBillingTotals(lines, paid, trust, 0);
    const deboursNonTaxableTotal = displayItems
      .filter((i) => i.type === "debours_non_taxable")
      .reduce((s, i) => s + i.amount, 0);
    return {
      subtotalTaxable: totals.subtotalBeforeTax,
      tps: totals.taxGst,
      tvq: totals.taxQst,
      deboursNonTaxableTotal: Math.round(deboursNonTaxableTotal * 100) / 100,
      montantTotal: totals.totalInvoiceAmount,
      balanceDue: totals.balanceDue,
    };
  };

  const hasLocalEdits = editedItems !== null;
  const previewTotals = hasLocalEdits && invoice ? getPreviewTotals() : null;

  const updateItemMulti = (index: number, updates: Partial<InvoiceItem>) => {
    setEditedItems((prev) => {
      const base = prev ?? (invoice?.items ?? []) as InvoiceItem[];
      const next = [...base];
      const item = { ...next[index], ...updates };
      if (item.type === "rabais" && item.hours != null && item.rate != null) {
        item.amount = Math.round((item.hours * item.rate) * 100) / 100;
      }
      next[index] = item;
      return next;
    });
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number | null) => {
    setEditedItems((prev) => {
      const base = prev ?? (invoice?.items ?? []) as InvoiceItem[];
      const next = [...base];
      const item = { ...next[index], [field]: value };
      // Recalcul du montant si heures ou taux changent (honoraires)
      if ((field === "hours" || field === "rate") && item.type === "honoraires") {
        const h = field === "hours" ? (value != null ? Number(value) : 0) : (item.hours ?? 0);
        const r = field === "rate" ? (value != null ? Number(value) : 0) : (item.rate ?? 0);
        item.amount = Math.round((h * r) * 100) / 100;
      }
      // Recalcul du montant du rabais en mode "taux horaire" (heures × taux)
      if ((field === "hours" || field === "rate") && item.type === "rabais") {
        const h = field === "hours" ? (value != null ? Number(value) : 0) : (item.hours ?? 0);
        const r = field === "rate" ? (value != null ? Number(value) : 0) : (item.rate ?? 0);
        item.amount = Math.round((h * r) * 100) / 100;
      }
      next[index] = item;
      return next;
    });
  };

  /** Pour une ligne rabais : true si on utilise heures × taux, false si montant total */
  const isRabaisHourly = (item: InvoiceItem) =>
    item.type === "rabais" && item.hours != null && item.rate != null;

  const typeLabel: Record<string, string> = {
    honoraires: "Honoraires",
    frais_rappel: "Frais",
    debours_taxable: "Débours taxable",
    debours_non_taxable: "Débours non taxable",
    interets: "Intérêts",
    rabais: "Rabais",
  };

  // Lignes pour le tableau principal (honoraires + débours + rabais groupés sous leur parent)
  const mainTableRows = (() => {
    const all = displayItems.filter((i) => i.type !== "frais_rappel");
    const parents = all.filter(
      (i) => i.type !== "rabais" && !i.parentItemId && !i.parentLineId
    );
    const rabaisList = all.filter((i) => i.type === "rabais");
    const rows: InvoiceItem[] = [];
    for (const p of parents) {
      rows.push(p);
      rows.push(
        ...rabaisList.filter(
          (r) => r.parentLineId === p.id || r.parentItemId === p.id
        )
      );
    }
    return rows;
  })();

  // Lignes frais (après les taxes)
  const fraisRows = displayItems.filter((i) => i.type === "frais_rappel");
  const fraisTotal = fraisRows.reduce((s, i) => s + i.amount, 0);

  const findFlatIndex = (itemId: string) =>
    displayItems.findIndex((i) => i.id === itemId);

  const toDateValue = (d: string | Date) =>
    typeof d === "string" ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);

  const getItemsPayload = () => {
    const toSend = (editedItems ?? invoice?.items ?? []) as InvoiceItem[];
    return toSend.map((i) => ({
      id: i.id?.startsWith("new-") || i.id?.startsWith("new-rabais-") ? undefined : i.id,
      description: i.description.trim() || (i.type === "rabais" ? "Sans frais" : "Honoraires"),
      date: typeof i.date === "string" ? i.date : new Date(i.date).toISOString().slice(0, 10),
      hours: i.hours ?? null,
      rate: i.rate ?? null,
      amount: i.amount,
      type: i.type || "honoraires",
      professionalDisplayName: (i.userNom?.trim() && i.userNom.trim().length > 0) ? i.userNom.trim() : null,
      parentItemId: i.parentItemId ?? null,
      parentLineId: i.parentLineId ?? null,
      validationComment: i.validationComment ?? null,
    }));
  };

  const handleSave = async () => {
    const items = getItemsPayload();
    if (items.length === 0) return;
    try {
      await patchMutation.mutateAsync({ items });
      await refetch();
      setEditedItems(null);
    } catch (e) {
      alert((e as Error).message ?? "Erreur lors de l'enregistrement");
    }
  };

  const handleOverwrite = async () => {
    setSaveConfirmOpen(false);
    await handleSave();
  };

  const handleDuplicate = async () => {
    const items = getItemsPayload();
    if (items.length === 0) return;
    try {
      const data = await duplicateMutation.mutateAsync({ items });
      setSaveConfirmOpen(false);
      router.push(routes.facturationFactureEdit(data.id));
    } catch (e) {
      alert((e as Error).message ?? "Erreur lors de la duplication");
    }
  };

  const handleAddLine = () => {
    const base = (editedItems ?? invoice?.items ?? []) as InvoiceItem[];
    const newLine: InvoiceItem = {
      id: `new-${Date.now()}`,
      description: "Honoraires",
      date: new Date().toISOString().slice(0, 10),
      userNom: null,
      hours: null,
      rate: null,
      amount: 0,
      type: "honoraires",
    };
    setEditedItems([...base, newLine]);
  };

  const handleAddFrais = () => {
    const base = (editedItems ?? invoice?.items ?? []) as InvoiceItem[];
    const newLine: InvoiceItem = {
      id: `new-${Date.now()}`,
      description: "Frais",
      date: new Date().toISOString().slice(0, 10),
      userNom: null,
      hours: null,
      rate: null,
      amount: 0,
      type: "frais_rappel",
    };
    setEditedItems([...base, newLine]);
  };

  const handleAddRabais = (parentId: string, parentSource: "line" | "item") => {
    const base = (editedItems ?? invoice?.items ?? []) as InvoiceItem[];
    const newLine: InvoiceItem = {
      id: `new-rabais-${Date.now()}`,
      description: "Sans frais",
      date: new Date().toISOString().slice(0, 10),
      userNom: null,
      hours: null,
      rate: null,
      amount: 0,
      type: "rabais",
      parentLineId: parentSource === "line" ? parentId : null,
      parentItemId: parentSource === "item" ? parentId : null,
    };
    setEditedItems([...base, newLine]);
  };

  const removeItem = (itemId: string) => {
    setEditedItems((prev) => {
      const base = prev ?? (invoice?.items ?? []) as InvoiceItem[];
      return base.filter((i) => i.id !== itemId);
    });
  };

  const handleValider = async () => {
    try {
      await validerMutation.mutateAsync();
      refetch();
    } catch (e) {
      alert((e as Error).message ?? "Erreur lors de l'approbation");
    }
  };

  const handleEnvoyer = async () => {
    try {
      await envoyerMutation.mutateAsync();
      refetch();
      router.push(routes.facturationSuivi);
    } catch (e) {
      alert((e as Error).message ?? "Erreur lors de l'envoi");
    }
  };

  const handleAnnuler = async () => {
    if (!confirm("Annuler ce brouillon ? Les fiches de temps et débours reviendront dans « À facturer ».")) return;
    try {
      await annulerMutation.mutateAsync(undefined);
      router.push(routes.facturationHonoraires);
    } catch (e) {
      alert((e as Error).message ?? "Erreur lors de l'annulation");
    }
  };

  const handleEnvoyerAuClient = async () => {
    try {
      const result = await envoyerEmailMutation.mutateAsync();
      refetch();
      toast.success(`Facture envoyée à ${result.sentTo}`);
    } catch (e) {
      toast.error((e as Error).message ?? "Erreur lors de l'envoi de l'email");
    }
  };

  const handleCopierLien = async () => {
    setLienClientOpen(true);
    setLienClientUrl(null);
    setLienClientExpiresAt(null);
    setLienClientCopied(false);
    try {
      const result = await lienClientMutation.mutateAsync();
      setLienClientUrl(result.url);
      setLienClientExpiresAt(result.expiresAt);
    } catch (e) {
      toast.error((e as Error).message ?? "Erreur lors de la génération du lien");
      setLienClientOpen(false);
    }
  };

  const handleCopyLienClient = async () => {
    if (!lienClientUrl) return;
    try {
      await navigator.clipboard.writeText(lienClientUrl);
      setLienClientCopied(true);
      setTimeout(() => setLienClientCopied(false), 2000);
    } catch {
      alert("Impossible de copier le lien");
    }
  };

  if (isLoading || !invoice) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  const isDraft = invoice.statut === "brouillon";
  const isReadyToSend = invoice.invoiceStatus === "READY_TO_ISSUE";

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="rounded-xl bg-[var(--safe-sidebar-bg)] text-white p-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
          <Link
            href={routes.facturation}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
            Retour à la vue d&apos;ensemble
          </Link>
          <Link
            href={routes.facturationHonoraires}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
            Retour aux honoraires à facturer
          </Link>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Facture {invoice.numero} {!isDraft && `— ${invoice.statut}`}
        </h1>
        <p className="mt-1 text-white/80 text-sm">
          Client : {invoice.client?.raisonSociale} — Dossier :{" "}
          {invoice.dossier?.intitule ?? "Sans dossier"}
        </p>
      </header>

      <Card>
        <CardHeader title="Informations facture" />
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-600">Date d&apos;émission</span>
            <span>{formatDate(invoice.dateEmission)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Date d&apos;échéance</span>
            <span>
              {invoice.dateEmission && invoice.dateEcheance &&
              new Date(invoice.dateEmission).toDateString() === new Date(invoice.dateEcheance).toDateString()
                ? "Dû à la réception"
                : formatDate(invoice.dateEcheance)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Lignes d'honoraires"
          action={
            isDraft && (
              <div className="flex items-center gap-2">
                <Button
                  variant="tertiary"
                  onClick={handleAddLine}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une ligne
                </Button>
                {displayItems.length > 0 && (
                  <Button
                    variant="secondary"
                    onClick={() => setSaveConfirmOpen(true)}
                    disabled={patchMutation.isPending || duplicateMutation.isPending}
                    className="gap-2"
                  >
                    {patchMutation.isPending || duplicateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Enregistrer les modifications
                  </Button>
                )}
              </div>
            )
          }
        />
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left py-3 px-3 font-medium w-8" />
                  <th className="text-left py-3 px-3 font-medium">Date</th>
                  <th className="text-left py-3 px-3 font-medium">Type</th>
                  <th className="text-left py-3 px-3 font-medium">Description</th>
                  <th className="text-left py-3 px-3 font-medium">Professionnel</th>
                  <th className="text-right py-3 px-3 font-medium">Heures</th>
                  <th className="text-right py-3 px-3 font-medium">Taux</th>
                  <th className="text-right py-3 px-3 font-medium">Montant</th>
                  {isDraft && (
                    <th className="text-left py-3 px-3 font-medium min-w-[180px]">Commentaire / instructions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {mainTableRows.map((item: InvoiceItem) => {
                  const index = findFlatIndex(item.id);
                  const isRabais = item.type === "rabais";
                  const rabaisHourly = isRabais && isRabaisHourly(item);
                  const parentLine = isRabais
                    ? (displayItems as InvoiceItem[]).find(
                        (i) => i.id === item.parentItemId || i.id === item.parentLineId
                      )
                    : null;
                  const canAddRabais =
                    isDraft &&
                    !isRabais &&
                    (item.type === "honoraires" || item.source === "line") &&
                    !mainTableRows.some(
                      (r) => r.type === "rabais" && (r.parentLineId === item.id || r.parentItemId === item.id)
                    );
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-neutral-100 ${isRabais ? "bg-neutral-50/80" : ""}`}
                    >
                      <td className="py-2 px-3">
                        {isRabais && isDraft ? (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                            title="Supprimer le rabais"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : canAddRabais ? (
                          <Button
                            type="button"
                            variant="tertiary"
                            className="h-8 w-8 p-0 text-neutral-600"
                            onClick={() =>
                              handleAddRabais(item.id, item.source === "line" ? "line" : "item")
                            }
                            title="Appliquer un rabais (Sans frais)"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </Button>
                        ) : null}
                      </td>
                      <td className="py-2 px-3 text-neutral-600">
                        {!isRabais && (isDraft ? (
                          <input
                            type="date"
                            value={toDateValue(item.date)}
                            onChange={(e) => updateItem(index, "date", e.target.value)}
                            className="rounded border border-neutral-300 px-2 py-1 text-sm"
                          />
                        ) : (
                          formatDate(item.date)
                        ))}
                        {isRabais && <span className="text-neutral-400">—</span>}
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-xs font-medium text-neutral-600">
                          {typeLabel[item.type] ?? item.type}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {isDraft && !isRabais ? (
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(index, "description", e.target.value)}
                            className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
                          />
                        ) : isRabais && isDraft ? (
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateItem(index, "description", e.target.value)}
                              className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
                            />
                            <select
                              value={rabaisHourly ? "hourly" : "amount"}
                              onChange={(e) => {
                                if (e.target.value === "hourly") {
                                  updateItemMulti(index, {
                                    hours: 0,
                                    rate: parentLine?.rate ?? 0,
                                  });
                                } else {
                                  updateItemMulti(index, { hours: null, rate: null });
                                }
                              }}
                              className="rounded border border-neutral-300 px-2 py-1 text-xs text-neutral-600"
                            >
                              <option value="amount">Sur le montant total</option>
                              <option value="hourly">Sur le taux horaire (heures × taux)</option>
                            </select>
                          </div>
                        ) : (
                          item.description
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {isDraft && item.type === "honoraires" && !isRabais ? (
                          <input
                            type="text"
                            value={item.userNom ?? ""}
                            onChange={(e) => updateItem(index, "userNom", e.target.value)}
                            placeholder="Nom du professionnel"
                            className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
                          />
                        ) : (
                          !isRabais && (item.userNom ?? "—")
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {isDraft && item.type === "honoraires" && !isRabais ? (
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={item.hours ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              updateItem(index, "hours", v === "" ? null : parseFloat(v) || 0);
                            }}
                            placeholder="—"
                            className="w-20 rounded border border-neutral-300 px-2 py-1 text-sm text-right"
                          />
                        ) : isDraft && isRabais && rabaisHourly ? (
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={item.hours ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              updateItem(index, "hours", v === "" ? null : parseFloat(v) || 0);
                            }}
                            placeholder="0"
                            className="w-20 rounded border border-neutral-300 px-2 py-1 text-sm text-right"
                          />
                        ) : (
                          !isRabais && (item.hours != null ? `${item.hours.toFixed(1)} h` : isRabais && rabaisHourly ? `${(item.hours ?? 0).toFixed(1)} h` : "—")
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {isDraft && item.type === "honoraires" && !isRabais ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.rate ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              updateItem(index, "rate", v === "" ? null : parseFloat(v) || 0);
                            }}
                            placeholder="—"
                            className="w-24 rounded border border-neutral-300 px-2 py-1 text-sm text-right"
                          />
                        ) : isDraft && isRabais && rabaisHourly ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.rate ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              updateItem(index, "rate", v === "" ? null : parseFloat(v) || 0);
                            }}
                            placeholder="0"
                            className="w-24 rounded border border-neutral-300 px-2 py-1 text-sm text-right"
                          />
                        ) : (
                          !isRabais && (item.rate != null ? formatCurrency(item.rate) : isRabais && rabaisHourly && item.rate != null ? formatCurrency(item.rate) : "—")
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {isDraft ? (
                          rabaisHourly ? (
                            <span className="text-sm text-neutral-600" title="Calculé : heures × taux">
                              {formatCurrency(-Math.abs(item.amount))}
                            </span>
                          ) : (
                            <input
                              type="number"
                              step="0.01"
                              min={isRabais ? undefined : "0"}
                              value={item.amount}
                              onChange={(e) =>
                                updateItem(index, "amount", parseFloat(e.target.value) || 0)
                              }
                              className="w-24 rounded border border-neutral-300 px-2 py-1 text-sm text-right"
                            />
                          )
                        ) : (
                          formatCurrency(isRabais ? -Math.abs(item.amount) : item.amount)
                        )}
                      </td>
                      {isDraft && (
                        <td className="py-2 px-3 align-top">
                          <textarea
                            value={item.validationComment ?? ""}
                            onChange={(e) => updateItem(index, "validationComment", e.target.value)}
                            placeholder="Instructions pour cette ligne..."
                            rows={2}
                            className="w-full min-w-[180px] rounded border border-neutral-300 px-2 py-1 text-sm resize-y"
                          />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Totaux" />
        <CardContent className="space-y-2 text-sm">
          {(() => {
            const st = previewTotals ?? {
              subtotalTaxable: invoice.subtotalTaxable ?? 0,
              tps: invoice.tps ?? 0,
              tvq: invoice.tvq ?? 0,
              deboursNonTaxableTotal: invoice.deboursNonTaxableTotal ?? 0,
              montantTotal: invoice.montantTotal ?? 0,
              balanceDue: invoice.balanceDue ?? 0,
            };
            return (
              <>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Sous-total taxable</span>
                  <span>{formatCurrency(st.subtotalTaxable)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">TPS (5 %)</span>
                  <span>{formatCurrency(st.tps)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">TVQ (9,975 %)</span>
                  <span>{formatCurrency(st.tvq)}</span>
                </div>
                {st.deboursNonTaxableTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Débours non taxables</span>
                    <span>{formatCurrency(st.deboursNonTaxableTotal)}</span>
                  </div>
                )}
                {fraisRows.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Frais</span>
                    <span>{formatCurrency(fraisTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium pt-2 border-t border-neutral-200">
                  <span>Total facture</span>
                  <span>{formatCurrency(st.montantTotal)}</span>
                </div>
                {(invoice.montantPaye ?? 0) > 0 && (
                  <div className="flex justify-between text-neutral-600">
                    <span>Montant payé</span>
                    <span>{formatCurrency(invoice.montantPaye ?? 0)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium">
                  <span>Solde à payer</span>
                  <span>{formatCurrency(st.balanceDue)}</span>
                </div>
              </>
            );
          })()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Frais (après taxes)"
          action={
            isDraft && (
              <Button variant="tertiary" onClick={handleAddFrais} className="gap-1">
                <DollarSign className="w-4 h-4" />
                Ajouter des frais
              </Button>
            )
          }
        />
        <CardContent>
          {fraisRows.length === 0 ? (
            <p className="text-sm text-neutral-500 py-2">Aucun frais. Les frais sont ajoutés après les taxes.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="text-left py-2 px-3 font-medium">Description</th>
                    <th className="text-right py-2 px-3 font-medium">Montant</th>
                    {isDraft && <th className="w-10" />}
                  </tr>
                </thead>
                <tbody>
                  {fraisRows.map((item: InvoiceItem) => {
                    const index = findFlatIndex(item.id);
                    return (
                      <tr key={item.id} className="border-b border-neutral-100">
                        <td className="py-2 px-3">
                          {isDraft ? (
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateItem(index, "description", e.target.value)}
                              className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
                            />
                          ) : (
                            item.description
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {isDraft ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.amount}
                              onChange={(e) =>
                                updateItem(index, "amount", parseFloat(e.target.value) || 0)
                              }
                              className="w-24 rounded border border-neutral-300 px-2 py-1 text-sm text-right"
                            />
                          ) : (
                            formatCurrency(item.amount)
                          )}
                        </td>
                        {isDraft && (
                          <td className="py-2 px-3">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-700 p-1"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aperçu du modèle de facture */}
      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--safe-text-title)]">
          <FileText className="w-5 h-5 text-[var(--safe-green-700)]" />
          Aperçu de la facture
        </h2>
        <InvoiceTemplate
          numero={invoice.numero}
          dateEmission={invoice.dateEmission}
          dateEcheance={invoice.dateEcheance}
          statut={invoice.statut}
          cabinet={invoice.cabinet ?? undefined}
          client={invoice.client ?? undefined}
          dossier={invoice.dossier ?? undefined}
          items={displayItems.map((i) => ({
            id: i.id,
            type: i.type,
            description: i.description,
            date: i.date,
            hours: i.hours,
            rate: i.rate,
            amount: i.amount,
            userNom: i.userNom,
          }))}
          subtotalTaxable={previewTotals?.subtotalTaxable ?? invoice.subtotalTaxable ?? 0}
          tps={previewTotals?.tps ?? invoice.tps ?? 0}
          tvq={previewTotals?.tvq ?? invoice.tvq ?? 0}
          deboursNonTaxableTotal={previewTotals?.deboursNonTaxableTotal ?? invoice.deboursNonTaxableTotal ?? 0}
          montantTotal={previewTotals?.montantTotal ?? invoice.montantTotal ?? 0}
          montantPaye={invoice.montantPaye ?? 0}
          balanceDue={previewTotals?.balanceDue ?? invoice.balanceDue ?? 0}
          clientNote={invoice.clientNote}
        />
      </div>

      {isDraft && !isReadyToSend && (
        <div className="flex items-center gap-4 flex-wrap">
          <Button
            variant="primary"
            onClick={handleEnvoyer}
            disabled={envoyerMutation.isPending || validerMutation.isPending}
            className="gap-2"
          >
            {envoyerMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Approuver et marquer envoyée
          </Button>
          <Button
            variant="secondary"
            onClick={handleValider}
            disabled={validerMutation.isPending || envoyerMutation.isPending}
            className="gap-2"
          >
            {validerMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Approuver la facture
          </Button>
          <Button
            variant="tertiary"
            onClick={handleAnnuler}
            disabled={annulerMutation.isPending}
            className="gap-2 text-red-600 hover:text-red-700"
          >
            {annulerMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Annuler le brouillon
          </Button>
        </div>
      )}

      {isDraft && isReadyToSend && (
        <div className="flex items-center gap-4 flex-wrap">
          <Button
            variant="primary"
            onClick={handleEnvoyerAuClient}
            disabled={envoyerEmailMutation.isPending}
            className="gap-2"
          >
            {envoyerEmailMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Envoyer au client
          </Button>
          <Button
            variant="tertiary"
            onClick={handleCopierLien}
            disabled={lienClientMutation.isPending}
            className="gap-2"
          >
            {lienClientMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
            Copier le lien
          </Button>
          <Button
            variant="secondary"
            onClick={handleEnvoyer}
            disabled={envoyerMutation.isPending}
            className="gap-2"
          >
            {envoyerMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Marquer comme envoyée
          </Button>
          <Button
            variant="tertiary"
            onClick={handleAnnuler}
            disabled={annulerMutation.isPending}
            className="gap-2 text-red-600 hover:text-red-700"
          >
            {annulerMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Annuler le brouillon
          </Button>
        </div>
      )}

      {!isDraft && !invoice.cancelledAt && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            onClick={handleEnvoyerAuClient}
            disabled={envoyerEmailMutation.isPending}
            className="gap-2"
          >
            {envoyerEmailMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Envoyer au client
          </Button>
          <Button
            variant="tertiary"
            onClick={handleCopierLien}
            disabled={lienClientMutation.isPending}
            className="gap-2"
          >
            {lienClientMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
            Copier le lien
          </Button>
          <Link href={routes.client(invoice.clientId)}>
            <Button variant="tertiary">Retour au client</Button>
          </Link>
        </div>
      )}

      {!isDraft && invoice.cancelledAt && (
        <Link href={routes.client(invoice.clientId)}>
          <Button variant="secondary">Retour au client</Button>
        </Link>
      )}

      <Modal
        open={saveConfirmOpen}
        onClose={() => setSaveConfirmOpen(false)}
        title="Enregistrer les modifications"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            En enregistrant, vous remplacerez la facture actuelle par les nouvelles valeurs.
            Les fiches de temps et fiches de frais liées seront mises à jour en conséquence.
            Voulez-vous écraser la facture actuelle ou créer une copie (dupliquer) ?
          </p>
          <div className="flex flex-wrap gap-3 justify-end">
            <Button
              variant="tertiary"
              onClick={() => setSaveConfirmOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="secondary"
              onClick={handleDuplicate}
              disabled={duplicateMutation.isPending || patchMutation.isPending}
              className="gap-2"
            >
              {duplicateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              Dupliquer
            </Button>
            <Button
              variant="primary"
              onClick={handleOverwrite}
              disabled={patchMutation.isPending || duplicateMutation.isPending}
              className="gap-2"
            >
              {patchMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Écraser
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={lienClientOpen}
        onClose={() => {
          setLienClientOpen(false);
          setLienClientUrl(null);
          setLienClientExpiresAt(null);
        }}
        title="Envoyer au client"
      >
        <div className="space-y-4">
          {lienClientUrl ? (
            <>
              <p className="text-sm text-neutral-600">
                Copiez ce lien et envoyez-le à votre client. Il pourra consulter la facture sans se connecter.
                {lienClientExpiresAt && (
                  <span className="block mt-2 text-neutral-500">
                    Lien valide jusqu&apos;au{" "}
                    {new Date(lienClientExpiresAt).toLocaleDateString("fr-CA", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    .
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={lienClientUrl}
                  className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm bg-neutral-50"
                />
                <Button
                  variant="secondary"
                  onClick={handleCopyLienClient}
                  className="gap-1 shrink-0"
                >
                  {lienClientCopied ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {lienClientCopied ? "Copié" : "Copier"}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Génération du lien…
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="tertiary" onClick={() => setLienClientOpen(false)}>
              Fermer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
