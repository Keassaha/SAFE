import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageInvoices } from "@/lib/auth/permissions";
import { facturationHonorairesQuerySchema } from "@/lib/validations/facturation";
import { TPS_RATE, TVQ_RATE } from "@/lib/invoice-calculations";
import type { UserRole } from "@prisma/client";
import type { Prisma } from "@prisma/client";

function getSessionData() {
  return getServerSession(authOptions).then((session) => {
    if (!session?.user) return null;
    const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
    const role = (session.user as { role?: string }).role as UserRole;
    if (!cabinetId) return null;
    return { cabinetId, role };
  });
}

/** Filtre : fiches de temps éligibles (non facturées, facturables, pas déjà sur un brouillon).
 *  Inclut les entrées liées au client soit par clientId, soit par dossier (dossier.clientId). */
function buildHonorairesWhere(cabinetId: string, filters: {
  clientId?: string;
  dossierId?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  q?: string;
}) {
  const statusOr = [
    { statut: { in: ["brouillon", "valide"] as const } },
    { billingStatus: { in: ["NON_BILLED", "READY_TO_BILL"] as const } },
  ];
  const where: Record<string, unknown> = {
    cabinetId,
    facturable: true,
    invoiceId: null,
    // Statut éligible ET (clientId = X OU dossier du client X)
    ...(filters.clientId
      ? {
          AND: [
            { OR: statusOr },
            {
              OR: [
                { clientId: filters.clientId },
                { dossier: { clientId: filters.clientId } },
              ],
            },
          ],
        }
      : { OR: statusOr }),
    ...(filters.dossierId && { dossierId: filters.dossierId }),
    ...(filters.userId && { userId: filters.userId }),
    ...((filters.dateFrom || filters.dateTo) && {
      date: {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      },
    }),
  };
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.AND = [
      { OR: statusOr },
      {
        OR: [
          { description: { contains: q, mode: "insensitive" } },
          { client: { raisonSociale: { contains: q, mode: "insensitive" } } },
          { dossier: { client: { raisonSociale: { contains: q, mode: "insensitive" } } } },
        ],
      },
    ];
    delete where.OR;
  }
  return where as Prisma.TimeEntryWhereInput;
}

/** Filtre : débours éligibles à facturer */
function buildExpensesWhere(cabinetId: string, filters: {
  clientId?: string;
  matterId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  const where: {
    cabinetId: string;
    billingStatus: { in: ("NON_BILLED" | "READY_TO_BILL")[] };
    invoiceId: null;
    clientId?: string;
    matterId?: string | null;
    expenseDate?: { gte?: Date; lte?: Date };
  } = {
    cabinetId,
    billingStatus: { in: ["NON_BILLED", "READY_TO_BILL"] },
    invoiceId: null,
  };
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.matterId) where.matterId = filters.matterId;
  if (filters.dateFrom || filters.dateTo) {
    where.expenseDate = {};
    if (filters.dateFrom) where.expenseDate.gte = filters.dateFrom;
    if (filters.dateTo) where.expenseDate.lte = filters.dateTo;
  }
  return where;
}

