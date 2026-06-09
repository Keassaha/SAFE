import React from "react";
import { PALETTE } from "../theme";
import { PageShell } from "../PageShell";
import { Eyebrow, DisplayTitle, Em, Divider, MonoLabel } from "../primitives";
import type { AuditReport, Variant } from "@/types/audit-report";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "9px 0",
        gap: "12px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-geist-sans, sans-serif)",
          fontSize: "10px",
          color: PALETTE.moss2,
          flexShrink: 0,
          width: "160px",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-geist-sans, sans-serif)",
          fontSize: "11px",
          color: PALETTE.ink,
          fontWeight: 500,
          textAlign: "right",
          flex: 1,
        }}
      >
        {value}
      </span>
    </div>
  );
}

interface Props {
  data: AuditReport;
  variant: Variant;
}

export function ProfilPage({ data, variant }: Props) {
  const c = data.cabinet;

  return (
    <PageShell
      pageLabel="Profil du cabinet"
      pageNum="01"
      date={data.meta.date}
      variant={variant}
    >
      {/* Section header */}
      <Eyebrow>01 · Profil du cabinet</Eyebrow>
      <DisplayTitle size="lg">
        Avec qui nous travaillons, et pourquoi cet <Em>audit.</Em>
      </DisplayTitle>

      <div style={{ height: "20px" }} />

      {/* Two-column layout */}
      <div style={{ display: "flex", gap: "32px", flex: 1 }}>
        {/* Left: cabinet info */}
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: PALETTE.moss2, marginBottom: "8px" }}>
            Identification
          </p>
          <Divider />
          <div style={{ borderBottom: `0.5px solid ${PALETTE.lineSoft}` }}>
            <InfoRow label="Raison sociale" value={c.raisonSociale} />
          </div>
          <div style={{ borderBottom: `0.5px solid ${PALETTE.lineSoft}` }}>
            <InfoRow label="Contact" value={c.contact} />
          </div>
          <div style={{ borderBottom: `0.5px solid ${PALETTE.lineSoft}` }}>
            <InfoRow label="Localisation" value={c.localisation} />
          </div>
          <div style={{ borderBottom: `0.5px solid ${PALETTE.lineSoft}` }}>
            <InfoRow label="Forme juridique" value={c.formeJuridique} />
          </div>
          <div style={{ borderBottom: `0.5px solid ${PALETTE.lineSoft}` }}>
            <InfoRow label="Domaines" value={c.domaines.join(", ")} />
          </div>
          <div style={{ borderBottom: `0.5px solid ${PALETTE.lineSoft}` }}>
            <InfoRow label="Ancienneté" value={c.anciennete} />
          </div>

          <div style={{ height: "20px" }} />

          <p style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: PALETTE.moss2, marginBottom: "8px" }}>
            Pratique et outils
          </p>
          <Divider />
          <div style={{ borderBottom: `0.5px solid ${PALETTE.lineSoft}` }}>
            <InfoRow label="Dossiers actifs" value={c.dossiersActifs} />
          </div>
          <div style={{ borderBottom: `0.5px solid ${PALETTE.lineSoft}` }}>
            <InfoRow label="Facturation" value={c.facturation} />
          </div>
          <div style={{ borderBottom: `0.5px solid ${PALETTE.lineSoft}` }}>
            <InfoRow label="Fidéicommis" value={c.fideicommis} />
          </div>
          <div style={{ borderBottom: `0.5px solid ${PALETTE.lineSoft}` }}>
            <InfoRow label="Outil actuel" value={c.outilActuel} />
          </div>
          <div>
            <InfoRow label="Satisfaction outil" value={`${c.satisfactionOutil} / 10`} />
          </div>
        </div>

        {/* Right: objective + context card */}
        <div style={{ width: "220px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              backgroundColor: "var(--cream-card)",
              border: `0.5px solid ${PALETTE.lineSoft}`,
              borderRadius: "8px",
              padding: "20px",
              flex: 1,
            }}
          >
            <p style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: PALETTE.gold, marginBottom: "10px" }}>
              Objectif de l'audit
            </p>
            <p
              style={{
                fontFamily: "var(--font-geist-sans, sans-serif)",
                fontSize: "10.5px",
                lineHeight: 1.65,
                color: PALETTE.moss,
              }}
            >
              {data.butAudit}
            </p>
          </div>

          {/* Utilisateurs stat */}
          <div
            style={{
              backgroundColor: PALETTE.forest2,
              borderRadius: "8px",
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <MonoLabel dark small>Utilisateurs SAFE</MonoLabel>
            <p
              style={{
                fontFamily: "var(--font-instrument-serif, Georgia, serif)",
                fontSize: "38px",
                lineHeight: 1,
                color: PALETTE.sage50,
                fontWeight: 400,
                margin: 0,
              }}
            >
              {c.utilisateurs}
            </p>
            <p style={{ fontFamily: "var(--font-geist-sans, sans-serif)", fontSize: "9px", color: PALETTE.sage, margin: 0 }}>
              {c.utilisateurs === 1 ? "utilisateur prévu" : "utilisateurs prévus"}
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
