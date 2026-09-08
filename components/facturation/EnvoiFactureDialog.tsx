"use client";

/**
 * Fenêtre d'envoi d'une facture au client.
 *
 * ── Pourquoi elle a déménagé ─────────────────────────────────────────────────
 * Elle vivait à l'intérieur de `FacturePreviewActions`, donc elle n'était
 * atteignable que depuis l'aperçu d'une facture. Le lot 0.5 la rend joignable
 * aussi depuis l'onglet Correspondance d'un dossier, qui est l'endroit d'où on
 * pense à écrire à son client.
 *
 * ── Ce qui n'a pas changé ────────────────────────────────────────────────────
 * Le corps, les champs, la route appelée et les garanties derrière. Le pipeline
 * d'envoi (`sendInvoiceByEmail`) et sa règle réglementaire, `deliveredAt` posé
 * seulement si l'envoi a réussi, ne sont pas touchés. Ce fichier est un
 * déménagement, pas une réécriture.
 *
 * Monter le composant OUVRE la fenêtre : le parent décide en le montant ou non.
 */

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Mail, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

type PieceJoignable = { id: string; titre: string; type: string; statut: string };

interface Props {
  invoiceId: string;
  onClose: () => void;
  /** Appelé après un envoi réussi, avant la fermeture. */
  onSent?: () => void;
}

export function EnvoiFactureDialog({ invoiceId, onClose, onSent }: Props) {
  const t = useTranslations("billingUi");

  const [docs, setDocs] = useState<PieceJoignable[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [docsError, setDocsError] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let annule = false;
    (async () => {
      setLoadingDocs(true);
      setDocsError(false);
      try {
        const res = await fetch(`/api/facturation/factures/${invoiceId}/envoyer-email`);
        const data = await res.json().catch(() => ({ documents: [] }));
        if (annule) return;
        setDocs(Array.isArray(data.documents) ? data.documents : []);
        if (data.defaults) {
          setSubject(data.defaults.subject ?? "");
          setMessage(data.defaults.message ?? "");
          setPaymentInstructions(data.defaults.paymentInstructions ?? "");
        }
      } catch {
        if (!annule) {
          setDocs([]);
          setDocsError(true);
        }
      } finally {
        if (!annule) setLoadingDocs(false);
      }
    })();
    return () => {
      annule = true;
    };
  }, [invoiceId]);

  const fermer = () => {
    if (dirty && !window.confirm(t("confirmCloseSendDialog"))) return;
    onClose();
  };

  const basculer = (id: string) => {
    setDirty(true);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const envoyer = async () => {
    try {
      setPending(true);
      const res = await fetch(`/api/facturation/factures/${invoiceId}/envoyer-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attachRichDocumentIds: [...selected],
          subject,
          message,
          paymentInstructions,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error ?? t("actionNotPossible"));
      toast.success(t("toastInvoiceSent"));
      onSent?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("actionNotPossible"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Le voile et le panneau sont FRÈRES, jamais imbriqués. Un élément qui
          porte un `backdrop-filter` devient racine d'arrière-plan pour sa
          descendance : posé à l'intérieur du voile, le panneau ne flouterait
          plus la page, seulement le voile. */}
      <div className="safe-scrim absolute inset-0" aria-hidden onClick={fermer} />
      {/* Plan 3, niveau focus : l'envoi d'une facture à un client est une
          décision. Le focus est le plus opaque des trois verres, la lisibilité
          du destinataire et du montant prime sur la matière. */}
      <div
        className="safe-glass-focus relative z-10 flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border"
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-invoice-title"
      >
        <div className="flex items-center justify-between border-b border-si-line px-5 py-3">
          <h3 id="send-invoice-title" className="text-base font-medium text-si-ink">
            {t("sendInvoiceTitle")}
          </h3>
          <button
            type="button"
            onClick={fermer}
            className="inline-flex h-tap w-tap items-center justify-center rounded-md text-si-muted transition-colors hover:bg-si-canvas hover:text-si-ink"
            aria-label={t("close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          <p className="text-sm leading-6 text-si-muted">{t("sendDialogIntro")}</p>

          <div className="mt-4">
            <label htmlFor="invoice-email-subject" className="mb-1.5 block text-xs font-medium text-si-muted">
              {t("subject")}
            </label>
            <input
              id="invoice-email-subject"
              type="text"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setDirty(true);
              }}
              className="min-h-tap w-full rounded-md border border-si-line bg-si-surface px-3 py-2 text-sm text-si-ink focus:border-si-verified focus:outline-none focus:ring-2 focus:ring-si-verified/20"
            />
          </div>

          <div className="mt-3">
            <label htmlFor="invoice-email-message" className="mb-1.5 block text-xs font-medium text-si-muted">
              {t("message")}
            </label>
            <textarea
              id="invoice-email-message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setDirty(true);
              }}
              rows={7}
              className="min-h-tap w-full rounded-md border border-si-line bg-si-surface px-3 py-2 text-sm text-si-ink focus:border-si-verified focus:outline-none focus:ring-2 focus:ring-si-verified/20"
            />
          </div>

          <div className="mt-3">
            <label htmlFor="invoice-payment-instructions" className="mb-1.5 block text-xs font-medium text-si-muted">
              {t("paymentInstructions")}
            </label>
            <textarea
              id="invoice-payment-instructions"
              value={paymentInstructions}
              onChange={(e) => {
                setPaymentInstructions(e.target.value);
                setDirty(true);
              }}
              rows={5}
              placeholder={t("paymentInstructionsPlaceholder")}
              className="min-h-tap w-full rounded-md border border-si-line bg-si-surface px-3 py-2 text-sm text-si-ink placeholder:text-si-muted/60 focus:border-si-verified focus:outline-none focus:ring-2 focus:ring-si-verified/20"
            />
            <p className="mt-1 text-xs text-si-muted">{t("paymentInstructionsHint")}</p>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-si-muted">
              <Paperclip className="h-3.5 w-3.5" />
              {t("attachOtherDocs")}
            </div>
            {loadingDocs ? (
              <p className="py-3 text-sm text-si-muted">{t("loading")}</p>
            ) : docsError ? (
              <p className="py-2 text-xs text-si-danger-ink" role="alert">
                {t("documentsLoadError")}
              </p>
            ) : docs.length === 0 ? (
              <p className="py-2 text-xs text-si-muted">{t("noAttachableDocs")}</p>
            ) : (
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                {docs.map((d) => (
                  <li key={d.id}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-si-canvas">
                      <input
                        type="checkbox"
                        checked={selected.has(d.id)}
                        onChange={() => basculer(d.id)}
                        className="accent-si-ink-strong"
                      />
                      <span className="flex-1 truncate text-si-ink">{d.titre}</span>
                      {d.statut === "brouillon" ? (
                        <span className="border-l-2 border-si-amber pl-2 text-[10px] font-medium text-si-amber-ink">
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
            <Button type="button" variant="secondary" onClick={fermer}>
              {t("cancel")}
            </Button>
            <Button variant="primary" className="gap-2" disabled={pending} onClick={envoyer}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {selected.size > 0 ? t("sendWithCount", { n: selected.size }) : t("sendByEmail")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
