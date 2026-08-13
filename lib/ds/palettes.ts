/**
 * SAFE — Palette de l'intérieur de l'application
 * ---------------------------------------------------------------------------
 * Source de vérité UNIQUE des couleurs de l'intérieur.
 *
 * Chaîne : `palettes.ts` → <PaletteStyles /> (variables CSS) → tailwind.config
 * → classes `si-*` → écrans. Changer une valeur ici change les ~4 800 usages
 * `si-*` du produit, sans toucher un seul écran.
 *
 * Deux formes sont émises pour chaque jeton :
 *   --si-<clé>       valeur complète  → utilisée par `text-[var(--si-ink)]`
 *   --si-<clé>-rgb   canaux séparés   → utilisée par Tailwind pour composer
 *                                       les modificateurs d'opacité (`/50`)
 *
 * Décision CEO 2026-08-10 : « Ardoise » retenue après comparaison de quatre
 * candidates sur les écrans réels. Les trois autres (Registre calme, Papier,
 * Encre) et le sélecteur de développement ont été retirés le même jour.
 * Réf. : docs/journal/2026-08-10_socle_couleur_pilotable.md
 */

export type SiTokenKey =
  | "canvas"
  | "surface"
  | "surface2"
  | "border"
  | "border-strong"
  | "ink"
  | "body"
  | "muted"
  | "subtle"
  | "forest"
  | "forest-soft"
  | "brand-green"
  | "action-vert"
  | "verified"
  | "verified-on-forest"
  | "verified-dot"
  | "amber"
  | "amber-ink"
  | "danger"
  | "danger-ink";

export const SI_TOKEN_KEYS: readonly SiTokenKey[] = [
  "canvas",
  "surface",
  "surface2",
  "border",
  "border-strong",
  "ink",
  "body",
  "muted",
  "subtle",
  "forest",
  "forest-soft",
  "brand-green",
  "action-vert",
  "verified",
  "verified-on-forest",
  "verified-dot",
  "amber",
  "amber-ink",
  "danger",
  "danger-ink",
] as const;

export type Palette = {
  id: string;
  nom: string;
  intention: string;
  colors: Record<SiTokenKey, string>;
  /** Les filets sont une encre à faible opacité, pas une couleur à part. */
  line: { ink: string; normal: number; subtle: number };
};

/**
 * Ardoise — neutres froids, surfaces blanches franches.
 *
 * Registre d'instrument technique.
 *
 * ## Noir et vert forêt (déc. CEO 2026-08-10)
 *
 * Quatre positions successives le même jour : vert forêt, bleu ardoise, puis
 * « noir » — mais le noir livré, #16202B, était un bleu marine très sombre.
 * Le CEO l'a vu : « je pense que c'est du bleu foncé que tu as pris ».
 *
 * Position retenue : un **vrai noir neutre** pour l'encre et l'action, et le
 * **vert forêt** rendu à un seul rôle, l'état validé. « Je ne veux pas autant
 * de couleur, je veux vraiment du noir et un peu de vert forêt. »
 *
 * L'action prend l'encre elle-même. Un seul noir traverse le produit : le
 * texte, l'action et le mot-symbole. La couleur devient entièrement
 * sémantique, réservée aux états.
 *
 * Ce que ça coûte : les 135 usages de `text-si-forest` (liens, mots d'accent)
 * perdent leur teinte et se lisent comme du texte courant. Le soulignement
 * porte alors seul l'affordance du lien. Choix éditorial défendable, mais
 * c'est bien un renoncement, pas un gain.
 *
 * Ce que ça gagne : le référentiel interdit que le vert d'action remplace le
 * vert de validation. Les deux étaient verts, donc confondus. Avec une action
 * achromatique, le vert ne veut plus dire qu'une chose : validé.
 *
 * Positions écartées, restaurables d'une ligne : vert forêt `#123A2E`,
 * bleu ardoise `#1C3A5A`, bleu-noir `#16202B`.
 *
 * Le nom du jeton reste `forest` : il désigne le rôle « action et surface
 * pleine de marque », pas une teinte. Le renommer imposerait de toucher
 * 297 usages pour zéro gain visuel.
 *
 * ## Contrastes vérifiés sur `canvas` (#F1F3F5)
 *
 * Mesuré dans le navigateur, pas estimé : ink 15,5:1 · body 9,6:1 ·
 * muted 5,0:1 · verified 6,2:1. Blanc sur l'action 17,4:1, sur son survol
 * 13,1:1. `subtle` a été assombri de #8C8F93 à #85888C pour passer de 2,9:1
 * à 3,2:1, soit au-dessus du seuil de 3:1 des éléments non textuels. Il reste
 * réservé au désactivé, jamais à un texte porteur de sens.
 */
