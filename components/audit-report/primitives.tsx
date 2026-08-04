import React from "react";
import { PALETTE, RISK_RANK, type RiskLevel } from "./theme";
import { SafeMark } from "@/components/branding/SafeLogo";

/* ── Logo ─────────────────────────────────────────────────────────
 * Le mark canonique, à la couleur du texte courant. Le rapport d'audit part
 * chez la cliente : il ne doit jamais dériver de la marque du produit.     */
export function Logo({ size = 28 }: { size?: number }) {
  return <SafeMark size={size} tone="currentColor" />;
}

/* ── Eyebrow (numéro + nom de section) ────────────────────────────── */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-geist-mono, monospace)",
        fontSize: "9px",
        letterSpacing: "0.26em",
        textTransform: "uppercase",
        color: PALETTE.gold,
        margin: "0 0 8px",
        fontWeight: 500,
      }}
    >
      {children}
    </p>
  );
}

/* ── Titre de section ─────────────────────────────────────────────── */
export function DisplayTitle({
  children,
  size = "lg",
}: {
  children: React.ReactNode;
  size?: "xl" | "lg" | "md";
}) {
  const fs = size === "xl" ? "30px" : size === "lg" ? "23px" : "18px";
  return (
    <h2
      style={{
        fontFamily: "var(--font-instrument-serif, Georgia, serif)",
        fontSize: fs,
        lineHeight: 1.15,
        color: PALETTE.ink,
        fontWeight: 400,
        margin: 0,
      }}
    >
      {children}
    </h2>
  );
}

/* ── Chapeau : une phrase qui explique la page ────────────────────── */
export function Lede({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-geist-sans, sans-serif)",
        fontSize: "11.5px",
        lineHeight: 1.6,
        color: PALETTE.inkBody,
        margin: "8px 0 0",
        maxWidth: "560px",
      }}
    >
      {children}
    </p>
  );
}

/* ── Italique d'accent dans un titre ──────────────────────────────── */
export function Em({ children }: { children: React.ReactNode }) {
  return <em style={{ fontStyle: "italic", color: PALETTE.forest }}>{children}</em>;
}

/* ── Libellé mono (entêtes de colonne, étiquettes) ────────────────── */
export function MonoLabel({
  children,
  onDark = false,
}: {
  children: React.ReactNode;
  onDark?: boolean;
}) {
  return (
    <span
      style={{
        fontFamily: "var(--font-geist-mono, monospace)",
        fontSize: "8px",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: onDark ? PALETTE.onForestMuted : PALETTE.inkMuted,
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
}

/* ── Source ───────────────────────────────────────────────────────── */
export function SourceTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-geist-mono, monospace)",
        fontSize: "7.5px",
        letterSpacing: "0.06em",
        color: PALETTE.inkFaint,
      }}
    >
      {children}
    </span>
  );
}

/* ── Jauge de gravité ─────────────────────────────────────────────
 * Remplace les pastilles de couleur. Quatre crans, remplis en or
 * jusqu'au niveau atteint. Le libellé écrit reste la source de vérité,
 * la jauge sert seulement au repérage rapide au balayage.            */
export function GravityMeter({ niveau, dim = false }: { niveau: RiskLevel; dim?: boolean }) {
  const filled = dim ? 0 : RISK_RANK[niveau];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
      <span
        style={{
          fontFamily: "var(--font-geist-mono, monospace)",
          fontSize: "8px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: !dim && filled >= 3 ? PALETTE.gold : PALETTE.inkMuted,
          fontWeight: 500,
        }}
      >
        {niveau}
      </span>
      <span style={{ display: "inline-flex", gap: "2px" }} aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            style={{
              width: "10px",
              height: "3px",
              borderRadius: "1px",
              backgroundColor: i <= filled ? PALETTE.gold : PALETTE.lineSoft,
              display: "inline-block",
            }}
          />
        ))}
      </span>
    </span>
  );
}

/* ── Statut d'obligation ──────────────────────────────────────────
 * Deux états seulement, distingués par le remplissage et non par la
 * teinte : couvert = plein vert, à surveiller = contour or.          */
export function StatusPill({ statut }: { statut: "À surveiller" | "Couvert par SAFE" }) {
  const isCovered = statut === "Couvert par SAFE";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontFamily: "var(--font-geist-mono, monospace)",
        fontSize: "7.5px",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        fontWeight: 500,
        padding: "3px 8px",
        borderRadius: "3px",
        whiteSpace: "nowrap",
        backgroundColor: isCovered ? PALETTE.fillStrong : "transparent",
        border: isCovered ? "0.5px solid transparent" : `0.5px solid ${PALETTE.gold}`,
        color: isCovered ? PALETTE.inkBody : PALETTE.gold,
      }}
    >
      {statut}
    </span>
  );
}

/* ── Chiffre clé ──────────────────────────────────────────────────── */
export function KeyFigure({
  label,
  value,
  sub,
  accent = false,
  onDark = false,
  size = "md",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  onDark?: boolean;
  size?: "md" | "lg";
}) {
  const valueColor = accent
    ? onDark
      ? PALETTE.goldOnForest
      : PALETTE.gold
    : onDark
    ? PALETTE.onForest
    : PALETTE.ink;

  return (
    <div>
      <p style={{ margin: "0 0 6px" }}>
        <MonoLabel onDark={onDark}>{label}</MonoLabel>
      </p>
      <p
        style={{
          fontFamily: "var(--font-instrument-serif, Georgia, serif)",
          fontSize: size === "lg" ? "36px" : "26px",
          lineHeight: 1,
          color: valueColor,
          fontWeight: 400,
          margin: 0,
        }}
      >
        {value}
      </p>
      {sub && (
        <p
          style={{
            fontFamily: "var(--font-geist-sans, sans-serif)",
            fontSize: "9.5px",
            lineHeight: 1.5,
            color: onDark ? PALETTE.onForestMuted : PALETTE.inkMuted,
            margin: "5px 0 0",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

/* ── Filet ────────────────────────────────────────────────────────── */
export function Divider({ strong = false }: { strong?: boolean }) {
  return (
    <hr
      style={{
        border: "none",
        borderTop: `0.5px solid ${strong ? PALETTE.line : PALETTE.lineSoft}`,
        margin: 0,
      }}
    />
  );
}
