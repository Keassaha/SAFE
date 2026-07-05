"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, UploadCloud, CheckCircle2, AlertTriangle, HelpCircle, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import type { PaymentProofExtraction } from "@/lib/ai/extract-payment-proof";
import type { PaymentMatch } from "@/lib/services/finance/match-payment";

const selectClass =
  "w-full h-10 px-3 rounded-xl border border-si-line bg-si-canvas/80 text-sm text-si-ink placeholder:text-si-muted/50 focus:bg-si-surface focus:ring-2 focus:ring-si-verified/20 focus:border-si-verified outline-none transition-all";

type ClientOpt = { id: string; raisonSociale: string | null; prenom?: string | null; nom?: string | null };
type InvoiceOpt = { id: string; numero: string; clientId: string | null; balanceDue: number };

function clientLabel(c: ClientOpt) {
  const company = c.raisonSociale?.trim();
  if (company) return company;
  const person = [c.prenom, c.nom].filter(Boolean).join(" ").trim();
  return person || "Client sans nom";
}

export interface ImportPreuveModalProps {
  open: boolean;
  onClose: () => void;
  clients: ClientOpt[];
  invoices: InvoiceOpt[];
  onSuccess?: () => void;
}

type Phase = "upload" | "loading" | "review" | "submitting";

const CONFIDENCE_STYLE: Record<
  PaymentMatch["confidence"],
  { badge: string; icon: typeof CheckCircle2; key: string }
> = {
  certain: { badge: "bg-si-verified/10 text-si-verified border-si-verified/30", icon: CheckCircle2, key: "confidenceCertain" },
  a_confirmer: { badge: "bg-si-amber/[0.1] text-si-amber-ink border-si-amber/30", icon: AlertTriangle, key: "confidenceConfirm" },
  aucun: { badge: "bg-si-canvas text-si-muted border-si-line", icon: HelpCircle, key: "confidenceNone" },
};

