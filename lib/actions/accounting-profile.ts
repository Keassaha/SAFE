"use server";

import { z } from "zod";
import type { UserRole } from "@prisma/client";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canManageCabinetSettings } from "@/lib/auth/permissions";
import { saveAccountingProfile, getAccountingProfile } from "@/lib/services/accounting-profile";
import type { AccountingProfileConfig } from "@/lib/accounting/profil-cabinet";

const accountingProfileSchema = z.object({
  province: z.string().min(2),
  taille: z.enum(["solo", "2_5", "6_plus"]),
  fideicommisPresent: z.boolean(),
  fideicommisActif: z.boolean(),
  methodeFacturation: z.enum(["horaire", "forfait", "mixte", "contingence"]),
  inscritTpsTvq: z.boolean(),
  frequenceTaxes: z.enum(["mensuelle", "trimestrielle", "annuelle"]).nullable(),
  comptableExterne: z.boolean(),
  logicielComptable: z.enum(["quickbooks", "xero", "sage", "autre", "aucun"]),
  besoinExportMensuel: z.boolean(),
  besoinRapprochement: z.boolean(),
  niveau: z.enum(["simplifie", "standard", "avance"]).optional(),
});

/** Enregistre le profil comptable du cabinet (questionnaire d'onboarding, SOP §4-5). */
export async function saveAccountingProfileAction(
  raw: unknown,
): Promise<{ ok: true; config: AccountingProfileConfig } | { ok: false; error: string }> {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canManageCabinetSettings(role as UserRole)) {
    return { ok: false, error: "forbidden" };
  }
  const parsed = accountingProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "invalid" };
  }
  const config = await saveAccountingProfile(cabinetId, parsed.data);
  return { ok: true, config };
}

/** Lit le profil comptable courant (null si pas encore configuré). */
export async function getAccountingProfileAction() {
  const { cabinetId } = await requireCabinetAndUser();
  return getAccountingProfile(cabinetId);
}
