"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { createCalendarEvent, updateCalendarEvent } from "@/app/(app)/gestion/lextrack/actions";
import { useTranslations } from "next-intl";

export interface CalendarEventItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  location: string | null;
  clientId: string | null;
  clientName: string | null;
  dossierId: string | null;
  dossierLabel: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
}

interface SelectOption {
  id: string;
  raisonSociale?: string;
  nom?: string;
  role?: string;
  intitule?: string;
  numeroDossier?: string | null;
  clientId?: string;
}

interface EventFormModalProps {
  onClose: () => void;
  clients: SelectOption[];
  users: SelectOption[];
  dossiers: SelectOption[];
  defaultDate?: string;
  editEvent?: CalendarEventItem | null;
}

export function EventFormModal({
  onClose,
  clients,
  users,
  dossiers,
  defaultDate,
  editEvent,
}: EventFormModalProps) {
  const tg = useTranslations("gestion");
  const tc = useTranslations("common");

  const EVENT_TYPES = [
    { value: "rendez_vous_client", label: tg("eventTypeClientMeeting") },
    { value: "audience", label: tg("eventTypeHearing") },
    { value: "reunion_interne", label: tg("eventTypeInternalMeeting") },
    { value: "echeance", label: tg("eventTypeDeadline") },
    { value: "rappel", label: tg("eventTypeReminder") },
    { value: "autre", label: tg("eventTypeOther") },
  ];

  const EVENT_STATUSES = [
    { value: "planifie", label: tg("statusPlanned") },
    { value: "confirme", label: tg("statusConfirmed") },
    { value: "annule", label: tg("statusCancelled") },
    { value: "termine", label: tg("statusCompleted") },
  ];

  const isEdit = Boolean(editEvent);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(editEvent?.title ?? "");
  const [description, setDescription] = useState(editEvent?.description ?? "");
  const [type, setType] = useState(editEvent?.type ?? "rendez_vous_client");
  const [status, setStatus] = useState(editEvent?.status ?? "planifie");
  const [date, setDate] = useState(
    editEvent ? new Date(editEvent.date).toISOString().slice(0, 10) : (defaultDate ?? new Date().toISOString().slice(0, 10))
  );
  const [startTime, setStartTime] = useState(editEvent?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(editEvent?.endTime ?? "10:00");
  const [location, setLocation] = useState(editEvent?.location ?? "");
  const [clientId, setClientId] = useState(editEvent?.clientId ?? "");
  const [dossierId, setDossierId] = useState(editEvent?.dossierId ?? "");
  const [assigneeId, setAssigneeId] = useState(editEvent?.assigneeId ?? "");

  const filteredDossiers = clientId
    ? dossiers.filter((d) => d.clientId === clientId)
    : dossiers;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const input = {
        title,
        description: description || undefined,
        type: type as "rendez_vous_client" | "audience" | "reunion_interne" | "echeance" | "rappel" | "autre",
        date,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        location: location || undefined,
        clientId: clientId || undefined,
        dossierId: dossierId || undefined,
        assigneeId: assigneeId || undefined,
      };

      let result;
      if (isEdit && editEvent) {
        result = await updateCalendarEvent(editEvent.id, { ...input, status: status as "planifie" | "confirme" | "annule" | "termine" });
      } else {
        result = await createCalendarEvent(input);
      }

      if ("error" in result) {
        setError(result.error ?? tg("unknownError"));
      } else {
        onClose();
      }
    });
  }

  const inputClass = "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors";
  const labelClass = "block text-xs font-semibold text-neutral-600 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="text-lg font-semibold text-neutral-900">
            {isEdit ? tg("editEvent") : tg("newEvent")}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className={labelClass}>{tg("title")} *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tg("titlePlaceholder")} className={inputClass} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{tg("eventType")}</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
                {EVENT_TYPES.map((et) => (<option key={et.value} value={et.value}>{et.label}</option>))}
              </select>
            </div>
            {isEdit && (
              <div>
                <label className={labelClass}>{tg("status")}</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                  {EVENT_STATUSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>{tg("date")} *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>{tg("start")}</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{tg("end")}</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>{tg("client")}</label>
            <select value={clientId} onChange={(e) => { setClientId(e.target.value); setDossierId(""); }} className={inputClass}>
              <option value="">{tg("noClientOption")}</option>
              {clients.map((c) => (<option key={c.id} value={c.id}>{c.raisonSociale}</option>))}
            </select>
          </div>

          {filteredDossiers.length > 0 && (
            <div>
              <label className={labelClass}>{tg("dossier")}</label>
              <select value={dossierId} onChange={(e) => setDossierId(e.target.value)} className={inputClass}>
                <option value="">{tg("noMatterOption")}</option>
                {filteredDossiers.map((d) => (<option key={d.id} value={d.id}>{d.numeroDossier ? `${d.numeroDossier} — ` : ""}{d.intitule}</option>))}
              </select>
            </div>
          )}

          <div>
            <label className={labelClass}>{tg("assignedTo")}</label>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={inputClass}>
              <option value="">{tg("selectOption")}</option>
              {users.map((u) => (<option key={u.id} value={u.id}>{u.nom}</option>))}
            </select>
          </div>

          <div>
            <label className={labelClass}>{tg("location")}</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={tg("locationPlaceholder")} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>{tg("notes")}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={tg("notesPlaceholder")} rows={3} className={inputClass + " resize-y"} />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-neutral-100">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">{tc("cancel")}</button>
            <button type="submit" disabled={isPending || !title.trim()} className="px-5 py-2 rounded-xl bg-primary-700 text-white text-sm font-medium shadow-sm hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isPending ? tg("inProgress") : isEdit ? tc("save") : tg("createEvent")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
