import { redirect } from "next/navigation";

export default function InscriptionPage() {
  redirect("/audit-gratuit?from=inscription");
}
