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
import { BILLING_MODES } from "./billing-modes";

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

/* ══════════════════════════════════════════════════════════════════════════
   MODE DE FACTURATION PRINCIPAL
   ══════════════════════════════════════════════════════════════════════════

   Le mode vit dans `CabinetInterface.modules.facturation.principal`, lu par
   `getCabinetInterfaceDerived` puis distribué à toute l'application.

   POURQUOI CETTE ACTION EXISTE

   Toute l'interface sait déjà s'adapter au forfait : le formulaire de dossier
   et l'assistant de création cessent de demander un taux horaire, la facture
   affiche « Tâches facturées » au lieu de « Lignes de facture », et le mode
   mixte fait apparaître une bascule Forfait / Heures par ligne.

   Ce qui manquait était l'interrupteur. Jusqu'ici, `modules.facturation.principal`
   n'était écrit QUE par les scripts d'amorçage et la configuration par bundle.
   Un cabinet installé sans cette clé retombait sur « horaire » par défaut et
   n'avait plus aucun moyen d'en sortir depuis l'application. Le mode forfait
   existait sans être atteignable.
*/

const billingModeSchema = z.object({
  principal: z.enum(BILLING_MODES),
});

export type BillingModeResult = { ok: true } | { ok: false; error: string };

export async function updateBillingMode(input: {
  principal: string;
}): Promise<BillingModeResult> {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canManageCabinetSettings(role as UserRole)) {
    return { ok: false, error: "Droits insuffisants." };
  }

  const parsed = billingModeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Mode de facturation invalide." };
  }

  const existing = await prisma.cabinetInterface.findUnique({
    where: { cabinetId },
    select: { modules: true },
  });

  // Fusion, jamais remplacement : `modules` porte aussi la configuration de
  // taxes, le profil comptable et la conformité. Écraser le JSON réinitialiserait
  // silencieusement le régime de taxes du cabinet.
  let modules: Record<string, unknown> = {};
  if (existing?.modules) {
    try {
      const parsedModules = JSON.parse(existing.modules);
      if (parsedModules && typeof parsedModules === "object") {
        modules = parsedModules as Record<string, unknown>;
      }
    } catch {
      /* JSON illisible : on repart d'un objet vide plutôt que de refuser le réglage. */
    }
  }

  const facturation = (modules.facturation as Record<string, unknown>) ?? {};
  const avant = typeof facturation.principal === "string" ? facturation.principal : null;
  modules.facturation = { ...facturation, principal: parsed.data.principal };
  const json = JSON.stringify(modules);

  await prisma.cabinetInterface.upsert({
    where: { cabinetId },
    create: { cabinetId, modules: json },
    update: { modules: json },
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Cabinet",
    entityId: cabinetId,
    action: "update",
    oldValues: { billingPrincipal: avant },
    newValues: { billingPrincipal: parsed.data.principal },
    performedBy: userId,
    performedAt: new Date(),
  });

  // Le mode change l'interface partout : dossiers, facturation, tableau de bord.
  // On invalide la racine plutôt que d'énumérer des chemins qu'on oublierait.
  revalidatePath("/", "layout");
  return { ok: true };
}
