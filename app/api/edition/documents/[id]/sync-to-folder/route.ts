import { richDocumentScope } from "@/lib/edition/access";
import { NextRequest, NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewDocuments } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import crypto from "node:crypto";
import { buildPdfDocument } from "@/lib/edition/pdf-builder";
import { prepareStorageForUpload, writeDocumentObject } from "@/lib/services/document";

/**
 * POST /api/edition/documents/[id]/sync-to-folder
 *
 * Génère le PDF du RichDocument et l'enregistre dans le dossier client
 * (table Document legacy) afin qu'il apparaisse comme un fichier classique
 * téléchargeable / partageable.
 *
 * Les exports sont conservés sans écraser les précédents.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireCabinetAndUser();
  if (!canViewDocuments(session.role as UserRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const richDoc = await prisma.richDocument.findFirst({
    where: { id, ...richDocumentScope(session), isArchived: false },
    include: {
      dossier: { select: { intitule: true } },
      client: { select: { raisonSociale: true } },
    },
  });
  if (!richDoc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  const cabinet = await prisma.cabinet.findUnique({
    where: { id: session.cabinetId },
    select: { nom: true, adresse: true, telephone: true, email: true, barreauNumero: true },
  });
  if (!cabinet) return NextResponse.json({ error: "Cabinet introuvable" }, { status: 404 });

  // Génération PDF
  const pdfDoc = buildPdfDocument(
    richDoc.titre,
    richDoc.content,
    richDoc.type,
    cabinet,
    richDoc.client.raisonSociale ?? "Client",
    richDoc.dossier.intitule,
    richDoc.createdAt,
  );
  const buffer = await renderToBuffer(pdfDoc);
  const sizeBytes = buffer.byteLength;
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  const filename = `${richDoc.titre.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
  const templateCode = `rich-doc:${richDoc.id}`;

  // Existe-t-il déjà un Document pour ce RichDocument ?
  const existing = await prisma.document.findFirst({
    where: {
      cabinetId: session.cabinetId,
      dossierId: richDoc.dossierId,
      templateCode,
      hash,
    },
  });

  // Un export identique est réutilisé ; un contenu différent conserve l'ancien
  // Document et son objet, au lieu d'écraser une pièce déjà versée au dossier.
  if (existing) return NextResponse.json({ ok: true, documentId: existing.id, action: "unchanged" });
  const { storageKey } = await prepareStorageForUpload(session.cabinetId, crypto.randomUUID());
  await writeDocumentObject(`${storageKey}.pdf`, buffer, "application/pdf");

  const created = await prisma.document.create({
    data: {
      cabinetId: session.cabinetId,
      uploadedById: session.userId,
      clientId: richDoc.clientId,
      dossierId: richDoc.dossierId,
      nom: filename,
      mimeType: "application/pdf",
      sizeBytes,
      storageKey: storageKey + ".pdf",
      hash,
      documentType: "redaction",
      templateCode,
      aiAssisted: false,
    },
  });
  return NextResponse.json({ ok: true, documentId: created.id, action: "created" });
}
