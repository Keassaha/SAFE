import { requireCabinetId } from "@/lib/auth/session";
import { FacturationNotesCreditView } from "./NotesCreditView";
import { redirect } from "next/navigation";

export default async function FacturationNotesCreditPage() {
  const cabinetId = await requireCabinetId();
  if (!cabinetId) redirect("/connexion");
  return <FacturationNotesCreditView cabinetId={cabinetId} />;
}