export const PALETTE: Palette = {
  id: "ardoise",
  nom: "Ardoise",
  intention: "Neutres froids et surfaces blanches. Registre d'instrument technique.",
  colors: {
    /* Échelle de surfaces, trois marches franches.
     *
     * L'échelle précédente tenait dans 1,12 de rapport entre la page et une
     * carte, et 1,32 entre un champ et sa propre bordure. Résultat : le fond,
     * la carte et le champ se confondaient, et un champ de saisie ne se lisait
     * plus comme un champ. Défaut mesurable, pas affaire de goût.
     *
     * Page plus sombre, carte franchement blanche, champ en creux gris. La
     * marche se voit du premier coup d'œil. */
    canvas: "#EBEDEF",
    surface: "#FFFFFF",
    surface2: "#F4F5F7",
    /* Filet de structure : sépare sans peser. */
    border: "#D6D9DD",
    /* Bordure de contrôle. 3,31:1 sur la carte blanche et 3,03:1 sur le creux
     * du champ, soit le seuil de WCAG 1.4.11 dans les deux cas. L'ancienne
     * valeur (#C4C7CB) plafonnait à 1,70 : elle échouait au critère. */
    "border-strong": "#888E94",
    /* Encre : un vrai noir, neutre. La version précédente (#16202B) portait
       21 points de bleu de plus que de rouge : elle se lisait comme un bleu
       marine, pas comme du noir. */
    ink: "#1A1A1A",
    body: "#3C3E40",
    muted: "#65686B",
    subtle: "#85888C",
    /* Action : le même noir. Une seule encre traverse le produit. */
    forest: "#1A1A1A",
    "forest-soft": "#2F3133",
    /* Vert de la marque, repris tel quel de la charte (`SAFE_PALETTE.emeraude`,
       components/brand/safe-mark.ts). Il ne sert qu'aux accents éditoriaux de
       la vitrine, pour que le mot mis en valeur porte exactement la teinte du
       logo posé au-dessus de lui. Il ne dit jamais un état. */
    "brand-green": "#2E7D5B",
    /* Fin du dégradé de l'action. Le bouton part de l'encre et glisse vers un
       vert forêt profond : assez sombre pour rester une surface d'action,
       assez vert pour que la marque se devine sans être annoncée. */
    "action-vert": "#16332A",
    /* Le vert forêt de l'application, et seulement ici : l'état validé. */
    verified: "#26654A",
    "verified-on-forest": "#9AD8B8",
    "verified-dot": "#4CB98C",
    /* L'urgence garde sa couleur (déc. CEO 2026-08-11, après essai en
     * achromatique). « Je ne souhaite pas nécessairement supprimer toutes les
     * couleurs comme celle qui détermine le niveau d'urgence. »
     *
     * La sobriété ne se gagne pas en aveuglant l'alerte. Elle se gagne en
     * réservant la couleur à ce qui appelle un geste : une échéance, un écart,
     * un blocage. Le décoratif, lui, reste achromatique. */
    amber: "#8A6412",
    "amber-ink": "#6E4F0E",
    danger: "#A83232",
    "danger-ink": "#862626",
  },
  line: { ink: "#1A1A1A", normal: 0.11, subtle: 0.065 },
};

/* ─────────────────────── Échelles de retrait ───────────────────────
 *
 * Le produit charrie encore des vocabulaires antérieurs : `forest-*`,
 * `emerald-*`, `green-*`, `primary-*`, `accent-*`, `slate-*`. Environ 900
 * usages sur 130 fichiers, tous hérités d'époques différentes, dont un
 * `green-*` qui n'était même pas déclaré et retombait donc sur le vert vif de
 * Tailwind.
 *
 * Les réécrire à la main serait 130 diffs pour un résultat identique. Ils
 * passent tous par `tailwind.config.ts` : rebrancher les échelles suffit.
 *
 * Ces deux rampes ne sont pas des jetons du système. Elles existent pour que
 * le vocabulaire ancien cesse de contredire la palette pendant qu'on le
 * retire. Rien de neuf ne doit les employer : le nouveau code écrit `si-*`.
 */

/** Rampe neutre de l'action. Le 700 est l'encre, c'est-à-dire l'action. */
export const ECHELLE_ACTION = {
  50: "#F2F3F4",
  100: "#E4E5E7",
  200: "#CBCDD0",
  300: "#A8ABAE",
  400: "#7E8184",
  500: "#5A5D60",
  600: "#3C3E40",
  700: "#1A1A1A",
  800: "#141414",
  900: "#0E0E0E",
  950: "#080808",
} as const;

/**
 * Rampe du vert de validation.
 *
 * `emerald-*` et `green-*` portent le plus souvent un sens : bandeau de
 * succès, montant rapproché, obligation à jour. Les basculer en achromatique
 * effacerait ce sens. Ils gardent donc une teinte, mais une seule, ancrée sur
 * `verified`. Trois verts différents deviennent un.
 */
export const ECHELLE_VALIDE = {
  50: "#EDF4F0",
  100: "#D6E8DF",
  200: "#AFD2C0",
  300: "#7EB59A",
  400: "#4B8E70",
  500: "#26654A",
  600: "#215A41",
  700: "#1B4A36",
  800: "#163C2C",
  900: "#112E22",
  950: "#0A1D15",
} as const;

/** `#16202B` → `22 32 43`. Format exigé par `rgb(var(--x) / <alpha>)`. */
export function hexToChannels(hex: string): string {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Émet les déclarations de la palette, sans sélecteur. */
export function paletteDeclarations(palette: Palette = PALETTE): string {
  const lignes: string[] = [];

  for (const key of SI_TOKEN_KEYS) {
    const hex = palette.colors[key];
    lignes.push(`--si-${key}:${hex}`);
    lignes.push(`--si-${key}-rgb:${hexToChannels(hex)}`);
  }

  // `--si-line` et `--si-line2` gardent la forme composée pour rester
  // utilisables telles quelles dans `border-[var(--si-line)]`.
  const lineRgb = hexToChannels(palette.line.ink);
  lignes.push(`--si-line-ink-rgb:${lineRgb}`);
  lignes.push(`--si-line-a:${palette.line.normal}`);
  lignes.push(`--si-line2-a:${palette.line.subtle}`);
  lignes.push(`--si-line:rgb(${lineRgb} / ${palette.line.normal})`);
  lignes.push(`--si-line2:rgb(${lineRgb} / ${palette.line.subtle})`);

  return lignes.join(";") + ";";
}
