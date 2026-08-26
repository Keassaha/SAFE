"use client";
import { useFormatteurs } from "@/lib/i18n/formatteurs";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, Pencil } from "lucide-react";
import { routes } from "@/lib/routes";
import { RowMenu, rowMenuItemClass } from "@/components/ui/RowMenu";
import {
  RegistrePlainHeader,
  RegistreSortHeader,
  registreCellMutedClass,
  registreHeadCellClass,
  registreHeadRowClass,
  registreLienClass,
  registreRowClass,
  rangeeOuvrable,
} from "@/components/ui/registre";
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
    className: "bg-si-amber/[0.13] text-si-amber-ink border-si-amber/30",
  },
  no_access: {
    labelKey: "accessNoAccess",
    hintKey: "accessNoAccessHint",
    className: "bg-si-canvas text-si-muted border-si-line",
  },
  inactive: {
    labelKey: "accessInactive",
    hintKey: "accessInactiveHint",
    className: "bg-si-canvas text-si-muted/50 border-si-line",
  },
};

interface EmployeeTableProps {
  employees: EmployeeRow[];
  canEdit: boolean;
  sortBy?: EmployeeSortField;
  sortOrder?: EmployeeSortOrder;
}

function formatDate(d: Date, intlLocale: string): string {
  return new Intl.DateTimeFormat(intlLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(d));
}

/** Menu d'actions d'une rangée d'employé. Même objet que clients et dossiers. */
function EmployeeRowMenu({
  employeeId,
  employeeName,
  canEdit,
}: {
  employeeId: string;
  employeeName: string;
  canEdit: boolean;
}) {
  const tc = useTranslations("common");

  return (
    <RowMenu label={tc("actions")} describedBy={employeeName}>
      <Link href={routes.employee(employeeId)} role="menuitem" className={rowMenuItemClass}>
        <Eye className="h-4 w-4 shrink-0 text-si-muted" aria-hidden />
        {tc("view")}
      </Link>
      {canEdit && (
        <Link
          href={`${routes.employee(employeeId)}?edit=1`}
          role="menuitem"
          className={rowMenuItemClass}
        >
          <Pencil className="h-4 w-4 shrink-0 text-si-muted" aria-hidden />
          {tc("edit")}
        </Link>
      )}
    </RowMenu>
  );
}

