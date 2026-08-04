/**
 * SOURCE UNIQUE DE LA MARQUE SAFE.
 *
 * Toute forme et toute encre du logo partent d'ici. Aucun autre fichier ne
 * redessine la marque : si vous vous apprêtez à coller un `<path d="M 2.4,0 ...">`
 * quelque part, importez plutôt une constante de ce fichier.
 *
 * Marque servie : « L'Assemblage » (charte graphique v1.0).
 * Spécification écrite : docs/brand/IDENTITE_SAFE.md
 */

/** Repère commun à toutes les formes de la marque. */
export const MARK_VIEWBOX = "0 0 24 24";

export type MarkShape = "assemblage" | "galets" | "voute";

/* ── « L'Assemblage » — marque servie ────────────────────────────────
 * Un carré unique, partagé par un joint orthogonal en gradins. Les deux
 * pièces obtenues sont rigoureusement identiques, tournées de 180° l'une
 * par rapport à l'autre, et s'emboîtent sans jeu.
 *
 * Deux masses, un seul volume : la séparation du fidéicommis et des
 * opérations, et l'assemblage compta / dossiers / conformité en un système.
 * Le joint trace un S en creux, jamais dessiné.
 *
 * Grille de 10 modules par 10, ramenée au repère 24 (1 module = 2,4).
 *   côté                1,00   → 24
 *   première coupe      0,60   → 14,4
 *   seconde coupe       0,40   →  9,6
 *   gradin horizontal   0,50   → 12
 *   rayon des angles    0,10   →  2,4
 *   largeur du joint    0,05   →  1,2   (demi-joint 0,6)
 *
 * Le joint n'est pas peint : il est évidé. Les deux pièces sont deux
 * chemins distincts et c'est le fond qui passe entre eux. C'est la seule
 * façon de garantir la règle « le joint ne disparaît jamais » sur un fond
 * clair, sombre, vert de marque ou imprimé, sans avoir à le recolorer.
 * ─────────────────────────────────────────────────────────────────── */

/** Pièce haute-gauche. Pleine, angles extérieurs arrondis, joint à l'équerre. */
export const ASSEMBLY_PIECE_A_PATH =
  "M 2.4 0 H 13.8 V 11.4 H 9 V 24 H 2.4 " +
  "A 2.4 2.4 0 0 1 0 21.6 V 2.4 A 2.4 2.4 0 0 1 2.4 0 Z";

/** Pièce basse-droite. Exactement la pièce A tournée de 180° autour de (12, 12). */
export const ASSEMBLY_PIECE_B_PATH =
  "M 21.6 24 H 10.2 V 12.6 H 15 V 0 H 21.6 " +
  "A 2.4 2.4 0 0 1 24 2.4 V 21.6 A 2.4 2.4 0 0 1 21.6 24 Z";

/* ── Dessin ultra petite taille ──────────────────────────────────────
 * En dessous de 20 px, le rayon et le joint de référence se bouchent au
 * rendu. Version distincte : rayon 0,07 et joint 0,09 (demi-joint 1,08).
 * Elle ne s'emploie jamais au dessus de vingt pixels.
 * ─────────────────────────────────────────────────────────────────── */

export const ASSEMBLY_XS_PIECE_A_PATH =
  "M 1.68 0 H 13.32 V 10.92 H 8.52 V 24 H 1.68 " +
  "A 1.68 1.68 0 0 1 0 22.32 V 1.68 A 1.68 1.68 0 0 1 1.68 0 Z";

export const ASSEMBLY_XS_PIECE_B_PATH =
  "M 22.32 24 H 10.68 V 13.08 H 15.48 V 0 H 22.32 " +
  "A 1.68 1.68 0 0 1 24 1.68 V 22.32 A 1.68 1.68 0 0 1 22.32 24 Z";

/** Seuil de bascule vers le dessin ultra petite taille, en pixels. */
export const MARK_XS_THRESHOLD = 20;

/** Rayon des angles du symbole, en fraction du côté. */
export const MARK_CORNER_RATIO = 0.1;

