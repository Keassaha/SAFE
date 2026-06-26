import React from "react";
import { PALETTE } from "../theme";
import { PageShell } from "../PageShell";
import { Eyebrow, DisplayTitle, Em, RiskBadge, Divider } from "../primitives";
import type { AuditReport, Variant } from "@/types/audit-report";

interface Props {
  data: AuditReport;
  variant: Variant;
}

export function RisquesPage({ data, variant }: Props) {
  const { risques } = data;

  return (
    <PageShell
      pageLabel="Analyse des risques"
      pageNum="03"
      date={data.meta.date}
      variant={variant}
    >
      <Eyebrow>03 · Analyse des risques</Eyebrow>
      <DisplayTitle size="lg">
        Les points d'exposition <Em>identifiés.</Em>
      </DisplayTitle>

      <div style={{ height: "20px" }} />

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        {risques.map((r, i) => (
          <div
            key={i}
            style={{
              backgroundColor: "var(--cream-card)",
              border: `0.5px solid ${PALETTE.lineSoft}`,
              borderRadius: "8px",
              padding: "14px 16px",
              boxShadow: "var(--card-shadow)",
            }}
          >
            {/* Header row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "10px",
                gap: "12px",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-geist-sans, sans-serif)",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  color: PALETTE.ink,
                  margin: 0,
                  flex: 1,
                  lineHeight: 1.35,
                }}
              >
                {r.titre}
              </p>
              <RiskBadge niveau={r.niveau} />
            </div>

            <Divider />

            {/* Three columns */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "12px",
                marginTop: "10px",
              }}
            >
              <div>
                <p style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "7.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: PALETTE.moss2, marginBottom: "4px" }}>
                  Ce que vos réponses montrent
                </p>
                <p style={{ fontFamily: "var(--font-geist-sans, sans-serif)", fontSize: "9.5px", color: PALETTE.moss, lineHeight: 1.55, margin: 0 }}>
                  {r.ceQueMontrent}
                </p>
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "7.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: PALETTE.moss2, marginBottom: "4px" }}>
                  Impact
                </p>
                <p style={{ fontFamily: "var(--font-geist-sans, sans-serif)", fontSize: "9.5px", color: PALETTE.moss, lineHeight: 1.55, margin: 0 }}>
                  {r.impact}
                </p>
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "7.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: PALETTE.gold, marginBottom: "4px" }}>
                  Ce que SAFE corrige
                </p>
                <p style={{ fontFamily: "var(--font-geist-sans, sans-serif)", fontSize: "9.5px", color: PALETTE.moss, lineHeight: 1.55, margin: 0 }}>
                  {r.ceQueSafeCorrige}
                </p>
              </div>
            </div>

            {/* Source */}
            <p style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "7px", color: PALETTE.moss2, opacity: 0.65, marginTop: "8px", borderTop: `0.5px solid ${PALETTE.lineSoft}`, paddingTop: "6px" }}>
              Source : {r.source}
            </p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
