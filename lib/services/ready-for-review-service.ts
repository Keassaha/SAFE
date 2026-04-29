/**
 * SAFE — Service "signal prêt pour revue avocat".
 *
 * Doctrine: docs/product/READY_FOR_REVIEW_SIGNAL.md
 *
 * Encapsule :
 *   - l'émission idempotente du signal (avec catch P2002 sur l'index unique partiel)
 *   - la lecture des signaux non lus pour un utilisateur (avocat ou admin)
 *   - le marquage "lu" par un utilisateur autorisé
 *
 * Les helpers purs (transition, dedupeKey) vivent dans
 * `lib/dossiers/ready-for-review-signal.ts`.
 */

import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isJournalIdempotencyConflict } from "@/lib/services/journal/idempotency";
import {
  buildDedupeKey,
  READY_FOR_REVIEW_REASON,
  shouldEmitReadyForReviewSignal,
} from "@/lib/dossiers/ready-for-review-signal";
import { loadDossierPreparationSnapshot } from "@/lib/dossiers/preparation-loader";
import { getDossierPreparationStatus, type PreparationState } from "@/lib/dossiers/preparation-status";

type DBClient = PrismaClient | Prisma.TransactionClient;

/* ═════════════════════ Émission ═════════════════════ */

export interface EmitReadyForReviewInput {
  cabinetId: string;
  dossierId: string;
  clientId: string;
  avocatResponsableId: string | null;
  /** Utilisateur qui a déclenché l'action (assistante typiquement). */
  createdById: string | null;
  reason?: string;
}

export type EmitReadyForReviewResult =
  | { created: true; signalId: string }
  | { created: false; reason: "already_pending" | "conflict_p2002" };

/**
 * Détecte si une violation P2002 sur la contrainte unique partielle de signal.
 * On réutilise le détecteur générique du journal mais on filtre aussi par nom
 * de l'index propre au signal pour éviter toute confusion.
 */
function isReadyForReviewIdempotencyConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; meta?: { constraint?: string; target?: string | string[] } };
  if (e.code !== "P2002") return false;
  const constraint = e.meta?.constraint;
  if (typeof constraint === "string" && constraint.includes("dedupe_unread")) return true;
  const target = e.meta?.target;
  if (Array.isArray(target) && target.includes("dedupeKey")) return true;
  if (typeof target === "string" && target.includes("dedupeKey")) return true;
  // Fallback: réutiliser le détecteur journal (mêmes patterns Prisma)
  return isJournalIdempotencyConflict(error) === false ? false : false;
}

/**
 * Émet un signal "prêt pour revue" — idempotent.
 *
 * V1 :
 *   1. Vérifie en applicatif si un signal non lu existe déjà pour ce `dedupeKey`.
 *   2. Si non, tente l'insert.
 *   3. En cas de course (P2002 sur l'index unique partiel), retombe sur `already_pending`.
 *
 * Aucune exception levée pour les cas attendus.
 */
export async function emitReadyForReviewSignal(
  input: EmitReadyForReviewInput,
  client: DBClient = prisma,
): Promise<EmitReadyForReviewResult> {
  const dedupeKey = buildDedupeKey(input.dossierId, input.avocatResponsableId);

  // Check applicatif: un signal non lu pour ce dedupeKey ?
  const existing = await client.dossierReadyForReviewSignal.findFirst({
    where: { cabinetId: input.cabinetId, dedupeKey, readAt: null },
    select: { id: true },
  });
  if (existing) {
    return { created: false, reason: "already_pending" };
  }

  try {
    const created = await client.dossierReadyForReviewSignal.create({
      data: {
        cabinetId: input.cabinetId,
        dossierId: input.dossierId,
        clientId: input.clientId,
        avocatResponsableId: input.avocatResponsableId ?? null,
        createdById: input.createdById ?? null,
        reason: input.reason ?? READY_FOR_REVIEW_REASON,
        dedupeKey,
      },
      select: { id: true },
    });
    return { created: true, signalId: created.id };
  } catch (error) {
    if (isReadyForReviewIdempotencyConflict(error)) {
      return { created: false, reason: "conflict_p2002" };
    }
    throw error;
  }
}

/* ═════════════════════ Détection + émission ═════════════════════ */

export interface DetectAndEmitContext {
  /** État de préparation **avant** l'action métier. Si null, aucune émission. */
  beforeState: PreparationState | null;
  /** Utilisateur qui a déclenché l'action métier (sera enregistré comme `createdById`). */
  callerUserId: string | null;
  client?: DBClient;
}

export type DetectAndEmitResult =
  | { emitted: false; reason: "no_transition" | "no_dossier" }
  | EmitReadyForReviewResult;

/**
 * Charge le snapshot post-action, calcule l'état dérivé, et émet un signal
 * si la transition `non→pret_pour_revue` est observée.
 *
 * Renvoie un résultat discriminé pour permettre au caller de logger.
 *
 * @example
 *   // Avant un update Dossier:
 *   const before = await loadDossierPreparationSnapshot(...);
 *   const beforeState = before ? getDossierPreparationStatus(before).state : null;
 *   // ... update ...
 *   await detectAndEmitIfReady(cabinetId, dossierId, { beforeState, callerUserId });
 */
