import React from "react";
import { PALETTE } from "../theme";
import { PageShell } from "../PageShell";
import { Em, KeyFigure } from "../primitives";
import { formatCAD } from "@/lib/audit-report/format";
import { TARIFICATION } from "@/lib/tarification";
import type { AuditReport } from "@/types/audit-report";

interface Props {
  data: AuditReport;
  sectionNum: string;
  pageNum: string;
  total: string;
}

export function OffrePage({ data, sectionNum, pageNum, total }: Props) {
  const { offre, etapes } = data;
  const {
    placesTotal,
    dureeMois,
    premiereAnneeSolo,
    premiereAnneeCabinet,
    apresSolo,
    apresCabinet,
    garantieJours,
  } = TARIFICATION.fondateurs;

  const planRecommande = offre.plans.find((p) => p.recommande) ?? offre.plans[0];
  const estSolo = planRecommande.nom === "Solo";
  const prixFondateur = estSolo ? premiereAnneeSolo : premiereAnneeCabinet;
  const prixGele = estSolo ? apresSolo : apresCabinet;
  const autresPlans = offre.plans.filter((p) => p.nom !== planRecommande.nom);

  return (
    <PageShell
      eyebrow={`${sectionNum} · Votre offre`}
      title={
        <>
          Commencez comme <Em>cabinet fondateur.</Em>
        </>
      }
      lede={`Votre profil correspond au palier ${planRecommande.nom}. Voici ce qu'il vous coûte, ce qu'il contient, et ce qui se passe si ça ne vous convient pas.`}
      pageLabel="Votre offre"
      pageNum={pageNum}
      total={total}
      date={data.meta.date}
    >
      {/* Le prix, une seule fois, sans ambiguïté */}
      <div
        style={{
          backgroundColor: PALETTE.forest,
          borderRadius: "10px",
          padding: "24px 30px",
          display: "flex",
          alignItems: "flex-start",
          gap: "30px",
        }}
      >
        <div style={{ flex: 1 }}>
          <KeyFigure
            label={`SAFE ${planRecommande.nom} · tarif fondateur`}
            value={`${formatCAD(prixFondateur)} / mois`}
            sub={`pendant ${dureeMois} mois, puis ${formatCAD(prixGele)} par mois, gelé aussi longtemps que vous restez`}
            accent
            onDark
            size="lg"
          />
        </div>
        <div style={{ width: "0.5px", alignSelf: "stretch", backgroundColor: PALETTE.lineOnForest }} />
        <div style={{ flex: 0.9 }}>
          <p style={{ margin: 0 }}>
            <span
              style={{
                fontFamily: "var(--font-geist-mono, monospace)",
                fontSize: "8px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: PALETTE.goldOnForest,
                fontWeight: 500,
              }}
            >
              Offre fondatrice · {placesTotal} places
            </span>
          </p>
          <p
            style={{
              fontFamily: "var(--font-geist-sans, sans-serif)",
              fontSize: "10.5px",
              lineHeight: 1.6,
              color: PALETTE.onForestMuted,
              margin: "10px 0 0",
            }}
          >
            Réservée aux {placesTotal} premiers cabinets partenaires. La mise en route est faite
            par nous. Aucun engagement de durée, vous partez avec vos données. Ces conditions ne
            sont pas reconduites une fois les places prises.
          </p>
        </div>
      </div>

      {/* Ce qui est inclus */}
      <div style={{ marginTop: "26px" }}>
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
          Ce qui est inclus
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: "32px",
            rowGap: "0",
            borderTop: `0.5px solid ${PALETTE.line}`,
          }}
        >
          {planRecommande.features.map((f, i) => (
            <p
              key={i}
              style={{
                fontFamily: "var(--font-geist-sans, sans-serif)",
                fontSize: "11px",
                color: PALETTE.inkBody,
                lineHeight: 1.45,
                margin: 0,
                padding: "9px 0",
                borderBottom: `0.5px solid ${PALETTE.lineSoft}`,
              }}
            >
              {f}
            </p>
          ))}
        </div>
      </div>

      {/* Garanties */}
      <div style={{ marginTop: "24px", display: "flex", gap: "26px" }}>
        {offre.garanties.map((g, i) => (
          <div key={i} style={{ flex: 1, borderTop: `2px solid ${PALETTE.gold}`, paddingTop: "10px" }}>
            <p
              style={{
                fontFamily: "var(--font-geist-sans, sans-serif)",
                fontSize: "11px",
                fontWeight: 600,
                color: PALETTE.ink,
                margin: "0 0 4px",
              }}
            >
              {g.titre}
            </p>
            <p
              style={{
                fontFamily: "var(--font-geist-sans, sans-serif)",
                fontSize: "10px",
                color: PALETTE.inkBody,
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              {g.detail}
            </p>
          </div>
        ))}
      </div>

      {/* Prix réguliers, en note : un fondateur ne les paie jamais */}
      <p
        style={{
          fontFamily: "var(--font-geist-sans, sans-serif)",
          fontSize: "9.5px",
          color: PALETTE.inkMuted,
          lineHeight: 1.6,
          margin: "22px 0 0",
        }}
      >
        Pour information, nos prix réguliers hors phase fondatrice :{" "}
        {[planRecommande, ...autresPlans]
          .map((p) => `${p.nom} ${p.prix !== null ? `${formatCAD(p.prix)} par mois` : "sur mesure"}`)
          .join(", ")}
        . Votre tarif fondateur reste gelé sous ces prix, et la garantie de remboursement court{" "}
        {garantieJours} jours.
      </p>

      {/* Prochaines étapes */}
      <div style={{ marginTop: "auto", paddingTop: "22px", borderTop: `0.5px solid ${PALETTE.line}` }}>
        <p
          style={{
            fontFamily: "var(--font-geist-mono, monospace)",
            fontSize: "8px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: PALETTE.gold,
            margin: "0 0 14px",
          }}
        >
          Prochaines étapes
        </p>
        <div style={{ display: "flex", gap: "24px" }}>
          {etapes.map((etape, i) => (
            <div key={i} style={{ flex: 1, display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <span
                style={{
                  fontFamily: "var(--font-instrument-serif, Georgia, serif)",
                  fontSize: "17px",
                  color: PALETTE.gold,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-geist-sans, sans-serif)",
                    fontSize: "10.5px",
                    fontWeight: 600,
                    color: PALETTE.ink,
                    margin: "0 0 4px",
                  }}
                >
                  {etape.titre}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-geist-sans, sans-serif)",
                    fontSize: "9.5px",
                    color: PALETTE.inkBody,
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
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