/* ── Plaque (icône d'application, tuile) ─────────────────────────────
 * Le symbole est déjà un carré plein : la plaque n'est utile que quand il
 * faut une pastille verte autour, typiquement une icône d'app posée sur un
 * fond clair. Le symbole y occupe 60 % du côté, la plaque est plus arrondie
 * que lui pour ne pas doubler le même angle.
 * ─────────────────────────────────────────────────────────────────── */

/** Part du côté de la plaque occupée par le symbole. */
export const PLATE_MARK_RATIO = 0.6;

/** Rayon des angles de la plaque, en fraction de son côté. */
export const PLATE_CORNER_RATIO = 0.227;

/* ── « Les Galets » — piste écartée ──────────────────────────────────
 * Marque servie du 2026-08-02 au 2026-08-03. Conservée pour la page de
 * contrôle `/marque` et pour la mémoire du dossier. Ne pas l'employer.
 * ─────────────────────────────────────────────────────────────────── */

export const PEBBLE_UPPER_PATH =
  "M 4.5,5.5 Q 3.5,3.5 5.5,4 L 12.5,4 Q 14.5,3.5 13.5,5.5 L 10,12.5 Q 9,14.5 8,12.5 Z";
export const PEBBLE_LOWER_PATH =
  "M 19.5,18.5 Q 20.5,20.5 18.5,20 L 11.5,20 Q 9.5,20.5 10.5,18.5 L 14,11.5 Q 15,9.5 16,11.5 Z";

/** Opacité du galet inférieur. Piste écartée : ne sert plus qu'à `/marque`. */
export const PEBBLE_LOWER_OPACITY = 0.55;

/* ── « La Voûte » — piste écartée ────────────────────────────────────
 * Conservée pour la page de comparaison `/marque`. Ne pas l'employer.
 * ─────────────────────────────────────────────────────────────────── */

export const VAULT_ARCH_PATH =
  "M 5.2 21.4 L 5.2 11.2 A 6.8 6.8 0 0 1 8.2 5.56 " +
  "M 18.8 21.4 L 18.8 11.2 A 6.8 6.8 0 0 0 15.8 5.56";
export const VAULT_ARCH_STROKE = 4;
export const VAULT_KEYSTONE_PATH = "M 9.6 2.4 L 14.4 2.4 L 13.5 6.4 L 10.5 6.4 Z";

/**
 * Marque servie partout dans le produit, du site public au rapport d'audit.
 * Une seule ligne à changer pour basculer l'ensemble.
 */
export const SAFE_MARK_DEFAULT: MarkShape = "assemblage";

/* ── Métriques par forme ─────────────────────────────────────────────
 * `scale` ramène chaque dessin à la même hauteur utile autour du centre
 * (12, 12). L'Assemblage occupe déjà tout le repère : son échelle est 1.
 * ─────────────────────────────────────────────────────────────────── */

export interface MarkGeometry {
  /** Mise à l'échelle du dessin autour de (12, 12) dans le repère 24×24. */
  scale: number;
  /**
   * Plus petit fragment de marque encore reconnaissable. Sert de pièce
   * flottante sur le site public. Ce n'est jamais un logo.
   */
  fragmentPath: string;
  /** Cadrage serré du fragment, pour le dessiner sans marge morte. */
  fragmentViewBox: string;
  /** Hauteur / largeur du fragment, pour ne pas le déformer. */
  fragmentRatio: number;
  /** Centre visuel et largeur nominale du fragment sur canevas (`PaperDrift`). */
  fragmentCx: number;
  fragmentCy: number;
  fragmentW: number;
  /**
   * Poids du fragment quand il flotte. Une pièce pleine pèse beaucoup plus
   * qu'un galet effilé à largeur égale : on compense pour garder le calme.
   */
  fragmentWeight: number;
}

