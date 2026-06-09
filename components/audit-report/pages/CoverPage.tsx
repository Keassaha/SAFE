import React from "react";
import { PALETTE } from "../theme";
import { LogoDisplay } from "../primitives";
import type { AuditReport, Variant } from "@/types/audit-report";

interface Props {
  data: AuditReport;
  variant: Variant;
}

const haloGreen = (v: Variant) =>
  v === "cream" ? "rgba(22,59,46,.16)" : "rgba(22,59,46,.12)";
const haloGold = (v: Variant) =>
  v === "cream" ? "rgba(169,119,42,.13)" : "rgba(169,119,42,.10)";

export function CoverPage({ data, variant }: Props) {
  return (
    <div
      className="audit-page"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        boxSizing: "border-box",
        padding: "56px 60px 52px",
      }}
    >
      {/* Halos */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", top: 0, left: 0,
          width: "400px", height: "400px",
          background: `radial-gradient(circle, ${haloGreen(variant)}, transparent 68%)`,
          filter: "blur(46px)", pointerEvents: "none", zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute", bottom: 0, right: 0,
          width: "400px", height: "400px",
          background: `radial-gradient(circle, ${haloGold(variant)}, transparent 68%)`,
          filter: "blur(46px)", pointerEvents: "none", zIndex: 0,
        }}
      />

      {/* Top: eyebrow + confidential */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p
            style={{
              fontFamily: "var(--font-geist-mono, monospace)",
              fontSize: "9px",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: PALETTE.gold,
              marginBottom: "6px",
            }}
          >
            Diagnostic de cabinet
          </p>
          <p
            style={{
              fontFamily: "var(--font-geist-mono, monospace)",
              fontSize: "8px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: PALETTE.moss2,
            }}
          >
            {data.meta.confidentiel ? "Confidentiel" : ""}
          </p>
        </div>
        <p
          style={{
            fontFamily: "var(--font-geist-mono, monospace)",
            fontSize: "8px",
            letterSpacing: "0.1em",
            color: PALETTE.moss2,
            textAlign: "right",
          }}
        >
          Réf. {data.meta.ref}
          <br />
          {data.meta.date}
        </p>
      </div>

      {/* Center: main title */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 32px" }}>
        <h1
          style={{
            fontFamily: "var(--font-instrument-serif, Georgia, serif)",
            fontSize: "42px",
            lineHeight: 1.1,
            color: PALETTE.ink,
            fontWeight: 400,
            margin: "0 0 24px",
          }}
        >
          Diagnostic de performance de votre{" "}
          <em style={{ fontStyle: "italic", color: PALETTE.forest2 }}>cabinet.</em>
        </h1>
        <p
          style={{
            fontFamily: "var(--font-geist-sans, sans-serif)",
            fontSize: "14px",
            color: PALETTE.moss,
            lineHeight: 1.6,
            maxWidth: "440px",
            margin: "0 auto",
          }}
        >
          Préparé pour {data.cabinet.raisonSociale} · {data.cabinet.localisation}
        </p>
      </div>

      {/* Bottom: cabinet name + SAFE logo */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <p
            style={{
              fontFamily: "var(--font-geist-sans, sans-serif)",
              fontSize: "11px",
              color: PALETTE.moss2,
              marginBottom: "4px",
            }}
          >
            {data.cabinet.contact}
          </p>
          <p
            style={{
              fontFamily: "var(--font-geist-sans, sans-serif)",
              fontSize: "11px",
              color: PALETTE.moss2,
            }}
          >
            {data.cabinet.localisation}
          </p>
        </div>

        {/* SAFE logo large */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <LogoDisplay size={52} />
          <span
            style={{
              fontFamily: "var(--font-instrument-serif, Georgia, serif)",
              fontSize: "34px",
              lineHeight: 1,
              color: PALETTE.ink,
              fontWeight: 400,
            }}
          >
            Safe
          </span>
        </div>
      </div>
    </div>
  );
}
