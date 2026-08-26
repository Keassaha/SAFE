"use client";

/**
 * La page des questions fréquentes.
 *
 * ── Refonte du 2026-08-26 ───────────────────────────────────────────────────
 * Elle posait six questions OUVERTES, l'une sous l'autre, question à gauche et
 * réponse à droite. Six réponses dépliées font déjà un mur ; quinze en
 * feraient un que personne ne parcourt.
 *
 * Décision CEO : « je veux que la section question soit comme celle de la
 * landing page principale, mais avec un peu plus de questions et un call to
 * action si nécessaire ». Elle sert donc le MÊME accordéon que l'accueil,
 * depuis le même composant (./objections.tsx). On voit quinze intitulés au
 * lieu de quinze paragraphes, et on n'ouvre que ce qui nous concerne.
 *
 * AUCUNE QUESTION N'EST INVENTÉE. Chacune existait déjà : dans l'ancienne
 * page, dans l'accordéon de l'accueil, ou dans FAQ_TARIFICATION
 * (lib/tarification.ts). L'origine est notée en regard de chaque groupe.
 *
 * Les prix ne sont pas écrits en toutes lettres mais interpolés depuis
 * `lib/tarification.ts` : une grille change, et une réponse de FAQ qui garde
 * l'ancien montant est une promesse fausse.
 */

import React from "react";
import { PageShell, R } from "./shared";
import { Ouverture, Recit, Tete } from "./recit";
import { Objections, reglesObjections, type Objection } from "./objections";
import { TARIFICATION, prixFr } from "@/lib/tarification";

const F = TARIFICATION.fondateurs;

