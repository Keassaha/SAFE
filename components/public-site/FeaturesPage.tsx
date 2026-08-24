"use client";

/**
 * SAFE Cabinet — les fonctions essentielles.
 *
 * La page raconte une journée de cabinet, dans l'ordre où le travail se fait :
 * ce qui demande une intervention aujourd'hui, le dossier qui porte le
 * contexte, le travail qui devient facturable, l'argent qui circule, et les
 * fonds des clients qu'il faut vérifier avant de certifier.
 *
 * ── Refonte du 2026-08-23 ───────────────────────────────────────────────────
 * Deux choses ont changé, et elles vont ensemble.
 *
 * 1. La page passe au contrat de section du site (voir ./recit.tsx) : titre à
 *    gauche, UNE phrase à droite, la preuve en dessous sur toute la largeur.
 *    Elle portait huit compositions différentes, six exergues numérotés en
 *    mono et quatre largeurs de colonne.
 *
 * 2. Les maquettes dessinées à la main cèdent la place aux CAPTURES de
 *    l'application. Une maquette vieillit en silence : elle ne suit ni la
 *    palette, ni les libellés, ni les chiffres du produit. Les cinq écrans
 *    montrés ici sont ceux du Cabinet Demo, pris sur la version courante, et
 *    ils vivent dans une fenêtre qu'on pilote : le cadre ne bouge pas, ce qui
 *    change est l'écran qu'on regarde.
 *
 * La règle de fond ne change pas : une affirmation par écran réel. Ce qui
 * n'est pas atteignable depuis l'application n'est pas annoncé ici. C'est
 * pourquoi la relance des factures reste absente : `createReminder` existe
 * dans lib/services/billing/reminder-service.ts et n'est appelé par aucun
 * écran. Les factures en retard restent montrées, parce qu'elles sont
 * visibles ; leur relance ne l'est pas, parce qu'elle ne part pas.
 */

import React from "react";
import { PageShell, R } from "./shared";
import {
  Ouverture,
  Recit,
  Tete,
  Capture,
  FenetreInteractive,
  IndexNumerote,
  ListeNumerotee,
  type EcranProduit,
} from "./recit";

/* Les cinq écrans, dans l'ordre de la journée. Chacun est une capture du
   Cabinet Demo prise à trois fois la densité : la vitrine les affiche à
   1 236 px de large, un écran à haute densité en demande donc 2 472. */
const ECRANS: readonly EcranProduit[] = [
  {
    cle: "aujourdhui",
    onglet: "Aujourd’hui",
    src: "/images/accueil/tableau-de-bord.png",
    alt: "Tableau de bord de SAFE : ce qui demande une intervention, les montants à surveiller et l’état du fidéicommis.",
  },
  {
    cle: "dossiers",
    onglet: "Dossiers",
    src: "/images/accueil/dossiers.png",
    alt: "Registre des dossiers de SAFE : le client, le domaine, l’état et la prochaine échéance de chaque affaire.",
  },
  {
    cle: "temps",
    onglet: "Temps",
    src: "/images/accueil/fiche-de-temps.png",
    alt: "Fiche de temps de SAFE : les heures du mois, le montant non facturé et les entrées avec leur taux horaire.",
  },
  {
    cle: "facture",
    onglet: "Facture",
    src: "/images/accueil/facture.png",
    alt: "Aperçu d’une facture de SAFE : le total, la part déjà payée, le solde dû et l’échéance.",
  },
  {
    cle: "fideicommis",
    onglet: "Fidéicommis",
    src: "/images/accueil/comptes-fideicommis.png",
    alt: "Comptes en fidéicommis de SAFE : solde total détenu, dépôts et retraits du mois, surveillance des soldes.",
  },
];

const CHAINE = [
  ["Le temps se consigne au chronomètre ou après le travail.", "Temps"],
  ["Les débours et les dépenses refacturables se rattachent au même dossier.", "Débours"],
  ["La facture reprend l’un et l’autre, taxes comprises.", "Facturation"],
  ["Le paiement reçu se rattache à sa facture et met à jour le solde.", "Paiements"],
  ["L’écriture rejoint les journaux du cabinet.", "Comptabilité"],
] as const;

