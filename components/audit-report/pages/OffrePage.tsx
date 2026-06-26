import React from "react";
import { PALETTE } from "../theme";
import { PageShell } from "../PageShell";
import { Eyebrow, DisplayTitle, Em } from "../primitives";
import { formatCAD } from "@/lib/audit-report/format";
import type { AuditReport, Variant } from "@/types/audit-report";

interface Props {
  data: AuditReport;
  variant: Variant;
}

export function OffrePage({ data, variant }: Props) {
  const { offre, etapes } = data;

  return (
    <PageShell
      pageLabel="Notre offre"
      pageNum="06"
      date={data.meta.date}
      variant={variant}
    >
      <Eyebrow>06 · Notre offre</Eyebrow>
      <DisplayTitle size="lg">
        Moins cher qu'une heure de votre <Em>temps.</Em>
      </DisplayTitle>

      <div style={{ height: "16px" }} />

      {/* Plans */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        {offre.plans.map((plan) => (
          <div
            key={plan.nom}
            style={{
              flex: 1,
              backgroundColor: plan.recommande ? PALETTE.forest : "var(--cream-card)",
              border: plan.recommande ? "none" : `0.5px solid ${PALETTE.lineSoft}`,
              borderRadius: "10px",
              padding: "18px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              position: "relative",
              boxShadow: plan.recommande
                ? "0 4px 20px rgba(11,31,25,.18)"
                : "var(--card-shadow)",
            }}
          >
            {plan.recommande && (
              <div
                style={{
                  position: "absolute",
                  top: "-10px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: PALETTE.goldDark,
                  color: PALETTE.forest,
                  fontFamily: "var(--font-geist-mono, monospace)",
                  fontSize: "7.5px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: "20px",
                  whiteSpace: "nowrap",
                }}
              >
                Recommandé
              </div>
            )}

            {/* Plan name */}
            <div>
              <p
                style={{
                  fontFamily: "var(--font-geist-mono, monospace)",
                  fontSize: "8px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: plan.recommande ? PALETTE.sage : PALETTE.moss2,
                  marginBottom: "4px",
                }}
              >
                SAFE
              </p>
              <p
                style={{
                  fontFamily: "var(--font-instrument-serif, Georgia, serif)",
                  fontSize: "20px",
                  color: plan.recommande ? PALETTE.sage50 : PALETTE.ink,
                  fontWeight: 400,
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                {plan.nom}
              </p>
            </div>

            {/* Price */}
            <div>
              {plan.prix !== null ? (
                <>
                  <p
                    style={{
                      fontFamily: "var(--font-instrument-serif, Georgia, serif)",
                      fontSize: "30px",
                      lineHeight: 1,
                      color: plan.recommande ? PALETTE.goldDark : PALETTE.ink,
                      fontWeight: 400,
                      margin: "0 0 2px",
                    }}
                  >
                    {formatCAD(plan.prix)}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-geist-sans, sans-serif)",
                      fontSize: "9px",
                      color: plan.recommande ? PALETTE.sage : PALETTE.moss2,
                    }}
                  >
                    {plan.periode}
                  </p>
                </>
              ) : (
                <p
                  style={{
                    fontFamily: "var(--font-instrument-serif, Georgia, serif)",
                    fontSize: "22px",
                    fontStyle: "italic",
                    color: plan.recommande ? PALETTE.goldDark : PALETTE.forest2,
                    margin: 0,
                  }}
                >
                  Sur mesure
                </p>
              )}
            </div>

            {/* Description */}
            <p
              style={{
                fontFamily: "var(--font-geist-sans, sans-serif)",
                fontSize: "9px",
                color: plan.recommande ? PALETTE.sage : PALETTE.moss,
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              {plan.description}
            </p>

            {/* Features */}
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
              {plan.features.map((f, j) => (
                <li
                  key={j}
                  style={{
                    display: "flex",
                    gap: "6px",
                    alignItems: "flex-start",
                    fontFamily: "var(--font-geist-sans, sans-serif)",
                    fontSize: "9px",
                    color: plan.recommande ? PALETTE.sage : PALETTE.moss,
                    lineHeight: 1.45,
                  }}
                >
                  <span style={{ color: plan.recommande ? PALETTE.goldDark : PALETTE.gold, flexShrink: 0, marginTop: "1px" }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Pourquoi ce plan */}
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: PALETTE.sage50,
          borderRadius: "6px",
          borderLeft: `3px solid ${PALETTE.gold}`,
          marginBottom: "16px",
        }}
      >
        <p style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: PALETTE.gold, marginBottom: "5px" }}>
          Pourquoi ce plan
        </p>
        <p style={{ fontFamily: "var(--font-geist-sans, sans-serif)", fontSize: "9.5px", color: PALETTE.moss, lineHeight: 1.6, margin: 0 }}>
          {offre.pourquoi}
        </p>
      </div>

      {/* Guarantees */}
      <div style={{ display: "flex", gap: "10px" }}>
        {offre.garanties.map((g, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              padding: "12px 14px",
              backgroundColor: "var(--cream-card)",
              border: `0.5px solid ${PALETTE.lineSoft}`,
              borderRadius: "6px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-geist-sans, sans-serif)",
                fontSize: "9.5px",
                fontWeight: 600,
                color: PALETTE.ink,
                marginBottom: "4px",
              }}
            >
              {g.titre}
            </p>
            <p style={{ fontFamily: "var(--font-geist-sans, sans-serif)", fontSize: "9px", color: PALETTE.moss, lineHeight: 1.5, margin: 0 }}>
              {g.detail}
            </p>
          </div>
        ))}
      </div>

      {/* Prochaines étapes (bande compacte de clôture) */}
      <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: `0.5px solid ${PALETTE.lineSoft}` }}>
        <p style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: PALETTE.gold, marginBottom: "12px" }}>
          Prochaines étapes
        </p>
        <div style={{ display: "flex", gap: "16px" }}>
          {etapes.map((etape, i) => (
            <div key={i} style={{ flex: 1, display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span
                style={{
                  fontFamily: "var(--font-instrument-serif, Georgia, serif)",
                  fontSize: "18px",
                  color: PALETTE.sage,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <div>
                <p style={{ fontFamily: "var(--font-geist-sans, sans-serif)", fontSize: "9.5px", fontWeight: 600, color: PALETTE.ink, margin: "0 0 3px" }}>
                  {etape.titre}
                </p>
                <p style={{ fontFamily: "var(--font-geist-sans, sans-serif)", fontSize: "8.5px", color: PALETTE.moss, lineHeight: 1.5, margin: 0 }}>
                  {etape.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
