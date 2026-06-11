"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, Pencil, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/Button";
import { RoleBadge } from "./RoleBadge";
import type { EmployeeRole } from "@prisma/client";
import type { EmployeeStatus } from "@prisma/client";
import type { EmployeeSortField, EmployeeSortOrder } from "@/lib/employees/query";
import type { EmployeeAccessState } from "@/lib/employees/access";

export type EmployeeRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: EmployeeRole;
  jobTitle: string | null;
  hourlyRate: number;
  status: EmployeeStatus;
  /** Accès au portail, calculé (compte lié / à configurer / sans accès / inactif). */
  access: EmployeeAccessState;
  hireDate: Date;
  updatedAt: Date;
};

const ACCESS_BADGE: Record<EmployeeAccessState, { labelKey: string; hintKey: string; className: string }> = {
  connected: {
    labelKey: "accessConnected",
    hintKey: "accessConnectedHint",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  pending: {
    labelKey: "accessPending",
    hintKey: "accessPendingHint",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  no_access: {
    labelKey: "accessNoAccess",
    hintKey: "accessNoAccessHint",
    className: "bg-neutral-100 text-neutral-500 border-neutral-200",
  },
  inactive: {
    labelKey: "accessInactive",
    hintKey: "accessInactiveHint",
    className: "bg-neutral-50 text-neutral-400 border-neutral-200",
  },
};

interface EmployeeTableProps {
  employees: EmployeeRow[];
  canEdit: boolean;
  sortBy?: EmployeeSortField;
  sortOrder?: EmployeeSortOrder;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(d));
}

function SortHeader({
  label,
  field,
  currentSortBy,
  currentSortOrder,
  getSortUrl,
}: {
  label: string;
  field: EmployeeSortField;
  currentSortBy: EmployeeSortField;
  currentSortOrder: EmployeeSortOrder;
  getSortUrl: (sortBy: EmployeeSortField, sortOrder: EmployeeSortOrder) => string;
}) {
  const isActive = currentSortBy === field;
  const nextOrder = isActive && currentSortOrder === "asc" ? "desc" : "asc";
  const Icon = isActive ? (currentSortOrder === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <Link
      href={getSortUrl(field, isActive ? nextOrder : "asc")}
      className="inline-flex items-center gap-1 text-xs font-medium text-neutral-muted uppercase tracking-wider hover:text-primary-700"
    >
      {label}
      <Icon className="w-3.5 h-3.5" />
    </Link>
  );
}

export function EmployeeTable({
  employees,
  canEdit,
  sortBy = "fullName",
  sortOrder = "asc",
}: EmployeeTableProps) {
  const t = useTranslations("employees");
  const tc = useTranslations("common");
  const searchParams = useSearchParams();

  function getSortUrl(sortByField: EmployeeSortField, order: EmployeeSortOrder) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("sortBy", sortByField);
    next.set("sortOrder", order);
    return `/employees?${next.toString()}`;
  }

  const statusLabel = (s: EmployeeStatus) => (s === "active" ? tc("active") : tc("inactive"));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" role="table">
        <thead>
          <tr className="border-b border-neutral-border bg-neutral-surface/50">
            <th className="px-4 py-3 font-medium safe-text-secondary">
              <SortHeader
                label={t("tableHeaderName")}
                field="fullName"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                getSortUrl={getSortUrl}
              />
            </th>
            <th className="px-4 py-3 font-medium safe-text-secondary">{t("tableHeaderEmail")}</th>
            <th className="px-4 py-3 font-medium safe-text-secondary">{t("tableHeaderTitle")}</th>
            <th className="px-4 py-3 font-medium safe-text-secondary">
              <SortHeader
                label={t("tableHeaderRole")}
                field="role"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                getSortUrl={getSortUrl}
              />
            </th>
            <th className="px-4 py-3 font-medium safe-text-secondary">
              <SortHeader
                label={t("tableHeaderHourlyRate")}
                field="hourlyRate"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                getSortUrl={getSortUrl}
              />
            </th>
            <th className="px-4 py-3 font-medium safe-text-secondary">
              <SortHeader
                label={t("tableHeaderStatus")}
                field="status"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                getSortUrl={getSortUrl}
              />
            </th>
            <th className="px-4 py-3 font-medium safe-text-secondary">{t("tableHeaderAccess")}</th>
            <th className="px-4 py-3 font-medium safe-text-secondary">
              <SortHeader
                label={t("tableHeaderHireDate")}
                field="hireDate"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                getSortUrl={getSortUrl}
              />
            </th>
            <th className="px-4 py-3 font-medium safe-text-secondary w-28">{t("tableHeaderActions")}</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((row) => (
            <tr
              key={row.id}
              className="border-b border-neutral-border hover:bg-neutral-surface/30 transition-colors"
            >
              <td className="px-4 py-3">
                <Link
                  href={routes.employee(row.id)}
                  className="font-medium text-primary-700 hover:underline"
                >
                  {row.fullName}
                </Link>
              </td>
              <td className="px-4 py-3 text-neutral-muted">{row.email}</td>
              <td className="px-4 py-3 text-neutral-muted">{row.jobTitle ?? "—"}</td>
              <td className="px-4 py-3">
                <RoleBadge role={row.role} />
              </td>
              <td className="px-4 py-3 tabular-nums">{formatCurrency(row.hourlyRate)}</td>
              <td className="px-4 py-3">
                <span
                  className={
                    row.status === "active"
                      ? "text-status-success font-medium"
                      : "text-neutral-muted"
                  }
                >
                  {statusLabel(row.status)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  title={t(ACCESS_BADGE[row.access].hintKey)}
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${ACCESS_BADGE[row.access].className}`}
                >
                  {t(ACCESS_BADGE[row.access].labelKey)}
                </span>
              </td>
              <td className="px-4 py-3 text-neutral-muted">{formatDate(row.hireDate)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Link href={routes.employee(row.id)}>
                    <Button variant="tertiary" type="button" className="!p-1.5">
                      <Eye className="w-4 h-4" aria-hidden />
                      <span className="sr-only">{tc("view")}</span>
                    </Button>
                  </Link>
                  {canEdit && (
                    <Link href={`${routes.employee(row.id)}?edit=1`}>
                      <Button variant="tertiary" type="button" className="!p-1.5">
                        <Pencil className="w-4 h-4" aria-hidden />
                        <span className="sr-only">{tc("edit")}</span>
                      </Button>
                    </Link>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
