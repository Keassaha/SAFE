"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatCalendarDate, formatCurrency } from "@/lib/utils/format";

/**
 * Confirmer la taxe payée d'une dépense.
 *
 * Spec : docs/accounting/SPEC_DEPENSES_ET_PREPARATION_FISCALE.md §2.1 (lot 1).
 *
 * POURQUOI UNE QUESTION ET NON UN FORMULAIRE
 *
 * Deux champs de taxe posés à nu obligeraient le cabinet à savoir ce qu'on attend
 * de lui. La modale pose donc la seule question qui compte, « qu'est-ce que votre
 * pièce montre ? », et n'ouvre les champs que sur la réponse qui les demande.
 * Divulgation progressive (§5 H1), et une intention par écran (§0 M2).
 *
 * Le troisième choix, « je n'ai pas la pièce », est indispensable : sans lui, une
 * dépense sans reçu resterait indéfiniment dans la liste et la rendrait inutilisable.
 * Il ne change rien en base, il ferme simplement la fenêtre sans mentir.
 */

type Reponse = "montant" | "aucune" | null;

export function ConfirmerTaxeModal({
  open,
  onClose,
  onConfirm,
  depense,
  submitting = false,
  error = null,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (choix: { tps: number; tvq: number } | { sansTaxe: true }) => void;
  depense: {
    date: Date | string;
    libelle: string;
    montant: number;
    tpsEstimee: number;
    tvqEstimee: number;
  } | null;
  submitting?: boolean;
  error?: string | null;
}) {
  const t = useTranslations("accountingUi");
  const [reponse, setReponse] = useState<Reponse>(null);
  const [tps, setTps] = useState("");
  const [tvq, setTvq] = useState("");

  // Chaque ouverture repart d'une question neuve. Reporter la réponse précédente
  // sur une autre dépense est le meilleur moyen d'inscrire une taxe fausse.
  useEffect(() => {
    if (open && depense) {
      setReponse(null);
      setTps(depense.tpsEstimee > 0 ? depense.tpsEstimee.toFixed(2) : "");
      setTvq(depense.tvqEstimee > 0 ? depense.tvqEstimee.toFixed(2) : "");
    }
  }, [open, depense]);

  if (!depense) return null;

  const nTps = Number.parseFloat(tps.replace(",", ".")) || 0;
  const nTvq = Number.parseFloat(tvq.replace(",", ".")) || 0;
  const totalSaisi = nTps + nTvq;
  // Une taxe supérieure au montant payé est une faute de frappe, pas une saisie.
  const trop = totalSaisi >= depense.montant;
  const peutConfirmer =
    reponse === "aucune" || (reponse === "montant" && totalSaisi > 0 && !trop);

  const champClass =
    "w-full rounded-md border-[0.5px] border-si-line bg-si-surface px-3 py-2 text-[14px] tabular-nums text-si-ink outline-none focus:border-si-verified focus:shadow-focus";

  return (
    <Modal open={open} onClose={submitting ? () => {} : onClose} title={t("taxeConfirmerTitre")}>
      <div className="space-y-4">
        <p className="text-[13px] leading-relaxed text-si-muted">{t("taxeConfirmerIntro")}</p>

        {/* Le rappel de la ligne : sans lui, le cabinet confirme à l'aveugle. */}
        <div className="rounded-md border border-si-line bg-si-canvas px-3 py-2.5">
          <p className="text-[13px] text-si-ink">{depense.libelle}</p>
          <p className="mt-0.5 text-[12px] text-si-muted">
            {formatCalendarDate(depense.date)} · {formatCurrency(depense.montant)}
          </p>
        </div>

        <fieldset className="space-y-1.5">
          <legend className="mb-2 text-[12px] font-medium text-si-ink">
            {t("taxeConfirmerQuestion")}
          </legend>

          <label className="safe-zoom-rang flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-[14px] text-si-ink transition-colors">
            <input
              type="radio"
              name="reponseTaxe"
              checked={reponse === "montant"}
              onChange={() => setReponse("montant")}
              className="h-4 w-4 shrink-0 accent-si-ink-strong"
            />
            {t("taxeReponseMontant")}
          </label>

          <label className="safe-zoom-rang flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-[14px] text-si-ink transition-colors">
            <input
              type="radio"
              name="reponseTaxe"
              checked={reponse === "aucune"}
              onChange={() => setReponse("aucune")}
              className="h-4 w-4 shrink-0 accent-si-ink-strong"
            />
            {t("taxeReponseAucune")}
          </label>
        </fieldset>

        {/* Les champs n'apparaissent que sur la réponse qui les demande. */}
        {reponse === "montant" ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-[6px] block text-[12px] font-medium text-si-ink" htmlFor="taxe-tps">
                {t("taxeChampTps")}
              </label>
              <input
                id="taxe-tps"
                inputMode="decimal"
                value={tps}
                onChange={(e) => setTps(e.target.value)}
                autoFocus
                className={champClass}
              />
            </div>
            <div>
              <label className="mb-[6px] block text-[12px] font-medium text-si-ink" htmlFor="taxe-tvq">
                {t("taxeChampTvq")}
              </label>
              <input
                id="taxe-tvq"
                inputMode="decimal"
                value={tvq}
                onChange={(e) => setTvq(e.target.value)}
                className={champClass}
              />
            </div>
            {trop ? (
              <p className="col-span-2 text-[12px] text-si-danger-ink" role="alert">
                {t("taxeSuperieureAuMontant")}
              </p>
            ) : null}
          </div>
        ) : null}

        <p className="text-[12px] leading-relaxed text-si-muted">{t("taxeConfirmerNotice")}</p>

        {error ? (
          <p className="text-[13px] text-si-danger-ink" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          {/* « Je n'ai pas la pièce » n'est pas un renoncement décoratif : c'est la
              sortie honnête quand le reçu n'existe pas. Elle ne modifie rien. */}
          <Button type="button" variant="secondary" disabled={submitting} onClick={onClose}>
            {t("taxePasLaPiece")}
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={submitting || !peutConfirmer}
            onClick={() =>
              onConfirm(reponse === "aucune" ? { sansTaxe: true } : { tps: nTps, tvq: nTvq })
            }
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
            {t("taxeConfirmerAction")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
