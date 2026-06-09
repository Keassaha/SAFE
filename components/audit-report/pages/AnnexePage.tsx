import React from "react";
import { PALETTE } from "../theme";
import { PageShell } from "../PageShell";
import { Eyebrow, DisplayTitle, Em } from "../primitives";
import type { AuditReport, Variant } from "@/types/audit-report";

interface Props {
  data: AuditReport;
  variant: Variant;
}

export function AnnexePage({ data, variant }: Props) {
  const { annexe, meta } = data;

  return (
    <PageShell
      pageLabel="Annexe · Vos réponses"
      pageNum="10"
      date={meta.date}
      variant={variant}
    >
      <Eyebrow>10 · Annexe · Vos réponses</Eyebrow>
      <DisplayTitle size="lg">
        Tout ce que vous nous avez <Em>transmis.</Em>
      </DisplayTitle>

      <div style={{ height: "16px" }} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          flex: 1,
        }}
      >
        {annexe.map((section) => (
          <div key={section.numero}>
            <p
              style={{
                fontFamily: "var(--font-geist-mono, monospace)",
                fontSize: "8px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: PALETTE.gold,
                marginBottom: "6px",
              }}
            >
              {section.numero} · {section.titre}
            </p>
            <div
              style={{
                backgroundColor: "var(--cream-card)",
                border: `0.5px solid ${PALETTE.lineSoft}`,
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              {section.reponses.map((rep, j) => (
                <div
                  key={j}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "8px",
                    padding: "7px 12px",
                    borderBottom:
                      j < section.reponses.length - 1
                        ? `0.5px solid ${PALETTE.lineSoft}`
                        : "none",
                    backgroundColor: j % 2 === 0 ? "transparent" : PALETTE.sage50,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-geist-sans, sans-serif)",
                      fontSize: "9px",
                      color: PALETTE.moss2,
                      flexShrink: 0,
                      width: "130px",
                    }}
                  >
                    {rep.question}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-geist-sans, sans-serif)",
                      fontSize: "9.5px",
                      color: PALETTE.ink,
                      fontWeight: 500,
                      textAlign: "right",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "180px",
                    }}
                  >
                    {rep.reponse}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Ref bar */}
      <div
        style={{
          marginTop: "12px",
          padding: "8px 12px",
          backgroundColor: PALETTE.sage50,
          borderRadius: "6px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-geist-mono, monospace)",
            fontSize: "8px",
            letterSpacing: "0.1em",
            color: PALETTE.moss2,
          }}
        >
          Réf. {meta.ref}
        </span>
        <span
          style={{
            fontFamily: "var(--font-geist-mono, monospace)",
            fontSize: "8px",
            letterSpacing: "0.1em",
            color: PALETTE.moss2,
          }}
        >
          {meta.confidentiel ? "Document confidentiel" : ""} · {meta.date}
        </span>
      </div>
    </PageShell>
  );
}
