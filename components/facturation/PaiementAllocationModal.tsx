"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/format";
import { Loader2 } from "lucide-react";

const selectClass =
  "w-full h-10 px-3 rounded-safe border border-neutral-200 bg-neutral-50/80 text-sm text-neutral-800 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all";

export interface PaiementAllocationModalProps {
  open: boolean;
  onClose: () => void;
  paymentId: string;
  paymentSummary?: {
    montant: number;
    allocatedAmount: number;
    unallocatedAmount: number;
    clientId?: string | null;
  };
  invoices: {
    id: string;
    numero: string;
    clientId: string | null;
    balanceDue: number;
  }[];
  onSuccess?: () => void;
}

export function PaiementAllocationModal({
  open,
  onClose,
  paymentId,
  paymentSummary,
  invoices,
  onSuccess,
}: PaiementAllocationModalProps) {
  const tp = useTranslations("payments");
  const tc = useTranslations("common");
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<{
    montant: number;
    allocatedAmount: number;
    unallocatedAmount: number;
    clientId: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");
  const [allocatedAmount, setAllocatedAmount] = useState("");

  useEffect(() => {
    if (!open || !paymentId) return;
    if (paymentSummary) {
      setPayment({
        montant: paymentSummary.montant,
        allocatedAmount: paymentSummary.allocatedAmount,
        unallocatedAmount: paymentSummary.unallocatedAmount,
        clientId: paymentSummary.clientId ?? null,
      });
      return;
    }
    setLoading(true);
    fetch(`/api/facturation/paiements/${paymentId}`)
      .then((res) => res.ok ? res.json() : Promise.reject(new Error("Erreur")))
      .then((data) => {
        setPayment({
          montant: data.montant,
          allocatedAmount: data.allocatedAmount ?? 0,
          unallocatedAmount: data.unallocatedAmount ?? 0,
          clientId: data.clientId,
        });
      })
      .catch(() => setPayment(null))
      .finally(() => setLoading(false));
  }, [open, paymentId, paymentSummary]);

  const invoicesEligible = payment?.clientId
    ? invoices.filter(
        (inv) => inv.clientId === payment.clientId && inv.balanceDue > 0
      )
    : invoices.filter((inv) => inv.balanceDue > 0);

  const maxAllocatable = payment?.unallocatedAmount ?? 0;
  const amountNum = parseFloat(allocatedAmount) || 0;
  const isValid = invoiceId && amountNum > 0 && amountNum <= maxAllocatable;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/facturation/paiements/${paymentId}/allocate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allocations: [{ invoiceId, allocatedAmount: amountNum }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? tp("errorAllocating"));
      queryClient.invalidateQueries({ queryKey: ["facturation", "paiements"] });
      setInvoiceId("");
      setAllocatedAmount("");
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
      setInvoiceId("");
      setAllocatedAmount("");
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={tp("allocatePayment")}>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      ) : !payment ? (
        <p className="text-neutral-500 py-4">{tp("paymentNotFound")}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-safe-sm bg-neutral-50 p-4 text-sm">
            <p className="font-medium text-neutral-800">{tp("totalAmountLabel")} : {formatCurrency(payment.montant)}</p>
            <p className="text-neutral-600">
              {tp("alreadyAllocated")} : {formatCurrency(payment.allocatedAmount)} — {tp("unallocated")} :{" "}
              {formatCurrency(payment.unallocatedAmount)}
            </p>
          </div>
          {payment.unallocatedAmount <= 0 ? (
            <p className="text-neutral-500">{tp("fullyAllocated")}</p>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1.5">{tp("invoiceRequired")}</label>
                <select
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  required
                  className={selectClass}
                >
                  <option value="">{tp("selectInvoice")}</option>
                  {invoicesEligible.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.numero} — {tp("balance")} {formatCurrency(inv.balanceDue)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1.5">
                  {tp("amountToAllocateRequired")} (max. {formatCurrency(maxAllocatable)})
                </label>
                <input
                  type="number"
                  min="0.01"
                  max={maxAllocatable}
                  step="0.01"
                  value={allocatedAmount}
                  onChange={(e) => setAllocatedAmount(e.target.value)}
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
            <Button
              type="submit"
              disabled={submitting || payment.unallocatedAmount <= 0 || !isValid}
            >
              {submitting ? tc("saving") : tp("allocate")}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
