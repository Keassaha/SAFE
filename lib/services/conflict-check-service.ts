/**
 * Service de vérification automatique des conflits d'intérêts.
 * LAWPRO top cause de réclamations. LSO Rules of Professional Conduct.
 *
 * Vérifie si le nom du client ou des parties liées apparaît dans
 * d'autres dossiers actifs du cabinet comme partie adverse ou partie.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { normalizeClientName, clientDedupeKey } from "@/lib/clients/normalize-name";

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

// --- Vérification au niveau client (avant création de dossier) ---

export type ClientConflictCheckStatus = "clear" | "possible_match" | "high_risk" | "error";

export type ClientConflictMatchKind = "client" | "dossier" | "adverse_party" | "other";

export interface ClientConflictMatch {
  kind: ClientConflictMatchKind;
  id: string;
  label: string;
  reason: string;
  risk: "low" | "medium" | "high";
  href?: string;
}

export interface ClientConflictCheckResult {
  status: ClientConflictCheckStatus;
  checkedAt: string;
  query: string;
  matches: ClientConflictMatch[];
}

export interface ClientConflictCheckInput {
  typeClient?: "personne_physique" | "personne_morale" | string | null;
  raisonSociale?: string | null;
  prenom?: string | null;
  nom?: string | null;
  email?: string | null;
}

const MIN_QUERY_LENGTH = 3;
const ACTIVE_DOSSIER_STATUTS = ["ouvert", "actif", "en_attente"] as const;

/**
 * Vérification de conflit déclenchée à la création d'un client.
 *
 * Pure : ne persiste rien. Le résultat est figé côté wizard puis archivé
 * dans `Client.conflictNotes` lors de la création effective.
 *
 * Recherche dans le cabinet courant :
 *  - clients existants (clé de dédoublonnage normalisée + email exact)
 *  - dossiers actifs (intitulé contenant le nom = potentielle partie adverse,
 *    référence/numéro de dossier en correspondance exacte)
 *  - historique ConflictCheck pour signaler une vérification antérieure
 */