export async function GET(request: Request) {
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { cabinetId, role } = data;
  if (!canManageInvoices(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const raw = {
    clientId: searchParams.get("clientId") ?? undefined,
    dossierId: searchParams.get("dossierId") ?? undefined,
    userId: searchParams.get("userId") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  };
  const parsed = facturationHonorairesQuerySchema.safeParse(raw);
  const filters = parsed.success ? parsed.data : {};

  const where = buildHonorairesWhere(cabinetId, filters);
  const expenseWhere = buildExpensesWhere(cabinetId, {
    clientId: filters.clientId,
    matterId: filters.dossierId,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });

  const [entries, expenses] = await Promise.all([
    prisma.timeEntry.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        client: { select: { id: true, raisonSociale: true } },
        dossier: {
          select: {
            id: true,
            intitule: true,
            numeroDossier: true,
            clientId: true,
            client: { select: { id: true, raisonSociale: true } },
          },
        },
        user: { select: { id: true, nom: true } },
      },
    }),
    prisma.expense.findMany({
      where: expenseWhere,
      orderBy: { expenseDate: "desc" },
      include: { client: { select: { id: true, raisonSociale: true } } },
    }),
  ]);

  // Détail par client : entrées + débours
  if (filters.clientId) {
    const clientName =
      entries[0]?.client?.raisonSociale ??
      entries[0]?.dossier?.client?.raisonSociale ??
      expenses[0]?.client?.raisonSociale ??
      null;
    return NextResponse.json({
      clientId: filters.clientId,
      clientName,
      entries: entries.map((e) => ({
        id: e.id,
        kind: "time" as const,
        date: e.date,
        description: e.description,
        dureeMinutes: e.dureeMinutes,
        tauxHoraire: e.tauxHoraire,
        montant: e.montant,
        userId: e.userId,
        userNom: e.user.nom,
        dossierId: e.dossierId,
        dossierIntitule: e.dossier?.intitule ?? null,
        taxable: e.taxable ?? true,
      })),
      expenses: expenses.map((exp) => ({
        id: exp.id,
        kind: "expense" as const,
        date: exp.expenseDate,
        description: exp.description,
        vendorName: exp.vendorName,
        amount: exp.amount,
        taxable: exp.taxable,
        dossierId: exp.matterId,
      })),
    });
  }

  // Agrégation par client (time entries + expenses)
  const byClient = new Map<
    string,
    {
      clientId: string;
      clientName: string;
      count: number;
      totalHeures: number;
      totalHonoraires: number;
      totalDebours: number;
      lastDate: Date;
      timeEntryIds: string[];
      expenseIds: string[];
    }
  >();

  for (const e of entries) {
    // Client dérivé de la fiche ou du dossier pour que toutes les heures soient dans "honoraires à facturer"
    const effectiveClientId = e.clientId ?? e.dossier?.clientId ?? undefined;
    const effectiveClientName =
      e.client?.raisonSociale ?? e.dossier?.client?.raisonSociale ?? undefined;
    if (!effectiveClientId || !effectiveClientName) continue;
    const existing = byClient.get(effectiveClientId);
    const totalHeures = e.dureeMinutes / 60;
    const totalHonoraires = e.feeAmount ?? e.montant;
    if (!existing) {
      byClient.set(effectiveClientId, {
        clientId: effectiveClientId,
        clientName: effectiveClientName,
        count: 1,
        totalHeures,
        totalHonoraires,
        totalDebours: 0,
        lastDate: e.date,
        timeEntryIds: [e.id],
        expenseIds: [],
      });
    } else {
      existing.count += 1;
      existing.totalHeures += totalHeures;
      existing.totalHonoraires += totalHonoraires;
      existing.timeEntryIds.push(e.id);
      if (e.date > existing.lastDate) existing.lastDate = e.date;
    }
  }

  for (const exp of expenses) {
    const existing = byClient.get(exp.clientId);
    if (!existing) {
      byClient.set(exp.clientId, {
        clientId: exp.clientId,
        clientName: exp.client.raisonSociale,
        count: 0,
        totalHeures: 0,
        totalHonoraires: 0,
        totalDebours: exp.amount,
        lastDate: exp.expenseDate,
        timeEntryIds: [],
        expenseIds: [exp.id],
      });
    } else {
      existing.totalDebours += exp.amount;
      existing.expenseIds.push(exp.id);
      if (exp.expenseDate > existing.lastDate) existing.lastDate = exp.expenseDate;
    }
  }

  const rows = Array.from(byClient.values()).map((row) => {
    const subtotalTaxable = row.totalHonoraires + row.totalDebours;
    const tps = Math.round(subtotalTaxable * TPS_RATE * 100) / 100;
    const tvq = Math.round(subtotalTaxable * TVQ_RATE * 100) / 100;
    const taxesEstimees = tps + tvq;
    const totalAFacturer = row.totalHonoraires + row.totalDebours + taxesEstimees;
    return {
      ...row,
      count: row.count + row.expenseIds.length,
      taxesEstimees,
      totalAFacturer: Math.round(totalAFacturer * 100) / 100,
    };
  });

  return NextResponse.json({ rows });
}
