"use server";

import { prisma } from "@/lib/db";
import { requireCabinetId, requireCabinetAndUser } from "@/lib/auth/session";
import { DEFAULT_EXPENSE_CATEGORIES } from "@/lib/expense-journal/constants";
import { suggestCategoryFromRules, learnCategorizationRule, isExpenseTransaction } from "@/lib/expense-journal/categorization-rules";
import { normalizeSupplier } from "@/lib/expense-journal/normalize-supplier";
import { parseBankStatementCsv } from "@/lib/expense-journal/parse-statement";
import { ExpenseJournalTransactionType, ExpenseJournalValidationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type ImportResult = {
  sessionId: string;
  totalRows: number;
  expensesDetected: number;
  toValidate: number;
  errors?: string[];
};

/**
 * Assure que les catégories système existent pour le cabinet.
 */
export async function ensureExpenseCategories(cabinetId: string): Promise<void> {
  const existing = await prisma.expenseCategory.findMany({
    where: { cabinetId },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((e) => e.name));
  for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
    if (!existingNames.has(cat.name)) {
      await prisma.expenseCategory.create({
        data: {
          cabinetId,
          name: cat.name,
          code: cat.code,
          isSystem: true,
          sortOrder: cat.sortOrder,
        },
      });
      existingNames.add(cat.name);
    }
  }
}

/**
 * Importe un relevé bancaire (CSV), crée la session et les transactions, puis applique les règles de catégorisation.
 */
export async function importBankStatement(
  fileName: string,
  csvText: string
): Promise<ImportResult> {
  const { cabinetId, userId } = await requireCabinetAndUser();
  const startTime = Date.now();
  await ensureExpenseCategories(cabinetId);

  const { map, transactions } = parseBankStatementCsv(csvText);
  const expenseTxs = transactions.filter((tx) => isExpenseTransaction(tx.amount, tx.rawType));
  let toValidate = 0;
  const importErrors: string[] = [];

  const session = await prisma.bankImportSession.create({
    data: {
      cabinetId,
      fileName,
      importedById: userId,
      nbLignes: transactions.length,
      nbDepensesDetectees: expenseTxs.length,
      status: "processed",
    },
  });

  for (const tx of expenseTxs) {
    try {
      const normalizedSupplier = normalizeSupplier(tx.description);
      const suggestion = await suggestCategoryFromRules(
        prisma,
        cabinetId,
        tx.description,
        normalizedSupplier
      );
      const status =
        suggestion.confidence >= 0.9 ? "categorized" : suggestion.categoryName ? "to_validate" : "new";
      if (status === "to_validate" || status === "new") toValidate++;

      await prisma.bankImportTransaction.create({
        data: {
          sessionId: session.id,
          cabinetId,
          date: new Date(tx.date),
          rawDescription: tx.description,
          rawAmount: tx.amount,
          rawType: tx.rawType,
          rawBalance: tx.balance,
          reference: tx.reference,
          normalizedSupplier,
          suggestedCategoryName: suggestion.categoryName ?? undefined,
          suggestedCategoryId: suggestion.categoryId ?? undefined,
          suggestedRefacturable: suggestion.refacturable,
          suggestedDossierId: suggestion.dossierId ?? undefined,
          confidence: suggestion.confidence,
          status,
        },
      });
    } catch (err) {
      importErrors.push(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  await prisma.bankImportSession.update({
    where: { id: session.id },
    data: { nbAValider: toValidate },
  });

  const durationMs = Date.now() - startTime;
  const createdCount = expenseTxs.length - importErrors.length;
  await prisma.importHistory.create({
    data: {
      cabinetId,
      userId,
      source: "journal_depenses",
      documentType: "releve_bancaire",
      fileName,
      status: importErrors.length === 0 ? "success" : createdCount > 0 ? "partial" : "failed",
      totalRows: transactions.length,
      createdCount,
      skippedCount: transactions.length - expenseTxs.length,
      errorCount: importErrors.length,
      errors: importErrors.length > 0 ? JSON.stringify(importErrors.slice(0, 50).map((m, i) => ({ row: i, message: m }))) : null,
      durationMs,
    },
  });

  revalidatePath("/journal/depenses");
  revalidatePath("/import");
  return {
    sessionId: session.id,
    totalRows: transactions.length,
    expensesDetected: expenseTxs.length,
    toValidate,
    errors: importErrors.length > 0 ? importErrors : undefined,
  };
}

export type ValidateTransactionInput = {
  transactionId: string;
  categoryId?: string | null;
  categoryName?: string | null;
  refacturable?: boolean;
  dossierId?: string | null;
  typeTransaction?: ExpenseJournalTransactionType;
  learnRule?: boolean;
};

/**
 * Valide une transaction importée : met à jour la transaction et crée une CabinetExpense.
 * Optionnellement crée une règle apprenante.
 */
export async function validateImportedTransaction(
  input: ValidateTransactionInput
): Promise<{ success: boolean; cabinetExpenseId?: string; error?: string }> {
  const { cabinetId, userId } = await requireCabinetAndUser();

  const tx = await prisma.bankImportTransaction.findFirst({
    where: { id: input.transactionId, cabinetId },
  });
  if (!tx) return { success: false, error: "Transaction introuvable" };

  if (input.learnRule && input.categoryName) {
    await learnCategorizationRule(prisma, cabinetId, {
      pattern: tx.rawDescription,
      fournisseurNormalise: tx.normalizedSupplier,
      categoryName: input.categoryName,
      categoryId: input.categoryId,
      refacturable: input.refacturable ?? false,
      dossierId: input.dossierId,
    });
  }

  const categoryName = input.categoryName ?? tx.suggestedCategoryName ?? "Autres";
  let categoryId = input.categoryId ?? tx.suggestedCategoryId;
  if (!categoryId) {
    const cat = await prisma.expenseCategory.findFirst({
      where: { cabinetId, name: categoryName },
      select: { id: true },
    });
    categoryId = cat?.id ?? null;
  }

  const typeTransaction = input.typeTransaction ?? ExpenseJournalTransactionType.DEPENSE;
  const isIgnore = typeTransaction === ExpenseJournalTransactionType.IGNORE;

  if (isIgnore) {
    await prisma.bankImportTransaction.update({
      where: { id: tx.id },
      data: { status: "ignored" },
    });
    revalidatePath("/journal/depenses");
    return { success: true };
  }

  const cabinetExpense = await prisma.cabinetExpense.create({
    data: {
      cabinetId,
      transactionImportId: tx.id,
      date: tx.date,
      descriptionBancaire: tx.rawDescription,
      fournisseurNormalise: tx.normalizedSupplier,
      categoryId: categoryId ?? undefined,
      categoryName,
      montant: tx.rawAmount,
      montantTtc: tx.rawAmount,
      typeTransaction,
      dossierId: input.dossierId ?? undefined,
      refacturable: input.refacturable ?? false,
      statutValidation: ExpenseJournalValidationStatus.VALIDE,
      confidence: tx.confidence ?? undefined,
      createdById: userId,
    },
  });

  await prisma.bankImportTransaction.update({
    where: { id: tx.id },
    data: {
      status: "validated",
      cabinetExpenseId: cabinetExpense.id,
    },
  });

  revalidatePath("/journal/depenses");
  return { success: true, cabinetExpenseId: cabinetExpense.id };
}

export type BulkApplyInput = {
  transactionIds: string[];
  categoryName: string;
  categoryId?: string | null;
  refacturable?: boolean;
  learnRule?: boolean;
};

/**
 * Applique une catégorie (et optionnellement une règle) à plusieurs transactions.
 */
export async function bulkApplyCategory(input: BulkApplyInput): Promise<{
  success: boolean;
  validated: number;
  errors: string[];
}> {
  const { cabinetId, userId } = await requireCabinetAndUser();
  const errors: string[] = [];
  let validated = 0;

  if (input.learnRule && input.transactionIds.length > 0) {
    const first = await prisma.bankImportTransaction.findFirst({
      where: { id: input.transactionIds[0], cabinetId },
    });
    if (first) {
      await learnCategorizationRule(prisma, cabinetId, {
        pattern: first.rawDescription,
        fournisseurNormalise: first.normalizedSupplier,
        categoryName: input.categoryName,
        categoryId: input.categoryId,
        refacturable: input.refacturable ?? false,
      });
    }
  }

  for (const transactionId of input.transactionIds) {
    const result = await validateImportedTransaction({
      transactionId,
      categoryId: input.categoryId,
      categoryName: input.categoryName,
      refacturable: input.refacturable,
      learnRule: false,
    });
    if (result.success) validated++;
    else if (result.error) errors.push(`${transactionId}: ${result.error}`);
  }

  revalidatePath("/journal/depenses");
  return { success: errors.length === 0, validated, errors };
}

/**
 * Marque une ou plusieurs transactions comme ignorées.
 */
export async function ignoreTransactions(
  transactionIds: string[]
): Promise<{ success: boolean; count: number }> {
  await requireCabinetId();
  const result = await prisma.bankImportTransaction.updateMany({
    where: { id: { in: transactionIds } },
    data: { status: "ignored" },
  });
  revalidatePath("/journal/depenses");
  return { success: true, count: result.count };
}
