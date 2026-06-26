import React from "react";
import { PALETTE } from "../theme";
import { PageShell } from "../PageShell";
import { Eyebrow, DisplayTitle, Em, SourceTag } from "../primitives";
import { formatCAD, formatPct } from "@/lib/audit-report/format";
import { computeOffreTotaux } from "@/lib/audit-report/compute";
import type { AuditReport, Variant } from "@/types/audit-report";

interface Props {
  data: AuditReport;
  variant: Variant;
}

export function CoutPage({ data, variant }: Props) {
  const { marche, offre, cout } = data;
  const totaux = computeOffreTotaux(marche, offre.plans);

  return (
    <PageShell
      pageLabel="Le coût de résolution"
      pageNum="05"
      date={data.meta.date}
      variant={variant}
    >
      <Eyebrow>05 · Le coût de résolution</Eyebrow>
      <DisplayTitle size="lg">
        Ce que coûterait une stack <Em>comparable.</Em>
      </DisplayTitle>

      <div style={{ height: "18px" }} />

      {/* Market stack table */}
      <div style={{ marginBottom: "16px" }}>
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 80px",
            gap: "0",
            backgroundColor: PALETTE.sage50,
            borderRadius: "6px 6px 0 0",
            padding: "8px 16px",
            borderBottom: `0.5px solid ${PALETTE.lineSoft}`,
          }}
        >
          {["Composant", "Détail et source", "Mensuel"].map((h) => (
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

        {/* Rows */}
        <div
          style={{
            border: `0.5px solid ${PALETTE.lineSoft}`,
            borderTop: "none",
            borderRadius: "0 0 8px 8px",
            overflow: "hidden",
          }}
        >
          {marche.map((ligne, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 80px",
                gap: "0",
                padding: "10px 16px",
                borderBottom:
                  i < marche.length - 1
                    ? `0.5px solid ${PALETTE.lineSoft}`
                    : "none",
                backgroundColor: i % 2 === 0 ? "var(--cream-card)" : "transparent",
                alignItems: "start",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-geist-sans, sans-serif)",
                  fontSize: "10.5px",
                  color: PALETTE.ink,
                  fontWeight: 500,
                  margin: 0,
                  paddingRight: "8px",
                }}
              >
                {ligne.composant}
              </p>
              <div style={{ paddingRight: "8px" }}>
                <p
                  style={{
                    fontFamily: "var(--font-geist-sans, sans-serif)",
                    fontSize: "9.5px",
                    color: PALETTE.moss,
                    margin: "0 0 2px",
                  }}
                >
                  {ligne.detail}
                </p>
                <SourceTag>{ligne.source}</SourceTag>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-geist-mono, monospace)",
                  fontSize: "11px",
                  color: PALETTE.ink,
                  fontWeight: 500,
                  margin: 0,
                  textAlign: "right",
                }}
              >
                {formatCAD(ligne.mensuel)}
              </p>
            </div>
          ))}

          {/* Total row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 80px",
              gap: "0",
              padding: "10px 16px",
              backgroundColor: PALETTE.sage50,
              alignItems: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-geist-sans, sans-serif)",
                fontSize: "10.5px",
                fontWeight: 700,
                color: PALETTE.ink,
                margin: 0,
              }}
            >
              Total stack comparable
            </p>
            <p style={{ margin: 0 }} />
            <p
              style={{
                fontFamily: "var(--font-geist-mono, monospace)",
                fontSize: "13px",
                fontWeight: 700,
                color: PALETTE.ink,
                margin: 0,
                textAlign: "right",
              }}
            >
              {formatCAD(totaux.totalMensuel)}
            </p>
          </div>
        </div>
      </div>

      {/* SAFE vs market comparison */}
      <div
        style={{
          display: "flex",
          gap: "14px",
          marginTop: "4px",
        }}
      >
        {/* Market cost */}
        <div
          style={{
            flex: 1,
            border: `0.5px solid ${PALETTE.lineSoft}`,
            borderRadius: "8px",
            padding: "16px 18px",
            backgroundColor: "var(--cream-card)",
          }}
        >
          <p style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: PALETTE.moss2, marginBottom: "8px" }}>
            Stack comparable / mois
          </p>
          <p
            style={{
              fontFamily: "var(--font-instrument-serif, Georgia, serif)",
              fontSize: "28px",
              lineHeight: 1,
              color: PALETTE.ink,
              fontWeight: 400,
              margin: "0 0 4px",
            }}
          >
            {formatCAD(totaux.totalMensuel)}
          </p>
          <p style={{ fontFamily: "var(--font-geist-sans, sans-serif)", fontSize: "9px", color: PALETTE.moss2 }}>
            {formatCAD(totaux.totalAnnuel)} / an
          </p>
        </div>

        {/* Arrow */}
        <div style={{ display: "flex", alignItems: "center", color: PALETTE.moss2 }}>
          <span style={{ fontSize: "20px" }}>→</span>
        </div>

        {/* SAFE cost */}
        <div
          style={{
            flex: 1,
            backgroundColor: PALETTE.forest,
            borderRadius: "8px",
            padding: "16px 18px",
          }}
        >
          <p style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: PALETTE.sage, marginBottom: "8px" }}>
            SAFE / mois
          </p>
          <p
            style={{
              fontFamily: "var(--font-instrument-serif, Georgia, serif)",
              fontSize: "28px",
              lineHeight: 1,
              color: PALETTE.goldDark,
              fontWeight: 400,
              margin: "0 0 4px",
            }}
          >
            {formatCAD(totaux.prixRecommande)}
          </p>
          <p style={{ fontFamily: "var(--font-geist-sans, sans-serif)", fontSize: "9px", color: PALETTE.sage }}>
            {formatCAD(totaux.prixRecommande * 12)} / an
          </p>
        </div>

        {/* Economy */}
        <div
          style={{
            flex: 1,
            backgroundColor: PALETTE.forest2,
            borderRadius: "8px",
            padding: "16px 18px",
          }}
        >
          <p style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: PALETTE.sage, marginBottom: "8px" }}>
            Économie / mois
          </p>
          <p
            style={{
              fontFamily: "var(--font-instrument-serif, Georgia, serif)",
              fontSize: "28px",
              lineHeight: 1,
              color: PALETTE.goldDark,
              fontWeight: 400,
              margin: "0 0 4px",
            }}
          >
            {formatCAD(totaux.economieMensuelle)}
          </p>
          <p style={{ fontFamily: "var(--font-geist-sans, sans-serif)", fontSize: "9px", color: PALETTE.sage }}>
            {formatPct(totaux.reductionPct)} de réduction · {formatCAD(totaux.economieAnnuelle)} / an
          </p>
        </div>
      </div>

      {/* ROI note: recoverable value */}
      <div
        style={{
          marginTop: "14px",
          padding: "12px 16px",
          backgroundColor: PALETTE.sage50,
          borderRadius: "6px",
          borderLeft: `3px solid ${PALETTE.moss}`,
        }}
      >
        <p style={{ fontFamily: "var(--font-geist-sans, sans-serif)", fontSize: "9.5px", color: PALETTE.moss, lineHeight: 1.6, margin: 0 }}>
          En plus de l'économie sur la stack, SAFE vous aide à récupérer{" "}
          <strong>{formatCAD(cout.annuel)}</strong> par an en valeur de temps actuellement perdu{" "}
          en tâches administratives ({cout.heuresRecuperablesSemaine} h/sem. × {cout.semainesFacturables} semaines).{" "}
          <span style={{ color: PALETTE.moss2 }}>Valeur nette, taux de réalisation {cout.tauxRecuperation * 100} %, selon Clio Legal Trends 2025.</span>
        </p>
      </div>
    </PageShell>
  );
}
