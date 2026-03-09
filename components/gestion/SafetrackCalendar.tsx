"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Plus,
  MapPin,
  User,
  FolderOpen,
  Trash2,
} from "lucide-react";
import { EventFormModal } from "./EventFormModal";
import type { CalendarEventItem } from "./EventFormModal";
import { deleteCalendarEvent } from "@/app/(app)/gestion/lextrack/actions";

const WEEKDAY_KEYS = ["weekMon", "weekTue", "weekWed", "weekThu", "weekFri", "weekSat", "weekSun"] as const;

const MONTH_KEYS = [
  "monthJanuary", "monthFebruary", "monthMarch", "monthApril", "monthMay", "monthJune",
  "monthJuly", "monthAugust", "monthSeptember", "monthOctober", "monthNovember", "monthDecember",
] as const;

interface DeadlineEvent {
  id: string;
  title: string;
  deadline: string;
  status: string;
  dossierLabel: string;
  dossierId: string;
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

interface SafetrackCalendarProps {
  deadlines: DeadlineEvent[];
  calendarEvents: CalendarEventItem[];
  dossierBaseUrl: string;
  clients: SelectOption[];
  users: SelectOption[];
  dossiers: SelectOption[];
}

const DEADLINE_STYLES: Record<string, { dot: string; color: string; Icon: typeof Circle }> = {
  done: { dot: "bg-emerald-500", color: "#10b981", Icon: CheckCircle2 },
  inprogress: { dot: "bg-amber-500", color: "#f59e0b", Icon: Clock },
  upcoming: { dot: "bg-orange-500", color: "#f97316", Icon: AlertTriangle },
  todo: { dot: "bg-neutral-400", color: "#9ca3af", Icon: Circle },
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  rendez_vous_client: "bg-blue-500",
  audience: "bg-red-500",
  reunion_interne: "bg-purple-500",
  echeance: "bg-amber-500",
  rappel: "bg-orange-500",
  autre: "bg-neutral-400",
};

// EVENT_TYPE_LABELS and STATUS_LABELS are built inside the component using useTranslations

type UnifiedEvent = {
  kind: "deadline";
  data: DeadlineEvent;
} | {
  kind: "event";
  data: CalendarEventItem;
};

function getDeadlineStyle(status: string) {
  return DEADLINE_STYLES[status] ?? DEADLINE_STYLES.todo;
}

export function SafetrackCalendar({
  deadlines,
  calendarEvents,
  dossierBaseUrl,
  clients,
  users,
  dossiers,
}: SafetrackCalendarProps) {
  const tg = useTranslations("gestion");
  const tc = useTranslations("common");

  const WEEKDAY_LABELS = WEEKDAY_KEYS.map((k) => tg(k));
  const MONTH_NAMES = MONTH_KEYS.map((k) => tg(k));

  const EVENT_TYPE_LABELS: Record<string, string> = {
    rendez_vous_client: tg("eventTypeShortClientMeeting"),
    audience: tg("eventTypeHearing"),
    reunion_interne: tg("internalMeeting"),
    echeance: tg("eventTypeDeadline"),
    rappel: tg("eventTypeReminder"),
    autre: tg("eventTypeOther"),
  };

  const STATUS_LABELS: Record<string, string> = {
    planifie: tg("statusPlanned"),
    confirme: tg("statusConfirmed"),
    annule: tg("statusCancelled"),
    termine: tg("statusCompleted"),
    done: tg("statusDone"),
    inprogress: tg("statusInProgress"),
    upcoming: tg("statusImminent"),
    todo: tg("statusTodo"),
  };

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEventItem | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const unifiedByDay = useMemo(() => {
    const map = new Map<number, UnifiedEvent[]>();

    for (const dl of deadlines) {
      const d = new Date(dl.deadline);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push({ kind: "deadline", data: dl });
      }
    }

    for (const ev of calendarEvents) {
      const d = new Date(ev.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push({ kind: "event", data: ev });
      }
    }

    return map;
  }, [deadlines, calendarEvents, year, month]);

