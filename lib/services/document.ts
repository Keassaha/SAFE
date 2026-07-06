"use server";

import { prisma } from "@/lib/db";
import { createAuditLog } from "./audit";
import { DocumentRetentionError } from "./document-errors";
import { canManageDocuments, canViewDocuments } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { put, get, del } from "@vercel/blob";
import path from "path";
import fs from "fs/promises";

const UPLOAD_BASE = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

function shouldUseLocalStorage() {
  return process.env.STORAGE_PROVIDER === "local" || process.env.NODE_ENV !== "production";
}

/**
 * Stockage objet des documents = Vercel Blob (PRIVÉ) en production, système de
 * fichiers local en dev. Les documents juridiques sont confidentiels (Barreau) :
 * le store Blob est en accès privé, jamais exposé par URL publique ; les fichiers
 * sont toujours servis via des routes authentifiées qui lisent côté serveur.
 */
function useBlobStorage() {
  return !shouldUseLocalStorage() && !!process.env.BLOB_READ_WRITE_TOKEN;
}

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

export async function writeDocumentObject(
  storageKey: string,
  buffer: Buffer,
  contentType = "application/octet-stream",
  options: { upsert?: boolean } = {}
): Promise<void> {
  if (useBlobStorage()) {
    await put(storageKey, buffer, {
      access: "private",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: options.upsert ?? false,
    });
    return;
  }

  if (!shouldUseLocalStorage()) {
    throw new Error("Aucun stockage de documents configuré (ni Vercel Blob ni local)");
  }

  const fullPath = path.join(UPLOAD_BASE, storageKey);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, buffer);
}

export async function readDocumentObject(storageKey: string): Promise<Buffer> {
  if (useBlobStorage()) {
    const result = await get(storageKey, { access: "private" });
    if (!result) throw new Error(`Document introuvable dans Vercel Blob : ${storageKey}`);
    return Buffer.from(await new Response(result.stream).arrayBuffer());
  }

  if (!shouldUseLocalStorage()) {
    throw new Error("Aucun stockage de documents configuré (ni Vercel Blob ni local)");
  }

  return fs.readFile(path.join(UPLOAD_BASE, storageKey));
}

async function deleteDocumentObject(storageKey: string): Promise<void> {
  if (useBlobStorage()) {
    await del(storageKey);
    return;
  }

  if (!shouldUseLocalStorage()) {
    throw new Error("Aucun stockage de documents configuré (ni Vercel Blob ni local)");
  }

  await fs.unlink(path.join(UPLOAD_BASE, storageKey));
}

/**
 * Supprime le document (fichier + enregistrement) et enregistre l'audit.
 *
 * Conformité Barreau (B-1 r.5) : les pièces rattachées à un client ou à un
 * dossier doivent être conservées (10 ans). La suppression définitive est donc
 * refusée pour ces documents (lève `DocumentRetentionError`). Seuls les fichiers
 * orphelins (ni client ni dossier — uploads temporaires/mal classés) peuvent
 * être supprimés.
 */
export async function deleteDocument(documentId: string, cabinetId: string, userId: string): Promise<boolean> {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, cabinetId },
  });
  if (!doc) return false;
  if (doc.clientId || doc.dossierId) {
    throw new DocumentRetentionError();
  }
  try {
    await deleteDocumentObject(doc.storageKey);
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
  const storageKey = path.posix.join(cabinetId, String(year), documentId);
  const fullPath = path.join(UPLOAD_BASE, storageKey);
  if (shouldUseLocalStorage()) {
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
  }
  return { fullPath, storageKey };
}
