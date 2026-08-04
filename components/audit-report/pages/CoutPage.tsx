import React from "react";
import { PALETTE } from "../theme";
import { PageShell } from "../PageShell";
import { Em, KeyFigure, SourceTag } from "../primitives";
import { formatCAD } from "@/lib/audit-report/format";
import { computeMarcheTotaux } from "@/lib/audit-report/compute";
import { TARIFICATION } from "@/lib/tarification";
import type { AuditReport } from "@/types/audit-report";

interface Props {
  data: AuditReport;
  sectionNum: string;
  pageNum: string;
  total: string;
}

export function CoutPage({ data, sectionNum, pageNum, total }: Props) {
  const { marche, offre, cout } = data;
  const { totalMensuel } = computeMarcheTotaux(marche);

  // Le prix comparé est celui que le cabinet paiera réellement, c'est-à-dire le
  // tarif fondateur de son palier, pas le tarif régulier affiché plus loin.
  const planRecommande = offre.plans.find((p) => p.recommande);
  const estSolo = (planRecommande?.nom ?? "Solo") === "Solo";
  const { premiereAnneeSolo, premiereAnneeCabinet, apresSolo, apresCabinet, dureeMois } =
    TARIFICATION.fondateurs;
  const prixSafe = estSolo ? premiereAnneeSolo : premiereAnneeCabinet;
  const prixGele = estSolo ? apresSolo : apresCabinet;

  const economieMensuelle = totalMensuel - prixSafe;
  const economieAnnuelle = economieMensuelle * 12;
  const reductionPct = Math.round((economieMensuelle / totalMensuel) * 100);

  return (
    <PageShell
      eyebrow={`${sectionNum} · Le coût de la solution`}
      title={
        <>
          Ce que coûterait une stack <Em>comparable.</Em>
        </>
      }
      lede="Voici ce qu'il faudrait assembler ailleurs pour couvrir les mêmes besoins, aux prix publics de 2026. Les montants sont mensuels, en dollars canadiens."
      pageLabel="Le coût de la solution"
      pageNum={pageNum}
      total={total}
      date={data.meta.date}
    >
      {/* Tableau de la stack */}
      <div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 90px",
            gap: "16px",
            paddingBottom: "8px",
            borderBottom: `0.5px solid ${PALETTE.line}`,
          }}
        >
          <p
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
            Composant
          </p>
          <p
            style={{
              fontFamily: "var(--font-geist-mono, monospace)",
              fontSize: "7.5px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: PALETTE.inkMuted,
              margin: 0,
              fontWeight: 500,
              textAlign: "right",
            }}
          >
            Par mois
          </p>
        </div>

        {marche.map((ligne, i) => {
          // La source n'est affichée que si elle apporte autre chose que le détail.
          const sourceUtile =
            ligne.source && ligne.source.trim() !== ligne.detail.trim() ? ligne.source : null;
          return (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 90px",
                gap: "16px",
                padding: "11px 0",
                borderBottom: `0.5px solid ${PALETTE.lineSoft}`,
                alignItems: "baseline",
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-geist-sans, sans-serif)",
                    fontSize: "11.5px",
                    color: PALETTE.ink,
                    fontWeight: 500,
                    margin: "0 0 2px",
                  }}
                >
                  {ligne.composant}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-geist-sans, sans-serif)",
                    fontSize: "10.5px",
                    color: PALETTE.inkBody,
                    margin: 0,
                  }}
                >
                  {ligne.detail}
                </p>
                {sourceUtile && (
                  <p style={{ margin: "3px 0 0" }}>
                    <SourceTag>{sourceUtile}</SourceTag>
                  </p>
                )}
              </div>
              <p
                style={{
                  fontFamily: "var(--font-geist-mono, monospace)",
                  fontSize: "12px",
                  color: PALETTE.ink,
                  margin: 0,
                  textAlign: "right",
                }}
              >
                {formatCAD(ligne.mensuel)}
              </p>
            </div>
          );
        })}

        {/* Total */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 90px",
            gap: "16px",
            padding: "12px 0 0",
            alignItems: "baseline",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-geist-sans, sans-serif)",
              fontSize: "11.5px",
              fontWeight: 600,
              color: PALETTE.ink,
              margin: 0,
            }}
          >
            Total d'une stack comparable
          </p>
          <p
            style={{
              fontFamily: "var(--font-geist-mono, monospace)",
              fontSize: "14px",
              fontWeight: 500,
              color: PALETTE.ink,
              margin: 0,
              textAlign: "right",
            }}
          >
            {formatCAD(totalMensuel)}
          </p>
        </div>
      </div>

      {/* Comparaison */}
      <div
        style={{
          marginTop: "26px",
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
            label="Stack comparable"
            value={`${formatCAD(totalMensuel)}`}
            sub={`${formatCAD(totalMensuel * 12)} par an`}
            onDark
          />
        </div>
        <div style={{ width: "0.5px", alignSelf: "stretch", backgroundColor: PALETTE.lineOnForest }} />
        <div style={{ flex: 1 }}>
          <KeyFigure
            label="SAFE, tarif fondateur"
            value={`${formatCAD(prixSafe)}`}
            sub={`pendant ${dureeMois} mois, puis ${formatCAD(prixGele)} gelé`}
            onDark
          />
        </div>
        <div style={{ width: "0.5px", alignSelf: "stretch", backgroundColor: PALETTE.lineOnForest }} />
        <div style={{ flex: 1.2 }}>
          <KeyFigure
            label="Ce que vous gardez"
            value={`${formatCAD(economieMensuelle)}`}
            sub={`par mois, soit ${formatCAD(economieAnnuelle)} par an (${reductionPct} % de moins)`}
            accent
            onDark
          />
        </div>
      </div>

      {/* Rappel de la valeur de temps */}
      <p
        style={{
          fontFamily: "var(--font-geist-sans, sans-serif)",
          fontSize: "11px",
          lineHeight: 1.65,
          color: PALETTE.inkBody,
          margin: "22px 0 0",
          paddingLeft: "12px",
          borderLeft: `2px solid ${PALETTE.gold}`,
        }}
      >
        Cette économie ne compte que les licences. À côté, le temps administratif que SAFE vous
        rend représente{" "}
        <strong style={{ color: PALETTE.ink, fontWeight: 600 }}>{formatCAD(cout.annuel)}</strong> par
        an ({cout.heuresRecuperablesSemaine} h par semaine sur {cout.semainesFacturables} semaines),
        détaillé à la section 02.
      </p>

      <p
        style={{
          fontFamily: "var(--font-geist-mono, monospace)",
          fontSize: "7.5px",
          color: PALETTE.inkFaint,
          margin: "auto 0 0",
          paddingTop: "16px",
        }}
      >
        Prix publics relevés en 2026. Le tarif fondateur est valable dans la limite des{" "}
        {TARIFICATION.fondateurs.placesTotal} places.
      </p>
    </PageShell>
  );
}
