import { NextRequest, NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { z } from "zod";

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
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = TerminerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { sessionId, typeActivite, description, dureeMinutes, tauxHoraire } = parsed.data;

  // Récupérer le document pour ses métadonnées
  const doc = await prisma.richDocument.findFirst({
    where: { id, cabinetId: session.cabinetId },
    include: {
      dossier: { select: { tauxHoraire: true, modeFacturation: true } },
    },
  });
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  // Récupérer la session de travail
  const workSession = await prisma.workSession.findFirst({
    where: { id: sessionId, cabinetId: session.cabinetId, userId: session.userId },
  });
  if (!workSession) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

  const taux = tauxHoraire ?? doc.dossier.tauxHoraire ?? 150;
  const montant = (dureeMinutes / 60) * taux;
  const now = new Date();

  // Transaction : fermer session + créer TimeEntry
  const result = await prisma.$transaction(async (tx) => {
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
        billingStatus: "NON_BILLED",
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

  return NextResponse.json({
    success: true,
    timeEntry: result.timeEntry,
    message: `Fiche de temps créée : ${dureeMinutes} min — ${(montant).toFixed(2)} $`,
  });
}
