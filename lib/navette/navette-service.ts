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
import {
  canSendNavetteType,
  canViewNavetteMessage,
  checkNavetteDecision,
  checkNavetteResolve,
  type NavetteGuardReason,
} from "./navette-permissions";

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
  recipientName: string | null;
  parentId: string | null;
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
  | { ok: false; error: "forbidden" | "not_found" | "already_pending" };

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

  // Idempotence : un signal dérivé portant un sourceRef ne doit jamais être
  // dupliqué (retry d'une mutation métier, run concurrent du scan d'échéances).
  // On renvoie le message existant plutôt que d'en créer un second.
  if (input.sourceRef) {
    const existing = await client.dossierNavetteMessage.findFirst({
      where: { cabinetId: input.cabinetId, type: input.type, sourceRef: input.sourceRef },
      select: { id: true },
    });
    if (existing) return { ok: true, id: existing.id };
  }

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
 * Ferme UNE demande précise, et elle seule.
 *
 * Ce que ça remplace : un `updateMany` sur « toutes les demandes non résolues
 * du dossier ». Une avocate qui approuvait la version 3 fermait aussi, sans le
 * savoir, la question posée la veille sur le même dossier.
 *
 * L'update est CONDITIONNEL (`resolvedAt: null` dans le `where`) : c'est lui
 * qui interdit la double décision, y compris sur deux onglets ouverts en même
 * temps. `count === 0` veut dire « quelqu'un a tranché avant vous ».
 */
async function closeRequest(
  requestId: string,
  cabinetId: string,
  userId: string,
  client: DBClient,
): Promise<boolean> {
  const res = await client.dossierNavetteMessage.updateMany({
    where: { id: requestId, cabinetId, resolvedAt: null },
    data: { resolvedAt: new Date(), resolvedById: userId },
  });
  return res.count > 0;
}

export type DecideResult =
  | { ok: true; id: string; dossierId: string }
  | { ok: false; error: NavetteGuardReason | "not_found" };

interface DecideArgs {
  cabinetId: string;
  requestId: string;
  userId: string;
  role: string;
  /** Motif du renvoi (obligatoire) ou note d'approbation (facultative). */
  body?: string | null;
  dueDate?: Date | null;
  isAdmin?: boolean;
  signalId?: string | null;
}

/** Lit la demande visée et vérifie qu'on a le droit de trancher dessus. */
async function loadDecidableRequest(
  args: DecideArgs,
  decision: "approve" | "send_back",
  client: DBClient,
) {
  const request = await client.dossierNavetteMessage.findFirst({
    where: { id: args.requestId, cabinetId: args.cabinetId },
    select: {
      id: true,
      dossierId: true,
      type: true,
      authorId: true,
      recipientId: true,
      resolvedAt: true,
      confidentiel: true,
    },
  });
  if (!request) return { request: null, guard: { ok: false as const, error: "not_found" as const } };
  const verdict = checkNavetteDecision({
    role: args.role,
    userId: args.userId,
    decision,
    request,
  });
  if (!verdict.ok) return { request, guard: { ok: false as const, error: verdict.reason } };
  return { request, guard: { ok: true as const } };
}

/**
 * Avocate → assistante : « Demander une correction » sur une demande précise.
 * Le motif n'est pas facultatif : c'est lui qui dit quoi corriger.
 */
export async function sendBackToAssistant(
  args: DecideArgs,
  client: DBClient = prisma,
): Promise<DecideResult> {
  const reason = (args.body ?? "").trim();
  if (!reason) return { ok: false, error: "forbidden" };

  const { request, guard } = await loadDecidableRequest(args, "send_back", client);
  if (!guard.ok || !request) return { ok: false, error: guard.ok ? "not_found" : guard.error };

  if (!(await closeRequest(request.id, args.cabinetId, args.userId, client))) {
    return { ok: false, error: "already_resolved" };
  }

  const res = await createNavetteMessage(
    {
      cabinetId: args.cabinetId,
      dossierId: request.dossierId,
      authorId: args.userId,
      authorRole: args.role,
      type: "sent_back",
      recipientId: request.authorId,
      parentId: request.id,
      body: reason,
      dueDate: args.dueDate ?? null,
    },
    client,
  );
  if (!res.ok) return { ok: false, error: res.error === "forbidden" ? "forbidden" : "not_found" };
  return { ok: true, id: res.id, dossierId: request.dossierId };
}

/** Avocate → assistante : approbation d'une demande précise. Acquitte le signal legacy. */
export async function approveMatter(
  args: DecideArgs,
  client: DBClient = prisma,
): Promise<DecideResult> {
  const { request, guard } = await loadDecidableRequest(args, "approve", client);
  if (!guard.ok || !request) return { ok: false, error: guard.ok ? "not_found" : guard.error };

  if (!(await closeRequest(request.id, args.cabinetId, args.userId, client))) {
    return { ok: false, error: "already_resolved" };
  }

  const res = await createNavetteMessage(
    {
      cabinetId: args.cabinetId,
      dossierId: request.dossierId,
      authorId: args.userId,
      authorRole: args.role,
      type: "approved",
      recipientId: request.authorId,
      parentId: request.id,
      body: (args.body ?? "").trim() || null,
    },
    client,
  );
  if (!res.ok) return { ok: false, error: res.error === "forbidden" ? "forbidden" : "not_found" };

  if (args.signalId) {
    await markSignalRead(args.signalId, args.cabinetId, args.userId, args.isAdmin ?? false, client);
  }
  return { ok: true, id: res.id, dossierId: request.dossierId };
}

