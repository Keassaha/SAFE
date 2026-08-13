import { describe, expect, it } from "vitest";

import { clicOuvreLaRangee, type ClicDeRangee } from "../rangee-ouvrable";

/** Cible qui ne ressemble à rien d'interactif : une cellule de texte. */
const CELLULE = { closest: () => null };

function clic(surcharge: Partial<ClicDeRangee> = {}): ClicDeRangee {
  return {
    defaultPrevented: false,
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    target: CELLULE,
    ...surcharge,
  };
}

describe("clicOuvreLaRangee", () => {
  it("ouvre sur un clic nu dans une cellule de texte", () => {
    expect(clicOuvreLaRangee(clic(), "")).toBe(true);
  });

  it("laisse le lien, le bouton et l'entrée de menu faire leur propre travail", () => {
    // `closest` répond : la cible descend d'un élément interactif.
    const interactif = { closest: () => ({}) };
    expect(clicOuvreLaRangee(clic({ target: interactif }), "")).toBe(false);
  });

  it("n'ouvre pas quand une sélection de texte est en cours", () => {
    // On copie un nom de client : naviguer effacerait la sélection au
    // relâchement, ce qui rend le registre impossible à dépouiller.
    expect(clicOuvreLaRangee(clic(), "Groupe immobilier Northfield")).toBe(false);
  });

  it("rend le clic modifié au navigateur", () => {
    for (const touche of ["metaKey", "ctrlKey", "shiftKey", "altKey"] as const) {
      expect(clicOuvreLaRangee(clic({ [touche]: true }), "")).toBe(false);
    }
  });

  it("ignore la molette et le bouton droit", () => {
    expect(clicOuvreLaRangee(clic({ button: 1 }), "")).toBe(false);
    expect(clicOuvreLaRangee(clic({ button: 2 }), "")).toBe(false);
  });

  it("respecte un gestionnaire en amont qui a déjà traité le clic", () => {
    expect(clicOuvreLaRangee(clic({ defaultPrevented: true }), "")).toBe(false);
  });

  it("survit à une cible absente", () => {
    expect(clicOuvreLaRangee(clic({ target: null }), "")).toBe(true);
  });
});
