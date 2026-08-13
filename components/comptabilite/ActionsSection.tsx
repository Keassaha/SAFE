"use client";

import { useEffect, useState, type ReactNode } from "react";
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

  useEffect(() => {
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
