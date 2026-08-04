import React from "react";
import { PALETTE, type RiskLevel } from "../theme";
import { PageShell } from "../PageShell";
import { Em, KeyFigure, GravityMeter } from "../primitives";
import { formatCAD, formatJours } from "@/lib/audit-report/format";
import type { AuditReport } from "@/types/audit-report";

interface Props {
  data: AuditReport;
  sectionNum: string;
  pageNum: string;
  total: string;
}

const LEVELS: { key: keyof AuditReport["score"]["repartition"]; label: RiskLevel }[] = [
  { key: "critique", label: "Critique" },
  { key: "eleve", label: "Élevé" },
  { key: "modere", label: "Modéré" },
  { key: "faible", label: "Faible" },
];

const INTERPRETATION: Record<string, string> = {
  "Profil sain":
    "Votre cabinet présente peu de risques critiques. Les points d'exposition identifiés sont traçables et corrigibles rapidement.",
  "Profil attentif":
    "Quelques points d'attention méritent une action dans les prochains mois pour éviter qu'ils ne s'aggravent.",
  "À corriger":
    "Plusieurs risques actifs réclament une attention soutenue. Sans action, ils peuvent affecter votre conformité et votre trésorerie.",
  "À sécuriser":
    "Des risques critiques sont identifiés. Une action rapide protège votre cabinet.",
};

