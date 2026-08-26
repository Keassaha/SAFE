"use client";

/**
 * La page de rencontre, servie sur /demo et sur /contact.
 *
 * Elle posait un exergue en mono, une liste numérotée et un formulaire encarté
 * dans une colonne de 1024 px centrée, puis une bande de quatre gages sur fond
 * blanc. Elle passe au contrat de section du site : le déroulement de la
 * rencontre en liste numérotée pleine largeur, le formulaire dans sa propre
 * section, les gages en index numéroté.
 */

import React from "react";
import { PageShell, GREEN, INK, LINE, R } from "./shared";
import { Ouverture, Recit, Tete, ListeNumerotee, IndexNumerote } from "./recit";

const DEROULEMENT = [
  ["Nous partons de votre façon de travailler.", "Écoute"],
  ["Nous ciblons les tâches qui demandent le plus de vérifications.", "Repérage"],
  ["Nous vous montrons seulement les parties de SAFE qui s’y rapportent.", "Démonstration"],
  ["Vous posez vos questions et décidez de la suite, sans pression.", "Décision"],
] as const;

const CHAMPS = [
  { label: "Nom", type: "text", placeholder: "Votre nom" },
  { label: "Courriel professionnel", type: "email", placeholder: "vous@votrecabinet.ca" },
  { label: "Nom du cabinet", type: "text", placeholder: "Votre cabinet" },
];

const GAGES = [
  ["01", "Conçu au Québec"],
  ["02", "Données hébergées au Canada"],
  ["03", "Pensé pour le fidéicommis"],
  ["04", "Utilisé dans un vrai cabinet"],
] as const;

export default function DemoPage() {
  return (
    <PageShell>
      <Ouverture
        titre="Commençons par votre réalité"
        dire={[
          "Vingt minutes sur vos dossiers, votre temps et votre fidéicommis.",
          "Vous verrez ensuite si SAFE mérite d’aller plus loin.",
        ]}
      />

      <Recit id="deroulement">
        <Tete
          titre="Ce qui se passe pendant la rencontre"
          dire={["Quatre temps, dans cet ordre.", "Aucune présentation de vente."]}
        />
        <ListeNumerotee entrees={DEROULEMENT} />
      </Recit>

      <Recit id="rencontre" socle>
        <Tete
          titre="Choisir un moment"
          dire={[
            "Trois champs, rien de plus.",
            "Vos coordonnées servent à répondre et à organiser la rencontre, jamais à autre chose.",
          ]}
        />

        <form className="formulaire" onSubmit={(e) => e.preventDefault()}>
          {CHAMPS.map((c) => (
            <label key={c.label}>
              <span>{c.label}</span>
              <input type={c.type} placeholder={c.placeholder} className="safe-zoom champ" />
            </label>
          ))}
          <button type="submit" className="btn">
            Choisir un moment
          </button>
        </form>

        <p className="note note-faible">
          Vos coordonnées ne sont ni vendues ni partagées à des fins de prospection par des tiers.
        </p>
      </Recit>

      <Recit id="gages">
        <Tete
          titre="Ce que vous savez déjà avant d’écrire"
          dire={["Quatre faits, vérifiables.", "Le reste se regarde ensemble."]}
        />
        <IndexNumerote entrees={GAGES} />
        <div className="actions">
          <a className="btn ghost" href={R.diagnostic}>
            Ou commencer par l’évaluation
          </a>
        </div>
      </Recit>

      {/* Le formulaire est le seul objet de saisie du site public : ses règles
          vivent avec lui, pas dans le vocabulaire partagé. Il tient sur une
          rangée de trois champs et son bouton, et s'empile au pouce. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .safe-vitrine .formulaire {
          margin-top: clamp(56px, 8vh, 104px);
          display: grid;
          grid-template-columns: repeat(3, 1fr) auto;
          align-items: end;
          gap: 18px clamp(20px, 2.4vw, 32px);
        }
        .safe-vitrine .formulaire label { display: block; min-width: 0; }
        .safe-vitrine .formulaire label span {
          display: block;
          font-family: var(--sans);
          font-size: 13px;
          font-weight: 500;
          color: ${INK};
        }
        .safe-vitrine .champ {
          margin-top: 7px;
          height: 44px;
          width: 100%;
          border-radius: 8px;
          border: 1px solid ${LINE};
          background: var(--si-surface);
          padding: 0 14px;
          font-family: var(--sans);
          font-size: 14px;
          color: ${INK};
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .safe-vitrine .champ:focus {
          border-color: ${GREEN};
          box-shadow: 0 0 0 3px rgb(var(--si-ink-strong-rgb) / 0.12);
        }
        @media (max-width: 860px) {
          .safe-vitrine .formulaire { margin-top: 32px; grid-template-columns: 1fr; }
          .safe-vitrine .formulaire .btn { justify-content: center; }
        }
      `,
        }}
      />
    </PageShell>
  );
}
