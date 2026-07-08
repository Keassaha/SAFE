import "server-only";

import { prisma } from "@/lib/db";
import { sanitizeInput } from "@/lib/utils/sanitize";
import { createAuditLog } from "@/lib/services/audit";
import type { PartieDraft, CoClientTypeClient } from "@/lib/dossiers/parties";

/** Découpe un nom saisi en champs Client (miroir de createClientQuick). */
function coClientNameFields(typeClient: CoClientTypeClient, nom: string): {
  typeClient: CoClientTypeClient;
  prenom: string | null;
  nom: string | null;
  raisonSociale: string | null;
} {
  const trimmed = nom.trim();
  if (typeClient === "personne_physique") {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    const last = parts.length > 1 ? parts[parts.length - 1] : parts[0] ?? "";
    const first = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
    return { typeClient, prenom: first || last, nom: last, raisonSociale: null };
  }
  return { typeClient, prenom: null, nom: null, raisonSociale: trimmed };
}

/**
 * Résout les co-clients « nouvelle personne » en fiches Client réelles du cabinet.
 * Dédup : réutilise une fiche existante de même nom plutôt que d'en créer un doublon.
 * Retourne les clientId (créés ou réutilisés).
 */
async function resolveNewCoClientIds(args: {
  cabinetId: string;
  userId?: string;
  drafts: PartieDraft[];
}): Promise<string[]> {
  const { cabinetId, userId } = args;
  const news = args.drafts.filter(
    (d): d is Extract<PartieDraft, { nature: "co_client_new" }> => d.nature === "co_client_new",
  );
  const ids: string[] = [];
  for (const d of news) {
    const f = coClientNameFields(d.typeClient, d.nom);
    if (!f.nom && !f.raisonSociale) continue;

    let existing: { id: string } | null = null;
    if (f.typeClient === "personne_morale" && f.raisonSociale) {
      existing = await prisma.client.findFirst({
        where: { cabinetId, typeClient: "personne_morale", raisonSociale: { equals: f.raisonSociale, mode: "insensitive" } },
        select: { id: true },
      });
    } else if (f.nom) {
      existing = await prisma.client.findFirst({
        where: {
          cabinetId,
          typeClient: "personne_physique",
          nom: { equals: f.nom, mode: "insensitive" },
          prenom: { equals: f.prenom ?? "", mode: "insensitive" },
        },
        select: { id: true },
      });
    }
    if (existing) {
      ids.push(existing.id);
      continue;
    }

    const created = await prisma.client.create({
      data: {
        cabinetId,
        typeClient: f.typeClient,
        prenom: f.prenom ? sanitizeInput(f.prenom) : null,
        nom: f.nom ? sanitizeInput(f.nom) : null,
        raisonSociale: f.raisonSociale ? sanitizeInput(f.raisonSociale) : null,
      },
    });
    if (userId) {
      await createAuditLog({
        cabinetId,
        userId,
        entityType: "Client",
        entityId: created.id,
        action: "create",
        metadata: { viaCoClient: true, raisonSociale: created.raisonSociale ?? undefined },
      });
    }
    ids.push(created.id);
  }
  return ids;
}

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
  userId?: string;
}): Promise<void> {
  const { cabinetId, dossierId, principalClientId } = args;

  // Co-clients demandés (fiches existantes) : dédup + on exclut le principal.
  const requestedCoClientIds = Array.from(
    new Set(
      args.drafts
        .filter((d): d is Extract<PartieDraft, { nature: "co_client" }> => d.nature === "co_client")
        .map((d) => d.clientId)
        .filter((id) => id && id !== principalClientId),
    ),
  );

  // Isolation tenant : ne garder que les clients réellement dans ce cabinet.
  const existingCoClientIds = requestedCoClientIds.length
    ? (
        await prisma.client.findMany({
          where: { id: { in: requestedCoClientIds }, cabinetId },
          select: { id: true },
        })
      ).map((c) => c.id)
    : [];

  // Co-clients « nouvelle personne » : on crée (ou réutilise) la fiche Client.
  const newCoClientIds = await resolveNewCoClientIds({ cabinetId, userId: args.userId, drafts: args.drafts });

  const validCoClientIds = Array.from(
    new Set([...existingCoClientIds, ...newCoClientIds].filter((id) => id && id !== principalClientId)),
  );

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
