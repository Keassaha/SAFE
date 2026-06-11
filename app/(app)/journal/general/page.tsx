import { requirePageAccess } from "@/lib/auth/page-guard";
import { canViewComptabilite } from "@/lib/auth/permissions";
import { calculateJournalBalance } from "@/lib/services/journal";
import { GeneralJournalPageView } from "./GeneralJournalPageView";

export default async function JournalGeneralPage() {
  const { cabinetId } = await requirePageAccess(canViewComptabilite);
  const kpis = await calculateJournalBalance(cabinetId);

  return (
    <GeneralJournalPageView initialKpis={kpis} />
  );
}
