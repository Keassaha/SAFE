import { requireCabinetId } from "@/lib/auth/session";
import { calculateJournalBalance } from "@/lib/services/journal";
import { GeneralJournalPageView } from "./GeneralJournalPageView";

export default async function JournalGeneralPage() {
  const cabinetId = await requireCabinetId();
  const kpis = await calculateJournalBalance(cabinetId);

  return (
    <GeneralJournalPageView initialKpis={kpis} />
  );
}
