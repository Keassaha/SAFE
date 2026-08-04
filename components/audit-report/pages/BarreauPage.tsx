import React from "react";
import { PALETTE } from "../theme";
import { PageShell } from "../PageShell";
import { Em, StatusPill } from "../primitives";
import type { AuditReport } from "@/types/audit-report";

interface Props {
  data: AuditReport;
  sectionNum: string;
  pageNum: string;
  total: string;
}

export function BarreauPage({ data, sectionNum, pageNum, total }: Props) {
  const { barreau, barreauDisclaimer } = data;
  const aSurveiller = barreau.filter((b) => b.statut === "À surveiller").length;

  return (
    <PageShell
      eyebrow={`${sectionNum} · Vos obligations`}
      title={
        <>
          Ce que votre Barreau exige, et où vous en <Em>êtes.</Em>
        </>
      }
      lede={
        aSurveiller > 0
          ? `Sur ${barreau.length} obligations retenues pour votre profil, ${aSurveiller} demande une vigilance particulière. Les autres sont couvertes par SAFE dès la mise en route.`
          : `Les ${barreau.length} obligations retenues pour votre profil sont couvertes par SAFE dès la mise en route.`
      }
      pageLabel="Vos obligations"
      pageNum={pageNum}
      total={total}
      date={data.meta.date}
    >
      {/* Entête de tableau */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 128px",
          gap: "16px",
          padding: "0 0 8px",
          borderBottom: `0.5px solid ${PALETTE.line}`,
        }}
      >
        {["Obligation", "Statut"].map((h) => (
          <p
            key={h}
            style={{
              fontFamily: "var(--font-geist-mono, monospace)",
              fontSize: "7.5px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: PALETTE.inkMuted,
              margin: 0,
              fontWeight: 500,
            }}
          >
            {h}
          </p>
        ))}
      </div>

      {/* Lignes */}
      <div>
        {barreau.map((item, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 128px",
              gap: "16px",
              padding: "19px 0",
              borderBottom: `0.5px solid ${PALETTE.lineSoft}`,
              alignItems: "start",
            }}
          >
            <div style={{ paddingRight: "20px" }}>
              <p
                style={{
                  fontFamily: "var(--font-geist-sans, sans-serif)",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  color: PALETTE.ink,
                  margin: "0 0 4px",
                  lineHeight: 1.35,
                }}
              >
                {item.sujet}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-geist-sans, sans-serif)",
                  fontSize: "10.5px",
                  color: PALETTE.inkBody,
                  lineHeight: 1.6,
                  margin: "0 0 5px",
                }}
              >
                {item.description}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-geist-mono, monospace)",
                  fontSize: "8px",
                  color: PALETTE.inkFaint,
                  letterSpacing: "0.04em",
                  margin: 0,
                }}
              >
                {item.reference}
              </p>
            </div>

            <div style={{ paddingTop: "2px" }}>
              <StatusPill statut={item.statut} />
            </div>
          </div>
        ))}
      </div>

      {/* Avertissement */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: "16px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-geist-sans, sans-serif)",
            fontSize: "9px",
            color: PALETTE.inkMuted,
            lineHeight: 1.65,
            margin: 0,
            paddingLeft: "12px",
            borderLeft: `2px solid ${PALETTE.lineSoft}`,
          }}
        >
          {barreauDisclaimer}
        </p>
      </div>
    </PageShell>
  );
}
