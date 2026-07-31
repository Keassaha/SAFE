/**
 * Module SERVEUR (bibliothèque interne), pas un fichier d'actions.
 *
 * La directive "use server" a été retirée (audit sécurité 2026-07-28, §E4) : elle
 * transformait chaque fonction exportée en point d'entrée RPC adressable depuis le
 * navigateur. Or ces fonctions reçoivent `cabinetId` en PARAMÈTRE au lieu de le
 * dériver de la session : un appelant qui obtenait l'identifiant d'action pouvait
 * passer le cabinetId d'un autre cabinet et lire, écrire ou supprimer hors du sien.
 *
 * Ce module est importé par des routes API et des actions serveur qui portent déjà
 * leur propre garde de session. Ne PAS remettre "use server" ici.
 */

import type { IdentityVerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince } from "@/lib/compliance/rules";
import {
  isVerificationMethodAccepted,
  getVerificationMethods,
  type IdentitySubjectKind,
} from "@/lib/compliance/identity";
import { createAuditLog } from "./audit";
import { loadDossierPreparationSnapshot } from "@/lib/dossiers/preparation-loader";
import { getDossierPreparationStatus } from "@/lib/dossiers/preparation-status";
import { detectAndEmitIfReady } from "./ready-for-review-service";

export interface CreateIdentityVerificationParams {
  clientId: string;
  cabinetId: string;
  userId: string;
  date: Date;
  methode: string;
  statut?: IdentityVerificationStatus;
  documentId?: string | null;
  notes?: string | null;
  /** Code de méthode normalisé, validé contre la liste de la province (CH-06.6). */
  methodCode?: string | null;
  /** Personne physique ou organisation. Détermine les méthodes acceptées. */
  subjectKind?: IdentitySubjectKind | null;
  /** Date d'OBTENTION des renseignements, distincte de la date de vérification (s. 23(12.1) ON). */
  recordedAt?: Date | null;
  /** Source des fonds. Ontario seulement (s. 23(2)). */
  sourceOfFunds?: string | null;
  /**
   * Mode de preuve (CH-06.7).
   *  DOCUMENT_JOINT       — la copie est déposée dans SAFE.
   *  ATTESTATION_MANUELLE — la copie est conservée ailleurs, l'avocat l'atteste
   *                         et indique où. L'art. 22 B-1 r.5 et la s. 23(15)
   *                         By-Law 7.1 admettent tout support, pourvu qu'une copie
   *                         puisse être produite en tout temps.
   */
  proofMode?: "DOCUMENT_JOINT" | "ATTESTATION_MANUELLE" | null;
  /** Où la pièce est conservée. Obligatoire pour ATTESTATION_MANUELLE. */
  proofLocation?: string | null;
}

/** Texte de l'attestation manuelle, figé au moment de la signature. */
export function buildIdentityAttestationStatement(params: {
  province: "QC" | "ON";
  proofLocation: string;
  methodLabel: string;
  date: Date;
}): string {
  const d = params.date.toISOString().slice(0, 10);
  return params.province === "QC"
    ? `J'atteste avoir vérifié l'identité du client le ${d} par le moyen suivant : ${params.methodLabel}. ` +
        `La pièce utilisée est conservée à l'endroit suivant et peut être produite en tout temps : ${params.proofLocation}. ` +
        `(B-1 r.5, art. 22)`
    : `I certify that I verified the client's identity on ${d} using: ${params.methodLabel}. ` +
        `The document used is retained at the following location and a copy can be produced on request: ${params.proofLocation}. ` +
        `(By-Law 7.1, s. 23(13), (15))`;
}

/**
 * Refus motivé d'une vérification non conforme. Porte son article et sa porte de
 * sortie (PR-2, PR-4) : un message qui dit seulement « invalide » pousse à cocher
 * autre chose jusqu'à ce que ça passe.
 */
export class IdentityVerificationInvalidError extends Error {
  readonly code: "METHOD_NOT_ACCEPTED" | "SUPPORTING_DOCUMENT_REQUIRED" | "PROOF_LOCATION_REQUIRED";
  readonly reference: string;
  readonly remedy: string;

  constructor(params: {
    code: "METHOD_NOT_ACCEPTED" | "SUPPORTING_DOCUMENT_REQUIRED" | "PROOF_LOCATION_REQUIRED";
    message: string;
    reference: string;
    remedy: string;
  }) {
    super(`${params.message} (${params.reference}) ${params.remedy}`);
    this.name = "IdentityVerificationInvalidError";
    this.code = params.code;
    this.reference = params.reference;
    this.remedy = params.remedy;
  }
}

