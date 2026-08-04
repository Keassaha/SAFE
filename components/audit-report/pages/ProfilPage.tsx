import React from "react";
import { PALETTE } from "../theme";
import { PageShell } from "../PageShell";
import { Em } from "../primitives";
import type { AuditReport } from "@/types/audit-report";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: "16px",
        padding: "13px 0",
        borderBottom: `0.5px solid ${PALETTE.lineSoft}`,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-geist-sans, sans-serif)",
          fontSize: "10.5px",
          color: PALETTE.inkMuted,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-geist-sans, sans-serif)",
          fontSize: "11.5px",
          color: PALETTE.ink,
          fontWeight: 500,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1 }}>
      <p
        style={{
          fontFamily: "var(--font-geist-mono, monospace)",
          fontSize: "8px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: PALETTE.inkMuted,
          margin: "0 0 8px",
        }}
      >
        {titre}
      </p>
      <div style={{ borderTop: `0.5px solid ${PALETTE.line}` }}>{children}</div>
    </div>
  );
}

interface Props {
  data: AuditReport;
  sectionNum: string;
  pageNum: string;
  total: string;
}

export function ProfilPage({ data, sectionNum, pageNum, total }: Props) {
  const c = data.cabinet;

  return (
    <PageShell
      eyebrow={`${sectionNum} · Profil du cabinet`}
      title={
        <>
          Ce sur quoi le diagnostic s'<Em>appuie.</Em>
        </>
      }
      lede="Voici les réponses que vous nous avez données. Tout le reste du document en découle, donc si une ligne est inexacte, dites-le nous et le diagnostic est recalculé."
      pageLabel="Profil du cabinet"
      pageNum={pageNum}
      total={total}
      date={data.meta.date}
    >
      {/* Deux colonnes de faits, pleine largeur */}
      <div style={{ display: "flex", gap: "40px" }}>
        <Bloc titre="Identification">
          <InfoRow label="Raison sociale" value={c.raisonSociale} />
          <InfoRow label="Contact" value={c.contact} />
          <InfoRow label="Localisation" value={c.localisation} />
          <InfoRow label="Forme juridique" value={c.formeJuridique} />
          <InfoRow label="Domaines" value={c.domaines.join(", ")} />
          <InfoRow label="Ancienneté" value={c.anciennete} />
          <InfoRow
            label="Utilisateurs prévus"
            value={String(c.utilisateurs)}
          />
        </Bloc>

        <Bloc titre="Pratique et outils">
          <InfoRow label="Dossiers actifs" value={c.dossiersActifs} />
          <InfoRow label="Facturation" value={c.facturation} />
          <InfoRow label="Fidéicommis" value={c.fideicommis} />
          <InfoRow label="Outil actuel" value={c.outilActuel} />
          <InfoRow label="Satisfaction outil" value={`${c.satisfactionOutil} sur 10`} />
          <InfoRow
            label="Heures administratives"
            value={`${data.cout.heuresAdminDeclarees.min} à ${data.cout.heuresAdminDeclarees.max} h / sem.`}
          />
          <InfoRow
            label="Délai de règlement"
            value={`${data.cout.delaiReglementDeclare} jours`}
          />
        </Bloc>
      </div>

      {/* Ce que ces réponses signalent */}
      {data.drivers.length > 0 && (
        <div style={{ marginTop: "40px" }}>
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
            Ce que ces réponses signalent
          </p>
          <div style={{ borderTop: `0.5px solid ${PALETTE.line}` }}>
            {data.drivers.map((d, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "20px",
                  padding: "16px 0",
                  borderBottom: `0.5px solid ${PALETTE.lineSoft}`,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-instrument-serif, Georgia, serif)",
                    fontSize: "15px",
                    color: PALETTE.gold,
                    width: "20px",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-geist-sans, sans-serif)",
                    fontSize: "11.5px",
                    color: PALETTE.ink,
                    flex: 1,
                    lineHeight: 1.45,
                  }}
                >
                  {d.label}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-geist-sans, sans-serif)",
                    fontSize: "10.5px",
                    color: PALETTE.inkMuted,
                    textAlign: "right",
                    flexShrink: 0,
                    width: "150px",
                  }}
                >
                  {d.valeur}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}
