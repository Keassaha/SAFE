/**
 * Registre des autres biens en fidéicommis.
 *
 * Art. 43 à 46 B-1 r.5 · s. 18(9) By-Law 9.
 *
 * L'art. 43 impose l'inscription « dès réception ou remise ». Le registre est donc
 * tenu au moment du geste, pas reconstitué après coup — c'est pour cela que la prise
 * de possession et la remise sont deux opérations distinctes, chacune datée.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince, type CabinetProvince } from "@/lib/compliance/rules";
import {
  checkPropertiesBeforeClosure,
  findMissingPropertyFields,
  getClientNoticeDuties,
  getPropertyRetentionRule,
  type TrustPropertyField,
} from "@/lib/compliance/trust-property";

/** Refus motivé, portant son article et sa porte de sortie (PR-2, PR-4). */
export class TrustPropertyError extends Error {
  readonly code: "MISSING_REQUIRED_FIELDS" | "ALREADY_RELEASED" | "RELEASE_RECIPIENT_REQUIRED";
  readonly reference: string;
  readonly missingFields: string[];

  constructor(params: {
    code: TrustPropertyError["code"];
    message: string;
    reference: string;
    remedy: string;
    missingFields?: string[];
  }) {
    super(`${params.message} (${params.reference}) ${params.remedy}`);
    this.name = "TrustPropertyError";
    this.code = params.code;
    this.reference = params.reference;
    this.missingFields = params.missingFields ?? [];
  }
}

export interface RecordPropertyParams {
  cabinetId: string;
  clientId: string;
  dossierId?: string | null;
  description: string;
  identificationNumber?: string | null;
  /** s. 18(9) ON — exigée. Non exigée au Québec. */
  estimatedValue?: number | null;
  /** s. 18(9) ON — la personne qui détenait le bien immédiatement avant. */
  receivedFromName?: string | null;
  receivedAt: Date;
  /** Art. 45 QC — lieu de garde. */
  storageLocation?: string | null;
  /** Art. 44 QC — le bien vient d'un tiers. */
  fromThirdParty?: boolean;
  /** Art. 46 QC — affectation. */
  purpose?: string | null;
  userId: string;
}

/**
 * Inscrit un bien au registre, « dès réception » (art. 43).
 *
 * Les champs exigés dépendent de la province : le module de règles tranche, et le
 * service ne fait qu'appliquer. Imposer la valeur à un cabinet québécois ou le lieu
 * de garde à un cabinet ontarien ajouterait au règlement.
 */
export async function recordTrustProperty(
  params: RecordPropertyParams,
): Promise<{ id: string; noticeDuties: ReturnType<typeof getClientNoticeDuties> }> {
  const province = resolveProvince(await getCabinetProvince(params.cabinetId));

  const missing = findMissingPropertyFields(
    {
      description: params.description,
      identificationNumber: params.identificationNumber,
      receivedAt: params.receivedAt,
      clientId: params.clientId,
      receivedFromName: params.receivedFromName,
      estimatedValue: params.estimatedValue,
      storageLocation: params.storageLocation,
      purpose: params.purpose,
    },
    province,
    { released: false },
  );

  if (missing.length > 0) {
    throw new TrustPropertyError({
      code: "MISSING_REQUIRED_FIELDS",
      message: `Registre incomplet : ${missing.map((f) => f.labelFr).join(", ")}.`,
      reference: province === "QC" ? "B-1 r.5, art. 43, 45, 46" : "By-Law 9, s. 18(9)",
      remedy: "Complétez ces champs avant d'inscrire le bien au registre.",
      missingFields: missing.map((f) => f.key),
    });
  }

  const created = await prisma.trustProperty.create({
    data: {
      cabinetId: params.cabinetId,
      clientId: params.clientId,
      dossierId: params.dossierId ?? undefined,
      description: params.description.trim(),
      identificationNumber: params.identificationNumber ?? undefined,
      // Champs propres à un régime : on n'écrit que ce que la province exige, pour
      // qu'un registre québécois ne porte pas de colonnes ontariennes vides et
      // inversement.
      estimatedValue: province === "ON" ? params.estimatedValue ?? undefined : undefined,
      receivedFromName: province === "ON" ? params.receivedFromName ?? undefined : undefined,
      receivedAt: params.receivedAt,
      storageLocation: province === "QC" ? params.storageLocation ?? undefined : undefined,
      storageHistoryJson:
        province === "QC" && params.storageLocation
          ? JSON.stringify([{ location: params.storageLocation, from: params.receivedAt }])
          : undefined,
      fromThirdParty: params.fromThirdParty ?? false,
      purpose: province === "QC" ? params.purpose ?? undefined : undefined,
      province,
      createdById: params.userId,
    },
    select: { id: true },
  });

  const noticeDuties = getClientNoticeDuties({
    province,
    fromThirdParty: params.fromThirdParty ?? false,
    clientNotifiedAt: null,
    storageLocation: params.storageLocation,
    storageNotifiedAt: null,
    storageChangedSinceNotice: false,
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "TrustAccount",
    entityId: created.id,
    action: "create",
    newValues: {
      type: "trust_property",
      description: params.description,
      clientId: params.clientId,
      province,
      fromThirdParty: params.fromThirdParty ?? false,
    },
    performedBy: params.userId,
    performedAt: new Date(),
  });

  return { id: created.id, noticeDuties };
}

