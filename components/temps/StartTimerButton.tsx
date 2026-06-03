"use client";

import { useTranslations } from "next-intl";
import { Play, Timer } from "lucide-react";
import { useTimer } from "@/lib/contexts/TimerContext";

/**
 * Bouton « Démarrer le chrono » — point d'entrée du chrono facturable existant
 * (TimerContext + GlobalTimer + SaisieRapideBlock). Capture passive : un clic et
 * le temps tourne ; au stop, le modal propose une entrée de temps pré-remplie.
 *
 * Désactivé si un chrono tourne déjà (évite d'écraser une session en cours).
 */
export function StartTimerButton({
  clientId,
  clientLabel,
  dossierId,
  dossierLabel,
  description,
  variant = "solid",
}: {
  clientId: string;
  clientLabel?: string;
  dossierId?: string;
  dossierLabel?: string;
  description?: string;
  variant?: "solid" | "soft";
}) {
  const t = useTranslations("timerUi");
  const { running, start } = useTimer();

  if (running) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-neutral-400">
        <Timer className="h-4 w-4" aria-hidden /> {t("running")}
      </span>
    );
  }

  const style =
    variant === "solid"
      ? { backgroundColor: "#1F3A2E", color: "#fff", border: "none" }
      : { backgroundColor: "#fff", color: "#1F3A2E", border: "1px solid #CDE0D4" };

  return (
    <button
      type="button"
      onClick={() => start({ clientId, clientLabel, dossierId, dossierLabel, description })}
      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold"
      style={style}
    >
      <Play className="h-4 w-4" aria-hidden /> {t("start")}
    </button>
  );
}
