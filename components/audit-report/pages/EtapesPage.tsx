import React from "react";
import { PALETTE } from "../theme";
import { PageShell } from "../PageShell";
import { Eyebrow, DisplayTitle, Em } from "../primitives";
import type { AuditReport, Variant } from "@/types/audit-report";

interface Props {
  data: AuditReport;
  variant: Variant;
}

export function EtapesPage({ data, variant }: Props) {
  const { etapes, citationFondateur, cabinet } = data;

  return (
    <PageShell
      pageLabel="Prochaines étapes"
      pageNum="09"
      date={data.meta.date}
      variant={variant}
    >
      <Eyebrow>09 · Prochaines étapes</Eyebrow>
      <DisplayTitle size="lg">
        Comment on avance <Em>ensemble.</Em>
      </DisplayTitle>

      <div style={{ height: "24px" }} />

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
        {etapes.map((etape, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "20px",
              alignItems: "flex-start",
            }}
          >
            {/* Step number */}
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: i === 0 ? PALETTE.forest : PALETTE.sage100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-instrument-serif, Georgia, serif)",
                  fontSize: "18px",
                  color: i === 0 ? PALETTE.goldDark : PALETTE.moss,
                  fontWeight: 400,
                }}
              >
                {i + 1}
              </span>
            </div>

            {/* Content */}
            <div style={{ flex: 1, paddingTop: "4px" }}>
              <p
                style={{
                  fontFamily: "var(--font-geist-sans, sans-serif)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: PALETTE.ink,
                  marginBottom: "6px",
                }}
              >
                {etape.titre}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-geist-sans, sans-serif)",
                  fontSize: "10.5px",
                  color: PALETTE.moss,
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {etape.description}
              </p>
            </div>

            {/* Connector line (except last) */}
            {i < etapes.length - 1 && (
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "68px",
                  marginTop: "44px",
                  width: "1px",
                  height: "24px",
                  backgroundColor: PALETTE.lineSoft,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Founder quote */}
      <div
        style={{
          marginTop: "auto",
          backgroundColor: PALETTE.forest,
          borderRadius: "10px",
          padding: "22px 24px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-geist-mono, monospace)",
            fontSize: "8px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: PALETTE.sage,
            marginBottom: "10px",
          }}
        >
          Mot du fondateur
        </p>
        <blockquote
          style={{
            fontFamily: "var(--font-instrument-serif, Georgia, serif)",
            fontSize: "14px",
            fontStyle: "italic",
            lineHeight: 1.65,
            color: PALETTE.sage50,
            margin: "0 0 14px",
          }}
        >
          "{citationFondateur}"
        </blockquote>
        <p
          style={{
            fontFamily: "var(--font-geist-sans, sans-serif)",
            fontSize: "9.5px",
            color: PALETTE.sage,
            margin: 0,
          }}
        >
          Préparé spécialement pour {cabinet.raisonSociale}.
        </p>
      </div>
    </PageShell>
  );
}
