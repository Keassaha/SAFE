"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Clock, Check, X, CircleDashed, Wallet, Loader2, Plus, Trash2 } from "lucide-react";
import type { EmployeeHoursStatus } from "@prisma/client";
import {
  submitMyHoursAction,
  withdrawMyHoursAction,
} from "@/app/(app)/mes-heures/actions";

export interface SerializedHoursEntry {
  id: string;
  date: string; // ISO
  hours: number;
  status: EmployeeHoursStatus;
  note: string | null;
  dossierLabel: string | null;
  rejectionReason: string | null;
}

export interface MyHoursPanelData {
  employee: { id: string; fullName: string; hourlyRate: number };
  entries: SerializedHoursEntry[];
  summary: {
    submittedHours: number;
    approvedHours: number;
    paidHours: number;
    rejectedCount: number;
    expectedPay: number;
    paidPay: number;
  };
}

interface Props {
  data: MyHoursPanelData;
  matters: Array<{ id: string; label: string }>;
  locale?: "fr" | "en";
  today: string; // yyyy-mm-dd (calculé serveur)
}

const TONE: Record<string, { fg: string; bg: string }> = {
  warn: { fg: "#8B6B1F", bg: "#F5E6C8" },
  succ: { fg: "#1F3A2E", bg: "#D4E8D9" },
  err: { fg: "#8A3A2D", bg: "#F3D8D2" },
  brand: { fg: "#1F3A2E", bg: "#EEF5F0" },
};

function toneFor(s: EmployeeHoursStatus): keyof typeof TONE {
  switch (s) {
    case "submitted": return "warn";
    case "approved": return "succ";
    case "rejected": return "err";
    case "paid": return "brand";
  }
}

function StatusIcon({ status }: { status: EmployeeHoursStatus }) {
  const cls = "h-3.5 w-3.5";
  switch (status) {
    case "submitted": return <CircleDashed className={cls} aria-hidden />;
    case "approved": return <Check className={cls} aria-hidden />;
    case "rejected": return <X className={cls} aria-hidden />;
    case "paid": return <Wallet className={cls} aria-hidden />;
  }
}

