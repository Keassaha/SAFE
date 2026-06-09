import React from "react";
import { PALETTE } from "./theme";
import { LogoMono } from "./primitives";
import type { Variant } from "@/types/audit-report";

interface PageShellProps {
  children: React.ReactNode;
  pageLabel: string;
  pageNum: string;
  total?: string;
  date?: string;
  variant: Variant;
  darkPage?: boolean;
}

export function PageShell({
  children,
  pageLabel,
  pageNum,
  total = "11",
  date,
  variant,
  darkPage = false,
}: PageShellProps) {
  const bgColor = darkPage ? PALETTE.forest : undefined;
  const textColor = darkPage ? PALETTE.sage50 : PALETTE.moss2;
  const lineColor = darkPage
    ? "rgba(169,194,178,.15)"
    : PALETTE.line;

  const haloGreen =
    variant === "cream"
      ? "rgba(22,59,46,.16)"
      : "rgba(22,59,46,.12)";
  const haloGold =
    variant === "cream"
      ? "rgba(169,119,42,.13)"
      : "rgba(169,119,42,.10)";

  return (
    <div
      className="audit-page"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        backgroundColor: bgColor,
        overflow: "hidden",
        boxSizing: "border-box",
        padding: "40px 48px 32px",
      }}
    >
      {/* Corner halos */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "340px",
          height: "340px",
          background: `radial-gradient(circle, ${haloGreen}, transparent 68%)`,
          filter: "blur(46px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: "340px",
          height: "340px",
          background: `radial-gradient(circle, ${haloGold}, transparent 68%)`,
          filter: "blur(46px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Header */}
      <header
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: "12px",
          borderBottom: `0.5px solid ${lineColor}`,
          marginBottom: "28px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: textColor }}>
          <LogoMono size={20} />
          <span
            style={{
              fontFamily: "var(--font-geist-mono, monospace)",
              fontSize: "8.5px",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: darkPage ? PALETTE.sage : PALETTE.moss2,
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
              color: darkPage ? PALETTE.sage : PALETTE.moss2,
              letterSpacing: "0.06em",
            }}
          >
            {date}
          </span>
        )}
      </header>

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {children}
      </div>

      {/* Footer */}
      <footer
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "10px",
          borderTop: `0.5px solid ${lineColor}`,
          marginTop: "16px",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-geist-sans, sans-serif)",
            fontSize: "8px",
            color: darkPage ? PALETTE.sage : PALETTE.moss2,
            letterSpacing: "0.04em",
          }}
        >
          {pageLabel}
        </span>
        <span
          style={{
            fontFamily: "var(--font-geist-mono, monospace)",
            fontSize: "8px",
            color: darkPage ? PALETTE.sage : PALETTE.moss2,
            letterSpacing: "0.12em",
          }}
        >
          {pageNum} · {total}
        </span>
      </footer>
    </div>
  );
}
