/**
 * Moteur de règles apprenantes pour la catégorisation des dépenses.
 * Applique d'abord les règles USER, puis SYSTEM; calcule un score de confiance.
 */

import type { PrismaClient } from "@prisma/client";
import { ExpenseCategorizationRuleSource } from "@prisma/client";
import { SYSTEM_SUPPLIER_CATEGORY_MAP } from "./constants";
import { normalizeSupplier } from "./normalize-supplier";

export type SuggestionResult = {
  categoryName: string | null;
  categoryId: string | null;
  refacturable: boolean;
  dossierId: string | null;
  confidence: number;
  ruleId: string | null;
};

function tokenizeForMatch(text: string): string[] {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Applique les règles du cabinet (USER puis SYSTEM) pour proposer une catégorie.
 */
export async function suggestCategoryFromRules(
  prisma: PrismaClient,
  cabinetId: string,
  rawDescription: string,
  normalizedSupplier: string
): Promise<SuggestionResult> {
  const result: SuggestionResult = {
    categoryName: null,
    categoryId: null,
    refacturable: false,
    dossierId: null,
    confidence: 0,
    ruleId: null,
  };

  const upperDesc = rawDescription.toUpperCase();
  const upperSupplier = normalizedSupplier.toUpperCase();
  const tokens = tokenizeForMatch(rawDescription);
  const supplierTokens = tokenizeForMatch(normalizedSupplier);

  const rules = await prisma.expenseCategorizationRule.findMany({
    where: { cabinetId, isActive: true },
    orderBy: [{ source: "asc" }, { usageCount: "desc" }, { lastUsedAt: "desc" }],
  });

  for (const rule of rules) {
    const patternUpper = rule.pattern.toUpperCase();
    const matchByPattern =
      upperDesc.includes(patternUpper) ||
      upperSupplier.includes(patternUpper) ||
      tokens.some((t) => t.includes(patternUpper) || patternUpper.includes(t)) ||
      supplierTokens.some((t) => t.includes(patternUpper) || patternUpper.includes(t));
    const matchBySupplier =
      rule.fournisseurNormalise &&
      upperSupplier.includes(rule.fournisseurNormalise.toUpperCase());

    if (matchByPattern || matchBySupplier) {
      result.categoryName = rule.categoryName;
      result.categoryId = rule.categoryId;
      result.refacturable = rule.refacturable;
      result.dossierId = rule.dossierId;
      result.confidence = rule.confidence;
      result.ruleId = rule.id;
      return result;
    }
  }

  const systemCategory =
    SYSTEM_SUPPLIER_CATEGORY_MAP[upperSupplier] ??
    Object.entries(SYSTEM_SUPPLIER_CATEGORY_MAP).find(
      ([key]) => upperDesc.includes(key) || upperSupplier.includes(key)
    )?.[1];
  if (systemCategory) {
    result.categoryName = systemCategory;
    result.confidence = 0.85;
    return result;
  }

  return result;
}

/**
 * Crée ou met à jour une règle utilisateur et l'applique aux futures transactions.
 */
export async function learnCategorizationRule(
  prisma: PrismaClient,
  cabinetId: string,
  options: {
    pattern: string;
    fournisseurNormalise?: string | null;
    categoryName: string;
    categoryId?: string | null;
    refacturable?: boolean;
    dossierId?: string | null;
  }
): Promise<{ id: string }> {
  const normalized = options.fournisseurNormalise ?? normalizeSupplier(options.pattern);
  const existing = await prisma.expenseCategorizationRule.findFirst({
    where: {
      cabinetId,
      source: ExpenseCategorizationRuleSource.USER,
      isActive: true,
      OR: [
        { pattern: { equals: options.pattern } },
        { fournisseurNormalise: { equals: normalized } },
      ],
    },
  });

  if (existing) {
    await prisma.expenseCategorizationRule.update({
      where: { id: existing.id },
      data: {
        categoryName: options.categoryName,
        categoryId: options.categoryId ?? undefined,
        refacturable: options.refacturable ?? false,
        dossierId: options.dossierId ?? undefined,
        fournisseurNormalise: normalized,
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
    return { id: existing.id };
  }

  const created = await prisma.expenseCategorizationRule.create({
    data: {
      cabinetId,
      pattern: options.pattern,
      fournisseurNormalise: normalized,
      categoryName: options.categoryName,
      categoryId: options.categoryId,
      refacturable: options.refacturable ?? false,
      dossierId: options.dossierId,
      confidence: 0.9,
      source: ExpenseCategorizationRuleSource.USER,
      usageCount: 1,
      lastUsedAt: new Date(),
    },
  });
  return { id: created.id };
}

/**
 * Détecte si une transaction parsée est une dépense (débit) à prendre en compte.
 */
export function isExpenseTransaction(
  amount: number,
  rawType: "debit" | "credit"
): boolean {
  if (amount <= 0) return false;
  return rawType === "debit";
}
