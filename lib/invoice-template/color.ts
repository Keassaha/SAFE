/**
 * SAFE — Helpers couleur pour la personnalisation de la facture.
 *
 * UNE seule couleur d'accent est stockée par cabinet
 * (`config.invoice.accentColor`). Les teintes dérivées (fonds légers, texte
 * blanc cassé sur le bandeau) sont CALCULÉES ici, jamais stockées : la règle
 * dure « max 2 couleurs » (1 accent + neutres) reste garantie par construction.
 *
 * Garde-fou de lisibilité : l'accent sert de fond au bandeau / en-tête de
 * tableau / encadré TOTAL avec du TEXTE BLANC par-dessus. Une couleur trop
 * claire rendrait ce texte illisible → `isAccentDarkEnough` la refuse.
 *
 * Fonctions PURES, sans dépendance — testées unitairement.
 */

/** Marron Derisier — accent par défaut si aucune couleur n'est configurée. */
export const DEFAULT_ACCENT = "#7A3B2E";

/**
 * Contraste minimal exigé entre le blanc et l'accent pour valider une couleur.
 * 4.0 : compromis raisonnable — assez strict pour les petits libellés blancs
 * (en-tête de tableau ~7pt) tout en laissant passer des accents foncés usuels
 * (marine, sapin, bordeaux, ardoise…).
 */
export const MIN_ACCENT_CONTRAST = 4.0;

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/**
 * Normalise une saisie hex en `#rrggbb` minuscule, ou `null` si invalide.
 * Accepte `#rgb`, `rgb`, `#rrggbb`, `rrggbb` (avec/sans dièse, casse libre).
 */
export function normalizeHex(input: string | null | undefined): string | null {
  if (!input) return null;
  let h = input.trim().toLowerCase();
  if (h.startsWith("#")) h = h.slice(1);
  if (/^[0-9a-f]{3}$/.test(h)) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-f]{6}$/.test(h)) return null;
  return `#${h}`;
}

/** Convertit un hex en composantes RGB (0–255), ou `null` si invalide. */
export function hexToRgb(hex: string): Rgb | null {
  const n = normalizeHex(hex);
  if (!n) return null;
  return {
    r: parseInt(n.slice(1, 3), 16),
    g: parseInt(n.slice(3, 5), 16),
    b: parseInt(n.slice(5, 7), 16),
  };
}

function toHex2(n: number): string {
  const v = Math.max(0, Math.min(255, Math.round(n)));
  return v.toString(16).padStart(2, "0");
}

function rgbToHex({ r, g, b }: Rgb): string {
  return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
}

/**
 * Mélange une couleur avec du blanc. `whiteRatio` ∈ [0,1] : 0 = couleur pure,
 * 1 = blanc. Sert à fabriquer les teintes douces (fonds légers) et le texte
 * « blanc cassé » sur le bandeau. Retombe sur l'entrée si hex invalide.
 */
export function mixWithWhite(hex: string, whiteRatio: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const t = Math.max(0, Math.min(1, whiteRatio));
  return rgbToHex({
    r: rgb.r + (255 - rgb.r) * t,
    g: rgb.g + (255 - rgb.g) * t,
    b: rgb.b + (255 - rgb.b) * t,
  });
}

/** Luminance relative WCAG (0 = noir, 1 = blanc). `0` si hex invalide. */
export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const chan = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(rgb.r) + 0.7152 * chan(rgb.g) + 0.0722 * chan(rgb.b);
}

/** Ratio de contraste WCAG entre le blanc pur et `hex` (1 → 21). */
export function contrastWithWhite(hex: string): number {
  const l = relativeLuminance(hex);
  // L(blanc) = 1 ; contraste = (Lclair + 0.05) / (Lsombre + 0.05).
  return (1 + 0.05) / (l + 0.05);
}

/**
 * `true` si l'accent est assez foncé pour porter du texte blanc lisible
 * (contraste blanc/accent ≥ MIN_ACCENT_CONTRAST). Invalide → `false`.
 */
export function isAccentDarkEnough(hex: string): boolean {
  if (!normalizeHex(hex)) return false;
  return contrastWithWhite(hex) >= MIN_ACCENT_CONTRAST;
}

export interface AccentPalette {
  /** Accent normalisé `#rrggbb`. */
  accent: string;
  /** Teinte très douce (fonds légers : N.B., zébrage accentué). */
  accentSoft: string;
  /** Blanc cassé lisible sur le bandeau (texte secondaire). */
  onBand: string;
}

/**
 * Construit la palette dérivée à partir d'un accent. Si l'accent est invalide
 * ou trop clair pour du texte blanc, on retombe sur l'accent par défaut — le
 * rendu reste toujours lisible (jamais de texte blanc sur fond pâle).
 */
export function derivePalette(accentInput: string | null | undefined): AccentPalette {
  const normalized = normalizeHex(accentInput ?? "");
  const accent = normalized && isAccentDarkEnough(normalized) ? normalized : DEFAULT_ACCENT;
  return {
    accent,
    accentSoft: mixWithWhite(accent, 0.92),
    onBand: mixWithWhite(accent, 0.85),
  };
}
