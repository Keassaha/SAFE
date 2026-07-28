/**
 * Module SERVEUR (bibliothèque interne), pas un fichier d'actions.
 *
 * La directive "use server" a été retirée (audit sécurité 2026-07-28, §E4) : elle
 * transformait chaque fonction exportée en point d'entrée RPC adressable depuis le
 * navigateur. Or ces fonctions reçoivent `cabinetId` en PARAMÈTRE au lieu de le
 * dériver de la session : un appelant qui obtenait l'identifiant d'action pouvait
 * passer le cabinetId d'un autre cabinet et lire, écrire ou supprimer hors du sien.
 *
 * Ce module est importé par des routes API et des actions serveur qui portent déjà
 * leur propre garde de session. Ne PAS remettre "use server" ici.
 */

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
