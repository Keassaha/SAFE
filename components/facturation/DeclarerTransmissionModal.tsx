"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { getSelectableDeliveryChannels } from "@/lib/compliance/invoice-delivery";
import { declareDeliveryAction } from "@/app/(app)/inspection/transmission-factures/actions";

const champ =
  "min-h-tap w-full rounded-lg border border-si-line bg-si-surface px-3 text-sm text-si-ink outline-none focus:border-si-verified focus:ring-2 focus:ring-si-verified/25";

function aujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Déclarer qu'une facture a été transmise au client, hors de SAFE.
 *
 * Deux champs, jamais plus : la date et le canal. C'est ce que
 * `getDeclarationRequirements()` exige, et le raisonnement est dans
 * `lib/compliance/invoice-delivery.ts` — réclamer une pièce jointe ferait de la
 * porte de sortie un second mur, et un cabinet qui a posté une facture n'a
 * souvent que sa parole, ce que le règlement n'interdit pas.
 *
 * Les canaux viennent de `getSelectableDeliveryChannels()` : cinq, jamais six.
 * « Courriel envoyé depuis SAFE » n'est pas proposé, parce que lui seul est
 * prouvé et que personne ne doit pouvoir se l'attribuer. L'action serveur le
 * revérifie de son côté.
 *
 * Demande CEO du 2026-09-14.
 */
export function DeclarerTransmissionModal({
  open,
  onClose,
  invoiceId,
  invoiceNumero,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  invoiceId: string | null;
  invoiceNumero?: string | null;
  onSuccess?: () => void;
}) {
  const t = useTranslations("billingUi");
  const tc = useTranslations("common");
  const canaux = getSelectableDeliveryChannels();
  const [date, setDate] = useState(aujourdhui);
  const [canal, setCanal] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  /* Chaque ouverture repart d'une déclaration vierge : la date du jour, aucun
     canal présumé. Un canal qui resterait d'une facture précédente se
     déclarerait sur la suivante sans qu'on le relise. */
  useEffect(() => {
    if (!open) return;
    setDate(aujourdhui());
    setCanal("");
    setErreur(null);
  }, [open]);

  const infoCanal = canaux.find((c) => c.channel === canal);

  async function enregistrer() {
    if (!invoiceId) return;
    setEnvoi(true);
    setErreur(null);
    const formData = new FormData();
    formData.set("invoiceId", invoiceId);
    formData.set("deliveredAt", date);
    formData.set("deliveryChannel", canal);
    const res = await declareDeliveryAction(formData);
    setEnvoi(false);
    if (!res.ok) {
      setErreur(res.error);
      return;
    }
    onSuccess?.();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={t("declareDeliveryTitle")}>
      <div className="space-y-4">
        {invoiceNumero ? (
          <p className="text-sm text-si-muted">
            {t("declareDeliveryFor", { numero: invoiceNumero })}
          </p>
        ) : null}

        <div>
          <label htmlFor="transmission-date" className="mb-1.5 block text-sm font-medium text-si-muted">
            {t("declareDeliveryDate")}
          </label>
          <input
            id="transmission-date"
            type="date"
            value={date}
            max={aujourdhui()}
            onChange={(e) => setDate(e.target.value)}
            className={champ}
          />
          <p className="mt-1.5 text-xs text-si-muted">{t("declareDeliveryDateHint")}</p>
        </div>

        <div>
          <label htmlFor="transmission-canal" className="mb-1.5 block text-sm font-medium text-si-muted">
            {t("declareDeliveryChannel")}
          </label>
          <select
            id="transmission-canal"
            value={canal}
            onChange={(e) => setCanal(e.target.value)}
            className={champ}
          >
            <option value="">{t("declareDeliveryChannelPlaceholder")}</option>
            {canaux.map((c) => (
              <option key={c.channel} value={c.channel}>
                {t(`channel${c.channel}`)}
              </option>
            ))}
          </select>
          {infoCanal ? (
            <p className="mt-1.5 text-xs text-si-muted">{t(`channel${infoCanal.channel}Hint`)}</p>
          ) : null}
        </div>

        {/* Dit en clair, parce que la différence est tout l'objet du module :
            une déclaration se date et s'attribue, elle ne prouve pas. */}
        <p className="text-xs text-si-amber-ink">{t("declareDeliveryNotProof")}</p>

        {erreur ? (
          <p className="text-sm text-si-danger-ink" role="alert">
            {erreur}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={envoi}>
            {tc("cancel")}
          </Button>
          <Button type="button" variant="primary" onClick={enregistrer} disabled={envoi || !canal || !date}>
            {envoi ? t("declareDeliverySaving") : t("declareDeliverySubmit")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