export function ImportPreuveModal({ open, onClose, clients, invoices, onSuccess }: ImportPreuveModalProps) {
  const t = useTranslations("paymentImport");
  const tp = useTranslations("payments");
  const tc = useTranslations("common");
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("upload");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extraction, setExtraction] = useState<PaymentProofExtraction | null>(null);
  const [match, setMatch] = useState<PaymentMatch | null>(null);

  // Champs éditables (pré-remplis depuis extraction + match)
  const [clientId, setClientId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [rememberPayer, setRememberPayer] = useState(false);

  useEffect(() => {
    if (!open) {
      setPhase("upload");
      setError(null);
      setExtraction(null);
      setMatch(null);
      setSelectedFile(null);
      setClientId("");
      setInvoiceId("");
      setAmount("");
      setDate("");
      setReference("");
      setNote("");
      setRememberPayer(false);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleFile(file: File) {
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setIsPdf(file.type === "application/pdf");
    setSelectedFile(file);
    setPhase("loading");

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/facturation/paiements/import-preuve", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("errorExtract"));

      const ext = data.extraction as PaymentProofExtraction;
      const m = data.match as PaymentMatch;
      setExtraction(ext);
      setMatch(m);
      setClientId(m.clientId ?? "");
      setInvoiceId(m.invoiceId ?? "");
      setAmount(ext.montant != null ? String(ext.montant) : "");
      setDate(ext.date ?? new Date().toISOString().slice(0, 10));
      setReference(ext.referenceInterac ?? "");
      setNote("");
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorExtract"));
      setPhase("upload");
    }
  }

  const invoicesForClient = invoices.filter((inv) => inv.clientId === clientId && inv.balanceDue > 0);

  async function handleConfirm() {
    setError(null);
    setPhase("submitting");
    const selectedInvoice = invoicesForClient.find((inv) => inv.id === invoiceId);
    const fd = new FormData();
    if (selectedFile) fd.append("file", selectedFile);
    fd.append("clientId", clientId);
    fd.append("paymentDate", date);
    fd.append("amount", String(Number(amount)));
    if (invoiceId) fd.append("invoiceId", invoiceId);
    if (selectedInvoice) {
      fd.append("allocatedAmount", String(Math.min(Number(amount), selectedInvoice.balanceDue)));
    }
    if (reference) fd.append("referenceNumber", reference);
    if (note) fd.append("note", note);
    if (extraction?.referenceInterac) fd.append("interacReference", extraction.referenceInterac);
    // Source des fonds (trace AML) quand le versement vient d'un tiers, ou quand on
    // mémorise le payeur pour créer une règle.
    const sendPayer = match?.isThirdPartyPayer || rememberPayer;
    if (sendPayer && extraction?.expediteurNom) fd.append("payerName", extraction.expediteurNom);
    if (sendPayer && extraction?.expediteurCourriel) fd.append("payerEmail", extraction.expediteurCourriel);
    if (rememberPayer) fd.append("rememberPayer", "true");

    try {
      const res = await fetch("/api/facturation/paiements/import-preuve/confirmer", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? tp("errorSaving"));
      queryClient.invalidateQueries({ queryKey: ["facturation", "paiements"] });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : tp("errorSaving"));
      setPhase("review");
    }
  }

  const canConfirm = clientId.length > 0 && Number(amount) > 0;
  const conf = match ? CONFIDENCE_STYLE[match.confidence] : null;
  const ConfIcon = conf?.icon ?? HelpCircle;

  return (
    <Modal open={open} onClose={onClose} title={t("title")} maxWidth="max-w-3xl">
      {phase === "upload" && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-si-line bg-si-canvas/50 px-6 py-12 text-center transition-colors hover:border-si-verified hover:bg-si-verified/[0.03]"
          >
            <UploadCloud className="h-10 w-10 text-si-muted" aria-hidden />
            <span className="text-sm font-medium text-si-ink">{t("dropHint")}</span>
            <span className="text-xs text-si-muted">{t("acceptedTypes")}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {error && <p className="text-sm text-[#B84A3E]">{error}</p>}
        </div>
      )}

      {phase === "loading" && (
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-si-verified" />
          <p className="text-sm text-si-muted">{t("analyzing")}</p>
        </div>
      )}

      {(phase === "review" || phase === "submitting") && match && extraction && (
        <div className="space-y-5">
          {/* Bandeau de confiance */}
          <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${conf?.badge}`}>
            <ConfIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{conf ? t(conf.key) : ""}</p>
              {match.reasons.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-xs opacity-90">
                  {match.reasons.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Payeur tiers */}
          {match.isThirdPartyPayer && extraction.expediteurNom && (
            <div className="flex items-center gap-2 rounded-lg bg-si-canvas px-3 py-2 text-xs text-si-muted">
              <Users className="h-4 w-4 shrink-0" aria-hidden />
              <span>
                {t("thirdPartyPayer", { payer: extraction.expediteurNom })}
                {match.knownPayerNote ? ` — ${match.knownPayerNote}` : ""}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Colonne preuve */}
            <div>
              <p className="mb-1.5 text-sm font-medium text-si-muted">{t("proofPreview")}</p>
              <div className="overflow-hidden rounded-xl border border-si-line bg-si-canvas">
                {previewUrl && !isPdf && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt={t("proofPreview")} className="max-h-[420px] w-full object-contain" />
                )}
                {previewUrl && isPdf && (
                  <embed src={previewUrl} type="application/pdf" className="h-[420px] w-full" />
                )}
              </div>
            </div>

            {/* Colonne champs pré-remplis */}
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-si-muted">{tc("client")} *</label>
                <select
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    setInvoiceId("");
                  }}
                  className={selectClass}
                >
                  <option value="">{tp("selectClient")}</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {clientLabel(c)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-si-muted">{tp("amountRequired")}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`${selectClass} ${match.confidence !== "certain" ? "border-si-amber/50" : ""}`}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-si-muted">{tc("date")} *</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={selectClass} />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-si-muted">{tp("allocateToInvoice")}</label>
                <select value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} className={selectClass} disabled={!clientId}>
                  <option value="">{tp("noInvoice")}</option>
                  {invoicesForClient.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.numero} — {tp("balance")} {formatCurrency(inv.balanceDue)}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label={tp("referenceNumber")}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={tc("optional")}
              />
              <Input
                label={tp("note")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={tc("optional")}
              />
            </div>
          </div>

          {/* Apprentissage : mémoriser le payeur tiers → ce client */}
          {clientId && !match.matchedByRule && (extraction.expediteurNom || extraction.expediteurCourriel) && (
            <label className="flex items-start gap-2.5 rounded-xl border border-si-line bg-si-canvas/50 px-3.5 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberPayer}
                onChange={(e) => setRememberPayer(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-si-line text-si-verified focus:ring-si-verified/30"
              />
              <span className="text-sm text-si-ink">
                {t("rememberPayer", { payer: extraction.expediteurNom ?? extraction.expediteurCourriel ?? "" })}
                <span className="block text-xs text-si-muted mt-0.5">{t("rememberPayerHint")}</span>
              </span>
            </label>
          )}

          {error && <p className="text-sm text-[#B84A3E]">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose} disabled={phase === "submitting"}>
              {tc("cancel")}
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={!canConfirm || phase === "submitting"}>
              {phase === "submitting" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("confirm")}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
