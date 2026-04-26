import { NextRequest, NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { buildPdfDocument } from "../pdf/route";
import { prepareStorageForUpload } from "@/lib/services/document";

/**
 * POST /api/edition/documents/[id]/sync-to-folder
 *
 * Génère le PDF du RichDocument et l'enregistre dans le dossier client
 * (table Document legacy) afin qu'il apparaisse comme un fichier classique
 * téléchargeable / partageable.
 *
 * Idempotent : un seul Document par RichDocument (identifié par
 * templateCode = "rich-doc:<richDocId>"). Sur appels successifs, le fichier
 * et l'enregistrement sont mis à jour, pas dupliqués.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireCabinetAndUser();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const richDoc = await prisma.richDocument.findFirst({
    where: { id, cabinetId: session.cabinetId, isArchived: false },
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
    },
  });

  // Préparer le storage (réutilise la clé existante si possible)
  const documentIdForStorage = existing?.id ?? `rich-${richDoc.id}`;
  const { fullPath, storageKey } = await prepareStorageForUpload(
    session.cabinetId,
    documentIdForStorage,
  );

  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath + ".pdf", buffer);

  if (existing) {
    const updated = await prisma.document.update({
      where: { id: existing.id },
      data: {
        nom: filename,
        sizeBytes,
        hash,
        storageKey: storageKey + ".pdf",
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, documentId: updated.id, action: "updated" });
  }

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