/**
 * Crée une entrée de vérification d'identité et met à jour les champs sur le client.
 *
 * Lorsque `statut === "verifie"`, on flippe aussi `Client.identityVerified=true`.
 * C'est ce flag que la doctrine de préparation lit (cf. lib/dossiers/preparation-status.ts §4),
 * donc sans ce write la vérification ne peut jamais lever le manquant `identity`.
 *
 * Doctrine signal: docs/product/READY_FOR_REVIEW_SIGNAL.md §8 — toute action qui
 * peut lever un manquant doit appeler `detectAndEmitIfReady` après le write.
 */
export async function createIdentityVerification(params: CreateIdentityVerificationParams) {
  const {
    clientId,
    cabinetId,
    userId,
    date,
    methode,
    statut = "verifie",
    documentId,
    notes,
    methodCode,
    recordedAt,
    sourceOfFunds,
    proofMode,
    proofLocation,
  } = params;
  const client = await prisma.client.findFirst({
    where: { id: clientId, cabinetId },
  });
  if (!client) throw new Error("Client non trouvé");

  const province = resolveProvince(await getCabinetProvince(cabinetId));
  const subjectKind: IdentitySubjectKind =
    params.subjectKind ?? (client.typeClient === "personne_physique" ? "INDIVIDUAL" : "ORGANIZATION");

  // ── CH-06.6, contrôle 1 : la méthode doit exister dans la province ──────────
  // L'Ontario énumère LIMITATIVEMENT trois méthodes pour une personne physique
  // (By-Law 7.1 s. 23(7)1). « Vidéo », que l'ancien formulaire proposait, n'en fait
  // pas partie. Le Québec, lui, admet le répondant (art. 24), que l'Ontario ignore.
  if (methodCode && !isVerificationMethodAccepted(province, subjectKind, methodCode)) {
    const accepted = getVerificationMethods(province)
      .filter((v) => v.appliesTo.includes(subjectKind))
      .map((v) => v.labelFr)
      .join(" · ");
    throw new IdentityVerificationInvalidError({
      code: "METHOD_NOT_ACCEPTED",
      message: `La méthode « ${methodCode} » n'est pas admise dans cette province pour ce type de client.`,
      reference: province === "QC" ? "B-1 r.5, art. 22-24" : "By-Law 7.1, s. 23(7)",
      remedy: `Méthodes admises : ${accepted}.`,
    });
  }

  // ── CH-06.6/06.7, contrôle 2 : la preuve doit exister quelque part ─────────
  //
  // L'art. 22 B-1 r.5 impose d'obtenir copie du document et de la CONSERVER AU
  // DOSSIER, « sur tout support papier ou faisant appel aux technologies de
  // l'information, pourvu que des copies puissent en être tirées facilement en tout
  // temps ». La s. 23(13) et (15) By-Law 7.1 dit la même chose. Ni l'un ni l'autre
  // n'exige que la copie soit dans SAFE.
  //
  // Trois chemins valides pour marquer « vérifié », donc :
  //   1. la pièce est déposée dans SAFE (`documentId`) ;
  //   2. l'avocat ATTESTE que la pièce est conservée ailleurs, et dit OÙ. Une
  //      attestation qui n'indique pas où chercher ne vaut rien à l'inspection ;
  //   3. le cabinet a levé l'exigence (dispense attribuée, cf. `identityProofRequired`).
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { identityProofRequired: true },
  });
  const proofRequired = cabinet?.identityProofRequired ?? true;

  const attestedManually = proofMode === "ATTESTATION_MANUELLE";
  const hasProof = Boolean(documentId) || attestedManually;

  if (attestedManually && !proofLocation?.trim()) {
    throw new IdentityVerificationInvalidError({
      code: "PROOF_LOCATION_REQUIRED",
      message:
        "Une confirmation manuelle doit indiquer où la pièce est conservée.",
      reference: province === "QC" ? "B-1 r.5, art. 22" : "By-Law 7.1, s. 23(15)",
      remedy:
        "Indiquez l'emplacement de la pièce (dossier papier, coffre, système documentaire), pour qu'une copie puisse être produite en tout temps.",
    });
  }

  if (statut === "verifie" && !hasProof && proofRequired) {
    throw new IdentityVerificationInvalidError({
      code: "SUPPORTING_DOCUMENT_REQUIRED",
      message: "Une vérification d'identité ne peut être marquée « vérifiée » sans pièce justificative.",
      reference: province === "QC" ? "B-1 r.5, art. 22" : "By-Law 7.1, s. 23(13)",
      remedy:
        "Joignez la pièce, ou confirmez manuellement en indiquant où elle est conservée, ou enregistrez la démarche au statut « en attente ».",
    });
  }

  // Mode effectif consigné : on distingue une attestation assumée d'un enregistrement
  // fait sous dispense. À l'inspection, ce ne sont pas les mêmes situations.
  const effectiveProofMode = documentId
    ? "DOCUMENT_JOINT"
    : attestedManually
      ? "ATTESTATION_MANUELLE"
      : statut === "verifie" && !proofRequired
        ? "DISPENSE_CABINET"
        : null;

  const attestationStatement =
    attestedManually && proofLocation
      ? buildIdentityAttestationStatement({
          province,
          proofLocation: proofLocation.trim(),
          methodLabel:
            getVerificationMethods(province).find((m) => m.code === methodCode)?.labelFr ?? methode,
          date,
        })
      : null;

  // Si la vérification flippe l'état du client à `identityVerified=true`, alors
  // tous ses dossiers actifs peuvent voir leur manquant `identity` levé.
  // On capture l'état d'avant pour chacun des dossiers concernés.
  const isVerifying = statut === "verifie" && !client.identityVerified;
  const dossiersForSignal = isVerifying
    ? await prisma.dossier.findMany({
        where: { cabinetId, clientId, statut: { not: "archive" } },
        select: { id: true },
      })
    : [];

  const beforeStatesByDossier = new Map<string, ReturnType<typeof getDossierPreparationStatus>["state"] | null>();
  for (const d of dossiersForSignal) {
    const snap = await loadDossierPreparationSnapshot(cabinetId, d.id, { callerUserId: userId });
    beforeStatesByDossier.set(d.id, snap ? getDossierPreparationStatus(snap).state : null);
  }

  const verification = await prisma.clientIdentityVerification.create({
    data: {
      clientId,
      date,
      methode,
      statut,
      documentId: documentId ?? undefined,
      notes: notes ?? undefined,
      // CH-06.6 — on consigne le régime appliqué, pas seulement le résultat. Une
      // vérification faite sous le régime ontarien ne prouve pas la conformité
      // québécoise : la méthode admise n'est pas la même.
      province,
      methodCode: methodCode ?? undefined,
      subjectKind,
      // Ontario s. 23(2) : la source des fonds fait partie de l'identification dès
      // qu'il y a mouvement de fonds. Aucune obligation équivalente au Québec.
      sourceOfFunds: province === "ON" ? sourceOfFunds ?? undefined : undefined,
      // Ontario s. 23(12.1) : la date d'OBTENTION des renseignements est exigée,
      // distincte de la date de vérification. À défaut, on retient celle-ci.
      recordedAt: recordedAt ?? date,
      verifiedById: userId,
      // CH-06.7 — d'où vient la force probante de cette vérification.
      proofMode: effectiveProofMode ?? undefined,
      proofLocation: proofLocation?.trim() || undefined,
      attestationStatement: attestationStatement ?? undefined,
      attestedById: attestationStatement ? userId : undefined,
      attestedAt: attestationStatement ? new Date() : undefined,
    },
  });

  await prisma.client.updateMany({
    where: { id: clientId, cabinetId },
    data: {
      dateVerificationIdentite: date,
      methodeVerificationIdentite: methode,
      ...(statut === "verifie" ? { identityVerified: true, verificationDate: date } : {}),
    },
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "ClientIdentityVerification",
    entityId: verification.id,
    action: "create",
    metadata: { clientId, methode, methodCode, province, subjectKind, statut, hasDocument: Boolean(documentId), proofMode: effectiveProofMode },
  });

  if (isVerifying) {
    for (const d of dossiersForSignal) {
      await detectAndEmitIfReady(cabinetId, d.id, {
        beforeState: beforeStatesByDossier.get(d.id) ?? null,
        callerUserId: userId,
      });
    }
  }

  return verification;
}

export async function listIdentityVerifications(clientId: string, cabinetId: string) {
  return prisma.clientIdentityVerification.findMany({
    where: { clientId, client: { cabinetId } },
    include: { document: true },
    orderBy: { date: "desc" },
  });
}
