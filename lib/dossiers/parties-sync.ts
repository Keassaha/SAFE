import "server-only";

import { prisma } from "@/lib/db";
import { sanitizeInput } from "@/lib/utils/sanitize";
import type { PartieDraft } from "@/lib/dossiers/parties";

/**
 * Synchronise les personnes d'un dossier (au-delà du client principal).
 *
 * Invariants garantis (spec §3.3) :
 *  - exactement un `mandant_principal` (estPrincipal), avec clientId = principalClientId ;
 *  - les co-clients pointent vers une fiche Client DU CABINET (isolation tenant) ;
 *  - une partie externe n'a jamais de clientId (garde-fou aussi vérifié par CHECK SQL) ;
 *  - le principal n'est pas dupliqué en co-client.
 *
 * Stratégie : on remplace intégralement les lignes du dossier dans une transaction
 * (delete + recreate). Simple, idempotent, cohérent avec `Dossier.clientId`.
 */
export async function syncDossierParties(args: {
  cabinetId: string;
  dossierId: string;
  principalClientId: string;
  drafts: PartieDraft[];
}): Promise<void> {
  const { cabinetId, dossierId, principalClientId } = args;

  // Co-clients demandés : dédup + on exclut le principal (déjà représenté).
  const requestedCoClientIds = Array.from(
    new Set(
      args.drafts
        .filter((d): d is Extract<PartieDraft, { nature: "co_client" }> => d.nature === "co_client")
        .map((d) => d.clientId)
        .filter((id) => id && id !== principalClientId),
    ),
  );

  // Isolation tenant : ne garder que les clients réellement dans ce cabinet.
  const validCoClientIds = requestedCoClientIds.length
    ? (
        await prisma.client.findMany({
          where: { id: { in: requestedCoClientIds }, cabinetId },
          select: { id: true },
        })
      ).map((c) => c.id)
    : [];

  const externes = args.drafts.filter(
    (d): d is Extract<PartieDraft, { nature: "partie_externe" }> => d.nature === "partie_externe",
  );

  await prisma.$transaction(async (tx) => {
    await tx.dossierPartie.deleteMany({ where: { dossierId, cabinetId } });

    const rows = [
      {
        cabinetId,
        dossierId,
        nature: "co_client" as const,
        role: "mandant_principal" as const,
        clientId: principalClientId,
        estPrincipal: true,
      },
      ...validCoClientIds.map((clientId) => ({
        cabinetId,
        dossierId,
        nature: "co_client" as const,
        role: "co_client" as const,
        clientId,
        estPrincipal: false,
      })),
      ...externes.map((e) => ({
        cabinetId,
        dossierId,
        nature: "partie_externe" as const,
        role: e.role,
        nomAffiche: sanitizeInput(e.nomAffiche).slice(0, 200),
        estPrincipal: false,
      })),
    ];

    await tx.dossierPartie.createMany({ data: rows });
  });
}

/**
 * Réconcilie UNIQUEMENT le mandant principal, sans toucher aux autres parties.
 * Utilisé quand le formulaire n'embarque pas l'éditeur de parties (flag off, ou
 * chemin d'édition qui n'a pas ce bloc) : on garde les co-clients/parties existants,
 * on se contente d'aligner le principal sur `Dossier.clientId`.
 */
export async function reconcilePrincipalParty(args: {
  cabinetId: string;
  dossierId: string;
  principalClientId: string;
}): Promise<void> {
  const { cabinetId, dossierId, principalClientId } = args;
  await prisma.$transaction(async (tx) => {
    await tx.dossierPartie.deleteMany({ where: { dossierId, cabinetId, estPrincipal: true } });
    // Si le nouveau principal figurait déjà comme co-client, on retire le doublon.
    await tx.dossierPartie.deleteMany({
      where: { dossierId, cabinetId, estPrincipal: false, nature: "co_client", clientId: principalClientId },
    });
    await tx.dossierPartie.create({
      data: {
        cabinetId,
        dossierId,
        nature: "co_client",
        role: "mandant_principal",
        clientId: principalClientId,
        estPrincipal: true,
      },
    });
  });
}
