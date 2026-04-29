/**
 * SAFE — Écriture au journal général pour une `CabinetExpense`.
 *
 * Doctrine: docs/accounting/SAFE_ACCOUNTING_DOCTRINE.md §4
 *           docs/accounting/EXPENSES_AND_DISBURSEMENTS_DOCTRINE.md §3
 *
 * Règles:
 *   - sourceModule = "DEPENSES", sourceId = cabinetExpense.id (clé stable).
 *   - L'idempotence repose sur (cabinetId, sourceModule, sourceId).
 *     `reference` n'est jamais lue ni écrite pour décider de l'idempotence.
 *   - Mapping selon `CabinetExpense.typeTransaction`:
 *       DEPENSE  → JGE DEPENSE     / sortie (montantSortie = montant)
 *       CREDIT   → JGE AJUSTEMENT  / entrée (montantEntree = montant)  [remboursement fournisseur]
 *       IGNORE   → no-op (la dépense est marquée ignorée, pas de mouvement comptable)
 *       TRANSFERT/AUTRE → no-op (cas hors scope V2, à qualifier en doctrine)
 *
 * Toutes les écritures restent append-only. Une correction future passe par
 * `createCorrectiveJournalEntry`, jamais par modification de l'entrée existante.
 */

import type { Prisma, PrismaClient, CabinetExpense } from "@prisma/client";
import { ExpenseJournalTransactionType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createJournalEntry } from "./journal-service";
import { isJournalIdempotencyConflict } from "./idempotency";

type JournalPrismaClient = PrismaClient | Prisma.TransactionClient;

export const CABINET_EXPENSE_JOURNAL_SOURCE_MODULE = "DEPENSES" as const;

export interface WriteCabinetExpenseEntryOptions {
  /** Client Prisma — passez le `tx` quand vous êtes dans une transaction. */
  client?: JournalPrismaClient;
  /** Utilisateur qui valide la dépense (alimente `utilisateurId`). */
  utilisateurId?: string | null;
}

export type WriteCabinetExpenseEntryResult =
  | {
      created: true;
      journalId: string;
      reason?: undefined;
    }
  | {
      created: false;
      /** Renseigné quand on a trouvé une écriture existante (idempotence). */
      journalId?: string;
      /** Raison d'absence d'écriture: déjà journalisée, type non journalisable, etc. */
      reason: "already_journalized" | "type_not_journalizable" | "amount_zero";
    };

/**
 * Écrit (ou ré-utilise) l'entrée journal pour une `CabinetExpense` validée.
 *
 * Fonction idempotente: deux appels successifs avec la même `expense.id`
 * ne créeront jamais deux entrées au journal.
 */
export async function writeJournalForCabinetExpense(
  expense: CabinetExpense,
  opts: WriteCabinetExpenseEntryOptions = {},
): Promise<WriteCabinetExpenseEntryResult> {
  const client = opts.client ?? prisma;

  // 1) Décide si la dépense est journalisable.
  const mapping = mapExpenseToJournal(expense);
  if (!mapping) {
    return { created: false, reason: "type_not_journalizable" };
  }
  if (mapping.amount <= 0) {
    // Une dépense de 0$ validée est suspecte mais n'est pas un mouvement comptable.
    return { created: false, reason: "amount_zero" };
  }

  // 2) Idempotence: cherche une entrée existante pour ce sourceId.
  const existing = await client.journalGeneralEntry.findFirst({
    where: {
      cabinetId: expense.cabinetId,
      sourceModule: CABINET_EXPENSE_JOURNAL_SOURCE_MODULE,
      sourceId: expense.id,
    },
    select: { id: true },
  });
  if (existing) {
    return { created: false, journalId: existing.id, reason: "already_journalized" };
  }

  // 3) Crée l'entrée via le service journal (qui calcule le solde cumulé).
  //    Une course concurrente peut faire passer le findFirst à null pour
  //    deux callers en parallèle ; l'index unique partiel structurel
  //    `JournalGeneralEntry_idempotency_key` est le filet final. En cas
  //    de P2002, on transforme en no-op idempotent.
  try {
    const created = await createJournalEntry(
      {
        cabinetId: expense.cabinetId,
        dateTransaction: expense.date,
        typeTransaction: mapping.typeTransaction,
        // La référence métier reste libre — pas utilisée pour l'idempotence.
        reference: null,
        clientId: null,
        dossierId: expense.dossierId ?? null,
        description: pickDescription(expense),
        categorie: expense.categoryName ?? null,
        montantEntree: mapping.direction === "IN" ? mapping.amount : 0,
        montantSortie: mapping.direction === "OUT" ? mapping.amount : 0,
        sourceModule: CABINET_EXPENSE_JOURNAL_SOURCE_MODULE,
        sourceId: expense.id,
        utilisateurId: opts.utilisateurId ?? expense.createdById ?? null,
      },
      client,
    );
    return { created: true, journalId: created.id };
  } catch (e) {
    if (!isJournalIdempotencyConflict(e)) throw e;
    // Une course a écrit l'entrée entre notre findFirst et notre create.
    // On relit pour récupérer l'`id` de l'écriture gagnante et on retourne
    // un no-op idempotent — strictement le même contrat que le cas
    // "déjà journalisé" en lecture seule.
    const winner = await client.journalGeneralEntry.findFirst({
      where: {
        cabinetId: expense.cabinetId,
        sourceModule: CABINET_EXPENSE_JOURNAL_SOURCE_MODULE,
        sourceId: expense.id,
      },
      select: { id: true },
    });
    return {
      created: false,
      journalId: winner?.id,
      reason: "already_journalized",
    };
  }
}

/* ───────────────────── Mapping interne ───────────────────── */

interface JournalMapping {
  typeTransaction: "DEPENSE" | "AJUSTEMENT";
  direction: "IN" | "OUT";
  /** Montant absolu écrit dans la colonne `montantEntree` ou `montantSortie`. */
  amount: number;
}

/**
 * Mappe une CabinetExpense vers les colonnes du journal.
 * Retourne `null` si le type ne doit pas générer d'écriture.
 */
function mapExpenseToJournal(expense: CabinetExpense): JournalMapping | null {
  const amount = Math.abs(expense.montant ?? 0);

  switch (expense.typeTransaction) {
    case ExpenseJournalTransactionType.DEPENSE:
      // Sortie réelle: argent qui quitte le cabinet.
      return { typeTransaction: "DEPENSE", direction: "OUT", amount };

    case ExpenseJournalTransactionType.CREDIT:
      // Remboursement / crédit fournisseur: argent qui rentre. AJUSTEMENT
      // documenté car ce n'est pas un encaissement client (PAIEMENT).
      return { typeTransaction: "AJUSTEMENT", direction: "IN", amount };

    case ExpenseJournalTransactionType.IGNORE:
    case ExpenseJournalTransactionType.TRANSFERT:
    case ExpenseJournalTransactionType.AUTRE:
      // Pas d'écriture journal V2: les transferts inter-comptes et "autres"
      // doivent être qualifiés en doctrine avant journalisation.
      return null;
  }
}

function pickDescription(expense: CabinetExpense): string {
  const supplier = (expense.fournisseurNormalise ?? "").trim();
  const raw = (expense.descriptionBancaire ?? "").trim();
  if (supplier && raw && supplier.toLowerCase() !== raw.toLowerCase()) {
    return `${supplier} — ${raw}`.slice(0, 500);
  }
  return (supplier || raw || "Dépense cabinet").slice(0, 500);
}