  const weeks = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = last.getDate();
    const rows = Math.ceil((startOffset + daysInMonth) / 7);
    const result: (number | null)[][] = [];
    let day = 1;
    for (let r = 0; r < rows; r++) {
      const week: (number | null)[] = [];
      for (let c = 0; c < 7; c++) {
        const i = r * 7 + c;
        if (i < startOffset || day > daysInMonth) week.push(null);
        else week.push(day++);
      }
      result.push(week);
    }
    return result;
  }, [year, month]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1);
    setSelectedDay(null); setExpandedId(null);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1);
    setSelectedDay(null); setExpandedId(null);
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const dayItems = selectedDay ? (unifiedByDay.get(selectedDay) ?? []) : [];

  async function handleDelete(eventId: string) {
    setDeleting(true);
    await deleteCalendarEvent(eventId);
    setExpandedId(null);
    setDeleting(false);
  }

  return (
    <>
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-600" />
            <h3 className="text-sm font-semibold text-neutral-900">{tg("agenda")}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setShowModal(true); setEditEvent(null); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-700 text-white hover:bg-primary-800 transition-colors">
              <Plus className="w-3.5 h-3.5" /> {tg("eventLabel")}
            </button>
            <div className="flex items-center gap-0.5 ml-2">
              <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <button type="button" onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelectedDay(now.getDate()); }} className="px-2 py-1 text-[11px] font-medium text-primary-700 hover:bg-primary-50 rounded-lg transition-colors">{tg("todayShort")}</button>
              <span className="text-sm font-medium text-neutral-900 min-w-[130px] text-center">{MONTH_NAMES[month]} {year}</span>
              <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Calendar grid */}
          <div className="flex-1 p-3">
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="text-center text-[10px] font-semibold uppercase tracking-wider text-neutral-400 py-1.5">{label}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-neutral-100 rounded-xl overflow-hidden">
              {weeks.flat().map((d, idx) => {
                if (d === null) return <div key={`e-${idx}`} className="bg-white min-h-[4.5rem]" />;
                const items = unifiedByDay.get(d) ?? [];
                const isToday = isCurrentMonth && d === now.getDate();
                const isSelected = d === selectedDay;
                return (
                  <button key={d} type="button" onClick={() => { setSelectedDay(d === selectedDay ? null : d); setExpandedId(null); }}
                    className={`bg-white min-h-[4.5rem] p-1 text-left transition-colors relative ${isSelected ? "ring-2 ring-primary-500 ring-inset z-10" : "hover:bg-primary-50/50"}`}>
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${isToday ? "bg-primary-700 text-white" : "text-neutral-700"}`}>{d}</span>
                    <div className="mt-0.5 space-y-px">
                      {items.slice(0, 2).map((item) => {
                        if (item.kind === "event") {
                          return (
                            <div key={item.data.id} className={`flex items-center gap-0.5 px-1 py-px rounded text-[9px] font-medium text-white truncate ${EVENT_TYPE_COLORS[item.data.type] ?? "bg-neutral-400"}`}>
                              <span className="truncate">{item.data.startTime ? `${item.data.startTime} ` : ""}{item.data.title}</span>
                            </div>
                          );
                        }
                        return (
                          <div key={item.data.id} className="flex items-center gap-0.5 px-1 py-px rounded text-[9px] font-medium text-neutral-600 bg-neutral-100 truncate">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDeadlineStyle(item.data.status).dot}`} />
                            <span className="truncate">{item.data.title}</span>
                          </div>
                        );
                      })}
                      {items.length > 2 && <div className="text-[9px] text-neutral-400 font-medium px-1">+{items.length - 2}</div>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-neutral-100">
              {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${EVENT_TYPE_COLORS[key]}`} /><span className="text-[9px] text-neutral-500">{label}</span></div>
              ))}
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neutral-300" /><span className="text-[9px] text-neutral-500">{tg("matterAct")}</span></div>
            </div>
          </div>

          {/* Day detail panel */}
          <div className="lg:w-72 border-t lg:border-t-0 lg:border-l border-neutral-100 p-4 bg-neutral-50/50">
            {selectedDay !== null ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{selectedDay} {MONTH_NAMES[month]}</p>
                    <p className="text-lg font-bold text-neutral-900">{dayItems.length} {dayItems.length !== 1 ? tg("itemsCount") : tg("itemsCount")}</p>
                  </div>
                  <button type="button" onClick={() => { setShowModal(true); setEditEvent(null); }} className="p-2 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"><Plus className="w-4 h-4" /></button>
                </div>

                {dayItems.length === 0 ? (
                  <div className="rounded-xl bg-neutral-100 p-4 text-center"><p className="text-sm text-neutral-500">{tg("noElements")}</p></div>
                ) : (
                  <div className="space-y-2 max-h-[26rem] overflow-y-auto">
                    {dayItems.map((item) => {
                      if (item.kind === "event") {
                        const ev = item.data;
                        const isExpanded = expandedId === ev.id;
                        return (
                          <button key={ev.id} type="button" onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                            className={`w-full text-left rounded-xl border p-3 transition-all ${isExpanded ? "border-primary-300 bg-primary-50" : "border-neutral-200 bg-white hover:border-neutral-300"}`}>
                            <div className="flex items-start gap-2">
                              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${EVENT_TYPE_COLORS[ev.type] ?? "bg-neutral-400"}`} />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-neutral-900 truncate">{ev.title}</p>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500">
                                  {ev.startTime && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ""}</span>}
                                  <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-[10px] font-medium">{EVENT_TYPE_LABELS[ev.type] ?? ev.type}</span>
                                </div>
                                {isExpanded && (
                                  <div className="mt-2 pt-2 border-t border-neutral-100 space-y-1 text-xs text-neutral-600">
                                    {ev.description && <p>{ev.description}</p>}
                                    {ev.clientName && <div className="flex items-center gap-1"><User className="w-3 h-3 text-neutral-400" />{ev.clientName}</div>}
                                    {ev.dossierLabel && <div className="flex items-center gap-1"><FolderOpen className="w-3 h-3 text-neutral-400" />{ev.dossierLabel}</div>}
                                    {ev.assigneeName && <div className="flex items-center gap-1"><User className="w-3 h-3 text-neutral-400" />{tg("assignedToName", { name: ev.assigneeName ?? "" })}</div>}
                                    {ev.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-neutral-400" />{ev.location}</div>}
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${ev.status === "confirme" ? "bg-emerald-100 text-emerald-700" : ev.status === "annule" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{STATUS_LABELS[ev.status] ?? ev.status}</span>
                                    <div className="flex gap-2 pt-1">
                                      <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); setEditEvent(ev); setShowModal(true); }} onKeyDown={() => {}} className="flex-1 text-center py-1 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer">{tg("editLabel")}</span>
                                      <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); handleDelete(ev.id); }} onKeyDown={() => {}} className={`p-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 cursor-pointer ${deleting ? "opacity-50 pointer-events-none" : ""}`}><Trash2 className="w-3.5 h-3.5" /></span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      }

                      const dl = item.data;
                      const style = getDeadlineStyle(dl.status);
                      const StatusIcon = style.Icon;
                      return (
                        <Link key={dl.id} href={`${dossierBaseUrl}?dossierId=${encodeURIComponent(dl.dossierId)}`}
                          className="block rounded-xl border border-neutral-200 bg-white p-3 hover:shadow-sm hover:border-primary-300 transition-all group">
                          <div className="flex items-start gap-2">
                            <StatusIcon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: style.color }} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-neutral-900 truncate group-hover:text-primary-700 transition-colors">{dl.title}</p>
                              <p className="text-xs text-neutral-500 mt-0.5 truncate">{dl.dossierLabel}</p>
                              <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${style.color} 12%, transparent)`, color: style.color }}>
                                {STATUS_LABELS[dl.status] ?? dl.status}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-center">
                <Calendar className="w-7 h-7 text-neutral-300 mb-2" />
                <p className="text-sm text-neutral-400">{tg("selectDay")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <EventFormModal
          onClose={() => { setShowModal(false); setEditEvent(null); }}
          clients={clients}
          users={users}
          dossiers={dossiers}
          defaultDate={selectedDay ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}` : undefined}
          editEvent={editEvent}
        />
      )}
    </>
  );
}
