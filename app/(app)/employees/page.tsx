import Link from "next/link";
import type { UserRole } from "@prisma/client";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { prisma } from "@/lib/db";
import {
  buildEmployeeListWhere,
  getEmployeeListOrderBy,
  EMPLOYEE_LIST_PAGE_SIZE,
  type EmployeeSortField,
  type EmployeeSortOrder,
} from "@/lib/employees/query";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { canViewEmployees, canCreateEmployees, canEditEmployees } from "@/lib/auth/permissions";
import { EmployeeSummaryCards } from "@/components/employees/EmployeeSummaryCards";
import { EmployeeSearchBar } from "@/components/employees/EmployeeSearchBar";
import { EmployeeFilters } from "@/components/employees/EmployeeFilters";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { EmployeePagination } from "@/components/employees/EmployeePagination";
import type { EmployeeRow } from "@/components/employees/EmployeeTable";
import { getTranslations } from "next-intl/server";

const SORT_FIELDS: EmployeeSortField[] = [
  "fullName",
  "email",
  "role",
  "status",
  "hireDate",
  "hourlyRate",
  "updatedAt",
];

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    role?: string;
    page?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}) {
  const t = await getTranslations("employees");
  const { cabinetId, role } = await requireCabinetAndUser();
  const userRole = role as UserRole;

  if (!canViewEmployees(userRole)) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("accessDenied")} />
        <p className="text-neutral-muted">{t("noPermission")}</p>
      </div>
    );
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const sortBy: EmployeeSortField = SORT_FIELDS.includes(params.sortBy as EmployeeSortField)
    ? (params.sortBy as EmployeeSortField)
    : "fullName";
  const sortOrder: EmployeeSortOrder = params.sortOrder === "desc" ? "desc" : "asc";

  const where = buildEmployeeListWhere(cabinetId, {
    q: params.q ?? null,
    status: params.status ?? null,
    role: params.role ?? null,
  });
  const orderBy = getEmployeeListOrderBy(sortBy, sortOrder);

  const [employees, totalCount, stats, roleCount] = await Promise.all([
    prisma.employee.findMany({
      where,
      orderBy,
      skip: (page - 1) * EMPLOYEE_LIST_PAGE_SIZE,
      take: EMPLOYEE_LIST_PAGE_SIZE,
    }),
    prisma.employee.count({ where }),
    prisma.employee.groupBy({
      by: ["status"],
      where: { cabinetId },
      _count: true,
    }),
    prisma.employee.groupBy({
      by: ["role"],
      where: { cabinetId },
      _count: true,
    }),
  ]);

  const total = stats.reduce((s, g) => s + g._count, 0);
  const active = stats.find((g) => g.status === "active")?._count ?? 0;
  const inactive = stats.find((g) => g.status === "inactive")?._count ?? 0;

  const rows: EmployeeRow[] = employees.map((e) => ({
    id: e.id,
    fullName: e.fullName,
    email: e.email,
    phone: e.phone,
    role: e.role,
    jobTitle: e.jobTitle,
    hourlyRate: e.hourlyRate,
    status: e.status,
    hireDate: e.hireDate,
    updatedAt: e.updatedAt,
  }));

  const canCreate = canCreateEmployees(userRole);
  const canEdit = canEditEmployees(userRole);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t("managementTitle")}
        description={t("managementDesc")}
        action={
          canCreate && (
            <Link href={routes.employeeNouveau}>
              <Button>+ {t("newEmployee")}</Button>
            </Link>
          )
        }
      />

      <EmployeeSummaryCards
        total={total}
        active={active}
        inactive={inactive}
        byRoleCount={roleCount.length}
      />

      <Card>
        <CardHeader
          title={t("employeeList")}
          action={
            <div className="flex flex-wrap items-center gap-3">
              <EmployeeSearchBar />
              <EmployeeFilters />
            </div>
          }
        />
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <EmptyState
              title={t("noEmployees")}
              description={t("addEmployeeOrFilter")}
              action={
                canCreate ? (
                  <Link href={routes.employeeNouveau}>
                    <Button>{t("newEmployee")}</Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <>
              <EmployeeTable
                employees={rows}
                canEdit={canEdit}
                sortBy={sortBy}
                sortOrder={sortOrder}
              />
              <EmployeePagination
                totalCount={totalCount}
                currentPage={page}
                pageSize={EMPLOYEE_LIST_PAGE_SIZE}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