export const MARK_GEOMETRY: Record<MarkShape, MarkGeometry> = {
  /* Dessin utile : tout le repère. Le fragment est la pièce A seule. */
  assemblage: {
    scale: 1,
    fragmentPath: ASSEMBLY_PIECE_A_PATH,
    fragmentViewBox: "0 0 13.8 24",
    fragmentRatio: 24 / 13.8,
    fragmentCx: 6.9,
    fragmentCy: 12,
    fragmentW: 13.8,
    fragmentWeight: 0.62,
  },
  /* Dessin utile : x 4,17 → 19,83 · y 3,90 → 20,10, soit 67,5 % du repère. */
  galets: {
    scale: 1.17,
    fragmentPath: PEBBLE_UPPER_PATH,
    fragmentViewBox: "4.17 3.9 9.66 9.6",
    fragmentRatio: 9.6 / 9.66,
    fragmentCx: 9,
    fragmentCy: 7.6,
    fragmentW: 10.4,
    fragmentWeight: 1,
  },
  /* Dessin utile : x 3,2 → 20,8 · y 2,4 → 21,4, soit 79,2 % du repère. */
  voute: {
    scale: 1,
    fragmentPath: VAULT_KEYSTONE_PATH,
    fragmentViewBox: "9.6 2.4 4.8 4",
    fragmentRatio: 4 / 4.8,
    fragmentCx: 12,
    fragmentCy: 4.4,
    fragmentW: 4.8,
    fragmentWeight: 0.68,
  },
};

/* ── Encres ──────────────────────────────────────────────────────────
 * La marque est bicolore : une pièce vert forêt, une pièce vert émeraude.
 * Le joint n'a pas d'encre, il est évidé. Six tons couvrent tous les fonds
 * du produit et de la papeterie.
 * ─────────────────────────────────────────────────────────────────── */

export type MarkTone =
  /** Fond clair (défaut) : forêt + émeraude. */
  | "light"
  /** Fond sombre : blanc cassé + émeraude, dite « inversée couleur ». */
  | "dark"
  /** Fond vert de marque : même encre que `dark`. */
  | "onBrand"
  /** Monochrome encre (documents, impression). */
  | "mono-dark"
  /** Monochrome blanc (surfaces photographiques, fond vert plein). */
  | "mono-light"
  /** Hérite de la couleur du texte courant. */
  | "currentColor";

/** Palette de la charte, telle quelle. */
export const SAFE_PALETTE = {
  forest: "#1F3A2E",
  emeraude: "#2E7D5B",
  casse: "#FAFAF8",
  beige: "#F5F2EB",
  anthracite: "#222222",
  gris: "#666666",
} as const;

export interface MarkInk {
  /** Pièce haute-gauche. */
  a: string;
  /** Pièce basse-droite. */
  b: string;
}

export const SAFE_INK: Record<MarkTone, MarkInk> = {
  light: { a: SAFE_PALETTE.forest, b: SAFE_PALETTE.emeraude },
  dark: { a: SAFE_PALETTE.casse, b: SAFE_PALETTE.emeraude },
  onBrand: { a: SAFE_PALETTE.casse, b: SAFE_PALETTE.emeraude },
  "mono-dark": { a: SAFE_PALETTE.anthracite, b: SAFE_PALETTE.anthracite },
  "mono-light": { a: SAFE_PALETTE.casse, b: SAFE_PALETTE.casse },
  currentColor: { a: "currentColor", b: "currentColor" },
};

/** Couleur du mot « SAFE » à côté du mark, par ton. */
export const SAFE_WORD_INK: Record<MarkTone, string> = {
  light: "#161A18",
  dark: "#EDF3EF",
  onBrand: "#EDF3EF",
  "mono-dark": "#1C1C1C",
  "mono-light": "#FFFFFF",
  currentColor: "currentColor",
};

/* ── Verrou horizontal ───────────────────────────────────────────────
 * La charte compose le mot plus grand quand le verrou est petit : 0,50 sur
 * la planche de démonstration à 52 px, 0,59 dans la barre latérale à 22 px,
 * 0,65 dans l'entête à 26 px. Le produit n'emploie que la fourchette basse
 * (17 à 22 px de mark) : on encode le rapport de l'entête, pas celui de la
 * planche, sinon le mot tombe sous dix pixels dans toutes les navigations.
 * ─────────────────────────────────────────────────────────────────── */

/** Corps du mot « SAFE », en fraction du côté du mark. */
export const WORDMARK_RATIO = 0.62;

/** Écart mark ↔ mot : trois modules, soit 0,30 du côté du mark. */
export const LOCKUP_GAP_RATIO = 0.3;

/** Interlettrage du mot. Chasse resserrée, lettres espacées. */
export const WORDMARK_TRACKING = "0.2em";

/** Graisse du mot. Medium, jamais bold. */
export const WORDMARK_WEIGHT = 500;
