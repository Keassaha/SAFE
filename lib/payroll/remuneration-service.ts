import type { EmployeeHoursStatus, PayslipLineKind, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isValidHours } from "@/lib/payroll/employee-hours-service";

/**
 * Rémunération à trois sources : salaire fixe mensuel, compensation par dossier
 * terminé (grille fixée d'avance par sujet), heures sur les dossiers d'aide
 * juridique. Une seule paie par mois, dont le brut est la somme des trois lignes.
 * Doctrine : docs/product/SPEC_REMUNERATION_AALIYAH.md
 *
 * L'employée déclare (relevé de dossiers, heures LAO) ; l'avocate approuve, puis
 * valide la paie du mois. Une ligne approuvée ne se supprime jamais.
 */

type DBClient = Prisma.TransactionClient | typeof prisma;

// ——— Helpers purs (testables sans DB) ———

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Lit la grille JSON { "IMM": 150 } en ne gardant que les montants positifs. */
export function parseGrid(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, number> = {};
  for (const [code, value] of Object.entries(raw as Record<string, unknown>)) {
    const n = typeof value === "number" ? value : Number(value);
    if (code.trim() && Number.isFinite(n) && n > 0) out[code.trim().toUpperCase()] = round2(n);
  }
  return out;
}

export interface PlanRules {
  grid: Record<string, number>;
  legalAidSubjectCode: string;
}

/**
 * Montant de la grille pour un sujet. `null` quand le dossier ne se paie pas
 * par la grille : sujet d'aide juridique (payé à l'heure) ou sujet absent.
 * Règle « un dossier, une seule voie ».
 */
export function amountForSubject(plan: PlanRules, subjectCode: string | null | undefined): number | null {
  const code = subjectCode?.trim().toUpperCase();
  if (!code || code === plan.legalAidSubjectCode.toUpperCase()) return null;
  return plan.grid[code] ?? null;
}

export function isLegalAidSubject(plan: PlanRules, subjectCode: string | null | undefined): boolean {
  return !!subjectCode && subjectCode.trim().toUpperCase() === plan.legalAidSubjectCode.toUpperCase();
}

/** Bornes d'un mois civil en UTC : du 1er à 00:00 au dernier jour à 23:59:59.999. */
export function monthBounds(year: number, month1: number): { start: Date; end: Date; lastDay: Date } {
  const start = new Date(Date.UTC(year, month1 - 1, 1));
  const end = new Date(Date.UTC(year, month1, 1) - 1);
  const lastDay = new Date(Date.UTC(year, month1, 0, 12));
  return { start, end, lastDay };
}

export interface PayLine {
  kind: PayslipLineKind;
  label: string;
  quantity: number;
  rate: number;
  amount: number;
}

/** Les trois lignes du bulletin et leur somme. Une ligne à zéro reste affichée. */
export function computeMonthlyPay(input: {
  monthlySalary: number;
  legalAidHourlyRate: number;
  claimAmounts: number[];
  legalAidHours: number[];
}): { lines: PayLine[]; gross: number; legalAidHours: number } {
  const claimsTotal = round2(input.claimAmounts.reduce((s, a) => s + a, 0));
  const hours = round2(input.legalAidHours.reduce((s, h) => s + h, 0));
  const lines: PayLine[] = [
    { kind: "salaire_fixe", label: "Salaire fixe", quantity: 1, rate: round2(input.monthlySalary), amount: round2(input.monthlySalary) },
    {
      kind: "compensation_dossier",
      label: "Compensations dossiers",
      quantity: input.claimAmounts.length,
      rate: 0,
      amount: claimsTotal,
    },
    {
      kind: "heures_aide_juridique",
      label: "Aide juridique",
      quantity: hours,
      rate: round2(input.legalAidHourlyRate),
      amount: round2(hours * input.legalAidHourlyRate),
    },
  ];
  return { lines, gross: round2(lines.reduce((s, l) => s + l.amount, 0)), legalAidHours: hours };
}

/** Un dossier déjà déclaré (en attente, approuvé ou payé) ne se déclare plus. */
export function isClaimBlocking(status: EmployeeHoursStatus): boolean {
  return status !== "rejected";
}

// ——— Entente ———

export async function getActivePlan(cabinetId: string, employeeId: string, at: Date = new Date(), db: DBClient = prisma) {
  const plan = await db.employeeCompensationPlan.findFirst({
    where: { cabinetId, employeeId, effectiveFrom: { lte: at } },
    orderBy: { effectiveFrom: "desc" },
  });
  if (!plan) return null;
  return { ...plan, grid: parseGrid(plan.grid) };
}

