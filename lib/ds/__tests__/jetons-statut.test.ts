import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { PALETTE, hexToChannels } from "../palettes";

/**
 * Garde-fou sur les jetons d'état hérités.
 *
 * Le 12 août 2026, « Supprimer » était invisible dans tous les menus du
 * produit : `--safe-status-error` valait `var(--si-surface)`, du blanc, posé
 * sur une surface blanche. Rapport de contraste 1,00. Quarante-six emplois de
 * `text-status-error` peignaient du blanc sur blanc.
 *
 * La cause n'était pas une faute de frappe mais un demi-retour en arrière : la
 * décision « noir et vert seulement » avait inversé la paire (fond d'encre
 * plein, texte clair), puis le CEO a rendu sa couleur à l'urgence sans que ces
 * deux lignes suivent.
 *
 * Contrat vérifié ici : `--safe-status-<état>` est un texte lisible sur une
 * surface claire, `--safe-status-<état>-bg` est un fond dilué. Toute inversion
 * future casse ce test avant de casser un écran.
 */

const CSS = readFileSync(path.resolve(__dirname, "../../../app/globals.css"), "utf8");

/** Lit la déclaration d'une variable dans `:root`, sans la résoudre. */
function declaration(nom: string): string {
  const m = CSS.match(new RegExp(`^\\s*${nom}:\\s*([^;]+);`, "m"));
  if (!m) throw new Error(`Variable ${nom} introuvable dans app/globals.css`);
  return m[1].trim();
}

/** Résout `var(--si-x)` en sa valeur de palette. Un seul niveau suffit ici. */
function resoudre(valeur: string): string {
  const m = valeur.match(/^var\(--si-([a-z0-9-]+)\)$/);
  if (!m) return valeur;
  const cle = m[1] as keyof typeof PALETTE.colors;
  const hex = PALETTE.colors[cle];
  if (!hex) throw new Error(`Jeton de palette inconnu : --si-${m[1]}`);
  return hex;
}

function canaux(hex: string): [number, number, number] {
  const [r, g, b] = hexToChannels(hex).split(" ").map(Number);
  return [r, g, b];
}

function luminance([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contraste(a: string, b: string): number {
  const [l1, l2] = [luminance(canaux(a)), luminance(canaux(b))];
  const [haut, bas] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (haut + 0.05) / (bas + 0.05);
}

const ETATS = ["success", "warning", "error"] as const;

describe("jetons d'état hérités (--safe-status-*)", () => {
  it.each(ETATS)("le texte de « %s » se lit sur la surface", (etat) => {
    const couleur = resoudre(declaration(`--safe-status-${etat}`));
    // 4,5:1 — WCAG 1.4.3 pour du texte normal. Ces jetons servent des
    // libellés de 13 px, pas des titres.
    expect(contraste(couleur, PALETTE.colors.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(ETATS)("le fond de « %s » reste dilué, jamais un aplat sombre", (etat) => {
    const fond = declaration(`--safe-status-${etat}-bg`);
    const alpha = fond.match(/\/\s*([0-9.]+)\s*\)/);
    if (alpha) {
      // Fond composé : l'opacité fait le travail.
      expect(Number(alpha[1])).toBeLessThanOrEqual(0.25);
      return;
    }
    // Fond opaque : il doit rester clair, sinon le texte ci-dessus disparaît.
    expect(contraste(resoudre(fond), PALETTE.colors.surface)).toBeLessThan(2);
  });

  it.each(ETATS)("la paire de « %s » n'est jamais inversée", (etat) => {
    const texte = resoudre(declaration(`--safe-status-${etat}`));
    // La régression exacte du 12 août : le texte prend la couleur de la
    // surface. Invisible partout où `text-status-*` sert sans son fond.
    expect(texte.toUpperCase()).not.toBe(PALETTE.colors.surface.toUpperCase());
  });

  it("« en retard » se distingue du texte ordinaire", () => {
    // Un retard appelle un geste. Le peindre en gris de corps de texte le
    // rendrait indiscernable d'une donnée neutre.
    const retard = resoudre(declaration("--safe-status-overdue"));
    expect(retard.toUpperCase()).not.toBe(PALETTE.colors.body.toUpperCase());
    expect(retard.toUpperCase()).not.toBe(PALETTE.colors.muted.toUpperCase());
  });
});
