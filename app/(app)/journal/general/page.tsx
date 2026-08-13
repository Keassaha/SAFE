import { requirePageAccess } from "@/lib/auth/page-guard";
import { canManageExpenseJournal, canViewComptabilite } from "@/lib/auth/permissions";
import { calculateJournalBalance } from "@/lib/services/journal";
import { GeneralJournalPageView } from "./GeneralJournalPageView";

export default async function JournalGeneralPage() {
  const { cabinetId, role } = await requirePageAccess(canViewComptabilite);
  const kpis = await calculateJournalBalance(cabinetId);

  // Même règle que dans /comptabilite : lire les livres n'est pas les tenir.
  return (
    <GeneralJournalPageView initialKpis={kpis} canWrite={canManageExpenseJournal(role)} />
  );
}
