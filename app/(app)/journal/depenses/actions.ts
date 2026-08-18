"use server";

import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canManageExpenseJournal } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { DEFAULT_EXPENSE_CATEGORIES } from "@/lib/expense-journal/constants";
import { suggestCategoryFromRules, learnCategorizationRule, isExpenseTransaction } from "@/lib/expense-journal/categorization-rules";
import { normalizeSupplier } from "@/lib/expense-journal/normalize-supplier";
import { parseBankStatementCsv } from "@/lib/expense-journal/parse-statement";
import { ExpenseJournalTransactionType, ExpenseJournalValidationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { writeJournalForCabinetExpense } from "@/lib/services/journal/cabinet-expense-journal";
import { applyCabinetExpenseCorrection } from "@/lib/services/journal/append-only-corrections";
import { decomposeExpenseTax } from "@/lib/expense-journal/tax-decomposition";
import { getCabinetTaxConfigById } from "@/lib/billing/cabinet-tax-config";
import { reprendreTaxesHistoriques, type RepriseResume } from "@/lib/expense-journal/reprise-taxes";

export type ImportResult = {
  sessionId: string;
  totalRows: number;
  expensesDetected: number;
  toValidate: number;
  errors?: string[];
};

/**
 * Tenir le journal des dépenses : import de relevé, catégorisation, validation,
 * correction, mise à l'écart.
 *
 * Ces actions ne vérifiaient qu'une session. Elles étaient protégées par
 * ricochet : seule la page pouvait les déclencher, et la page refusait les
 * autres rôles. Depuis que l'avocat peut LIRE la comptabilité (décision CEO
 * 2026-08-12), ce ricochet ne suffit plus, sinon ouvrir la lecture ouvrirait
 * l'écriture avec elle. Le mur est donc ici, où il aurait toujours dû être.
 *
 * Aucun changement pour les rôles qui tenaient déjà le journal : admin,
 * comptabilité et assistante passent, comme avant.
 */
async function requireExpenseJournalWriter() {
  const session = await requireCabinetAndUser();
  if (!canManageExpenseJournal(session.role as UserRole)) {
    throw new Error("Accès refusé : tenir le journal des dépenses demande un rôle d'administration ou de comptabilité.");
  }
  return session;
}

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
  const { cabinetId, userId } = await requireExpenseJournalWriter();
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
  const { cabinetId, userId } = await requireExpenseJournalWriter();

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

  // Décomposition de la taxe payée (lot 1, spec §2.1). Jusqu'ici ce chemin écrivait
  // le montant brut deux fois et s'arrêtait là : le gros du volume des dépenses
  // arrivait donc sans aucune taxe récupérable, et le cabinet remettait trop.
  //
  // La décomposition est pilotée par la CATÉGORIE : sur un salaire ou une prime
  // d'assurance, elle refuse de fabriquer une taxe qui n'existe pas.
  const taxConfig = await getCabinetTaxConfigById(cabinetId);
  const categoryCode = categoryId
    ? (await prisma.expenseCategory.findUnique({ where: { id: categoryId }, select: { code: true } }))?.code
    : null;
  const taxes = decomposeExpenseTax({
    montantTtc: tx.rawAmount,
    categoryCode,
    taxConfig,
  });

  // Atomicité : la création de la CabinetExpense, la mise à jour de la
  // BankImportTransaction et l'écriture au journal général doivent réussir
  // ensemble, ou échouer ensemble. Si l'écriture journal échoue, on ne veut
  // surtout pas garder une CabinetExpense orpheline (incohérence comptable).
  // L'idempotence du helper journal (sourceModule + sourceId) protège
  // de toute façon contre un retry après crash partiel.
  const cabinetExpense = await prisma.$transaction(async (txClient) => {
    const expense = await txClient.cabinetExpense.create({
      data: {
        cabinetId,
        transactionImportId: tx.id,
        date: tx.date,
        descriptionBancaire: tx.rawDescription,
        fournisseurNormalise: tx.normalizedSupplier,
        categoryId: categoryId ?? undefined,
        categoryName,
        montant: tx.rawAmount,
        montantHt: taxes.montantHt,
        tps: taxes.tps,
        tvq: taxes.tvq,
        montantTtc: taxes.montantTtc,
        taxOrigin: taxes.origine,
        typeTransaction,
        dossierId: input.dossierId ?? undefined,
        refacturable: input.refacturable ?? false,
        statutValidation: ExpenseJournalValidationStatus.VALIDE,
        confidence: tx.confidence ?? undefined,
        createdById: userId,
      },
    });

    await txClient.bankImportTransaction.update({
      where: { id: tx.id },
      data: {
        status: "validated",
        cabinetExpenseId: expense.id,
      },
    });

    // Doctrine §4 — toute CabinetExpense validée doit produire une écriture
    // journal append-only. L'helper est idempotent (sourceModule + sourceId).
    await writeJournalForCabinetExpense(expense, {
      client: txClient,
      utilisateurId: userId,
    });

    return expense;
  });

  revalidatePath("/journal/depenses");
  revalidatePath("/journal/general");
  revalidatePath("/comptabilite");
  return { success: true, cabinetExpenseId: cabinetExpense.id };
}

