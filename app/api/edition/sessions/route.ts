import { NextRequest, NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { z } from "zod";

const StartSessionSchema = z.object({
  richDocumentId: z.string().min(1),
  dossierId: z.string().min(1),
  clientId: z.string().min(1),
});

// POST /api/edition/sessions — démarrer une session chrono
export async function POST(req: NextRequest) {
  const session = await requireCabinetAndUser();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = StartSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Clôturer toute session active existante sur ce document pour cet user
  await prisma.workSession.updateMany({
    where: {
      cabinetId: session.cabinetId,
      userId: session.userId,
      richDocumentId: parsed.data.richDocumentId,
      statut: "en_cours",
    },
    data: { statut: "pause" },
  });

  const workSession = await prisma.workSession.create({
    data: {
      cabinetId: session.cabinetId,
      userId: session.userId,
      dossierId: parsed.data.dossierId,
      clientId: parsed.data.clientId,
      richDocumentId: parsed.data.richDocumentId,
      startedAt: new Date(),
      statut: "en_cours",
    },
  });

  return NextResponse.json(workSession, { status: 201 });
}

// PATCH /api/edition/sessions — pauser une session
export async function PATCH(req: NextRequest) {
  const session = await requireCabinetAndUser();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { sessionId, action } = await req.json();
  if (!sessionId || !["pause", "reprendre"].includes(action)) {
    return NextResponse.json({ error: "sessionId et action requis" }, { status: 400 });
  }

  const workSession = await prisma.workSession.findFirst({
    where: { id: sessionId, cabinetId: session.cabinetId, userId: session.userId },
  });
  if (!workSession) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

  const updated = await prisma.workSession.update({
    where: { id: sessionId },
    data: { statut: action === "pause" ? "pause" : "en_cours" },
  });

  return NextResponse.json(updated);
}