export function ScorePage({ data, sectionNum, pageNum, total }: Props) {
  const { score, cout } = data;
  const totalPoints = Object.values(score.repartition).reduce((s, n) => s + n, 0);
  const ecartDelai = cout.delaiReglementDeclare - cout.delaiMoyenCanada;

  return (
    <PageShell
      eyebrow={`${sectionNum} · Ce que ça vous coûte`}
      title={
        <>
          Le diagnostic en trois <Em>chiffres.</Em>
        </>
      }
      lede="Ces trois chiffres viennent uniquement de vos réponses. Le détail du calcul est donné plus bas, sans arrondi favorable."
      pageLabel="Ce que ça vous coûte"
      pageNum={pageNum}
      total={total}
      date={data.meta.date}
    >
      {/* Bandeau des trois chiffres */}
      <div
        style={{
          backgroundColor: PALETTE.forest,
          borderRadius: "10px",
          padding: "26px 30px",
          display: "flex",
          alignItems: "flex-start",
          gap: "30px",
        }}
      >
        <div style={{ flex: 1.4 }}>
          <KeyFigure
            label="Valeur récupérable par an"
            value={formatCAD(cout.annuel)}
            sub={`soit ${formatCAD(cout.mensuel)} par mois, en valeur nette`}
            accent
            onDark
            size="lg"
          />
        </div>
        <div style={{ width: "0.5px", alignSelf: "stretch", backgroundColor: PALETTE.lineOnForest }} />
        <div style={{ flex: 1 }}>
          <KeyFigure
            label="Temps récupérable"
            value={`${cout.heuresRecuperablesSemaine} h`}
            sub="par semaine, sur vos tâches administratives"
            onDark
          />
        </div>
        <div style={{ width: "0.5px", alignSelf: "stretch", backgroundColor: PALETTE.lineOnForest }} />
        <div style={{ flex: 1 }}>
          <KeyFigure
            label="Délai de règlement"
            value={formatJours(cout.delaiReglementDeclare)}
            sub={`${ecartDelai > 0 ? `${ecartDelai} jours de plus que` : "au niveau de"} la médiane canadienne (${cout.delaiMoyenCanada} j.)`}
            onDark
          />
        </div>
      </div>

      {/* Comment on arrive au chiffre */}
      <div style={{ marginTop: "32px" }}>
        <p
          style={{
            fontFamily: "var(--font-geist-mono, monospace)",
            fontSize: "8px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: PALETTE.gold,
            margin: "0 0 12px",
          }}
        >
          Comment nous arrivons à ce montant
        </p>
        <div style={{ borderTop: `0.5px solid ${PALETTE.line}` }}>
          {[
            {
              etape: "Heures administratives déclarées",
              detail: `${cout.heuresAdminDeclarees.min} à ${cout.heuresAdminDeclarees.max} h par semaine`,
            },
            {
              etape: "Part récupérable avec SAFE",
              detail: `${Math.round(cout.tauxRecuperation * 100)} %, soit ${cout.heuresRecuperablesSemaine} h par semaine`,
            },
            {
              etape: "Taux horaire retenu",
              detail: `${formatCAD(cout.tauxHoraire)} de l'heure, milieu de la fourchette que vous avez indiquée`,
            },
            {
              etape: "Semaines facturables par an",
              detail: `${cout.semainesFacturables} semaines, vacances et jours fériés déduits`,
            },
          ].map((l) => (
            <div
              key={l.etape}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: "20px",
                padding: "11px 0",
                borderBottom: `0.5px solid ${PALETTE.lineSoft}`,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-geist-sans, sans-serif)",
                  fontSize: "11px",
                  color: PALETTE.ink,
                }}
              >
                {l.etape}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-geist-sans, sans-serif)",
                  fontSize: "10.5px",
                  color: PALETTE.inkMuted,
                  textAlign: "right",
                }}
              >
                {l.detail}
              </span>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: "20px",
              padding: "11px 0 0",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-geist-sans, sans-serif)",
                fontSize: "11px",
                color: PALETTE.ink,
                fontWeight: 600,
              }}
            >
              Valeur récupérable par an
            </span>
            <span
              style={{
                fontFamily: "var(--font-geist-mono, monospace)",
                fontSize: "12px",
                color: PALETTE.gold,
                fontWeight: 500,
              }}
            >
              {formatCAD(cout.annuel)}
            </span>
          </div>
        </div>
      </div>

      {/* Points d'exposition */}
      <div style={{ marginTop: "36px" }}>
        <p
          style={{
            fontFamily: "var(--font-geist-mono, monospace)",
            fontSize: "8px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: PALETTE.inkMuted,
            margin: "0 0 12px",
          }}
        >
          Points d'exposition identifiés · {totalPoints} au total
        </p>

        <div style={{ display: "flex", gap: "10px" }}>
          {LEVELS.map(({ key, label }) => {
            const count = score.repartition[key];
            const actif = count > 0;
            return (
              <div
                key={key}
                style={{
                  flex: 1,
                  border: `0.5px solid ${PALETTE.lineSoft}`,
                  borderRadius: "6px",
                  padding: "12px 14px",
                  backgroundColor: actif ? PALETTE.fill : "transparent",
                }}
              >
                <p style={{ margin: "0 0 8px" }}>
                  <GravityMeter niveau={label} dim={!actif} />
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-instrument-serif, Georgia, serif)",
                    fontSize: "22px",
                    lineHeight: 1,
                    color: actif ? PALETTE.ink : PALETTE.inkFaint,
                    margin: 0,
                  }}
                >
                  {count}
                </p>
              </div>
            );
          })}
        </div>

        <p
          style={{
            fontFamily: "var(--font-geist-sans, sans-serif)",
            fontSize: "11px",
            lineHeight: 1.65,
            color: PALETTE.inkBody,
            margin: "16px 0 0",
            paddingLeft: "12px",
            borderLeft: `2px solid ${PALETTE.gold}`,
          }}
        >
          <strong style={{ color: PALETTE.ink, fontWeight: 600 }}>{score.libelle}.</strong>{" "}
          {INTERPRETATION[score.libelle] ?? INTERPRETATION["Profil sain"]} Le détail de chaque
          point figure à la section suivante.
        </p>
      </div>

      <p
        style={{
          fontFamily: "var(--font-geist-mono, monospace)",
          fontSize: "7.5px",
          color: PALETTE.inkFaint,
          margin: "auto 0 0",
          paddingTop: "16px",
        }}
      >
        Médiane canadienne de délai de règlement : {cout.delaiMoyenCanadaSource}
      </p>
    </PageShell>
  );
}
