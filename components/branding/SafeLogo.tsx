/**
 * Logo SAFE — composant canonique.
 *
 * Formes et encres viennent de `components/brand/safe-mark.ts`. Ce fichier ne
 * décide que de l'assemblage (mark seul, mark + mot, plaque). Toute autre
 * copie du logo dans le dépôt est un bogue : voir docs/brand/IDENTITE_SAFE.md.
 *
 * Le logo ne bouge pas. Un mouvement décoratif permanent sur une marque de
 * confiance dit « site vitrine » (DESIGN_HUMAIN §0 M4, L3 du standard premium).
 */

import React from "react";
import {
  ASSEMBLY_PIECE_A_PATH,
  ASSEMBLY_PIECE_B_PATH,
  ASSEMBLY_XS_PIECE_A_PATH,
  ASSEMBLY_XS_PIECE_B_PATH,
  LOCKUP_GAP_RATIO,
  MARK_GEOMETRY,
  MARK_VIEWBOX,
  MARK_XS_THRESHOLD,
  PEBBLE_LOWER_OPACITY,
  PEBBLE_LOWER_PATH,
  PEBBLE_UPPER_PATH,
  PLATE_CORNER_RATIO,
  PLATE_MARK_RATIO,
  SAFE_INK,
  SAFE_MARK_DEFAULT,
  SAFE_PALETTE,
  SAFE_WORD_INK,
  VAULT_ARCH_PATH,
  VAULT_ARCH_STROKE,
  VAULT_KEYSTONE_PATH,
  WORDMARK_RATIO,
  WORDMARK_TRACKING,
  WORDMARK_WEIGHT,
  type MarkShape,
  type MarkTone,
} from "@/components/brand/safe-mark";

export type { MarkTone, MarkShape };

/* ── Le mark seul ──────────────────────────────────────────────────── */

export function SafeMark({
  size = 24,
  tone = "light",
  shape = SAFE_MARK_DEFAULT,
  title,
  className,
}: {
  /** Côté du carré du mark, en pixels. */
  size?: number;
  tone?: MarkTone;
  /** Réservé à la page de contrôle `/marque`. */
  shape?: MarkShape;
  /** Renseigné → le mark devient une image nommée ; sinon il est décoratif. */
  title?: string;
  className?: string;
}) {
  const ink = SAFE_INK[tone];
  const { scale } = MARK_GEOMETRY[shape];
  /* Sous vingt pixels, le rayon et le joint de référence se bouchent :
     la charte prévoit un dessin distinct, jamais un simple agrandissement. */
  const xs = size < MARK_XS_THRESHOLD;

  return (
    <svg
      viewBox={MARK_VIEWBOX}
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className}
      style={{ display: "block", flexShrink: 0, overflow: "visible" }}
    >
      {title && <title>{title}</title>}
      {/* Chaque dessin est ramené à la même hauteur utile : le verrou garde
          un seul rapport mot / mark quelle que soit la forme servie. */}
      <g transform={`translate(12 12) scale(${scale}) translate(-12 -12)`}>
        {shape === "assemblage" && (
          <>
            <path d={xs ? ASSEMBLY_XS_PIECE_A_PATH : ASSEMBLY_PIECE_A_PATH} fill={ink.a} />
            <path d={xs ? ASSEMBLY_XS_PIECE_B_PATH : ASSEMBLY_PIECE_B_PATH} fill={ink.b} />
          </>
        )}
        {shape === "galets" && (
          <>
            <path d={PEBBLE_UPPER_PATH} fill={ink.a} />
            <path d={PEBBLE_LOWER_PATH} fill={ink.a} fillOpacity={PEBBLE_LOWER_OPACITY} />
          </>
        )}
        {shape === "voute" && (
          <>
            <path
              d={VAULT_ARCH_PATH}
              fill="none"
              stroke={ink.a}
              strokeWidth={VAULT_ARCH_STROKE}
              strokeLinecap="butt"
            />
            <path d={VAULT_KEYSTONE_PATH} fill={ink.a} />
          </>
        )}
      </g>
    </svg>
  );
}

/* ── Le fragment de marque seul ────────────────────────────────────── */

/**
 * Repère de liste maison : le symbole réduit à une puce, dans la couleur du
 * texte courant. Les deux pièces prennent la même encre, le joint reste
 * visible parce qu'il est évidé. Jamais un logo.
 */
