"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { timeEntryCreateSchema, type TimeEntryCreateInput } from "@/lib/validations/time-entry";
import { TIME_ACTIVITY_TYPES, TIME_ENTRY_STATUT } from "@/lib/constants";
import { useCreateTimeEntry, useUpdateTimeEntry } from "@/lib/hooks/useTemps";
import type { TimeEntryStatut } from "@prisma/client";

type ClientOption = { id: string; raisonSociale: string };
type DossierOption = { id: string; intitule: string; numeroDossier: string | null; reference: string | null; clientId: string; client: { raisonSociale: string } };
type UserOption = { id: string; nom: string };

function formatDuree(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h00`;
}

interface TimeEntryFormModalProps {
  open: boolean;
  onClose: () => void;
  cabinetId: string | null;
  currentUserId: string;
  clients: ClientOption[];
  dossiers: DossierOption[];
  users: UserOption[];
  initial?: Partial<TimeEntryCreateInput> & {
    id?: string;
    clientId?: string;
    rawDureeMinutes?: number;
    roundingMinutes?: number;
  };
  onSuccess?: () => void;
}

export function TimeEntryFormModal({
  open,
  onClose,
  cabinetId,
  currentUserId,
  clients,
  dossiers,
  users,
  initial,
  onSuccess,
}: TimeEntryFormModalProps) {
  const t = useTranslations("timer.form");
  const isEdit = !!initial?.id;
  const [clientId, setClientId] = useState("");
  const [dossierId, setDossierId] = useState(initial?.dossierId ?? "");
  const [userId, setUserId] = useState(initial?.userId ?? currentUserId);
  const [date, setDate] = useState(
    initial?.date ? new Date(initial.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [dureeMinutes, setDureeMinutes] = useState(initial?.dureeMinutes ?? 60);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [typeActivite, setTypeActivite] = useState(initial?.typeActivite ?? "");
  const [facturable, setFacturable] = useState(initial?.facturable ?? true);
  const [statut, setStatut] = useState<TimeEntryStatut>(initial?.statut ?? "brouillon");
  const [tauxHoraire, setTauxHoraire] = useState(initial?.tauxHoraire ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [roundingHint, setRoundingHint] = useState<{ raw: number; rounded: number; roundingMinutes: number } | undefined>(undefined);

  const dossiersForClient = clientId ? dossiers.filter((d) => d.clientId === clientId) : [];

  useEffect(() => {
    if (!clientId) {
      setDossierId("");
      return;
    }
    const list = dossiers.filter((d) => d.clientId === clientId);
    if (list.length === 1) {
      setDossierId(list[0].id);
    } else {
      setDossierId((prev) => (list.some((d) => d.id === prev) ? prev : ""));
    }
  }, [clientId, dossiers]);

  useEffect(() => {
    if (!open) return;
    const initDossierId = initial?.dossierId ?? "";
    const initClientId = initial?.clientId ?? "";
    setDossierId(initDossierId);
    if (initClientId) {
      setClientId(initClientId);
    } else if (initDossierId) {
      const dossier = dossiers.find((d) => d.id === initDossierId);
      setClientId(dossier?.clientId ?? "");
    } else {
      setClientId("");
    }
    setUserId(initial?.userId ?? currentUserId);
    setDate(initial?.date ? new Date(initial.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    setDureeMinutes(initial?.dureeMinutes ?? 60);
    if (initial && "rawDureeMinutes" in initial && "roundingMinutes" in initial && initial.rawDureeMinutes != null && initial.roundingMinutes != null && initial.dureeMinutes != null) {
      setRoundingHint({ raw: initial.rawDureeMinutes, rounded: initial.dureeMinutes, roundingMinutes: initial.roundingMinutes });
    } else {
      setRoundingHint(undefined);
    }
    setDescription(initial?.description ?? "");
    setTypeActivite(initial?.typeActivite ?? "");
    setFacturable(initial?.facturable ?? true);
    setStatut(initial?.statut ?? "brouillon");
    setTauxHoraire(initial?.tauxHoraire ?? 0);
    setError(null);
  }, [open, initial, currentUserId, dossiers]);

  const createMutation = useCreateTimeEntry(cabinetId);
  const updateMutation = useUpdateTimeEntry(cabinetId);

  const clientHasDossiers = dossiersForClient.length > 0;
  const dossierRequired = clientHasDossiers;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (dossierRequired && !dossierId) {
      setError(t("errors.selectMatter"));
      return;
    }
    const raw = {
      dossierId: dossierId || undefined,
      clientId: clientId || undefined,
      userId,
      date: new Date(date),
      dureeMinutes,
      description: description || undefined,
      typeActivite: typeActivite || undefined,
      facturable,
      statut,
      tauxHoraire,
    };
    const parsed = timeEntryCreateSchema.safeParse(raw);
    if (!parsed.success) {
      setError(t("errors.invalidData"));
      return;
    }
    if (isEdit && initial?.id) {
      updateMutation.mutate(
        { id: initial.id, ...parsed.data },
        {
          onSuccess: () => {
            toast.success(t("success.updated"));
            onSuccess?.();
            onClose();
          },
          onError: (err) => {
            toast.error(err.message);
            setError(err.message);
          },
        }
      );
    } else {
      createMutation.mutate(parsed.data, {
        onSuccess: () => {
          toast.success(t("success.created"));
          onSuccess?.();
          onClose();
        },
        onError: (err) => {
          toast.error(err.message);
          setError(err.message);
        },
      });
    }
  }

  const pending = createMutation.isPending || updateMutation.isPending;
  const activityLabels = {
    consultation: t("activity.consultation"),
    recherche: t("activity.research"),
    redaction: t("activity.drafting"),
    plaidoirie: t("activity.advocacy"),
    reunion: t("activity.meeting"),
    correspondance: t("activity.correspondence"),
    autre: t("activity.other"),
  } as const;
  const statusLabels: Record<TimeEntryStatut, string> = {
    brouillon: t("status.draft"),
    valide: t("status.validated"),
    facture: t("status.invoiced"),
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t("titleEdit") : t("titleCreate")}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--safe-text-secondary)] mb-1">{t("client")}</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            className="w-full h-10 px-3 rounded-lg border border-[var(--safe-neutral-border)] bg-white"
          >
            <option value="">{t("selectClient")}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.raisonSociale}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--safe-text-secondary)] mb-1">
            {t("matter")}{dossierRequired ? ` ${t("requiredSuffix")}` : ""}
          </label>
          <select
            value={dossierId}
            onChange={(e) => setDossierId(e.target.value)}
            required={dossierRequired}
            disabled={!clientId}
            className="w-full h-10 px-3 rounded-lg border border-[var(--safe-neutral-border)] bg-white"
          >
            <option value="">
              {!clientId
                ? t("selectClientFirst")
                : dossiersForClient.length === 0
                  ? t("noActiveMatter")
                  : t("chooseMatter")}
            </option>
            {dossiersForClient.map((d) => (
              <option key={d.id} value={d.id}>
                {d.numeroDossier ?? d.reference ?? "—"} — {d.intitule}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--safe-text-secondary)] mb-1">{t("user")}</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            className="w-full h-10 px-3 rounded-lg border border-[var(--safe-neutral-border)] bg-white"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.nom}</option>
            ))}
          </select>
        </div>
        <Input label={t("date")} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Input
          label={t("durationMinutes")}
          type="number"
          min={1}
          value={String(dureeMinutes)}
          onChange={(e) => setDureeMinutes(Number(e.target.value) || 0)}
          required
        />
        {roundingHint && (
          <p className="text-xs text-[var(--safe-text-secondary)] -mt-2">
            {formatDuree(roundingHint.raw)} → {formatDuree(roundingHint.rounded)} ({t("roundedTo", { minutes: roundingHint.roundingMinutes })})
          </p>
        )}
        <Input label={t("description")} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div>
          <label className="block text-sm font-medium text-[var(--safe-text-secondary)] mb-1">{t("activityType")}</label>
          <select
            value={typeActivite}
            onChange={(e) => setTypeActivite(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-[var(--safe-neutral-border)] bg-white"
          >
            <option value="">{t("none")}</option>
            {TIME_ACTIVITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{activityLabels[t.value]}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="facturable"
            checked={facturable}
            onChange={(e) => setFacturable(e.target.checked)}
          />
          <label htmlFor="facturable" className="text-sm">{t("billable")}</label>
        </div>
        {isEdit && (
          <div>
            <label className="block text-sm font-medium text-[var(--safe-text-secondary)] mb-1">{t("statusLabel")}</label>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value as TimeEntryStatut)}
              className="w-full h-10 px-3 rounded-lg border border-[var(--safe-neutral-border)] bg-white"
            >
              {(Object.keys(TIME_ENTRY_STATUT) as TimeEntryStatut[]).map((s) => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>
          </div>
        )}
        <Input
          label={t("hourlyRate")}
          type="number"
          step="0.01"
          min={0}
          value={String(tauxHoraire)}
          onChange={(e) => setTauxHoraire(Number(e.target.value) || 0)}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={pending}>
            {isEdit ? t("save") : t("create")}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
