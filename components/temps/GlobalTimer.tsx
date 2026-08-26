"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Clock, Pause, Play, Square, RotateCcw, Save, X, ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTimer, formatTimerElapsed } from "@/lib/contexts/TimerContext";
import { useTempsContext } from "@/lib/hooks/useTemps";
import { TimeEntryFormModal } from "./TimeEntryFormModal";
import { routes } from "@/lib/routes";
import {
  formatHeuresDecimales,
  minutesFacturablesDuChrono,
} from "@/lib/temps/duree";
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

/** Une commande du panneau : icône, libellé lisible, pas d'icône seule à deviner. */
function CommandeChrono({
  icone: Icone,
  libelle,
  onClick,
  ton = "neutre",
}: {
  icone: typeof Pause;
  libelle: string;
  onClick: () => void;
  ton?: "neutre" | "primaire";
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`safe-zoom-menu flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-sans ${
        ton === "primaire"
          ? "safe-action-degrade text-white"
          : "text-text-body hover:text-text-primary"
      }`}
    >
      <Icone className="h-4 w-4 shrink-0" strokeWidth={1.75} />
      {libelle}
    </button>
  );
}

export function GlobalTimer({ cabinetId, currentUserId }: GlobalTimerProps) {
  const t = useTranslations("timer");
  const locale = useLocale();
  const timer = useTimer();
  const { data: context, isLoading: contextLoading } = useTempsContext(cabinetId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingInitial, setPendingInitial] = useState<PendingTimeEntryInitial | null>(null);
  /**
   * Chrono en cours : la barre supérieure n'affiche plus que le décompte.
   *
   * Les quatre boutons alignés dans la barre poussaient la navigation hors de
   * sa piste : les libellés du menu passaient par-dessus le logo et le champ de
   * recherche dès qu'on démarrait le temps. Le décompte reste visible, parce
   * que c'est lui l'information ; les commandes vivent dans un panneau, à un
   * clic, avec leur nom écrit plutôt qu'une icône à deviner.
   */
  const [panneauOuvert, setPanneauOuvert] = useState(false);
  const panneauRef = useRef<HTMLDivElement>(null);

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
      const dureeMinutes = minutesFacturablesDuChrono(totalSeconds, rounding);
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
  // Le chrono affiche l'heure facturable à côté du décompte : c'est elle qu'on
  // enregistrera, et c'est elle que le cabinet lit.
  const minutesFacturables = minutesFacturablesDuChrono(
    timer.elapsedSeconds,
    context?.roundingMinutes ?? DEFAULT_ROUNDING_MINUTES
  );
  const actif = timer.running || timer.isPaused || timer.hasStoppedWithPending;
  const etat = timer.hasStoppedWithPending
    ? t("statusPending")
    : timer.running
      ? t("statusRunning")
      : t("statusPaused");

  // Un chrono qui s'arrête ne laisse pas derrière lui un panneau de commandes
  // qui ne s'appliquent plus.
  useEffect(() => {
    if (!actif) setPanneauOuvert(false);
  }, [actif]);

  useEffect(() => {
    if (!panneauOuvert) return;
    const surClic = (e: MouseEvent) => {
      if (panneauRef.current && !panneauRef.current.contains(e.target as Node)) {
        setPanneauOuvert(false);
      }
    };
    const surEchap = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanneauOuvert(false);
    };
    window.addEventListener("mousedown", surClic);
    window.addEventListener("keydown", surEchap);
    return () => {
      window.removeEventListener("mousedown", surClic);
      window.removeEventListener("keydown", surEchap);
    };
  }, [panneauOuvert]);

  const fermerPuis = (action: () => void) => () => {
    setPanneauOuvert(false);
    action();
  };

  return (
    <>
      <div className="relative flex items-center gap-1" ref={panneauRef}>
        {actif ? (
          <>
            <button
              type="button"
              onClick={() => setPanneauOuvert((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={panneauOuvert}
              title={`${displayTime} · ${etat}`}
              className="safe-topbar-text flex items-center gap-1.5 rounded-[7px] border border-[0.5px] border-border bg-[var(--si-canvas)] py-1 pl-2 pr-1.5 text-sm font-mono font-medium text-si-ink transition-colors hover:border-si-ink-strong/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-si-ink-strong/40"
            >
              <Clock
                className={`h-4 w-4 ${timer.running ? "text-si-verified" : "text-si-muted"}`}
                aria-hidden
              />
              <span className="tabular-nums">{displayTime}</span>
              <ChevronDown className="h-3.5 w-3.5 text-si-muted" strokeWidth={1.75} aria-hidden />
            </button>

            {/* Le geste du moment reste dans la barre, sans panneau à ouvrir :
                mettre en pause quand ça tourne, reprendre quand c'est en pause,
                enregistrer quand le temps attend d'être écrit. Le reste des
                commandes vit dans le panneau. */}
            {timer.hasStoppedWithPending ? (
              <button
                type="button"
                onClick={timer.triggerOpenSaveModal}
                className="safe-action-degrade rounded-[7px] p-1.5 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-si-ink-strong/40"
                title={t("saveTime")}
                aria-label={t("save")}
              >
                <Save className="h-4 w-4" strokeWidth={1.75} />
              </button>
            ) : timer.running ? (
              <button
                type="button"
                onClick={timer.pause}
                className="rounded-[7px] p-1.5 text-si-muted transition-colors hover:bg-si-canvas hover:text-si-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-si-ink-strong/40"
                title={t("pause")}
                aria-label={t("pause")}
              >
                <Pause className="h-4 w-4" strokeWidth={1.75} />
              </button>
            ) : (
              <button
                type="button"
                onClick={timer.resume}
                className="rounded-[7px] p-1.5 text-si-muted transition-colors hover:bg-si-canvas hover:text-si-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-si-ink-strong/40"
                title={t("resume")}
                aria-label={t("resume")}
              >
                <Play className="h-4 w-4" strokeWidth={1.75} />
              </button>
            )}

            {panneauOuvert && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-[10px] border border-[0.5px] border-border bg-surface shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)]"
              >
                <div className="border-b border-[0.5px] border-border/70 bg-si-canvas/60 px-3.5 py-3">
                  <p className="text-[11px] font-sans font-medium uppercase tracking-[0.12em] text-si-ink-strong">
                    {t("time")}
                  </p>
                  <p className="mt-1 font-mono text-[17px] tabular-nums text-si-ink">
                    {displayTime}
                  </p>
                  <p className="mt-0.5 text-[11.5px] font-sans text-text-muted">
                    {etat}
                    {minutesFacturables > 0
                      ? ` · ${t("hoursShort", { heures: formatHeuresDecimales(minutesFacturables, locale) })}`
                      : ""}
                  </p>
                </div>

                <div className="space-y-0.5 px-1.5 py-1.5">
                  {timer.hasStoppedWithPending ? (
                    <>
                      <CommandeChrono
                        icone={Save}
                        libelle={t("saveTime")}
                        ton="primaire"
                        onClick={fermerPuis(timer.triggerOpenSaveModal)}
                      />
                      <CommandeChrono
                        icone={X}
                        libelle={t("cancel")}
                        onClick={fermerPuis(timer.clearPending)}
                      />
                    </>
                  ) : (
                    <>
                      {timer.running ? (
                        <CommandeChrono
                          icone={Pause}
                          libelle={t("pause")}
                          onClick={fermerPuis(timer.pause)}
                        />
                      ) : (
                        <CommandeChrono
                          icone={Play}
                          libelle={t("resume")}
                          onClick={fermerPuis(timer.resume)}
                        />
                      )}
                      <CommandeChrono
                        icone={RotateCcw}
                        libelle={t("restart")}
                        onClick={fermerPuis(timer.restart)}
                      />
                      <CommandeChrono
                        icone={Square}
                        libelle={t("stopTimer")}
                        onClick={fermerPuis(timer.stopOnly)}
                      />
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <Link
            href={routes.temps}
            className="safe-topbar-text flex items-center gap-1.5 text-sm text-si-ink hover:text-si-ink-strong"
          >
            <Clock className="w-4 h-4 text-si-ink-strong" />
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