export function EmployeeTable({
  employees,
  canEdit,
  sortBy = "fullName",
  sortOrder = "asc",
}: EmployeeTableProps) {
  const { formatCurrency, intlLocale } = useFormatteurs();
  const t = useTranslations("employees");
  const tc = useTranslations("common");
  const searchParams = useSearchParams();
  const router = useRouter();

  function getSortUrl(sortByField: EmployeeSortField, order: EmployeeSortOrder) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("sortBy", sortByField);
    next.set("sortOrder", order);
    return `/employees?${next.toString()}`;
  }

  const statusLabel = (s: EmployeeStatus) => (s === "active" ? tc("active") : tc("inactive"));

  function accessBadge(row: EmployeeRow) {
    return (
      <span
        title={t(ACCESS_BADGE[row.access].hintKey)}
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${ACCESS_BADGE[row.access].className}`}
      >
        {t(ACCESS_BADGE[row.access].labelKey)}
      </span>
    );
  }

  return (
    <>
      {/* ── Vue mobile : la rangée devient une fiche empilée ── */}
      <div className="divide-y divide-si-line2 md:hidden">
        {employees.map((row) => (
          <Link
            key={row.id}
            href={routes.employee(row.id)}
            className="safe-zoom-rang block px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium leading-5 text-si-ink">
                  {row.fullName}
                </span>
                <span className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-[12px] leading-[17px] text-si-muted">
                  {row.jobTitle && (
                    <>
                      <span className="shrink-0">{row.jobTitle}</span>
                      <span className="text-si-subtle" aria-hidden>
                        ·
                      </span>
                    </>
                  )}
                  <span className="truncate">{row.email}</span>
                </span>
              </span>
              <RoleBadge role={row.role} />
            </div>
            <div className="mt-2 flex items-baseline gap-4 text-[12px] text-si-muted">
              <span className="font-mono tabular-nums text-si-ink">
                {formatCurrency(row.hourlyRate)}
              </span>
              {accessBadge(row)}
              <span className="ml-auto">{formatDate(row.hireDate, intlLocale)}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Vue bureau : registre ──
          Même grammaire que clients et dossiers : filets horizontaux seuls,
          en-têtes de 12 px, zoom souple comme unique marque de survol. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[980px] border-collapse" role="table">
          <thead>
            <tr className={registreHeadRowClass}>
              <th scope="col" className={registreHeadCellClass}>
                <RegistreSortHeader
                  label={t("tableHeaderName")}
                  field="fullName"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  getSortUrl={getSortUrl}
                />
              </th>
              <th scope="col" className={registreHeadCellClass}>
                <RegistrePlainHeader label={t("tableHeaderEmail")} />
              </th>
              <th scope="col" className={`w-[150px] ${registreHeadCellClass}`}>
                <RegistrePlainHeader label={t("tableHeaderTitle")} />
              </th>
              <th scope="col" className={`w-[128px] ${registreHeadCellClass}`}>
                <RegistreSortHeader
                  label={t("tableHeaderRole")}
                  field="role"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  getSortUrl={getSortUrl}
                />
              </th>
              <th scope="col" className={`w-[120px] ${registreHeadCellClass} text-right`}>
                <RegistreSortHeader
                  label={t("tableHeaderHourlyRate")}
                  field="hourlyRate"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  getSortUrl={getSortUrl}
                  align="right"
                />
              </th>
              <th scope="col" className={`w-[96px] ${registreHeadCellClass}`}>
                <RegistreSortHeader
                  label={t("tableHeaderStatus")}
                  field="status"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  getSortUrl={getSortUrl}
                />
              </th>
              <th scope="col" className={`w-[132px] ${registreHeadCellClass}`}>
                <RegistrePlainHeader label={t("tableHeaderAccess")} />
              </th>
              <th scope="col" className={`w-[128px] ${registreHeadCellClass} text-right`}>
                <RegistreSortHeader
                  label={t("tableHeaderHireDate")}
                  field="hireDate"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  getSortUrl={getSortUrl}
                  align="right"
                />
              </th>
              {/* Colonne de contrôle : jamais de libellé */}
              <th scope="col" className="w-[48px] px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {employees.map((row) => (
              <tr
                key={row.id}
                className={`${registreRowClass} cursor-pointer`}
                onClick={rangeeOuvrable(() => router.push(routes.employee(row.id)))}
              >
                <td className="max-w-0 px-3 py-2.5 align-middle">
                  <Link
                    href={routes.employee(row.id)}
                    className={registreLienClass}
                    title={row.fullName}
                  >
                    {row.fullName}
                  </Link>
                </td>
                <td className="max-w-0 px-3 py-2.5 align-middle">
                  <a
                    href={`mailto:${row.email}`}
                    className="block truncate text-[13px] text-si-muted underline-offset-2 transition-colors hover:text-si-ink hover:underline"
                    title={row.email}
                  >
                    {row.email}
                  </a>
                </td>
                <td className={registreCellMutedClass}>{row.jobTitle ?? "—"}</td>
                <td className="px-3 py-2.5 align-middle">
                  <RoleBadge role={row.role} />
                </td>
                <td className="px-3 py-2.5 text-right align-middle font-mono text-[13px] tabular-nums text-si-ink">
                  {formatCurrency(row.hourlyRate)}
                </td>
                <td className="px-3 py-2.5 align-middle text-[13px]">
                  <span
                    className={
                      row.status === "active"
                        ? "font-medium text-si-verified"
                        : "text-si-muted"
                    }
                  >
                    {statusLabel(row.status)}
                  </span>
                </td>
                <td className="px-3 py-2.5 align-middle">{accessBadge(row)}</td>
                <td className="px-3 py-2.5 text-right align-middle text-[12px] text-si-muted">
                  {formatDate(row.hireDate, intlLocale)}
                </td>
                <td className="px-3 py-2.5 text-right align-middle">
                  <EmployeeRowMenu
                    employeeId={row.id}
                    employeeName={row.fullName}
                    canEdit={canEdit}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
