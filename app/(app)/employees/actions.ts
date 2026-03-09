"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { EmployeeRole, EmployeeStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canEditEmployees } from "@/lib/auth/permissions";
import { employeeRoleToUserRole } from "@/lib/auth/rbac";
import { routes } from "@/lib/routes";

export type CreateEmployeeInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  hireDate: string;
  status: EmployeeStatus;
  role: EmployeeRole;
  jobTitle?: string;
  hourlyRate: number;
  supervisorId?: string;
  responsibilities?: string;
  enableLogin?: boolean;
  password?: string;
};

export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;

export async function createEmployee(input: CreateEmployeeInput) {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  const effectiveRole = role as Parameters<typeof canEditEmployees>[0];
  if (!canEditEmployees(effectiveRole)) {
    throw new Error("Non autorisé à créer un employé");
  }

  const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.employee.findFirst({
    where: { cabinetId, email },
  });
  if (existing) {
    throw new Error("Un employé avec cet email existe déjà dans ce cabinet.");
  }

  const wantsLogin = Boolean(input.enableLogin);
  const legacyRole = employeeRoleToUserRole(input.role);

  if (wantsLogin && !legacyRole) {
    throw new Error("Ce rôle d'employé ne peut pas encore se connecter dans la version actuelle.");
  }

  if (wantsLogin && (!input.password || input.password.length < 8)) {
    throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
  }

  if (wantsLogin) {
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });
    if (existingUser) {
      throw new Error("Un compte de connexion existe déjà avec cet email.");
    }
  }

  await prisma.$transaction(async (tx) => {
    let createdUserId: string | null = null;

    if (wantsLogin && legacyRole && input.password) {
      const passwordHash = await bcrypt.hash(input.password, 10);
      const createdUser = await tx.user.create({
        data: {
          cabinetId,
          email,
          passwordHash,
          nom: fullName,
          role: legacyRole,
        },
      });
      createdUserId = createdUser.id;
    }

    await tx.employee.create({
      data: {
        cabinetId,
        userId: createdUserId,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        fullName,
        email,
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
        hireDate: new Date(input.hireDate),
        status: input.status,
        role: input.role,
        jobTitle: input.jobTitle?.trim() || null,
        hourlyRate: Number(input.hourlyRate) || 0,
        supervisorId: input.supervisorId || null,
        responsibilities: input.responsibilities?.trim() || null,
      },
    });
  });

  revalidatePath("/employees");
  redirect(routes.employees);
}

export async function updateEmployee(employeeId: string, input: UpdateEmployeeInput) {
  const { cabinetId, role } = await requireCabinetAndUser();
  const effectiveRole = role as Parameters<typeof canEditEmployees>[0];
  if (!canEditEmployees(effectiveRole)) {
    throw new Error("Non autorisé à modifier cet employé");
  }

  const existing = await prisma.employee.findFirst({
    where: { id: employeeId, cabinetId },
  });
  if (!existing) {
    throw new Error("Employé introuvable");
  }

  if (existing.userId && input.role !== undefined && !employeeRoleToUserRole(input.role)) {
    throw new Error("Ce rôle n'est pas compatible avec un compte de connexion existant.");
  }

  const updates: Parameters<typeof prisma.employee.update>[0]["data"] = {};

  if (input.firstName !== undefined) updates.firstName = input.firstName.trim();
  if (input.lastName !== undefined) updates.lastName = input.lastName.trim();
  if (input.firstName !== undefined || input.lastName !== undefined) {
    updates.fullName = `${(input.firstName ?? existing.firstName).trim()} ${(input.lastName ?? existing.lastName).trim()}`.trim();
  }
  if (input.email !== undefined) updates.email = input.email.trim().toLowerCase();
  if (input.phone !== undefined) updates.phone = input.phone?.trim() || null;
  if (input.address !== undefined) updates.address = input.address?.trim() || null;
  if (input.hireDate !== undefined) updates.hireDate = new Date(input.hireDate);
  if (input.status !== undefined) updates.status = input.status;
  if (input.role !== undefined) updates.role = input.role;
  if (input.jobTitle !== undefined) updates.jobTitle = input.jobTitle?.trim() || null;
  if (input.hourlyRate !== undefined) updates.hourlyRate = Number(input.hourlyRate) ?? existing.hourlyRate;
  if (input.supervisorId !== undefined) updates.supervisorId = input.supervisorId || null;
  if (input.responsibilities !== undefined) updates.responsibilities = input.responsibilities?.trim() || null;

  await prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: { id: employeeId },
      data: updates,
    });

    if (existing.userId) {
      const nextFullName =
        updates.fullName ??
        `${(input.firstName ?? existing.firstName).trim()} ${(input.lastName ?? existing.lastName).trim()}`.trim();
      const nextRole = employeeRoleToUserRole((input.role ?? existing.role) as EmployeeRole);

      await tx.user.update({
        where: { id: existing.userId },
        data: {
          nom: nextFullName,
          ...(nextRole ? { role: nextRole } : {}),
        },
      });
    }
  });

  revalidatePath("/employees");
  revalidatePath(routes.employee(employeeId));
}

