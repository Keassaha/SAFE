"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useFormatteurs } from "@/lib/i18n/formatteurs";
import { routes } from "@/lib/routes";
import type { SerializedPayView } from "@/lib/payroll/remuneration-service";
import {
  reviewClaimAction,
  reviewLegalAidHoursAction,
  savePlanAction,
  validateMonthlyPayAction,
} from "@/app/(app)/mes-heures/remuneration-actions";

/**
 * Côté avocate : approuver le relevé et les heures, valider la paie du mois,
 * tenir l'entente. Doctrine : docs/product/SPEC_REMUNERATION_AALIYAH.md
 */

type Subject = { code: string; label: string };

type PendingRow =
  | { kind: "claim"; id: string; label: string; detail: string; amount: number }
  | { kind: "hours"; id: string; label: string; detail: string; amount: number };

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-si-line px-5 py-3.5">
      <h2 className="text-[15px] font-semibold text-si-ink">{title}</h2>
      {hint ? <span className="text-xs text-si-muted">{hint}</span> : null}
    </div>
  );
}

export function ValidationPaiePanel({
  view,
  employeeId,
  subjects,
}: {
  view: SerializedPayView;
  employeeId: string;
  subjects: Subject[];
}) {
  const t = useTranslations("remuneration");
  const { formatCurrency, intlLocale } = useFormatteurs();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [refusing, setRefusing] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [editing, setEditing] = useState(!view.plan);

  const firstName = view.employee.firstName || view.employee.fullName;
  const monthName = new Intl.DateTimeFormat(intlLocale, { month: "long", timeZone: "UTC" }).format(
    new Date(view.month.start),
  );
  const fmtDay = (iso: string) =>
    new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso));

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

  const rate = view.plan?.legalAidHourlyRate ?? 0;
  const rows: PendingRow[] = [
    ...view.claims
      .filter((c) => c.status === "submitted")
      .map((c) => ({ kind: "claim" as const, id: c.id, label: c.dossierLabel, detail: t("kindClaim"), amount: c.amount })),
    ...view.hours
      .filter((h) => h.status === "submitted")
      .map((h) => ({
        kind: "hours" as const,
        id: h.id,
        label: h.dossierLabel,
        detail: `${t("kindHours")} · ${fmtDay(h.date)} · ${h.hours.toLocaleString(intlLocale)} h`,
        amount: Math.round(h.hours * rate * 100) / 100,
      })),
  ];
  const pendingTotal = rows.reduce((s, r) => s + r.amount, 0);

  function decide(row: PendingRow, decision: "approve" | "reject", why?: string) {
    const fn =
      row.kind === "claim"
        ? () => reviewClaimAction(row.id, decision, why)
        : () => reviewLegalAidHoursAction(row.id, decision, why);
    run(fn, () => {
      setRefusing(null);
      setReason("");
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-si-line bg-si-surface px-5 py-3.5">
        <p className="text-sm text-si-body">{t("espaceLinkBody", { name: firstName })}</p>
        <Link
          href={routes.employeeEspace(employeeId)}
          className="inline-flex h-9 items-center rounded-md border border-si-line bg-si-surface px-3 text-sm font-medium text-si-ink hover:border-si-ink/40"
        >
          {t("espaceLinkCta", { name: firstName })}
        </Link>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-si-danger/10 px-4 py-2 text-sm text-si-danger-ink">
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          {/* À approuver */}
          <Card>
            <SectionHeader
              title={t("toApproveTitle")}
              hint={rows.length > 0 ? t("toApproveHint", { count: rows.length, amount: formatCurrency(pendingTotal) }) : undefined}
            />
            {rows.length === 0 ? (
              <p className="px-5 py-6 text-sm text-si-muted">{t("toApproveEmpty")}</p>
            ) : (
              <ul className="text-sm">
                {rows.map((r) => (
                  <li key={`${r.kind}-${r.id}`} className="border-b border-si-line px-5 py-2.5 last:border-b-0">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_100px_auto]">
                      <span className="min-w-0">
                        <span className="block truncate text-si-ink">{r.label}</span>
                        <span className="block text-xs text-si-muted">{r.detail}</span>
                      </span>
                      <span className="text-right tabular-nums">{formatCurrency(r.amount)}</span>
                      <span className="col-span-2 flex justify-end gap-2 sm:col-span-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={pending}
                          onClick={() => {
                            setRefusing(`${r.kind}-${r.id}`);
                            setReason("");
                          }}
                        >
                          {r.kind === "claim" ? t("remove") : t("reject")}
                        </Button>
                        <Button type="button" size="sm" disabled={pending} onClick={() => decide(r, "approve")}>
                          {t("approve")}
                        </Button>
                      </span>
                    </div>
                    {refusing === `${r.kind}-${r.id}` ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <input
                          autoFocus
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder={t("reasonPlaceholder")}
                          className="h-9 min-w-0 flex-1 rounded-md border border-si-line bg-si-surface px-2 text-[13px]"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={pending || !reason.trim()}
                          onClick={() => decide(r, "reject", reason)}
                        >
                          {t("confirmRefusal")}
                        </Button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            {rows.length > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-si-line bg-si-canvas/60 px-5 py-3">
                <span className="text-xs text-si-muted">{t("reasonVisible", { name: firstName })}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    run(async () => {
                      for (const r of rows) {
                        if (r.kind === "claim") await reviewClaimAction(r.id, "approve");
                        else await reviewLegalAidHoursAction(r.id, "approve");
                      }
                    })
                  }
                >
                  {t("approveAll")}
                </Button>
              </div>
            ) : null}
          </Card>

          {/* Paie du mois */}
          {view.plan ? (
            <Card>
              <SectionHeader title={t("monthPayTitle", { month: monthName })} hint={t("paidOnShort", { date: fmtDay(view.month.paymentDate) })} />
              {view.month.previous ? (
                <p className="border-b border-si-line bg-si-canvas/60 px-5 py-2 text-xs text-si-muted">
                  {t("previousValidated", {
                    month: new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric", timeZone: "UTC" }).format(
                      new Date(view.month.previous.start),
                    ),
                    amount: formatCurrency(view.month.previous.gross),
                  })}
                </p>
              ) : null}
              <ul className="text-sm">
                {view.approved.lines.map((l) => (
                  <li key={l.kind} className="grid grid-cols-[1fr_auto] gap-3 border-b border-si-line px-5 py-2.5 sm:grid-cols-[1fr_200px_120px]">
                    <span className="text-si-ink">{t(`line_${l.kind}`)}</span>
                    <span className="hidden text-xs tabular-nums text-si-muted sm:block">
                      {l.kind === "salaire_fixe"
                        ? t("perAgreement")
                        : l.kind === "compensation_dossier"
                          ? t("claimsCount", { count: l.quantity })
                          : t("hoursTimesRate", { hours: l.quantity.toLocaleString(intlLocale), rate: formatCurrency(l.rate) })}
                    </span>
                    <span className="text-right tabular-nums">{formatCurrency(l.amount)}</span>
                  </li>
                ))}
                <li className="grid grid-cols-[1fr_auto] gap-3 bg-si-canvas/60 px-5 py-2.5 font-semibold sm:grid-cols-[1fr_200px_120px]">
                  <span>{t("gross")}</span>
                  <span className="hidden sm:block" />
                  <span className="text-right tabular-nums">{formatCurrency(view.approved.gross)}</span>
                </li>
              </ul>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-si-line px-5 py-3">
                <span className={`text-sm ${rows.length > 0 ? "text-si-amber-ink" : "text-si-muted"}`}>
                  {rows.length > 0
                    ? t("waitingLines", { count: rows.length })
                    : !view.month.canValidateNow
                      ? t("notYetOpen", { month: monthName })
                      : t("readyToValidate")}
                </span>
                <Button
                  type="button"
                  size="sm"
                  disabled={pending || rows.length > 0 || !view.month.canValidateNow}
                  onClick={() => run(() => validateMonthlyPayAction(employeeId, view.month.year, view.month.month))}
                >
                  {t("validatePay")}
                </Button>
              </div>
            </Card>
          ) : null}
        </div>

        {/* Entente */}
        <div>
          <Card>
            <SectionHeader
              title={t("planTitle")}
              hint={
                view.plan
                  ? t("planSince", {
                      date: new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "short", timeZone: "UTC" }).format(
                        new Date(view.plan.effectiveFrom),
                      ),
                    })
                  : undefined
              }
            />
            {editing ? (
              <PlanForm
                subjects={subjects}
                initial={view.plan}
                pending={pending}
                onCancel={view.plan ? () => setEditing(false) : undefined}
                onSave={(input) => run(() => savePlanAction(employeeId, input), () => setEditing(false))}
              />
            ) : view.plan ? (
              <>
                <ul className="text-sm">
                  <li className="flex justify-between border-b border-si-line px-5 py-2.5">
                    <span>{t("monthlySalary")}</span>
                    <span className="tabular-nums">{formatCurrency(view.plan.monthlySalary)}</span>
                  </li>
                  <li className="flex justify-between border-b border-si-line px-5 py-2.5">
                    <span>{t("legalAidRate")}</span>
                    <span className="tabular-nums">{t("perHour", { rate: formatCurrency(view.plan.legalAidHourlyRate) })}</span>
                  </li>
                </ul>
                <p className="border-b border-si-line px-5 pb-2 pt-3 text-xs font-medium text-si-muted">{t("gridTitle")}</p>
                <ul className="text-sm">
                  {subjects.map((s) => {
                    const isLegalAid = s.code === view.plan!.legalAidSubjectCode;
                    const amount = view.plan!.grid[s.code];
                    return (
                      <li key={s.code} className="grid grid-cols-[44px_1fr_auto] gap-2 border-b border-si-line px-5 py-2 last:border-b-0">
                        <span className="text-xs tabular-nums text-si-muted">{s.code}</span>
                        <span className="truncate">{s.label}</span>
                        <span className={`tabular-nums ${isLegalAid || !amount ? "text-xs text-si-muted" : ""}`}>
                          {isLegalAid ? t("byTheHour") : amount ? formatCurrency(amount) : t("notPaid")}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="flex items-center justify-between gap-3 border-t border-si-line bg-si-canvas/60 px-5 py-3">
                  <span className="text-xs text-si-muted">{t("planChangeNote")}</span>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(true)}>
                    {t("edit")}
                  </Button>
                </div>
              </>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}

function PlanForm({
  subjects,
  initial,
  pending,
  onSave,
  onCancel,
}: {
  subjects: Subject[];
  initial: SerializedPayView["plan"];
  pending: boolean;
  onSave: (input: { monthlySalary: number; legalAidHourlyRate: number; grid: Record<string, number> }) => void;
  onCancel?: () => void;
}) {
  const t = useTranslations("remuneration");
  const legalAid = initial?.legalAidSubjectCode ?? "LAO";
  const [salary, setSalary] = useState(initial ? String(initial.monthlySalary) : "");
  const [rate, setRate] = useState(initial ? String(initial.legalAidHourlyRate) : "");
  const [grid, setGrid] = useState<Record<string, string>>(
    Object.fromEntries(subjects.map((s) => [s.code, initial?.grid[s.code] ? String(initial.grid[s.code]) : ""])),
  );
  const num = (v: string) => Number(v.replace(",", ".").replace(/\s/g, "")) || 0;
  const field = "h-9 w-28 rounded-md border border-si-line bg-si-surface px-2 text-right text-[13px] tabular-nums";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          monthlySalary: num(salary),
          legalAidHourlyRate: num(rate),
          grid: Object.fromEntries(Object.entries(grid).map(([k, v]) => [k, num(v)])),
        });
      }}
      className="text-sm"
    >
      <label className="flex items-center justify-between gap-3 border-b border-si-line px-5 py-2">
        <span>{t("monthlySalary")}</span>
        <input inputMode="decimal" value={salary} onChange={(e) => setSalary(e.target.value)} className={field} />
      </label>
      <label className="flex items-center justify-between gap-3 border-b border-si-line px-5 py-2">
        <span>{t("legalAidRate")}</span>
        <input inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} className={field} />
      </label>
      <p className="border-b border-si-line px-5 pb-2 pt-3 text-xs font-medium text-si-muted">{t("gridTitle")}</p>
      {subjects.map((s) => (
        <label key={s.code} className="grid grid-cols-[44px_1fr_auto] items-center gap-2 border-b border-si-line px-5 py-1.5">
          <span className="text-xs tabular-nums text-si-muted">{s.code}</span>
          <span className="truncate">{s.label}</span>
          {s.code === legalAid ? (
            <span className="text-xs text-si-muted">{t("byTheHour")}</span>
          ) : (
            <input
              inputMode="decimal"
              value={grid[s.code] ?? ""}
              onChange={(e) => setGrid((g) => ({ ...g, [s.code]: e.target.value }))}
              className={field}
            />
          )}
        </label>
      ))}
      <div className="flex justify-end gap-2 bg-si-canvas/60 px-5 py-3">
        {onCancel ? (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            {t("cancel")}
          </Button>
        ) : null}
        <Button type="submit" size="sm" disabled={pending}>
          {t("savePlan")}
        </Button>
      </div>
    </form>
  );
}
