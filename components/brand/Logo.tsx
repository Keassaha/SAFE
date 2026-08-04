/**
 * Compatibilité — ancien module de logo.
 *
 * Ce fichier dessinait sa propre version de la marque (mot « Safe » en bas de
 * casse, pastille sombre, géométrie recopiée). C'est ce doublon qui rendait les
 * logos différents d'une page à l'autre. Il ne fait plus que réexpédier vers le
 * composant canonique.
 *
 * Nouveaux écrans : importer `SafeLogo` / `SafeMark` depuis
 * `@/components/branding/SafeLogo`.
 */

import React from "react";
import { SafeLogo, SafeMark, type MarkTone } from "@/components/branding/SafeLogo";

/** @deprecated Utiliser `SafeMark`. */
export function Logo({ size = 24, tone = "light" }: { size?: number; tone?: MarkTone }) {
  return <SafeMark size={size} tone={tone} />;
}

/**
 * @deprecated Utiliser `SafeLogo`.
 * L'ancien `size` désignait la pastille, le nouveau désigne le mark : le
 * facteur conserve le poids visuel des écrans qui appelaient encore ce nom.
 */
export function LogoMark({ size = 28, tone = "light" }: { size?: number; tone?: MarkTone }) {
  return <SafeLogo size={Math.round(size * 0.68)} tone={tone} />;
}
