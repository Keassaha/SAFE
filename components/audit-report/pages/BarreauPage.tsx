import React from "react";
import { PALETTE } from "../theme";
import { PageShell } from "../PageShell";
import { Eyebrow, DisplayTitle, Em, StatusPill } from "../primitives";
import type { AuditReport, Variant } from "@/types/audit-report";

interface Props {
  data: AuditReport;
  variant: Variant;
}

export function BarreauPage({ data, variant }: Props) {
  const { barreau, barreauDisclaimer } = data;

  return (
    <PageShell
      pageLabel="Ce que dit votre Barreau"
      pageNum="04"
      date={data.meta.date}
      variant={variant}
    >
      <Eyebrow>04 · Ce que dit votre Barreau</Eyebrow>
      <DisplayTitle size="lg">
        Vos obligations clés, et où vous en <Em>êtes.</Em>
      </DisplayTitle>

      <div style={{ height: "20px" }} />

      {/* Table header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "90px 1fr 130px",
          gap: "0",
          backgroundColor: PALETTE.sage50,
          borderRadius: "6px 6px 0 0",
          padding: "8px 16px",
        }}
      >
        {["Référence", "Sujet et description", "Statut"].map((h) => (
          <p
            key={h}
            style={{
              fontFamily: "var(--font-geist-mono, monospace)",
              fontSize: "7.5px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: PALETTE.moss,
              margin: 0,
              fontWeight: 500,
            }}
          >
            {h}
          </p>
        ))}
      </div>

      {/* Table rows */}
      <div style={{ border: `0.5px solid ${PALETTE.lineSoft}`, borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden" }}>
        {barreau.map((item, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "90px 1fr 130px",
              gap: "0",
              padding: "12px 16px",
              borderBottom:
                i < barreau.length - 1
                  ? `0.5px solid ${PALETTE.lineSoft}`
                  : "none",
              backgroundColor: i % 2 === 0 ? "var(--cream-card)" : "transparent",
              alignItems: "start",
            }}
          >
            {/* Reference */}
            <span
              style={{
                fontFamily: "var(--font-geist-mono, monospace)",
                fontSize: "8.5px",
                color: PALETTE.moss,
                letterSpacing: "0.04em",
                paddingTop: "1px",
              }}
            >
              {item.reference}
            </span>

            {/* Subject + description */}
            <div style={{ paddingRight: "16px" }}>
              <p
                style={{
                  fontFamily: "var(--font-geist-sans, sans-serif)",
                  fontSize: "10.5px",
                  fontWeight: 600,
                  color: PALETTE.ink,
                  margin: "0 0 4px",
                }}
              >
                {item.sujet}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-geist-sans, sans-serif)",
                  fontSize: "9.5px",
                  color: PALETTE.moss,
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {item.description}
              </p>
            </div>

            {/* Status */}
            <div style={{ paddingTop: "1px" }}>
              <StatusPill statut={item.statut} />
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: "16px",
          borderTop: `0.5px solid ${PALETTE.lineSoft}`,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-geist-sans, sans-serif)",
            fontSize: "8.5px",
            color: PALETTE.moss2,
            lineHeight: 1.6,
            fontStyle: "italic",
          }}
        >
          {barreauDisclaimer}
        </p>
      </div>
    </PageShell>
  );
}