export async function hasCompensationPlan(cabinetId: string, employeeId: string): Promise<boolean> {
  const n = await prisma.employeeCompensationPlan.count({ where: { cabinetId, employeeId } });
  return n > 0;
}

/** Nouvelle version de l'entente, en vigueur dès maintenant. L'ancienne reste. */
export async function savePlan(input: {
  cabinetId: string;
  employeeId: string;
  userId: string;
  monthlySalary: number;
  legalAidHourlyRate: number;
  grid: Record<string, number>;
  legalAidSubjectCode?: string;
}) {
  if (!Number.isFinite(input.monthlySalary) || input.monthlySalary < 0) throw new Error("Salaire mensuel invalide.");
  if (!Number.isFinite(input.legalAidHourlyRate) || input.legalAidHourlyRate < 0) throw new Error("Taux horaire invalide.");
  const employee = await prisma.employee.findFirst({ where: { id: input.employeeId, cabinetId: input.cabinetId }, select: { id: true } });
  if (!employee) throw new Error("Employée introuvable.");
  const legalAidSubjectCode = (input.legalAidSubjectCode ?? "LAO").toUpperCase();
  const grid = parseGrid(input.grid);
  delete grid[legalAidSubjectCode];
  return prisma.employeeCompensationPlan.create({
    data: {
      cabinetId: input.cabinetId,
      employeeId: input.employeeId,
      createdById: input.userId,
      monthlySalary: round2(input.monthlySalary),
      legalAidHourlyRate: round2(input.legalAidHourlyRate),
      legalAidSubjectCode,
      grid,
      effectiveFrom: new Date(),
    },
  });
}

// ——— Vue de la paie (employée et avocate) ———

function dossierLabel(d: { numeroDossier: string | null; intitule: string }) {
  return d.numeroDossier?.trim() ? `${d.numeroDossier} · ${d.intitule}` : d.intitule;
}

