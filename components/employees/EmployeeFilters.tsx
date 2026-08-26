"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { EmployeeRole, EmployeeStatus } from "@prisma/client";
import { EMPLOYEE_ROLE_LABELS } from "@/lib/auth/rbac";
import { registreSelectClass } from "@/components/ui/registre";

const STATUS_OPTIONS: { value: EmployeeStatus; labelKey: string }[] = [
  { value: "active", labelKey: "statusActive" },
  { value: "inactive", labelKey: "statusInactive" },
];

const ROLE_OPTIONS: { value: EmployeeRole; label: string }[] = (
  Object.keys(EMPLOYEE_ROLE_LABELS) as EmployeeRole[]
).map((value) => ({ value, label: EMPLOYEE_ROLE_LABELS[value] }));

export function EmployeeFilters() {
  const t = useTranslations("employees");
  const searchParams = useSearchParams();
  const status = searchParams.get("status") as EmployeeStatus | null;
  const role = searchParams.get("role") as EmployeeRole | null;

  function buildUrl(updates: { status?: string | null; role?: string | null }) {
    const next = new URLSearchParams(searchParams.toString());
    if (updates.status !== undefined) {
      if (updates.status) next.set("status", updates.status);
      else next.delete("status");
    }
    if (updates.role !== undefined) {
      if (updates.role) next.set("role", updates.role);
      else next.delete("role");
    }
    next.delete("page");
    return `/employees?${next.toString()}`;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={status ?? ""}
        onChange={(e) => {
          const v = e.target.value as EmployeeStatus | "";
          window.location.href = buildUrl({ status: v || null });
        }}
        className={registreSelectClass}
        aria-label={t("filterByStatus")}
      >
        <option value="">{t("allStatuses")}</option>
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {t(o.labelKey)}
          </option>
        ))}
      </select>
      <select
        value={role ?? ""}
        onChange={(e) => {
          const v = e.target.value as EmployeeRole | "";
          window.location.href = buildUrl({ role: v || null });
        }}
        className={registreSelectClass}
        aria-label={t("filterByRole")}
      >
        <option value="">{t("allRoles")}</option>
        {ROLE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {(status || role) && (
        <Link
          href="/employees"
          className="text-sm font-medium text-si-ink-strong hover:underline"
        >
          {t("reset")}
        </Link>
      )}
    </div>
  );
}
