"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, X, Wallet, Loader2, CircleDashed } from "lucide-react";
import {
  approveHoursAction,
  rejectHoursAction,
  rollHoursIntoPayslipAction,
} from "@/app/(app)/mes-heures/actions";

export interface SerializedPendingHour {
  id: string;
  date: string; // ISO
  hours: number;
  note: string | null;
  dossierLabel: string | null;
}

export interface ApprovedSummary {
  count: number;
  totalHours: number;
  minDate: string; // ISO
  maxDate: string; // ISO
}

interface Props {
  employeeId: string;
  pending: SerializedPendingHour[];
  approved: ApprovedSummary | null;
  hourlyRate: number;
  locale?: "fr" | "en";
}

const ERR = { fg: "#8A3A2D", bg: "#F3D8D2" };
const WARN = { fg: "#8B6B1F", bg: "#F5E6C8" };
const BRAND = "#1F3A2E";

export function PendingHoursApproval({ employeeId, pending, approved, hourlyRate, locale = "en" }: Props) {
  const t = useTranslations("hoursAdmin");
  const router = useRouter();
  const [pendingTx, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat(locale === "en" ? "en-CA" : "fr-CA", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(new Date(iso));

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-CA", { style: "currency", currency: "CAD" }).format(n);

  function run(fn: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        setRejectingId(null);
        setReason("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : t("genericError"));
      }
    });
  }

  function confirmReject(id: string) {
    if (!reason.trim()) {
      setError(t("reasonRequired"));
      return;
    }
    run(() => rejectHoursAction(id, reason));
  }

  if (pending.length === 0 && !approved) return null;

  return (
    <div className="mb-4 rounded-2xl border border-si-line bg-si-surface">
      {/* En-tête + badge */}
      <div className="flex items-center gap-2 px-5 pt-4 pb-2">
        <CircleDashed className="h-4 w-4" style={{ color: WARN.fg }} aria-hidden />
        <h3 className="text-[15px] font-semibold text-si-ink">{t("title")}</h3>
        {pending.length > 0 ? (
          <span
            className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: WARN.bg, color: WARN.fg }}
          >
            {t("toApprove", { count: pending.length })}
          </span>
        ) : null}
      </div>

      {/* Liste à approuver */}
      {pending.length > 0 ? (
        <ul className="px-2">
          {pending.map((p) => (
            <li key={p.id} className="border-t border-si-line px-3 py-3 first:border-t-0">
              <div className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm font-medium text-si-ink">{fmtDate(p.date)}</span>
                <span className="w-16 shrink-0 text-sm tabular-nums text-si-ink">{p.hours} h</span>
                <span className="min-w-0 flex-1 truncate text-xs text-si-muted">
                  {p.dossierLabel ? <span className="text-si-muted">{p.dossierLabel}</span> : null}
                  {p.dossierLabel && p.note ? " · " : ""}
                  {p.note ?? ""}
                </span>
                <button
                  type="button"
                  disabled={pendingTx}
                  onClick={() => run(() => approveHoursAction(p.id))}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: BRAND }}
                >
                  <Check className="h-3.5 w-3.5" aria-hidden /> {t("approve")}
                </button>
                <button
                  type="button"
                  disabled={pendingTx}
                  onClick={() => { setRejectingId(rejectingId === p.id ? null : p.id); setReason(""); setError(null); }}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                  style={rejectingId === p.id ? { backgroundColor: ERR.bg, color: ERR.fg, borderColor: ERR.bg } : { borderColor: "#D4D4D8", color: "#71717A" }}
                >
                  <X className="h-3.5 w-3.5" aria-hidden /> {t("reject")}
                </button>
              </div>
              {rejectingId === p.id ? (
                <div className="mt-2 flex items-center gap-2 pl-24">
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t("reasonPlaceholder")}
                    className="h-[34px] flex-1 rounded-md border border-si-line bg-si-surface px-3 text-sm text-si-ink focus:border-si-verified focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={pendingTx}
                    onClick={() => confirmReject(p.id)}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: ERR.fg }}
                  >
                    {pendingTx ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {t("confirmReject")}
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {/* Génération de la paie depuis les heures approuvées */}
      {approved ? (
        <div className="m-4 mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-si-line bg-si-canvas px-4 py-3">
          <div className="text-sm text-si-ink">
            {t("approvedReady", {
              count: approved.count,
              hours: approved.totalHours,
              amount: fmtMoney(approved.totalHours * hourlyRate),
            })}
          </div>
          <button
            type="button"
            disabled={pendingTx}
            onClick={() =>
              run(() =>
                rollHoursIntoPayslipAction(
                  employeeId,
                  approved.minDate.slice(0, 10),
                  approved.maxDate.slice(0, 10),
                ),
              )
            }
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: BRAND }}
          >
            {pendingTx ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" aria-hidden />}
            {t("generateFromApproved")}
          </button>
        </div>
      ) : null}

      {error ? <p className="px-5 pb-4 text-xs" style={{ color: ERR.fg }}>{error}</p> : null}
    </div>
  );
}
