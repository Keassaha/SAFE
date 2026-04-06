"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCreateTrustWithdrawal, useTrustBalance } from "@/lib/hooks/useFideicommis";
import { formatCurrency } from "@/lib/utils/format";
import { toast } from "sonner";

interface ClientOption {
  id: string;
  raisonSociale: string;
}

interface DossierOption {
  id: string;
  clientId: string;
  intitule: string;
  numeroDossier: string | null;
}

interface RetraitFormProps {
  cabinetId: string | null;
  clients: ClientOption[];
  dossiers: DossierOption[];
  onSuccess?: () => void;
  disabled?: boolean;
  embedded?: boolean;
}

export function RetraitForm({
  cabinetId,
  clients,
  dossiers,
  onSuccess,
  disabled,
  embedded,
}: RetraitFormProps) {
  const tf = useTranslations("fideicommis");
  const tc = useTranslations("common");
  const [clientId, setClientId] = useState("");
  const [dossierId, setDossierId] = useState("");
  const [montant, setMontant] = useState("");
  const [dateTransaction, setDateTransaction] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [factureId, setFactureId] = useState("");
  const [modePaiement, setModePaiement] = useState<"CHEQUE" | "VIREMENT" | "INTERAC" | "ESPECES" | "AUTRE">("VIREMENT");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<{
    clientId: string;
    dossierId: string;
    montant: number;
    dateTransaction: string;
    factureId?: string | null;
    modePaiement?: string | null;
    reference?: string | null;
    description?: string | null;
  } | null>(null);

  const MODES_PAIEMENT = [
    { value: "CHEQUE", label: tf("paymentModeCheque") },
    { value: "VIREMENT", label: tf("paymentModeTransfer") },
    { value: "INTERAC", label: tf("paymentModeInterac") },
    { value: "ESPECES", label: tf("paymentModeCash") },
    { value: "AUTRE", label: tf("paymentModeOther") },
  ] as const;

  const { data: soldeData } = useTrustBalance(cabinetId, clientId || null, dossierId || null);
  const solde = soldeData?.solde ?? 0;
  const createWithdrawal = useCreateTrustWithdrawal();
  const dossiersForClient = clientId
    ? dossiers.filter((d) => d.clientId === clientId)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !dossierId) {
      toast.error(tf("selectClientAndMatter"));
      return;
    }
    const amount = parseFloat(montant.replace(",", "."));
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error(tf("invalidAmount"));
      return;
    }
    if (amount > solde) {
      toast.error(tf("insufficientBalance", { amount: formatCurrency(solde) }));
      return;
    }
    const payload = {
      clientId,
      dossierId,
      montant: amount,
      dateTransaction,
      factureId: factureId || undefined,
      modePaiement,
      reference: reference || undefined,
      description: description || undefined,
    };
    setPendingPayload(payload);
    setConfirmOpen(true);
  };

  const confirmWithdrawal = () => {
    if (!pendingPayload) return;
    createWithdrawal.mutate(pendingPayload, {
      onSuccess: () => {
        toast.success(tf("withdrawalRecorded"));
        setMontant("");
        setReference("");
        setDescription("");
        setFactureId("");
        setConfirmOpen(false);
        setPendingPayload(null);
        onSuccess?.();
      },
      onError: (err) => {
        toast.error(err.message);
        setConfirmOpen(false);
        setPendingPayload(null);
      },
    });
  };

  const formContent = (
    <>
      {soldeData != null && clientId && dossierId && (
        <p className="text-sm text-neutral-muted mb-3">
          {tf("availableBalance")} : <strong className="text-neutral-text-primary">{formatCurrency(solde)}</strong>
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                {tc("client")} <span className="text-status-error">*</span>
              </label>
              <select
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  setDossierId("");
                }}
                required
                disabled={disabled}
                className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 focus:ring-2 focus:ring-primary-500/30 outline-none"
              >
                <option value="">{tf("selectClient")}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.raisonSociale}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                {tc("dossier")} <span className="text-status-error">*</span>
              </label>
              <select
                value={dossierId}
                onChange={(e) => setDossierId(e.target.value)}
                required
                disabled={disabled || !clientId}
                className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 focus:ring-2 focus:ring-primary-500/30 outline-none"
              >
                <option value="">{tf("selectMatter")}</option>
                {dossiersForClient.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.numeroDossier ? `${d.numeroDossier} – ` : ""}{d.intitule}
                  </option>
                ))}
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
                disabled={disabled}
              />
              <Input
                label={tc("date")}
                type="date"
                value={dateTransaction}
                onChange={(e) => setDateTransaction(e.target.value)}
                required
                disabled={disabled}
              />
            </div>
            <Input
              label={tf("linkedInvoice")}
              value={factureId}
              onChange={(e) => setFactureId(e.target.value)}
              placeholder={tf("invoiceIdPlaceholder")}
              disabled={disabled}
            />
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                {tf("paymentMode")}
              </label>
              <select
                value={modePaiement}
                onChange={(e) => setModePaiement(e.target.value as typeof modePaiement)}
                disabled={disabled}
                className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 focus:ring-2 focus:ring-primary-500/30 outline-none"
              >
                {MODES_PAIEMENT.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label={tf("reference")}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={tf("referencePlaceholder")}
              disabled={disabled}
            />
            <Input
              label={tf("description")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tf("descriptionPlaceholder")}
              disabled={disabled}
            />
            {!description.trim() && (
              <p className="text-amber-600 text-sm">
                {tf("descriptionRecommendation")}
              </p>
            )}
            <Button type="submit" disabled={disabled || createWithdrawal.isPending}>
              {createWithdrawal.isPending ? tf("saving") : tf("saveWithdrawal")}
            </Button>
          </form>
    </>
  );

  const confirmDialog = confirmOpen && pendingPayload && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-retrait-title"
    >
      <div className="bg-white rounded-safe shadow-lg max-w-md w-full p-6">
        <h2 id="confirm-retrait-title" className="text-lg font-semibold text-neutral-text-primary mb-2 tracking-tight">
          {tf("confirmWithdrawal")}
        </h2>
        <p className="text-sm text-neutral-muted mb-4">
          {tf("withdrawalOf", { amount: formatCurrency(pendingPayload.montant) })}{" "}
          {tf("balanceAfterOperation")} : {formatCurrency(solde - pendingPayload.montant)}.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setConfirmOpen(false);
              setPendingPayload(null);
            }}
          >
            {tc("cancel")}
          </Button>
          <Button
            type="button"
            onClick={confirmWithdrawal}
            disabled={createWithdrawal.isPending}
          >
            {createWithdrawal.isPending ? tf("saving") : tc("confirm")}
          </Button>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <>
        {formContent}
        {confirmDialog}
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader title={tf("withdrawal")} />
        <CardContent>{formContent}</CardContent>
      </Card>
      {confirmDialog}
    </>
  );
}
