import React from "react";
import { PALETTE } from "./theme";
import { Logo } from "./primitives";
import { Eyebrow, DisplayTitle, Lede } from "./primitives";

interface PageShellProps {
  children: React.ReactNode;
  /** Numéro + nom de section, ex. « 02 · Ce que ça vous coûte ». */
  eyebrow: string;
  /** Titre de la page. */
  title: React.ReactNode;
  /** Une phrase qui dit ce que le lecteur va trouver ici. */
  lede?: string;
  /** Libellé repris en pied de page. */
  pageLabel: string;
  pageNum: string;
  total: string;
  date?: string;
}

export function PageShell({
  children,
  eyebrow,
  title,
  lede,
  pageLabel,
  pageNum,
  total,
  date,
}: PageShellProps) {
  return (
    <div
      className="audit-page"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        padding: "44px 52px 34px",
      }}
    >
      {/* Entête */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: "10px",
          borderBottom: `0.5px solid ${PALETTE.lineSoft}`,
          marginBottom: "26px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: PALETTE.forest }}>
          <Logo size={16} />
          <span
            style={{
              fontFamily: "var(--font-geist-mono, monospace)",
              fontSize: "8px",
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: PALETTE.inkFaint,
            }}
          >
            Confidentiel
          </span>
        </div>
        {date && (
          <span
            style={{
              fontFamily: "var(--font-geist-mono, monospace)",
              fontSize: "8px",
              color: PALETTE.inkFaint,
              letterSpacing: "0.06em",
            }}
          >
            {date}
          </span>
        )}
      </header>

      {/* Titre de section */}
      <div style={{ flexShrink: 0, marginBottom: "22px" }}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <DisplayTitle size="lg">{title}</DisplayTitle>
        {lede && <Lede>{lede}</Lede>}
      </div>

      {/* Contenu */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {children}
      </div>

      {/* Pied */}
      <footer
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "10px",
          borderTop: `0.5px solid ${PALETTE.lineSoft}`,
          marginTop: "18px",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-geist-sans, sans-serif)",
            fontSize: "8.5px",
            color: PALETTE.inkFaint,
          }}
        >
          {pageLabel}
        </span>
        <span
          style={{
            fontFamily: "var(--font-geist-mono, monospace)",
            fontSize: "8.5px",
            color: PALETTE.inkFaint,
            letterSpacing: "0.12em",
          }}
        >
          {pageNum} · {total}
        </span>
      </footer>
    </div>
  );
}
