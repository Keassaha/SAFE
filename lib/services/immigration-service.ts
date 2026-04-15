/**
 * Service immigration — workflow IRCC, déclaration antécédents, suivi documents.
 * Besoins: D3, D6, D7, D8
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";

// IRCC workflow steps
export const IRCC_STATUTS = [
  { value: "consultation", label: "Initial Consultation", order: 1 },
  { value: "preparation", label: "File Preparation", order: 2 },
  { value: "soumission", label: "Application Submitted", order: 3 },
  { value: "biometrie", label: "Biometrics", order: 4 },
  { value: "suivi", label: "Follow-up / PFL", order: 5 },
  { value: "decision", label: "Decision / COPR", order: 6 },
  { value: "cloture", label: "Landing & Closure", order: 7 },
] as const;

// Document expiry rules
const EXPIRY_RULES: Record<string, number> = {
  medical: 12,          // 12 months
  police_cert: 6,       // ~6 months recommended coverage
  language_test: 24,    // 2 years for most language tests
  biometrics: 120,      // 10 years
  education_credential: 60, // 5 years for ECA
};

/** Update the IRCC workflow status for a dossier */
export async function updateIrccStatut(params: {
  dossierId: string;
  cabinetId: string;
  irccStatut: string;
  userId: string;
}) {
  const { dossierId, cabinetId, irccStatut, userId } = params;

  const validStatut = IRCC_STATUTS.find((s) => s.value === irccStatut);
  if (!validStatut) throw new Error("Invalid IRCC status");

  await prisma.dossier.updateMany({
    where: { id: dossierId, cabinetId },
    data: { irccStatut },
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Dossier",
    entityId: dossierId,
    action: "update",
    newValues: { irccStatut, step: validStatut.label },
    performedBy: userId,
    performedAt: new Date(),
  });
}

/** Set ITA date and calculate submission deadline (60 days) */
export async function setItaDate(params: {
  dossierId: string;
  cabinetId: string;
  itaDate: Date;
  userId: string;
}) {
  const { dossierId, cabinetId, itaDate, userId } = params;
  const submissionDeadline = new Date(itaDate);
  submissionDeadline.setDate(submissionDeadline.getDate() + 60);

  await prisma.dossier.updateMany({
    where: { id: dossierId, cabinetId },
    data: {
      itaDate,
      submissionDeadline,
      irccStatut: "preparation",
    },
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Dossier",
    entityId: dossierId,
    action: "update",
    newValues: {
      itaDate: itaDate.toISOString(),
      submissionDeadline: submissionDeadline.toISOString(),
      daysToSubmit: 60,
    },
    performedBy: userId,
    performedAt: new Date(),
  });
}

/** Save or update immigration background declaration (D7) */
export async function saveBackgroundDeclaration(params: {
  dossierId: string;
  data: {
    priorRefusal: boolean;
    priorRefusalDetails?: string;
    overstay: boolean;
    overstayDetails?: string;
    criminalRecord: boolean;
    criminalDetails?: string;
    deportation: boolean;
    deportationDetails?: string;
    misrepresentation: boolean;
    misrepresentationDetails?: string;
    clientSignedAt?: Date;
  };
  userId: string;
  cabinetId: string;
}) {
  const { dossierId, data, userId, cabinetId } = params;

  const background = await prisma.immigrationBackground.upsert({
    where: { dossierId },
    create: {
      dossierId,
      ...data,
      completedAt: new Date(),
    },
    update: {
      ...data,
      completedAt: new Date(),
    },
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Dossier",
    entityId: dossierId,
    action: "create",
    metadata: {
      type: "immigration_background",
      hasRisks: data.priorRefusal || data.overstay || data.criminalRecord || data.deportation || data.misrepresentation,
      misrepresentation: data.misrepresentation,
    },
    performedBy: userId,
    performedAt: new Date(),
  });

  return background;
}

/** Add or update an immigration document with auto-calculated expiry (D8) */
export async function upsertImmigrationDocument(params: {
  id?: string;
  dossierId: string;
  type: string;
  label?: string;
  issuedAt: Date;
  cabinetId: string;
  userId: string;
}) {
  const { id, dossierId, type, label, issuedAt, cabinetId, userId } = params;

  // Calculate expiry based on type
  const expiryMonths = EXPIRY_RULES[type];
  let expiresAt: Date | null = null;
  if (expiryMonths) {
    expiresAt = new Date(issuedAt);
    expiresAt.setMonth(expiresAt.getMonth() + expiryMonths);
  }

  if (id) {
    return prisma.immigrationDocument.update({
      where: { id },
      data: { type, label, issuedAt, expiresAt, alertSent30d: false, alertSent7d: false },
    });
  }

  const doc = await prisma.immigrationDocument.create({
    data: { dossierId, type, label, issuedAt, expiresAt },
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Dossier",
    entityId: dossierId,
    action: "create",
    metadata: {
      type: "immigration_document",
      docType: type,
      expiresAt: expiresAt?.toISOString(),
    },
    performedBy: userId,
    performedAt: new Date(),
  });

  return doc;
}

/** Get immigration documents for a dossier with expiry status */
export async function getImmigrationDocuments(dossierId: string) {
  const docs = await prisma.immigrationDocument.findMany({
    where: { dossierId },
    orderBy: { type: "asc" },
  });

  const now = new Date();
  return docs.map((doc) => {
    let expiryStatus: "valid" | "expiring_soon" | "expired" | "unknown" = "unknown";
    let daysUntilExpiry: number | null = null;

    if (doc.expiresAt) {
      daysUntilExpiry = Math.ceil(
        (doc.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiry <= 0) expiryStatus = "expired";
      else if (daysUntilExpiry <= 30) expiryStatus = "expiring_soon";
      else expiryStatus = "valid";
    }

    return { ...doc, expiryStatus, daysUntilExpiry };
  });
}

/** Get immigration background for a dossier */
export async function getImmigrationBackground(dossierId: string) {
  return prisma.immigrationBackground.findUnique({
    where: { dossierId },
  });
}

/** Get immigration dossier summary (workflow + docs + background) */
export async function getImmigrationSummary(dossierId: string) {
  const [dossier, background, documents] = await Promise.all([
    prisma.dossier.findUnique({
      where: { id: dossierId },
      select: {
        irccStatut: true,
        irccNumDossier: true,
        itaDate: true,
        submissionDeadline: true,
        cnpCode: true,
        cnpValidated: true,
        sousType: true,
      },
    }),
    getImmigrationBackground(dossierId),
    getImmigrationDocuments(dossierId),
  ]);

  // Calculate ITA deadline
  let itaDeadline: { daysLeft: number; isUrgent: boolean; isCritical: boolean } | null = null;
  if (dossier?.submissionDeadline) {
    const daysLeft = Math.ceil(
      (dossier.submissionDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    itaDeadline = {
      daysLeft,
      isUrgent: daysLeft <= 14,
      isCritical: daysLeft <= 7,
    };
  }

  // Flag expired docs
  const expiredDocs = documents.filter((d) => d.expiryStatus === "expired");
  const expiringSoonDocs = documents.filter((d) => d.expiryStatus === "expiring_soon");

  return {
    workflow: dossier,
    background,
    documents,
    itaDeadline,
    expiredDocs: expiredDocs.length,
    expiringSoonDocs: expiringSoonDocs.length,
    hasBackgroundRisks: background
      ? background.priorRefusal || background.overstay || background.criminalRecord || background.deportation || background.misrepresentation
      : null,
    misrepresentationRisk: background?.misrepresentation ?? false,
  };
}
