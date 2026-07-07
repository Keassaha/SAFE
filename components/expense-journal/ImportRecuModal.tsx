"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, UploadCloud, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import type { ExpenseCategory } from "@prisma/client";
import type { ExpenseReceiptExtraction } from "@/lib/ai/extract-expense-receipt";
import type { SuggestionResult } from "@/lib/expense-journal/categorization-rules";

const selectClass =
  "w-full h-10 px-3 rounded-xl border border-si-line bg-si-canvas/80 text-sm text-si-ink placeholder:text-si-muted/50 focus:bg-si-surface focus:ring-2 focus:ring-si-verified/20 focus:border-si-verified outline-none transition-all";

export interface ImportRecuModalProps {
  open: boolean;
  onClose: () => void;
  categories: ExpenseCategory[];
  onSuccess?: () => void;
}

type Phase = "upload" | "loading" | "review" | "submitting" | "duplicate";

type ConfidenceLevel = "high" | "medium" | "none";

function confidenceLevel(suggestion: SuggestionResult | null): ConfidenceLevel {
  if (!suggestion || !suggestion.categoryName) return "none";
  if (suggestion.confidence >= 0.85) return "high";
  if (suggestion.confidence >= 0.5) return "medium";
  return "none";
}

const CONFIDENCE_STYLE: Record<ConfidenceLevel, { badge: string; icon: typeof CheckCircle2; key: string }> = {
  high: { badge: "bg-si-verified/10 text-si-verified border-si-verified/30", icon: CheckCircle2, key: "confidenceHigh" },
  medium: { badge: "bg-si-amber/[0.1] text-si-amber-ink border-si-amber/30", icon: AlertTriangle, key: "confidenceMedium" },
  none: { badge: "bg-si-canvas text-si-muted border-si-line", icon: HelpCircle, key: "confidenceNone" },
};

