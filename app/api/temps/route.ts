import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  canManageTimeEntries,
  canCreateTimeEntry,
  canViewAllTimeEntries,
} from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/services/audit";
import { timeEntryCreateSchema } from "@/lib/validations/time-entry";
import { tempsQuerySchema } from "@/lib/validations/temps";
import { computeMontant } from "@/lib/temps/utils";
import type { Prisma, UserRole } from "@prisma/client";

function getSessionData() {
  return getServerSession(authOptions).then((session) => {
    if (!session?.user) return null;
    const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
    const userId = (session.user as { id?: string }).id;
    const role = (session.user as { role?: string }).role as UserRole;
    if (!cabinetId || !userId) return null;
    return { cabinetId, userId, role };
  });
}

export async function GET(request: Request) {
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { cabinetId, userId, role } = data;
  if (!canManageTimeEntries(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const raw = {
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    dossierId: searchParams.get("dossierId") ?? undefined,
    userId: searchParams.get("userId") ?? undefined,
    facturable: searchParams.get("facturable") ?? undefined,
    facture: searchParams.get("facture") ?? undefined,
    statut: searchParams.get("statut") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  };
  const parsed = tempsQuerySchema.safeParse(raw);
  const filters = parsed.success ? parsed.data : {};

  const where: Prisma.TimeEntryWhereInput = { cabinetId };

  if (!canViewAllTimeEntries(role)) {
    where.userId = userId;
  }
  if (filters.userId) where.userId = filters.userId;
  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) where.date.gte = filters.dateFrom;
    if (filters.dateTo) where.date.lte = filters.dateTo;
  }
  if (filters.dossierId) where.dossierId = filters.dossierId;
  if (filters.facturable !== undefined) where.facturable = filters.facturable;
  if (filters.statut) where.statut = filters.statut;
  // Facturé = uniquement quand la facture a été émise (envoyée), pas en brouillon
  if (filters.facture === true) {
    where.billingStatus = "BILLED";
  }
  if (filters.facture === false) {
    where.OR = [
      { billingStatus: null },
      { billingStatus: { not: "BILLED" } },
    ];
  }
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    const searchOr = [
      { description: { contains: q } },
      { dossier: { intitule: { contains: q } } },
      { client: { raisonSociale: { contains: q } } },
    ];
    if (where.OR && where.OR.length > 0) {
      where.AND = [{ OR: where.OR }, { OR: searchOr }];
      delete where.OR;
    } else {
      where.OR = searchOr;
    }
  }

  const baseWhereForCount = {
    cabinetId,
    ...(where.userId && { userId: where.userId }),
    ...(where.date && { date: where.date }),
    ...(where.dossierId !== undefined && { dossierId: where.dossierId }),
    ...(where.facturable !== undefined && { facturable: where.facturable }),
    ...(where.statut && { statut: where.statut }),
  };
  const searchAnd =
    filters.q?.trim() ?
      [
        {
          OR: [
            { description: { contains: filters.q.trim() } },
            { dossier: { intitule: { contains: filters.q.trim() } } },
            { client: { raisonSociale: { contains: filters.q.trim() } } },
          ],
        },
      ]
    : undefined;

  const [entries, active, archived] = await Promise.all([
    prisma.timeEntry.findMany({
      where: where as Prisma.TimeEntryWhereInput,
      orderBy: { date: "desc" },
      include: {
        dossier: {
          select: {
            id: true,
            intitule: true,
            numeroDossier: true,
            reference: true,
            client: { select: { raisonSociale: true } },
          },
        },
        client: {
          select: { id: true, raisonSociale: true },
        },
        user: { select: { id: true, nom: true } },
        invoiceLines: { select: { id: true } },
      },
    }),
    prisma.timeEntry.count({
      where: {
        ...baseWhereForCount,
        OR: [{ billingStatus: null }, { billingStatus: { not: "BILLED" } }],
        ...(searchAnd && { AND: searchAnd }),
      },
    }),
    prisma.timeEntry.count({
      where: {
        ...baseWhereForCount,
        billingStatus: "BILLED",
        ...(searchAnd && { AND: searchAnd }),
      },
    }),
  ]);

  return NextResponse.json({
    entries,
    activeCount: active,
    archivedCount: archived,
  });
}

export async function POST(request: Request) {
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { cabinetId, userId, role } = data;
  if (!canCreateTimeEntry(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }
  const parsed = timeEntryCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;
  const montant = computeMontant(input.dureeMinutes, input.tauxHoraire);

  const dossierId = input.dossierId ?? null;
  let clientId: string | null = input.clientId ?? null;
  if (dossierId && !clientId) {
    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId, cabinetId },
      select: { clientId: true },
    });
    if (dossier) clientId = dossier.clientId;
  }

  const entry = await prisma.timeEntry.create({
    data: {
      cabinetId,
      dossierId,
      clientId,
      userId: role === "avocat" ? userId : input.userId,
      date: input.date,
      dureeMinutes: input.dureeMinutes,
      description: input.description ?? null,
      typeActivite: input.typeActivite ?? null,
      facturable: input.facturable ?? true,
      statut: (input.statut as "brouillon" | "valide" | "facture") ?? "brouillon",
      tauxHoraire: input.tauxHoraire,
      montant,
    },
    include: {
      dossier: {
        select: {
          id: true,
          intitule: true,
          numeroDossier: true,
          reference: true,
          client: { select: { raisonSociale: true } },
        },
      },
      client: {
        select: { id: true, raisonSociale: true },
      },
      user: { select: { id: true, nom: true } },
      invoiceLines: { select: { id: true } },
    },
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "TimeEntry",
    entityId: entry.id,
    action: "create",
    metadata: {
      dossierId: entry.dossierId,
      userId: entry.userId,
      date: entry.date.toISOString(),
      dureeMinutes: entry.dureeMinutes,
      statut: entry.statut,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
