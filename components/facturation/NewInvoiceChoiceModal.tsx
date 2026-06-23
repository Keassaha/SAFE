"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/format";
import { BookOpen, Pencil, ArrowRight, Receipt, Loader2 } from "lucide-react";

interface DossierWithTasks {
  id: string;
  intitule: string;
  numeroDossier: string | null;
  taskCount: number;
  totalUnbilled: number;
}

interface NewInvoiceChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When true, "from registre" is the default path (forfait mode) */
  preferRegistre?: boolean;
}

/**
 * Two-path entry point for creating an invoice:
 *  - Depuis le registre: pick a dossier with unbilled tasks, auto-generate invoice
 *  - From scratch: redirect to the blank invoice creation page
 */
export function NewInvoiceChoiceModal({ isOpen, onClose, preferRegistre = false }: NewInvoiceChoiceModalProps) {
  const t = useTranslations("billingCompUi");
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "registre">("choose");
  const [dossiers, setDossiers] = useState<DossierWithTasks[]>([]);
  const [selectedDossierId, setSelectedDossierId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(preferRegistre ? "registre" : "choose");
      setError(null);
      setSelectedDossierId("");
    }
  }, [isOpen, preferRegistre]);

  // Fetch dossiers with unbilled tasks when switching to "registre" mode
  useEffect(() => {
    if (mode !== "registre" || !isOpen) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/registre-taches?statut=complete");
        if (!res.ok) throw new Error("Failed to load unbilled tasks");
        const { taches } = await res.json();
        type TacheRow = {
          dossier: { id?: string; intitule?: string; numeroDossier?: string | null } | null;
          montantFinal: number;
        };
        type Grouped = { id: string; intitule: string; numeroDossier: string | null; taskCount: number; totalUnbilled: number };
        const grouped = (taches as TacheRow[]).reduce<Record<string, Grouped>>((acc, tache) => {
          if (!tache.dossier?.id) return acc;
          const did = tache.dossier.id;
          if (!acc[did]) {
            acc[did] = {
              id: did,
              intitule: tache.dossier.intitule ?? "",
              numeroDossier: tache.dossier.numeroDossier ?? null,
              taskCount: 0,
              totalUnbilled: 0,
            };
          }
          acc[did].taskCount += 1;
          acc[did].totalUnbilled += tache.montantFinal;
          return acc;
        }, {});
        setDossiers(Object.values(grouped).sort((a, b) => b.totalUnbilled - a.totalUnbilled));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, isOpen]);

  const handleFromRegistre = async () => {
    if (!selectedDossierId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/registre-taches/facturer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dossierId: selectedDossierId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate invoice");
      }
      const { invoice } = await res.json();
      onClose();
      if (invoice?.id) router.push(`/facturation/factures/${invoice.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleFromScratch = () => {
    onClose();
    router.push("/facturation/nouvelle");
  };

  return (
    <Modal open={isOpen} onClose={onClose} title={t("newInvoice")} maxWidth="max-w-xl">
      {mode === "choose" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode("registre")}
            className="group text-left p-5 rounded-xl border-2 border-si-line hover:border-si-forest hover:bg-si-verified/10 transition-all"
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="flex w-10 h-10 shrink-0 items-center justify-center rounded-xl bg-si-verified/10 text-si-verified border border-si-verified/30">
                <BookOpen className="w-5 h-5" />
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-si-forest text-white text-[10px] font-semibold tracking-wide uppercase">
                {t("recommended")}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-si-ink mb-1">{t("fromRegister")}</h3>
            <p className="text-xs text-si-muted leading-snug">
              {t("fromRegisterDescription")}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-si-verified group-hover:gap-2 transition-all">
              {t("continue")} <ArrowRight className="w-3 h-3" />
            </span>
          </button>

          <button
            type="button"
            onClick={handleFromScratch}
            className="group text-left p-5 rounded-xl border-2 border-si-line hover:border-si-line hover:bg-si-canvas transition-all"
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="flex w-10 h-10 shrink-0 items-center justify-center rounded-xl bg-si-canvas text-si-ink border border-si-line">
                <Pencil className="w-5 h-5" />
              </span>
            </div>
            <h3 className="text-sm font-semibold text-si-ink mb-1">{t("fromScratch")}</h3>
            <p className="text-xs text-si-muted leading-snug">
              {t("fromScratchDescription")}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-si-ink group-hover:gap-2 transition-all">
              {t("createBlankInvoice")} <ArrowRight className="w-3 h-3" />
            </span>
          </button>
        </div>
      )}

      {mode === "registre" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="text-si-muted hover:text-si-ink underline"
            >
              ← {t("back")}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-si-muted mb-2">
              {t("matterToInvoice")}
            </label>

            {loading && dossiers.length === 0 ? (
              <div className="flex items-center justify-center p-8 text-si-muted text-sm">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> {t("loadingMatters")}
              </div>
            ) : dossiers.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-si-canvas border border-si-line">
                <p className="text-sm text-si-muted mb-2">{t("noUnbilledTasks")}</p>
                <p className="text-xs text-si-muted">
                  {t("addTasksBeforeInvoicing")}
                </p>
                <Button variant="secondary" onClick={handleFromScratch} className="mt-3">
                  {t("createBlankInvoiceInstead")}
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {dossiers.map((d) => (
                  <label
                    key={d.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedDossierId === d.id
                        ? "border-si-forest bg-si-verified/10"
                        : "border-si-line hover:bg-si-canvas"
                    }`}
                  >
                    <input
                      type="radio"
                      name="dossier"
                      value={d.id}
                      checked={selectedDossierId === d.id}
                      onChange={() => setSelectedDossierId(d.id)}
                      className="accent-si-forest"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-si-ink truncate">
                        {d.numeroDossier && <span className="font-mono text-xs text-si-muted mr-2">{d.numeroDossier}</span>}
                        {d.intitule}
                      </p>
                      <p className="text-xs text-si-muted">
                        {t("unbilledTaskCount", { count: d.taskCount })}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{formatCurrency(d.totalUnbilled)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="primary"
              onClick={handleFromRegistre}
              disabled={!selectedDossierId || loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {t("generating")}
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4" /> {t("generateInvoice")}
                </>
              )}
            </Button>
            <Button variant="secondary" onClick={onClose}>
              {t("cancel")}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-[#B84A3E]">{error}</p>
      )}
    </Modal>
  );
}
