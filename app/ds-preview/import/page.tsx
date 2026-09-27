"use client";

import { SafeImportWizard } from "@/components/import/SafeImportWizard";

/**
 * Contrôle visuel de l'écran Import, hors authentification.
 *
 * Le composant est le VRAI. L'analyse d'un fichier CSV ou Excel se fait
 * entièrement dans le navigateur : on peut donc dérouler l'assistant jusqu'à
 * l'aperçu sans session et sans toucher la base. Seule la dernière étape,
 * l'écriture, passe par le serveur, et elle n'est pas franchie ici.
 *
 * Demande CEO du 2026-09-14 : « tu peux me montrer ».
 */
export default function ApercuImport() {
  return (
    <div className="min-h-screen bg-[var(--si-canvas)] p-8">
      <SafeImportWizard />
    </div>
  );
}
