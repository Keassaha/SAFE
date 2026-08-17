"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { JournalCorrectionMotive } from "@prisma/client";

/**
 * Demande le motif avant toute annulation ou correction.
 *
 * Doctrine: docs/accounting/DOCTRINE_ANNULATION_CORRECTION.md §2.
 *
 * Liste FERMÉE et volontairement courte : un champ libre par défaut se remplit avec
 * « erreur » et ne prouve plus rien le jour de l'inspection. `AUTRE` seul ouvre un
 * texte, et il est alors obligatoire.
 *
 * Composant partagé par le journal général et les encaissements : une seule
 * grammaire de motifs dans tout le produit, jamais deux listes qui divergent.
 */

const MOTIF_ORDER: JournalCorrectionMotive[] = [
  "ERREUR_SAISIE",
  "MAUVAIS_TYPE",
  "DOUBLON",
  "MONTANT_ERRONE",
  "TRANSACTION_ANNULEE",
  "MAUVAIS_DOSSIER",
  "AUTRE",
];

const MOTIF_KEY: Record<JournalCorrectionMotive, string> = {
  ERREUR_SAISIE: "motifErreurSaisie",
  MAUVAIS_TYPE: "motifMauvaisType",
  DOUBLON: "motifDoublon",
  MONTANT_ERRONE: "motifMontantErrone",
  TRANSACTION_ANNULEE: "motifTransactionAnnulee",
  MAUVAIS_DOSSIER: "motifMauvaisDossier",
  AUTRE: "motifAutre",
};

/** Doit rester aligné sur `MOTIF_TEXTE_MIN` du service. */
const TEXTE_MIN = 10;

export function MotifAnnulationModal({
  open,
  onClose,
  onConfirm,
  title,
  intro,
  /** Rappel de ce qui va être annulé : « Ajustement manuel, 1 250,00 $, 12 août ». */
  cible,
  submitting = false,
  error = null,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (motifCode: JournalCorrectionMotive, motifTexte: string | null) => void;
  title: string;
  intro: string;
  cible?: string | null;
  submitting?: boolean;
  error?: string | null;
}) {
  const t = useTranslations("accountingUi");
  const [motifCode, setMotifCode] = useState<JournalCorrectionMotive>("ERREUR_SAISIE");
  const [motifTexte, setMotifTexte] = useState("");

  // Chaque ouverture repart d'un motif neuf : reporter le motif de l'annulation
  // précédente est la meilleure façon d'obtenir un registre de corrections faux.
  useEffect(() => {
    if (open) {
      setMotifCode("ERREUR_SAISIE");
      setMotifTexte("");
    }
  }, [open]);

  const texteRequis = motifCode === "AUTRE";
  const texteValide = !texteRequis || motifTexte.trim().length >= TEXTE_MIN;

  return (
    <Modal open={open} onClose={submitting ? () => {} : onClose} title={title}>
      <div className="space-y-4">
        <p className="text-[13px] leading-relaxed text-si-muted">{intro}</p>

        {cible ? (
          <p className="rounded-md border border-si-line bg-si-canvas px-3 py-2.5 text-[13px] text-si-ink">
            {cible}
          </p>
        ) : null}

        <fieldset className="space-y-1.5">
          <legend className="mb-2 text-[12px] font-medium text-si-ink">
            {t("motifLegend")}
          </legend>
          {MOTIF_ORDER.map((code) => (
            <label
              key={code}
              className="safe-zoom-rang flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-[14px] text-si-ink transition-colors"
            >
              <input
                type="radio"
                name="motifCode"
                value={code}
                checked={motifCode === code}
                onChange={() => setMotifCode(code)}
                className="h-4 w-4 shrink-0 accent-si-forest"
              />
              {t(MOTIF_KEY[code])}
            </label>
          ))}
        </fieldset>

        {texteRequis ? (
          <div>
            <label className="mb-[6px] block text-[12px] font-medium text-si-ink">
              {t("motifPreciser")}
            </label>
            <textarea
              value={motifTexte}
              onChange={(e) => setMotifTexte(e.target.value)}
              rows={3}
              autoFocus
              className="w-full rounded-md border-[0.5px] border-si-line bg-si-surface px-3 py-2 text-[14px] text-si-ink outline-none focus:border-si-verified focus:shadow-focus"
            />
            {!texteValide && motifTexte.length > 0 ? (
              <p className="mt-1 text-[12px] text-si-muted">
                {t("motifTexteTropCourt", { min: TEXTE_MIN })}
              </p>
            ) : null}
          </div>
        ) : null}

        <p className="text-[12px] leading-relaxed text-si-muted">{t("motifNotice")}</p>

        {error ? (
          <p className="text-[13px] text-si-danger-ink" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          {/* Pas `cancel` : dans cette modale, « Annuler » désignerait à la fois
              refermer la fenêtre et annuler l'écriture. Deux sens opposés sur le
              même mot, à l'endroit précis où le cabinet hésite déjà. */}
          <Button type="button" variant="secondary" disabled={submitting} onClick={onClose}>
            {t("motifRenoncer")}
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={submitting || !texteValide}
            onClick={() => onConfirm(motifCode, motifTexte.trim() || null)}
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
            {t("motifConfirmer")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
