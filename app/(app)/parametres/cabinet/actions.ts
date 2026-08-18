"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { UserRole } from "@prisma/client";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canManageCabinetSettings } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/services/audit";
import { sanitizeInput } from "@/lib/utils/sanitize";
import { mergeCabinetConfig } from "@/lib/cabinet-config";
import { parseCabinetConfig, setProrataVehicule } from "@/lib/cabinet-config";
import { toCalendarDayUTC, toIsoDay } from "@/lib/utils/calendar-date";

/**
 * Server action — édite l'identité publique du cabinet (colonnes Cabinet)
 * et les numéros de taxes (Cabinet.config.taxNumbers).
 *
 * Doctrine : préserver le reste du JSON config via `mergeCabinetConfig`,
 * ne jamais écraser `envoiFactureClient` ni `tauxInteret` etc.
 */
const cabinetIdentitySchema = z.object({
  nom: z.string().trim().min(2, "Le nom légal du cabinet est requis."),
  adresse: z.string().trim().optional().nullable(),
  email: z
    .string()
    .trim()
    .email("Adresse courriel invalide.")
    .optional()
    .or(z.literal("")),
  telephone: z.string().trim().optional().nullable(),
  barreauNumero: z.string().trim().optional().nullable(),
  logoUrl: z
    .string()
    .trim()
    .url("URL de logo invalide.")
    .optional()
    .or(z.literal("")),
  hstNumber: z.string().trim().optional().nullable(),
  gstNumber: z.string().trim().optional().nullable(),
  qstNumber: z.string().trim().optional().nullable(),
  businessNumber: z.string().trim().optional().nullable(),
});

export async function updateCabinetIdentity(formData: FormData) {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canManageCabinetSettings(role as UserRole)) {
    redirect("/parametres?error=forbidden");
  }

  const raw = {
    nom: (formData.get("nom") as string) ?? "",
    adresse: (formData.get("adresse") as string) || null,
    email: (formData.get("email") as string) || "",
    telephone: (formData.get("telephone") as string) || null,
    barreauNumero: (formData.get("barreauNumero") as string) || null,
    logoUrl: (formData.get("logoUrl") as string) || "",
    hstNumber: (formData.get("hstNumber") as string) || null,
    gstNumber: (formData.get("gstNumber") as string) || null,
    qstNumber: (formData.get("qstNumber") as string) || null,
    businessNumber: (formData.get("businessNumber") as string) || null,
  };

  const parsed = cabinetIdentitySchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/parametres/cabinet?error=invalid");
  }

  const data = parsed.data;
  const s = (v: string | undefined | null) => (v ? sanitizeInput(v) : null);

  // Lecture du config courant pour préserver les autres clés (envoiFactureClient, etc.).
  const current = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { config: true },
  });

  const newConfig = mergeCabinetConfig(current?.config ?? null, {
    taxNumbers: {
      hstNumber: data.hstNumber ? sanitizeInput(data.hstNumber) : undefined,
      gstNumber: data.gstNumber ? sanitizeInput(data.gstNumber) : undefined,
      qstNumber: data.qstNumber ? sanitizeInput(data.qstNumber) : undefined,
      businessNumber: data.businessNumber ? sanitizeInput(data.businessNumber) : undefined,
    },
  });

  await prisma.cabinet.update({
    where: { id: cabinetId },
    data: {
      nom: sanitizeInput(data.nom),
      adresse: s(data.adresse),
      email: data.email ? data.email.toLowerCase() : null,
      telephone: s(data.telephone),
      barreauNumero: s(data.barreauNumero),
      logoUrl: data.logoUrl || null,
      config: newConfig,
    },
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Cabinet",
    entityId: cabinetId,
    action: "update",
    metadata: {
      fields: [
        "nom",
        "adresse",
        "email",
        "telephone",
        "barreauNumero",
        "logoUrl",
        "taxNumbers",
      ],
    },
  });

  revalidatePath("/parametres");
  revalidatePath("/parametres/cabinet");
  redirect("/parametres/cabinet?success=updated");
}

/**
 * Enregistre la part d'usage d'affaires du véhicule pour un exercice.
 *
 * Spec : SPEC_DEPENSES_ET_PREPARATION_FISCALE.md §6, arbitrage CEO n° 1.
 *
 * Par ANNÉE : l'usage varie d'un exercice à l'autre, et appliquer la valeur de
 * cette année aux dépenses de l'an dernier produirait une déduction fausse sur un
 * exercice déjà déclaré.
 *
 * La date de saisie est conservée. C'est le minimum défendable pour une valeur
 * affirmée plutôt que calculée : sans registre kilométrique, savoir QUAND elle a
 * été déclarée est tout ce qui reste.
 */
export async function updateProrataVehicule(
  input: { annee: number; pourcentage: number },
): Promise<{ success: true } | { success: false; error: string }> {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canManageCabinetSettings(role as UserRole)) {
    return { success: false, error: "Vous n'avez pas les droits pour modifier ce réglage." };
  }

  if (!Number.isInteger(input.annee) || input.annee < 2000 || input.annee > 2100) {
    return { success: false, error: "Année invalide." };
  }
  // Refusé plutôt que corrigé en silence : un prorata hors bornes est une faute de
  // saisie, et la corriger pour l'utilisateur masquerait l'erreur.
  if (!(input.pourcentage >= 0 && input.pourcentage <= 100)) {
    return { success: false, error: "Le pourcentage doit être compris entre 0 et 100." };
  }

  const current = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { config: true },
  });
  const config = parseCabinetConfig(current?.config ?? null);
  const utilisateur = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { nom: true } })
    : null;

  const majConfig = setProrataVehicule(config, {
    annee: input.annee,
    prorata: Math.round(input.pourcentage) / 100,
    saisiLe: toIsoDay(toCalendarDayUTC(new Date())),
    saisiPar: utilisateur?.nom ?? undefined,
  });

  await prisma.cabinet.update({
    where: { id: cabinetId },
    data: { config: JSON.stringify(majConfig) },
  });

  await createAuditLog({
    cabinetId,
    userId: userId ?? undefined,
    entityType: "Cabinet",
    entityId: cabinetId,
    action: "update",
    newValues: { prorataVehicule: { annee: input.annee, pourcentage: input.pourcentage } },
    performedBy: userId ?? undefined,
    performedAt: new Date(),
  });

  revalidatePath("/parametres/cabinet");
  revalidatePath("/rapports");
  return { success: true };
}
