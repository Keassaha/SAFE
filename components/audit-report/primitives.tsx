import React from "react";
import { PALETTE, RISK_COLORS, type RiskLevel } from "./theme";

/* ── Paths exacts du logo SAFE (viewBox 0 0 24 24) ───────────────── */
const LOGO_PATH_UPPER =
  "M 4.5,5.5 Q 3.5,3.5 5.5,4 L 12.5,4 Q 14.5,3.5 13.5,5.5 L 10,12.5 Q 9,14.5 8,12.5 Z";
const LOGO_PATH_LOWER =
  "M 19.5,18.5 Q 20.5,20.5 18.5,20 L 11.5,20 Q 9.5,20.5 10.5,18.5 L 14,11.5 Q 15,9.5 16,11.5 Z";

/* ── Logo mono ────────────────────────────────────────────────────── */
export function LogoMono({ size = 28 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path d={LOGO_PATH_UPPER} fill="currentColor" />
      <path d={LOGO_PATH_LOWER} fill="currentColor" fillOpacity={0.55} />
    </svg>
  );
}

/* ── LogoDisplay (grande version couverture) ──────────────────────── */
export function LogoDisplay({
  size = 64,
  tone = "light",
}: {
  size?: number;
  tone?: "light" | "dark";
}) {
  const upper = tone === "dark" ? "#D4E8D9" : "#1C1C1C";
  const lower = tone === "dark" ? "#FFFFFF" : "#1C1C1C";
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path d={LOGO_PATH_UPPER} fill={upper} />
      <path d={LOGO_PATH_LOWER} fill={lower} fillOpacity={0.55} />
    </svg>
  );
}

/* ── Eyebrow ──────────────────────────────────────────────────────── */
export function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-geist-mono, monospace)",
        fontSize: "9px",
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: dark ? PALETTE.goldDark : PALETTE.gold,
        marginBottom: "10px",
        fontWeight: 500,
      }}
    >
      {children}
    </p>
  );
}

/* ── DisplayTitle ─────────────────────────────────────────────────── */
export function DisplayTitle({
  children,
  size = "xl",
  dark = false,
}: {
  children: React.ReactNode;
  size?: "xl" | "lg" | "md";
  dark?: boolean;
}) {
  const fs = size === "xl" ? "28px" : size === "lg" ? "22px" : "18px";
  return (
    <h2
      style={{
        fontFamily: "var(--font-instrument-serif, Georgia, serif)",
        fontSize: fs,
        lineHeight: 1.15,
        color: dark ? PALETTE.sage50 : PALETTE.ink,
        fontWeight: 400,
        margin: 0,
      }}
    >
      {children}
    </h2>
  );
}

/* ── Italic accent within a title ────────────────────────────────── */
export function Em({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <em
      style={{
        fontStyle: "italic",
        color: dark ? PALETTE.goldDark : PALETTE.forest2,
      }}
    >
      {children}
    </em>
  );
}

/* ── MonoLabel ────────────────────────────────────────────────────── */
export function MonoLabel({
  children,
  dark = false,
  small = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
  small?: boolean;
}) {
  return (
    <span
      style={{
        fontFamily: "var(--font-geist-mono, monospace)",
        fontSize: small ? "8px" : "9px",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: dark ? PALETTE.sage200 : PALETTE.moss2,
        fontWeight: 400,
      }}
    >
      {children}
    </span>
  );
}

/* ── SourceTag ────────────────────────────────────────────────────── */
export function SourceTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-geist-mono, monospace)",
        fontSize: "7.5px",
        letterSpacing: "0.08em",
        color: PALETTE.moss2,
        opacity: 0.75,
      }}
    >
      {children}
    </span>
  );
}

/* ── RiskBadge ────────────────────────────────────────────────────── */
export function RiskBadge({ niveau }: { niveau: RiskLevel }) {
  const c = RISK_COLORS[niveau];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        backgroundColor: c.bg,
        color: c.text,
        fontFamily: "var(--font-geist-mono, monospace)",
        fontSize: "8px",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        fontWeight: 500,
        padding: "3px 8px",
        borderRadius: "4px",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          backgroundColor: c.dot,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {niveau}
    </span>
  );
}

