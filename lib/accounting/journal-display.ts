import type { JournalEntryRow } from "@/types/journal";

/**
 * Ce que le journal brut affiche pour une écriture : ce qui entre, ce qui sort.
 * Vivait dans la vue du journal général ; partagé avec le tableau brut depuis
 * le 2026-09-12.
 */
export function displayJournalAmounts(entry: JournalEntryRow): { inAmount: number; outAmount: number } {
  if (entry.typeTransaction === "PAIEMENT") {
    return {
      inAmount: 0,
      outAmount: Math.max(entry.montantEntree, entry.montantSortie),
    };
  }
  return {
    inAmount: entry.montantEntree,
    outAmount: entry.montantSortie,
  };
}
