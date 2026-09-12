import { requirePageAccess } from "@/lib/auth/page-guard";
import {
  canManageExpenseJournal,
  canManageInvoices,
  canViewComptabilite,
} from "@/lib/auth/permissions";
import { calculateJournalBalance } from "@/lib/services/journal";
import { prisma } from "@/lib/db";
import { isSafeIncCabinet } from "@/lib/safe-inc";
import { chargerJournalDepenses } from "@/lib/expense-journal/charger";
import { ComptabilitePageView } from "./ComptabilitePageView";

export default async function ComptabilitePage() {
  const { cabinetId, role } = await requirePageAccess(canViewComptabilite);

  // Voir les livres n'est pas les tenir. L'avocat lit la page depuis la décision
  // CEO du 2026-08-12 ; l'écriture et les paiements gardent leurs propres droits,
  // et la page n'affiche que ce que le rôle peut réellement faire.
  const canWriteJournal = canManageExpenseJournal(role);
  const canSeePayments = canManageInvoices(role);

  /* Le compte de chaque journal, pour que l'onglet le porte comme « Cartable (9) »
     sur la fiche dossier. Trois `count`, indexés, moins chers que la page. */
  const [journalKpis, expenseData, isSafeInc, nbEcritures, nbDepenses, nbPaiements] =
    await Promise.all([
      calculateJournalBalance(cabinetId),
      chargerJournalDepenses(cabinetId),
      isSafeIncCabinet(cabinetId),
      prisma.journalGeneralEntry.count({ where: { cabinetId } }),
      prisma.cabinetExpense.count({ where: { cabinetId } }),
      prisma.payment.count({ where: { cabinetId, reversedAt: null } }),
    ]);

  return (
    <ComptabilitePageView
      cabinetId={cabinetId}
      initialJournalKpis={journalKpis}
      expenseData={expenseData}
      isSafeInc={isSafeInc}
      canWriteJournal={canWriteJournal}
      canSeePayments={canSeePayments}
      comptes={{ general: nbEcritures, depenses: nbDepenses, paiements: nbPaiements }}
    />
  );
}