export async function getPayView(cabinetId: string, employeeId: string, today: Date) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, cabinetId },
    select: { id: true, fullName: true, firstName: true, status: true },
  });
  if (!employee) return null;

  const plan = await getActivePlan(cabinetId, employeeId);
  const currentYear = today.getUTCFullYear();
  const currentMonth = today.getUTCMonth() + 1;
  const current = monthBounds(currentYear, currentMonth);

  const [claims, hours, payslips, currentPayslip] = await Promise.all([
    prisma.employeeCompensationClaim.findMany({
      where: { cabinetId, employeeId },
      include: { dossier: { select: { numeroDossier: true, intitule: true } } },
      orderBy: { submittedAt: "desc" },
      take: 200,
    }),
    prisma.employeeHoursEntry.findMany({
      where: { cabinetId, employeeId },
      include: { dossier: { select: { numeroDossier: true, intitule: true, matterCode: true } } },
      orderBy: [{ date: "desc" }, { submittedAt: "desc" }],
      take: 200,
    }),
    prisma.payslip.findMany({
      where: { employeeId, period: { cabinetId, frequency: "monthly" } },
      include: { period: true, lines: { orderBy: { createdAt: "asc" } } },
      orderBy: { period: { periodStart: "desc" } },
      take: 24,
    }),
    prisma.payslip.findFirst({
      where: { employeeId, period: { cabinetId, frequency: "monthly", periodStart: current.start } },
      select: { id: true, grossPay: true },
    }),
  ]);

  // Une fois le mois courant validé, la paie en cours devient celle du mois
  // suivant : tout ce qui est approuvé désormais y entrera.
  const year = currentPayslip ? (currentMonth === 12 ? currentYear + 1 : currentYear) : currentYear;
  const month = currentPayslip ? (currentMonth === 12 ? 1 : currentMonth + 1) : currentMonth;
  const bounds = monthBounds(year, month);

  // Dossiers que l'employée peut déclarer : sujet présent dans la grille, jamais
  // l'aide juridique, et pas déjà déclarés.
  const blocked = new Set(claims.filter((c) => isClaimBlocking(c.status)).map((c) => c.dossierId));
  const gridCodes = plan ? Object.keys(plan.grid) : [];
  const [claimable, legalAidDossiers] = plan
    ? await Promise.all([
        prisma.dossier.findMany({
          where: { cabinetId, matterCode: { in: gridCodes }, statut: { not: "archive" } },
          select: { id: true, numeroDossier: true, intitule: true, matterCode: true, statut: true },
          orderBy: { updatedAt: "desc" },
          take: 150,
        }),
        prisma.dossier.findMany({
          where: { cabinetId, matterCode: plan.legalAidSubjectCode, statut: { not: "archive" } },
          select: { id: true, numeroDossier: true, intitule: true },
          orderBy: { updatedAt: "desc" },
          take: 150,
        }),
      ])
    : [[], []];

  const legalAidHours = plan ? hours.filter((h) => isLegalAidSubject(plan, h.dossier?.matterCode)) : [];

  // Ce qui entrera dans la prochaine paie : approuvé, pas encore rattaché.
  const approvedClaims = claims.filter((c) => c.status === "approved" && !c.payslipId);
  const approvedHours = legalAidHours.filter((h) => h.status === "approved" && !h.payslipId);
  const pendingClaims = claims.filter((c) => c.status === "submitted");
  const pendingHours = legalAidHours.filter((h) => h.status === "submitted");

  const approved = computeMonthlyPay({
    monthlySalary: plan?.monthlySalary ?? 0,
    legalAidHourlyRate: plan?.legalAidHourlyRate ?? 0,
    claimAmounts: approvedClaims.map((c) => c.amount),
    legalAidHours: approvedHours.map((h) => h.hours),
  });
  const pendingTotal = round2(
    pendingClaims.reduce((s, c) => s + c.amount, 0) +
      pendingHours.reduce((s, h) => s + h.hours, 0) * (plan?.legalAidHourlyRate ?? 0),
  );
  const projected = computeMonthlyPay({
    monthlySalary: plan?.monthlySalary ?? 0,
    legalAidHourlyRate: plan?.legalAidHourlyRate ?? 0,
    claimAmounts: [...approvedClaims, ...pendingClaims].map((c) => c.amount),
    legalAidHours: [...approvedHours, ...pendingHours].map((h) => h.hours),
  });

  return {
    employee,
    plan: plan
      ? {
          id: plan.id,
          monthlySalary: plan.monthlySalary,
          legalAidHourlyRate: plan.legalAidHourlyRate,
          legalAidSubjectCode: plan.legalAidSubjectCode,
          grid: plan.grid,
          effectiveFrom: plan.effectiveFrom,
        }
      : null,
    month: {
      year,
      month,
      start: bounds.start,
      paymentDate: bounds.lastDay,
      /** La paie de ce mois ne se valide qu'une fois le mois commencé. */
      canValidateNow: bounds.start <= today,
      previous: currentPayslip ? { start: current.start, gross: currentPayslip.grossPay } : null,
    },
    approved,
    projected,
    pendingTotal,
    pendingCount: pendingClaims.length + pendingHours.length,
    claimable: claimable
      .filter((d) => !blocked.has(d.id))
      .map((d) => ({
        id: d.id,
        label: dossierLabel(d),
        subjectCode: d.matterCode ?? "",
        amount: plan ? amountForSubject(plan, d.matterCode) ?? 0 : 0,
        closed: d.statut === "cloture",
      })),
    legalAidDossiers: legalAidDossiers.map((d) => ({ id: d.id, label: dossierLabel(d) })),
    claims: claims.map((c) => ({
      id: c.id,
      dossierLabel: dossierLabel(c.dossier),
      subjectCode: c.subjectCode,
      amount: c.amount,
      status: c.status,
      inPayslip: !!c.payslipId,
      rejectionReason: c.rejectionReason,
      submittedAt: c.submittedAt,
    })),
    hours: legalAidHours.map((h) => ({
      id: h.id,
      date: h.date,
      hours: h.hours,
      note: h.note,
      dossierLabel: h.dossier ? dossierLabel(h.dossier) : "",
      status: h.status,
      inPayslip: !!h.payslipId,
      rejectionReason: h.rejectionReason,
    })),
    payslips: payslips.map((p) => ({
      id: p.id,
      periodStart: p.period.periodStart,
      grossPay: p.grossPay,
      status: p.status,
      paymentDate: p.paymentDate,
      lines: p.lines.map((l) => ({ kind: l.kind, label: l.label, quantity: l.quantity, rate: l.rate, amount: l.amount })),
    })),
  };
}

export type PayView = NonNullable<Awaited<ReturnType<typeof getPayView>>>;

// ——— Déclarations de l'employée ———

