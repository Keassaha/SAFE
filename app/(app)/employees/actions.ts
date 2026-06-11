"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { EmployeeRole, EmployeeStatus, EmploymentType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/services/audit";
import { canEditEmployees } from "@/lib/auth/permissions";
import { employeeRoleToUserRole } from "@/lib/auth/rbac";
import { routes } from "@/lib/routes";
import { sanitizeInput } from "@/lib/utils/sanitize";

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

  const firstName = sanitizeInput(input.firstName.trim());
  const lastName = sanitizeInput(input.lastName.trim());
  const fullName = `${firstName} ${lastName}`.trim();
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

  const { employeeId, createdUserId } = await prisma.$transaction(async (tx) => {
    let createdUserId: string | null = null;

    if (wantsLogin && legacyRole && input.password) {
      const passwordHash = await bcrypt.hash(input.password, 12);
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

    const employee = await tx.employee.create({
      data: {
        cabinetId,
        userId: createdUserId,
        firstName,
        lastName,
        fullName,
        email,
        phone: input.phone?.trim() || null,
        address: input.address ? sanitizeInput(input.address.trim()) : null,
        hireDate: new Date(input.hireDate),
        status: input.status,
        role: input.role,
        jobTitle: input.jobTitle ? sanitizeInput(input.jobTitle.trim()) : null,
        hourlyRate: Number(input.hourlyRate) || 0,
        supervisorId: input.supervisorId || null,
        responsibilities: input.responsibilities ? sanitizeInput(input.responsibilities.trim()) : null,
      },
      select: { id: true },
    });
    return { employeeId: employee.id, createdUserId };
  });

  // P4 — traçabilité RH. Jamais de donnée sensible en clair (pas de NAS ici).
  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Employee",
    entityId: employeeId,
    action: "create",
    newValues: {
      fullName,
      email,
      role: input.role,
      status: input.status,
      hourlyRate: Number(input.hourlyRate) || 0,
      hasLogin: wantsLogin,
    },
  });
  if (createdUserId) {
    await createAuditLog({
      cabinetId,
      userId,
      entityType: "User",
      entityId: createdUserId,
      action: "create",
      metadata: { email, role: legacyRole, linkedEmployeeId: employeeId },
    });
  }

  revalidatePath("/employees");
  redirect(routes.employees);
}

export async function updateEmployee(employeeId: string, input: UpdateEmployeeInput) {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
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

  // P4 — traçabilité : diff des champs sensibles (rôle, taux, statut, courriel).
  const changed: Record<string, { from: unknown; to: unknown }> = {};
  if (input.role !== undefined && input.role !== existing.role) {
    changed.role = { from: existing.role, to: input.role };
  }
  if (input.hourlyRate !== undefined && Number(input.hourlyRate) !== existing.hourlyRate) {
    changed.hourlyRate = { from: existing.hourlyRate, to: Number(input.hourlyRate) };
  }
  if (input.status !== undefined && input.status !== existing.status) {
    changed.status = { from: existing.status, to: input.status };
  }
  if (input.email !== undefined && input.email.trim().toLowerCase() !== existing.email) {
    changed.email = { from: existing.email, to: input.email.trim().toLowerCase() };
  }
  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Employee",
    entityId: employeeId,
    action: "update",
    metadata: { changedFields: Object.keys(changed) },
    oldValues: Object.fromEntries(Object.entries(changed).map(([k, v]) => [k, v.from])),
    newValues: Object.fromEntries(Object.entries(changed).map(([k, v]) => [k, v.to])),
  });

  revalidatePath("/employees");
  revalidatePath(routes.employee(employeeId));
}

/**
 * Met à jour le type d'emploi (T4/T4A) et le NAS de l'employé.
 * Réservé aux admins/avocats (canEditEmployees).
 */
export async function updateEmployeeYearEndInfo(
  employeeId: string,
  employmentType: EmploymentType,
  sinNumero: string | null,
) {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  const effectiveRole = role as Parameters<typeof canEditEmployees>[0];
  if (!canEditEmployees(effectiveRole)) {
    throw new Error("Non autorisé à modifier cet employé");
  }

  const existing = await prisma.employee.findFirst({ where: { id: employeeId, cabinetId } });
  if (!existing) throw new Error("Employé introuvable");

  // Normaliser + valider le NAS (9 chiffres, format XXX-XXX-XXX)
  let sanitizedSin: string | null = null;
  if (sinNumero) {
    const digits = sinNumero.replace(/\D/g, "");
    if (digits.length !== 9) throw new Error("Le NAS doit contenir exactement 9 chiffres.");
    sanitizedSin = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  await prisma.employee.update({
    where: { id: employeeId },
    data: { employmentType, sinNumero: sanitizedSin },
  });

  // P4 — traçabilité. SÉCURITÉ : on journalise la PRÉSENCE du NAS, jamais sa valeur.
  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Employee",
    entityId: employeeId,
    action: "update",
    metadata: { field: "year_end_info" },
    oldValues: {
      employmentType: existing.employmentType,
      sinPresent: Boolean(existing.sinNumero),
    },
    newValues: { employmentType, sinPresent: Boolean(sanitizedSin) },
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
  const { cabinetId, userId, role } = await requireCabinetAndUser();
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

  let payslipId: string;
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
    payslipId = existing.id;
  } else {
    const created = await prisma.payslip.create({
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
      select: { id: true },
    });
    payslipId = created.id;
  }

  // P4 — traçabilité paie (montants = estimation brute, cf. bandeau P1).
  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Payslip",
    entityId: payslipId,
    action: existing ? "update" : "create",
    metadata: { employeeId, hours, grossPay, netPay },
  });

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
  const { cabinetId, userId, role } = await requireCabinetAndUser();
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

  // P4 — traçabilité : changement de statut de bulletin (ex. marqué « payé »).
  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Payslip",
    entityId: payslipId,
    action: "update",
    metadata: { employeeId: payslip.employeeId },
    oldValues: { status: payslip.status },
    newValues: { status, paymentDate: status === "paid" ? paymentDate ?? null : null },
  });

  revalidatePath(routes.employee(payslip.employeeId));
}

export async function addPayslipAdjustment(
  payslipId: string,
  type: "bonus" | "deduction" | "correction",
  amount: number,
  description?: string
) {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
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

  // P4 — traçabilité : ajustement de paie (bonus / déduction / correction).
  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Payslip",
    entityId: payslipId,
    action: "update",
    metadata: { employeeId: payslip.employeeId, adjustmentType: type, amount: Number(amount) },
    oldValues: { netPay: payslip.netPay },
    newValues: { netPay: newNet },
  });

  revalidatePath(routes.employee(payslip.employeeId));
}
