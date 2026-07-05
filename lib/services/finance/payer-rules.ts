import { prisma } from "@/lib/db";
import { normalizeText } from "@/lib/services/finance/match-payment";

/**
 * CRUD des règles de payeur tiers (import intelligent de preuve de paiement, lot L5).
 * `payerName` est toujours stocké NORMALISÉ pour que le matcher le compare correctement.
 */

export type PayerRuleScope = "CLIENT_UNIQUE" | "PAYEUR_CONNU";

export interface CreatePayerRuleInput {
  cabinetId: string;
  payerEmail?: string | null;
  payerName?: string | null;
  clientId?: string | null;
  dossierId?: string | null;
  scope: PayerRuleScope;
  note?: string | null;
  source?: "manuel" | "appris";
  createdById?: string | null;
}

/**
 * Crée une règle. Idempotent au bon sens : si une règle active existe déjà pour
 * le même payeur (courriel ou nom normalisé) dans ce cabinet, on ne duplique pas.
 * Retourne la règle existante le cas échéant.
 */
export async function createPayerRule(input: CreatePayerRuleInput) {
  const payerEmail = input.payerEmail?.trim().toLowerCase() || null;
  const payerName = input.payerName ? normalizeText(input.payerName) : null;

  if (!payerEmail && !payerName) {
    throw new Error("Un payeur (courriel ou nom) est requis.");
  }
  if (input.scope === "CLIENT_UNIQUE" && !input.clientId) {
    throw new Error("Une règle « client unique » doit cibler un client.");
  }

  const existing = await prisma.payerRule.findFirst({
    where: {
      cabinetId: input.cabinetId,
      active: true,
      OR: [
        ...(payerEmail ? [{ payerEmail }] : []),
        ...(payerName ? [{ payerName }] : []),
      ],
    },
  });
  if (existing) return existing;

  return prisma.payerRule.create({
    data: {
      cabinetId: input.cabinetId,
      payerEmail,
      payerName,
      clientId: input.clientId ?? null,
      dossierId: input.dossierId ?? null,
      scope: input.scope,
      note: input.note?.trim() || null,
      source: input.source ?? "manuel",
      createdById: input.createdById ?? null,
    },
  });
}

export async function listPayerRules(cabinetId: string) {
  return prisma.payerRule.findMany({
    where: { cabinetId },
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    include: { client: { select: { raisonSociale: true, prenom: true, nom: true } } },
  });
}

export async function setPayerRuleActive(cabinetId: string, id: string, active: boolean) {
  const rule = await prisma.payerRule.findFirst({ where: { id, cabinetId } });
  if (!rule) throw new Error("Règle introuvable.");
  return prisma.payerRule.update({ where: { id }, data: { active } });
}

export async function deletePayerRule(cabinetId: string, id: string) {
  const rule = await prisma.payerRule.findFirst({ where: { id, cabinetId } });
  if (!rule) throw new Error("Règle introuvable.");
  await prisma.payerRule.delete({ where: { id } });
}
