"use client";

/**
 * Actions de l'aperçu d'une facture.
 *
 * La fenêtre d'envoi vivait ici, sur 190 lignes, ce qui la rendait
 * inatteignable de partout ailleurs. Elle est passée dans
 * `components/facturation/EnvoiFactureDialog.tsx` pour que l'onglet
 * Correspondance d'un dossier puisse l'ouvrir aussi (lot 0.5).
 *
 * Le comportement de cet écran n'a pas changé : mêmes boutons, mêmes règles
 * d'affichage, même route appelée.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, ExternalLink, Mail, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { EnvoiFactureDialog } from "@/components/facturation/EnvoiFactureDialog";
import { routes } from "@/lib/routes";

type FacturePreviewActionsProps = {
  invoiceId: string;
  invoiceStatus: string | null;
};

export function FacturePreviewActions({ invoiceId, invoiceStatus }: FacturePreviewActionsProps) {
  const router = useRouter();
  const t = useTranslations("billingUi");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [showSend, setShowSend] = useState(false);

  const isDraft = invoiceStatus === "DRAFT" || invoiceStatus == null;
  const canIssue = invoiceStatus === "DRAFT" || invoiceStatus === "READY_TO_ISSUE";

  const runAction = async (action: "valider" | "annuler", successMessage: string) => {
    if (action === "annuler" && !window.confirm(t("confirmCancelDraft"))) return;
    try {
      setPendingAction(action);
      const body =
        action === "annuler" ? JSON.stringify({ cancelReason: "Annulé depuis l'aperçu" }) : JSON.stringify({});
      const response = await fetch(`/api/facturation/factures/${invoiceId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? t("actionNotPossible"));
      toast.success(successMessage);
      if (action === "annuler") router.push(routes.facturation);
      else router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("actionNotPossible"));
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link
        href={`/api/facturation/factures/${invoiceId}/pdf`}
        target="_blank"
        className="inline-flex min-h-tap items-center justify-center gap-1.5 rounded-md border border-si-line px-4 text-sm font-medium text-si-ink transition-colors hover:bg-si-canvas"
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
        <Button variant="primary" className="gap-2" disabled={pendingAction != null} onClick={() => setShowSend(true)}>
          <Mail className="h-4 w-4" />
          {t("sendByEmail")}
        </Button>
      ) : null}

      {isDraft ? (
        <Button
          variant="ghost"
          className="gap-2 text-status-error hover:bg-status-error-bg"
          disabled={pendingAction != null}
          onClick={() => runAction("annuler", t("toastDraftCancelled"))}
        >
          <Trash2 className="h-4 w-4" />
          {t("cancelDraft")}
        </Button>
      ) : null}

      {pendingAction ? (
        <span className="sr-only" role="status" aria-live="polite">
          {t("actionInProgress")}
        </span>
      ) : null}

      {showSend ? (
        <EnvoiFactureDialog
          invoiceId={invoiceId}
          onClose={() => setShowSend(false)}
          onSent={() => router.refresh()}
        />
      ) : null}
    </div>
  );
}
