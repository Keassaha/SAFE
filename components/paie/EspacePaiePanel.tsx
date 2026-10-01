"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, type StatusVariant } from "@/components/ui/StatusBadge";
import { useFormatteurs } from "@/lib/i18n/formatteurs";
import type { SerializedPayView } from "@/lib/payroll/remuneration-service";
import {
  submitClaimsAction,
  submitLegalAidHoursAction,
  withdrawClaimAction,
  withdrawLegalAidHoursAction,
} from "@/app/(app)/mes-heures/remuneration-actions";

/**
 * Espace de paie de l'employée : ce qu'elle va toucher, son relevé de dossiers,
 * ses heures d'aide juridique, ses bulletins.
 * Doctrine : docs/product/SPEC_REMUNERATION_AALIYAH.md
 */

type Status = SerializedPayView["claims"][number]["status"];

function statusBadge(status: Status, inPayslip: boolean): { variant: StatusVariant; key: string } {
  if (inPayslip || status === "paid") return { variant: "info", key: "statusInPayslip" };
  if (status === "approved") return { variant: "success", key: "statusApproved" };
  if (status === "rejected") return { variant: "error", key: "statusRejected" };
  return { variant: "warning", key: "statusPending" };
}

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-si-line px-5 py-3.5">
      <h2 className="text-[15px] font-semibold text-si-ink">{title}</h2>
      {hint ? <span className="text-xs text-si-muted">{hint}</span> : null}
    </div>
  );
}

