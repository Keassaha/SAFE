import React from "react";
import { PALETTE } from "../theme";
import { PageShell } from "../PageShell";
import { Eyebrow, DisplayTitle, Em } from "../primitives";
import type { AuditReport, Variant } from "@/types/audit-report";

interface Props {
  data: AuditReport;
  variant: Variant;
}

export function DetailPage({ data, variant }: Props) {
  const { drivers } = data;

  return (
    <PageShell
      pageLabel="Détail du score"
      pageNum="03"
      date={data.meta.date}
      variant={variant}
    >
      <Eyebrow>03 · Détail du score</Eyebrow>
      <DisplayTitle size="lg">
        Ce qui a influencé votre <Em>diagnostic.</Em>
      </DisplayTitle>

      <div style={{ height: "4px" }} />
      <p
        style={{
          fontFamily: "var(--font-geist-sans, sans-serif)",
          fontSize: "10.5px",
          color: PALETTE.moss,
          lineHeight: 1.65,
          maxWidth: "520px",
          marginBottom: "24px",
        }}
      >
        Chacun de ces facteurs a été retenu parce qu'il correspond à une réponse que vous avez donnée et à un écart mesurable par rapport aux normes de cabinet.
      </p>

      {/* Driver cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "14px",
          flex: 1,
        }}
      >
        {drivers.map((driver, i) => (
          <div
            key={i}
            style={{
              backgroundColor: "var(--cream-card)",
              border: `0.5px solid ${PALETTE.lineSoft}`,
              borderRadius: "10px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              boxShadow: "var(--card-shadow)",
            }}
          >
            {/* Top row: number + tag */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span
                style={{
                  fontFamily: "var(--font-geist-mono, monospace)",
                  fontSize: "11px",
                  color: PALETTE.sage200,
                  fontWeight: 400,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                style={{
                  backgroundColor: "var(--cream-deep)",
                  color: PALETTE.moss2,
                  fontFamily: "var(--font-geist-mono, monospace)",
                  fontSize: "7.5px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  padding: "3px 8px",
                  borderRadius: "4px",
                }}
              >
                {driver.note}
              </span>
            </div>

            {/* Label */}
            <p
              style={{
                fontFamily: "var(--font-geist-sans, sans-serif)",
                fontSize: "12px",
                fontWeight: 500,
                color: PALETTE.ink,
                lineHeight: 1.45,
                margin: 0,
                flex: 1,
              }}
            >
              {driver.label}
            </p>

            {/* Value */}
            <p
              style={{
                fontFamily: "var(--font-instrument-serif, Georgia, serif)",
                fontSize: "22px",
                color: PALETTE.forest2,
                fontStyle: "italic",
                margin: 0,
                lineHeight: 1,
              }}
            >
              {driver.valeur}
            </p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
