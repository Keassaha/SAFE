import { NextRequest, NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isSafeIncCabinet } from "@/lib/safe-inc";
import { writeDocumentObject } from "@/lib/services/document";
import { broadcastSupport, supportChannels } from "@/lib/support/realtime";
import path from "path";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const MAX_FILES = 5;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// POST /api/support/messages
// Envoi d'un message de chat (texte + pièces jointes optionnelles). Chemin unique
// client et console : le côté (client vs SAFE Inc.) est déduit du cabinet.
export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireCabinetAndUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const conversationId = String(formData.get("conversationId") || "");
  const sujet = String(formData.get("sujet") || "").trim();
  const contenu = String(formData.get("contenu") || "").trim();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  if (!conversationId && !sujet) {
    return NextResponse.json({ error: "Fil ou sujet requis" }, { status: 400 });
  }
  if (!contenu && files.length === 0) {
    return NextResponse.json({ error: "Message ou pièce jointe requis" }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Maximum ${MAX_FILES} fichiers par message` }, { status: 400 });
  }

  const isSafe = await isSafeIncCabinet(session.cabinetId);

  // Fil existant, ou création d'un nouveau fil (client uniquement).
  let convo: { id: string; cabinetId: string } | null;
  if (conversationId) {
    convo = await prisma.supportConversation.findUnique({
      where: { id: conversationId },
      select: { id: true, cabinetId: true },
    });
    if (!convo) return NextResponse.json({ error: "Fil introuvable" }, { status: 404 });
  } else {
    convo = await prisma.supportConversation.create({
      data: {
        cabinetId: session.cabinetId,
        createdById: session.userId,
        sujet,
        statut: "OUVERTE",
        lastMessageAt: new Date(),
      },
      select: { id: true, cabinetId: true },
    });
  }

  // Autorisation : soit le cabinet propriétaire du fil (client), soit SAFE Inc.
  const isOwner = convo.cabinetId === session.cabinetId;
  if (!isOwner && !isSafe) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const isFromSafeInc = !isOwner && isSafe;

  // Valider + écrire les fichiers sur Blob (regroupés sous le cabinet du fil).
  const pieces: { nom: string; mimeType: string; sizeBytes: number; storageKey: string }[] = [];
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `« ${file.name} » dépasse 25 MB` }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Type non supporté : ${file.name}` }, { status: 415 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || ".bin";
    const storageKey = `${convo.cabinetId}/support/${randomUUID()}${ext}`;
    await writeDocumentObject(storageKey, buffer, file.type || "application/octet-stream");
    pieces.push({ nom: file.name, mimeType: file.type, sizeBytes: file.size, storageKey });
  }

  const message = await prisma.supportMessage.create({
    data: {
      conversationId: convo.id,
      authorId: session.userId,
      isFromSafeInc,
      contenu,
      pieces: pieces.length ? { create: pieces } : undefined,
    },
    include: { pieces: { select: { id: true, nom: true, mimeType: true, sizeBytes: true } } },
  });

  await prisma.supportConversation.update({
    where: { id: convo.id },
    data: { lastMessageAt: new Date(), statut: "OUVERTE" },
  });

  // Signal temps réel (opaque, sans contenu) : le cabinet propriétaire du fil et
  // la console sont notifiés et rechargent via leurs actions authentifiées.
  await broadcastSupport(
    [supportChannels.cabinet(convo.cabinetId), supportChannels.console()],
    { conversationId: convo.id, side: isFromSafeInc ? "safe" : "client" },
  );

  return NextResponse.json({
    ok: true,
    conversationId: convo.id,
    messageId: message.id,
    pieces: message.pieces,
  });
}
