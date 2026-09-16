import { richDocumentScope } from "@/lib/edition/access";
import { NextRequest, NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewDocuments } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { resoudreTauxHoraire } from "@/lib/temps/taux-horaire";
import { parseCabinetConfig, getTauxHoraireDefaut } from "@/lib/cabinet-config";

const TerminerSchema = z.object({
  sessionId: z.string().min(1),
  typeActivite: z.enum(["redaction", "revision", "consultation", "recherche", "autre"]),
  description: z.string().optional(),
  dureeMinutes: z.number().int().positive(),
  tauxHoraire: z.number().positive().optional(),
});

// POST /api/edition/documents/[id]/terminer
// Bouton "Terminé" → clôture la session + crée une TimeEntry automatiquement
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireCabinetAndUser();
  if (!canViewDocuments(session.role as UserRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = TerminerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { sessionId, typeActivite, description, dureeMinutes, tauxHoraire } = parsed.data;

  // Récupérer le document pour ses métadonnées
  const doc = await prisma.richDocument.findFirst({
    where: { id, ...richDocumentScope(session), isArchived: false },
    include: {
      dossier: { select: { tauxHoraire: true, modeFacturation: true } },
    },
  });
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  // Récupérer la session de travail
  const workSession = await prisma.workSession.findFirst({
    where: { id: sessionId, cabinetId: session.cabinetId, userId: session.userId, richDocumentId: id, dossierId: doc.dossierId, clientId: doc.clientId },
  });
  if (!workSession) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

  if (workSession.statut === "termine" || workSession.timeEntryId) {
    return NextResponse.json({ error: "Cette session a déjà été terminée." }, { status: 409 });
  }

  /* Le taux suivait ici sa propre règle, qui finissait par « 150 $ » écrit en
     dur : un cabinet à 300 $/h voyait ses heures de rédaction enregistrées à
     moitié prix, sans rien pour le signaler. Même cascade que partout
     ailleurs — dossier, avocat, cabinet — et ce que le client envoie prime,
     puisqu'il a pu le corriger à l'écran. */
  const [avocat, cabinet] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { defaultHourlyRate: true },
    }),
    prisma.cabinet.findUnique({
      where: { id: session.cabinetId },
      select: { config: true },
    }),
  ]);
  const taux =
    tauxHoraire ??
    resoudreTauxHoraire({
      dossier: doc.dossier.tauxHoraire,
      avocat: avocat?.defaultHourlyRate,
      cabinet: getTauxHoraireDefaut(parseCabinetConfig(cabinet?.config ?? null)),
    }).taux;
  const montant = (dureeMinutes / 60) * taux;
  const now = new Date();

  // Transaction : fermer session + créer TimeEntry
  const result = await prisma.$transaction(async (tx) => {
    // Réserver atomiquement la transition : deux clics ne créent pas deux fiches.
    const claimed = await tx.workSession.updateMany({
      where: { id: sessionId, cabinetId: session.cabinetId, userId: session.userId,
        richDocumentId: id, statut: { in: ["en_cours", "pause"] }, timeEntryId: null },
      data: { statut: "termine", endedAt: now },
    });
    if (claimed.count !== 1) return null;
    // 1. Créer la TimeEntry
    const timeEntry = await tx.timeEntry.create({
      data: {
        cabinetId: session.cabinetId,
        dossierId: doc.dossierId,
        clientId: doc.clientId,
        userId: session.userId,
        date: now,
        workDate: now,
        dureeMinutes,
        durationHours: dureeMinutes / 60,
        description: description || `Rédaction — ${doc.titre}`,
        typeActivite,
        facturable: true,
        tauxHoraire: taux,
        hourlyRate: taux,
        montant,
        feeAmount: montant,
        statut: "brouillon",
        billingStatus: "READY_TO_BILL",
      },
    });

    // 2. Clôturer la WorkSession
    await tx.workSession.update({
      where: { id: sessionId },
      data: {
        statut: "termine",
        endedAt: now,
        dureeMinutes,
        typeActivite,
        description: description || `Rédaction — ${doc.titre}`,
        timeEntryId: timeEntry.id,
      },
    });

    // 3. Snapshot version du document
    const lastVersion = await tx.richDocumentVersion.findFirst({
      where: { richDocumentId: id },
      orderBy: { versionNumber: "desc" },
    });

    await tx.richDocumentVersion.create({
      data: {
        richDocumentId: id,
        cabinetId: session.cabinetId,
        createdById: session.userId,
        content: doc.content,
        versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
        label: `Après ${typeActivite} (${dureeMinutes} min)`,
      },
    });

    return { timeEntry };
  });

  if (!result) return NextResponse.json({ error: "Cette session a déjà été terminée." }, { status: 409 });

  return NextResponse.json({
    success: true,
    timeEntry: result.timeEntry,
    message: `Fiche de temps créée : ${dureeMinutes} min — ${(montant).toFixed(2)} $`,
  });
}
