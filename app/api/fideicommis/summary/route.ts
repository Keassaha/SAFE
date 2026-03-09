import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canViewBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { getGlobalTrustBalance } from "@/lib/services/fideicommis";
import { prisma } from "@/lib/db";

/** KPIs pour le dashboard fidéicommis : solde total, dépôts/retraits du mois, nombre de dossiers avec provision. */
export async function GET() {
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

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [soldeTotal, depotsAgg, retraitsAgg, accountsWithBalance] = await Promise.all([
    getGlobalTrustBalance(cabinetId),
    prisma.trustTransaction.aggregate({
      where: {
        cabinetId,
        date: { gte: monthStart, lte: monthEnd },
        type: "deposit",
      },
      _sum: { amount: true },
    }),
    prisma.trustTransaction.aggregate({
      where: {
        cabinetId,
        date: { gte: monthStart, lte: monthEnd },
        type: "withdrawal",
      },
      _sum: { amount: true },
    }),
    prisma.trustAccount.count({
      where: { cabinetId, currentBalance: { gt: 0 } },
    }),
  ]);

  const depotsMois = depotsAgg._sum.amount ?? 0;
  const retraitsMois = Math.abs(retraitsAgg._sum.amount ?? 0);

  return NextResponse.json({
    soldeTotal,
    depotsMois,
    retraitsMois,
    nbDossiersAvecProvision: accountsWithBalance,
  });
}
