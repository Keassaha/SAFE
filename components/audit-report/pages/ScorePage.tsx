import React from "react";
import { PALETTE, SCORE_COLORS, RISK_COLORS, type RiskLevel } from "../theme";
import { PageShell } from "../PageShell";
import { Eyebrow, DisplayTitle, Em, HalfGauge, MonoLabel } from "../primitives";
import { formatCAD, formatJours } from "@/lib/audit-report/format";
import type { AuditReport, Variant } from "@/types/audit-report";

interface Props {
  data: AuditReport;
  variant: Variant;
}

const LEVELS: { key: keyof AuditReport["score"]["repartition"]; label: RiskLevel }[] = [
  { key: "critique", label: "Critique" },
  { key: "eleve",    label: "Élevé" },
  { key: "modere",   label: "Modéré" },
  { key: "faible",   label: "Faible" },
];

export function ScorePage({ data, variant }: Props) {
  const { score, cout } = data;
  const colors = SCORE_COLORS[score.libelle] ?? SCORE_COLORS["Profil sain"];
  const total = Object.values(score.repartition).reduce((s, n) => s + n, 0);
  const annuel = cout.annuel;
  const delai = cout.delaiReglementDeclare;

  return (
    <PageShell
      pageLabel="Score général"
      pageNum="02"
      date={data.meta.date}
      variant={variant}
    >
      <Eyebrow>02 · Score général</Eyebrow>
      <DisplayTitle size="lg">
        Votre diagnostic en un coup <Em>d'oeil.</Em>
      </DisplayTitle>

      <div style={{ height: "20px" }} />

      <div style={{ display: "flex", gap: "24px", flex: 1 }}>
        {/* Left column: gauge + distribution */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Gauge */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
            <HalfGauge value={score.valeur} arcColor={colors.arc} />
            <p
              style={{
                fontFamily: "var(--font-instrument-serif, Georgia, serif)",
                fontSize: "15px",
                fontStyle: "italic",
                color: colors.arc,
                margin: 0,
              }}
            >
              {score.libelle}
            </p>
            <p
              style={{
                fontFamily: "var(--font-geist-sans, sans-serif)",
                fontSize: "9px",
                color: PALETTE.moss2,
                margin: 0,
              }}
            >
              {total} point{total !== 1 ? "s" : ""} d'exposition identifié{total !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Distribution bars */}
          <div>
            <p style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: PALETTE.moss2, marginBottom: "12px" }}>
              Répartition des risques
            </p>
            {LEVELS.map(({ key, label }) => {
              const count = score.repartition[key];
              const c = RISK_COLORS[label];
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-geist-sans, sans-serif)",
                      fontSize: "10px",
                      color: c.text,
                      width: "62px",
                      flexShrink: 0,
                    }}
                  >
                    {label}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: "6px",
                      backgroundColor: PALETTE.sage100,
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        backgroundColor: c.dot,
                        borderRadius: "3px",
                        minWidth: count > 0 ? "6px" : "0",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono, monospace)",
                      fontSize: "10px",
                      color: c.text,
                      width: "16px",
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Interpretation */}
          <div
            style={{
              backgroundColor: "var(--cream-card)",
              border: `0.5px solid ${PALETTE.lineSoft}`,
              borderRadius: "8px",
              padding: "14px 16px",
            }}
          >
            <p style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: PALETTE.moss2, marginBottom: "6px" }}>
              Ce que ça signifie
            </p>
            <p style={{ fontFamily: "var(--font-geist-sans, sans-serif)", fontSize: "10px", color: PALETTE.moss, lineHeight: 1.6 }}>
              {score.libelle === "Profil sain"
                ? "Votre cabinet présente peu de risques critiques. Les points d'exposition identifiés sont traçables et corrigibles rapidement."
                : score.libelle === "Profil attentif"
                ? "Quelques points d'attention méritent une action dans les prochains mois pour éviter qu'ils ne s'aggravent."
                : score.libelle === "À corriger"
                ? "Plusieurs risques actifs réclament une attention soutenue. Sans action, ils peuvent affecter votre conformité et votre trésorerie."
                : "Des risques critiques sont identifiés. Une action rapide est recommandée pour protéger votre cabinet."}
            </p>
          </div>
        </div>

        {/* Right column: dark card with cost */}
        <div
          style={{
            width: "220px",
            backgroundColor: PALETTE.forest,
            borderRadius: "10px",
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            flexShrink: 0,
          }}
        >
          <div>
            <MonoLabel dark small>Valeur récupérable</MonoLabel>
            <p style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "8px", letterSpacing: "0.1em", textTransform: "uppercase", color: PALETTE.sage, opacity: 0.7, marginTop: "2px", marginBottom: "8px" }}>
              valeur nette estimée
            </p>
            <p
              style={{
                fontFamily: "var(--font-instrument-serif, Georgia, serif)",
                fontSize: "34px",
                lineHeight: 1,
                color: PALETTE.goldDark,
                fontWeight: 400,
                margin: 0,
              }}
            >
              {formatCAD(annuel)}
            </p>
            <p style={{ fontFamily: "var(--font-geist-sans, sans-serif)", fontSize: "9.5px", color: PALETTE.sage, marginTop: "4px" }}>
              par an · {formatCAD(cout.mensuel)} / mois
            </p>
          </div>

          <div style={{ borderTop: `0.5px solid rgba(169,194,178,.15)`, paddingTop: "16px" }}>
            <MonoLabel dark small>Délai de règlement déclaré</MonoLabel>
            <p
              style={{
                fontFamily: "var(--font-instrument-serif, Georgia, serif)",
                fontSize: "28px",
                lineHeight: 1,
                color: PALETTE.sage50,
                fontWeight: 400,
                margin: "6px 0 2px",
              }}
            >
              {formatJours(delai)}
            </p>
            <p style={{ fontFamily: "var(--font-geist-sans, sans-serif)", fontSize: "9px", color: PALETTE.sage }}>
              vs {cout.delaiMoyenCanada} j. médiane CA
            </p>
            <p style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "7px", color: PALETTE.moss2, marginTop: "4px" }}>
              {cout.delaiMoyenCanadaSource}
            </p>
          </div>

          <div style={{ borderTop: `0.5px solid rgba(169,194,178,.15)`, paddingTop: "16px" }}>
            <MonoLabel dark small>Heures récupérables</MonoLabel>
            <p
              style={{
                fontFamily: "var(--font-instrument-serif, Georgia, serif)",
                fontSize: "28px",
                lineHeight: 1,
                color: PALETTE.sage50,
                fontWeight: 400,
                margin: "6px 0 2px",
              }}
            >
              {cout.heuresRecuperablesSemaine} h
            </p>
            <p style={{ fontFamily: "var(--font-geist-sans, sans-serif)", fontSize: "9px", color: PALETTE.sage }}>
              par semaine avec SAFE
            </p>
            <p style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "7px", color: PALETTE.moss2, marginTop: "4px" }}>
              {cout.tauxRecuperation * 100} % des heures admin
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
