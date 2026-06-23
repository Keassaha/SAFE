import { redirect } from "next/navigation";

/**
 * L'ancien formulaire d'onboarding en 5 étapes ne persistait rien (illusion de
 * sauvegarde). Décision CEO (2026-06-22) : le cacher. L'onboarding réel passe
 * par la checklist « Pour bien démarrer » du tableau de bord, pilotée par les
 * données réelles du cabinet (cabinet configuré, 1er client, 1er dossier, etc.).
 */
export default function OnboardingPage() {
  redirect("/tableau-de-bord");
}
