import { notFound } from "next/navigation";
import Link from "next/link";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { routes } from "@/lib/routes";
import { PageHeader } from "@/components/ui/PageHeader";
import { canViewEmployees, canEditEmployees, canManagePayroll } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { RoleBadge } from "@/components/employees/RoleBadge";
import { EmployeeProfile } from "@/components/employees/EmployeeProfile";
import type { EmployeeProfileData } from "@/components/employees/EmployeeProfile";
import type { PayslipRow } from "@/components/employees/EmployeePayrollTab";
import type { ActivityRow } from "@/components/employees/EmployeeActivityTab";
import { getLocale, getTranslations } from "next-intl/server";
import { normalizeAppLocale } from "@/lib/i18n/locale";
import {
  getPendingHoursForEmployee,
  getApprovedUnbilledHours,
} from "@/lib/payroll/employee-hours-service";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ "employee-id": string }>;
}) {
  const { "employee-id": employeeId } = await params;
  const { cabinetId, role } = await requireCabinetAndUser();
  const userRole = role as UserRole;

  if (!canViewEmployees(userRole)) {
    notFound();
  }

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, cabinetId },
    include: {
      supervisor: { select: { fullName: true } },
    },
  });

  if (!employee) notFound();

  const canPayrollEarly = canManagePayroll(userRole);
  const [payslips, activities, supervisors, pendingHours, approvedUnbilled] = await Promise.all([
    prisma.payslip.findMany({
      where: { employeeId },
      include: { period: true },
      orderBy: { period: { periodStart: "desc" } },
      take: 50,
    }),
    prisma.auditLog.findMany({
      where: { userId: employee.userId ?? undefined, cabinetId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.employee.findMany({
      where: { cabinetId, status: "active", id: { not: employeeId } },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    canPayrollEarly ? getPendingHoursForEmployee(cabinetId, employeeId) : Promise.resolve([]),
    canPayrollEarly ? getApprovedUnbilledHours(cabinetId, employeeId) : Promise.resolve([]),
  ]);

  const profileData: EmployeeProfileData = {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    fullName: employee.fullName,
    email: employee.email,
    phone: employee.phone,
    address: employee.address,
    hireDate: employee.hireDate,
    status: employee.status,
    role: employee.role,
    jobTitle: employee.jobTitle,
    hourlyRate: employee.hourlyRate,
    employmentType: employee.employmentType,
    sinMasked: employee.sinNumero
      ? `***-***-${employee.sinNumero.replace(/\D/g, "").slice(6)}`
      : null,
    supervisorId: employee.supervisorId,
    responsibilities: employee.responsibilities,
    supervisor: employee.supervisor,
    hasLoginAccess: Boolean(employee.userId),
  };

  const payslipRows: PayslipRow[] = payslips.map((p) => ({
    id: p.id,
    periodStart: p.period.periodStart,
    periodEnd: p.period.periodEnd,
    hoursWorked: p.hoursWorked,
    hourlyRate: p.hourlyRate,
    grossPay: p.grossPay,
    deductions: p.deductions,
    netPay: p.netPay,
    status: p.status,
    paymentDate: p.paymentDate,
  }));

  const activityRows: ActivityRow[] = activities.map((a) => ({
    id: a.id,
    entityType: a.entityType,
    entityId: a.entityId,
    action: a.action,
    performedAt: a.performedAt ?? a.createdAt,
    metadata: a.metadata,
  }));

  const canEdit = canEditEmployees(userRole);
  const canPayroll = canPayrollEarly;
  const locale = normalizeAppLocale(await getLocale());
  const t = await getTranslations("employees");

  const serializedPending = pendingHours.map((p) => ({
    id: p.id,
    date: p.date.toISOString(),
    hours: p.hours,
    note: p.note,
    dossierLabel: p.dossierLabel,
  }));

  const approvedSummary =
    approvedUnbilled.length > 0
      ? {
          count: approvedUnbilled.length,
          totalHours: Math.round(approvedUnbilled.reduce((s, e) => s + e.hours, 0) * 100) / 100,
          minDate: approvedUnbilled
            .reduce((min, e) => (e.date < min ? e.date : min), approvedUnbilled[0].date)
            .toISOString(),
          maxDate: approvedUnbilled
            .reduce((max, e) => (e.date > max ? e.date : max), approvedUnbilled[0].date)
            .toISOString(),
        }
      : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={employee.fullName}
        description={employee.jobTitle ?? undefined}
        backHref={routes.employees}
        backLabel={t("backToList")}
        breadcrumbs={[
          { label: t("title"), href: routes.employees },
          { label: employee.fullName },
        ]}
        action={
          <div className="flex items-center gap-3">
            <RoleBadge role={employee.role} />
            <span
              className={
                employee.status === "active"
                  ? "text-si-verified text-sm font-medium"
                  : "text-si-muted text-sm"
              }
            >
              {employee.status === "active" ? t("statusActiveLabel") : t("statusInactiveLabel")}
            </span>
          </div>
        }
      />

      <EmployeeProfile
        employee={profileData}
        canEdit={canEdit}
        canManagePayroll={canPayroll}
        supervisorOptions={supervisors}
        payslips={payslipRows}
        activities={activityRows}
        pendingHours={serializedPending}
        approvedSummary={approvedSummary}
        locale={locale}
      />
    </div>
  );
}
