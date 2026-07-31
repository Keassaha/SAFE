"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/services/audit";
import { canManageCabinetSettings } from "@/lib/auth/permissions";
import { sanitizeInput } from "@/lib/utils/sanitize";
import type { UserRole } from "@prisma/client";

/**
 * Réglages de conformité du cabinet.
 *
 * Deux leviers, et un principe commun : **une dérogation doit être attribuée**.
 * Qui l'a posée, quand, et pourquoi. Une dispense anonyme est une dispense que
 * personne n'assume — et c'est exactement ce qu'un inspecteur cherche quand il
 * demande pourquoi une règle n'a pas été appliquée.
 */

/**
 * Exigence de pièce justificative pour marquer une identité « vérifiée ».
 *
 * La lever ne dispense PAS de conserver la pièce (art. 22 B-1 r.5 / s. 23(13)
 * By-Law 7.1). Elle dispense de la déposer dans SAFE. Le motif est obligatoire :
 * il devient la réponse du cabinet à la question de l'inspecteur.
 */
export async function updateIdentityProofRequirement(formData: FormData) {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canManageCabinetSettings(role as UserRole)) {
    redirect("/parametres?error=forbidden");
  }

  const required = formData.get("identityProofRequired") === "true";
  const reason = sanitizeInput((formData.get("reason") as string) || "").trim();

  // On n'exige de motif que pour LEVER l'exigence. La rétablir n'a pas à se justifier.
  if (!required && reason.length < 10) {
    redirect("/parametres/conformite?error=reason_required");
  }

  const before = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { identityProofRequired: true },
  });

  await prisma.cabinet.update({
    where: { id: cabinetId },
    data: required
      ? {
          identityProofRequired: true,
          identityProofWaivedById: null,
          identityProofWaivedAt: null,
          identityProofWaiverReason: null,
        }
      : {
          identityProofRequired: false,
          identityProofWaivedById: userId,
          identityProofWaivedAt: new Date(),
          identityProofWaiverReason: reason,
        },
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Cabinet",
    entityId: cabinetId,
    action: "update",
    oldValues: { identityProofRequired: before?.identityProofRequired ?? true },
    newValues: { identityProofRequired: required, reason: required ? null : reason },
    metadata: { setting: "identity_proof_requirement" },
    performedBy: userId,
    performedAt: new Date(),
  });

  revalidatePath("/parametres/conformite");
  redirect("/parametres/conformite?success=1");
}

/**
 * Date d'application du garde-fou d'identité sur les mouvements de fonds.
 *
 * Volontairement une date et non un booléen : voir la migration
 * `20260730160000_ch06_identity_gate_enforcement_date`. Vider le champ remet le
 * cabinet en mode observation — le contrôle continue de tourner et de journaliser,
 * il cesse simplement de bloquer.
 */
export async function updateIdentityGateEnforcement(formData: FormData) {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canManageCabinetSettings(role as UserRole)) {
    redirect("/parametres?error=forbidden");
  }

  const raw = (formData.get("enforcedFrom") as string) || "";
  const enforcedFrom = raw ? new Date(raw) : null;

  await prisma.cabinet.update({
    where: { id: cabinetId },
    data: { identityGateEnforcedFrom: enforcedFrom },
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Cabinet",
    entityId: cabinetId,
    action: "update",
    newValues: { identityGateEnforcedFrom: enforcedFrom?.toISOString() ?? null },
    metadata: { setting: "identity_gate_enforcement" },
    performedBy: userId,
    performedAt: new Date(),
  });

  revalidatePath("/parametres/conformite");
  redirect("/parametres/conformite?success=1");
}