export async function runClientConflictCheck(
  cabinetId: string,
  input: ClientConflictCheckInput
): Promise<ClientConflictCheckResult> {
  const checkedAt = new Date().toISOString();
  const query = buildClientQuery(input);

  if (query.length < MIN_QUERY_LENGTH) {
    return { status: "clear", checkedAt, query, matches: [] };
  }

  const normalized = normalizeClientName(query);
  const tokens = normalized.split(/\s+/).filter((t) => t.length >= 2);
  const dedupeKey = clientDedupeKey({
    typeClient: input.typeClient ?? undefined,
    raisonSociale: input.raisonSociale,
    prenom: input.prenom,
    nom: input.nom,
  });
  const emailLower = input.email?.trim().toLowerCase() || null;

  if (tokens.length === 0 && !dedupeKey && !emailLower) {
    return { status: "clear", checkedAt, query, matches: [] };
  }

  const matches: ClientConflictMatch[] = [];
  const matchingClientIds = new Set<string>();

  try {
    // 1. Clients existants — même clé normalisée ou même email
    const candidates = await prisma.client.findMany({
      where: { cabinetId, status: { not: "archive" } },
      select: {
        id: true,
        typeClient: true,
        raisonSociale: true,
        prenom: true,
        nom: true,
        email: true,
      },
      take: 500,
    });

    for (const c of candidates) {
      const candidateKey = clientDedupeKey({
        typeClient: c.typeClient,
        raisonSociale: c.raisonSociale,
        prenom: c.prenom,
        nom: c.nom,
      });
      const sameKey = dedupeKey.length > 0 && candidateKey === dedupeKey;
      const sameEmail = emailLower && c.email && c.email.toLowerCase() === emailLower;
      if (!sameKey && !sameEmail) continue;

      matchingClientIds.add(c.id);
      matches.push({
        kind: "client",
        id: c.id,
        label: formatClientLabel(c),
        reason: sameKey ? "existing_client_same_name" : "existing_client_same_email",
        risk: "medium",
        href: `/clients/${c.id}`,
      });
    }

    // 2. Dossiers actifs — intitulé / référence
    if (tokens.length > 0) {
      const dossiers = await prisma.dossier.findMany({
        where: {
          cabinetId,
          statut: { in: [...ACTIVE_DOSSIER_STATUTS] },
        },
        select: {
          id: true,
          intitule: true,
          numeroDossier: true,
          reference: true,
          clientId: true,
        },
        take: 500,
      });

      for (const d of dossiers) {
        const intituleNorm = normalizeClientName(d.intitule);
        const intituleHits = intituleNorm.length > 0 && tokens.every((t) => intituleNorm.includes(t));
        const refValue = [d.numeroDossier, d.reference].filter(Boolean).join(" ").trim();
        const refNorm = refValue ? normalizeClientName(refValue) : "";
        const refHits = refNorm.length > 0 && tokens.every((t) => refNorm.includes(t));
        if (!intituleHits && !refHits) continue;

        const linkedToMatchingClient = matchingClientIds.has(d.clientId);

        if (intituleHits && !linkedToMatchingClient) {
          matches.push({
            kind: "adverse_party",
            id: d.id,
            label: d.intitule,
            reason: "name_in_other_matter_title",
            risk: "high",
            href: `/dossiers/${d.id}`,
          });
        } else if (intituleHits) {
          matches.push({
            kind: "dossier",
            id: d.id,
            label: d.intitule,
            reason: "matter_for_existing_client",
            risk: "low",
            href: `/dossiers/${d.id}`,
          });
        } else if (refHits) {
          matches.push({
            kind: "dossier",
            id: d.id,
            label: `${d.numeroDossier ?? d.reference ?? ""} — ${d.intitule}`.trim(),
            reason: "matching_reference",
            risk: "low",
            href: `/dossiers/${d.id}`,
          });
        }
      }
    }

    // 3. Historique des contrôles de conflit
    if (tokens.length > 0) {
      const historic = await prisma.conflictCheck.findMany({
        where: { cabinetId, conflictsFound: true },
        select: { id: true, clientName: true, dossierId: true, checkedAt: true },
        orderBy: { checkedAt: "desc" },
        take: 50,
      });
      for (const h of historic) {
        const hn = normalizeClientName(h.clientName);
        if (hn.length === 0) continue;
        if (!tokens.every((t) => hn.includes(t))) continue;
        matches.push({
          kind: "other",
          id: h.id,
          label: h.clientName,
          reason: "previous_conflict_recorded",
          risk: "medium",
          href: `/dossiers/${h.dossierId}`,
        });
      }
    }
  } catch {
    return { status: "error", checkedAt, query, matches: [] };
  }

  const hasHigh = matches.some((m) => m.risk === "high");
  const hasMediumOrLow = matches.length > 0;
  const status: ClientConflictCheckStatus = hasHigh
    ? "high_risk"
    : hasMediumOrLow
      ? "possible_match"
      : "clear";

  return { status, checkedAt, query, matches };
}

function buildClientQuery(input: ClientConflictCheckInput): string {
  const isPhysique = input.typeClient === "personne_physique";
  if (isPhysique) {
    const parts = [input.prenom, input.nom].map((s) => s?.trim() ?? "").filter(Boolean);
    if (parts.length > 0) return parts.join(" ");
    return (input.nom ?? "").trim();
  }
  return (input.raisonSociale ?? "").trim();
}

function formatClientLabel(c: {
  raisonSociale: string | null;
  prenom: string | null;
  nom: string | null;
}): string {
  if (c.raisonSociale && c.raisonSociale.trim()) return c.raisonSociale;
  const composed = [c.prenom, c.nom].filter(Boolean).join(" ").trim();
  return composed || "—";
}
