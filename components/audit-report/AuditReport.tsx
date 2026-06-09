import React from "react";
import { PALETTE, VARIANTS } from "./theme";
import { CoverPage } from "./pages/CoverPage";
import { ProfilPage } from "./pages/ProfilPage";
import { ScorePage } from "./pages/ScorePage";
import { DetailPage } from "./pages/DetailPage";
import { RisquesPage } from "./pages/RisquesPage";
import { BarreauPage } from "./pages/BarreauPage";
import { OpportunitesPage } from "./pages/OpportunitesPage";
import { CoutPage } from "./pages/CoutPage";
import { OffrePage } from "./pages/OffrePage";
import { EtapesPage } from "./pages/EtapesPage";
import { AnnexePage } from "./pages/AnnexePage";
import type { AuditReport as TAuditReport, Variant } from "@/types/audit-report";

interface Props {
  data: TAuditReport;
  variant?: Variant;
}

export function AuditReport({ data, variant = "white" }: Props) {
  const v = VARIANTS[variant];
  const isWhite = variant === "white";
  const pagesBg = isWhite ? (v as typeof VARIANTS.white).pageGradient : PALETTE.sage50;

  const cssVars = `
    .audit-report {
      --ink: ${PALETTE.ink};
      --forest: ${PALETTE.forest};
      --forest-2: ${PALETTE.forest2};
      --moss: ${PALETTE.moss};
      --moss-2: ${PALETTE.moss2};
      --sage: ${PALETTE.sage};
      --sage-200: ${PALETTE.sage200};
      --sage-100: ${PALETTE.sage100};
      --sage-50: ${PALETTE.sage50};
      --gold: ${PALETTE.gold};
      --gold-soft: ${PALETTE.goldSoft};
      --gold-on-dark: ${PALETTE.goldDark};
      --clay: ${PALETTE.clay};
      --line: ${PALETTE.line};
      --line-soft: ${PALETTE.lineSoft};
      --cream-card: ${v.card};
      --cream-deep: ${v.cardDeep};
      --card-shadow: ${v.shadow};
    }
    .audit-page {
      width: 100%;
      aspect-ratio: 8.5 / 11;
      box-sizing: border-box;
      background: ${v.pageBg ?? "transparent"};
      ${isWhite ? `background-image: ${(v as typeof VARIANTS.white).pageGradient};` : ""}
    }
    @media print {
      @page { size: 8.5in 11in; margin: 0; }
      .audit-page {
        width: 8.5in !important;
        height: 11in !important;
        aspect-ratio: auto !important;
        page-break-after: always;
        overflow: hidden;
      }
      .audit-page:last-child { page-break-after: auto; }
    }
  `;

  return (
    <div
      className="audit-report"
      data-variant={variant}
      style={{ fontFamily: "var(--font-geist-sans, sans-serif)" }}
    >
      <style dangerouslySetInnerHTML={{ __html: cssVars }} />

      {/* Pages */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        <CoverPage data={data} variant={variant} />
        <ProfilPage data={data} variant={variant} />
        <ScorePage data={data} variant={variant} />
        <DetailPage data={data} variant={variant} />
        <RisquesPage data={data} variant={variant} />
        <BarreauPage data={data} variant={variant} />
        <OpportunitesPage data={data} variant={variant} />
        <CoutPage data={data} variant={variant} />
        <OffrePage data={data} variant={variant} />
        <EtapesPage data={data} variant={variant} />
        <AnnexePage data={data} variant={variant} />
      </div>
    </div>
  );
}
