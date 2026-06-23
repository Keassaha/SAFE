"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, ExternalLink, Mail, Trash2, Loader2, Paperclip, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/routes";

type FacturePreviewActionsProps = {
  invoiceId: string;
  invoiceStatus: string | null;
};

type AttachableDoc = { id: string; titre: string; type: string; statut: string };

async function postInvoiceAction(
  invoiceId: string,
  action: "valider" | "envoyer-email" | "annuler",
  extraBody?: Record<string, unknown>
) {
  const body =
    action === "annuler"
      ? JSON.stringify({ cancelReason: "Annulé depuis l'aperçu" })
      : JSON.stringify(extraBody ?? {});
  const response = await fetch(`/api/facturation/factures/${invoiceId}/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error ?? "Action impossible pour cette facture");
  }
  return payload;
}

export function FacturePreviewActions({
  invoiceId,
  invoiceStatus,
}: FacturePreviewActionsProps) {
  const router = useRouter();
  const t = useTranslations("billingUi");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const isDraft = invoiceStatus === "DRAFT" || invoiceStatus == null;
  const canIssue = invoiceStatus === "DRAFT" || invoiceStatus === "READY_TO_ISSUE";

  // Fenêtre d'envoi : permet de joindre d'autres documents du dossier (E4).
  const [showSend, setShowSend] = useState(false);
  const [docs, setDocs] = useState<AttachableDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const openSendDialog = async () => {
    setShowSend(true);
    setSelected(new Set());
    setLoadingDocs(true);
    try {
      const res = await fetch(`/api/facturation/factures/${invoiceId}/envoyer-email`);
      const data = await res.json().catch(() => ({ documents: [] }));
      setDocs(Array.isArray(data.documents) ? data.documents : []);
    } catch {
      setDocs([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const confirmSend = async () => {
    try {
      setPendingAction("envoyer-email");
      await postInvoiceAction(invoiceId, "envoyer-email", { attachRichDocumentIds: [...selected] });
      toast.success(t("toastInvoiceSent"));
      setShowSend(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("actionNotPossible"));
    } finally {
      setPendingAction(null);
    }
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const runAction = async (
    action: "valider" | "envoyer-email" | "annuler",
    successMessage: string
  ) => {
    try {
      setPendingAction(action);
      await postInvoiceAction(invoiceId, action);
      toast.success(successMessage);
      if (action === "annuler") {
        router.push(routes.facturation);
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("actionNotPossible"));
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <Link
        href={`/api/facturation/factures/${invoiceId}/pdf`}
        target="_blank"
        className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-md border border-si-forest/40 px-4 text-[14px] font-medium text-si-verified transition-base hover:bg-si-canvas"
      >
        <ExternalLink className="h-4 w-4" />
        {t("viewPdf")}
      </Link>
      {isDraft ? (
        <Button
          variant="secondary"
          className="gap-2"
          disabled={pendingAction != null}
          onClick={() => runAction("valider", t("toastInvoiceApproved"))}
        >
          <CheckCircle2 className="h-4 w-4" />
          {t("approveInvoice")}
        </Button>
      ) : null}
      {canIssue ? (
        <Button
          variant="primary"
          className="gap-2"
          disabled={pendingAction != null}
          onClick={openSendDialog}
        >
          <Mail className="h-4 w-4" />
          {t("sendByEmail")}
        </Button>
      ) : null}
      {isDraft ? (
        <Button
          variant="ghost"
          className="gap-2 text-[#A32D2D] hover:bg-[#FCEBEB]"
          disabled={pendingAction != null}
          onClick={() => runAction("annuler", t("toastDraftCancelled"))}
        >
          <Trash2 className="h-4 w-4" />
          {t("cancelDraft")}
        </Button>
      ) : null}

      {showSend ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowSend(false)}>
          <div className="w-full max-w-md rounded-2xl bg-si-surface shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-si-line px-5 py-3">
              <h3 className="text-[15px] font-semibold text-si-ink">{t("sendInvoiceTitle")}</h3>
              <button type="button" onClick={() => setShowSend(false)} className="text-si-muted/50 hover:text-si-ink" aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-si-muted">{t("sendInvoiceBody")}</p>
              <div className="mt-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-si-muted">
                  <Paperclip className="h-3.5 w-3.5" />
                  {t("attachOtherDocs")}
                </div>
                {loadingDocs ? (
                  <div className="flex items-center gap-2 py-3 text-sm text-si-muted/50">
                    <Loader2 className="h-4 w-4 animate-spin" /> {t("loading")}
                  </div>
                ) : docs.length === 0 ? (
                  <p className="py-2 text-xs text-si-muted/50">{t("noAttachableDocs")}</p>
                ) : (
                  <ul className="max-h-48 space-y-1 overflow-y-auto">
                    {docs.map((d) => (
                      <li key={d.id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-si-canvas">
                          <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggle(d.id)} className="accent-si-forest" />
                          <span className="flex-1 truncate text-si-ink">{d.titre}</span>
                          {d.statut === "brouillon" ? (
                            <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: "#F5E6C8", color: "#8B6B1F" }}>
                              {t("draftBadge")}
                            </span>
                          ) : null}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowSend(false)} className="rounded-lg border border-si-line px-4 py-2 text-sm font-medium text-si-muted">
                  {t("cancel")}
                </button>
                <Button variant="primary" className="gap-2" disabled={pendingAction != null} onClick={confirmSend}>
                  {pendingAction != null ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {selected.size > 0 ? t("sendWithCount", { n: selected.size }) : t("sendByEmail")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
