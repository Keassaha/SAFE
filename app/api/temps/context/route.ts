import { NextResponse } from "next/server";
import { refusSiRoleInsuffisant } from "@/lib/auth/api-guard";
import { canViewDossiers } from "@/lib/auth/permissions";
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
  const refus = refusSiRoleInsuffisant((session.user as { role?: string }).role, canViewDossiers);
  if (refus) return refus;

  const [cabinet, clients, dossiers, users] = await Promise.all([
    prisma.cabinet.findUnique({
      where: { id: cabinetId },
      select: { config: true },
    }),
    prisma.client.findMany({
      where: { cabinetId },
      // Personnes physiques : `raisonSociale` est null → on renvoie aussi
      // prenom/nom pour afficher un libellé exploitable côté UI.
      select: { id: true, typeClient: true, raisonSociale: true, prenom: true, nom: true },
      orderBy: [{ raisonSociale: "asc" }, { nom: "asc" }, { prenom: "asc" }],
    }),
    prisma.dossier.findMany({
      where: { cabinetId, statut: "actif" },
      select: {
        id: true,
        intitule: true,
        numeroDossier: true,
        reference: true,
        clientId: true,
        // Taux négocié au dossier : sert de pré-remplissage prioritaire dans la saisie de temps.
        tauxHoraire: true,
        client: { select: { typeClient: true, raisonSociale: true, prenom: true, nom: true } },
      },
      orderBy: { intitule: "asc" },
    }),
    prisma.user.findMany({
      where: { cabinetId },
      // defaultHourlyRate : taux de l'avocat, pré-rempli automatiquement à la saisie (modifiable).
      select: { id: true, nom: true, defaultHourlyRate: true },
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
