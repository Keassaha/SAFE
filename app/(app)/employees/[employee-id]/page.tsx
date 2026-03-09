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
import { getTranslations } from "next-intl/server";

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

  const [payslips, activities, supervisors] = await Promise.all([
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
  const canPayroll = canManagePayroll(userRole);
  const t = await getTranslations("employees");

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
                  ? "text-status-success text-sm font-medium"
                  : "text-neutral-500 text-sm"
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
      />
    </div>
  );
}
