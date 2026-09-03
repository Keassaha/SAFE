"use client";

/**
 * La page publique des tarifs.
 *
 * ── Refonte de la section régulière, 2026-09-03 ──────────────────────────────
 * Seule la PREMIÈRE section change. Les fondateurs, les questions et la suite
 * gardent leur composition.
 *
 * Elle annonçait trois colonnes, Mensuel, Annuel et Fondateur, chacune portant
 * ses deux forfaits : six cartes pour deux offres, et le tarif fondateur
 * annoncé à côté du tarif régulier alors qu'il se dit deux sections plus bas.
 * On ne pouvait plus répondre à « combien coûte Cabinet ? » sans lire six
 * montants.
 *
 * Elle porte désormais DEUX forfaits, et un sélecteur de période au-dessus.
 * La composition vient d'ElevenLabs, sa matière est entièrement SAFE : voir
 * l'en-tête de `./forfaits.tsx`.
 *
 * Les prix viennent de `lib/tarification.ts`, jamais d'une chaîne écrite ici.
 */

import React from "react";
import { PageShell, R } from "./shared";
import { Ouverture, Recit, Tete } from "./recit";
import { CartesTarifs, CarteFondateurs } from "./forfaits";
import { Objections, reglesObjections, type Objection } from "./objections";
import { reglesTarifs } from "./forfaits-regles";
import { TARIFICATION } from "@/lib/tarification";

const FOND = TARIFICATION.fondateurs;

/* ── Les questions ────────────────────────────────────────────────────────────
   Elles étaient servies en grille ouverte à deux colonnes, propre à cette page :
   question à 24 px à gauche, réponse à droite, tout déplié. L'accueil, lui, les
   replie en accordéon depuis longtemps, et /faq l'a rejoint le 2026-08-26 sur la
   même demande, « je veux que la section question soit comme celle de la landing
   page principale ». La tarification était la dernière à diverger.

   Mesuré avant bascule : question à 24 px contre 14, ligne de 90 px contre 57,
   bloc à 72 px sous le titre contre 32. Trois écarts pour la même chose.

   Le composant est partagé et sa feuille prend la portée en paramètre : les
   trois pages servent maintenant exactement les mêmes règles. */
const QUESTIONS: readonly Objection[] = [
  [
    "Est-ce que SAFE vaut son prix ?",
    "Comparez le coût à ce que vous consacrez aujourd’hui aux vérifications, aux doubles saisies et à la préparation des rapprochements. L’évaluation gratuite vous aidera à faire ce calcul avec votre réalité.",
  ],
  [
    "Quelle différence entre le mensuel et l’annuel ?",
    "Le forfait mensuel est facturé chaque mois et résiliable en tout temps. Le forfait annuel est facturé une fois pour douze mois, à un tarif mensuel plus bas : l’économie représente un peu plus de deux mois sur l’année.",
  ],
  [
    "À qui appartiennent mes données ?",
    "À votre cabinet. Vous pouvez les exporter dans les formats offerts par SAFE.",
  ],
  [
    "Qu’est-ce que le tarif fondateur ?",
    "Les dix premiers cabinets paient moins pendant douze mois, puis gardent un tarif gelé qui ne remonte pas au prix régulier.",
  ],
];

