"use client";

/**
 * L'index public des outils gratuits.
 *
 * Il n'y en a qu'un de publié aujourd'hui. La page existe quand même, parce que
 * la règle de build prévoit une suite et qu'un chemin propre coûte moins cher à
 * ouvrir maintenant qu'à réécrire quand le deuxième outil arrivera.
 *
 * Elle posait ses outils en cartes arrondies dans une colonne de 768 px
 * centrée. Elle passe au contrat de section du site : le nom de l'outil à
 * gauche, ce qu'il fait à droite, un filet entre deux. Un outil qui n'est pas
 * publié le dit en mono, à droite, et ne porte pas de lien.
 */

import React from "react";
import Link from "next/link";
import { PageShell, R } from "./shared";
import { Ouverture, Recit, Tete } from "./recit";

const OUTILS = [
  {
    href: R.calcPatrimoineFamilial,
    titre: "Partage du patrimoine familial",
    quoi:
      "La valeur à partager, calculée article par article, avec la déduction de plus-value que les tableurs manquent une fois sur deux.",
    pret: true,
  },
  {
    href: null,
    titre: "Pension alimentaire pour enfants",
    quoi:
      "La table officielle, les quatre situations de garde, et le plafond de capacité de payer.",
    pret: false,
  },
] as const;

export default function CalculateursPage() {
  return (
    <PageShell>
      <Ouverture
        titre="Des calculs que vous pouvez vérifier"
        dire={[
          "Chaque montant renvoie à son article.",
          "Et quand le droit ne tranche pas, l’outil s’arrête au lieu d’inventer un chiffre.",
        ]}
      />

      <Recit id="outils">
        <div className="liste-q">
          {OUTILS.map((o) => {
            const corps = (
              <>
                <h3>
                  {o.titre}
                  {!o.pret && <span className="rang etat-outil">en construction</span>}
                </h3>
                <div>
                  <p>{o.quoi}</p>
                  {o.pret && <span className="more">Ouvrir l’outil →</span>}
                </div>
              </>
            );
            return o.href ? (
              <Link className="q lien-outil" href={o.href} key={o.titre}>
                {corps}
              </Link>
            ) : (
              <div className="q" key={o.titre}>
                {corps}
              </div>
            );
          })}
        </div>
      </Recit>

      <Recit>
        <Tete
          titre="Les outils sont autonomes"
          dire={[
            "Aucun compte, aucune donnée conservée.",
            "SAFE Cabinet, lui, tient le reste : les dossiers, le temps, la facturation et le fidéicommis.",
          ]}
        />
        <div className="actions">
          <a className="btn" href={R.fonctionnalites}>
            Découvrir SAFE Cabinet
          </a>
          <a className="btn ghost" href={R.diagnostic}>
            Évaluer mon cabinet
          </a>
        </div>
      </Recit>

      {/* Deux règles d'appoint, propres à cette page : un outil se survole
          comme une rangée de registre, et l'état « en construction » se lit à
          côté du nom, jamais en dessous. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .safe-vitrine .lien-outil { transition: background-color 0.2s ease; }
        .safe-vitrine .lien-outil:hover { background: rgb(var(--si-line-ink-rgb) / 0.025); }
        .safe-vitrine .etat-outil { margin-left: 10px; vertical-align: 0.18em; }
      `,
        }}
      />
    </PageShell>
  );
}
