"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, ExternalLink, Mail, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/routes";

type FacturePreviewActionsProps = {
  invoiceId: string;
  invoiceStatus: string | null;
};

async function postInvoiceAction(
  invoiceId: string,
  action: "valider" | "envoyer-email" | "annuler"
) {
  const response = await fetch(`/api/facturation/factures/${invoiceId}/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: action === "annuler" ? JSON.stringify({ cancelReason: "Annulé depuis l'aperçu" }) : "{}",
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
        className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-md border border-forest-700/50 px-4 text-[14px] font-medium text-forest-700 transition-base hover:bg-forest-50"
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
          onClick={() => runAction("envoyer-email", t("toastInvoiceSent"))}
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
    </div>
  );
}
