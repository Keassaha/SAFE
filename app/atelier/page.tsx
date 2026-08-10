import type { Metadata } from "next";
import { AtelierPlans } from "./_components/AtelierPlans";

export const metadata: Metadata = {
  title: "Atelier des trois plans | SAFE",
  robots: { index: false, follow: false },
};

/**
 * Page de spécimens du système de profondeur (SAFE_PREMIUM_DESIGN_STANDARD §7.2).
 * Aucune donnée réelle, aucune écriture, aucun lien vers le produit.
 */
export default function AtelierPage() {
  return <AtelierPlans />;
}
