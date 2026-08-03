/**
 * Accès d'inspection : ouverture, révocation, journalisation.
 *
 * Art. 29 B-1 r.5 — les livres sont accessibles en tout temps au syndic, à ses
 * enquêteurs, au directeur de l'inspection professionnelle et à ses experts.
 *
 * Le service n'expose AUCUNE écriture métier. Il ouvre une session, la ferme, et
 * consigne ce qui a été lu. C'est délibérément tout ce qu'il sait faire.
 */

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince } from "@/lib/compliance/rules";
import {
  canInspectionRead,
  evaluateAccess,
  findMissingGrantFields,
  getGrantRequirements,
  resolveExpiry,
  type AccessEvaluation,
  type InspectionResource,
} from "@/lib/compliance/inspection-access";

export class InspectionAccessError extends Error {
  readonly code:
    | "MISSING_GRANT_FIELDS"
    | "SESSION_NOT_FOUND"
    | "SESSION_NOT_ACTIVE"
    | "RESOURCE_OUT_OF_SCOPE";
  readonly reference = "B-1 r.5, art. 29";

  constructor(params: { code: InspectionAccessError["code"]; message: string; remedy: string }) {
    super(`${params.message} (B-1 r.5, art. 29) ${params.remedy}`);
    this.name = "InspectionAccessError";
    this.code = params.code;
  }
}

/** Le jeton n'est jamais conservé en clair : seule son empreinte l'est. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/* ════════════════════════════════════════════════════════════════
   OUVERTURE
   ════════════════════════════════════════════════════════════════ */

export interface GrantAccessResult {
  sessionId: string;
  /** Rendu UNE SEULE FOIS, à l'ouverture. Il n'est plus jamais récupérable ensuite. */
  token: string;
  expiresAt: Date;
}

/**
 * Ouvre un accès d'inspection.
 *
 * Trois champs sont exigés — nom, organisme, motif — parce qu'un accès anonyme
 * donnerait un journal qui ne prouve rien, et que le cabinet reste tenu au secret
 * professionnel de ses clients.
 */
