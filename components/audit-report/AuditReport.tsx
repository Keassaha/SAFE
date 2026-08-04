import React from "react";
import { PALETTE, VARIANTS, RISK_RANK } from "./theme";
import { CoverPage } from "./pages/CoverPage";
import { ProfilPage } from "./pages/ProfilPage";
import { ScorePage } from "./pages/ScorePage";
import { RisquesPage } from "./pages/RisquesPage";
import { BarreauPage } from "./pages/BarreauPage";
import { CoutPage } from "./pages/CoutPage";
import { OffrePage } from "./pages/OffrePage";
import type { AuditReport as TAuditReport, Variant } from "@/types/audit-report";

interface Props {
  data: TAuditReport;
  variant?: Variant;
}

/** Nombre de points d'exposition tenant sur une page sans rognage. */
const RISQUES_PAR_PAGE = 4;

/** Répartit en pages de `max` éléments, puis équilibre : on ne laisse jamais
 *  un point d'exposition seul en bas d'une page. */
function chunk<T>(items: T[], max: number): T[][] {
  if (items.length === 0) return [[]];
  const nbPages = Math.ceil(items.length / max);
  const parPage = Math.ceil(items.length / nbPages);
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += parPage) out.push(items.slice(i, i + parPage));
  return out;
}

export function AuditReport({ data, variant = "white" }: Props) {
  const v = VARIANTS[variant];

  // Les risques sont lus du plus grave au moins grave : l'ordre porte la gravité,
  // à la place des anciennes couleurs de sévérité.
  const risquesTries = [...data.risques].sort(
    (a, b) => RISK_RANK[b.niveau] - RISK_RANK[a.niveau]
  );
  const groupesRisques = chunk(risquesTries, RISQUES_PAR_PAGE);

  // Le nombre de pages dépend du contenu réel : plus rien n'est rogné en silence
  // et la pagination du pied de page ne peut plus mentir.
  const tailleGroupe = groupesRisques[0].length;

  type Section = {
    label: string;
    /** true quand la page prolonge la section précédente (risques qui débordent) */
    suite?: boolean;
    render: (sectionNum: string, pageNum: string, total: string) => React.ReactNode;
  };

  const sections: Section[] = [
    {
      label: "Profil du cabinet",
      render: (num, page, total) => (
        <ProfilPage data={data} sectionNum={num} pageNum={page} total={total} />
      ),
    },
    {
      label: "Ce que ça vous coûte",
      render: (num, page, total) => (
        <ScorePage data={data} sectionNum={num} pageNum={page} total={total} />
      ),
    },
    ...groupesRisques.map((groupe, i) => ({
      label: "Points d'exposition",
      suite: i > 0,
      render: (num: string, page: string, total: string) => (
        <RisquesPage
          data={data}
          risques={groupe}
          offset={i * tailleGroupe}
          part={{ index: i + 1, count: groupesRisques.length }}
          sectionNum={num}
          pageNum={page}
          total={total}
        />
      ),
    })),
    {
      label: "Vos obligations",
      render: (num, page, total) => (
        <BarreauPage data={data} sectionNum={num} pageNum={page} total={total} />
      ),
    },
    {
      label: "Le coût de la solution",
      render: (num, page, total) => (
        <CoutPage data={data} sectionNum={num} pageNum={page} total={total} />
      ),
    },
    {
      label: "Votre offre",
      render: (num, page, total) => (
        <OffrePage data={data} sectionNum={num} pageNum={page} total={total} />
      ),
    },
  ];

  const total = String(sections.length).padStart(2, "0");

  // Numéro de section : il n'avance pas sur une page de suite, sinon le sommaire
  // et les titres afficheraient des numéros qui sautent.
  let compteurSection = 0;
  const numerosSection = sections.map((s) => {
    if (!s.suite) compteurSection += 1;
    return String(compteurSection).padStart(2, "0");
  });

  const sommaire = sections
    .map((s, i) => ({ num: numerosSection[i], label: s.label, suite: s.suite }))
    .filter((s) => !s.suite);

  const cssVars = `
    .audit-report {
      --ink: ${PALETTE.ink};
      --forest: ${PALETTE.forest};
      --gold: ${PALETTE.gold};
      --line: ${PALETTE.line};
      --line-soft: ${PALETTE.lineSoft};
      --card: ${v.card};
    }
    .audit-page {
      width: 100%;
      aspect-ratio: 8.5 / 11;
      box-sizing: border-box;
      background: ${v.pageBg};
    }
    @media print {
      @page { size: 8.5in 11in; margin: 0; }
      /* globals.css masque « body * » pour l'impression des factures et des
         rapports financiers. Sans cette contre-règle, l'export PDF de l'audit
         sort entièrement blanc. */
      .audit-report, .audit-report * { visibility: visible !important; }
      .audit-report {
        position: absolute !important;
        left: 0; top: 0;
        width: 100%;
        margin: 0;
      }
      .audit-page {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
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

      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        <CoverPage data={data} sommaire={sommaire} />
        {sections.map((s, i) => (
          <React.Fragment key={i}>
            {s.render(numerosSection[i], String(i + 1).padStart(2, "0"), total)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
