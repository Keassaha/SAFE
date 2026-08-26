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
 *
 * ── Le récit du 2026-08-25 ──────────────────────────────────────────────────
 * La page racontait déjà la bonne histoire, dans le bon ordre. Ce qui manquait
 * n'était pas du contenu : c'était une voix et un repère. Sept blocs bâtis
 * pareil, dont les titres de section pesaient exactement autant que le titre
 * de la page, et personne qui parle.
 *
 * Trois gestes, aucun sur le fond. Chaque section devient un CHAPITRE numéroté.
 * Son titre descend d'un cran (`--t-chapitre`), pour céder le pas au titre de
 * la page. Et la phrase qui porte le chapitre passe entre guillemets, dans le
 * serif.
 *
 * Une seule citation par chapitre, jamais deux. Des guillemets attribuent la
 * phrase à quelqu'un, et ce quelqu'un signe à la fin : citer aussi les phrases
 * de produit reviendrait à lui faire dire ce qu'il n'a pas dit. La thèse est
 * citée, le reste redevient de la prose.
 *
 * La section « fin » n'est pas un chapitre : c'est l'appel, après le récit.
 *
 * Les deux socles gris tombent avec la colonne vertébrale : un fond différent
 * dit « autre chose », or « application » et « fondateur » sont les chapitres
 * 03 et 06 de la même histoire. Un seul sol, du premier chapitre au dernier.
 */

import React from "react";
import Image from "next/image";
import { PageShell, R, INK, MUTED, LINE } from "./shared";
import { Ouverture, Recit, Tete, Chapitre, RecitChapitres, ListeNumerotee, IndexNumerote } from "./recit";

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

/**
 * Les six chapitres, dans l'ordre du récit. Le résumé les lit d'ici.
 *
 * Le troisième champ nomme le symbole. Les formes vivent dans `./recit`, pas
 * ici : deux d'entre elles se répondent (les traits qui ne se rejoignent pas
 * du constat, les carrés qui se touchent de l'application) et cette réponse
 * se perdrait si chaque page redessinait les siennes.
 */
const CHAPITRES = [
  ["01", "Le constat", "ruptures"],
  ["02", "Le fichier", "tableur"],
  ["03", "L’application", "registres"],
  ["04", "La suite", "satellites"],
  ["05", "La méthode", "temps"],
  ["06", "La personne", "personne"],
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

      <RecitChapitres titre="À propos" chapitres={CHAPITRES}>
        <Chapitre
          rang="01"
          nom="Le constat"
          titre="Le travail juridique avançait, l’administration suivait difficilement"
          cite="Trois ruptures revenaient chaque mois."
          prose="Aucune ne venait d’un manque d’effort."
        >
          <ListeNumerotee entrees={RUPTURES} />
        </Chapitre>

        <Chapitre
          rang="02"
          nom="Le fichier"
          titre="La première version de SAFE était un fichier Excel"
          cite="Il ne s’agissait pas de construire une entreprise technologique."
          prose={[
            "Il fallait rassembler une comptabilité éparpillée et rendre le travail plus facile à suivre.",
            "À mesure que les tâches se sont reliées, le fichier est devenu un système.",
          ]}
        />

        <Chapitre
          rang="03"
          nom="L’application"
          titre="Le fichier est devenu SAFE Cabinet"
          cite="Six registres, un seul contexte."
          prose={[
            "Une information inscrite pendant le travail reste disponible pour les étapes suivantes.",
            "Le dossier nourrit la facture, le paiement met à jour la créance.",
          ]}
        >
          <IndexNumerote entrees={REGISTRES} />
          <p className="chute" style={{ marginTop: "clamp(24px, 3vh, 40px)" }}>
            Le produit a changé. L’idée, non : le logiciel doit comprendre le cabinet, pas
            l’inverse.
          </p>
        </Chapitre>

        <Chapitre
          rang="04"
          nom="La suite"
          titre="Un système central, des outils autonomes"
          cite="SAFE ne s’arrête plus à une seule application."
          prose={[
            "SAFE Cabinet tient le travail quotidien.",
            "Les Outils SAFE règlent une tâche précise, sans adopter toute l’application.",
          ]}
        >
          <div className="actions">
            <a className="btn ghost" href={R.fonctionnalites}>
              Découvrir SAFE Cabinet
            </a>
          </div>
        </Chapitre>

        <Chapitre
          rang="05"
          nom="La méthode"
          titre="Comprendre avant de construire"
          cite="Quatre temps, dans cet ordre."
          prose="Aucune capacité n’est annoncée avant d’être utilisable."
        >
          <ListeNumerotee entrees={ETAPES} />
        </Chapitre>

        {/* La personne, à la fin. Le portrait vit ici, avec la signature : en
            haut de page il concurrençait le titre, et on ne cherche pas qui
            parle avant d'avoir lu ce qui est dit. */}
        <Chapitre
          rang="06"
          nom="La personne"
          titre="Une expérience administrative appliquée au monde juridique"
          cite="Je suis Jérémie Tiahou, formé en administration et en comptabilité de petite entreprise."
          prose={[
            "Je n’ai pas commencé avec l’ambition de créer un autre logiciel juridique.",
            "J’ai commencé avec un problème à résoudre, et c’est encore de cette manière que SAFE est construit.",
          ]}
        >
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
        </Chapitre>
      </RecitChapitres>

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
        /* La signature rentre dans l'echelle du recit : le nom est du CORPS,
           le role est un REPERE, au meme rang que « Chapitre 01 » ou que les
           libelles de droite des listes. Elle portait 15 px et 13 px, deux
           tailles qui n'existaient nulle part ailleurs sur la page. */
        .safe-vitrine .signature .nom { font-family: var(--sans); font-size: var(--t-corps); color: ${INK}; }
        .safe-vitrine .signature .role {
          margin-top: 5px;
          font-family: var(--mono);
          font-size: var(--t-menu);
          letter-spacing: 0.11em;
          text-transform: uppercase;
          color: ${MUTED};
        }
        @media (min-width: 861px) { .safe-vitrine .signature img { width: 132px; } }
      `,
        }}
      />
    </PageShell>
  );
}
