"use client";
import { useFormatteurs } from "@/lib/i18n/formatteurs";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2 } from "lucide-react";
import { MotifAnnulationModal } from "@/components/comptabilite/MotifAnnulationModal";
import type { JournalCorrectionMotive } from "@prisma/client";
import { toCalendarDayUTC, toIsoDay } from "@/lib/utils/calendar-date";

const selectClass =
  "w-full h-10 px-3 rounded-xl border border-si-line bg-si-canvas/80 text-sm text-si-ink placeholder:text-si-muted/50 focus:bg-si-surface focus:ring-2 focus:ring-si-verified/20 focus:border-si-verified outline-none transition-all";

function clientLabel(client: { raisonSociale: string | null; prenom?: string | null; nom?: string | null }) {
  const company = client.raisonSociale?.trim();
  if (company) return company;
  const person = [client.prenom, client.nom].filter(Boolean).join(" ").trim();
  return person || "Client sans nom";
}

type PendingEdit = {
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string | null;
  note: string | null;
};

/**
 * Un changement est MATÉRIEL quand il touche ce que le journal a déjà inscrit :
 * le montant ou la date. Le mode de paiement, la référence et la note décrivent
 * l'encaissement sans en changer l'effet comptable, ils se corrigent librement.
 *
 * Miroir de la détection serveur dans `updatePayment` : les deux doivent dire la
 * même chose, sinon l'écran demande un motif que le serveur ignore, ou l'inverse.
 */
function estChangementMateriel(avant: PaymentFormPayment, apres: PendingEdit): boolean {
  const montantChange = Math.abs(apres.amount - avant.montant) > 0.005;
  const dateChange = apres.paymentDate.slice(0, 10) !== avant.datePaiement.slice(0, 10);
  return montantChange || dateChange;
}

export type PaymentFormPayment = {
  id: string;
  clientId: string | null;
  datePaiement: string;
  montant: number;
  paymentMethod: string | null;
  referenceNumber: string | null;
  note: string | null;
  allocatedAmount: number;
  unallocatedAmount: number;
};

export interface PaiementFormModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  paymentId?: string | null;
  clients: { id: string; raisonSociale: string | null; prenom?: string | null; nom?: string | null }[];
  invoices: {
    id: string;
    numero: string;
    clientId: string | null;
    balanceDue: number;
    totalInvoiceAmount: number;
    totalPaidAmount: number;
  }[];
  onSuccess?: () => void;
}

