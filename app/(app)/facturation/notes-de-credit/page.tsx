import { requirePageAccess } from "@/lib/auth/page-guard";
import { canManageInvoices } from "@/lib/auth/permissions";
import { FacturationNotesCreditView } from "./NotesCreditView";

export default async function FacturationNotesCreditPage() {
  const { cabinetId } = await requirePageAccess(canManageInvoices);
  return <FacturationNotesCreditView cabinetId={cabinetId} />;
}
