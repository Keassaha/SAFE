import { redirect } from "next/navigation";

export default function InscriptionPage() {
  redirect("/connexion?tab=signup");
}