export function ImportRecuModal({ open, onClose, categories, onSuccess }: ImportRecuModalProps) {
  const t = useTranslations("receiptImport");
  const tc = useTranslations("common");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("upload");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extraction, setExtraction] = useState<ExpenseReceiptExtraction | null>(null);
  const [suggestion, setSuggestion] = useState<SuggestionResult | null>(null);
  const [normalizedSupplier, setNormalizedSupplier] = useState("");
  const [duplicate, setDuplicate] = useState<{ date: string; montant: number; fournisseur: string | null } | null>(null);

  // Champs éditables (pré-remplis depuis l'extraction + la suggestion).
  const [fournisseur, setFournisseur] = useState("");
  const [date, setDate] = useState("");
  const [montantTtc, setMontantTtc] = useState("");
  const [tps, setTps] = useState("");
  const [tvq, setTvq] = useState("");
  const [montantHt, setMontantHt] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [refacturable, setRefacturable] = useState(false);
  const [rememberRule, setRememberRule] = useState(false);

  useEffect(() => {
    if (!open) {
      setPhase("upload");
      setError(null);
      setExtraction(null);
      setSuggestion(null);
      setNormalizedSupplier("");
      setDuplicate(null);
      setSelectedFile(null);
      setFournisseur("");
      setDate("");
      setMontantTtc("");
      setTps("");
      setTvq("");
      setMontantHt("");
      setCategoryName("");
      setRefacturable(false);
      setRememberRule(false);
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
      const res = await fetch("/api/journal/depenses/import-recu", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("errorExtract"));

      if (data.alreadyImported) {
        setDuplicate(data.duplicate ?? null);
        setPhase("duplicate");
        return;
      }
      const ext = data.extraction as ExpenseReceiptExtraction;
      const sug = (data.suggestion as SuggestionResult | null) ?? null;
      setExtraction(ext);
      setSuggestion(sug);
      setNormalizedSupplier(data.normalizedSupplier ?? "");
      setFournisseur(ext.fournisseur ?? "");
      setDate(ext.date ?? new Date().toISOString().slice(0, 10));
      setMontantTtc(ext.montantTtc != null ? String(ext.montantTtc) : "");
      setTps(ext.tps != null ? String(ext.tps) : "");
      setTvq(ext.tvq != null ? String(ext.tvq) : "");
      setMontantHt(ext.montantHt != null ? String(ext.montantHt) : "");
      setCategoryName(sug?.categoryName ?? "");
      setRefacturable(sug?.refacturable ?? false);
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorExtract"));
      setPhase("upload");
    }
  }

  async function handleConfirm() {
    setError(null);
    setPhase("submitting");
    const fd = new FormData();
    if (selectedFile) fd.append("file", selectedFile);
    fd.append("fournisseur", fournisseur);
    fd.append("normalizedSupplier", normalizedSupplier);
    fd.append("date", date);
    fd.append("montantTtc", String(Number(montantTtc)));
    if (tps) fd.append("tps", String(Number(tps)));
    if (tvq) fd.append("tvq", String(Number(tvq)));
    if (montantHt) fd.append("montantHt", String(Number(montantHt)));
    fd.append("categoryName", categoryName || "Autres");
    const cat = categories.find((c) => c.name === categoryName);
    if (cat) fd.append("categoryId", cat.id);
    fd.append("refacturable", String(refacturable));
    if (extraction?.numeroRecu) fd.append("numeroRecu", extraction.numeroRecu);
    if (rememberRule) fd.append("rememberRule", "true");

    try {
      const res = await fetch("/api/journal/depenses/import-recu/confirmer", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("errorSaving"));
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorSaving"));
      setPhase("review");
    }
  }

  const canConfirm = fournisseur.trim().length > 0 && Number(montantTtc) > 0 && date.length > 0;
  const level = confidenceLevel(suggestion);
  const conf = CONFIDENCE_STYLE[level];
  const ConfIcon = conf.icon;

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

      {phase === "duplicate" && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-[#B84A3E]/30 bg-[#B84A3E]/[0.06] px-4 py-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#B84A3E]" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-[#B84A3E]">{t("duplicateTitle")}</p>
              <p className="mt-1 text-sm text-si-ink">{t("duplicateByFile")}</p>
              {duplicate && (
                <p className="mt-2 text-xs text-si-muted">
                  {t("duplicateExisting", {
                    montant: formatCurrency(duplicate.montant),
                    fournisseur: duplicate.fournisseur ?? "—",
                    date: duplicate.date.slice(0, 10),
                  })}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              {tc("close")}
            </Button>
          </div>
        </div>
      )}

      {(phase === "review" || phase === "submitting") && extraction && (
        <div className="space-y-5">
          {/* Bandeau de confiance sur la catégorie suggérée */}
          <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${conf.badge}`}>
            <ConfIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{t(conf.key)}</p>
              {suggestion?.categoryName && (
                <p className="mt-0.5 text-xs opacity-90">{t("suggestedCategory", { category: suggestion.categoryName })}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Colonne reçu */}
            <div>
              <p className="mb-1.5 text-sm font-medium text-si-muted">{t("receiptPreview")}</p>
              <div className="overflow-hidden rounded-xl border border-si-line bg-si-canvas">
                {previewUrl && !isPdf && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt={t("receiptPreview")} className="max-h-[420px] w-full object-contain" />
                )}
                {previewUrl && isPdf && <embed src={previewUrl} type="application/pdf" className="h-[420px] w-full" />}
              </div>
            </div>

            {/* Colonne champs pré-remplis */}
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-si-muted">{t("supplier")} *</label>
                <input value={fournisseur} onChange={(e) => setFournisseur(e.target.value)} className={selectClass} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-si-muted">{t("amountTtc")} *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={montantTtc}
                    onChange={(e) => setMontantTtc(e.target.value)}
                    className={selectClass}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-si-muted">{tc("date")} *</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={selectClass} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-si-muted">{t("tps")}</label>
                  <input type="number" step="0.01" value={tps} onChange={(e) => setTps(e.target.value)} className={selectClass} placeholder="—" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-si-muted">{t("tvq")}</label>
                  <input type="number" step="0.01" value={tvq} onChange={(e) => setTvq(e.target.value)} className={selectClass} placeholder="—" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-si-muted">{t("amountHt")}</label>
                  <input type="number" step="0.01" value={montantHt} onChange={(e) => setMontantHt(e.target.value)} className={selectClass} placeholder="—" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-si-muted">{t("category")}</label>
                <select value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className={selectClass}>
                  <option value="">{t("selectCategory")}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2.5 text-sm text-si-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={refacturable}
                  onChange={(e) => setRefacturable(e.target.checked)}
                  className="h-4 w-4 shrink-0 rounded border-si-line text-si-verified focus:ring-si-verified/30"
                />
                {t("refacturable")}
              </label>
            </div>
          </div>

          {/* TPS/TVQ = estimation à valider (garde-fou spec §6.2) */}
          <p className="text-xs text-si-muted">{t("taxDisclaimer")}</p>

          {/* Apprentissage : mémoriser ce fournisseur → cette catégorie */}
          {fournisseur.trim() && categoryName && (
            <label className="flex items-start gap-2.5 rounded-xl border border-si-line bg-si-canvas/50 px-3.5 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberRule}
                onChange={(e) => setRememberRule(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-si-line text-si-verified focus:ring-si-verified/30"
              />
              <span className="text-sm text-si-ink">
                {t("rememberRule", { supplier: fournisseur.trim(), category: categoryName })}
                <span className="block text-xs text-si-muted mt-0.5">{t("rememberRuleHint")}</span>
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
