import React from "react";
import { PALETTE } from "../theme";
import { PageShell } from "../PageShell";
import { Eyebrow, DisplayTitle, Em } from "../primitives";
import type { AuditReport, Variant } from "@/types/audit-report";

interface Props {
  data: AuditReport;
  variant: Variant;
}

const ICONS = ["→", "↑", "✓", "◎"];

export function OpportunitesPage({ data, variant }: Props) {
  const { opportunites } = data;

  return (
    <PageShell
      pageLabel="Vos opportunités"
      pageNum="06"
      date={data.meta.date}
      variant={variant}
    >
      <Eyebrow>06 · Vos opportunités</Eyebrow>
      <DisplayTitle size="lg">
        Ce que SAFE règle <Em>pour vous.</Em>
      </DisplayTitle>

      <div style={{ height: "8px" }} />
      <p
        style={{
          fontFamily: "var(--font-geist-sans, sans-serif)",
          fontSize: "10.5px",
          color: PALETTE.moss,
          lineHeight: 1.65,
          marginBottom: "24px",
          maxWidth: "520px",
        }}
      >
        Ces opportunités sont activées par vos réponses, pas par un catalogue générique. Chacune correspond à un point d'exposition identifié dans votre diagnostic.
      </p>

      {/* 2×2 grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          flex: 1,
        }}
      >
        {opportunites.slice(0, 4).map((opp, i) => (
          <div
            key={i}
            style={{
              backgroundColor: i % 2 === 1 ? PALETTE.forest2 : "var(--cream-card)",
              border:
                i % 2 === 1
                  ? "none"
                  : `0.5px solid ${PALETTE.lineSoft}`,
              borderRadius: "10px",
              padding: "22px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              boxShadow: i % 2 === 0 ? "var(--card-shadow)" : "none",
            }}
          >
            {/* Icon */}
            <span
              style={{
                fontFamily: "var(--font-geist-mono, monospace)",
                fontSize: "18px",
                color: i % 2 === 1 ? PALETTE.goldDark : PALETTE.gold,
                lineHeight: 1,
              }}
            >
              {ICONS[i]}
            </span>

            {/* Title */}
            <p
              style={{
                fontFamily: "var(--font-geist-sans, sans-serif)",
                fontSize: "13px",
                fontWeight: 600,
                color: i % 2 === 1 ? PALETTE.sage50 : PALETTE.ink,
                margin: 0,
                lineHeight: 1.35,
              }}
            >
              {opp.titre}
            </p>

            {/* Description */}
            <p
              style={{
                fontFamily: "var(--font-geist-sans, sans-serif)",
                fontSize: "10px",
                color: i % 2 === 1 ? PALETTE.sage : PALETTE.moss,
                lineHeight: 1.65,
                margin: 0,
                flex: 1,
              }}
            >
              {opp.description}
            </p>

            {/* Sequence indicator */}
            <span
              style={{
                fontFamily: "var(--font-geist-mono, monospace)",
                fontSize: "8px",
                letterSpacing: "0.18em",
                color: i % 2 === 1 ? PALETTE.sage : PALETTE.moss2,
                textTransform: "uppercase",
                opacity: 0.7,
              }}
            >
              Opportunité {String(i + 1).padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