/**
 * Déplace un bien, en conservant l'historique.
 *
 * Art. 45 : l'avocat doit aviser le client « du lieu où est gardé un bien meuble
 * qui lui est confié en fidéicommis ET DE TOUT CHANGEMENT D'EMPLACEMENT SUBSÉQUENT ».
 * Écraser le lieu ferait perdre la trace du déplacement, alors que c'est précisément
 * ce que l'article vise. Le nouvel emplacement rouvre donc l'obligation de notifier.
 */
export async function moveTrustProperty(params: {
  cabinetId: string;
  propertyId: string;
  newLocation: string;
  movedAt: Date;
  userId: string;
}): Promise<{ noticeRequired: boolean; reference: string }> {
  const property = await prisma.trustProperty.findFirst({
    where: { id: params.propertyId, cabinetId: params.cabinetId },
  });
  if (!property) throw new Error("Bien introuvable pour ce cabinet");

  let history: Array<{ location: string; from: string | Date }> = [];
  try {
    history = property.storageHistoryJson ? JSON.parse(property.storageHistoryJson) : [];
  } catch {
    history = [];
  }
  history.push({ location: params.newLocation.trim(), from: params.movedAt });

  await prisma.trustProperty.update({
    where: { id: params.propertyId },
    data: {
      storageLocation: params.newLocation.trim(),
      storageHistoryJson: JSON.stringify(history),
      // Le déplacement rouvre l'obligation : la notification précédente portait sur
      // l'ancien emplacement.
      storageNotifiedAt: null,
    },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "TrustAccount",
    entityId: params.propertyId,
    action: "update",
    oldValues: { storageLocation: property.storageLocation },
    newValues: { type: "trust_property_moved", storageLocation: params.newLocation },
    performedBy: params.userId,
    performedAt: new Date(),
  });

  return {
    noticeRequired: property.province === "QC",
    reference: "B-1 r.5, art. 45",
  };
}

/** Consigne l'information donnée au client (art. 44 ou 45). */
export async function recordClientNotice(params: {
  cabinetId: string;
  propertyId: string;
  kind: "THIRD_PARTY" | "STORAGE";
  notifiedAt: Date;
  userId: string;
}): Promise<void> {
  await prisma.trustProperty.updateMany({
    where: { id: params.propertyId, cabinetId: params.cabinetId },
    data:
      params.kind === "THIRD_PARTY"
        ? { clientNotifiedAt: params.notifiedAt }
        : { storageNotifiedAt: params.notifiedAt },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "TrustAccount",
    entityId: params.propertyId,
    action: "update",
    newValues: {
      type: "trust_property_client_notified",
      kind: params.kind,
      reference: params.kind === "THIRD_PARTY" ? "B-1 r.5, art. 44" : "B-1 r.5, art. 45",
    },
    performedBy: params.userId,
    performedAt: new Date(),
  });
}

/**
 * Remet le bien, « dès remise » (art. 43).
 *
 * Le destinataire est obligatoire : l'art. 43 et la s. 18(9) exigent tous deux « le
 * nom de la personne à qui il le remet ». Une remise anonyme ne prouve rien.
 */
