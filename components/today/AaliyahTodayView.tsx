import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Sunrise,
  CheckCircle2,
  ArrowRight,
  Clock,
  AlertTriangle,
  CornerUpLeft,
  HelpCircle,
  Send,
  Check,
  MessageSquare,
  Award,
} from "lucide-react";

/* ── Types (déjà calculés par la page) ── */
export interface TodayNextAction {
  text: string;
  dossierId: string;
  matterLabel: string;
  countdownDays: number | null;
  countdownLabel: string | null; // ex. "IRCC portal"
}
export interface TodayInboxRow {
  id: string;
  dossierId: string;
  type: "question" | "info" | "sent_back" | "ready_for_review" | "approved" | "reply";
  body: string | null;
  matterLabel: string;
  authorName: string | null;
}
export interface TodayFocusRow {
  id: string;
  dossierId: string;
  title: string;
  matterLabel: string;
  daysUntil: number | null; // null = pas d'échéance
  overdue?: boolean;
}
export interface TodayDeadline {
  dossierId: string;
  label: string;
  matterLabel: string;
  daysUntil: number;
}
export interface TodayAwaiting {
  dossierId: string;
  matterLabel: string;
  clientName: string;
}
export interface AaliyahTodayData {
  firstName: string;
  dateLabel: string;
  activeMatters: number;
  omissions: number;
  nextAction: TodayNextAction | null;
  inbox: TodayInboxRow[];
  focus: TodayFocusRow[];
  deadlines: TodayDeadline[];
  awaiting: TodayAwaiting[];
  weekReady: number;
}

const ACCENT = "#1F3A2E";
const TONE = {
  err: { fg: "#8A3A2D", bg: "#F3D8D2" },
  warn: { fg: "#8B6B1F", bg: "#F5E6C8" },
  succ: { fg: "#1F3A2E", bg: "#D4E8D9" },
  brand: { fg: "#1F3A2E", bg: "#EEF5F0" },
  muted: { fg: "#71717A", bg: "#FAFAFA" },
} as const;

function dayTone(days: number | null): keyof typeof TONE {
  if (days == null) return "muted";
  if (days <= 2) return "err";
  if (days <= 7) return "warn";
  return "muted";
}

function inboxTone(type: TodayInboxRow["type"]): keyof typeof TONE {
  switch (type) {
    case "sent_back": return "err";
    case "question": return "warn";
    case "approved": return "succ";
    case "ready_for_review": return "brand";
    default: return "muted";
  }
}
function InboxIcon({ type }: { type: TodayInboxRow["type"] }) {
  const c = "h-4 w-4";
  switch (type) {
    case "sent_back": return <CornerUpLeft className={c} aria-hidden />;
    case "question": return <HelpCircle className={c} aria-hidden />;
    case "approved": return <Check className={c} aria-hidden />;
    case "ready_for_review": return <Send className={c} aria-hidden />;
    default: return <MessageSquare className={c} aria-hidden />;
  }
}

