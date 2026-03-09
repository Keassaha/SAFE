import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageDocuments } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import {
  createDocumentRecord,
  prepareStorageForUpload,
  canAccessDocument,
} from "@/lib/services/document";
import { createAuditLog } from "@/lib/services/audit";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_BASE = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const userId = (session.user as { id?: string }).id;
  const role = (session.user as { role?: string }).role as UserRole;
  if (!cabinetId || !userId) {
    return NextResponse.json({ error: "Session incomplète" }, { status: 403 });
  }
  if (!canManageDocuments(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const dossierId = (formData.get("dossierId") as string) || undefined;
  const clientId = (formData.get("clientId") as string) || undefined;
  const nom = (formData.get("nom") as string) || file?.name || "document";

  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }
  if (!dossierId && !clientId) {
    return NextResponse.json({ error: "dossierId ou clientId requis" }, { status: 400 });
  }

  if (dossierId) {
    const dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, cabinetId },
    });
    if (!dossier) {
      return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    }
  }
  if (clientId) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, cabinetId },
    });
    if (!client) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }
  }

  const documentId = randomUUID();
  const { fullPath, storageKey } = await prepareStorageForUpload(cabinetId, documentId);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(fullPath, buffer);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur lors de l'écriture du fichier" }, { status: 500 });
  }

  const doc = await createDocumentRecord({
    cabinetId,
    userId,
    clientId: clientId ?? null,
    dossierId: dossierId ?? null,
    nom: nom || file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    storageKey,
  });

  return NextResponse.json({
    id: doc.id,
    nom: doc.nom,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    createdAt: doc.createdAt,
  });
}