/* ── StatTile ─────────────────────────────────────────────────────── */
export function StatTile({
  label,
  value,
  sub,
  dark = false,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  dark?: boolean;
  accent?: boolean;
}) {
  return (
    <div>
      <p
        style={{
          fontFamily: "var(--font-geist-mono, monospace)",
          fontSize: "8px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: dark ? PALETTE.sage200 : PALETTE.moss2,
          marginBottom: "4px",
          fontWeight: 400,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "var(--font-instrument-serif, Georgia, serif)",
          fontSize: "26px",
          lineHeight: 1,
          color: accent
            ? PALETTE.goldDark
            : dark
            ? PALETTE.sage50
            : PALETTE.ink,
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
            fontSize: "10px",
            color: dark ? PALETTE.sage : PALETTE.moss,
            marginTop: "2px",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

/* ── HalfGauge SVG ────────────────────────────────────────────────── */
export function HalfGauge({
  value,
  max = 100,
  arcColor,
  label,
  subLabel,
}: {
  value: number;
  max?: number;
  arcColor: string;
  label: string;
  subLabel?: string;
}) {
  const CX = 130;
  const CY = 125;
  const R = 110;
  const pct = Math.max(0, Math.min(1, value / max));

  // Start point of arc (left, 180°)
  const sx = CX - R;
  const sy = CY;

  // End point at angle θ = π - π×pct (from positive x-axis)
  const theta = Math.PI - Math.PI * pct;
  const ex = CX + R * Math.cos(theta);
  const ey = CY - R * Math.sin(theta);

  // large-arc-flag: 1 if arc > 180°, else 0 (pct must be exactly 1 for 180°)
  const largeArc = pct > 0.5 ? 1 : 0;

  const bgPath = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;
  const fgPath =
    pct <= 0
      ? ""
      : pct >= 1
      ? bgPath
      : `M ${sx} ${sy} A ${R} ${R} 0 ${largeArc} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;

  return (
    <svg viewBox="0 0 260 140" style={{ width: "100%", maxWidth: "260px" }} aria-hidden="true">
      {/* Background arc */}
      <path
        d={bgPath}
        fill="none"
        stroke={PALETTE.sage100}
        strokeWidth="14"
        strokeLinecap="round"
      />

      {/* Progress arc */}
      {fgPath && (
        <path
          d={fgPath}
          fill="none"
          stroke={arcColor}
          strokeWidth="14"
          strokeLinecap="round"
        />
      )}

      {/* Dot at end of progress arc */}
      {pct > 0 && pct < 1 && (
        <circle cx={ex.toFixed(2)} cy={ey.toFixed(2)} r="7" fill={arcColor} />
      )}

      {/* Score number */}
      <text
        x={CX}
        y={CY - 8}
        textAnchor="middle"
        style={{
          fontFamily: "var(--font-instrument-serif, Georgia, serif)",
          fontSize: "52px",
          fill: PALETTE.ink,
          fontWeight: 400,
        }}
      >
        {value}
      </text>

      {/* /100 suffix */}
      <text
        x={CX}
        y={CY + 18}
        textAnchor="middle"
        style={{
          fontFamily: "var(--font-geist-mono, monospace)",
          fontSize: "11px",
          fill: PALETTE.moss,
          letterSpacing: "0.08em",
        }}
      >
        sur 100
      </text>

      {/* Label */}
      <text
        x={CX}
        y={CY + 38}
        textAnchor="middle"
        style={{
          fontFamily: "var(--font-instrument-serif, Georgia, serif)",
          fontSize: "15px",
          fill: arcColor,
          fontStyle: "italic",
        }}
      >
        {label}
      </text>

      {subLabel && (
        <text
          x={CX}
          y={CY + 54}
          textAnchor="middle"
          style={{
            fontFamily: "var(--font-geist-sans, sans-serif)",
            fontSize: "9px",
            fill: PALETTE.moss2,
          }}
        >
          {subLabel}
        </text>
      )}
    </svg>
  );
}

/* ── Divider ──────────────────────────────────────────────────────── */
export function Divider({ dark = false }: { dark?: boolean }) {
  return (
    <hr
      style={{
        border: "none",
        borderTop: `0.5px solid ${dark ? "rgba(169,194,178,.2)" : PALETTE.line}`,
        margin: "0",
      }}
    />
  );
}

/* ── StatusPill ───────────────────────────────────────────────────── */
export function StatusPill({ statut }: { statut: "À surveiller" | "Couvert par SAFE" }) {
  const isCovered = statut === "Couvert par SAFE";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        backgroundColor: isCovered ? "#E8F0EA" : "#F7EED7",
        color: isCovered ? "#1F3A2E" : "#6B5010",
        fontFamily: "var(--font-geist-mono, monospace)",
        fontSize: "7.5px",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        fontWeight: 500,
        padding: "3px 8px",
        borderRadius: "4px",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 4,
          height: 4,
          borderRadius: "50%",
          backgroundColor: isCovered ? "#587567" : "#A9772A",
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {statut}
    </span>
  );
}