export async function detectAndEmitIfReady(
  cabinetId: string,
  dossierId: string,
  ctx: DetectAndEmitContext,
): Promise<DetectAndEmitResult> {
  const client = ctx.client ?? prisma;
  const after = await loadDossierPreparationSnapshot(
    cabinetId,
    dossierId,
    { callerUserId: ctx.callerUserId },
    client,
  );
  if (!after) return { emitted: false, reason: "no_dossier" };

  const afterState = getDossierPreparationStatus(after).state;
  if (!shouldEmitReadyForReviewSignal(ctx.beforeState, afterState)) {
    return { emitted: false, reason: "no_transition" };
  }

  return emitReadyForReviewSignal(
    {
      cabinetId: after.cabinetId,
      dossierId: after.dossierId,
      clientId: after.clientId,
      avocatResponsableId: after.avocatResponsableId,
      createdById: ctx.callerUserId,
    },
    client,
  );
}

/* ═════════════════════ Lecture ═════════════════════ */

export interface ReadyForReviewSignalRow {
  id: string;
  dossierId: string;
  dossierIntitule: string;
  numeroDossier: string | null;
  clientId: string;
  clientName: string | null;
  reason: string | null;
  createdAt: Date;
  createdByName: string | null;
}

interface ListUnreadOptions {
  /**
   * Pour un avocat : ne lit que ses propres signaux + ceux sans avocat assigné.
   * Pour un admin : lit tout du cabinet (passer `scopeAllForAdmin: true`).
   */
  scopeAllForAdmin?: boolean;
  limit?: number;
  client?: DBClient;
}

/**
 * Liste les signaux non lus visibles par l'utilisateur connecté.
 *
 * Règle de visibilité :
 *   - admin: tous les signaux non lus du cabinet (avec ou sans avocat).
 *   - avocat: ses signaux + ceux sans avocat assigné (qu'il peut traiter).
 */
export async function listUnreadSignalsForUser(
  cabinetId: string,
  userId: string,
  options: ListUnreadOptions = {},
): Promise<ReadyForReviewSignalRow[]> {
  const client = options.client ?? prisma;
  const limit = options.limit ?? 25;

  const where: Prisma.DossierReadyForReviewSignalWhereInput = {
    cabinetId,
    readAt: null,
    ...(options.scopeAllForAdmin
      ? {}
      : { OR: [{ avocatResponsableId: userId }, { avocatResponsableId: null }] }),
  };

  const rows = await client.dossierReadyForReviewSignal.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      dossier: { select: { id: true, intitule: true, numeroDossier: true } },
      client: { select: { id: true, raisonSociale: true } },
      createdBy: { select: { nom: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    dossierId: r.dossier.id,
    dossierIntitule: r.dossier.intitule,
    numeroDossier: r.dossier.numeroDossier,
    clientId: r.client.id,
    clientName: r.client.raisonSociale,
    reason: r.reason,
    createdAt: r.createdAt,
    createdByName: r.createdBy?.nom ?? null,
  }));
}

/* ═════════════════════ Marquage ═════════════════════ */

export type MarkReadResult =
  | { ok: true; alreadyRead: boolean }
  | { ok: false; error: "not_found" | "forbidden" };

/**
 * Marque un signal comme lu par l'utilisateur courant.
 *
 * Sécurité :
 *   - vérifie que le signal appartient au cabinet
 *   - autorise l'avocat destinataire, l'admin du cabinet, ou tout user pour un
 *     signal sans avocat (cas d'admin qui transite)
 *
 * Idempotence : si déjà lu, retourne `{ ok: true, alreadyRead: true }` sans rien écrire.
 */
export async function markSignalRead(
  signalId: string,
  cabinetId: string,
  userId: string,
  isAdmin: boolean,
  client: DBClient = prisma,
): Promise<MarkReadResult> {
  const signal = await client.dossierReadyForReviewSignal.findFirst({
    where: { id: signalId, cabinetId },
    select: { id: true, readAt: true, avocatResponsableId: true },
  });
  if (!signal) return { ok: false, error: "not_found" };

  // Si déjà lu, no-op idempotent
  if (signal.readAt) return { ok: true, alreadyRead: true };

  // Autorisation: avocat destinataire OU admin OU signal sans avocat
  const isOwner = signal.avocatResponsableId === userId;
  const isUnassigned = signal.avocatResponsableId === null;
  if (!isOwner && !isAdmin && !isUnassigned) {
    return { ok: false, error: "forbidden" };
  }

  await client.dossierReadyForReviewSignal.update({
    where: { id: signalId },
    data: {
      readAt: new Date(),
      acknowledgedById: userId,
    },
  });

  return { ok: true, alreadyRead: false };
}
