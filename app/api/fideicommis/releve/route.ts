import { NextResponse } from "next/server";
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canViewBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { releveQuerySchema } from "@/lib/validations/fideicommis";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import { TrustStatementPDF } from "@/components/fideicommis/TrustStatementPDF";

/**
 * GET /api/fideicommis/releve?mois=1&annee=2025&clientId=&dossierId=&format=pdf
 * format=pdf → retourne application/pdf ; sinon JSON.
 */
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
  const parsed = releveQuerySchema.safeParse({
    mois: searchParams.get("mois") ?? undefined,
    annee: searchParams.get("annee") ?? undefined,
    clientId: searchParams.get("clientId") ?? undefined,
    dossierId: searchParams.get("dossierId") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides (mois, annee requis)", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { mois, annee, clientId, dossierId } = parsed.data;
  const periodStart = new Date(annee, mois - 1, 1);
  const periodEnd = new Date(annee, mois, 0, 23, 59, 59, 999);

  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { nom: true, adresse: true },
  });

  const where = {
    cabinetId,
    date: { gte: periodStart, lte: periodEnd },
    ...(clientId ? { clientId } : {}),
    ...(dossierId ? { dossierId } : {}),
  };

  const [transactions, sumBefore] = await Promise.all([
    prisma.trustTransaction.findMany({
      where,
      orderBy: { date: "asc" },
      include: {
        client: { select: { id: true, raisonSociale: true } },
        dossier: { select: { id: true, intitule: true, numeroDossier: true } },
      },
    }),
    prisma.trustTransaction.aggregate({
      where: {
        cabinetId,
        date: { lt: periodStart },
        ...(clientId ? { clientId } : {}),
        ...(dossierId ? { dossierId } : {}),
      },
      _sum: { amount: true },
    }),
  ]);

  const soldeDebut = sumBefore._sum.amount ?? 0;
  const totalDeposits = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const soldeFinal = soldeDebut + totalDeposits - totalWithdrawals;

  const wantPdf = searchParams.get("format") === "pdf";
  if (wantPdf) {
    let clientNom: string | null = transactions[0]?.client?.raisonSociale ?? null;
    let dossierIntitule: string | null = transactions[0]?.dossier?.intitule ?? null;
    if (clientId && !clientNom) {
      const c = await prisma.client.findFirst({
        where: { id: clientId, cabinetId },
        select: { raisonSociale: true },
      });
      clientNom = c?.raisonSociale ?? null;
    }
    if (dossierId && !dossierIntitule) {
      const d = await prisma.dossier.findFirst({
        where: { id: dossierId, cabinetId },
        select: { intitule: true },
      });
      dossierIntitule = d?.intitule ?? null;
    }
    const doc = React.createElement(TrustStatementPDF, {
      cabinetNom: cabinet?.nom ?? "",
      cabinetAdresse: cabinet?.adresse ?? null,
      mois,
      annee,
      clientNom,
      dossierIntitule,
      transactions: transactions.map((t) => ({
        date: t.date.toISOString(),
        amount: t.amount,
        type: t.type,
        description: t.description ?? t.note,
        reference: t.reference,
        balanceAfter: t.balanceAfter,
      })),
      totalDeposits,
      totalWithdrawals,
      soldeDebut,
      soldeFinal,
    });
    const buffer = await renderToBuffer(doc as React.ReactElement<DocumentProps>);
    const filename = `releve-fideicommis-${annee}-${String(mois).padStart(2, "0")}.pdf`;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  return NextResponse.json({
    cabinet: cabinet ?? { nom: "", adresse: null },
    periode: { mois, annee, debut: periodStart.toISOString(), fin: periodEnd.toISOString() },
    clientId: clientId ?? null,
    dossierId: dossierId ?? null,
    transactions,
    totalDeposits,
    totalWithdrawals,
    soldeDebut,
    soldeFinal,
  });
}
