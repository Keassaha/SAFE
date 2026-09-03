/**
 * La matière verte, écrite une seule fois pour tout le site public.
 *
 * ── Pourquoi ce fichier existe ───────────────────────────────────────────────
 * La recette vivait dans `ExperienceCinema.tsx`, sous la portée `.xc`, et ne
 * servait donc que l'accueil. Le 2026-09-03 le CEO a demandé la même matière
 * sur la tarification : le panneau des fondateurs et les cubes de forfait.
 *
 * Une recette de cinq couches recopiée dans deux portées diverge en une heure,
 * et le commentaire de `forfaits-regles.ts` le disait déjà de la matière du
 * cube (« deux copies littérales de trois dégradés empilés avaient déjà
 * divergé d'une opacité »). Elle est donc sortie ici, et les deux portées
 * l'importent. Il n'existe qu'un vert de surface pleine sur ce site.
 *
 * ── Ce que la matière est ────────────────────────────────────────────────────
 * Cinq couches, dans cet ordre de peinture (la première est au-dessus) :
 *
 *   1. un BRUIT fractal SVG, désaturé, à 34 % ;
 *   2. un halo `verified` en haut à gauche, qui porte la masse verte ;
 *   3. une pointe `verified-dot` en haut à droite, qui porte la lumière ;
 *   4. un halo `brand-green` en bas à droite, qui rattache la surface au logo ;
 *   5. un linéaire à 152°, de l'encre vers le vert d'action, qui porte le fond.
 *
 * Le bruit n'est pas décoratif. Sans lui, une maille de verts se lit comme un
 * aplat sale ; avec lui, elle a du grain, et c'est ce qui sépare une surface de
 * marque d'un fond dégradé de gabarit (catalogue anti-slop, A2). Il est fixé à
 * 34 % : au-delà il mange le texte, en deçà il ne se voit plus.
 *
 * ── Ce que la matière exige ──────────────────────────────────────────────────
 * Elle est SOMBRE. Toute encre posée dessus passe en ton « onBrand »
 * (IDENTITE_SAFE §4.3) : texte blanc de surface, accent `verified-on-forest`.
 * `encresSurVert()` écrit cette inversion, pour qu'on ne l'oublie pas d'un
 * bloc à l'autre.
 *
 * Aucune hexadécimale ici (PS-001) : tout passe par les jetons de
 * `lib/ds/palettes.ts`.
 */

/**
 * Le bruit fractal, en SVG inline.
 *
 * Isolé de la pile parce que c'est la seule couche qui porte une
 * `background-size` propre : les quatre dégradés s'étirent sur la boîte, lui se
 * répète sur une tuile de 180 px. Une tuile plus petite se met à moirer sur les
 * grandes surfaces, une plus grande devient visible comme motif.
 */
const BRUIT =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)' opacity='0.34'/%3E%3C/svg%3E\")";

/**
 * Les déclarations de fond. À poser telles quelles dans une règle.
 *
 * `border-color: transparent` est dans le lot : la matière remplace le filet,
 * et une surface sombre qui garde un filet clair se lit comme une carte mal
 * découpée.
 */
export const MATIERE_VERTE = `
    border-color: transparent;
    background-color: var(--si-action-vert);
    background-image:
      ${BRUIT},
      radial-gradient(120% 150% at 8% 8%, rgb(var(--si-verified-rgb) / 0.95) 0%, transparent 58%),
      radial-gradient(90% 120% at 96% 0%, rgb(var(--si-verified-dot-rgb) / 0.22) 0%, transparent 52%),
      radial-gradient(120% 130% at 100% 100%, rgb(var(--si-brand-green-rgb) / 0.62) 0%, transparent 60%),
      linear-gradient(152deg, var(--si-ink-strong) 0%, var(--si-action-vert) 62%);
    background-size: 180px 180px, auto, auto, auto, auto;`;

/**
 * La même matière, sous forme de valeur unique pour `background-image`.
 *
 * Le cube de forfait la révèle au survol par une propriété personnalisée, et
 * une propriété ne peut pas porter un bloc de déclarations. La couleur de fond
 * et la taille de tuile sont alors écrites par l'appelant, à côté.
 */
export const MATIERE_VERTE_IMAGE = `
      ${BRUIT},
      radial-gradient(120% 150% at 8% 8%, rgb(var(--si-verified-rgb) / 0.95) 0%, transparent 58%),
      radial-gradient(90% 120% at 96% 0%, rgb(var(--si-verified-dot-rgb) / 0.22) 0%, transparent 52%),
      radial-gradient(120% 130% at 100% 100%, rgb(var(--si-brand-green-rgb) / 0.62) 0%, transparent 60%),
      linear-gradient(152deg, var(--si-ink-strong) 0%, var(--si-action-vert) 62%)`;

/**
 * L'ombre des surfaces vertes.
 *
 * Elles portent l'ombre d'un cran plus bas que le reste : ce sont les seules
 * surfaces sombres de la page, et une surface sombre posée à plat sur un fond
 * clair se lit comme un trou.
 */
export const OMBRE_VERTE = `
    box-shadow:
      0 2px 6px -2px rgb(var(--si-line-ink-rgb) / 0.22),
      0 34px 64px -36px rgb(var(--si-line-ink-rgb) / 0.48);`;

/**
 * L'inversion des encres sur la matière.
 *
 * `s` est le sélecteur de la surface verte, déjà porté à sa portée par
 * l'appelant. Les quatre rôles couverts sont ceux qu'on retrouve sur toutes les
 * surfaces vertes du site : le titre, la prose, le rang numéroté et la pastille
 * qui porte le symbole.
 */
export function encresSurVert(s: string): string {
  return `
  ${s} .n, ${s} h3 { color: var(--si-verified-on-forest); }
  ${s} .d, ${s} p, ${s} li { color: var(--si-surface); }
  ${s} .rang { color: rgb(var(--si-surface-rgb) / 0.55); }
  ${s} .pastille {
    border-color: rgb(var(--si-surface-rgb) / 0.30);
    background: rgb(var(--si-surface-rgb) / 0.10);
    color: var(--si-verified-on-forest);
  }`;
}
