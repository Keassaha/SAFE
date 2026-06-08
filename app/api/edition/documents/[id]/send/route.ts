import { NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { sendDocumentsToClient } from "@/lib/services/client-send/send-to-client";
import { sanitizeInput } from "@/lib/utils/sanitize";

const SENDER_ROLES = ["admin_cabinet", "avocat", "assistante"];

async function loadDoc(id: string, cabinetId: string) {
  return prisma.richDocument.findFirst({
    where: { id, cabinetId, isArchived: false },
    include: {
      client: { select: { id: true, raisonSociale: true, email: true } },
      dossier: { select: { id: true } },
    },
  });
}

/** GET — données pour préremplir la fenêtre d'envoi (email client, nom cabinet, type/titre). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!SENDER_ROLES.includes(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }
  const doc = await loadDoc(id, cabinetId);
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  const cabinet = await prisma.cabinet.findUnique({ where: { id: cabinetId }, select: { nom: true } });

  return NextResponse.json({
    clientEmail: doc.client.email ?? "",
    clientNom: doc.client.raisonSociale ?? "Client",
    cabinetNom: cabinet?.nom ?? "SAFE",
    documentTitre: doc.titre,
    documentType: doc.type,
    statut: doc.statut,
  });
}

/** POST — envoie le document au client par courriel. Body : { recipientEmail, subject, body }. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!SENDER_ROLES.includes(role)) {
    return NextResponse.json({ error: "Droits insuffisants pour envoyer au client" }, { status: 403 });
  }

  const doc = await loadDoc(id, cabinetId);
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  let payload: { recipientEmail?: unknown; subject?: unknown; body?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const recipientEmail = typeof payload.recipientEmail === "string" ? payload.recipientEmail.trim() : "";
  const subject = typeof payload.subject === "string" ? sanitizeInput(payload.subject).trim() : "";
  const body = typeof payload.body === "string" ? sanitizeInput(payload.body) : "";

  if (!recipientEmail || !subject || !body.trim()) {
    return NextResponse.json({ error: "Destinataire, objet et message sont requis." }, { status: 400 });
  }

  try {
    const result = await sendDocumentsToClient({
      cabinetId,
      dossierId: doc.dossier.id,
      clientId: doc.client.id,
      sentById: userId,
      recipientEmail,
      subject,
      body,
      richDocumentIds: [doc.id],
    });
    return NextResponse.json({ ok: result.sent, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur lors de l'envoi";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
