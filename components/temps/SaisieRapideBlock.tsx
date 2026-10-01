"use client";

import { useState, useEffect } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTimer, formatTimerElapsed } from "@/lib/contexts/TimerContext";
import { useTempsContext } from "@/lib/hooks/useTemps";
import { useQueryClient } from "@tanstack/react-query";
import { NewClientModal } from "./NewClientModal";
import { useLocale, useTranslations } from "next-intl";
import { formatHeuresDecimales, minutesFacturablesDuChrono } from "@/lib/temps/duree";
import { DEFAULT_ROUNDING_MINUTES } from "@/lib/constants";
import { clientNomListe } from "@/lib/clients/normalize-name";

interface SaisieRapideBlockProps {
  cabinetId: string | null;
  currentUserId: string;
}

const NEW_CLIENT_OPTION_VALUE = "__new_client__";

// Personnes physiques : `raisonSociale` est null → on retombe sur prénom + nom.
function clientLabel(c: { raisonSociale: string | null; prenom?: string | null; nom?: string | null }): string {
  /* Écriture des listes, règle CEO du 2026-10-01 : « Tremblay, Marie ». */
  return clientNomListe(c);
}

export function SaisieRapideBlock({ cabinetId, currentUserId }: SaisieRapideBlockProps) {
  const t = useTranslations("temps");
  const tc = useTranslations("common");
  const tt = useTranslations("timer");
  const locale = useLocale();
  const timer = useTimer();
  const queryClient = useQueryClient();
  const { data: context, isLoading } = useTempsContext(cabinetId);
  const [clientId, setClientId] = useState("");
  const [dossierId, setDossierId] = useState("");
  const [description, setDescription] = useState("");
  const [newClientModalOpen, setNewClientModalOpen] = useState(false);

  const dossiersForClient = context?.dossiers.filter((d) => d.clientId === clientId) ?? [];
  const clients = context?.clients ?? [];

  // Le cabinet facture en heures : le chrono le dit tout de suite, sans attendre
  // qu'on l'arrête pour découvrir ce que 47 minutes valent sur une facture.
  const rounding = context?.roundingMinutes ?? DEFAULT_ROUNDING_MINUTES;
  const minutesFacturables = minutesFacturablesDuChrono(timer.elapsedSeconds, rounding);

  useEffect(() => {
    if (!clientId) {
      setDossierId("");
      return;
    }
    const list = context?.dossiers.filter((d) => d.clientId === clientId) ?? [];
    if (list.length === 1) setDossierId(list[0].id);
    else setDossierId("");
  }, [clientId, context?.dossiers]);

  const canStart = !!clientId && !timer.running;
  const handleStart = () => {
    if (!canStart) return;
    const client = clients.find((c) => c.id === clientId);
    const dossier = dossierId ? context?.dossiers.find((d) => d.id === dossierId) : undefined;
    const dossierLabel = dossier ? `${dossier.numeroDossier ?? dossier.reference ?? ""} ${dossier.intitule}` : undefined;
    timer.start({
      clientId,
      clientLabel: client ? clientLabel(client) : undefined,
      dossierId: dossierId || undefined,
      dossierLabel,
      description,
    });
  };

  const handleClientChange = (value: string) => {
    if (value === NEW_CLIENT_OPTION_VALUE) {
      setNewClientModalOpen(true);
      setClientId("");
    } else {
      setClientId(value);
    }
  };

  const handleNewClientSuccess = (client: { id: string; raisonSociale: string | null }) => {
    if (cabinetId) {
      queryClient.invalidateQueries({ queryKey: ["temps", "context", cabinetId] });
    }
    setClientId(client.id);
  };

  const champ = "h-9 rounded-md border border-si-line bg-si-surface px-2.5 text-[13px] text-si-ink outline-none transition-[border-color,box-shadow] focus:border-si-ink-strong/40 focus:ring-2 focus:ring-si-ink-strong/20 disabled:cursor-not-allowed disabled:opacity-60";
  const etat = timer.running
    ? t("statusRunning")
    : timer.hasStoppedWithPending
      ? t("statusStopped")
      : timer.isPaused
        ? t("statusPaused")
        : t("statusReady");

  /* Une ligne, pas une carte : le chronomètre avait un titre, une phrase
     d'explication et un bouton plein qui disputait l'écran à « Nouvelle
     entrée ». Sa mécanique est intacte. Demande CEO du 2026-09-12. */
  return (
    <section
      aria-label={t("chronoLabel")}
      className="flex flex-wrap items-center gap-2.5 rounded-[10px] border border-si-line bg-si-surface px-3.5 py-2.5"
    >
      <span className="flex items-baseline gap-2 pr-1">
        <span className="font-mono text-[18px] font-medium tabular-nums text-si-ink">{formatTimerElapsed(timer.elapsedSeconds)}</span>
        <span className="text-[12px] text-si-muted">
          {minutesFacturables > 0 ? (
            <>
              <span className="font-medium tabular-nums text-si-ink">
                {t("hoursShort", { heures: formatHeuresDecimales(minutesFacturables, locale) })}
              </span>
              {" · "}
            </>
          ) : null}
          {etat}
        </span>
      </span>
      {timer.running || timer.isPaused || timer.hasStoppedWithPending ? (
        <span className="flex flex-wrap items-center gap-2">
          {timer.hasStoppedWithPending ? (
            <>
              <Button type="button" onClick={timer.triggerOpenSaveModal}>
                {t("saveTime")}
              </Button>
              <Button type="button" variant="secondary" onClick={timer.clearPending}>
                {tc("cancel")}
              </Button>
            </>
          ) : (
            <>
              {timer.running ? (
                <Button type="button" variant="secondary" onClick={timer.pause}>
                  {tt("pause")}
                </Button>
              ) : (
                <Button type="button" variant="secondary" onClick={timer.resume}>
                  {tt("resume")}
                </Button>
              )}
              <Button type="button" variant="secondary" onClick={timer.restart}>
                {tt("restart")}
              </Button>
              <Button type="button" variant="secondary" onClick={timer.stopOnly}>
                {tt("stop")}
              </Button>
            </>
          )}
        </span>
      ) : (
        <>
          <select
            value={clientId}
            onChange={(e) => handleClientChange(e.target.value)}
            disabled={isLoading}
            aria-label={tc("client")}
            className={`${champ} w-[200px]`}
          >
            <option value="">{t("selectClient")}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {clientLabel(c)}
              </option>
            ))}
            <option value={NEW_CLIENT_OPTION_VALUE}>{t("addNewClient")}</option>
          </select>
          <select
            value={dossierId}
            onChange={(e) => setDossierId(e.target.value)}
            disabled={!clientId || isLoading}
            aria-label={tc("dossier")}
            className={`${champ} w-[220px]`}
          >
            <option value="">
              {!clientId ? t("selectClientFirst") : dossiersForClient.length === 0 ? t("noActiveMatter") : t("chooseMatter")}
            </option>
            {dossiersForClient.map((d) => (
              <option key={d.id} value={d.id}>
                {d.numeroDossier ?? d.reference ?? "—"} — {d.intitule}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder={t("workingOn")}
            aria-label={t("workingOn")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${champ} min-w-[200px] flex-1`}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleStart}
            disabled={!canStart}
            title={!clientId ? t("selectClientToStart") : undefined}
          >
            <Play className="mr-1.5 inline h-4 w-4" aria-hidden />
            {t("startTimer")}
          </Button>
        </>
      )}
      <NewClientModal
        open={newClientModalOpen}
        onClose={() => setNewClientModalOpen(false)}
        onSuccess={handleNewClientSuccess}
      />
    </section>
  );
}