export function SafeBullet({
  size = 12,
  className,
}: {
  /** Côté de la puce, en pixels. */
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
      style={{ display: "block", flexShrink: 0 }}
    >
      <path d={ASSEMBLY_XS_PIECE_A_PATH} fill="currentColor" />
      <path d={ASSEMBLY_XS_PIECE_B_PATH} fill="currentColor" />
    </svg>
  );
}

/* ── Le verrou horizontal (mark + mot) ─────────────────────────────── */

export interface SafeLogoProps {
  className?: string;
  /**
   * Classes posées sur le mot seul. Sert aux entêtes qui masquent le mot en
   * petit écran (`hidden sm:block`) : c'est le besoin qui poussait les barres
   * de navigation à recopier le verrou à la main.
   */
  wordClassName?: string;
  /** Nom accessible du verrou. */
  alt?: string;
  /** Fond clair (défaut) ou fond sombre. Ignoré si `tone` est fourni. */
  variant?: "light" | "dark";
  /** Ton explicite, prioritaire sur `variant`. */
  tone?: MarkTone;
  /** Côté du mark, en pixels. Le mot suit automatiquement. */
  size?: number;
  /** Mark seul, sans le mot. */
  markOnly?: boolean;
  /** Pose le mark sur une plaque verte (icône d'app, tuile). */
  plate?: boolean;
  /** Réservé à la page de contrôle `/marque`. */
  shape?: MarkShape;
  /** @deprecated Le logo ne s'anime plus. Prop acceptée sans effet. */
  noPulse?: boolean;
  /** @deprecated Remplacé par `plate`. */
  brandBar?: boolean;
  /** @deprecated Sans effet. */
  priority?: boolean;
}

export function SafeLogo({
  className = "",
  wordClassName = "",
  alt = "SAFE",
  variant = "light",
  tone,
  size = 22,
  markOnly = false,
  plate = false,
  shape = SAFE_MARK_DEFAULT,
  brandBar = false,
}: SafeLogoProps) {
  const resolvedTone: MarkTone = tone ?? variant;
  const onPlate = plate || brandBar;
  /* Sur plaque verte, le mark passe en inversée couleur : blanc cassé et
     émeraude, le joint laissant remonter le vert forêt de la plaque. */
  const markTone: MarkTone = onPlate ? "dark" : resolvedTone;

  const wordSize = Math.round(size * WORDMARK_RATIO * 10) / 10;
  const gap = Math.round(size * LOCKUP_GAP_RATIO);
  const plateSize = Math.round(size / PLATE_MARK_RATIO);

  const mark = <SafeMark size={size} tone={markTone} shape={shape} />;

  return (
    <span
      role="img"
      aria-label={alt}
      className={`inline-flex items-center ${className}`.trim()}
      style={{ gap }}
    >
      {onPlate ? (
        <span
          className="inline-flex shrink-0 items-center justify-center"
          style={{
            width: plateSize,
            height: plateSize,
            borderRadius: Math.round(plateSize * PLATE_CORNER_RATIO),
            background: SAFE_PALETTE.forest,
          }}
        >
          {mark}
        </span>
      ) : (
        mark
      )}

      {!markOnly && (
        <span
          aria-hidden
          className={`select-none leading-none ${wordClassName}`.trim()}
          style={{
            /* Wordmark grotesque, chasse resserrée : la charte écarte le
               serif, qui jurait avec un symbole entièrement orthogonal. */
            fontFamily: "var(--font-geist-sans), Inter, -apple-system, sans-serif",
            fontSize: wordSize,
            fontWeight: WORDMARK_WEIGHT,
            letterSpacing: WORDMARK_TRACKING,
            /* L'interlettrage ajoute une chasse morte après le E : on la retire
               pour que l'écart mark ↔ mot reste celui de la charte. */
            marginRight: `-${WORDMARK_TRACKING}`,
            color: SAFE_WORD_INK[resolvedTone],
          }}
        >
          SAFE
        </span>
      )}
    </span>
  );
}

/**
 * @deprecated Utiliser `SafeMark`. Alias conservé le temps que les anciens
 * appels disparaissent.
 */
export const ChevronMark = ({
  size,
  tone,
  title,
}: {
  size?: number;
  tone?: MarkTone;
  title?: string;
  /** @deprecated Le mark ne s'anime plus. */
  animate?: boolean;
}) => <SafeMark size={size} tone={tone} title={title} />;
