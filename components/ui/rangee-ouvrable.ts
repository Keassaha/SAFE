/**
 * Ouverture d'une rangée de registre au clic.
 *
 * La rangée se soulève au survol. Ce qui se soulève doit s'ouvrir, sinon
 * l'animation promet un geste qui n'existe pas et l'œil apprend à s'en méfier.
 *
 * La décision est volontairement pure : elle se teste sans navigateur, comme
 * `computeMenuPosition`. Le seul accès au DOM tient dans la fabrique du bas,
 * qui va chercher la sélection de texte en cours.
 */

/** Ce qu'il faut d'un événement de clic pour décider. Rien de plus. */
export interface ClicDeRangee {
  defaultPrevented: boolean;
  /** 0 = bouton principal. Molette et bouton droit ne nous appartiennent pas. */
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  target: { closest(selecteurs: string): unknown } | null;
}

/**
 * Éléments qui gardent la main sur leur propre clic. La rangée ne la leur
 * confisque pas : un lien navigue, une case coche, une entrée de menu agit.
 */
export const SELECTEURS_INTERACTIFS = "a, button, input, label, select, [role='menuitem']";

/**
 * Le clic doit-il ouvrir la rangée ?
 *
 * Non dans quatre cas :
 *
 *   - un gestionnaire en amont l'a déjà traité (`defaultPrevented`) ;
 *   - ce n'est pas le bouton principal, ou une touche modificatrice
 *     l'accompagne : Cmd-clic, Ctrl-clic et Maj-clic appartiennent au
 *     navigateur, qui en fait un nouvel onglet ou une nouvelle fenêtre ;
 *   - la cible est elle-même interactive ;
 *   - une sélection de texte est en cours. On copie un nom de client dans un
 *     registre, et partir en navigation l'effacerait au relâchement.
 */
export function clicOuvreLaRangee(e: ClicDeRangee, texteSelectionne: string): boolean {
  if (e.defaultPrevented) return false;
  if (e.button !== 0) return false;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  if (e.target?.closest(SELECTEURS_INTERACTIFS)) return false;
  if (texteSelectionne !== "") return false;
  return true;
}

/**
 * Gestionnaire `onClick` d'une `<tr>` de registre.
 *
 * Le clavier ne passe jamais par ici : une `<tr>` ne se tabule pas. Chaque
 * registre garde donc un vrai lien ou un vrai bouton dans une de ses cellules,
 * et c'est celui-là qui porte l'accès au clavier (WCAG 2.1.1). Le clic sur la
 * rangée est un raccourci à la souris, jamais le seul chemin.
 */
export function rangeeOuvrable(
  ouvrir: () => void,
): (e: React.MouseEvent<HTMLTableRowElement>) => void {
  return (e) => {
    const selection = typeof window === "undefined" ? "" : (window.getSelection()?.toString() ?? "");
    // Recopié champ par champ plutôt qu'étalé : un événement synthétique de
    // React n'expose pas forcément tout en propriétés propres, et un
    // `defaultPrevented` perdu au passage rouvrirait la rangée en silence.
    // `target` est typé `EventTarget` ; dans un tableau rendu c'est toujours un
    // élément, donc `closest` existe.
    const cible = e.target as Element | null;
    if (
      clicOuvreLaRangee(
        {
          defaultPrevented: e.defaultPrevented,
          button: e.button,
          metaKey: e.metaKey,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          target: typeof cible?.closest === "function" ? cible : null,
        },
        selection,
      )
    ) {
      ouvrir();
    }
  };
}
