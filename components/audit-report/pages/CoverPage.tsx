import React from "react";
import { PALETTE } from "../theme";
import { Logo } from "../primitives";
import type { AuditReport } from "@/types/audit-report";

interface Props {
  data: AuditReport;
  /** Sommaire construit par AuditReport : donne au lecteur la carte du document. */
  sommaire: { num: string; label: string }[];
}

export function CoverPage({ data, sommaire }: Props) {
  return (
    <div
      className="audit-page"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        padding: "52px 56px 46px",
      }}
    >
      {/* Bandeau haut */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: PALETTE.forest }}>
          <Logo size={20} />
          <span
            style={{
              fontFamily: "var(--font-instrument-serif, Georgia, serif)",
              /* Rapport mot / mark du verrou de marque : 20 × 1,15.
                 Voir docs/brand/IDENTITE_SAFE.md §4.4. */
              fontSize: "23px",
              letterSpacing: "0.015em",
              color: PALETTE.ink,
              lineHeight: 1,
            }}
          >
            SAFE
          </span>
        </div>
        <p
          style={{
            fontFamily: "var(--font-geist-mono, monospace)",
            fontSize: "8px",
            letterSpacing: "0.1em",
            color: PALETTE.inkFaint,
            textAlign: "right",
            margin: 0,
            lineHeight: 1.7,
          }}
        >
          Réf. {data.meta.ref}
          <br />
          {data.meta.date}
          {data.meta.confidentiel && (
            <>
              <br />
              Confidentiel
            </>
          )}
        </p>
      </div>

      {/* Bloc titre, aligné à gauche : on lit un document, pas une affiche.
          Le vide est concentré au-dessus du titre plutôt que réparti, pour
          garder une respiration franche au lieu de deux trous. */}
      <div style={{ maxWidth: "620px", marginTop: "22%" }}>
        <p
          style={{
            fontFamily: "var(--font-geist-mono, monospace)",
            fontSize: "9px",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: PALETTE.gold,
            margin: "0 0 18px",
          }}
        >
          Diagnostic de cabinet
        </p>
        <h1
          style={{
            fontFamily: "var(--font-instrument-serif, Georgia, serif)",
            fontSize: "44px",
            lineHeight: 1.08,
            color: PALETTE.ink,
            fontWeight: 400,
            margin: "0 0 20px",
          }}
        >
          Diagnostic de performance de votre{" "}
          <em style={{ fontStyle: "italic", color: PALETTE.forest }}>cabinet.</em>
        </h1>
        <p
          style={{
            fontFamily: "var(--font-geist-sans, sans-serif)",
            fontSize: "13px",
            color: PALETTE.ink,
            margin: "0 0 14px",
            fontWeight: 500,
          }}
        >
          Préparé pour {data.cabinet.raisonSociale}, {data.cabinet.localisation}
        </p>
        <p
          style={{
            fontFamily: "var(--font-geist-sans, sans-serif)",
            fontSize: "12px",
            lineHeight: 1.7,
            color: PALETTE.inkBody,
            margin: 0,
            maxWidth: "520px",
          }}
        >
          {data.butAudit}
        </p>
      </div>

      {/* Sommaire + signature */}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "40px",
        }}
      >
        <div style={{ flex: 1, maxWidth: "440px" }}>
          <p
            style={{
              fontFamily: "var(--font-geist-mono, monospace)",
              fontSize: "8px",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: PALETTE.inkMuted,
              margin: "0 0 10px",
            }}
          >
            Ce que contient ce document
          </p>
          <div style={{ borderTop: `0.5px solid ${PALETTE.line}` }}>
            {sommaire.map((s) => (
              <div
                key={s.num}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "14px",
                  padding: "7px 0",
                  borderBottom: `0.5px solid ${PALETTE.lineSoft}`,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-geist-mono, monospace)",
                    fontSize: "8.5px",
                    color: PALETTE.gold,
                    width: "18px",
                    flexShrink: 0,
                  }}
                >
                  {s.num}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-geist-sans, sans-serif)",
                    fontSize: "11px",
                    color: PALETTE.inkBody,
                  }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p
            style={{
              fontFamily: "var(--font-geist-sans, sans-serif)",
              fontSize: "11px",
              color: PALETTE.ink,
              margin: "0 0 3px",
              fontWeight: 500,
            }}
          >
            {data.cabinet.contact}
          </p>
          <p
            style={{
              fontFamily: "var(--font-geist-sans, sans-serif)",
              fontSize: "10.5px",
              color: PALETTE.inkMuted,
              margin: 0,
            }}
          >
            {data.cabinet.localisation}
          </p>
        </div>
      </div>
    </div>
  );
}