export async function AaliyahTodayView({ data }: { data: AaliyahTodayData }) {
  const t = await getTranslations("todayUi");
  const cd = (days: number | null) =>
    days == null ? "" : days <= 0 ? t("today") : t("inDays", { n: days });

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      {/* Greeting + calm */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            {t("greeting", { name: data.firstName })}
          </h1>
          <span
            className="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold"
            style={{ backgroundColor: data.omissions === 0 ? TONE.succ.bg : TONE.warn.bg, color: data.omissions === 0 ? TONE.succ.fg : TONE.warn.fg }}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {data.omissions === 0 ? t("nothingSlips") : t("itemsOverdue", { n: data.omissions })}
          </span>
        </div>
        <div className="text-sm text-neutral-500">{data.dateLabel} · {t("activeMatters", { n: data.activeMatters })}</div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr] items-start">
        {/* MAIN */}
        <div className="space-y-5">
          {/* Next action */}
          {data.nextAction ? (
            <div className="rounded-2xl border p-5" style={{ borderColor: "#CDE0D4", backgroundColor: TONE.brand.bg }}>
              <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: ACCENT }}>{t("yourNextAction")}</div>
              <div className="mt-1.5 text-xl font-bold text-neutral-900">{data.nextAction.text}</div>
              <div className="mt-1 text-sm text-neutral-600">{data.nextAction.matterLabel}</div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {data.nextAction.countdownDays != null ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold"
                    style={{ backgroundColor: TONE[dayTone(data.nextAction.countdownDays)].bg, color: TONE[dayTone(data.nextAction.countdownDays)].fg }}>
                    <Clock className="h-4 w-4" aria-hidden />
                    {data.nextAction.countdownLabel ? `${data.nextAction.countdownLabel} · ` : ""}{cd(data.nextAction.countdownDays)}
                  </span>
                ) : null}
                <Link href={`/dossiers/${data.nextAction.dossierId}`}
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
                  style={{ backgroundColor: ACCENT }}>
                  {t("doItNow")} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 text-sm text-neutral-500">
              {t("noNextAction")}
            </div>
          )}

          {/* Navette — needs you */}
          <div className="today-dimmable rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-neutral-900">{t("navetteTitle")}</h2>
              <span className="text-xs text-neutral-500">· {t("needsYou")}</span>
            </div>
            {data.inbox.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-400">{t("navetteEmpty")}</p>
            ) : (
              <div className="mt-2">
                {data.inbox.map((m) => {
                  const tone = TONE[inboxTone(m.type)];
                  return (
                    <Link key={m.id} href={`/dossiers/${m.dossierId}`}
                      className="flex items-start gap-3 border-t border-neutral-100 py-3 first:border-t-0 hover:bg-neutral-50 -mx-2 px-2 rounded-lg">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: tone.bg, color: tone.fg }}>
                        <InboxIcon type={m.type} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs font-semibold text-neutral-600">{m.matterLabel}</span>
                        </div>
                        {m.body ? <div className="mt-1 truncate text-sm text-neutral-700">{m.body}</div> : null}
                        <div className="mt-0.5 text-xs text-neutral-400">{m.authorName ?? "—"}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Today's focus */}
          <div className="today-dimmable rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">{t("todaysFocus")}</div>
              <Link href="/dossiers" className="text-[13px] font-semibold" style={{ color: ACCENT }}>{t("openMyMatters")}</Link>
            </div>
            {data.focus.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-400">{t("focusEmpty")}</p>
            ) : (
              data.focus.map((f) => (
                <Link key={f.id} href={`/dossiers/${f.dossierId}`}
                  className="flex items-center gap-3 border-t border-neutral-100 py-3 first:border-t-0">
                  <span className="h-[18px] w-[18px] shrink-0 rounded-md border-[1.5px] border-neutral-300" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14.5px] font-semibold text-neutral-900">{f.title}</div>
                    <div className="text-xs text-neutral-400">{f.matterLabel}</div>
                  </div>
                  {f.overdue ? (
                    <span className="rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: TONE.err.bg, color: TONE.err.fg }}>{t("overdue")}</span>
                  ) : f.daysUntil != null ? (
                    <span className="rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: TONE[dayTone(f.daysUntil)].bg, color: TONE[dayTone(f.daysUntil)].fg }}>{cd(f.daysUntil)}</span>
                  ) : null}
                </Link>
              ))
            )}
          </div>
        </div>

        {/* RAIL */}
        <div className="today-dimmable space-y-5">
          {/* Deadlines */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-neutral-900"><Clock className="h-4 w-4 text-neutral-500" aria-hidden /> {t("deadlines")}</h3>
            {data.deadlines.length === 0 ? <p className="text-sm text-neutral-400">{t("deadlinesEmpty")}</p> :
              data.deadlines.map((d) => (
                <Link key={`${d.dossierId}-${d.label}`} href={`/dossiers/${d.dossierId}`} className="flex items-center gap-3 border-t border-neutral-100 py-2.5 first:border-t-0">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-500">
                    {d.daysUntil <= 2 ? <AlertTriangle className="h-4 w-4" aria-hidden /> : <Clock className="h-4 w-4" aria-hidden />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold text-neutral-900 truncate">{d.label}</div>
                    <div className="text-xs text-neutral-400 truncate">{d.matterLabel}</div>
                  </div>
                  <span className="text-[11.5px] font-bold" style={{ color: TONE[dayTone(d.daysUntil)].fg }}>{cd(d.daysUntil)}</span>
                </Link>
              ))}
          </div>

          {/* Awaiting client */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-neutral-900"><Clock className="h-4 w-4 text-neutral-500" aria-hidden /> {t("awaitingClient")}</h3>
            {data.awaiting.length === 0 ? <p className="text-sm text-neutral-400">{t("awaitingEmpty")}</p> :
              data.awaiting.map((a) => (
                <Link key={a.dossierId} href={`/dossiers/${a.dossierId}`} className="flex items-center justify-between gap-2 border-t border-neutral-100 py-2.5 first:border-t-0 text-[13.5px] text-neutral-900">
                  <span className="min-w-0"><span className="block truncate font-medium">{a.matterLabel}</span><span className="text-xs text-neutral-400">{a.clientName}</span></span>
                </Link>
              ))}
          </div>

          {/* Recognition */}
          <div className="rounded-2xl border border-neutral-200 p-5" style={{ background: "linear-gradient(180deg,#F4FAF6,#FFFFFF)" }}>
            <h3 className="mb-2 flex items-center gap-2 text-[13px] font-bold text-neutral-900"><Award className="h-4 w-4 text-neutral-500" aria-hidden /> {t("yourWeek")}</h3>
            <div className="flex gap-5">
              <div><b className="block text-lg text-neutral-900">{data.weekReady}</b><span className="text-xs text-neutral-500">{t("mattersReady")}</span></div>
              <div><b className="block text-lg text-neutral-900">{data.omissions}</b><span className="text-xs text-neutral-500">{t("omissionsLabel")}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
