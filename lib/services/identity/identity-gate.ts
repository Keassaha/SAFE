/**
 * Garde-fou d'identité sur les mouvements de fonds.
 *
 * Ferme le risque RC-10 de l'audit : jusqu'ici, `ClientIdentityVerification`
 * existait comme modèle mais n'était **jamais déclenchée par un mouvement de
 * fonds**. Un cabinet pouvait recevoir 50 000 $ en fidéicommis pour un client dont
 * l'identité n'avait jamais été vérifiée, sans qu'aucun écran ne le signale.
 *
 * Ce que le règlement exige, et que ce module applique :
 *
 *   Québec — B-1 r.5 art. 20 : l'obligation naît quand l'avocat « reçoit, débourse
 *   ou vire des fonds ». Art. 26(1) : pour une personne physique, la vérification
 *   doit être faite « **au plus tard au moment où il reçoit des fonds** ». C'est donc
 *   une condition PRÉALABLE : le mouvement est refusé. Art. 26(2) : pour une société,
 *   60 jours.
 *
 *   Ontario — By-Law 7.1 s. 22(1)(b) et 23(5)-(6) : la vérification suit le premier
 *   mouvement (« immediately **after** »), elle ne le précède pas. On n'invente donc
 *   pas un blocage que le texte ne prévoit pas : on ouvre un délai, et on bloque les
 *   mouvements SUIVANTS une fois ce délai expiré.
 *
 * Doctrine PR-2 : le refus expose toujours l'exemption applicable et la façon de
 * régulariser. Un blocage sans issue pousse à saisir l'opération ailleurs.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince, type CabinetProvince } from "@/lib/compliance/rules";
import {
  evaluateIdentityForFundsMovement,
  computeVerificationDueDate,
  exemptionReference,
  getExemptions,
  type IdentitySubjectKind,
  type IdentityVerdict,
} from "@/lib/compliance/identity";

/** Erreur levée quand un mouvement de fonds est refusé faute de vérification. */
export class IdentityVerificationRequiredError extends Error {
  readonly code = "IDENTITY_VERIFICATION_REQUIRED" as const;
  readonly reference: string;
  readonly remedy: string;
  readonly availableExemptions: Record<string, string>;

  constructor(params: { province: CabinetProvince; reference: string; detail?: string | null }) {
    const isQC = params.province === "QC";
    const message = isQC
      ? "Vérification d'identité obligatoire avant de recevoir ou de verser des fonds pour ce client."
      : "Client identity verification is required before further funds movements for this client.";
    const remedy = isQC
      ? "Consignez la vérification d'identité sur la fiche client, ou invoquez une exemption de l'article 21 en la justifiant."
      : "Record the client identity verification, or invoke an exemption under s. 22(2), (3) or (4) with a justification.";

    super([message, params.detail, `(${params.reference})`, remedy].filter(Boolean).join(" "));
    this.name = "IdentityVerificationRequiredError";
    this.reference = params.reference;
    this.remedy = remedy;
    this.availableExemptions = getExemptions(params.province);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      remedy: this.remedy,
      reference: this.reference,
      availableExemptions: this.availableExemptions,
    };
  }
}

/** Déduit la nature du client au sens des deux règlements. */
export function toSubjectKind(typeClient: string | null | undefined): IdentitySubjectKind {
  return typeClient === "personne_physique" ? "INDIVIDUAL" : "ORGANIZATION";
}

/**
 * Mode d'application du garde-fou, dérivé de `Cabinet.identityGateEnforcedFrom`.
 *
 * `OBSERVING` n'est pas « désactivé ». Le contrôle s'exécute entièrement, le verdict
 * est calculé, le refus qui aurait eu lieu est journalisé. Seule la levée de
 * l'exception est suspendue. C'est ce qui permet de produire la liste des clients à
 * régulariser AVANT de bloquer qui que ce soit.
 */