export function MyHoursPanel({ data, matters, locale = "en", today }: Props) {
  const t = useTranslations("hoursUi");
  const router = useRouter();
  const [date, setDate] = useState(today);
  const [hours, setHours] = useState("");
  const [dossierId, setDossierId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-CA", {
      style: "currency",
      currency: "CAD",
    }).format(n);

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat(locale === "en" ? "en-CA" : "fr-CA", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(new Date(iso));

  const statusLabel = (s: EmployeeHoursStatus) =>
    t(({ submitted: "statusSubmitted", approved: "statusApproved", rejected: "statusRejected", paid: "statusPaid" } as const)[s]);

  function submit() {
    setError(null);
    const h = Number(hours.replace(",", "."));
    if (!Number.isFinite(h) || h <= 0 || h > 24) {
      setError(t("invalidHours"));
      return;
    }
    startTransition(async () => {
      try {
        await submitMyHoursAction({
          date,
          hours: h,
          dossierId: dossierId || null,
          note: note.trim() || null,
        });
        setHours("");
        setNote("");
        setDossierId("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : t("genericError"));
      }
    });
  }

  function withdraw(id: string) {
    setError(null);
    startTransition(async () => {
      try {
        await withdrawMyHoursAction(id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : t("genericError"));
      }
    });
  }

  const stat = data.summary;

  return (
    <div className="space-y-6">
      {/* Synthèse */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          tone="brand"
          label={t("expectedPay")}
          value={fmtMoney(stat.expectedPay)}
          hint={t("expectedPayHint", { hours: stat.approvedHours })}
        />
        <SummaryCard tone="warn" label={t("pendingHours")} value={`${stat.submittedHours} h`} hint={t("pendingHoursHint")} />
        <SummaryCard tone="succ" label={t("approvedHours")} value={`${stat.approvedHours} h`} hint={t("approvedHoursHint")} />
        <SummaryCard tone="brand" label={t("paidPay")} value={fmtMoney(stat.paidPay)} hint={t("paidPayHint", { hours: stat.paidHours })} />
      </div>

      {/* Saisie */}
      <div className="rounded-2xl border border-si-line bg-si-surface p-5">
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-si-muted" aria-hidden />
          <h3 className="text-[15px] font-semibold text-si-ink">{t("submitTitle")}</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-si-muted">{t("fieldDate")}</span>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className="h-[38px] w-full rounded-md border border-si-line bg-si-surface px-3 text-sm text-si-ink focus:border-si-verified focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-si-muted">{t("fieldHours")}</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.25"
              min="0"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="0.0"
              className="h-[38px] w-full rounded-md border border-si-line bg-si-surface px-3 text-sm text-si-ink focus:border-si-verified focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-si-muted">{t("fieldMatter")}</span>
            <select
              value={dossierId}
              onChange={(e) => setDossierId(e.target.value)}
              className="h-[38px] w-full rounded-md border border-si-line bg-si-surface px-3 text-sm text-si-ink focus:border-si-verified focus:outline-none"
            >
              <option value="">{t("matterNone")}</option>
              {matters.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-si-muted">{t("fieldNote")}</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("notePlaceholder")}
              className="h-[38px] w-full rounded-md border border-si-line bg-si-surface px-3 text-sm text-si-ink focus:border-si-verified focus:outline-none"
            />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={submit}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "#1F3A2E" }}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" aria-hidden />}
            {t("submit")}
          </button>
          {error ? <span className="text-xs" style={{ color: TONE.err.fg }}>{error}</span> : null}
        </div>
      </div>

      {/* Historique */}
      <div className="rounded-2xl border border-si-line bg-si-surface">
        <div className="px-5 pt-4 pb-2">
          <h3 className="text-[15px] font-semibold text-si-ink">{t("historyTitle")}</h3>
        </div>
        {data.entries.length === 0 ? (
          <p className="px-5 pb-5 pt-2 text-sm text-si-muted/50">{t("historyEmpty")}</p>
        ) : (
          <ul className="px-2 pb-2">
            {data.entries.map((e) => {
              const tone = TONE[toneFor(e.status)];
              return (
                <li key={e.id} className="flex items-center gap-3 border-t border-si-line px-3 py-3 first:border-t-0">
                  <span className="w-24 shrink-0 text-sm font-medium text-si-ink">{fmtDate(e.date)}</span>
                  <span className="w-16 shrink-0 text-sm tabular-nums text-si-ink">{e.hours} h</span>
                  <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                    style={{ backgroundColor: tone.bg, color: tone.fg }}
                  >
                    <StatusIcon status={e.status} />
                    {statusLabel(e.status)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-si-muted">
                    {e.dossierLabel ? <span className="text-si-muted">{e.dossierLabel}</span> : null}
                    {e.dossierLabel && e.note ? " · " : ""}
                    {e.note ?? ""}
                    {e.status === "rejected" && e.rejectionReason ? (
                      <span style={{ color: TONE.err.fg }}> · {t("rejectedReason")}: {e.rejectionReason}</span>
                    ) : null}
                  </span>
                  {e.status === "submitted" ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => withdraw(e.id)}
                      title={t("withdraw")}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-si-line px-2.5 py-1.5 text-xs font-semibold text-si-muted hover:text-si-ink disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden /> {t("withdraw")}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  tone,
  label,
  value,
  hint,
}: {
  tone: keyof typeof TONE;
  label: string;
  value: string;
  hint: string;
}) {
  const c = TONE[tone];
  return (
    <div className="rounded-xl border border-si-line bg-si-surface p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: c.fg }}>
        {label}
      </div>
      <div className="mt-1 text-xl font-bold text-si-ink tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11px] text-si-muted/50">{hint}</div>
    </div>
  );
}
