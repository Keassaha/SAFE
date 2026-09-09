"use client";

import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Cible que la page Comptabilité réserve aux actions de la section courante. */
export const HOTE_ACTIONS_COMPTA = "compta-journal-actions";

/**
 * Projette les actions d'un journal sur la ligne de titre de sa section.
 *
 * Les trois onglets de la comptabilité posaient leurs boutons à trois endroits
 * différents : le journal général sur la ligne de titre, les dépenses et les
 * paiements dans une barre flottante au-dessus de leur propre contenu.
 * Changer d'onglet déplaçait donc les commandes, et l'œil devait les
 * rechercher à chaque fois.
 *
 * Un seul emplacement désormais. Hors de la page Comptabilité (`embarque` à
 * faux), chaque vue rend ses actions à sa place habituelle : elle reste
 * autonome.
 */
export function ActionsSection({
  embarque,
  children,
  className = "flex flex-wrap items-center justify-end gap-2",
}: {
  embarque?: boolean;
  children: ReactNode;
  /** Mise en page utilisée en mode autonome uniquement. */
  className?: string;
}) {
  const [hote, setHote] = useState<HTMLElement | null>(null);
  const [rechercheFaite, setRechercheFaite] = useState(false);

  /* AVANT la peinture, pas après.
   *
   * Avec `useEffect`, la cible n'était trouvée qu'une fois l'écran déjà
   * affiché : l'en-tête de section se peignait sans ses boutons, puis les
   * boutons apparaissaient et l'en-tête se recomposait. C'est ce saut que le
   * CEO a signalé le 2026-09-09 sous « la page n'est pas bien figée ».
   *
   * `useLayoutEffect` s'exécute entre le rendu et la peinture, donc les boutons
   * sont à leur place du premier coup. Il n'existe pas côté serveur : on
   * retombe sur `useEffect` au rendu serveur, où il ne s'exécute pas non plus. */
  const useEffetAvantPeinture = typeof window === "undefined" ? useEffect : useLayoutEffect;

  useEffetAvantPeinture(() => {
    if (!embarque) return;
    setHote(document.getElementById(HOTE_ACTIONS_COMPTA));
    setRechercheFaite(true);
  }, [embarque]);

  if (!embarque) return <div className={className}>{children}</div>;
  if (hote) return createPortal(children, hote);
  // Le temps de résoudre la cible : rien, plutôt qu'un saut visuel.
  if (!rechercheFaite) return null;
  // Cible absente (page autre que Comptabilité) : on rend en place.
  return <div className={className}>{children}</div>;
}