export async function releaseTrustProperty(params: {
  cabinetId: string;
  propertyId: string;
  releasedAt: Date;
  releasedToName: string;
  signatureDocumentId?: string | null;
  userId: string;
}): Promise<void> {
  const province = resolveProvince(await getCabinetProvince(params.cabinetId));

  const property = await prisma.trustProperty.findFirst({
    where: { id: params.propertyId, cabinetId: params.cabinetId },
    select: { id: true, releasedAt: true, description: true },
  });
  if (!property) throw new Error("Bien introuvable pour ce cabinet");

  if (property.releasedAt) {
    throw new TrustPropertyError({
      code: "ALREADY_RELEASED",
      message: `Ce bien a déjà été remis le ${property.releasedAt.toISOString().slice(0, 10)}.`,
      reference: province === "QC" ? "B-1 r.5, art. 43" : "By-Law 9, s. 18(9)",
      remedy: "Le registre est permanent : une remise ne se reprend pas, elle se corrige par une inscription nouvelle.",
    });
  }

  if (!params.releasedToName.trim()) {
    throw new TrustPropertyError({
      code: "RELEASE_RECIPIENT_REQUIRED",
      message: "Le nom de la personne à qui le bien est remis est obligatoire.",
      reference: province === "QC" ? "B-1 r.5, art. 43" : "By-Law 9, s. 18(9)",
      remedy: "Indiquez le destinataire. Une remise anonyme ne prouve rien à l'inspection.",
    });
  }

  await prisma.trustProperty.update({
    where: { id: params.propertyId },
    data: {
      releasedAt: params.releasedAt,
      releasedToName: params.releasedToName.trim(),
      releaseSignatureDocumentId: params.signatureDocumentId ?? undefined,
    },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "TrustAccount",
    entityId: params.propertyId,
    action: "update",
    newValues: {
      type: "trust_property_released",
      releasedToName: params.releasedToName,
      releasedAt: params.releasedAt.toISOString(),
    },
    performedBy: params.userId,
    performedAt: new Date(),
  });
}

/* ════════════════════════════════════════════════════════════════
   LECTURES
   ════════════════════════════════════════════════════════════════ */

/** Biens détenus, ou tous les biens si `includeReleased`. */
export async function listTrustProperties(params: {
  cabinetId: string;
  clientId?: string | null;
  dossierId?: string | null;
  includeReleased?: boolean;
}) {
  return prisma.trustProperty.findMany({
    where: {
      cabinetId: params.cabinetId,
      ...(params.clientId ? { clientId: params.clientId } : {}),
      ...(params.dossierId ? { dossierId: params.dossierId } : {}),
      ...(params.includeReleased ? {} : { releasedAt: null }),
    },
    orderBy: [{ receivedAt: "asc" }],
    include: { client: { select: { raisonSociale: true, prenom: true, nom: true } } },
  });
}

/**
 * Obligations d'information en attente sur les biens détenus.
 *
 * Alimente le tableau de conformité. Vide en Ontario, où la s. 18(9) n'impose aucune
 * notification au client.
 */
export async function getPendingPropertyNotices(params: { cabinetId: string }) {
  const province = resolveProvince(await getCabinetProvince(params.cabinetId));
  if (province !== "QC") return [];

  const properties = await prisma.trustProperty.findMany({
    where: { cabinetId: params.cabinetId, releasedAt: null },
    include: { client: { select: { raisonSociale: true, prenom: true, nom: true } } },
  });

  return properties
    .map((p) => {
      const duties = getClientNoticeDuties({
        province,
        fromThirdParty: p.fromThirdParty,
        clientNotifiedAt: p.clientNotifiedAt,
        storageLocation: p.storageLocation,
        storageNotifiedAt: p.storageNotifiedAt,
        // Un lieu renseigné sans notification postérieure signale un déplacement non
        // communiqué : `moveTrustProperty` remet `storageNotifiedAt` à null.
        storageChangedSinceNotice: false,
      }).filter((d) => !d.done);
      return { property: p, duties };
    })
    .filter((x) => x.duties.length > 0);
}

/** Biens encore détenus pour un dossier, avant sa fermeture. */
export async function checkPropertiesBeforeDossierClosure(params: {
  cabinetId: string;
  dossierId: string;
}) {
  const province = resolveProvince(await getCabinetProvince(params.cabinetId));
  const heldPropertyCount = await prisma.trustProperty.count({
    where: { cabinetId: params.cabinetId, dossierId: params.dossierId, releasedAt: null },
  });
  return checkPropertiesBeforeClosure({ province, heldPropertyCount });
}

/** Règle de conservation applicable, pour la purge et le tableau de rétention. */
export async function getPropertyRetention(cabinetId: string) {
  const province = resolveProvince(await getCabinetProvince(cabinetId));
  return getPropertyRetentionRule(province);
}

/** Champs exigés, pour piloter le formulaire de saisie. */
export async function getPropertyFormFields(cabinetId: string): Promise<{
  province: CabinetProvince;
  fields: TrustPropertyField[];
}> {
  const province = resolveProvince(await getCabinetProvince(cabinetId));
  const { getTrustPropertyFields } = await import("@/lib/compliance/trust-property");
  return { province, fields: getTrustPropertyFields(province) };
}
