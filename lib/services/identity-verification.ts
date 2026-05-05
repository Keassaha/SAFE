"use server";

import type { IdentityVerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createAuditLog } from "./audit";
import { loadDossierPreparationSnapshot } from "@/lib/dossiers/preparation-loader";
import { getDossierPreparationStatus } from "@/lib/dossiers/preparation-status";
import { detectAndEmitIfReady } from "./ready-for-review-service";

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
 *
 * Lorsque `statut === "verifie"`, on flippe aussi `Client.identityVerified=true`.
 * C'est ce flag que la doctrine de préparation lit (cf. lib/dossiers/preparation-status.ts §4),
 * donc sans ce write la vérification ne peut jamais lever le manquant `identity`.
 *
 * Doctrine signal: docs/product/READY_FOR_REVIEW_SIGNAL.md §8 — toute action qui
 * peut lever un manquant doit appeler `detectAndEmitIfReady` après le write.
 */
export async function createIdentityVerification(params: CreateIdentityVerificationParams) {
  const { clientId, cabinetId, userId, date, methode, statut = "verifie", documentId, notes } = params;
  const client = await prisma.client.findFirst({
    where: { id: clientId, cabinetId },
  });
  if (!client) throw new Error("Client non trouvé");

  // Si la vérification flippe l'état du client à `identityVerified=true`, alors
  // tous ses dossiers actifs peuvent voir leur manquant `identity` levé.
  // On capture l'état d'avant pour chacun des dossiers concernés.
  const isVerifying = statut === "verifie" && !client.identityVerified;
  const dossiersForSignal = isVerifying
    ? await prisma.dossier.findMany({
        where: { cabinetId, clientId, statut: { not: "archive" } },
        select: { id: true },
      })
    : [];

  const beforeStatesByDossier = new Map<string, ReturnType<typeof getDossierPreparationStatus>["state"] | null>();
  for (const d of dossiersForSignal) {
    const snap = await loadDossierPreparationSnapshot(cabinetId, d.id, { callerUserId: userId });
    beforeStatesByDossier.set(d.id, snap ? getDossierPreparationStatus(snap).state : null);
  }

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
      ...(statut === "verifie" ? { identityVerified: true, verificationDate: date } : {}),
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

  if (isVerifying) {
    for (const d of dossiersForSignal) {
      await detectAndEmitIfReady(cabinetId, d.id, {
        beforeState: beforeStatesByDossier.get(d.id) ?? null,
        callerUserId: userId,
      });
    }
  }

  return verification;
}

export async function listIdentityVerifications(clientId: string, cabinetId: string) {
  return prisma.clientIdentityVerification.findMany({
    where: { clientId, client: { cabinetId } },
    include: { document: true },
    orderBy: { date: "desc" },
  });
}
