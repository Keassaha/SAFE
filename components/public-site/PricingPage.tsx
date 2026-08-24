"use client";

/**
 * La page publique des tarifs.
 *
 * ── Refonte du 2026-08-23 ───────────────────────────────────────────────────
 * Elle portait une scène épinglée sur les frais cachés, une figure de facture
 * dessinée à la main, un rail de chapitres, deux cartes de forfait et un
 * encart vert sombre pour l'offre fondatrice : six compositions et trois
 * largeurs de colonne pour une page qui annonce deux prix.
 *
 * Elle passe au contrat de section du site (voir ./recit.tsx). L'emphase de
 * l'offre fondatrice ne vient plus d'un panneau sombre mais du SOCLE, comme
 * partout ailleurs : c'est la structure qui hiérarchise, pas la couleur.
 *
 * Les prix viennent de `lib/tarification.ts`, jamais d'une chaîne écrite ici.
 * Ils étaient en dur : la grille a changé le 2026-08-20 et cette page, qui est
 * LA page publique des tarifs, a continué d'annoncer l'ancien montant.
 *
 * Le palier Cabinet vaut 149,99 $ et non 149 $ : c'est ce que Stripe facture
 * réellement, et un prix arrondi sur la vitrine deviendrait un écart à la
 * première facture.
 */

import React from "react";
import { PageShell, R } from "./shared";
import { Ouverture, Recit, Tete, IndexNumerote, ListeNumerotee } from "./recit";
import { TARIFICATION, prixFr } from "@/lib/tarification";

const FOND = TARIFICATION.fondateurs;

const FORFAITS = [
  {
    nom: "Solo",
    prix: prixFr(TARIFICATION.paliers.solo.prix),
    detail:
      "Pour l’avocate ou l’avocat qui exerce seul. Fidéicommis, dossiers, temps et facturation dans un même abonnement.",
  },
  {
    nom: "Cabinet",
    prix: prixFr(TARIFICATION.paliers.cabinet.prix),
    detail:
      "Pour les petits cabinets qui travaillent en équipe. Tout ce qui est compris dans Solo, avec l’accès pour votre équipe.",
  },
];

const COMPRIS = [
  ["01", "Fidéicommis rapproché à trois sources"],
  ["02", "Dossiers, clients et parties reliés"],
  ["03", "Temps et débours prêts à facturer"],
  ["04", "Facturation avec taxes et suivi des paiements"],
  ["05", "Configuration initiale avec votre équipe"],
  ["06", "Interface en français et en anglais"],
] as const;

const FONDATEURS = [
  [
    "La mise en route est faite par nous : paramétrage, reprise de vos dossiers actifs et de vos soldes de fidéicommis, formation de votre adjointe.",
    "Mise en route",
  ],
  [
    "Un atelier chaque semaine avec les autres cabinets fondateurs, et vos questions traitées là.",
    "Atelier",
  ],
  [
    "Aucun engagement de durée. Dans les soixante premiers jours, les mois payés vous sont remboursés si SAFE ne vous apporte rien.",
    "Sortie libre",
  ],
  ["Vos données restent les vôtres et s’exportent quand vous le voulez.", "Vos données"],
  [
    "Avant de signer, vous recevez par écrit la liste de ce que SAFE ne fait pas encore.",
    "Sans angle mort",
  ],
] as const;

const QUESTIONS = [
  {
    q: "Est-ce que SAFE vaut son prix ?",
    r: "Comparez le coût à ce que vous consacrez aujourd’hui aux vérifications, aux doubles saisies et à la préparation des rapprochements. La rencontre de découverte vous aidera à faire ce calcul avec votre réalité.",
  },
  { q: "Y a-t-il un engagement annuel ?", r: "Non. Les forfaits réguliers sont mensuels." },
  {
    q: "À qui appartiennent mes données ?",
    r: "À votre cabinet. Vous pouvez les exporter dans les formats offerts par SAFE.",
  },
  {
    q: "Que se passe-t-il si je change d’avis ?",
    r: "L’abonnement est mensuel, résiliable en tout temps, sans pénalité et sans justification à donner. Vos données restent les vôtres et s’exportent quand vous le voulez.",
  },
];