/* ───────────────────── Édition d'une CabinetExpense ───────────────────── */

export type EditCabinetExpenseInput = {
  /** Champs éditables. Tout champ non fourni n'est pas modifié. */
  montant?: number;
  date?: Date;
  typeTransaction?: ExpenseJournalTransactionType;
  dossierId?: string | null;
  categoryId?: string | null;
  categoryName?: string;
  descriptionBancaire?: string;
  fournisseurNormalise?: string | null;
  sousCategorie?: string | null;
  refacturable?: boolean;
  /**
   * Taxe LUE SUR LA PIÈCE. Fournie, elle vaut vérité et rend la dépense réclamable ;
   * absente, la taxe est réestimée depuis le montant et la catégorie.
   * Le cabinet ne pouvait rien corriger jusqu'ici : ce type n'exposait aucun champ
   * de taxe, donc ce que l'import n'avait pas rempli restait vide pour toujours.
   */
  tps?: number | null;
  tvq?: number | null;
  montantHt?: number | null;
  /** Le cabinet affirme, pièce en main, que cette dépense ne porte aucune taxe. */
  sansTaxe?: boolean;
};

export type EditCabinetExpenseResult =
  | { success: true; cabinetExpenseId: string; correction?: { correctionId: string; replayId?: string; reasons: string[] } }
  | { success: false; error: string };

/**
 * Édite une `CabinetExpense` déjà validée et applique la doctrine de correction
 * append-only au journal général.
 *
 * Doctrine: docs/accounting/APPEND_ONLY_CORRECTIONS.md
 *
 * Comportement:
 *   - Atomicité: update + correction journal dans la même transaction.
 *   - Si l'expense n'a jamais été journalisée (cas rare, statut PROPOSE p.ex.),
 *     on tente une création initiale via `writeJournalForCabinetExpense`.
 *   - Si l'expense est déjà journalisée et que le changement est matériel,
 *     on émet une CORRECTION + un re-jeu versionné.
 *   - Si non matériel, l'update applicatif est fait, le journal n'est pas
 *     touché.
 */