/** Déclare des dossiers terminés. Le montant vient de la grille et se fige ici. */
export async function submitClaims(cabinetId: string, employeeId: string, dossierIds: string[]) {
  const ids = [...new Set(dossierIds)].filter(Boolean);
  if (ids.length === 0) throw new Error("Cochez au moins un dossier.");
  const plan = await getActivePlan(cabinetId, employeeId);
  if (!plan) throw new Error("Aucune entente de rémunération n'est en vigueur.");

  return prisma.$transaction(async (tx) => {
    const dossiers = await tx.dossier.findMany({
      where: { id: { in: ids }, cabinetId },
      select: { id: true, matterCode: true, intitule: true },
    });
    if (dossiers.length !== ids.length) throw new Error("Un des dossiers est introuvable.");
    const existing = await tx.employeeCompensationClaim.findMany({
      where: { cabinetId, employeeId, dossierId: { in: ids } },
      select: { dossierId: true, status: true },
    });
    const already = existing.find((c) => isClaimBlocking(c.status));
    if (already) throw new Error("Un des dossiers a déjà été déclaré.");

    const created = [];
    for (const d of dossiers) {
      const amount = amountForSubject(plan, d.matterCode);
      if (amount === null) {
        throw new Error(`Le dossier « ${d.intitule} » ne se paie pas par la grille.`);
      }
      created.push(
        await tx.employeeCompensationClaim.create({
          data: { cabinetId, employeeId, dossierId: d.id, subjectCode: d.matterCode ?? "", amount },
        }),
      );
    }
    return created;
  });
}

export async function withdrawClaim(cabinetId: string, employeeId: string, claimId: string) {
  const claim = await prisma.employeeCompensationClaim.findFirst({ where: { id: claimId, cabinetId, employeeId } });
  if (!claim) throw new Error("Déclaration introuvable.");
  if (claim.status !== "submitted") throw new Error("Une déclaration déjà traitée ne peut plus être retirée.");
  await prisma.employeeCompensationClaim.delete({ where: { id: claim.id } });
}

/** Heures sur un dossier d'aide juridique : le dossier est obligatoire et doit être LAO. */
export async function submitLegalAidHours(input: {
  cabinetId: string;
  employeeId: string;
  dossierId: string;
  date: Date;
  hours: number;
  note?: string | null;
}) {
  if (!isValidHours(input.hours)) throw new Error("Nombre d'heures invalide (entre 0 et 24).");
  const plan = await getActivePlan(input.cabinetId, input.employeeId);
  if (!plan) throw new Error("Aucune entente de rémunération n'est en vigueur.");
  const dossier = await prisma.dossier.findFirst({
    where: { id: input.dossierId, cabinetId: input.cabinetId },
    select: { matterCode: true },
  });
  if (!dossier) throw new Error("Choisissez un dossier d'aide juridique.");
  if (!isLegalAidSubject(plan, dossier.matterCode)) {
    throw new Error("Seuls les dossiers d'aide juridique se paient à l'heure.");
  }
  return prisma.employeeHoursEntry.create({
    data: {
      cabinetId: input.cabinetId,
      employeeId: input.employeeId,
      dossierId: input.dossierId,
      date: input.date,
      hours: round2(input.hours),
      note: input.note?.trim() || null,
      status: "submitted",
    },
  });
}

// ——— Approbation par l'avocate ———

export async function reviewClaim(
  cabinetId: string,
  reviewerUserId: string,
  claimId: string,
  decision: "approve" | "reject",
  reason?: string,
) {
  const claim = await prisma.employeeCompensationClaim.findFirst({ where: { id: claimId, cabinetId } });
  if (!claim) throw new Error("Déclaration introuvable.");
  if (claim.status !== "submitted") throw new Error("Cette déclaration a déjà été traitée.");
  if (decision === "reject" && !reason?.trim()) throw new Error("Indiquez le motif du retrait.");
  await prisma.employeeCompensationClaim.update({
    where: { id: claim.id },
    data: {
      status: decision === "approve" ? "approved" : "rejected",
      reviewedById: reviewerUserId,
      reviewedAt: new Date(),
      rejectionReason: decision === "reject" ? reason!.trim() : null,
    },
  });
  return claim.employeeId;
}

/**
 * Valide la paie du mois : crée la période mensuelle et le bulletin à trois
 * lignes, et y rattache tout ce qui est approuvé et pas encore payé. Refusée
 * tant qu'une ligne attend une décision, ou si le mois est déjà validé.
 */
