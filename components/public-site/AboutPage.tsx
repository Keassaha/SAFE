"use client";

/**
 * À propos de SAFE.
 *
 * ── Refonte du 2026-08-23 ───────────────────────────────────────────────────
 * La page racontait la même histoire, mais avec huit compositions différentes :
 * un hero à deux colonnes avec portrait, un constat en colonnes inversées, un
 * artefact Excel en encart, une suite en rangées, une méthode en liste
 * ordonnée, une signature encadrée. Six exergues numérotés en mono et quatre
 * largeurs de colonne pour un récit qui tient en six temps.
 *
 * Elle passe au contrat de section du site (voir ./recit.tsx). Le récit ne
 * change pas, l'ordre non plus : le constat, le fichier Excel, l'application,
 * la suite, la méthode, la personne. Ce qui disparaît, ce sont les huit
 * grammaires.
 *
 * Le portrait reste, à sa place : à côté de la signature, à la fin, là où on
 * veut savoir qui parle. En haut de page il concurrençait le titre.
 */

import React from "react";
import Image from "next/image";
import { PageShell, R, INK, MUTED, LINE } from "./shared";
import { Ouverture, Recit, Tete, ListeNumerotee, IndexNumerote } from "./recit";

const RUPTURES = [
  ["Le temps devait être retrouvé.", "Temps"],
  ["Les factures étaient reconstruites.", "Facturation"],
  ["Les paiements et les opérations comptables étaient suivis séparément.", "Comptabilité"],
] as const;

const ETAPES = [
  [
    "Regarder comment le travail est réellement effectué, ce qui doit être ressaisi et ce que l’équipe cherche sans le trouver.",
    "Observer",
  ],
  [
    "Faire circuler l’information entre les étapes qui partagent déjà le même contexte.",
    "Relier",
  ],
  ["Rendre visibles les écarts et conserver la trace des décisions importantes.", "Vérifier"],
  [
    "Développer une capacité à la fois, la mettre entre les mains d’un cabinet et vérifier qu’elle simplifie réellement son travail.",
    "Améliorer",
  ],
] as const;

const REGISTRES = [
  ["01", "Clients et dossiers"],
  ["02", "Temps et débours"],
  ["03", "Facturation et paiements"],
  ["04", "Comptabilité"],
  ["05", "Fidéicommis"],
  ["06", "Échéances et rapports"],
] as const;

