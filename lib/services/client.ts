"use server";

import { prisma } from "@/lib/db";
import { createAuditLog } from "./audit";

/**
 * Enregistre un consentement (Loi 25) pour un client et crée une entrée ConsentLog.
 */
export async function recordConsent(params: {
  clientId: string;
  cabinetId: string;
  userId: string | null;
  finalites: string; // JSON array ou string des finalités
  versionPolitique?: string | null;
}) {
  const { clientId, cabinetId, userId, finalites, versionPolitique } = params;
  const client = await prisma.client.findFirst({
    where: { id: clientId, cabinetId },
  });
  if (!client) throw new Error("Client non trouvé");

  await prisma.$transaction([
    prisma.consentLog.create({
      data: {
        clientId,
        finalites,
        userId: userId ?? undefined,
        versionPolitique: versionPolitique ?? undefined,
      },
    }),
    prisma.client.updateMany({
      where: { id: clientId, cabinetId },
      data: {
        consentementCollecteAt: new Date(),
        finalitesConsentement: finalites,
      },
    }),
  ]);

  await createAuditLog({
    cabinetId,
    userId: userId ?? undefined,
    entityType: "ConsentLog",
    entityId: clientId,
    action: "create",
    metadata: { finalites },
  });
}

/**
 * Suggère une date de rétention (ex. 7 ans après dernière activité) — à personnaliser selon politique cabinet.
 */
export function suggestRetentionEndDate(fromDate: Date, retentionYears: number = 7): Date {
  const d = new Date(fromDate);
  d.setFullYear(d.getFullYear() + retentionYears);
  return d;
}