/** Assistante → avocate : prêt pour revue. Écrit le message + émet le signal legacy. */
export async function markReadyForReview(
  args: { cabinetId: string; dossierId: string; authorId: string; authorRole: string; note?: string | null },
  client: DBClient = prisma,
): Promise<CreateNavetteResult> {
  const parties = await getDossierParties(args.cabinetId, args.dossierId, client);
  if (!parties) return { ok: false, error: "not_found" };

  // Une seule demande de révision ouverte à la fois par dossier. Sinon deux
  // soumissions produisent deux demandes, l'avocate en approuve une, et la
  // seconde reste à traiter sans que personne comprenne de quoi elle parle.
  const pending = await client.dossierNavetteMessage.findFirst({
    where: { cabinetId: args.cabinetId, dossierId: args.dossierId, type: "ready_for_review", resolvedAt: null },
    select: { id: true },
  });
  if (pending) return { ok: false, error: "already_pending" };

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

function toRow(
  r: Prisma.DossierNavetteMessageGetPayload<{ include: typeof ROW_INCLUDE }>,
  recipientNames?: Map<string, string | null>,
): NavetteRow {
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
    recipientName: r.recipientId ? (recipientNames?.get(r.recipientId) ?? null) : null,
    parentId: r.parentId,
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
      // Cloison du confidentiel : la même règle que `canViewNavetteMessage`,
      // exprimée en SQL pour ne pas charger ce qui ne sera pas rendu.
      ...(canViewNavetteMessage(viewerRole, { confidentiel: true }) ? {} : { confidentiel: false }),
    },
    orderBy: { createdAt: "desc" },
    include: ROW_INCLUDE,
  });

  // Le destinataire n'est pas une relation Prisma (choix du modèle : un
  // identifiant nu). Une seule requête pour tous les noms, jamais une par ligne.
  const recipientIds = [...new Set(rows.map((r) => r.recipientId).filter((v): v is string => !!v))];
  const recipients = recipientIds.length
    ? await client.user.findMany({ where: { id: { in: recipientIds } }, select: { id: true, nom: true } })
    : [];
  const noms = new Map(recipients.map((u) => [u.id, u.nom]));
  return rows.map((r) => toRow(r, noms));
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
  return rows.map((r) => toRow(r));
}

/** Badge « needs me » : messages qui m'attendent et non résolus. */
export function countNeedsMe(
  cabinetId: string,
  userId: string,
  viewerRole?: string,
  client: DBClient = prisma,
): Promise<number> {
  return client.dossierNavetteMessage.count({
    where: {
      cabinetId,
      recipientId: userId,
      resolvedAt: null,
      // L'assistante ne compte jamais un message confidentiel (cf. getNavetteInbox).
      ...(viewerRole === "assistante" ? { confidentiel: false } : {}),
    },
  });
}

/* ───────── Cycle de vie ───────── */

/**
 * Marque un message comme lu.
 *
 * Ce que ça corrige : la version précédente ne vérifiait que le `cabinetId`.
 * Une comptable, ou une assistante devant un message confidentiel, marquait
 * comme lu un message qu'elle n'avait pas le droit de voir, et l'horodatage
 * de lecture devenait faux dans un dossier opposable.
 */
export async function markNavetteRead(
  id: string,
  cabinetId: string,
  userId: string,
  viewerRole: string,
  client: DBClient = prisma,
): Promise<{ ok: boolean; dossierId?: string; error?: NavetteGuardReason | "not_found" }> {
  const msg = await client.dossierNavetteMessage.findFirst({
    where: { id, cabinetId },
    select: { id: true, dossierId: true, readAt: true, confidentiel: true },
  });
  if (!msg) return { ok: false, error: "not_found" };
  if (!canViewNavetteMessage(viewerRole, msg)) return { ok: false, error: "forbidden" };

  if (!msg.readAt) {
    await client.dossierNavetteMessage.update({
      where: { id },
      data: { readAt: new Date(), readById: userId },
    });
  }
  return { ok: true, dossierId: msg.dossierId };
}

/**
 * Marque une demande « traitée » — par son destinataire, ou par l'admin.
 *
 * Le dossier vient du MESSAGE, jamais du navigateur : l'appelant fournissait
 * auparavant le `dossierId` lui-même, ce qui n'était pas une vérification mais
 * une politesse.
 */
export async function resolveNavetteMessage(
  id: string,
  cabinetId: string,
  userId: string,
  viewerRole: string,
  client: DBClient = prisma,
): Promise<{ ok: boolean; dossierId?: string; error?: NavetteGuardReason | "not_found" }> {
  const msg = await client.dossierNavetteMessage.findFirst({
    where: { id, cabinetId },
    select: {
      id: true,
      dossierId: true,
      type: true,
      recipientId: true,
      resolvedAt: true,
      confidentiel: true,
    },
  });
  if (!msg) return { ok: false, error: "not_found" };

  const verdict = checkNavetteResolve({ role: viewerRole, userId, message: msg });
  if (!verdict.ok) return { ok: false, dossierId: msg.dossierId, error: verdict.reason };

  if (!(await closeRequest(msg.id, cabinetId, userId, client))) {
    return { ok: false, dossierId: msg.dossierId, error: "already_resolved" };
  }
  return { ok: true, dossierId: msg.dossierId };
}
