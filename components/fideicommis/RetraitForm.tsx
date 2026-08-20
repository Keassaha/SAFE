"use client";

import { useEffect, useState } from "react";
import type { TrustWithdrawalMotive } from "@prisma/client";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCreateTrustWithdrawal, useTrustBalance } from "@/lib/hooks/useFideicommis";
import { formatCurrency } from "@/lib/utils/format";
import { clientDisplayName } from "@/lib/clients/normalize-name";
import { toast } from "sonner";
import { toCalendarDayUTC, toIsoDay } from "@/lib/utils/calendar-date";

interface ClientOption {
  id: string;
  raisonSociale: string | null;
  prenom: string | null;
  nom: string | null;
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
    () => toIsoDay(toCalendarDayUTC(new Date()))
  );
  const [factureId, setFactureId] = useState("");
  /* Factures que ce retrait peut légalement rembourser. Le champ demandait
     auparavant de TAPER un identifiant de base de données : on y écrivait le
     numéro lu partout ailleurs, et on recevait « Facture introuvable ». */
  const [facturesEligibles, setFacturesEligibles] = useState<
    { id: string; numero: string; soldeDu: number }[]
  >([]);
  const [chargementFactures, setChargementFactures] = useState(false);
  const [motive, setMotive] = useState<TrustWithdrawalMotive | "">("");
  // `ESPECES` est volontairement absent : l'art. 57 B-1 r.5 interdit tout retrait
  // en espèces d'un compte général en fidéicommis, et la s. 11(a) By-Law 9 interdit
  // les chèques payables à « cash » ou au porteur. Le service refuse également.
  const [modePaiement, setModePaiement] = useState<"CHEQUE" | "VIREMENT" | "INTERAC" | "AUTRE">("VIREMENT");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<{
    clientId: string;
    dossierId: string;
    montant: number;
    dateTransaction: string;
    motive: TrustWithdrawalMotive;
    factureId?: string | null;
    modePaiement?: string | null;
    reference?: string | null;
    description?: string | null;
  } | null>(null);

  const MODES_PAIEMENT = [
    { value: "CHEQUE", label: tf("paymentModeCheque") },
    { value: "VIREMENT", label: tf("paymentModeTransfer") },
    { value: "INTERAC", label: tf("paymentModeInterac") },
    { value: "AUTRE", label: tf("paymentModeOther") },
  ] as const;

  /**
   * Motifs de retrait. Trois au Québec (B-1 r.5 art. 56), cinq en Ontario
   * (By-Law 9 s. 9(1)) — le dépôt par inadvertance n'existe qu'en Ontario, on le
   * propose partout plutôt que d'en priver un cabinet ontarien, le service tranche.
   */
  const MOTIFS = [
    { value: "REMISE_CLIENT_OU_TIERS", label: tf("withdrawalMotiveRemise") },
    { value: "HONORAIRES_DEBOURS_FACTURES", label: tf("withdrawalMotiveHonoraires") },
    { value: "TRANSFERT_AUTRE_FIDEICOMMIS", label: tf("withdrawalMotiveTransfert") },
    { value: "DEPOT_PAR_INADVERTANCE", label: tf("withdrawalMotiveInadvertance") },
  ] as const;

  const invoiceRequired = motive === "HONORAIRES_DEBOURS_FACTURES";

  const { data: soldeData } = useTrustBalance(cabinetId, clientId || null, dossierId || null);
  const solde = soldeData?.solde ?? 0;
  const createWithdrawal = useCreateTrustWithdrawal();
  const dossiersForClient = clientId
    ? dossiers.filter((d) => d.clientId === clientId)
    : [];

  useEffect(() => {
    if (!clientId) {
      setFacturesEligibles([]);
      return;
    }
    let annule = false;
    setChargementFactures(true);
    const params = new URLSearchParams({ clientId });
    if (dossierId) params.set("dossierId", dossierId);
    fetch(`/api/fideicommis/factures-eligibles?${params}`)
      .then((r) => (r.ok ? r.json() : { factures: [] }))
      .then((d) => {
        if (annule) return;
        setFacturesEligibles(d.factures ?? []);
        // Le choix courant peut ne plus être éligible après changement de dossier.
        setFactureId((prev) =>
          (d.factures ?? []).some((f: { id: string }) => f.id === prev) ? prev : "",
        );
      })
      .catch(() => {
        if (!annule) setFacturesEligibles([]);
      })
      .finally(() => {
        if (!annule) setChargementFactures(false);
      });
    return () => {
      annule = true;
    };
  }, [clientId, dossierId]);

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
    // art. 56 B-1 r.5 / s. 9(1) By-Law 9 — le motif rend le retrait licite.
    if (!motive) {
      toast.error(tf("withdrawalMotiveRequired"));
      return;
    }
    if (motive === "HONORAIRES_DEBOURS_FACTURES" && !factureId.trim()) {
      toast.error(tf("withdrawalInvoiceRequired"));
      return;
    }
    const payload = {
      clientId,
      dossierId,
      montant: amount,
      dateTransaction,
      motive,
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
        setMotive("");
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
                    {clientDisplayName(c)}
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
                {tf("withdrawalMotive")} <span className="text-status-error">*</span>
              </label>
              <select
                value={motive}
                onChange={(e) => setMotive(e.target.value as TrustWithdrawalMotive | "")}
                required
                disabled={disabled}
                className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 focus:ring-2 focus:ring-primary-500/30 outline-none"
              >
                <option value="">{tf("withdrawalMotiveSelect")}</option>
                {MOTIFS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-neutral-muted">{tf("withdrawalMotiveHint")}</p>
            </div>
            <div>
              {/* Le libellé disait « (optionnel) » ET portait une astérisque de
                  champ obligatoire. Deux libellés distincts, selon le motif. */}
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                {invoiceRequired ? `${tf("linkedInvoiceRequired")} *` : tf("linkedInvoice")}
              </label>
              <select
                value={factureId}
                onChange={(e) => setFactureId(e.target.value)}
                required={invoiceRequired}
                disabled={disabled || chargementFactures || !clientId}
                className="w-full rounded-safe-sm border border-[var(--safe-neutral-border)] bg-white px-3 py-2 text-sm text-[var(--safe-text-title)] disabled:opacity-60"
              >
                <option value="">
                  {!clientId
                    ? tf("invoicePickClientFirst")
                    : chargementFactures
                      ? tf("invoiceLoading")
                      : facturesEligibles.length === 0
                        ? tf("invoiceNoneEligible")
                        : tf("invoicePick")}
                </option>
                {facturesEligibles.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.numero} — {formatCurrency(f.soldeDu)} {tf("invoiceStillDue")}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-neutral-muted">
                {invoiceRequired
                  ? tf("withdrawalInvoiceRequired")
                  : tf("invoiceOnlyEligible")}
              </p>
            </div>
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
              <p className="mt-1 text-xs text-neutral-muted">{tf("withdrawalCashNotice")}</p>
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
        <h2 id="confirm-retrait-title" className="text-lg font-medium text-neutral-text-primary mb-2 tracking-tight">
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
