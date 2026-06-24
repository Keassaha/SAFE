/**
 * SAFE — Navette : service (I/O). Communication interne centrée dossier.
 *
 * Doctrine + spec : docs/product/SPEC_aaliyah_home_navette.md
 *
 * Pont avec l'existant : `markReadyForReview` émet le signal legacy
 * (`emitReadyForReviewSignal`, pour l'inbox avocate déjà câblé) ET écrit un
 * message Navette `ready_for_review` (pour le fil unifié). `approveMatter`
 * acquitte le signal + écrit un message `approved`.
 *
 * Les helpers de permission PURS vivent dans `navette-permissions.ts`.
 */

import type { NavetteMessageType, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { emitReadyForReviewSignal, markSignalRead } from "@/lib/services/ready-for-review-service";
import { canSendNavetteType } from "./navette-permissions";

type DBClient = PrismaClient | Prisma.TransactionClient;

export interface NavetteRow {
  id: string;
  dossierId: string;
  dossierIntitule: string;
  numeroDossier: string | null;
  type: NavetteMessageType;
  body: string | null;
  authorId: string;
  authorName: string | null;
  authorRole: string;
  recipientId: string | null;
  dueDate: Date | null;
  confidentiel: boolean;
  readAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
}

/* ───────── Parties d'un dossier (destinataires) ───────── */

interface DossierParties {
  cabinetId: string;
  avocatResponsableId: string | null;
  assistantJuridiqueId: string | null;
}

async function getDossierParties(
  cabinetId: string,
  dossierId: string,
  client: DBClient,
): Promise<DossierParties | null> {
  const d = await client.dossier.findFirst({
    where: { id: dossierId, cabinetId },
    select: { cabinetId: true, avocatResponsableId: true, assistantJuridiqueId: true },
  });
  return d ?? null;
}

/* ───────── Création générique ───────── */

export interface CreateNavetteInput {
  cabinetId: string;
  dossierId: string;
  authorId: string;
  authorRole: string;
  type: NavetteMessageType;
  recipientId?: string | null;
  body?: string | null;
  dueDate?: Date | null;
  parentId?: string | null;
  /** Réf. stable de la source (ex: "acte:{id}") pour dédupliquer les signaux dérivés. */
  sourceRef?: string | null;
  confidentiel?: boolean;
}

export type CreateNavetteResult =
  | { ok: true; id: string }
  | { ok: false; error: "forbidden" | "not_found" };

/**
 * Insère un message de Navette après contrôle de permission par type.
 * `recipientId` par défaut = l'autre partie du dossier selon le rôle de l'auteur.
 */
export async function createNavetteMessage(
  input: CreateNavetteInput,
  client: DBClient = prisma,
): Promise<CreateNavetteResult> {
  if (!canSendNavetteType(input.authorRole, input.type)) {
    return { ok: false, error: "forbidden" };
  }
  const parties = await getDossierParties(input.cabinetId, input.dossierId, client);
  if (!parties) return { ok: false, error: "not_found" };

  // Destinataire implicite : l'avocate écrit à l'assistante, et inversement.
  const recipientId =
    input.recipientId !== undefined
      ? input.recipientId
      : input.authorRole === "assistante"
        ? parties.avocatResponsableId
        : parties.assistantJuridiqueId;

  const created = await client.dossierNavetteMessage.create({
    data: {
      cabinetId: input.cabinetId,
      dossierId: input.dossierId,
      authorId: input.authorId,
      authorRole: input.authorRole,
      recipientId: recipientId ?? null,
      type: input.type,
      body: input.body ?? null,
      dueDate: input.dueDate ?? null,
      parentId: input.parentId ?? null,
      sourceRef: input.sourceRef ?? null,
      confidentiel: input.confidentiel ?? false,
    },
    select: { id: true },
  });
  return { ok: true, id: created.id };
}

/* ───────── Handoffs structurés ───────── */

/**
 * Résout les « prêt pour revue » en attente d'un dossier : appelé quand
 * l'avocate tranche (approuve ou renvoie) → le signal sort de sa file « needs me ».
 */
async function resolvePendingReadyForReview(
  cabinetId: string,
  dossierId: string,
  userId: string,
  client: DBClient,
): Promise<void> {
  await client.dossierNavetteMessage.updateMany({
    where: { cabinetId, dossierId, type: "ready_for_review", resolvedAt: null },
    data: { resolvedAt: new Date(), resolvedById: userId },
  });
}

/** Avocate → assistante : renvoi avec raison + échéance optionnelle. */
export async function sendBackToAssistant(
  args: { cabinetId: string; dossierId: string; authorId: string; authorRole: string; reason: string; dueDate?: Date | null },
  client: DBClient = prisma,
): Promise<CreateNavetteResult> {
  const res = await createNavetteMessage(
    { ...args, type: "sent_back", body: args.reason, dueDate: args.dueDate ?? null },
    client,
  );
  if (res.ok) await resolvePendingReadyForReview(args.cabinetId, args.dossierId, args.authorId, client);
  return res;
}

/** Avocate → assistante : approbation. Acquitte aussi le signal legacy. */
export async function approveMatter(
  args: { cabinetId: string; dossierId: string; authorId: string; authorRole: string; isAdmin: boolean; note?: string | null; signalId?: string | null },
  client: DBClient = prisma,
): Promise<CreateNavetteResult> {
  const res = await createNavetteMessage(
    { cabinetId: args.cabinetId, dossierId: args.dossierId, authorId: args.authorId, authorRole: args.authorRole, type: "approved", body: args.note ?? null },
    client,
  );
  if (res.ok) {
    await resolvePendingReadyForReview(args.cabinetId, args.dossierId, args.authorId, client);
    if (args.signalId) {
      await markSignalRead(args.signalId, args.cabinetId, args.authorId, args.isAdmin, client);
    }
  }
  return res;
}

/** Assistante → avocate : prêt pour revue. Écrit le message + émet le signal legacy. */
export async function markReadyForReview(
  args: { cabinetId: string; dossierId: string; authorId: string; authorRole: string; note?: string | null },
  client: DBClient = prisma,
): Promise<CreateNavetteResult> {
  const parties = await getDossierParties(args.cabinetId, args.dossierId, client);
  if (!parties) return { ok: false, error: "not_found" };

  const res = await createNavetteMessage(
    {
      cabinetId: args.cabinetId,
      dossierId: args.dossierId,
      authorId: args.authorId,
      authorRole: args.authorRole,
      type: "ready_for_review",
      recipientId: parties.avocatResponsableId,
      body: args.note ?? null,
    },
    client,
  );
  if (!res.ok) return res;

  // Pont : signal legacy pour l'inbox avocate existant.
  const dossier = await client.dossier.findFirst({
    where: { id: args.dossierId, cabinetId: args.cabinetId },
    select: { clientId: true },
  });
  if (dossier) {
    await emitReadyForReviewSignal(
      {
        cabinetId: args.cabinetId,
        dossierId: args.dossierId,
        clientId: dossier.clientId,
        avocatResponsableId: parties.avocatResponsableId,
        createdById: args.authorId,
      },
      client,
    );
  }
  return res;
}

/* ───────── Lecture ───────── */

const ROW_INCLUDE = {
  dossier: { select: { intitule: true, numeroDossier: true } },
  author: { select: { nom: true } },
} satisfies Prisma.DossierNavetteMessageInclude;

function toRow(r: Prisma.DossierNavetteMessageGetPayload<{ include: typeof ROW_INCLUDE }>): NavetteRow {
  return {
    id: r.id,
    dossierId: r.dossierId,
    dossierIntitule: r.dossier.intitule,
    numeroDossier: r.dossier.numeroDossier,
    type: r.type,
    body: r.body,
    authorId: r.authorId,
    authorName: r.author?.nom ?? null,
    authorRole: r.authorRole,
    recipientId: r.recipientId,
    dueDate: r.dueDate,
    confidentiel: r.confidentiel,
    readAt: r.readAt,
    resolvedAt: r.resolvedAt,
    createdAt: r.createdAt,
  };
}

/** Fil complet d'un dossier (antéchronologique). */
export async function getDossierNavette(
  cabinetId: string,
  dossierId: string,
  viewerRole: string,
  client: DBClient = prisma,
): Promise<NavetteRow[]> {
  const rows = await client.dossierNavetteMessage.findMany({
    where: {
      cabinetId,
      dossierId,
      // confidentiel masqué pour l'assistante
      ...(viewerRole === "assistante" ? { confidentiel: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: ROW_INCLUDE,
  });
  return rows.map(toRow);
}

export type NavetteFilter = "all" | "needs_me" | "sent_for_review" | "approved";

/** Boîte unifiée multi-dossiers (pour le dashboard Today). */
export async function getNavetteInbox(
  cabinetId: string,
  userId: string,
  viewerRole: string,
  filter: NavetteFilter = "all",
  limit = 30,
  client: DBClient = prisma,
): Promise<NavetteRow[]> {
  const base: Prisma.DossierNavetteMessageWhereInput = {
    cabinetId,
    ...(viewerRole === "assistante" ? { confidentiel: false } : {}),
  };

  let where: Prisma.DossierNavetteMessageWhereInput = base;
  if (filter === "needs_me") {
    where = { ...base, recipientId: userId, resolvedAt: null };
  } else if (filter === "sent_for_review") {
    where = { ...base, type: "ready_for_review", authorId: userId };
  } else if (filter === "approved") {
    where = { ...base, type: "approved" };
  }

  const rows = await client.dossierNavetteMessage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: ROW_INCLUDE,
  });
  return rows.map(toRow);
}

/** Badge « needs me » : messages qui m'attendent et non résolus. */
export function countNeedsMe(
  cabinetId: string,
  userId: string,
  client: DBClient = prisma,
): Promise<number> {
  return client.dossierNavetteMessage.count({
    where: { cabinetId, recipientId: userId, resolvedAt: null },
  });
}

/* ───────── Cycle de vie ───────── */

export async function markNavetteRead(
  id: string,
  cabinetId: string,
  userId: string,
  client: DBClient = prisma,
): Promise<{ ok: boolean }> {
  const msg = await client.dossierNavetteMessage.findFirst({
    where: { id, cabinetId },
    select: { id: true, readAt: true },
  });
  if (!msg) return { ok: false };
  if (!msg.readAt) {
    await client.dossierNavetteMessage.update({
      where: { id },
      data: { readAt: new Date(), readById: userId },
    });
  }
  return { ok: true };
}

/** Marque un message « traité » (addressed/fixed) — par son destinataire. */
export async function resolveNavetteMessage(
  id: string,
  cabinetId: string,
  userId: string,
  client: DBClient = prisma,
): Promise<{ ok: boolean }> {
  const msg = await client.dossierNavetteMessage.findFirst({
    where: { id, cabinetId },
    select: { id: true, resolvedAt: true },
  });
  if (!msg) return { ok: false };
  if (!msg.resolvedAt) {
    await client.dossierNavetteMessage.update({
      where: { id },
      data: { resolvedAt: new Date(), resolvedById: userId },
    });
  }
  return { ok: true };
}
