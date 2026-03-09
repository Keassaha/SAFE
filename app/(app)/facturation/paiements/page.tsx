import { requireCabinetId } from "@/lib/auth/session";
import { FacturationPaiementsView } from "./PaiementsView";
import { redirect } from "next/navigation";

export default async function FacturationPaiementsPage() {
  const cabinetId = await requireCabinetId();
  if (!cabinetId) redirect("/connexion");
  return <FacturationPaiementsView cabinetId={cabinetId} />;
}