export function EspacePaiePanel({
  view,
  employeeId,
  today,
}: {
  view: SerializedPayView;
  employeeId: string;
  today: string; // yyyy-mm-dd
}) {
  const t = useTranslations("remuneration");
  const { formatCurrency, intlLocale } = useFormatteurs();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [hoursForm, setHoursForm] = useState({ date: today, dossierId: "", hours: "", note: "" });

  const monthName = new Intl.DateTimeFormat(intlLocale, { month: "long", timeZone: "UTC" }).format(
    new Date(view.month.start),
  );
  const fmtDay = (iso: string) =>
    new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso));
  const fmtLong = (iso: string) =>
    new Intl.DateTimeFormat(intlLocale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
      new Date(iso),
    );
  const fmtMonth = (iso: string) =>
    new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso));

  const checkedTotal = useMemo(
    () => view.claimable.filter((d) => checked.has(d.id)).reduce((s, d) => s + d.amount, 0),
    [checked, view.claimable],
  );

  function run(fn: () => Promise<unknown>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        after?.();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : t("genericError"));
      }
    });
  }

  if (!view.plan) {
    return (
      <Card className="p-6">
        <h2 className="text-[15px] font-semibold text-si-ink">{t("noPlanTitle")}</h2>
        <p className="mt-1 text-sm text-si-muted">{t("noPlanBody")}</p>
      </Card>
    );
  }

  const plan = view.plan;
  const approvedGross = view.approved.gross;
  const projectedGross = view.projected.gross;
  const approvedShare = projectedGross > 0 ? Math.round((approvedGross / projectedGross) * 100) : 100;
  const openClaims = view.claims.filter((c) => !c.inPayslip && c.status !== "paid");
  const openHours = view.hours.filter((h) => !h.inPayslip && h.status !== "paid");
  const lineState = (kind: "compensation_dossier" | "heures_aide_juridique") => {
    const items = (kind === "compensation_dossier" ? openClaims : openHours).filter((i) => i.status !== "rejected");
    if (items.length === 0) return null;
    if (items.some((i) => i.status === "submitted")) return { variant: "warning" as const, key: "linePartial" };
    return { variant: "success" as const, key: "lineApproved" };
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-si-ink">{t("pageTitle", { month: monthName })}</h1>
        <p className="mt-1 text-sm text-si-muted">
          {t("paidOn", { date: fmtLong(view.month.paymentDate) })}
          {view.month.previous
            ? ` ${t("previousValidated", {
                month: fmtMonth(view.month.previous.start),
                amount: formatCurrency(view.month.previous.gross),
              })}`
            : null}
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-si-danger/10 px-4 py-2 text-sm text-si-danger-ink">
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          {/* Ce que je vais toucher */}
          <Card>
            <div className="px-5 pb-3 pt-5">
              <p className="text-[34px] font-semibold leading-none tracking-tight tabular-nums text-si-ink">
                {formatCurrency(projectedGross)}
              </p>
              <p className="mt-1.5 text-xs text-si-muted">{t("projectedLabel")}</p>
              <div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-si-surface2" aria-hidden>
                <div className="bg-si-verified" style={{ width: `${approvedShare}%` }} />
                <div className="bg-si-amber/60" style={{ width: `${100 - approvedShare}%` }} />
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-si-body">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-si-verified" />
                  {t("approvedAmount", { amount: formatCurrency(approvedGross) })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-si-amber/60" />
                  {t("pendingAmount", { amount: formatCurrency(view.pendingTotal) })}
                </span>
              </div>
            </div>
            <ul className="border-t border-si-line text-sm">
              <li className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-si-line px-5 py-2.5 sm:grid-cols-[1fr_180px_110px_110px]">
                <span className="text-si-ink">{t("lineSalary")}</span>
                <span className="hidden text-xs text-si-muted sm:block">{t("monthly")}</span>
                <span className="text-right tabular-nums">{formatCurrency(plan.monthlySalary)}</span>
                <span className="hidden sm:block">
                  <StatusBadge variant="neutral" label={t("automatic")} />
                </span>
              </li>
              <li className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-si-line px-5 py-2.5 sm:grid-cols-[1fr_180px_110px_110px]">
                <span className="text-si-ink">{t("lineClaims")}</span>
                <span className="hidden text-xs text-si-muted sm:block">
                  {t("claimsCount", { count: view.projected.lines[1].quantity })}
                </span>
                <span className="text-right tabular-nums">{formatCurrency(view.projected.lines[1].amount)}</span>
                <span className="hidden sm:block">
                  {(() => {
                    const st = lineState("compensation_dossier");
                    return st ? <StatusBadge variant={st.variant} label={t(st.key)} /> : null;
                  })()}
                </span>
              </li>
              <li className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-2.5 sm:grid-cols-[1fr_180px_110px_110px]">
                <span className="text-si-ink">{t("lineLegalAid")}</span>
                <span className="hidden text-xs tabular-nums text-si-muted sm:block">
                  {t("hoursTimesRate", {
                    hours: view.projected.legalAidHours.toLocaleString(intlLocale),
                    rate: formatCurrency(plan.legalAidHourlyRate),
                  })}
                </span>
                <span className="text-right tabular-nums">{formatCurrency(view.projected.lines[2].amount)}</span>
                <span className="hidden sm:block">
                  {(() => {
                    const st = lineState("heures_aide_juridique");
                    return st ? <StatusBadge variant={st.variant} label={t(st.key)} /> : null;
                  })()}
                </span>
              </li>
            </ul>
          </Card>

          {/* Relevé de dossiers */}
          <Card>
            <SectionHeader title={t("claimableTitle")} hint={t("claimableHint")} />
            {view.claimable.length === 0 ? (
              <p className="px-5 py-6 text-sm text-si-muted">{t("claimableEmpty")}</p>
            ) : (
              <ul className="max-h-[420px] overflow-y-auto text-sm">
                {view.claimable.map((d) => {
                  const on = checked.has(d.id);
                  return (
                    <li key={d.id} className="border-b border-si-line last:border-b-0">
                      <label className="grid cursor-pointer grid-cols-[20px_1fr_auto] items-center gap-3 px-5 py-2.5">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-si-line text-si-ink-strong focus:ring-si-ink-strong/30"
                          checked={on}
                          onChange={() =>
                            setChecked((prev) => {
                              const next = new Set(prev);
                              if (next.has(d.id)) next.delete(d.id);
                              else next.add(d.id);
                              return next;
                            })
                          }
                        />
                        <span className="min-w-0 truncate text-si-ink">
                          {d.label}
                          {d.closed ? <span className="ml-2 text-xs text-si-muted">{t("closed")}</span> : null}
                        </span>
                        <span className="tabular-nums text-si-ink">{formatCurrency(d.amount)}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-si-line bg-si-canvas/60 px-5 py-3">
              <span className="text-sm text-si-body">
                {t("checkedSummary", { count: checked.size })} ·{" "}
                <strong className="font-semibold tabular-nums text-si-ink">{formatCurrency(checkedTotal)}</strong>
              </span>
              <Button
                type="button"
                size="sm"
                disabled={pending || checked.size === 0}
                onClick={() => run(() => submitClaimsAction(employeeId, [...checked]), () => setChecked(new Set()))}
              >
                {t("sendClaims")}
              </Button>
            </div>
          </Card>

          {/* Heures d'aide juridique */}
          <Card>
            <SectionHeader title={t("hoursTitle")} hint={t("hoursHint")} />
            <form
              className="grid gap-2 border-b border-si-line bg-si-canvas/60 px-5 py-3 sm:grid-cols-[140px_minmax(0,1fr)_90px_auto]"
              onSubmit={(e) => {
                e.preventDefault();
                run(
                  () =>
                    submitLegalAidHoursAction(employeeId, {
                      date: hoursForm.date,
                      dossierId: hoursForm.dossierId,
                      hours: Number(hoursForm.hours.replace(",", ".")),
                      note: hoursForm.note || null,
                    }),
                  () => setHoursForm((f) => ({ ...f, hours: "", note: "" })),
                );
              }}
            >
              <input
                type="date"
                aria-label={t("date")}
                max={today}
                value={hoursForm.date}
                onChange={(e) => setHoursForm((f) => ({ ...f, date: e.target.value }))}
                className="h-9 rounded-md border border-si-line bg-si-surface px-2 text-[13px] text-si-ink"
              />
              <select
                aria-label={t("legalAidDossier")}
                value={hoursForm.dossierId}
                onChange={(e) => setHoursForm((f) => ({ ...f, dossierId: e.target.value }))}
                className="h-9 min-w-0 rounded-md border border-si-line bg-si-surface px-2 text-[13px] text-si-ink"
              >
                <option value="">{t("legalAidDossierPlaceholder")}</option>
                {view.legalAidDossiers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
              <input
                inputMode="decimal"
                aria-label={t("hours")}
                placeholder={t("hours")}
                value={hoursForm.hours}
                onChange={(e) => setHoursForm((f) => ({ ...f, hours: e.target.value }))}
                className="h-9 rounded-md border border-si-line bg-si-surface px-2 text-[13px] tabular-nums text-si-ink"
              />
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                disabled={pending || !hoursForm.dossierId || !hoursForm.hours}
              >
                {t("addHours")}
              </Button>
              <input
                aria-label={t("note")}
                placeholder={t("notePlaceholder")}
                value={hoursForm.note}
                onChange={(e) => setHoursForm((f) => ({ ...f, note: e.target.value }))}
                className="h-9 rounded-md border border-si-line bg-si-surface px-2 text-[13px] text-si-ink sm:col-span-4"
              />
            </form>
            {view.hours.length === 0 ? (
              <p className="px-5 py-6 text-sm text-si-muted">{t("hoursEmpty")}</p>
            ) : (
              <ul className="text-sm">
                {view.hours.slice(0, 30).map((h) => {
                  const b = statusBadge(h.status, h.inPayslip);
                  return (
                    <li
                      key={h.id}
                      className="grid grid-cols-[70px_minmax(0,1fr)_56px_auto] items-center gap-3 border-b border-si-line px-5 py-2.5 last:border-b-0"
                    >
                      <span className="text-xs tabular-nums text-si-muted">{fmtDay(h.date)}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-si-ink">{h.dossierLabel}</span>
                        {h.note ? <span className="block truncate text-xs text-si-muted">{h.note}</span> : null}
                        {h.rejectionReason ? (
                          <span className="block text-xs text-si-danger-ink">{h.rejectionReason}</span>
                        ) : null}
                      </span>
                      <span className="text-right tabular-nums">{h.hours.toLocaleString(intlLocale)} h</span>
                      <span className="flex items-center justify-end gap-2">
                        <StatusBadge variant={b.variant} label={t(b.key)} />
                        {h.status === "submitted" ? (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => run(() => withdrawLegalAidHoursAction(employeeId, h.id))}
                            className="text-xs text-si-muted underline underline-offset-2 hover:text-si-ink"
                          >
                            {t("withdraw")}
                          </button>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* Colonne droite */}
        <div className="space-y-5">
          <Card>
            <SectionHeader title={t("sentTitle")} />
            {openClaims.length === 0 ? (
              <p className="px-5 py-5 text-sm text-si-muted">{t("sentEmpty")}</p>
            ) : (
              <ul className="text-sm">
                {openClaims.map((c) => {
                  const b = statusBadge(c.status, c.inPayslip);
                  return (
                    <li key={c.id} className="border-b border-si-line px-5 py-2.5 last:border-b-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-si-ink">{c.dossierLabel}</span>
                        <span className="shrink-0 tabular-nums">{formatCurrency(c.amount)}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <StatusBadge variant={b.variant} label={t(b.key)} />
                        {c.status === "submitted" ? (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => run(() => withdrawClaimAction(employeeId, c.id))}
                            className="text-xs text-si-muted underline underline-offset-2 hover:text-si-ink"
                          >
                            {t("withdraw")}
                          </button>
                        ) : null}
                      </div>
                      {c.rejectionReason ? (
                        <p className="mt-1 text-xs text-si-danger-ink">{c.rejectionReason}</p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <SectionHeader title={t("payslipsTitle")} />
            {view.payslips.length === 0 ? (
              <p className="px-5 py-5 text-sm text-si-muted">{t("payslipsEmpty")}</p>
            ) : (
              <ul className="text-sm">
                {view.payslips.map((p) => (
                  <li key={p.id} className="border-b border-si-line last:border-b-0">
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-2.5">
                        <span className="capitalize text-si-ink">{fmtMonth(p.periodStart)}</span>
                        <span className="tabular-nums">{formatCurrency(p.grossPay)}</span>
                      </summary>
                      <ul className="bg-si-canvas/60 px-5 py-2 text-xs text-si-body">
                        {p.lines.map((l) => (
                          <li key={l.kind} className="flex justify-between py-0.5">
                            <span>{l.label}</span>
                            <span className="tabular-nums">{formatCurrency(l.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