export default function AProposPage() {
  return (
    <PageShell>
      <Ouverture
        titre="SAFE est né dans l’administration réelle d’un cabinet"
        dire={[
          "Avant d’être une application, SAFE était une réponse à un problème concret.",
          "Trop d’informations dispersées, trop de tâches répétées, trop de travail qui reposait sur la mémoire de l’équipe.",
        ]}
      />

      <Recit id="constat">
        <Tete
          titre="Le travail juridique avançait, l’administration suivait difficilement"
          dire={["Trois ruptures revenaient chaque mois.", "Aucune ne venait d’un manque d’effort."]}
        />
        <ListeNumerotee entrees={RUPTURES} />
      </Recit>

      <Recit id="premier-safe">
        <Tete
          titre="La première version de SAFE était un fichier Excel"
          dire={[
            "Il ne s’agissait pas de construire une entreprise technologique.",
            "Il fallait rassembler une comptabilité éparpillée et rendre le travail plus facile à suivre. À mesure que les tâches se sont reliées, le fichier est devenu un système.",
          ]}
        />
      </Recit>

      <Recit id="application" socle>
        <Tete
          titre="Le fichier est devenu SAFE Cabinet"
          dire={[
            "Six registres, un seul contexte.",
            "Une information inscrite pendant le travail reste disponible pour les étapes suivantes : le dossier nourrit la facture, le paiement met à jour la créance.",
          ]}
        />
        <IndexNumerote entrees={REGISTRES} />
        <p className="chute" style={{ marginTop: "clamp(44px, 6vh, 76px)" }}>
          Le produit a changé. L’idée, non : le logiciel doit comprendre le cabinet, pas l’inverse.
        </p>
      </Recit>

      <Recit id="suite">
        <Tete
          titre="Un système central, des outils autonomes"
          dire={[
            "SAFE ne s’arrête plus à une seule application.",
            "SAFE Cabinet tient le travail quotidien ; les Outils SAFE règlent une tâche précise, sans adopter toute l’application.",
          ]}
        />
        <div className="actions">
          <a className="btn ghost" href={R.fonctionnalites}>
            Découvrir SAFE Cabinet
          </a>
          <a className="btn ghost" href={R.outils}>
            Découvrir les outils SAFE
          </a>
        </div>
      </Recit>

      <Recit id="methode">
        <Tete
          titre="Comprendre avant de construire"
          dire={["Quatre temps, dans cet ordre.", "Aucune capacité n’est annoncée avant d’être utilisable."]}
        />
        <ListeNumerotee entrees={ETAPES} />
      </Recit>

      {/* La personne, à la fin. Le portrait vit ici, avec la signature : en
          haut de page il concurrençait le titre, et on ne cherche pas qui
          parle avant d'avoir lu ce qui est dit. */}
      <Recit id="fondateur" socle>
        <Tete
          titre="Une expérience administrative appliquée au monde juridique"
          dire={[
            "Je suis Jérémie Tiahou, formé en administration et en comptabilité de petite entreprise.",
            "Je n’ai pas commencé avec l’ambition de créer un autre logiciel juridique. J’ai commencé avec un problème à résoudre, et c’est encore de cette manière que SAFE est construit.",
          ]}
        />
        <div className="signature">
          <Image
            src="/images/fondateur/portrait.jpg"
            alt="Jérémie Tiahou, fondateur de SAFE"
            width={328}
            height={410}
            sizes="(max-width: 860px) 96px, 168px"
          />
          <div>
            <p className="nom">Jérémie Tiahou</p>
            <p className="role">Fondateur de SAFE</p>
          </div>
        </div>
      </Recit>

      <Recit id="fin">
        <Tete
          titre="Votre cabinet ne devrait pas avoir à s’adapter à son logiciel"
          dire={[
            "Commençons par comprendre votre organisation administrative.",
            "Les tâches qui se répètent, et les informations qui restent dispersées.",
          ]}
        />
        <div className="actions">
          <a className="btn" href={R.diagnostic}>
            Évaluer mon cabinet
          </a>
          <a className="btn ghost" href={R.demo}>
            Réserver une rencontre
          </a>
        </div>
        <p className="note">Gratuit, sans carte de crédit. Rapport sous 24 heures.</p>
        <p className="note note-faible">
          SAFE soutient la tenue, la vérification et la traçabilité du travail administratif. La
          responsabilité professionnelle demeure celle du cabinet.
        </p>
      </Recit>

      {/* La signature du fondateur : le portrait et le nom, à la même hauteur.
          C'est le seul portrait du site, il n'appelle pas de règle partagée. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .safe-vitrine .signature {
          margin-top: clamp(56px, 8vh, 104px);
          display: flex;
          align-items: center;
          gap: 20px;
          padding-top: 26px;
          border-top: 1px solid ${LINE};
        }
        .safe-vitrine .signature img {
          width: 96px;
          height: auto;
          flex: 0 0 auto;
          border-radius: 10px;
          object-fit: cover;
        }
        .safe-vitrine .signature .nom { font-family: var(--sans); font-size: 15.5px; color: ${INK}; }
        .safe-vitrine .signature .role { margin-top: 4px; font-family: var(--sans); font-size: 13.5px; color: ${MUTED}; }
        @media (min-width: 861px) { .safe-vitrine .signature img { width: 132px; } }
      `,
        }}
      />
    </PageShell>
  );
}