export function PaiementFormModal({
  open,
  onClose,
  mode,
  paymentId,
  clients,
  invoices,
  onSuccess,
}: PaiementFormModalProps) {
  const tp = useTranslations("payments");
  const { formatCurrency } = useFormatteurs();
  const tc = useTranslations("common");
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<PaymentFormPayment | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [allocatedAmount, setAllocatedAmount] = useState<string>("0");
  const [pendingEdit, setPendingEdit] = useState<PendingEdit | null>(null);
  const [motifSubmitting, setMotifSubmitting] = useState(false);
  const [motifError, setMotifError] = useState<string | null>(null);

  const isEdit = mode === "edit" && paymentId;

  const PAYMENT_METHODS = [
    { value: "cash", label: tp("paymentMethodCash") },
    { value: "cheque", label: tp("paymentMethodCheque") },
    { value: "e_transfer", label: tp("paymentMethodTransfer") },
    { value: "card", label: tp("paymentMethodCard") },
    { value: "bank_transfer", label: tp("paymentMethodBankTransfer") },
    { value: "trust", label: tp("paymentMethodTrust") },
    { value: "other", label: tp("paymentMethodOther") },
  ];

  const invoicesForSelectedClient =
    mode === "create" && selectedClientId
      ? invoices.filter(
          (inv) => inv.clientId === selectedClientId && inv.balanceDue > 0
        )
      : [];
  const selectedInvoice = invoicesForSelectedClient.find((inv) => inv.id === selectedInvoiceId);

  useEffect(() => {
    if (!open || !isEdit) {
      setPayment(null);
      return;
    }
    setLoadingPayment(true);
    fetch(`/api/facturation/paiements/${paymentId}`)
      .then((res) => {
        if (!res.ok) throw new Error(tp("paymentNotFound"));
        return res.json();
      })
      .then((data) => {
        setPayment({
          id: data.id,
          clientId: data.clientId,
          datePaiement: data.datePaiement?.slice(0, 10) ?? "",
          montant: data.montant,
          paymentMethod: data.paymentMethod ?? "other",
          referenceNumber: data.referenceNumber ?? data.reference ?? null,
          note: data.note ?? null,
          allocatedAmount: data.allocatedAmount ?? 0,
          unallocatedAmount: data.unallocatedAmount ?? 0,
        });
      })
      .catch(() => setPayment(null))
      .finally(() => setLoadingPayment(false));
  }, [open, isEdit, paymentId, tp]);

  useEffect(() => {
    if (!open || mode !== "create") return;
    setSelectedClientId("");
    setSelectedInvoiceId("");
    setPaymentAmount("");
    setAllocatedAmount("0");
  }, [open, mode]);

  function handleClientChange(nextClientId: string) {
    setSelectedClientId(nextClientId);
    setSelectedInvoiceId("");
    setAllocatedAmount("0");
  }

  function handleInvoiceChange(nextInvoiceId: string) {
    setSelectedInvoiceId(nextInvoiceId);
    const invoice = invoicesForSelectedClient.find((inv) => inv.id === nextInvoiceId);
    if (!invoice) {
      setAllocatedAmount("0");
      return;
    }
    const balance = Math.max(0, invoice.balanceDue);
    const amount = Number(paymentAmount || 0);
    const allocation = amount > 0 ? Math.min(amount, balance) : balance;
    setAllocatedAmount(allocation.toFixed(2));
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      setPaymentAmount(balance.toFixed(2));
    }
  }

  function handleAmountChange(nextAmount: string) {
    setPaymentAmount(nextAmount);
    if (!selectedInvoice) return;
    const amount = Number(nextAmount || 0);
    const allocation = amount > 0 ? Math.min(amount, selectedInvoice.balanceDue) : 0;
    setAllocatedAmount(allocation.toFixed(2));
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      clientId: formData.get("clientId") as string,
      paymentDate: formData.get("paymentDate") as string,
      amount: Number(formData.get("amount")),
      paymentMethod: (formData.get("paymentMethod") as string) || "other",
      referenceNumber: (formData.get("referenceNumber") as string) || null,
      note: (formData.get("note") as string) || null,
      invoiceId: (formData.get("invoiceId") as string) || null,
      allocatedAmount: formData.get("invoiceId")
        ? Number(formData.get("allocatedAmount") || 0)
        : undefined,
    };

    try {
      if (mode === "create") {
        const res = await fetch("/api/facturation/paiements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? tp("errorSaving"));
      } else if (paymentId) {
        const patch = {
          paymentDate: payload.paymentDate,
          amount: payload.amount,
          paymentMethod: payload.paymentMethod,
          referenceNumber: payload.referenceNumber,
          note: payload.note,
        };

        // Le montant et la date sont les deux seules valeurs que le journal a
        // inscrites. Les changer corrige une écriture comptable, pas un champ de
        // fiche : le serveur exige un motif, l'écran le demande avant d'envoyer
        // plutôt que de renvoyer une erreur après coup.
        // Doctrine: docs/accounting/DOCTRINE_ANNULATION_CORRECTION.md §1.2.
        if (payment && estChangementMateriel(payment, patch)) {
          setPendingEdit(patch);
          setSubmitting(false);
          return;
        }

        await envoyerPatch(patch, null, null);
      }
      queryClient.invalidateQueries({ queryKey: ["facturation", "paiements"] });
      form.reset();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : tp("errorOccurred"));
    } finally {
      setSubmitting(false);
    }
  };

  async function envoyerPatch(
    patch: PendingEdit,
    motifCode: JournalCorrectionMotive | null,
    motifTexte: string | null,
  ) {
    const res = await fetch(`/api/facturation/paiements/${paymentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...patch, motifCode, motifTexte }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? tp("errorModifying"));
  }

  async function handleConfirmMotif(
    motifCode: JournalCorrectionMotive,
    motifTexte: string | null,
  ) {
    if (!pendingEdit) return;
    setMotifSubmitting(true);
    setMotifError(null);
    try {
      await envoyerPatch(pendingEdit, motifCode, motifTexte);
      queryClient.invalidateQueries({ queryKey: ["facturation", "paiements"] });
      setPendingEdit(null);
      onSuccess?.();
      onClose();
    } catch (err) {
      setMotifError(err instanceof Error ? err.message : tp("errorOccurred"));
    } finally {
      setMotifSubmitting(false);
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setError(null);
      setPayment(null);
      onClose();
    }
  };

  const minAmount = isEdit && payment ? payment.allocatedAmount : 0;

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title={mode === "create" ? tp("newPayment") : tp("editPayment")}
      >
      {isEdit && loadingPayment ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-si-muted/50" />
        </div>
      ) : isEdit && !payment ? (
        <p className="text-si-muted py-4">{tp("paymentNotFound")}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-si-muted mb-1.5">{tc("client")} *</label>
            <select
              name="clientId"
              required
              disabled={!!isEdit}
              value={isEdit ? payment?.clientId ?? "" : selectedClientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className={`${selectClass} disabled:opacity-70 disabled:bg-si-canvas`}
            >
              <option value="">{tp("selectClient")}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {clientLabel(c)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-si-muted mb-1.5">{tc("date")} *</label>
              <input
                type="date"
                name="paymentDate"
                required
                defaultValue={payment?.datePaiement ?? toIsoDay(toCalendarDayUTC(new Date()))}
                className={selectClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-si-muted mb-1.5">{tp("amountRequired")}</label>
              <input
                type="number"
                name="amount"
                required
                min={minAmount}
                step="0.01"
                defaultValue={mode === "edit" ? payment?.montant : undefined}
                value={mode === "create" ? paymentAmount : undefined}
                onChange={mode === "create" ? (e) => handleAmountChange(e.target.value) : undefined}
                className={selectClass}
                placeholder="0.00"
              />
              {isEdit && payment && payment.allocatedAmount > 0 && (
                <p className="text-xs text-si-muted mt-1">
                  {tp("minimumAllocated", { amount: formatCurrency(payment.allocatedAmount) })}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-si-muted mb-1.5">{tp("paymentMethod")}</label>
            <select
              name="paymentMethod"
              defaultValue={payment?.paymentMethod ?? "other"}
              className={selectClass}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label={tp("referenceNumber")}
            name="referenceNumber"
            placeholder={tc("optional")}
            defaultValue={payment?.referenceNumber ?? ""}
          />

          <Input
            label={tp("note")}
            name="note"
            placeholder={tc("optional")}
            defaultValue={payment?.note ?? ""}
          />

          {mode === "create" && (
            <>
              <div>
                <label className="block text-sm font-medium text-si-muted mb-1.5">
                  {tp("allocateToInvoice")}
                </label>
                <select
                  name="invoiceId"
                  id="invoiceId"
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  className={selectClass}
                >
                  <option value="">{tp("noInvoice")}</option>
                  {invoicesForSelectedClient.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.numero} — {tp("balance")} {formatCurrency(inv.balanceDue)}
                      </option>
                    ))}
                </select>
              </div>
              <div id="allocatedAmountWrap">
                <label className="block text-sm font-medium text-si-muted mb-1.5">
                  {tp("amountToAllocate")}
                </label>
                <input
                  type="number"
                  name="allocatedAmount"
                  min="0"
                  step="0.01"
                  value={allocatedAmount}
                  onChange={(e) => setAllocatedAmount(e.target.value)}
                  className={selectClass}
                  placeholder="0.00"
                />
                {selectedInvoice && (
                  <p className="text-xs text-si-muted mt-1">
                    Solde facture : {formatCurrency(selectedInvoice.balanceDue)}
                  </p>
                )}
              </div>
            </>
          )}

          {error && <p className="text-sm text-[#B84A3E]">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={submitting}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? tc("saving") : mode === "create" ? tc("save") : tp("saveModifications")}
            </Button>
          </div>
        </form>
      )}
      </Modal>

      {/* Rendue en frère du formulaire, pas dedans : deux modales imbriquées se
          disputent le focus et la fermeture au clavier. */}
      <MotifAnnulationModal
        open={pendingEdit !== null}
        onClose={() => {
          setPendingEdit(null);
          setMotifError(null);
        }}
        onConfirm={handleConfirmMotif}
        title={tp("editPaymentMotifTitle")}
        intro={tp("editPaymentMotifIntro")}
        cible={
          pendingEdit && payment
            ? `${formatCurrency(payment.montant)} → ${formatCurrency(pendingEdit.amount)}`
            : null
        }
        submitting={motifSubmitting}
        error={motifError}
      />
    </>
  );
}
