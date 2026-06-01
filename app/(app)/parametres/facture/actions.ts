"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { UserRole } from "@prisma/client";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canManageCabinetSettings } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/services/audit";
import { sanitizeInput } from "@/lib/utils/sanitize";
import { mergeCabinetConfig } from "@/lib/cabinet-config";
import { isAccentDarkEnough, normalizeHex } from "@/lib/invoice-template/color";

/**
 * Server action — apparence de la facture du cabinet.
 *
 * Met à jour `Cabinet.config.invoice` (couleur d'accent, mentions N.B.,
 * signature) + `Cabinet.logoUrl`. Préserve le reste du JSON config via
 * `mergeCabinetConfig`. JAMAIS de n° de Barreau sur la facture (le réglage
 * n'expose pas ce champ).
 */

const MAX_LOGO_CHARS = 400_000; // ~300 Ko en base64
const MAX_NOTICE_LINES = 8;
const MAX_LINE_LEN = 400;

const appearanceSchema = z.object({
  accentColor: z
    .string()
    .trim()
    .refine((v) => normalizeHex(v) !== null, "Couleur invalide (format #RRGGBB attendu).")
    .refine((v) => isAccentDarkEnough(v), "Couleur trop claire : le texte blanc ne serait pas lisible."),
  logoUrl: z
    .string()
    .trim()
    .max(MAX_LOGO_CHARS, "Logo trop volumineux (max ~300 Ko).")
    .refine(
      (v) => v === "" || v.startsWith("data:image/") || /^https?:\/\//.test(v),
      "Le logo doit être une image (data-URI) ou une URL http(s).",
    )
    .optional()
    .default(""),
  noticeFr: z.array(z.string().max(MAX_LINE_LEN)).max(MAX_NOTICE_LINES).optional().default([]),
  noticeEn: z.array(z.string().max(MAX_LINE_LEN)).max(MAX_NOTICE_LINES).optional().default([]),
  signatureName: z.string().trim().max(120).optional().default(""),
  signatureTitleFr: z.string().trim().max(80).optional().default(""),
  signatureTitleEn: z.string().trim().max(80).optional().default(""),
});

export type InvoiceAppearanceInput = z.input<typeof appearanceSchema>;

export type InvoiceAppearanceResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateInvoiceAppearance(
  input: InvoiceAppearanceInput,
): Promise<InvoiceAppearanceResult> {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canManageCabinetSettings(role as UserRole)) {
    return { ok: false, error: "Action réservée aux administrateurs du cabinet." };
  }

  const parsed = appearanceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const data = parsed.data;

  const cleanLines = (lines: string[]) =>
    lines.map((l) => sanitizeInput(l.trim())).filter((l) => l.length > 0);

  const noticeFr = cleanLines(data.noticeFr);
  const noticeEn = cleanLines(data.noticeEn);
  const sigName = data.signatureName ? sanitizeInput(data.signatureName) : "";

  const current = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { config: true },
  });

  const newConfig = mergeCabinetConfig(current?.config ?? null, {
    invoice: {
      accentColor: normalizeHex(data.accentColor) ?? undefined,
      notice: { fr: noticeFr, en: noticeEn },
      signature: sigName
        ? {
            name: sigName,
            title: {
              fr: data.signatureTitleFr ? sanitizeInput(data.signatureTitleFr) : "",
              en: data.signatureTitleEn ? sanitizeInput(data.signatureTitleEn) : "",
            },
          }
        : undefined,
    },
  });

  await prisma.cabinet.update({
    where: { id: cabinetId },
    data: {
      config: newConfig,
      // logoUrl : data-URI (ou URL). Chaîne vide → on retire le logo.
      logoUrl: data.logoUrl ? data.logoUrl : null,
    },
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Cabinet",
    entityId: cabinetId,
    action: "update",
    metadata: { fields: ["invoice.accentColor", "invoice.notice", "invoice.signature", "logoUrl"] },
  });

  revalidatePath("/parametres/facture");
  revalidatePath("/parametres");
  return { ok: true };
}
