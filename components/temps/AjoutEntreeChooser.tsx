"use client";

import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Package, Clock } from "lucide-react";

interface AjoutEntreeChooserProps {
  open: boolean;
  onClose: () => void;
  onChoose: (kind: "forfait" | "horaire") => void;
}

/**
 * Dialogue de choix Forfait / Horaire à l'ajout d'une entrée (mode mixte).
 *
 * Ne contient aucune logique de saisie : il route simplement vers le bon
 * modal existant via `onChoose`. Voir SPEC_TEMPS_MIXTE §5.3.
 */
export function AjoutEntreeChooser({ open, onClose, onChoose }: AjoutEntreeChooserProps) {
  const t = useTranslations("temps.mixte.chooser");

  return (
    <Modal open={open} onClose={onClose} title={t("title")}>
      <p className="text-sm text-si-muted mb-4">{t("subtitle")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChoose("forfait")}
          className="group flex flex-col items-start gap-2 rounded-xl border border-si-line p-4 text-left transition-colors hover:border-si-forest hover:bg-si-verified/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-si-verified"
        >
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-si-verified/10 text-si-verified group-hover:bg-si-verified/10">
            <Package className="w-5 h-5" />
          </span>
          <span className="font-semibold text-si-ink">{t("forfaitTitle")}</span>
          <span className="text-xs text-si-muted">{t("forfaitDesc")}</span>
        </button>

        <button
          type="button"
          onClick={() => onChoose("horaire")}
          className="group flex flex-col items-start gap-2 rounded-xl border border-si-line p-4 text-left transition-colors hover:border-si-forest hover:bg-si-verified/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-si-verified"
        >
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-si-verified/10 text-si-verified group-hover:bg-si-verified/10">
            <Clock className="w-5 h-5" />
          </span>
          <span className="font-semibold text-si-ink">{t("horaireTitle")}</span>
          <span className="text-xs text-si-muted">{t("horaireDesc")}</span>
        </button>
      </div>
    </Modal>
  );
}
