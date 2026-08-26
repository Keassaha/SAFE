"use client";

/**
 * Le diagnostic — la porte d'entrée du questionnaire.
 *
 * ── Refonte du 2026-08-26 ───────────────────────────────────────────────────
 * Elle portait 582 lignes et six scènes : une entrée épinglée sur 360 vh, une
 * bande de preuves, une feuille de rapport dont les chiffres s'incrémentaient
 * au défilement, un déroulement en étapes, une reprise de la FAQ, et enfin, au
 * BAS de tout cela, le choix de la langue qui ouvre le questionnaire.
 *
 * Autrement dit : la seule action de la page était son dernier écran. Il
 * fallait traverser cinq scènes d'argumentation pour atteindre ce qu'on était
 * venu faire, et la page entretenait pour elle seule un rail latéral, un
 * pilotage au défilement et une seconde version « mouvement réduit » de tout
 * son contenu.
 *
 * Décision CEO du 2026-08-25, redemandée le 2026-08-26 : « la personne choisit
 * la langue et ensuite rentre dans le formulaire simplement ». C'est la même
 * doctrine que la page « Parler à quelqu'un » : quelqu'un qui arrive ici a déjà
 * décidé, lui vendre encore le diagnostic le retarde.
 *
 * Reste le titre, le choix de la langue dans le premier écran, et ce que le
 * rapport regarde. Ce dernier point n'est pas de l'argumentation : c'est la
 * contrepartie de quinze minutes de questions, et elle se dit avant, pas après.
 *
 * La page passe aussi au contrat de section du site (voir
 * components/public-site/recit.tsx). Elle montait sa propre coquille et
 * n'héritait donc d'aucune de ses règles.
 */

import { useState } from "react";
import dynamic from "next/dynamic";
import { PageShell, FAINT } from "@/components/public-site/shared";
import { Recit, Tete } from "@/components/public-site/recit";

const AuditForm = dynamic(
  () => import("@/components/audit-gratuit/AuditForm").then((m) => m.AuditForm),
  {
    loading: () => (
      <div className="audit-v2-bg flex min-h-screen items-center justify-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: FAINT }}>
          Chargement
        </span>
      </div>
    ),
  },
);

type Lang = "fr" | "en";

const LANGUES: [Lang, string, string][] = [
  ["fr", "Français", "Québec"],
  ["en", "English", "Canada"],
];

/* Ce que le rapport regarde. Trois lignes, et aucun chiffre.
   La page en portait trois d'exemple — 18 400 $, 6,5 h, 7 sur 10 — sous la
   mention « données fictives ». Un montant invente sur une page qui promet un
   montant vrai travaille contre elle : le lecteur retient le nombre, pas
   l'avertissement. Ce qui est annonce ici, c'est ce qui SERA mesure. */
const REGARDE: [string, string, string][] = [
  ["01", "Votre facturation", "Le temps saisi qui n'arrive jamais sur une facture."],
  ["02", "Votre temps", "Les heures d'administration que la double saisie vous prend."],
  ["03", "Vos obligations", "L'état de ce que le Barreau attend de vous."],
];

export default function DiagnosticPage() {
  const [lang, setLang] = useState<Lang | null>(null);
  if (lang) return <AuditForm lang={lang} />;

  return (
    <PageShell>
      {/* Le choix de la langue vit DANS l'ouverture, pas dans une section a
          atteindre : c'est la seule action de la page, elle est offerte au
          premier ecran. */}
      <section className="recit ouverture">
        <div className="inner">
          <div className="tete">
            <h1>Évaluer mon cabinet</h1>
            <p className="dire">
              <b>Une quinzaine de minutes de questions.</b> En retour, un rapport chiffré sur votre
              facturation, votre temps et vos obligations. Gratuit, sans carte de crédit.
            </p>
          </div>

          <p className="choix-titre">Dans quelle langue préférez-vous répondre&nbsp;?</p>
          <div className="langues">
            {LANGUES.map(([code, nom, lieu]) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className="safe-zoom langue"
              >
                <span className="lg-code" aria-hidden>
                  {code.toUpperCase()}
                </span>
                <span className="lg-nom">{nom}</span>
                <span className="lg-lieu">{lieu}</span>
              </button>
            ))}
          </div>
          <p className="note note-faible">
            Vos réponses restent confidentielles. Le tarif vient après le diagnostic, pas avant.
          </p>
        </div>
      </section>

      <Recit id="regarde" socle>
        <Tete
          titre="Ce que le rapport regarde"
          dire={[
            "Trois choses, dans cet ordre.",
            "Les questions portent sur votre façon de saisir le temps, de facturer, de tenir le fidéicommis et de suivre vos échéances.",
          ]}
        />
        <div className="etapes-audit">
          {REGARDE.map(([n, titre, texte]) => (
            <div className="etape-audit" key={n}>
              <span className="n" aria-hidden>
                {n}
              </span>
              <p className="t">{titre}</p>
              <p className="d">{texte}</p>
            </div>
          ))}
        </div>
      </Recit>

      {/* Les deux plaques de langue et l'index des trois lignes. Ils ne servent
          qu'ici : leurs regles vivent avec eux plutot que dans le vocabulaire
          partage. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .safe-vitrine .choix-titre {
          margin-top: clamp(48px, 7vh, 88px);
          font-family: var(--sans);
          font-size: var(--t-explique);
          color: var(--si-ink);
        }
        .safe-vitrine .langues {
          margin-top: 18px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: clamp(14px, 1.8vw, 22px);
          max-width: 620px;
        }
        .safe-vitrine .langue {
          display: block;
          text-align: left;
          border: 1px solid var(--si-border);
          border-radius: 14px;
          background: var(--si-surface);
          padding: clamp(20px, 2.4vw, 28px);
          cursor: pointer;
        }
        .safe-vitrine .langue:focus-visible { outline: 2px solid var(--si-ink-strong); outline-offset: 3px; }
        .safe-vitrine .lg-code {
          display: block;
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          color: var(--si-verified);
        }
        .safe-vitrine .lg-nom {
          display: block;
          margin-top: 10px;
          font-family: var(--sans);
          font-size: var(--t-argument);
          letter-spacing: -0.014em;
          color: var(--si-ink);
        }
        .safe-vitrine .lg-lieu {
          display: block;
          margin-top: 4px;
          font-family: var(--sans);
          font-size: var(--t-detail);
          color: var(--si-muted);
        }
        .safe-vitrine .etapes-audit {
          margin-top: clamp(40px, 5vw, 64px);
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: clamp(24px, 3.4vw, 48px);
        }
        .safe-vitrine .etape-audit { border-top: 1px solid var(--si-line); padding-top: 16px; }
        .safe-vitrine .etape-audit .n {
          font-family: var(--mono);
          font-size: var(--t-menu);
          letter-spacing: 0.1em;
          color: var(--si-verified);
        }
        .safe-vitrine .etape-audit .t {
          margin-top: 10px;
          font-family: var(--sans);
          font-size: var(--t-argument);
          line-height: 1.25;
          letter-spacing: -0.014em;
          color: var(--si-ink);
        }
        .safe-vitrine .etape-audit .d {
          margin-top: 8px;
          font-family: var(--sans);
          font-size: var(--t-detail);
          line-height: 1.55;
          color: var(--si-muted);
        }
        @media (max-width: 860px) {
          .safe-vitrine .langues { grid-template-columns: 1fr; }
          .safe-vitrine .etapes-audit { grid-template-columns: 1fr; gap: 22px; }
        }
      `,
        }}
      />
    </PageShell>
  );
}
