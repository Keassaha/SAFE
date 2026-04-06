"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Pause, Play, Square, RotateCcw, Save, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTimer, formatTimerElapsed } from "@/lib/contexts/TimerContext";
import { useTempsContext } from "@/lib/hooks/useTemps";
import { TimeEntryFormModal } from "./TimeEntryFormModal";
import { routes } from "@/lib/routes";
import { roundDurationMinutes } from "@/lib/temps/utils";
import { DEFAULT_ROUNDING_MINUTES } from "@/lib/constants";
import type { TimeEntryCreateInput } from "@/lib/validations/time-entry";
import type { TimerState } from "@/lib/contexts/TimerContext";

/** Données pré-remplies pour le modal d’arrêt (clientId pour pré-sélection, dossierId pour l’API). */
type PendingTimeEntryInitial = Partial<TimeEntryCreateInput> & {
  clientId?: string;
  rawDureeMinutes?: number;
  roundingMinutes?: number;
};

interface GlobalTimerProps {
  cabinetId: string | null;
  currentUserId: string;
}

export function GlobalTimer({ cabinetId, currentUserId }: GlobalTimerProps) {
  const t = useTranslations("timer");
  const timer = useTimer();
  const { data: context, isLoading: contextLoading } = useTempsContext(cabinetId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingInitial, setPendingInitial] = useState<PendingTimeEntryInitial | null>(null);

  useEffect(() => {
    timer.onStopConfirm((payload: TimerState) => {
      const totalSeconds =
        payload.accumulatedSeconds > 0
          ? payload.accumulatedSeconds
          : payload.startTime
            ? Math.floor((Date.now() - payload.startTime) / 1000)
            : 0;
      const rawMinutes = Math.max(1, Math.ceil(totalSeconds / 60));
      const rounding = context?.roundingMinutes ?? DEFAULT_ROUNDING_MINUTES;
      const dureeMinutes = roundDurationMinutes(rawMinutes, rounding);
      setPendingInitial({
        clientId: payload.clientId ?? undefined,
        dossierId: payload.dossierId ?? undefined,
        description: payload.description || undefined,
        date: new Date(),
        dureeMinutes,
        rawDureeMinutes: rawMinutes !== dureeMinutes ? rawMinutes : undefined,
        roundingMinutes: rawMinutes !== dureeMinutes ? rounding : undefined,
        userId: currentUserId,
        facturable: true,
        statut: "brouillon",
        tauxHoraire: 0,
      });
      setConfirmOpen(true);
    });
  }, [timer, currentUserId, context?.roundingMinutes]);

  const handleConfirmClose = () => {
    setConfirmOpen(false);
    setPendingInitial(null);
    timer.clearPending();
  };

  const displayTime = formatTimerElapsed(timer.elapsedSeconds);

  return (
    <>
      <div className="flex items-center gap-2">
        {timer.running || timer.isPaused || timer.hasStoppedWithPending ? (
          <>
            <span className="safe-topbar-text flex items-center gap-1.5 text-sm font-mono font-medium text-[var(--safe-text-title)] min-w-[7ch]">
              <Clock className="w-4 h-4 text-[var(--safe-green-800)]" aria-hidden />
              {displayTime}
            </span>
            {timer.hasStoppedWithPending ? (
              <>
                <button
                  type="button"
                  onClick={timer.triggerOpenSaveModal}
                  className="p-1.5 rounded-safe-sm bg-green-600 text-white hover:bg-green-700"
                  title={t("saveTime")}
                  aria-label={t("save")}
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={timer.clearPending}
                  className="p-1.5 rounded-safe-sm hover:bg-neutral-100 text-[var(--safe-text-secondary)]"
                  title={t("cancel")}
                  aria-label={t("cancel")}
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                {timer.running ? (
                  <button
                    type="button"
                    onClick={timer.pause}
                    className="p-1.5 rounded-safe-sm hover:bg-neutral-100 text-[var(--safe-text-secondary)]"
                    title={t("pause")}
                    aria-label={t("pause")}
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={timer.resume}
                    className="p-1.5 rounded-safe-sm hover:bg-neutral-100 text-[var(--safe-text-secondary)]"
                    title={t("resume")}
                    aria-label={t("resume")}
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={timer.restart}
                  className="p-1.5 rounded-safe-sm hover:bg-neutral-100 text-[var(--safe-text-secondary)]"
                  title={t("restart")}
                  aria-label={t("restart")}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={timer.stopOnly}
                  className="p-1.5 rounded-safe-sm hover:bg-neutral-100 text-[var(--safe-text-secondary)]"
                  title={t("stopTimer")}
                  aria-label={t("stop")}
                >
                  <Square className="w-4 h-4" />
                </button>
              </>
            )}
          </>
        ) : (
          <Link
            href={routes.temps}
            className="safe-topbar-text flex items-center gap-1.5 text-sm text-[var(--safe-text-title)] hover:text-[var(--safe-green-700)]"
          >
            <Clock className="w-4 h-4 text-[var(--safe-icon-default)]" />
            <span className="hidden sm:inline">{t("time")}</span>
          </Link>
        )}
      </div>

      <TimeEntryFormModal
        open={confirmOpen}
        onClose={handleConfirmClose}
        cabinetId={cabinetId}
        currentUserId={currentUserId}
        clients={context?.clients ?? []}
        dossiers={context?.dossiers ?? []}
        users={context?.users ?? []}
        initial={pendingInitial ?? undefined}
        onSuccess={handleConfirmClose}
      />
    </>
  );
}
