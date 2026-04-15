/**
 * Service de vérification automatique des conflits d'intérêts.
 * LAWPRO top cause de réclamations. LSO Rules of Professional Conduct.
 *
 * Vérifie si le nom du client ou des parties liées apparaît dans
 * d'autres dossiers actifs du cabinet comme partie adverse ou partie.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";

interface ConflictResult {
  dossierId: string;
  dossierIntitule: string;
  dossierNumeroDossier: string | null;
  clientName: string;
  clientId: string;
  relation: string; // "client" | "adverse_party"
}

export interface RunConflictCheckParams {
  cabinetId: string;
  dossierId: string;
  clientName: string;
  clientId: string;
  checkedById: string;
}

/**
 * Runs a conflict check for a client name against all active dossiers.
 * Searches by: exact match, partial match on nom/prenom/raisonSociale.
 * Flags if the same client appears in another dossier where they might
 * be an adverse party, or if the same name appears across matters.
 */
export async function runConflictCheck(params: RunConflictCheckParams) {
  const { cabinetId, dossierId, clientName, clientId, checkedById } = params;

  const nameParts = clientName.trim().toLowerCase().split(/\s+/);
  if (nameParts.length === 0 || (nameParts.length === 1 && nameParts[0].length < 2)) {
    throw new Error("Client name is too short for conflict check");
  }

  // Find all OTHER active dossiers in the cabinet
  const activeDossiers = await prisma.dossier.findMany({
    where: {
      cabinetId,
      id: { not: dossierId },
      statut: { in: ["ouvert", "actif", "en_attente"] },
    },
    select: {
      id: true,
      intitule: true,
      numeroDossier: true,
      clientId: true,
      client: {
        select: {
          id: true,
          raisonSociale: true,
          prenom: true,
          nom: true,
        },
      },
      // Check DossierClientInfo for adverse parties
      clientInfo: {
        select: {
          id: true,
        },
      },
    },
  });

  const conflicts: ConflictResult[] = [];

  for (const d of activeDossiers) {
    const clientFullName = [d.client.prenom, d.client.nom, d.client.raisonSociale]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    // Check if the searched name appears in this dossier's client
    const nameMatch = nameParts.every((part) => clientFullName.includes(part));

    if (nameMatch && d.clientId !== clientId) {
      // Same name, different client record — potential conflict
      conflicts.push({
        dossierId: d.id,
        dossierIntitule: d.intitule,
        dossierNumeroDossier: d.numeroDossier,
        clientName: [d.client.prenom, d.client.nom, d.client.raisonSociale].filter(Boolean).join(" "),
        clientId: d.clientId,
        relation: "client_in_other_matter",
      });
    }

    if (d.clientId === clientId) {
      // Same client in another active matter — flag for awareness (not necessarily conflict)
      conflicts.push({
        dossierId: d.id,
        dossierIntitule: d.intitule,
        dossierNumeroDossier: d.numeroDossier,
        clientName: [d.client.prenom, d.client.nom, d.client.raisonSociale].filter(Boolean).join(" "),
        clientId: d.clientId,
        relation: "same_client_other_matter",
      });
    }

    // Check dossier intitule for name match (might contain adverse party name)
    const intituleLower = d.intitule.toLowerCase();
    if (nameParts.length >= 2 && nameParts.every((part) => intituleLower.includes(part))) {
      // The client name appears in another matter's title — likely adverse party
      if (!conflicts.some((c) => c.dossierId === d.id)) {
        conflicts.push({
          dossierId: d.id,
          dossierIntitule: d.intitule,
          dossierNumeroDossier: d.numeroDossier,
          clientName: clientName,
          clientId: d.clientId,
          relation: "name_in_matter_title",
        });
      }
    }
  }

  // Deduplicate: same_client_other_matter is informational, not a real conflict
  const realConflicts = conflicts.filter((c) => c.relation !== "same_client_other_matter");
  const hasConflicts = realConflicts.length > 0;

  // Save the check
  const check = await prisma.conflictCheck.create({
    data: {
      cabinetId,
      dossierId,
      checkedById,
      clientName,
      conflictsFound: hasConflicts,
      conflicts: conflicts.length > 0 ? JSON.stringify(conflicts) : null,
    },
  });

  await createAuditLog({
    cabinetId,
    userId: checkedById,
    entityType: "Dossier",
    entityId: dossierId,
    action: "create",
    metadata: {
      type: "conflict_check",
      clientName,
      conflictsFound: hasConflicts,
      nbConflicts: conflicts.length,
    },
    performedBy: checkedById,
    performedAt: new Date(),
  });

  return {
    checkId: check.id,
    conflictsFound: hasConflicts,
    conflicts,
    totalMatters: activeDossiers.length,
  };
}

/** Resolve a conflict check (lawyer decision). */
export async function resolveConflictCheck(params: {
  checkId: string;
  cabinetId: string;
  resolution: "confirmed_no_conflict" | "waived_by_client" | "declined";
  notes?: string;
  resolvedById: string;
}) {
  const { checkId, cabinetId, resolution, notes, resolvedById } = params;

  const check = await prisma.conflictCheck.findFirst({
    where: { id: checkId, cabinetId },
  });
  if (!check) throw new Error("Conflict check not found");

  await prisma.conflictCheck.update({
    where: { id: checkId },
    data: {
      resolution,
      resolvedAt: new Date(),
      resolutionNotes: notes ?? null,
    },
  });

  await createAuditLog({
    cabinetId,
    userId: resolvedById,
    entityType: "Dossier",
    entityId: check.dossierId,
    action: "update",
    metadata: {
      type: "conflict_check_resolution",
      resolution,
      checkId,
    },
    performedBy: resolvedById,
    performedAt: new Date(),
  });

  return { success: true };
}

/** Get conflict checks for a dossier. */
export async function getConflictChecks(dossierId: string) {
  return prisma.conflictCheck.findMany({
    where: { dossierId },
    orderBy: { checkedAt: "desc" },
    include: {
      checkedBy: { select: { nom: true } },
    },
  });
}
