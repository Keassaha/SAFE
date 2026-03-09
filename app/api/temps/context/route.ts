import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DEFAULT_ROUNDING_MINUTES } from "@/lib/constants";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  if (!cabinetId) {
    return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 403 });
  }

  const [cabinet, clients, dossiers, users] = await Promise.all([
    prisma.cabinet.findUnique({
      where: { id: cabinetId },
      select: { config: true },
    }),
    prisma.client.findMany({
      where: { cabinetId },
      select: { id: true, raisonSociale: true },
      orderBy: { raisonSociale: "asc" },
    }),
    prisma.dossier.findMany({
      where: { cabinetId, statut: "actif" },
      select: {
        id: true,
        intitule: true,
        numeroDossier: true,
        reference: true,
        clientId: true,
        client: { select: { raisonSociale: true } },
      },
      orderBy: { intitule: "asc" },
    }),
    prisma.user.findMany({
      where: { cabinetId },
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    }),
  ]);

  let roundingMinutes = DEFAULT_ROUNDING_MINUTES;
  if (cabinet?.config) {
    try {
      const config = JSON.parse(cabinet.config) as { roundingMinutes?: number };
      if (typeof config.roundingMinutes === "number" && [6, 15, 30].includes(config.roundingMinutes)) {
        roundingMinutes = config.roundingMinutes;
      }
    } catch {
      // garder la valeur par défaut
    }
  }

  return NextResponse.json({ clients, dossiers, users, roundingMinutes });
}
