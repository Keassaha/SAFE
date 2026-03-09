"use server";

import { prisma } from "@/lib/db";
import { createAuditLog } from "./audit";
import { canManageDocuments, canViewDocuments } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import path from "path";
import fs from "fs/promises";

const UPLOAD_BASE = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

function getStoragePath(cabinetId: string, documentId: string): string {
  const year = new Date().getFullYear();
  return path.join(UPLOAD_BASE, cabinetId, String(year), documentId);
}

/**
 * Vérifie si l'utilisateur peut accéder au document (cabinet + rôle; avocat uniquement si dossier assigné).
 */
export async function canAccessDocument(
  documentId: string,
  cabinetId: string,
  userId: string,
  role: UserRole,
  action: "view" | "manage"
): Promise<boolean> {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, cabinetId },
    include: { dossier: { select: { avocatResponsableId: true } } },
  });
  if (!doc) return false;
  if (action === "manage") return canManageDocuments(role as UserRole);
  if (!canViewDocuments(role as UserRole)) return false;
  if (role === "admin_cabinet" || role === "assistante") return true;
  if (role === "avocat" && doc.dossier?.avocatResponsableId === userId) return true;
  if (doc.dossierId === null) return true; // document au niveau client
  return doc.dossier?.avocatResponsableId === userId;
}

export interface CreateDocumentParams {
  cabinetId: string;
  userId: string;
  clientId?: string | null;
  dossierId?: string | null;
  nom: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string; // appelant fournit la clé après avoir écrit le fichier
  hash?: string | null;
  retentionJusqua?: Date | null;
  documentType?: string | null;
  templateCode?: string | null; // code taxonomie droit familial
  aiAssisted?: boolean;
}

/**
 * Crée l'enregistrement Document en base après que le fichier ait été stocké.
 */
export async function createDocumentRecord(params: CreateDocumentParams) {
  const { cabinetId, userId, clientId, dossierId, nom, mimeType, sizeBytes, storageKey, hash, retentionJusqua, documentType, templateCode, aiAssisted } = params;
  const doc = await prisma.document.create({
    data: {
      cabinetId,
      uploadedById: userId,
      clientId: clientId ?? undefined,
      dossierId: dossierId ?? undefined,
      nom,
      mimeType,
      sizeBytes,
      storageKey,
      hash: hash ?? undefined,
      retentionJusqua: retentionJusqua ?? undefined,
      documentType: documentType ?? undefined,
      templateCode: templateCode ?? undefined,
      aiAssisted: aiAssisted ?? undefined,
    },
  });
  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Document",
    entityId: doc.id,
    action: "create",
    metadata: { nom, dossierId, clientId },
  });
  return doc;
}

/**
 * Retourne le chemin physique du fichier pour stream (à utiliser côté API route).
 */
export async function getDocumentStoragePath(documentId: string, cabinetId: string): Promise<string | null> {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, cabinetId },
  });
  if (!doc) return null;
  return path.join(UPLOAD_BASE, doc.storageKey);
}

/**
 * Supprime le document (fichier + enregistrement) et enregistre l'audit.
 */
export async function deleteDocument(documentId: string, cabinetId: string, userId: string): Promise<boolean> {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, cabinetId },
  });
  if (!doc) return false;
  const fullPath = path.join(UPLOAD_BASE, doc.storageKey);
  try {
    await fs.unlink(fullPath);
  } catch {
    // fichier déjà absent
  }
  await prisma.document.delete({ where: { id: documentId } });
  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Document",
    entityId: documentId,
    action: "delete",
    metadata: { nom: doc.nom },
  });
  return true;
}

/**
 * Liste les documents d'un dossier ou d'un client.
 */
export async function listDocuments(params: {
  cabinetId: string;
  dossierId?: string | null;
  clientId?: string | null;
}) {
  const { cabinetId, dossierId, clientId } = params;
  return prisma.document.findMany({
    where: {
      cabinetId,
      ...(dossierId != null ? { dossierId } : {}),
      ...(clientId != null ? { clientId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: { select: { nom: true } } },
  });
}

/**
 * Génère une clé de stockage et assure que le répertoire existe.
 */
export async function prepareStorageForUpload(cabinetId: string, documentId: string): Promise<{ fullPath: string; storageKey: string }> {
  const year = new Date().getFullYear();
  const dir = path.join(UPLOAD_BASE, cabinetId, String(year));
  await fs.mkdir(dir, { recursive: true });
  const storageKey = path.join(cabinetId, String(year), documentId);
  const fullPath = path.join(UPLOAD_BASE, storageKey);
  return { fullPath, storageKey };
}
