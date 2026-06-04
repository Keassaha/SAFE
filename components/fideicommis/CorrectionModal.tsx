"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCreateTrustCorrection, useTrustBalance, type TrustTransactionRow } from "@/lib/hooks/useFideicommis";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { toast } from "sonner";

interface CorrectionModalProps {
  open: boolean;
  onClose: () => void;
  cabinetId: string | null;
  /** Transaction d'origine que l'on corrige (fournit client, dossier et correctionOfId). */
  target: TrustTransactionRow | null;
  onSuccess?: () => void;
}

type Sens = "increase" | "decrease";

export function CorrectionModal({ open, onClose, cabinetId, target, onSuccess }: CorrectionModalProps) {
  const tf = useTranslations("fideicommis");
  const tc = useTranslations("common");
  const [sens, setSens] = useState<Sens>("increase");
  const [montant, setMontant] = useState("");
  const [dateTransaction, setDateTransaction] = useState(() => new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const createCorrection = useCreateTrustCorrection();
  const { data: soldeData } = useTrustBalance(
    cabinetId,
    target?.clientId ?? null,
    target?.dossierId ?? null
  );
  const solde = soldeData?.solde ?? 0;

  const parsedAmount = parseFloat(montant.replace(",", "."));
  const signedMontant =
    Number.isNaN(parsedAmount) ? NaN : sens === "increase" ? parsedAmount : -parsedAmount;
  const soldeApres = Number.isNaN(signedMontant) ? solde : solde + signedMontant;

  const reset = () => {
    setSens("increase");
    setMontant("");
    setReference("");
    setDescription("");
    setDateTransaction(new Date().toISOString().slice(0, 10));
    setConfirmOpen(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error(tf("invalidAmount"));
      return;
    }
    if (!description.trim()) {
      toast.error(tf("correctionReasonRequired"));
      return;
    }
    if (soldeApres < 0) {
      toast.error(tf("correctionWouldGoNegative", { amount: formatCurrency(solde) }));
      return;
    }
    setConfirmOpen(true);
  };

  const confirmCorrection = () => {
    if (!target) return;
    createCorrection.mutate(
      {
        clientId: target.clientId,
        dossierId: target.dossierId ?? "",
        montant: signedMontant,
        dateTransaction,
        correctionOfId: target.id,
        description: description.trim(),
        reference: reference.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(tf("correctionRecorded"));
          handleClose();
          onSuccess?.();
        },
        onError: (err) => {
          toast.error(err.message);
          setConfirmOpen(false);
        },
      }
    );
  };

  const targetTypeLabel = target
    ? ({ deposit: tf("typeDeposit"), withdrawal: tf("typeWithdrawal"), correction: tf("typeCorrection") }[
        target.type
      ] ?? target.type)
    : "";

  return (
    <Modal open={open} onClose={handleClose} title={tf("correctionTitle")}>
      {target && (
        <div className="space-y-4">
          <div className="rounded-safe-sm border border-neutral-border bg-neutral-50/80 p-3 text-sm">
            <p className="text-neutral-muted mb-1">{tf("correctionTargetLabel")}</p>
            <p className="text-neutral-text-primary font-medium">
              {targetTypeLabel} · {formatCurrency(target.amount)} · {formatDate(target.date)}
            </p>
            <p className="text-neutral-muted mt-1">
              {target.client?.raisonSociale ?? "—"}
              {target.dossier
                ? ` · ${target.dossier.numeroDossier ? `${target.dossier.numeroDossier} – ` : ""}${target.dossier.intitule}`
                : ""}
            </p>
            <p className="text-neutral-muted mt-2">
              {tf("availableBalance")} :{" "}
              <strong className="text-neutral-text-primary">{formatCurrency(solde)}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                {tf("correctionDirection")} <span className="text-status-error">*</span>
              </label>
              <select
                value={sens}
                onChange={(e) => setSens(e.target.value as Sens)}
                className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 focus:ring-2 focus:ring-primary-500/30 outline-none"
              >
                <option value="increase">{tf("correctionIncrease")}</option>
                <option value="decrease">{tf("correctionDecrease")}</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={tf("amountCAD")}
                type="text"
                inputMode="decimal"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                placeholder="0,00"
                required
              />
              <Input
                label={tc("date")}
                type="date"
                value={dateTransaction}
                onChange={(e) => setDateTransaction(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                {tf("correctionReason")} <span className="text-status-error">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
                placeholder={tf("correctionReasonPlaceholder")}
                className="w-full px-3 py-2 rounded-safe border border-neutral-border bg-white/90 focus:ring-2 focus:ring-primary-500/30 outline-none resize-y"
              />
            </div>

            <Input
              label={tf("reference")}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={tf("referencePlaceholder")}
            />

            {!Number.isNaN(signedMontant) && montant.trim() !== "" && (
              <p className="text-sm text-neutral-muted">
                {tf("balanceAfterOperation")} :{" "}
                <strong className={soldeApres < 0 ? "text-status-error" : "text-neutral-text-primary"}>
                  {formatCurrency(soldeApres)}
                </strong>
              </p>
            )}

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="secondary" onClick={handleClose}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={createCorrection.isPending}>
                {createCorrection.isPending ? tf("saving") : tf("saveCorrection")}
              </Button>
            </div>
          </form>

          {confirmOpen && (
            <div
              className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-correction-title"
            >
              <div className="bg-white rounded-safe shadow-lg max-w-md w-full p-6">
                <h2
                  id="confirm-correction-title"
                  className="text-lg font-semibold text-neutral-text-primary mb-2 tracking-tight"
                >
                  {tf("confirmCorrection")}
                </h2>
                <p className="text-sm text-neutral-muted mb-4">
                  {tf("correctionSummary", {
                    direction: sens === "increase" ? tf("correctionIncrease") : tf("correctionDecrease"),
                    amount: formatCurrency(Math.abs(signedMontant)),
                  })}{" "}
                  {tf("balanceAfterOperation")} : {formatCurrency(soldeApres)}.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)}>
                    {tc("cancel")}
                  </Button>
                  <Button type="button" onClick={confirmCorrection} disabled={createCorrection.isPending}>
                    {createCorrection.isPending ? tf("saving") : tc("confirm")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