const FAQ: Objection[] = [
  /* ── Le produit ───────────────────── de l'accueil et de l'ancienne page ── */
  [
    "SAFE remplace-t-il mon logiciel comptable ?",
    "SAFE tient la comptabilité liée aux opérations du cabinet et prépare une information structurée. Le diagnostic permet de déterminer la place que doit conserver votre logiciel comptable actuel.",
  ],
  [
    "Est-ce que SAFE remplace mon adjointe juridique ?",
    [
      "Non. Votre adjointe connaît vos dossiers, vos clients et votre façon de travailler. SAFE lui donne un cadre pour garder l’information reliée, repérer les écarts et réduire les vérifications répétitives.",
      "L’adjointe reste le copilote du cabinet. SAFE soutient son travail.",
    ],
  ],
  [
    "Combien de temps faut-il pour commencer ?",
    "Nous configurons SAFE avec les renseignements réels de votre cabinet et nous vous accompagnons pendant la prise en main. Le délai dépend du nombre de dossiers et de la qualité des données à reprendre. Après une courte rencontre, nous vous donnons une estimation adaptée à votre situation.",
  ],
  [
    "Qu’est-ce qui est fait par vous, et qu’est-ce qui reste à ma charge ?",
    "La mise en route est faite par nous : paramétrage du cabinet, reprise de vos dossiers actifs, de vos clients et de vos soldes de fidéicommis, et la formation de votre adjointe. Vous n’avez pas de formulaires à remplir ni de données à ressaisir : vous nous envoyez ce que vous avez, dans l’état où c’est.",
  ],
  [
    "Qu’est-ce qui est compris dans la configuration ?",
    "L’audit de votre pratique, le choix du cadre adapté à votre domaine, puis les ajustements de relances, de tableau de bord, de gabarits, d’onglets visibles et de permissions selon vos besoins. La configuration est comprise dès le palier Solo, sans frais d’installation.",
  ],
  [
    "Puis-je passer du palier Solo au palier Cabinet plus tard ?",
    "Oui, depuis vos paramètres. Vos données, dossiers, configurations et historique sont conservés, et le changement est immédiat.",
  ],

  /* ── Les données et la conformité ─── de l'accueil et de l'ancienne page ── */
  [
    "Mes données sont-elles en sécurité ?",
    [
      "Votre cabinet demeure propriétaire de ses données. Elles sont hébergées au Canada, chiffrées en transit et au repos, avec des contrôles d’accès et un journal d’audit.",
      "Si vous quittez SAFE, vous pouvez récupérer vos données dans les formats d’export offerts.",
    ],
  ],
  [
    "Où sont hébergées les données ?",
    "Au Canada. Vos données ne quittent pas le territoire canadien. Les accès sont contrôlés selon les rôles et les responsabilités de chaque membre du cabinet.",
  ],
  [
    "À qui appartiennent mes données ?",
    "À votre cabinet. Vous conservez la propriété de vos données et pouvez les exporter dans les formats offerts.",
  ],
  [
    "SAFE garantit-il ma conformité au Barreau ?",
    [
      "Non. La responsabilité professionnelle demeure celle de l’avocate ou de l’avocat.",
      "SAFE est conçu pour soutenir les exigences de tenue du fidéicommis au Québec (Barreau du Québec, règlement B-1, r. 5) et en Ontario (LSO By-Law 9). Il facilite le rapprochement à trois sources, signale les écarts et aide à préparer les rapports offerts dans le produit. Le périmètre couvert pour votre juridiction est confirmé pendant le diagnostic.",
    ],
  ],

  /* ── L'engagement et le prix ──────────────── de FAQ_TARIFICATION et v2 ── */
  [
    "Dois-je signer un contrat annuel ?",
    "Non. Les forfaits réguliers sont mensuels.",
  ],
  [
    "Que se passe-t-il si je change d’avis ?",
    `L’abonnement est mensuel, résiliable en tout temps, sans pénalité et sans justification à donner. Si dans les ${F.garantieJours} premiers jours vous jugez que SAFE ne vous apporte rien, les mois payés vous sont remboursés. Vos données restent les vôtres et s’exportent quand vous le voulez.`,
  ],
  [
    "Comment fonctionne le tarif fondateur ?",
    `Vos ${F.dureeMois} premiers mois sont à ${F.premiereAnneeSolo} $ par mois pour une pratique individuelle et ${F.premiereAnneeCabinet} $ pour un cabinet avec adjointe. Ensuite votre tarif reste gelé à ${F.apresSolo} $ ou ${F.apresCabinet} $ tant que l’abonnement demeure actif, au lieu de ${prixFr(TARIFICATION.paliers.solo.prix)} $ ou ${prixFr(TARIFICATION.paliers.cabinet.prix)} $. Votre coût ne double pas au treizième mois.`,
  ],
  [
    "Pourquoi seulement dix places ?",
    `Parce que la mise en route de chaque cabinet est faite à la main, et qu’il n’est pas possible d’en faire plus de ${TARIFICATION.fondateurs.miseEnRouteParMois} par mois sans bâcler. ${F.placesTotal} cabinets représentent cinq mois de travail. Les places s’ouvrent au fur et à mesure, et le compteur affiché est le vrai.`,
  ],
  [
    "SAFE est une jeune entreprise. Pourquoi lui faire confiance ?",
    [
      "C’est une question légitime.",
      "SAFE a été construit à partir du travail réel d’un cabinet, puis vérifié avec ses utilisatrices et utilisateurs. Nous préférons vous montrer ce qui fonctionne aujourd’hui, ce qui est encore en développement et comment vos données sont protégées.",
      "Pendant la rencontre, vous pouvez voir le produit sur un cas concret et poser toutes vos questions avant de décider.",
    ],
  ],
];

export default function FaqPage() {
  return (
    <PageShell>
      <Ouverture
        titre="Vos questions, avant même de nous parler"
        dire={[
          `Les ${FAQ.length} qu’on nous pose le plus.`,
          "Ouvrez celle qui vous concerne. Les autres se répondent en rencontre, sur votre cas.",
        ]}
      />

      <Recit id="questions" socle>
        <Objections entrees={FAQ} />
      </Recit>

      {/* L'appel à l'action de la page. Il tenait déjà ici et ne bouge pas :
          une page de quinze questions doit finir par un geste, sinon elle
          renvoie le lecteur à la barre de navigation. */}
      <Recit>
        <Tete
          titre="Il en reste une ?"
          dire={["Posez-la pendant la rencontre.", "Vingt minutes, sur vos dossiers, sans engagement."]}
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

      <style dangerouslySetInnerHTML={{ __html: reglesObjections(".safe-vitrine") }} />
    </PageShell>
  );
}