export async function validateMonthlyPay(cabinetId: string, employeeId: string, year: number, month1: number) {
  const { start, end, lastDay } = monthBounds(year, month1);
  const plan = await getActivePlan(cabinetId, employeeId, end);
  if (!plan) throw new Error("Aucune entente de rémunération n'est en vigueur.");

  return prisma.$transaction(async (tx) => {
    const [pendingClaims, pendingHours] = await Promise.all([
      tx.employeeCompensationClaim.count({ where: { cabinetId, employeeId, status: "submitted" } }),
      tx.employeeHoursEntry.count({ where: { cabinetId, employeeId, status: "submitted", dossier: { matterCode: plan.legalAidSubjectCode } } }),
    ]);
    if (pendingClaims + pendingHours > 0) {
      throw new Error("Des lignes attendent encore votre approbation.");
    }

    let period = await tx.payrollPeriod.findFirst({
      where: { cabinetId, frequency: "monthly", periodStart: start, periodEnd: end },
    });
    period ??= await tx.payrollPeriod.create({
      data: { cabinetId, periodStart: start, periodEnd: end, frequency: "monthly", status: "draft" },
    });
    const existing = await tx.payslip.findFirst({ where: { employeeId, payrollPeriodId: period.id } });
    if (existing) throw new Error("La paie de ce mois est déjà validée.");

    const [claims, hours] = await Promise.all([
      tx.employeeCompensationClaim.findMany({
        where: { cabinetId, employeeId, status: "approved", payslipId: null },
        select: { id: true, amount: true },
      }),
      tx.employeeHoursEntry.findMany({
        where: { cabinetId, employeeId, status: "approved", payslipId: null, dossier: { matterCode: plan.legalAidSubjectCode } },
        select: { id: true, hours: true },
      }),
    ]);

    const pay = computeMonthlyPay({
      monthlySalary: plan.monthlySalary,
      legalAidHourlyRate: plan.legalAidHourlyRate,
      claimAmounts: claims.map((c) => c.amount),
      legalAidHours: hours.map((h) => h.hours),
    });

    const payslip = await tx.payslip.create({
      data: {
        employeeId,
        payrollPeriodId: period.id,
        hoursWorked: pay.legalAidHours,
        hourlyRate: plan.legalAidHourlyRate,
        grossPay: pay.gross,
        deductions: 0,
        netPay: pay.gross,
        status: "generated",
        paymentDate: lastDay,
        lines: { create: pay.lines },
      },
    });

    if (claims.length > 0) {
      await tx.employeeCompensationClaim.updateMany({
        where: { id: { in: claims.map((c) => c.id) } },
        data: { payslipId: payslip.id },
      });
    }
    if (hours.length > 0) {
      await tx.employeeHoursEntry.updateMany({
        where: { id: { in: hours.map((h) => h.id) } },
        data: { payslipId: payslip.id },
      });
    }
    return { payslipId: payslip.id, gross: pay.gross };
  });
}

// ——— Sérialisation pour les composants client ———

export function serializePayView(v: PayView) {
  return {
    ...v,
    plan: v.plan ? { ...v.plan, effectiveFrom: v.plan.effectiveFrom.toISOString() } : null,
    month: {
      ...v.month,
      start: v.month.start.toISOString(),
      paymentDate: v.month.paymentDate.toISOString(),
      previous: v.month.previous ? { ...v.month.previous, start: v.month.previous.start.toISOString() } : null,
    },
    claims: v.claims.map((c) => ({ ...c, submittedAt: c.submittedAt.toISOString() })),
    hours: v.hours.map((h) => ({ ...h, date: h.date.toISOString() })),
    payslips: v.payslips.map((p) => ({
      ...p,
      periodStart: p.periodStart.toISOString(),
      paymentDate: p.paymentDate ? p.paymentDate.toISOString() : null,
    })),
  };
}

export type SerializedPayView = ReturnType<typeof serializePayView>;

/** Sujets de dossier du cabinet (taxonomie), pour la grille de l'entente. */
export async function getCabinetSubjects(cabinetId: string, locale: string) {
  const { parseDossierTaxonomy, localizedLabel } = await import("@/lib/dossiers/taxonomy");
  const cabinet = await prisma.cabinet.findUnique({ where: { id: cabinetId }, select: { config: true } });
  let config: unknown = null;
  try {
    config = cabinet?.config ? JSON.parse(cabinet.config) : null;
  } catch {
    config = null;
  }
  const taxonomy = parseDossierTaxonomy(config);
  return (taxonomy?.subjects ?? []).map((s) => ({ code: s.code, label: localizedLabel(s, locale) }));
}
