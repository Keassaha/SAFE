/**
 * Cycle de vie du cabinet : originaux du client, dossiers fermés, cessionnaire.
 *
 * Art. 7, 9, 15, 19, 74 à 82 B-1 r.5.
 *
 * Ces articles ne parlent pas de fidéicommis. Ils décrivent ce qu'un cabinet doit tenir
 * pour être un cabinet, et un inspecteur les vérifie au même titre que la comptabilité.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince, type CabinetProvince } from "@/lib/compliance/rules";
import {
  canDestroyDocument,
  closedMattersListSince,
  evaluateDeadline,
  findMissingAnticipatoryDuties,
  getCessationDuties,
  type CessationDuty,
  type DeadlineAlert,
  type DeadlineKind,
} from "@/lib/compliance/practice-lifecycle";

/** Refus motivé, portant son article et sa porte de sortie (PR-2, PR-4). */
export class PracticeLifecycleError extends Error {
  readonly code: "CLIENT_ORIGINAL_PROTECTED" | "SUCCESSOR_NAME_REQUIRED";
  readonly reference: string;

  constructor(params: {
    code: PracticeLifecycleError["code"];
    message: string;
    reference: string;
    remedy: string;
  }) {
    super(`${params.message} (${params.reference}) ${params.remedy}`);
    this.name = "PracticeLifecycleError";
    this.code = params.code;
    this.reference = params.reference;
  }
}

/* ════════════════════════════════════════════════════════════════
   ART. 19 — LES ORIGINAUX DU CLIENT
   ════════════════════════════════════════════════════════════════ */

/**
 * Garde-fou à poser devant toute suppression de document.
 *
 * ⚠️ NE S'APPLIQUE QU'AUX DOCUMENTS MARQUÉS. Un document non marqué comme original du
 * client passe. C'est délibéré : requalifier rétroactivement tout l'existant en
 * « original du client » bloquerait des suppressions légitimes sans que personne ne
 * comprenne pourquoi, et la première réaction serait de contourner le garde-fou.
 *
 * Le marquage se fait au dépôt ou après coup, et c'est un geste humain — SAFE ne peut
 * pas deviner qu'un PDF scanné est l'original notarié d'un client.
 */
export async function assertDocumentDestroyable(params: {
  cabinetId: string;
  documentId: string;
}): Promise<void> {
  const doc = await prisma.document.findFirst({
    where: { id: params.documentId, cabinetId: params.cabinetId },
    select: {
      isClientOriginal: true,
      clientAuthorizedDestroyAt: true,
      returnOfferedAt: true,
    },
  });
  if (!doc) return;

  const province = resolveProvince(await getCabinetProvince(params.cabinetId));
  const verdict = canDestroyDocument({
    province,
    isClientOriginal: doc.isClientOriginal,
    // La colonne s'appelle `clientAuthorizedDestroyAt`, le paramètre `clientAuthorizedAt`.
    // Le renommage est explicite : un cast aurait laissé passer l'écart, et une
    // autorisation du client aurait été silencieusement ignorée.
    clientAuthorizedAt: doc.clientAuthorizedDestroyAt,
    returnOfferedAt: doc.returnOfferedAt,
  });

  if (!verdict.allowed) {
    throw new PracticeLifecycleError({
      code: "CLIENT_ORIGINAL_PROTECTED",
      message: verdict.reasonFr,
      reference: verdict.reference,
      remedy: verdict.remedyFr,
    });
  }
}

/**
 * Marque un document comme original appartenant au client, ou consigne une des deux
 * portes de sortie de l'art. 19.
 */
export async function recordClientOriginal(params: {
  cabinetId: string;
  documentId: string;
  isClientOriginal: boolean;
  clientAuthorizedDestroyAt?: Date | null;
  returnOfferedAt?: Date | null;
  note?: string | null;
  userId: string;
}): Promise<void> {
  const doc = await prisma.document.findFirst({
    where: { id: params.documentId, cabinetId: params.cabinetId },
    select: { id: true },
  });
  if (!doc) throw new Error("Document introuvable.");

  await prisma.document.update({
    where: { id: doc.id },
    data: {
      isClientOriginal: params.isClientOriginal,
      clientAuthorizedDestroyAt: params.clientAuthorizedDestroyAt ?? null,
      returnOfferedAt: params.returnOfferedAt ?? null,
      originalNote: params.note ?? null,
    },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "Document",
    entityId: doc.id,
    action: "update",
    newValues: {
      type: "client_original_marking",
      isClientOriginal: params.isClientOriginal,
      clientAuthorizedDestroyAt: params.clientAuthorizedDestroyAt?.toISOString() ?? null,
      returnOfferedAt: params.returnOfferedAt?.toISOString() ?? null,
      reference: "B-1 r.5, art. 19",
    },
    performedBy: params.userId,
  });
}