// ——— Payroll ———

/** Get Monday of week containing d (ISO week). */
function getWeekStart(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Get Sunday of same week. */
function getWeekEnd(weekStart: Date): Date {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export async function createPayrollPeriod(periodStart: Date, periodEnd: Date) {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canEditEmployees(role as Parameters<typeof canEditEmployees>[0])) {
    throw new Error("Non autorisé");
  }

  const start = new Date(periodStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(periodEnd);
  end.setHours(23, 59, 59, 999);

  const existing = await prisma.payrollPeriod.findFirst({
    where: { cabinetId, periodStart: start, periodEnd: end },
  });
  if (existing) return existing.id;

  const created = await prisma.payrollPeriod.create({
    data: {
      cabinetId,
      periodStart: start,
      periodEnd: end,
      frequency: "weekly",
      status: "draft",
    },
  });
  return created.id;
}

export async function generatePayslipForEmployee(
  employeeId: string,
  periodStart: string,
  periodEnd: string,
  hoursWorked: number
) {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canEditEmployees(role as Parameters<typeof canEditEmployees>[0])) {
    throw new Error("Non autorisé");
  }

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, cabinetId },
  });
  if (!employee) throw new Error("Employé introuvable");

  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const periodId = await createPayrollPeriod(start, end);

  const existing = await prisma.payslip.findFirst({
    where: { employeeId, payrollPeriodId: periodId },
  });

  const hours = Number(hoursWorked) || 0;
  const rate = employee.hourlyRate;
  const grossPay = hours * rate;
  const deductions = 0;
  const netPay = grossPay - deductions;

  if (existing) {
    await prisma.payslip.update({
      where: { id: existing.id },
      data: {
        hoursWorked: hours,
        hourlyRate: rate,
        grossPay,
        deductions,
        netPay,
      },
    });
  } else {
    await prisma.payslip.create({
      data: {
        employeeId,
        payrollPeriodId: periodId,
        hoursWorked: hours,
        hourlyRate: rate,
        grossPay,
        deductions,
        netPay,
        status: "draft",
      },
    });
  }

  revalidatePath(routes.employee(employeeId));
  revalidatePath("/employees");
}

export async function generatePayslipForCurrentWeek(employeeId: string) {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(weekStart);
  await generatePayslipForEmployee(
    employeeId,
    weekStart.toISOString().slice(0, 10),
    weekEnd.toISOString().slice(0, 10),
    0
  );
}

export async function updatePayslipStatus(
  payslipId: string,
  status: "draft" | "generated" | "paid",
  paymentDate?: string
) {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canEditEmployees(role as Parameters<typeof canEditEmployees>[0])) {
    throw new Error("Non autorisé");
  }

  const payslip = await prisma.payslip.findFirst({
    where: { id: payslipId },
    include: { employee: true },
  });
  if (!payslip || payslip.employee.cabinetId !== cabinetId) {
    throw new Error("Bulletin introuvable");
  }

  await prisma.payslip.update({
    where: { id: payslipId },
    data: {
      status,
      paymentDate: status === "paid" && paymentDate ? new Date(paymentDate) : payslip.paymentDate,
    },
  });

  revalidatePath(routes.employee(payslip.employeeId));
}

export async function addPayslipAdjustment(
  payslipId: string,
  type: "bonus" | "deduction" | "correction",
  amount: number,
  description?: string
) {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canEditEmployees(role as Parameters<typeof canEditEmployees>[0])) {
    throw new Error("Non autorisé");
  }

  const payslip = await prisma.payslip.findFirst({
    where: { id: payslipId },
    include: { employee: true },
  });
  if (!payslip || payslip.employee.cabinetId !== cabinetId) {
    throw new Error("Bulletin introuvable");
  }

  await prisma.payslipAdjustment.create({
    data: {
      payslipId,
      type,
      amount: Number(amount),
      description: description?.trim() || null,
    },
  });

  const adjustments = await prisma.payslipAdjustment.aggregate({
    where: { payslipId },
    _sum: { amount: true },
  });
  const delta = adjustments._sum.amount ?? 0;
  const newNet = payslip.netPay + (type === "deduction" ? -Math.abs(amount) : amount);

  await prisma.payslip.update({
    where: { id: payslipId },
    data: { netPay: newNet },
  });

  revalidatePath(routes.employee(payslip.employeeId));
}
