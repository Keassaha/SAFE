"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

const selectClass =
  "w-full h-10 px-3 rounded-xl border border-neutral-200 bg-neutral-50/80 text-sm text-neutral-800 placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all";

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
  clients: { id: string; raisonSociale: string }[];
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
  const tc = useTranslations("common");
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<PaymentFormPayment | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

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
        const res = await fetch(`/api/facturation/paiements/${paymentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentDate: payload.paymentDate,
            amount: payload.amount,
            paymentMethod: payload.paymentMethod,
            referenceNumber: payload.referenceNumber,
            note: payload.note,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? tp("errorModifying"));
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

  const handleClose = () => {
    if (!submitting) {
      setError(null);
      setPayment(null);
      onClose();
    }
  };

  const minAmount = isEdit && payment ? payment.allocatedAmount : 0;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={mode === "create" ? tp("newPayment") : tp("editPayment")}
    >
      {isEdit && loadingPayment ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      ) : isEdit && !payment ? (
        <p className="text-neutral-500 py-4">{tp("paymentNotFound")}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1.5">{tc("client")} *</label>
            <select
              name="clientId"
              required
              disabled={!!isEdit}
              value={isEdit ? payment?.clientId ?? "" : selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className={`${selectClass} disabled:opacity-70 disabled:bg-neutral-100`}
            >
              <option value="">{tp("selectClient")}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.raisonSociale}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1.5">{tc("date")} *</label>
              <input
                type="date"
                name="paymentDate"
                required
                defaultValue={payment?.datePaiement ?? new Date().toISOString().slice(0, 10)}
                className={selectClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1.5">{tp("amountRequired")}</label>
              <input
                type="number"
                name="amount"
                required
                min={minAmount}
                step="0.01"
                defaultValue={payment?.montant}
                className={selectClass}
                placeholder="0,00"
              />
              {isEdit && payment && payment.allocatedAmount > 0 && (
                <p className="text-xs text-neutral-500 mt-1">
                  {tp("minimumAllocated", { amount: formatCurrency(payment.allocatedAmount) })}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1.5">{tp("paymentMethod")}</label>
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
                <label className="block text-sm font-medium text-neutral-600 mb-1.5">
                  {tp("allocateToInvoice")}
                </label>
                <select
                  name="invoiceId"
                  id="invoiceId"
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
                <label className="block text-sm font-medium text-neutral-600 mb-1.5">
                  {tp("amountToAllocate")}
                </label>
                <input
                  type="number"
                  name="allocatedAmount"
                  min="0"
                  step="0.01"
                  defaultValue="0"
                  className={selectClass}
                  placeholder="0,00"
                />
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

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
  );
}