/** Originaux du client encore protégés, pour l'écran de conformité. */
export async function listProtectedClientOriginals(params: {
  cabinetId: string;
}): Promise<Array<{ id: string; nom: string; dossierId: string | null; note: string | null }>> {
  const rows = await prisma.document.findMany({
    where: {
      cabinetId: params.cabinetId,
      isClientOriginal: true,
      clientAuthorizedDestroyAt: null,
      returnOfferedAt: null,
    },
    select: { id: true, nom: true, dossierId: true, originalNote: true },
    orderBy: { nom: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    nom: r.nom,
    dossierId: r.dossierId,
    note: r.originalNote,
  }));
}

/* ════════════════════════════════════════════════════════════════
   ART. 9 — LA LISTE DES DOSSIERS FERMÉS
   ════════════════════════════════════════════════════════════════ */

export interface ClosedMatterLine {
  dossierId: string;
  reference: string | null;
  clientId: string;
  closedAt: Date | null;
  /** Un dossier fermé sans date de fermeture est un défaut de tenue, pas une omission. */
  missingClosureDate: boolean;
}

/**
 * Dossiers fermés au cours des sept dernières années (art. 9).
 *
 * Ce n'est PAS la même obligation que la conservation de l'art. 31. L'art. 31 dit
 * combien de temps garder les livres ; l'art. 9 dit ce que le cabinet doit pouvoir
 * PRÉSENTER à tout moment. Un cabinet peut avoir tout gardé sans pouvoir produire la
 * liste, et c'est exactement ce qu'un inspecteur constate.
 *
 * Un dossier fermé sans date de fermeture est INCLUS et signalé. L'exclure le ferait
 * disparaître de la liste que l'inspecteur demande, ce qui transformerait un défaut de
 * saisie en absence pure et simple.
 */
export async function getClosedMattersList(params: {
  cabinetId: string;
  now?: Date;
}): Promise<ClosedMatterLine[]> {
  const now = params.now ?? new Date();
  const since = closedMattersListSince(now);

  const rows = await prisma.dossier.findMany({
    where: {
      cabinetId: params.cabinetId,
      statut: { in: ["cloture", "archive"] },
      OR: [{ dateCloture: { gte: since } }, { dateCloture: null }],
    },
    select: { id: true, reference: true, clientId: true, dateCloture: true },
    orderBy: { dateCloture: "desc" },
  });

  return rows.map((r) => ({
    dossierId: r.id,
    reference: r.reference,
    clientId: r.clientId,
    closedAt: r.dateCloture,
    missingClosureDate: r.dateCloture === null,
  }));
}

/* ════════════════════════════════════════════════════════════════
   ART. 7 — LES ÉCHÉANCES
   ════════════════════════════════════════════════════════════════ */

export interface DeadlineLine {
  dossierId: string;
  reference: string | null;
  titre: string;
  kind: DeadlineKind;
  /**
   * La nature a-t-elle été SAISIE ?
   *
   * Sans ce drapeau, une échéance non qualifiée serait indiscernable d'un vrai rappel
   * interne : l'écran afficherait le même calme dans les deux cas, alors que le second
   * est un choix et le premier une donnée manquante.
   */
  qualified: boolean;
  dueAt: Date;
  alert: DeadlineAlert;
}

/**
 * Échéances à surveiller.
 *
 * ⚠️ LA NATURE DE L'ÉCHÉANCE VIENT DE LA SAISIE, PAS D'UNE DEVINETTE. SAFE ne classe
 * pas une échéance en « prescription » d'après son intitulé : se tromper dans ce sens
 * afficherait un faux calme, et se tromper dans l'autre noierait les vraies
 * prescriptions sous des alertes critiques. Tant que le champ n'est pas saisi,
 * l'échéance est traitée comme un rappel interne, sans effet juridique déclaré.
 */
export async function getDeadlineAlerts(params: {
  cabinetId: string;
  now?: Date;
}): Promise<DeadlineLine[]> {
  const now = params.now ?? new Date();
  const province = resolveProvince(await getCabinetProvince(params.cabinetId));

  const events = await prisma.calendarEvent.findMany({
    where: {
      cabinetId: params.cabinetId,
      status: { notIn: ["annule", "termine"] },
    },
    select: {
      dossierId: true,
      title: true,
      date: true,
      deadlineKind: true,
      dossier: { select: { reference: true } },
    },
    orderBy: { date: "asc" },
  });

  const KINDS: DeadlineKind[] = ["PRESCRIPTION", "PROCEDURE", "CONTRACTUAL", "INTERNAL"];

  return events.map((e) => {
    // Une échéance non qualifiée est traitée comme un rappel interne, jamais devinée
    // depuis son intitulé.
    const qualified = KINDS.includes(e.deadlineKind as DeadlineKind);
    const kind: DeadlineKind = qualified ? (e.deadlineKind as DeadlineKind) : "INTERNAL";
    return {
      dossierId: e.dossierId ?? "",
      reference: e.dossier?.reference ?? null,
      titre: e.title,
      kind,
      qualified,
      dueAt: e.date,
      alert: evaluateDeadline({ kind, dueAt: e.date, now, province }),
    };
  });
}