export async function grantInspectionAccess(params: {
  cabinetId: string;
  inspectorName: string;
  inspectorOrganization: string;
  purpose: string;
  days?: number | null;
  scopeFrom?: Date | null;
  scopeTo?: Date | null;
  grantedByUserId: string;
  now?: Date;
}): Promise<GrantAccessResult> {
  const now = params.now ?? new Date();
  const province = resolveProvince(await getCabinetProvince(params.cabinetId));

  const missing = findMissingGrantFields(params);
  if (missing.length > 0) {
    const reqs = getGrantRequirements(province).filter((r) => missing.includes(r.field));
    throw new InspectionAccessError({
      code: "MISSING_GRANT_FIELDS",
      message: `Champs manquants : ${reqs.map((r) => r.labelFr).join(", ")}.`,
      remedy: reqs.map((r) => r.whyFr).join(" "),
    });
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = resolveExpiry({ grantedAt: now, days: params.days });

  const session = await prisma.inspectionAccessSession.create({
    data: {
      cabinetId: params.cabinetId,
      inspectorName: params.inspectorName.trim(),
      inspectorOrganization: params.inspectorOrganization.trim(),
      purpose: params.purpose.trim(),
      tokenHash: hashToken(token),
      scopeFrom: params.scopeFrom ?? null,
      scopeTo: params.scopeTo ?? null,
      grantedAt: now,
      grantedByUserId: params.grantedByUserId,
      expiresAt,
      province,
    },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.grantedByUserId,
    entityType: "Cabinet",
    entityId: session.id,
    action: "create",
    newValues: {
      type: "inspection_access_granted",
      inspectorName: params.inspectorName,
      inspectorOrganization: params.inspectorOrganization,
      purpose: params.purpose,
      expiresAt: expiresAt.toISOString(),
      reference: "B-1 r.5, art. 29",
    },
    performedBy: params.grantedByUserId,
    performedAt: now,
  });

  return { sessionId: session.id, token, expiresAt };
}

/**
 * Ferme un accès avant son terme.
 *
 * La session n'est pas supprimée : le journal des consultations qui y pend doit rester
 * lisible. Un accès révoqué dont l'historique disparaîtrait ne prouverait plus rien.
 */
export async function revokeInspectionAccess(params: {
  cabinetId: string;
  sessionId: string;
  reason?: string | null;
  revokedByUserId: string;
  now?: Date;
}): Promise<void> {
  const now = params.now ?? new Date();
  const session = await prisma.inspectionAccessSession.findFirst({
    where: { id: params.sessionId, cabinetId: params.cabinetId },
  });
  if (!session) {
    throw new InspectionAccessError({
      code: "SESSION_NOT_FOUND",
      message: "Accès d'inspection introuvable.",
      remedy: "Vérifiez la liste des accès du cabinet.",
    });
  }

  await prisma.inspectionAccessSession.update({
    where: { id: session.id },
    data: {
      revokedAt: session.revokedAt ?? now,
      revokedByUserId: params.revokedByUserId,
      revokedReason: params.reason ?? null,
    },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.revokedByUserId,
    entityType: "Cabinet",
    entityId: session.id,
    action: "update",
    newValues: {
      type: "inspection_access_revoked",
      reason: params.reason ?? null,
      reference: "B-1 r.5, art. 29",
    },
    performedBy: params.revokedByUserId,
    performedAt: now,
  });
}

/* ════════════════════════════════════════════════════════════════
   RÉSOLUTION ET LECTURE
   ════════════════════════════════════════════════════════════════ */

export interface ResolvedInspectionSession {
  id: string;
  cabinetId: string;
  inspectorName: string;
  inspectorOrganization: string;
  scopeFrom: Date | null;
  scopeTo: Date | null;
  evaluation: AccessEvaluation;
}

/**
 * Résout un jeton en session utilisable.
 *
 * Une session expirée ou révoquée est REFUSÉE, jamais tolérée avec un avertissement :
 * une porte qu'on laisse entrouverte parce qu'elle vient juste de se fermer n'est pas
 * une porte fermée.
 */
export async function resolveInspectionSession(params: {
  token: string;
  now?: Date;
}): Promise<ResolvedInspectionSession> {
  const now = params.now ?? new Date();
  const session = await prisma.inspectionAccessSession.findUnique({
    where: { tokenHash: hashToken(params.token) },
  });

  if (!session) {
    throw new InspectionAccessError({
      code: "SESSION_NOT_FOUND",
      message: "Accès d'inspection inconnu.",
      remedy: "Demandez au cabinet d'ouvrir un nouvel accès.",
    });
  }

  const evaluation = evaluateAccess({
    expiresAt: session.expiresAt,
    revokedAt: session.revokedAt,
    now,
  });

  if (evaluation.state !== "ACTIVE") {
    throw new InspectionAccessError({
      code: "SESSION_NOT_ACTIVE",
      message: evaluation.messageFr,
      remedy: "Le cabinet peut ouvrir un nouvel accès depuis ses paramètres de conformité.",
    });
  }

  return {
    id: session.id,
    cabinetId: session.cabinetId,
    inspectorName: session.inspectorName,
    inspectorOrganization: session.inspectorOrganization,
    scopeFrom: session.scopeFrom,
    scopeTo: session.scopeTo,
    evaluation,
  };
}

/**
 * Consigne une consultation.
 *
 * Appelée AVANT de servir la donnée, pas après : si la journalisation échoue, rien
 * n'est montré. Un accès qui laisse une trace incomplète vaut moins qu'un accès refusé.
 */
export async function logInspectionRead(params: {
  sessionId: string;
  resource: InspectionResource;
  resourceId?: string | null;
  detail?: string | null;
  now?: Date;
}): Promise<void> {
  if (!canInspectionRead(params.resource)) {
    throw new InspectionAccessError({
      code: "RESOURCE_OUT_OF_SCOPE",
      message: `La ressource « ${params.resource} » n'est pas ouverte à la consultation d'inspection.`,
      remedy:
        "Le périmètre est une liste blanche : une ressource ajoutée récemment n'y est pas tant que personne ne l'a décidé.",
    });
  }

  await prisma.inspectionAccessRead.create({
    data: {
      sessionId: params.sessionId,
      resource: params.resource,
      resourceId: params.resourceId ?? null,
      detail: params.detail ?? null,
      readAt: params.now ?? new Date(),
    },
  });
}

/* ════════════════════════════════════════════════════════════════
   VUE CABINET
   ════════════════════════════════════════════════════════════════ */

export interface InspectionSessionSummary {
  id: string;
  inspectorName: string;
  inspectorOrganization: string;
  purpose: string;
  grantedAt: Date;
  expiresAt: Date;
  evaluation: AccessEvaluation;
  readCount: number;
}

/** Accès ouverts et passés, avec le nombre de consultations de chacun. */
export async function listInspectionSessions(params: {
  cabinetId: string;
  now?: Date;
}): Promise<InspectionSessionSummary[]> {
  const now = params.now ?? new Date();
  const rows = await prisma.inspectionAccessSession.findMany({
    where: { cabinetId: params.cabinetId },
    orderBy: { grantedAt: "desc" },
    include: { _count: { select: { reads: true } } },
  });

  return rows.map((r) => ({
    id: r.id,
    inspectorName: r.inspectorName,
    inspectorOrganization: r.inspectorOrganization,
    purpose: r.purpose,
    grantedAt: r.grantedAt,
    expiresAt: r.expiresAt,
    evaluation: evaluateAccess({ expiresAt: r.expiresAt, revokedAt: r.revokedAt, now }),
    readCount: r._count.reads,
  }));
}

/** Journal détaillé d'un accès. C'est ce que le cabinet montre s'il doit se justifier. */
export async function getInspectionReadLog(params: {
  cabinetId: string;
  sessionId: string;
}): Promise<Array<{ resource: string; resourceId: string | null; detail: string | null; readAt: Date }>> {
  const session = await prisma.inspectionAccessSession.findFirst({
    where: { id: params.sessionId, cabinetId: params.cabinetId },
    select: { id: true },
  });
  if (!session) return [];

  const reads = await prisma.inspectionAccessRead.findMany({
    where: { sessionId: session.id },
    orderBy: { readAt: "asc" },
  });
  return reads.map((r) => ({
    resource: r.resource,
    resourceId: r.resourceId,
    detail: r.detail,
    readAt: r.readAt,
  }));
}