export default function TarificationPage() {
  const placesRestantes = FOND.placesTotal - FOND.placesPrises;
  return (
    <PageShell>
      <Ouverture
        titre="Un prix clair, l’accompagnement compris"
        dire={[
          "La configuration initiale est incluse.",
          "Aucun frais d’installation ne s’ajoute, et aucun engagement de durée.",
        ]}
      />

      <Recit id="forfaits">
        <Tete
          titre="Deux forfaits, selon qui travaille dans le cabinet"
          dire={["Mensuels, résiliables en tout temps.", "Prix en dollars canadiens, taxes en sus."]}
        />
        {FORFAITS.map((f) => (
          <div className="plan" key={f.nom}>
            <div>
              <p className="name">{f.nom}</p>
              <p className="detail">{f.detail}</p>
            </div>
            <p className="price">
              {f.prix} $<small>/ mois</small>
            </p>
          </div>
        ))}
        <p className="note">
          Configuration initiale comprise. Le rattrapage comptable d’exercices antérieurs, lui,
          n’est jamais compris : il se chiffre à part, sur pièces.
        </p>
      </Recit>

      <Recit id="compris">
        <Tete
          titre="Ce que le prix couvre"
          dire={["Six choses, nommées.", "Il n’y a pas de module à ajouter ensuite."]}
        />
        <IndexNumerote entrees={COMPRIS} />
      </Recit>

      {/* L'offre fondatrice. Son emphase vient du socle, pas d'un panneau vert
          sombre : sur une page qui tient sur un seul canevas, une boîte de
          couleur se lit comme une publicité rapportée. */}
      <Recit id="fondateurs" socle>
        <Tete
          titre="Cabinets fondateurs"
          dire={[
            `${FOND.placesTotal} places, ${placesRestantes === 1 ? "une seule" : `${placesRestantes}`} encore libre${placesRestantes > 1 ? "s" : ""}.`,
            "Pour des cabinets qui veulent utiliser SAFE et contribuer directement à son amélioration.",
          ]}
        />

        <div className="plan">
          <div>
            <p className="name">Les {FOND.dureeMois} premiers mois</p>
            <p className="detail">
              Pratique individuelle, puis cabinet avec adjointe. Ensuite le tarif fondateur reste
              gelé à {FOND.apresSolo} $ ou {FOND.apresCabinet} $ tant que l’abonnement demeure
              actif : votre coût ne double pas au treizième mois.
            </p>
          </div>
          <p className="price">
            {FOND.premiereAnneeSolo} $<small>ou {FOND.premiereAnneeCabinet} $ / mois</small>
          </p>
        </div>

        <ListeNumerotee entrees={FONDATEURS} />

        <p className="note">
          En retour, nous demandons trente minutes par mois les trois premiers mois, puis une fois
          par trimestre, pour que vous nous disiez ce qui bloque.
        </p>
        <p className="note note-faible">
          Chaque mise en route est faite à la main, ce qui nous limite à {FOND.miseEnRouteParMois}{" "}
          cabinets par mois. C’est pour cela qu’il y a {FOND.placesTotal} places et pas trente.
        </p>

        <div className="actions">
          <a className="btn" href={R.demo}>
            Vérifier s’il reste une place
          </a>
        </div>
      </Recit>

      <Recit id="questions">
        <Tete
          titre="Une décision réversible"
          dire={[
            "Les forfaits réguliers sont mensuels.",
            "Vous mettez fin à l’abonnement selon les modalités prévues et récupérez vos données.",
          ]}
        />
        <div className="liste-q">
          {QUESTIONS.map((item) => (
            <div className="q" key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.r}</p>
            </div>
          ))}
        </div>
      </Recit>

      <Recit id="suite">
        <Tete
          titre="Le prix se décide après avoir vu"
          dire={[
            "Commencez par l’évaluation de votre organisation administrative.",
            "Elle est gratuite, et elle dit ce que SAFE changerait chez vous.",
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
      </Recit>
    </PageShell>
  );
}