export default function TarificationPage() {
  return (
    <PageShell>
      {/* 1. Le titre, 2. la phrase. Alignés à gauche par le contrat du site :
          une page qui centrerait son titre au-dessus de deux colonnes centrées
          n'aurait plus une seule ligne de fuite verticale. */}
      <Ouverture
        titre="Une tarification simple, selon la taille de votre cabinet"
        dire={[
          "Choisissez Solo si vous travaillez seul, ou Cabinet si votre équipe utilise SAFE avec vous.",
          "La mise en route est comprise dans les deux forfaits.",
        ]}
      />

      {/* 3. le sélecteur, 4-7. les deux colonnes, 8. la note. Tout vient du
          même composant : la période commande les deux prix, elle ne peut pas
          vivre ailleurs qu'avec eux.

          Aucun titre de section ici. L'ouverture vient de dire ce qu'on
          regarde, deux lignes plus haut : un second titre au-dessus des cubes
          répéterait la même chose et repousserait les prix d'un écran. */}
      <Recit id="forfaits">
        <CartesTarifs action={R.diagnostic} />
      </Recit>

      {/* L'offre fondatrice.
          ── Renversement du 2026-09-03 ────────────────────────────────────────
          Ce bloc refusait le vert. Le commentaire disait : « Son emphase vient
          du socle, pas d'un panneau vert sombre : sur une page qui tient sur un
          seul canevas, une boîte de couleur se lit comme une publicité
          rapportée. » Le CEO a tranché l'inverse en montrant la carte du
          parcours de l'accueil.

          L'ancien argument valait pour un encart POSÉ au milieu d'une page de
          prose. Ce n'en est plus un : la carte porte les cinq engagements et le
          geste, elle referme la section, et c'est la dernière chose qu'on lit
          avant de cliquer. Le raisonnement n'est pas abandonné, il ne s'applique
          plus au même objet. */}
      <Recit id="fondateurs" socle>
        <Tete
          titre="Devenez fondateurs"
          dire={[
            "Nous cherchons des cabinets qui veulent utiliser SAFE et contribuer à son amélioration.",
            "Pas seulement des clients, des partenaires de développement.",
          ]}
        />

        {/* « Ce que nous cherchons » a été retiré le 2026-09-03 sur demande du
            CEO. Ses quatre puces répétaient en prose ce que le chapeau
            au-dessus dit déjà en deux lignes, et elles repoussaient la carte
            d'un demi-écran.

            La contrepartie qu'il avait demandée le même jour, l'envie déclarée
            de faire avancer le produit, n'est PAS perdue avec elles : elle est
            passée dans la note ci-dessous, à côté de l'autre engagement qu'on
            demande. C'est sa place : ce qu'on demande se dit une fois. */}
        <CarteFondateurs action={R.demo} />

        <p className="note">
          En retour, nous demandons deux choses : l’envie de faire avancer l’outil avec nous et de
          nous dire ce qui accroche, puis trente minutes par mois les trois premiers mois et une
          fois par trimestre ensuite.
        </p>
        <p className="note note-faible">
          Chaque mise en route est faite à la main, ce qui nous limite à {FOND.miseEnRouteParMois}{" "}
          cabinets par mois. C’est pour cela qu’il y a {FOND.placesTotal} places et pas trente.
        </p>
      </Recit>

      <Recit id="questions">
        <Tete
          titre="Une décision réversible"
          dire={[
            "Le forfait mensuel se résilie en tout temps.",
            "Vous récupérez vos données dans un format lisible.",
          ]}
        />
        <Objections entrees={QUESTIONS} />
      </Recit>

      {/* La section de clôture « Le prix se décide après avoir vu » a été
          retirée le 2026-09-03 sur demande du CEO. Elle reprenait une troisième
          fois le geste déjà porté par le bouton de chaque forfait et par celui
          de la carte fondateurs, et la page se terminait donc sur une redite.

          Les deux routes qu'elle ouvrait restent atteignables depuis la page :
          l'évaluation par les boutons des forfaits, la rencontre par « Parler à
          quelqu'un » dans la barre du site. */}

      {/* Les règles des forfaits et du panneau, à la portée de la vitrine. Sans
          cette ligne, la page rend le bon balisage sans aucune de ses mises en
          forme : la feuille ne vit que là où on la pose. */}
      <style dangerouslySetInnerHTML={{ __html: reglesTarifs(".safe-vitrine") }} />
      {/* Les questions repliées, mêmes règles qu'à l'accueil et que /faq. Sans
          cette ligne, l'accordéon rend son balisage sans aucune mise en forme :
          la feuille ne vit que là où on la pose. */}
      <style dangerouslySetInnerHTML={{ __html: reglesObjections(".safe-vitrine") }} />
    </PageShell>
  );
}
