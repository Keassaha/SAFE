import React from "react";
import { PALETTE } from "../theme";
import { PageShell } from "../PageShell";
import { Eyebrow, DisplayTitle, Em } from "../primitives";
import { formatCAD } from "@/lib/audit-report/format";
import { TARIFICATION } from "@/lib/tarification";
import type { AuditReport, Variant } from "@/types/audit-report";

interface Props {
  data: AuditReport;
  variant: Variant;
}

export function OffrePage({ data, variant }: Props) {
  const { offre, etapes } = data;
  const { placesTotal, abonnementVie, prixRegulierBarre, rachatUnique, moisGratuits } =
    TARIFICATION.fondateurs;

  return (
    <PageShell
      pageLabel="Notre offre"
      pageNum="06"
      date={data.meta.date}
      variant={variant}
    >
      <Eyebrow>06 · Votre offre</Eyebrow>
      <DisplayTitle size="lg">
        Commencez comme <Em>cabinet fondateur.</Em>
      </DisplayTitle>

      <div style={{ height: "8px" }} />

      {/* Offre fondatrice (mise en avant) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          backgroundColor: PALETTE.forest,
          borderRadius: "10px",
          padding: "11px 16px",
          marginBottom: "14px",
          boxShadow: "0 4px 20px rgba(11,31,25,.18)",
        }}
      >
        <div style={{ maxWidth: "50%" }}>
          <p
            style={{
              fontFamily: "var(--font-geist-mono, monospace)",
              fontSize: "7.5px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: PALETTE.goldDark,
              marginBottom: "5px",
            }}
          >
            Offre fondatrice · {placesTotal} places
          </p>
          <p
            style={{
              fontFamily: "var(--font-instrument-serif, Georgia, serif)",
              fontSize: "17px",
              color: PALETTE.sage50,
              lineHeight: 1.15,
              margin: "0 0 4px",
            }}
          >
            {moisGratuits} mois gratuits, puis un tarif gelé à vie.
          </p>
          <p
            style={{
              fontFamily: "var(--font-geist-sans, sans-serif)",
              fontSize: "8.5px",
              color: PALETTE.sage,
              lineHeight: 1.45,
              margin: 0,
            }}
          >
            Réservée aux {placesTotal} premiers cabinets partenaires. Conditions non
            renouvelées une fois les places prises.
          </p>
        </div>

        <div style={{ display: "flex", gap: "14px", flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                fontFamily: "var(--font-instrument-serif, Georgia, serif)",
                fontSize: "24px",
                lineHeight: 1,
                color: PALETTE.goldDark,
                margin: "0 0 2px",
              }}
            >
              {abonnementVie} $
              <span style={{ fontSize: "10px", fontFamily: "var(--font-geist-sans, sans-serif)", color: PALETTE.sage }}> /mois</span>
            </p>
            <p style={{ fontFamily: "var(--font-geist-sans, sans-serif)", fontSize: "8px", color: PALETTE.sage }}>
              à vie, au lieu de {prixRegulierBarre} $
            </p>
          </div>
          <div style={{ borderLeft: `0.5px solid ${PALETTE.moss2}`, paddingLeft: "14px", textAlign: "right" }}>
            <p
              style={{
                fontFamily: "var(--font-instrument-serif, Georgia, serif)",
                fontSize: "24px",
                lineHeight: 1,
                color: PALETTE.sage50,
                margin: "0 0 2px",
              }}
            >
              {rachatUnique.toLocaleString("fr-CA")} $
            </p>
            <p style={{ fontFamily: "var(--font-geist-sans, sans-serif)", fontSize: "8px", color: PALETTE.sage }}>
              rachat unique, une fois
            </p>
          </div>
        </div>
      </div>

      {/* Prix réguliers */}
      <p
        style={{
          fontFamily: "var(--font-geist-mono, monospace)",
          fontSize: "7.5px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: PALETTE.moss2,
          marginBottom: "8px",
        }}
      >
        Nos prix réguliers, après la phase fondatrice
      </p>

      {/* Plans */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        {offre.plans.map((plan) => (
          <div
            key={plan.nom}
            style={{
              flex: 1,
              backgroundColor: plan.recommande ? PALETTE.forest : "var(--cream-card)",
              border: plan.recommande ? "none" : `0.5px solid ${PALETTE.lineSoft}`,
              borderRadius: "10px",
              padding: "13px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
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
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
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

      {/* Guarantees */}
      <div style={{ display: "flex", gap: "10px" }}>
        {offre.garanties.map((g, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              padding: "10px 12px",
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
      <div style={{ marginTop: "auto", paddingTop: "10px", borderTop: `0.5px solid ${PALETTE.lineSoft}` }}>
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
