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
