"use client";

import { useState, useEffect } from "react";
import { Play, Clock, Pause, Square, RotateCcw, Save, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTimer, formatTimerElapsed } from "@/lib/contexts/TimerContext";
import { useTempsContext } from "@/lib/hooks/useTemps";
import { useQueryClient } from "@tanstack/react-query";
import { NewClientModal } from "./NewClientModal";
import { useTranslations } from "next-intl";

interface SaisieRapideBlockProps {
  cabinetId: string | null;
  currentUserId: string;
}

const NEW_CLIENT_OPTION_VALUE = "__new_client__";

export function SaisieRapideBlock({ cabinetId, currentUserId }: SaisieRapideBlockProps) {
  const t = useTranslations("temps");
  const tc = useTranslations("common");
  const tt = useTranslations("timer");
  const timer = useTimer();
  const queryClient = useQueryClient();
  const { data: context, isLoading } = useTempsContext(cabinetId);
  const [clientId, setClientId] = useState("");
  const [dossierId, setDossierId] = useState("");
  const [description, setDescription] = useState("");
  const [newClientModalOpen, setNewClientModalOpen] = useState(false);

  const dossiersForClient = context?.dossiers.filter((d) => d.clientId === clientId) ?? [];
  const clients = context?.clients ?? [];

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
      clientLabel: client?.raisonSociale,
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

  const handleNewClientSuccess = (client: { id: string; raisonSociale: string }) => {
    if (cabinetId) {
      queryClient.invalidateQueries({ queryKey: ["temps", "context", cabinetId] });
    }
    setClientId(client.id);
  };

  return (
    <div className="card-glass p-6">
      <h3 className="text-base font-semibold safe-text-title flex items-center gap-2 tracking-tight">
        <Play className="w-4 h-4" aria-hidden />
        {t("quickEntry")}
      </h3>
      <p className="text-sm safe-text-secondary mt-1 mb-4">
        {t("quickEntryDesc")}
      </p>
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <Clock className="w-6 h-6 text-green-700" aria-hidden />
          </div>
          <div>
            <p className="text-2xl font-mono font-bold safe-text-metric tabular-nums">
              {formatTimerElapsed(timer.elapsedSeconds)}
            </p>
            <p className="text-xs safe-text-secondary">
              {timer.running ? t("statusRunning") : timer.hasStoppedWithPending ? t("statusStopped") : timer.isPaused ? t("statusPaused") : t("statusReady")}
            </p>
          </div>
        </div>
        {timer.running || timer.isPaused || timer.hasStoppedWithPending ? (
          <div className="flex items-center gap-2 flex-wrap">
            {timer.hasStoppedWithPending ? (
              <>
                <Button type="button" onClick={timer.triggerOpenSaveModal}>
                  <Save className="w-4 h-4 mr-2 inline" />
                  {t("saveTime")}
                </Button>
                <Button type="button" variant="secondary" onClick={timer.clearPending}>
                  <X className="w-4 h-4 mr-2 inline" />
                  {tc("cancel")}
                </Button>
              </>
            ) : (
              <>
                {timer.running ? (
                  <Button type="button" variant="secondary" onClick={timer.pause}>
                    <Pause className="w-4 h-4 mr-2 inline" />
                    {tt("pause")}
                  </Button>
                ) : (
                  <Button type="button" onClick={timer.resume}>
                    <Play className="w-4 h-4 mr-2 inline" />
                    {tt("resume")}
                  </Button>
                )}
                <Button type="button" variant="secondary" onClick={timer.restart}>
                  <RotateCcw className="w-4 h-4 mr-2 inline" />
                  {tt("restart")}
                </Button>
                <Button type="button" variant="secondary" onClick={timer.stopOnly}>
                  <Square className="w-4 h-4 mr-2 inline" />
                  {tt("stop")}
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="min-w-[180px]">
              <label className="block text-xs font-medium safe-text-secondary mb-1">{tc("client")}</label>
              <select
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                disabled={isLoading}
                className="w-full h-10 px-3 rounded-safe-sm border border-[var(--safe-neutral-border)] bg-white text-sm"
              >
                <option value="">{t("selectClient")}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.raisonSociale}
                  </option>
                ))}
                <option value={NEW_CLIENT_OPTION_VALUE}>{t("addNewClient")}</option>
              </select>
            </div>
            <div className="min-w-[200px]">
              <label className="block text-xs font-medium safe-text-secondary mb-1">{tc("dossier")}</label>
              <select
                value={dossierId}
                onChange={(e) => setDossierId(e.target.value)}
                disabled={!clientId || isLoading}
                className="w-full h-10 px-3 rounded-safe-sm border border-[var(--safe-neutral-border)] bg-white text-sm"
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
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium safe-text-secondary mb-1">
                {t("workingOn")}
              </label>
              <input
                type="text"
                placeholder={t("descriptionOptional")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-10 px-3 rounded-safe-sm border border-[var(--safe-neutral-border)] text-sm"
              />
            </div>
            <Button
              type="button"
              onClick={handleStart}
              disabled={!canStart}
              className="shrink-0"
            >
              <Play className="w-4 h-4 mr-2 inline" />
              {t("startTimer")}
            </Button>
          </>
        )}
      </div>
      <NewClientModal
        open={newClientModalOpen}
        onClose={() => setNewClientModalOpen(false)}
        onSuccess={handleNewClientSuccess}
      />
    </div>
  );
}
