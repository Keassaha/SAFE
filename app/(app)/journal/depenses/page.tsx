import { requirePageAccess } from "@/lib/auth/page-guard";
import { canManageExpenseJournal, canViewComptabilite } from "@/lib/auth/permissions";
import { chargerJournalDepenses } from "@/lib/expense-journal/charger";
import { ExpenseJournalPageView } from "./ExpenseJournalPageView";

/**
 * Le journal des dépenses, en page autonome.
 *
 * Les requêtes vivaient ici EN DOUBLE avec l'onglet de `/comptabilite`. Deux
 * copies pour le même écran, c'est la garantie qu'un jour l'une dira autre
 * chose que l'autre. Elles sont désormais dans `lib/expense-journal/charger.ts`.
 */
export default async function JournalDepensesPage() {
  const { cabinetId, role } = await requirePageAccess(canViewComptabilite);
  const donnees = await chargerJournalDepenses(cabinetId);

  return (
    <ExpenseJournalPageView
      cabinetId={cabinetId}
      kpis={donnees.kpis}
      sessions={donnees.sessions}
      categories={donnees.categories}
      transactions={donnees.transactions}
      depenses={donnees.depenses}
      taxesAConfirmer={donnees.taxesAConfirmer}
      taxesSansOrigine={donnees.taxesSansOrigine}
      canWrite={canManageExpenseJournal(role)}
    />
  );
}