const EGALEMENT = [
  ["01", "Équipe et permissions"],
  ["02", "Documents et cartables par domaine"],
  ["03", "Rapports administratifs et financiers"],
  ["04", "Vérification de l’identité et des conflits"],
  ["05", "Importation de données"],
  ["06", "Interface en français et en anglais"],
  ["07", "Paramètres de facturation du cabinet"],
  ["08", "Rapprochement à trois sources"],
] as const;

export default function FonctionnalitesPage() {
  return (
    <PageShell>
      <Ouverture
        titre="L’administration de votre cabinet, reliée de bout en bout"
        dire={[
          "Un même système pour les dossiers, le temps, la facturation et le fidéicommis.",
          "L’équipe voit ce qui avance, ce qui attend et ce qui doit être vérifié.",
        ]}
      />

      {/* La fenêtre pilotable ouvre la page. C'est la seule chose qui compte
          ici : cinq écrans réels, choisis par le visiteur, dans un cadre qui
          ne bouge pas. */}
      <Recit id="ecrans" socle>
        <Tete
          titre="Cinq écrans, une seule application"
          dire={["Choisissez celui que vous voulez voir.", "Ce sont les écrans du produit, pas des dessins."]}
        />
        <FenetreInteractive id="ecrans-safe" ecrans={ECRANS} />
      </Recit>

      <Recit id="journee">
        <Tete
          titre="Ce qui demande votre attention remonte au même endroit"
          dire={[
            "Échéances, factures en attente, opérations à vérifier.",
            "L’équipe voit ce qui doit être traité maintenant, sans ouvrir chaque dossier pour le découvrir.",
          ]}
        />
      </Recit>

      <Recit id="dossiers" socle>
        <Tete
          titre="Chaque affaire conserve son histoire et ses prochaines étapes"
          dire={[
            "Clients, parties, documents, échéances, notes, temps et débours restent reliés au dossier.",
            "À l’ouverture, SAFE peut préparer une structure adaptée au domaine de pratique.",
          ]}
        />
        <Capture
          src="/images/accueil/dossiers.png"
          alt="Registre des dossiers de SAFE : le client, le domaine, l’état et la prochaine échéance de chaque affaire."
        />
      </Recit>

      <Recit id="chaine">
        <Tete
          titre="Le travail est inscrit une fois, au moment où il se fait"
          dire={[
            "Cinq maillons, une seule saisie.",
            "Rien n’est retranscrit à la fin du mois, parce que rien n’a été saisi deux fois.",
          ]}
        />
        <ListeNumerotee entrees={CHAINE} />
      </Recit>

      <Recit id="fideicommis" socle>
        <Tete
          titre="Ce qui doit concorder est vérifié avant d’être certifié"
          dire={[
            "Le relevé bancaire, le registre et les soldes par dossier sont rapprochés dans une même vue.",
            "Un écart reste visible jusqu’à sa résolution, et les corrections s’ajoutent au journal sans effacer l’écriture d’origine.",
          ]}
        />
        <Capture
          src="/images/accueil/comptes-fideicommis.png"
          alt="Comptes en fidéicommis de SAFE : solde total détenu, dépôts et retraits du mois, surveillance des soldes."
        />
        <p className="note">
          SAFE soutient la tenue, la vérification et la traçabilité. La responsabilité
          professionnelle demeure celle du cabinet.
        </p>
      </Recit>

      <Recit id="egalement">
        <Tete
          titre="Également dans SAFE Cabinet"
          dire={[
            "Huit fonctions nommées, jamais décrites.",
            "Ce qui n’est pas encore utilisable dans l’application n’est pas annoncé ici.",
          ]}
        />
        <IndexNumerote entrees={EGALEMENT} />
      </Recit>

      <Recit id="limites">
        <Tete
          titre="Le système soutient le travail, votre équipe garde le jugement"
          dire={[
            "SAFE ne remplace ni l’avocate, ni la personne qui connaît le cabinet, ni le comptable.",
            "Il organise l’information, prépare le travail et rend visible ce qui demande une intervention.",
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
          Les écrans de cette page sont des captures de SAFE, prises sur un cabinet de
          démonstration : les dossiers et les montants qu’on y lit sont fictifs, l’interface est
          celle du logiciel.
        </p>
      </Recit>
    </PageShell>
  );
}
