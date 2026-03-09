import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canViewBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { transactionsQuerySchema } from "@/lib/validations/fideicommis";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const role = (session.user as { role?: string }).role as UserRole;
  if (!cabinetId) {
    return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 403 });
  }
  if (!canViewBillingTrust(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = transactionsQuerySchema.safeParse({
    clientId: searchParams.get("clientId") ?? undefined,
    dossierId: searchParams.get("dossierId") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { clientId, dossierId, dateFrom, dateTo, limit } = parsed.data;
  const dateFromDate = dateFrom ? new Date(dateFrom) : undefined;
  const dateToDate = dateTo ? new Date(dateTo) : undefined;

  const where = {
    cabinetId,
    ...(clientId ? { clientId } : {}),
    ...(dossierId ? { dossierId } : {}),
    ...(dateFromDate || dateToDate
      ? {
          date: {
            ...(dateFromDate ? { gte: dateFromDate } : {}),
            ...(dateToDate ? { lte: dateToDate } : {}),
          },
        }
      : {}),
  };

  const [transactions, total] = await Promise.all([
    prisma.trustTransaction.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
      include: {
        client: { select: { id: true, raisonSociale: true } },
        dossier: { select: { id: true, intitule: true, numeroDossier: true } },
      },
    }),
    prisma.trustTransaction.count({ where }),
  ]);

  return NextResponse.json({ transactions, total });
}
