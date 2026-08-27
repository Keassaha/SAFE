"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { rowMenuItemClass } from "@/components/ui/RowMenu";
import { useFormatteurs } from "@/lib/i18n/formatteurs";

/**
 * Relance manuelle d'une facture en retard.
 *
 * Une confirmation s'intercale, et ce n'est pas une politesse : le clic envoie
 * un courriel au CLIENT DE L'AVOCAT. Le geste est irréversible et sort du
 * cabinet, donc la modale nomme le destinataire, le montant et l'ancienneté
 * avant de laisser partir quoi que ce soit.
 *
 * L'entrée n'apparaît que sur une facture réellement en retard. Le service
 * refuserait de toute façon (409), mais proposer un geste que le serveur va
 * refuser est une promesse en trop.
 *
 * ⚠️ La modale vit HORS du `RowMenu`, et c'est structurel : `RowMenu` monte son
 * contenu dans un portail qu'il DÉMONTE à la fermeture (`RowMenu.tsx:176`).
 * Une modale déclarée à l'intérieur disparaissait donc au clic même qui devait
 * l'ouvrir. Ce composant enveloppe la cellule et ne passe au menu que le
 * déclencheur.
 */
export function RelancerFacture({
  children,
  invoiceId,
  numero,
  clientNom,
  cabinetNom,
  balanceDue,
  joursDeRetard,
  destinataire,
}: {
  /** Contenu de la cellule. Reçoit le déclencheur à poser dans le menu. */
  children: (demander: () => void) => React.ReactNode;
  invoiceId: string;
  numero: string;
  clientNom: string;
  cabinetNom: string;
  balanceDue: number;
  joursDeRetard: number;
  destinataire: string | null;
}) {
  const t = useTranslations("facturation");
  const tc = useTranslations("common");
  const router = useRouter();
  const { formatCurrency } = useFormatteurs();
  const [ouvert, setOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  async function envoyer() {
    setEnvoi(true);
    try {
      const res = await fetch(`/api/facturation/factures/${invoiceId}/relancer`, {
        method: "POST",
      });
      const corps = (await res.json()) as { destinataire?: string };
      if (res.ok) {
        toast.success(t("reminderSent", { destinataire: corps.destinataire ?? "" }));
        setOuvert(false);
        // La colonne « Relance » du registre vient de changer.
        router.refresh();
        return;
      }
      const messages: Record<number, string> = {
        400: t("reminderNoEmail"),
        409: t("reminderNotOverdue"),
      };
      toast.error(messages[res.status] ?? t("reminderFailed"));
    } catch {
      toast.error(t("reminderFailed"));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <>
      {children(() => setOuvert(true))}

      <Modal open={ouvert} onClose={() => setOuvert(false)} title={t("reminderConfirmTitle")}>
        <div className="space-y-5 p-5">
          {/* Sans destinataire, on ne dit pas « un courriel partira à — » :
              rien ne partira, et annoncer un envoi impossible est un mensonge
              poli. On dit ce qui manque et où le corriger. */}
          {destinataire ? (
            <p className="text-[14px] leading-6 text-si-body">
              {t("reminderConfirmBody", {
                destinataire,
                cabinet: cabinetNom,
                numero,
                montant: formatCurrency(balanceDue),
                jours: joursDeRetard,
              })}
            </p>
          ) : (
            <p className="rounded-[10px] border border-si-line bg-si-surface2 px-3 py-2.5 text-[14px] leading-6 text-si-body">
              {t("reminderNoEmail")}
            </p>
          )}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOuvert(false)}
              className="text-[13px] text-si-muted transition-colors hover:text-si-ink"
            >
              {tc("cancel")}
            </button>
            <Button type="button" onClick={envoyer} disabled={envoi || !destinataire}>
              {envoi ? t("reminderSending") : t("reminderConfirmSend")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/** Entrée de menu qui demande la relance. Vit dans le `RowMenu`, la modale non. */
export function RelancerMenuItem({ onDemande }: { onDemande: () => void }) {
  const t = useTranslations("facturation");
  return (
    <button type="button" role="menuitem" className={rowMenuItemClass} onClick={onDemande}>
      <Send className="h-4 w-4" aria-hidden />
      {t("sendReminder")}
    </button>
  );
}