export async function editCabinetExpense(
  expenseId: string,
  patch: EditCabinetExpenseInput,
): Promise<EditCabinetExpenseResult> {
  const { cabinetId, userId } = await requireExpenseJournalWriter();

  const before = await prisma.cabinetExpense.findFirst({
    where: { id: expenseId, cabinetId },
  });
  if (!before) {
    return { success: false, error: "Dépense introuvable" };
  }

  let correction: { correctionId: string; replayId?: string; reasons: string[] } | undefined;

  // Recalcul de la taxe à chaque édition (lot 1, spec §2.1). Le montant ou la
  // catégorie ont pu changer, et la taxe qui en découle avec eux : la laisser
  // telle quelle ferait diverger la taxe du montant qu'elle est censée décomposer.
  //
  // Une taxe fournie dans le patch vaut PIÈCE, donc vérité, donc réclamable. Aucune
  // taxe fournie : on réestime, et la ligne reste non réclamable.
  const montantApres = patch.montant ?? before.montant;
  const categoryIdApres = patch.categoryId !== undefined ? patch.categoryId : before.categoryId;
  const taxConfig = await getCabinetTaxConfigById(cabinetId);
  const codeApres = categoryIdApres
    ? (await prisma.expenseCategory.findUnique({ where: { id: categoryIdApres }, select: { code: true } }))?.code
    : null;
  const taxes = decomposeExpenseTax({
    montantTtc: montantApres,
    categoryCode: codeApres,
    taxConfig,
    declared:
      patch.tps != null || patch.tvq != null
        ? { tps: patch.tps, tvq: patch.tvq, montantHt: patch.montantHt }
        : null,
    declaredSansTaxe: patch.sansTaxe === true,
  });

  const after = await prisma.$transaction(async (txClient) => {
    const updated = await txClient.cabinetExpense.update({
      where: { id: expenseId },
      data: {
        montant: montantApres,
        montantHt: taxes.montantHt,
        tps: taxes.tps,
        tvq: taxes.tvq,
        montantTtc: taxes.montantTtc,
        taxOrigin: taxes.origine,
        date: patch.date ?? before.date,
        typeTransaction: patch.typeTransaction ?? before.typeTransaction,
        dossierId: patch.dossierId !== undefined ? patch.dossierId : before.dossierId,
        categoryId: patch.categoryId !== undefined ? patch.categoryId : before.categoryId,
        categoryName: patch.categoryName ?? before.categoryName,
        descriptionBancaire: patch.descriptionBancaire ?? before.descriptionBancaire,
        fournisseurNormalise:
          patch.fournisseurNormalise !== undefined ? patch.fournisseurNormalise : before.fournisseurNormalise,
        sousCategorie:
          patch.sousCategorie !== undefined ? patch.sousCategorie : before.sousCategorie,
        refacturable: patch.refacturable ?? before.refacturable,
      },
    });

    const initialEntry = await txClient.journalGeneralEntry.findFirst({
      where: { cabinetId, sourceModule: "DEPENSES", sourceId: expenseId },
      select: { id: true },
    });

    if (!initialEntry) {
      // Cas rare: l'expense n'a pas encore été journalisée (jamais validée).
      await writeJournalForCabinetExpense(updated, {
        client: txClient,
        utilisateurId: userId,
      });
    } else {
      const result = await applyCabinetExpenseCorrection(before, updated, {
        client: txClient,
        utilisateurId: userId,
      });
      if (result.action === "corrected") {
        correction = {
          correctionId: result.correctionId,
          replayId: result.replayId,
          reasons: result.reasons,
        };
      }
    }

    return updated;
  });

  revalidatePath("/journal/depenses");
  revalidatePath("/journal/general");
  revalidatePath("/comptabilite");

  return { success: true, cabinetExpenseId: after.id, correction };
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
  const { cabinetId, userId } = await requireExpenseJournalWriter();
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
  await requireExpenseJournalWriter();
  const result = await prisma.bankImportTransaction.updateMany({
    where: { id: { in: transactionIds } },
    data: { status: "ignored" },
  });
  revalidatePath("/journal/depenses");
  return { success: true, count: result.count };
}

/* ══════════════════════════════════════════════════════════════════════════
   REPRISE DE L'HISTORIQUE — arbitrage CEO n° 4
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Ce que la reprise CHANGERAIT, sans rien écrire.
 *
 * Séparée de l'application pour une raison de fond : une reprise en masse qui
 * s'exécute sans qu'on ait vu son ampleur est exactement ce qu'un cabinet ne peut
 * pas défendre en vérification. Il voit d'abord combien de lignes et combien de
 * taxe, il décide ensuite.
 */
export async function simulerRepriseTaxes(): Promise<
  { success: true; resume: RepriseResume } | { success: false; error: string }
> {
  const { cabinetId } = await requireExpenseJournalWriter();
  try {
    const resume = await reprendreTaxesHistoriques({ cabinetId, simulation: true });
    return { success: true, resume };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Simulation impossible" };
  }
}

/**
 * Applique la reprise. Idempotente : seules les lignes sans origine sont touchées,
 * donc un second passage ne retouche ni une ligne déjà reprise ni une ligne
 * confirmée à la main.
 */
export async function appliquerRepriseTaxes(): Promise<
  { success: true; resume: RepriseResume } | { success: false; error: string }
> {
  const { cabinetId } = await requireExpenseJournalWriter();
  try {
    const resume = await reprendreTaxesHistoriques({ cabinetId });
    revalidatePath("/journal/depenses");
    revalidatePath("/comptabilite");
    return { success: true, resume };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Reprise impossible" };
  }
}