export type IdentityGateEnforcement =
  /** Aucune date posée : le contrôle observe et avertit. Écart de conformité ouvert. */
  | { mode: "OBSERVING"; enforcedFrom: null }
  /** Date posée dans le futur : régularisation en cours, compte à rebours. */
  | { mode: "GRACE"; enforcedFrom: Date; daysUntilEnforcement: number }
  /** Date atteinte : le garde-fou bloque. */
  | { mode: "ENFORCING"; enforcedFrom: Date };

export interface IdentityGateResult {
  verdict: IdentityVerdict;
  province: CabinetProvince;
  /** Échéance de vérification, si un délai court. */
  dueAt: Date | null;
  /** Mode d'application au moment de l'évaluation. */
  enforcement: IdentityGateEnforcement;
  /**
   * Vrai si le verdict aurait bloqué l'opération sous application pleine.
   * En mode OBSERVING ou GRACE, l'opération passe quand même — mais ce booléen
   * alimente la liste « clients à régulariser » et le tableau de conformité.
   */
  wouldBlock: boolean;
}

/** Fonction PURE : dérive le mode d'application. `now` injecté, jamais lu de l'horloge. */
export function resolveEnforcement(
  enforcedFrom: Date | null | undefined,
  now: Date,
): IdentityGateEnforcement {
  if (!enforcedFrom) return { mode: "OBSERVING", enforcedFrom: null };
  if (enforcedFrom.getTime() <= now.getTime()) {
    return { mode: "ENFORCING", enforcedFrom };
  }
  const daysUntilEnforcement = Math.ceil((enforcedFrom.getTime() - now.getTime()) / 86_400_000);
  return { mode: "GRACE", enforcedFrom, daysUntilEnforcement };
}

/**
 * Évalue — sans bloquer — l'état d'identité d'un client au regard d'un mouvement de
 * fonds. Utilisable par les écrans pour afficher l'état avant que l'utilisateur ne
 * saisisse quoi que ce soit.
 */
export async function evaluateIdentityGate(params: {
  cabinetId: string;
  clientId: string;
  now?: Date;
  province?: string | null;
}): Promise<IdentityGateResult> {
  const now = params.now ?? new Date();
  const province = resolveProvince(
    params.province !== undefined ? params.province : await getCabinetProvince(params.cabinetId),
  );

  // Lecture défensive : un mock partiel (tests) sans `cabinet.findUnique` reste en
  // mode observation plutôt que de faire échouer l'évaluation.
  const cabinet = await prisma.cabinet
    ?.findUnique?.({
      where: { id: params.cabinetId },
      select: { identityGateEnforcedFrom: true },
    })
    .catch(() => null);
  const enforcement = resolveEnforcement(cabinet?.identityGateEnforcedFrom ?? null, now);

  const client = await prisma.client.findFirst({
    where: { id: params.clientId, cabinetId: params.cabinetId },
    select: {
      typeClient: true,
      identityVerified: true,
      verificationDate: true,
      identityExemption: true,
      firstFundsMovementAt: true,
    },
  });
  if (!client) throw new Error("Client introuvable");

  const kind = toSubjectKind(client.typeClient);
  const verdict = evaluateIdentityForFundsMovement(
    province,
    {
      kind,
      verified: client.identityVerified,
      verifiedAt: client.verificationDate,
      // Une exemption n'est retenue que si elle existe dans la province (PR-7).
      exemption:
        client.identityExemption && exemptionReference(province, client.identityExemption)
          ? client.identityExemption
          : null,
      firstFundsMovementAt: client.firstFundsMovementAt,
    },
    now,
  );

  const dueAt =
    verdict.status === "DUE" || verdict.status === "OVERDUE" ? verdict.dueAt : null;
  const wouldBlock = verdict.status === "BLOCKING" || verdict.status === "OVERDUE";

  return { verdict, province, dueAt, enforcement, wouldBlock };
}

