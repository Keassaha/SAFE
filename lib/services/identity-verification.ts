"use server";

import type { IdentityVerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createAuditLog } from "./audit";

export interface CreateIdentityVerificationParams {
  clientId: string;
  cabinetId: string;
  userId: string;
  date: Date;
  methode: string;
  statut?: IdentityVerificationStatus;
  documentId?: string | null;
  notes?: string | null;
}

/**
 * Crée une entrée de vérification d'identité et met à jour les champs sur le client.
 */
export async function createIdentityVerification(params: CreateIdentityVerificationParams) {
  const { clientId, cabinetId, userId, date, methode, statut = "verifie", documentId, notes } = params;
  const client = await prisma.client.findFirst({
    where: { id: clientId, cabinetId },
  });
  if (!client) throw new Error("Client non trouvé");

  const verification = await prisma.clientIdentityVerification.create({
    data: {
      clientId,
      date,
      methode,
      statut,
      documentId: documentId ?? undefined,
      notes: notes ?? undefined,
    },
  });

  await prisma.client.updateMany({
    where: { id: clientId, cabinetId },
    data: {
      dateVerificationIdentite: date,
      methodeVerificationIdentite: methode,
    },
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "ClientIdentityVerification",
    entityId: verification.id,
    action: "create",
    metadata: { clientId, methode, statut },
  });

  return verification;
}

export async function listIdentityVerifications(clientId: string, cabinetId: string) {
  return prisma.clientIdentityVerification.findMany({
    where: { clientId, client: { cabinetId } },
    include: { document: true },
    orderBy: { date: "desc" },
  });
}
