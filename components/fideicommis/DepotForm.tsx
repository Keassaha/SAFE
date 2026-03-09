"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCreateTrustDeposit } from "@/lib/hooks/useFideicommis";
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

interface DepotFormProps {
  clients: ClientOption[];
  dossiers: DossierOption[];
  onSuccess?: () => void;
  disabled?: boolean;
  embedded?: boolean;
}

export function DepotForm({ clients, dossiers, onSuccess, disabled, embedded }: DepotFormProps) {
  const tf = useTranslations("fideicommis");
  const tc = useTranslations("common");
  const [clientId, setClientId] = useState("");
  const [dossierId, setDossierId] = useState("");
  const [montant, setMontant] = useState("");
  const [dateTransaction, setDateTransaction] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [modePaiement, setModePaiement] = useState<"CHEQUE" | "VIREMENT" | "INTERAC" | "ESPECES" | "AUTRE">("VIREMENT");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");

  const MODES_PAIEMENT = [
    { value: "CHEQUE", label: tf("paymentModeCheque") },
    { value: "VIREMENT", label: tf("paymentModeTransfer") },
    { value: "INTERAC", label: tf("paymentModeInterac") },
    { value: "ESPECES", label: tf("paymentModeCash") },
    { value: "AUTRE", label: tf("paymentModeOther") },
  ] as const;

  const createDeposit = useCreateTrustDeposit();
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
    createDeposit.mutate(
      {
        clientId,
        dossierId,
        montant: amount,
        dateTransaction,
        modePaiement,
        reference: reference || undefined,
        description: description || undefined,
      },
      {
        onSuccess: () => {
          toast.success(tf("depositRecorded"));
          setMontant("");
          setReference("");
          setDescription("");
          onSuccess?.();
        },
        onError: (err) => {
          toast.error(err.message);
        },
      }
    );
  };

  const formContent = (
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
          <div>
            <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
              {tf("paymentModeRequired")}
            </label>
            <select
              value={modePaiement}
              onChange={(e) => setModePaiement(e.target.value as typeof modePaiement)}
              required
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
            placeholder={tf("referencePlaceholderDeposit")}
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
          <Button type="submit" disabled={disabled || createDeposit.isPending}>
            {createDeposit.isPending ? tf("saving") : tf("saveDeposit")}
          </Button>
        </form>
  );

  if (embedded) return formContent;
  return (
    <Card>
      <CardHeader title={tf("deposit")} />
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}