/**
 * Applique le garde-fou avant un mouvement de fonds, et enregistre le point de
 * départ du délai si c'est le premier mouvement.
 *
 * Lève `IdentityVerificationRequiredError` dans deux cas seulement :
 *   - `BLOCKING` : le règlement exige la vérification AVANT (Québec, personne
 *     physique, art. 26(1)) ;
 *   - `OVERDUE`  : un délai déjà ouvert est expiré. On bloque le mouvement suivant,
 *     jamais rétroactivement celui qui a ouvert le délai — il était licite.
 *
 * Un verdict `DUE` laisse passer et pose l'échéance : c'est exactement ce que
 * prévoient l'art. 26(2) QC et la s. 23(6) ON.
 */
export async function assertIdentityForFundsMovement(params: {
  cabinetId: string;
  clientId: string;
  userId?: string | null;
  now?: Date;
  province?: string | null;
}): Promise<IdentityGateResult> {
  const now = params.now ?? new Date();
  const result = await evaluateIdentityGate({ ...params, now });
  const { verdict, province, enforcement } = result;

  // Narrowing sur `verdict.status` plutôt que sur le booléen `wouldBlock` : seule
  // cette forme prouve au compilateur que `reference` est bien présent.
  if (verdict.status === "BLOCKING" || verdict.status === "OVERDUE") {
    const detail =
      verdict.status === "OVERDUE"
        ? `Échéance dépassée de ${verdict.daysOverdue} jour(s) (${verdict.dueAt.toISOString().slice(0, 10)}).`
        : null;

    // Le refus est journalisé DANS TOUS LES CAS, y compris quand il n'est pas
    // appliqué. C'est ce qui rend le mode observation utile : à la fin d'une
    // semaine, la piste d'audit contient exactement la liste des clients à
    // régulariser, sans avoir bloqué personne.
    await createAuditLog({
      cabinetId: params.cabinetId,
      userId: params.userId ?? undefined,
      entityType: "ClientIdentityVerification",
      entityId: params.clientId,
      action: "create",
      metadata: {
        blocked: enforcement.mode === "ENFORCING",
        reason: "IDENTITY_VERIFICATION_REQUIRED",
        status: verdict.status,
        enforcement: enforcement.mode,
      },
      newValues: { province, reference: verdict.reference },
      performedBy: params.userId ?? undefined,
      performedAt: now,
    });

    // Seule la LEVÉE de l'exception dépend du mode. Le contrôle, lui, s'est exécuté
    // entièrement — « observation » ne veut pas dire « désactivé ».
    if (enforcement.mode === "ENFORCING") {
      throw new IdentityVerificationRequiredError({
        province,
        reference: verdict.reference,
        detail,
      });
    }
  }

  await markFirstFundsMovement({
    cabinetId: params.cabinetId,
    clientId: params.clientId,
    province,
    now,
  });

  return result;
}

/**
 * Pose le point de départ du délai au premier mouvement de fonds, et calcule
 * l'échéance. Idempotent : `updateMany` avec `firstFundsMovementAt: null` garantit
 * qu'un deuxième mouvement ne repousse jamais l'échéance — ce qui reviendrait à
 * offrir un délai perpétuel.
 */
async function markFirstFundsMovement(params: {
  cabinetId: string;
  clientId: string;
  province: CabinetProvince;
  now: Date;
}): Promise<void> {
  const client = await prisma.client.findFirst({
    where: { id: params.clientId, cabinetId: params.cabinetId },
    select: { typeClient: true, firstFundsMovementAt: true, identityVerified: true },
  });
  if (!client || client.firstFundsMovementAt) return;
  // Un client déjà vérifié n'a pas de délai à faire courir.
  if (client.identityVerified) return;

  const kind = toSubjectKind(client.typeClient);
  const dueAt = computeVerificationDueDate(params.province, kind, params.now);

  await prisma.client.updateMany({
    where: { id: params.clientId, cabinetId: params.cabinetId, firstFundsMovementAt: null },
    data: { firstFundsMovementAt: params.now, identityVerificationDueAt: dueAt },
  });
}

/** Vrai si l'erreur est un refus d'identité (garde de type pour les routes API). */
export function isIdentityVerificationRequiredError(
  e: unknown,
): e is IdentityVerificationRequiredError {
  return e instanceof IdentityVerificationRequiredError;
}