/* ════════════════════════════════════════════════════════════════
   ART. 74 À 82 — LA CESSATION D'EXERCICE
   ════════════════════════════════════════════════════════════════ */

export interface SuccessionStatus {
  province: CabinetProvince;
  hasPlan: boolean;
  successorName: string | null;
  successorBarreauNo: string | null;
  successorEmail: string | null;
  successorPhone: string | null;
  successorConfirmedAt: Date | null;
  lastReviewedAt: Date | null;
  notes: string | null;
  /** Obligations permanentes non tenues. Vide = rien à faire aujourd'hui. */
  missing: CessationDuty[];
  /** Toutes les obligations, pour l'écran. */
  duties: CessationDuty[];
}

/**
 * État du plan de cession.
 *
 * Un cessionnaire nommé mais qui n'a jamais confirmé n'en est pas un : la confirmation
 * est donc affichée séparément, sans bloquer. Le règlement n'exige pas la preuve de son
 * accord, mais un cabinet qui découvrirait le refus le jour venu n'aurait plus de plan.
 */
export async function getSuccessionStatus(cabinetId: string): Promise<SuccessionStatus> {
  const province = resolveProvince(await getCabinetProvince(cabinetId));
  const plan = await prisma.practiceSuccessionPlan.findUnique({ where: { cabinetId } });

  return {
    province,
    hasPlan: Boolean(plan),
    successorName: plan?.successorName ?? null,
    successorBarreauNo: plan?.successorBarreauNo ?? null,
    successorEmail: plan?.successorEmail ?? null,
    successorPhone: plan?.successorPhone ?? null,
    successorConfirmedAt: plan?.successorConfirmedAt ?? null,
    lastReviewedAt: plan?.lastReviewedAt ?? null,
    notes: plan?.notes ?? null,
    missing: findMissingAnticipatoryDuties({
      province,
      hasDesignatedSuccessor: Boolean(plan),
    }),
    duties: getCessationDuties({ province, cause: "AUTRE" }),
  };
}

/** Enregistre ou met à jour le cessionnaire désigné (art. 78). */
export async function setSuccessionPlan(params: {
  cabinetId: string;
  successorName: string;
  successorBarreauNo?: string | null;
  successorEmail?: string | null;
  successorPhone?: string | null;
  successorConfirmedAt?: Date | null;
  notes?: string | null;
  userId: string;
  now?: Date;
}): Promise<void> {
  const now = params.now ?? new Date();
  const province = resolveProvince(await getCabinetProvince(params.cabinetId));

  if (!params.successorName.trim()) {
    throw new PracticeLifecycleError({
      code: "SUCCESSOR_NAME_REQUIRED",
      message: "Le cessionnaire doit être nommé.",
      reference: "B-1 r.5, art. 78",
      remedy:
        "L'art. 75 impose une cession à un avocat EN EXERCICE : un plan sans nom ne désigne personne.",
    });
  }

  await prisma.practiceSuccessionPlan.upsert({
    where: { cabinetId: params.cabinetId },
    create: {
      cabinetId: params.cabinetId,
      successorName: params.successorName.trim(),
      successorBarreauNo: params.successorBarreauNo ?? null,
      successorEmail: params.successorEmail ?? null,
      successorPhone: params.successorPhone ?? null,
      successorConfirmedAt: params.successorConfirmedAt ?? null,
      lastReviewedAt: now,
      notes: params.notes ?? null,
      province,
    },
    update: {
      successorName: params.successorName.trim(),
      successorBarreauNo: params.successorBarreauNo ?? null,
      successorEmail: params.successorEmail ?? null,
      successorPhone: params.successorPhone ?? null,
      successorConfirmedAt: params.successorConfirmedAt ?? null,
      lastReviewedAt: now,
      notes: params.notes ?? null,
    },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "Cabinet",
    entityId: params.cabinetId,
    action: "update",
    newValues: {
      type: "succession_plan",
      successorName: params.successorName,
      reference: "B-1 r.5, art. 78",
    },
    performedBy: params.userId,
    performedAt: now,
  });
}
