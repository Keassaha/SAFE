import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

/**
 * La reprise a rejoint SAFE Import, qui est devenu la porte unique de ce qui
 * entre dans SAFE depuis l'extérieur (décision CEO 2026-09-16). La route
 * d'origine survit en redirection : les liens déjà posés continuent de tomber
 * juste.
 */
export default function RepriseRedirectPage() {
  redirect(routes.safeImportExercices);
}
