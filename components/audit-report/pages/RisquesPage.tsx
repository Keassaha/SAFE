import React from "react";
import { PALETTE } from "../theme";
import { PageShell } from "../PageShell";
import { Em, GravityMeter, SourceTag } from "../primitives";
import type { AuditReport } from "@/types/audit-report";

interface Props {
  data: AuditReport;
  /** Sous-ensemble de risques rendu sur cette page. */
  risques: AuditReport["risques"];
  /** Rang du premier risque de la page, pour une numérotation continue. */
  offset: number;
  /** Numéro de la page de risques, quand ils débordent sur plusieurs pages. */
  part?: { index: number; count: number };
  sectionNum: string;
  pageNum: string;
  total: string;
}

function Colonne({ titre, texte, accent = false }: { titre: string; texte: string; accent?: boolean }) {
  return (
    <div>
      <p
        style={{
          fontFamily: "var(--font-geist-mono, monospace)",
          fontSize: "7.5px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: accent ? PALETTE.gold : PALETTE.inkMuted,
          margin: "0 0 5px",
        }}
      >
        {titre}
      </p>
      <p
        style={{
          fontFamily: "var(--font-geist-sans, sans-serif)",
          fontSize: "10.5px",
          color: PALETTE.inkBody,
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {texte}
      </p>
    </div>
  );
}

export function RisquesPage({ data, risques, offset, part, sectionNum, pageNum, total }: Props) {
  const suite = part && part.index > 1;

  return (
    <PageShell
      eyebrow={`${sectionNum} · Points d'exposition${
        part && part.count > 1 ? ` (${part.index} sur ${part.count})` : ""
      }`}
      title={
        suite ? (
          <>
            Points d'exposition, <Em>suite.</Em>
          </>
        ) : (
          <>
            Ce qui vous expose, et ce qui le <Em>corrige.</Em>
          </>
        )
      }
      lede={
        suite
          ? undefined
          : "Les points sont classés du plus grave au moins grave. Pour chacun : ce que vos réponses montrent, ce que ça produit, et ce que SAFE change."
      }
      pageLabel="Points d'exposition"
      pageNum={pageNum}
      total={total}
      date={data.meta.date}
    >
      {/* Les points se répartissent sur la hauteur : une page de suite qui porte
          deux points ne les laisse pas tassés en haut. */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          justifyContent: "space-between",
        }}
      >
        {risques.map((r, i) => (
          <div key={i}>
            {/* Titre + gravité */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: "16px",
                paddingBottom: "9px",
                borderBottom: `0.5px solid ${PALETTE.line}`,
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-geist-sans, sans-serif)",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: PALETTE.ink,
                  margin: 0,
                  lineHeight: 1.3,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-geist-mono, monospace)",
                    fontSize: "10px",
                    color: PALETTE.inkFaint,
                    marginRight: "10px",
                    fontWeight: 400,
                  }}
                >
                  {String(offset + i + 1).padStart(2, "0")}
                </span>
                {r.titre}
              </p>
              <GravityMeter niveau={r.niveau} />
            </div>

            {/* Constat et impact à gauche, correction à droite */}
            <div style={{ display: "flex", gap: "24px", marginTop: "11px", alignItems: "stretch" }}>
              <div style={{ flex: 1.25, display: "flex", flexDirection: "column", gap: "10px" }}>
                <Colonne titre="Ce que vos réponses montrent" texte={r.ceQueMontrent} />
                <Colonne titre="Ce que ça produit" texte={r.impact} />
              </div>

              <div
                style={{
                  flex: 1,
                  backgroundColor: PALETTE.fill,
                  borderLeft: `2px solid ${PALETTE.gold}`,
                  borderRadius: "0 4px 4px 0",
                  padding: "11px 14px",
                }}
              >
                <Colonne titre="Ce que SAFE corrige" texte={r.ceQueSafeCorrige} accent />
              </div>
            </div>

            <p style={{ margin: "8px 0 0" }}>
              <SourceTag>Source : {r.source}</SourceTag>
            </p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
