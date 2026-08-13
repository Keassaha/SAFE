import { requirePageAccess } from "@/lib/auth/page-guard";
import { canViewBilling } from "@/lib/auth/permissions";
import { FacturationNotesCreditView } from "./NotesCreditView";

export default async function FacturationNotesCreditPage() {
  const { cabinetId } = await requirePageAccess(canViewBilling);
  return <FacturationNotesCreditView cabinetId={cabinetId} />;
}
