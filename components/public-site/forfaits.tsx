"use client";

/**
 * Les forfaits SAFE, une seule fois pour tout le site public.
 *
 * L'accueil et /tarification annoncaient les MEMES deux prix dans deux
 * grammaires differentes : des cartes a coches sur l'accueil, des rangees
 * « nom / phrase / prix a droite » sur la page de tarification. Deux
 * presentations pour un seul prix, et deux endroits a corriger a chaque
 * changement de grille. Demande CEO du 2026-08-26 : « un modele identique
 * pour la page de tarif ».
 *
 * Le modele est celui releve sur cursor.com/pricing : le nom, le prix en
 * grand avec son unite en petit, ce que le forfait contient en liste a
 * coches, un bouton pleine largeur au bas. Le second palier ne repete pas le
 * premier, il dit « tout ce qui est compris dans Solo, plus ».
 *
 * Les prix viennent de `lib/tarification.ts`, jamais d'une chaine ecrite ici.
 * Le palier Cabinet vaut 149,99 $ et non 149 $ : c'est ce que Stripe facture
 * reellement, et un prix arrondi sur la vitrine deviendrait un ecart des la
 * premiere facture.
 */

import React from "react";
import { TARIFICATION, prixFr } from "@/lib/tarification";

/* Ce que le palier Solo comprend. Six lignes, toutes verifiables a l'ecran. */
export const COMPRIS_FORFAIT: string[] = [
  "Fidéicommis rapproché à trois sources",
  "Dossiers, clients et parties reliés",
  "Temps et débours prêts à facturer",
  "Facturation avec taxes et suivi des paiements",
  "Configuration initiale avec votre équipe",
  "Interface en français et en anglais",
];

/* Ce que le palier Cabinet ajoute. Deux entrees seulement, et les deux sont
   verifiables dans le produit : les roles vivent dans lib/auth/permissions.ts. */
export const EN_PLUS_CABINET: string[] = [
  "L'accès pour votre adjointe et votre équipe",
  "Des droits par rôle : avocate, adjointe, comptabilité",
];

/** Les deux cartes, au modele de cursor.com/pricing. */
export function CartesForfaits({ action }: { action: string }) {
  return (
    <div className="forfaits">
      <article className="forfait">
        <p className="f-nom">Solo</p>
        <p className="f-prix">
          {prixFr(TARIFICATION.paliers.solo.prix)} $<small>/ mois</small>
        </p>
        <p className="f-dit">
          Pour l&apos;avocate ou l&apos;avocat qui exerce seul. Fidéicommis, dossiers, temps et
          facturation dans un même abonnement.
        </p>
        <ul className="f-liste">
          {COMPRIS_FORFAIT.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <a className="btn ghost f-action" href={action}>
          Évaluer mon cabinet
        </a>
      </article>

      <article className="forfait">
        <p className="f-nom">Cabinet</p>
        <p className="f-prix">
          {prixFr(TARIFICATION.paliers.cabinet.prix)} $<small>/ mois</small>
        </p>
        <p className="f-dit">Tout ce qui est compris dans Solo, plus :</p>
        <ul className="f-liste">
          {EN_PLUS_CABINET.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <a className="btn f-action" href={action}>
          Évaluer mon cabinet
        </a>
      </article>
    </div>
  );
}

/**
 * Le programme des fondateurs.
 *
 * Il se dit APRES les deux forfaits, jamais a la place : un prix reduit
 * annonce avant le prix normal fait douter du second.
 *
 * Il tenait en une phrase qui portait QUATRE NOMBRES a la file, 50, 75, 79 et
 * 119, sans jamais dire lequel va avec quel forfait. Le lecteur devait deviner
 * que l'ordre des prix suivait l'ordre des paliers. Le CEO l'a signale le
 * 2026-08-26 : « pas clair ».
 *
 * Quatre prix qui se croisent avec deux paliers et trois periodes, c'est un
 * tableau, pas une phrase. Il est ecrit comme tel, en chiffres alignes, et il
 * porte la colonne du prix regulier : sans elle, on lit une remise sans savoir
 * sur quoi.
 *
 * Le compteur de places est le vrai. Il n'est jamais gonfle.
 */
export function PanneauFondateurs({ titre = true }: { titre?: boolean } = {}) {
  const f = TARIFICATION.fondateurs;
  return (
    <div className="fondateurs-bloc">
      {/* Sur /tarification, la section s'appelle deja « Cabinets fondateurs » :
          un panneau qui se renomme sous son propre titre fait lire deux fois
          la meme chose. */}
      {titre ? <p className="f-nom">Programme des fondateurs</p> : null}
      <p className="fb-p">
        Les {f.placesTotal} premiers cabinets paient moins pendant {f.dureeMois} mois. Ensuite leur
        tarif reste gelé : il ne remonte pas au prix régulier.
      </p>
      <table className="fb-table">
        <thead>
          <tr>
            <th scope="col">Forfait</th>
            <th scope="col">Les {f.dureeMois} premiers mois</th>
            <th scope="col">Ensuite, gelé à</th>
            <th scope="col">Prix régulier</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Solo</th>
            <td>{f.premiereAnneeSolo} $</td>
            <td>{f.apresSolo} $</td>
            <td className="reg">{prixFr(TARIFICATION.paliers.solo.prix)} $</td>
          </tr>
          <tr>
            <th scope="row">Cabinet</th>
            <td>{f.premiereAnneeCabinet} $</td>
            <td>{f.apresCabinet} $</td>
            <td className="reg">{prixFr(TARIFICATION.paliers.cabinet.prix)} $</td>
          </tr>
        </tbody>
      </table>
      <p className="fb-cond">
        <b>
          {f.placesTotal - f.placesPrises} places sur {f.placesTotal}
        </b>{" "}
        encore ouvertes. Sortie libre à tout moment, et {f.garantieJours} jours pour changer
        d&apos;avis.
      </p>
    </div>
  );
}

/**
 * Les regles des cartes et du panneau, pour une portee donnee.
 *
 * L'accueil vit sous « .xc » et les pages ecrites sous « .safe-vitrine » :
 * la portee est un parametre pour que les deux servent exactement la meme
 * feuille.
 */
export function reglesForfaits(p: string): string {
  return `
  /* ── Les cartes de forfait ────────────────────────────────────────────────
     Modele releve sur cursor.com : le nom, le prix en grand avec son unite en
     petit, ce que le forfait contient en liste a coches, un bouton pleine
     largeur au bas. La carte se lit de haut en bas et se termine par le geste.

     Les cartes prennent leur hauteur NATURELLE. J'avais d'abord voulu les
     egaliser pour que les deux boutons tombent a la meme ligne, en me disant
     que deux hauteurs differentes se liraient comme deux rangs. Mesure faite,
     Solo porte six lignes et Cabinet deux : l'egalisation ouvrait un vide de
     trois cents pixels au milieu de la seconde carte, et un vide se lit comme
     une erreur, pas comme une egalite. Deux cartes de hauteurs differentes,
     elles, se lisent comme deux offres de contenus differents, ce qui est
     exactement le cas. */
  ${p} .forfaits {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(16px, 2vw, 26px);
    margin-top: clamp(24px, 3.2vh, 36px);
    /* Les cartes sont BRIDEES en largeur. A pleine page, chacune faisait plus
       de cinq cents pixels : Cabinet, qui ne porte que deux lignes, ouvrait
       sous lui un vide de la hauteur d'une carte, et la rangee se lisait comme
       une offre manquante. */
    max-width: 880px;
    align-items: start;
  }
  ${p} .forfait {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--si-border);
    border-radius: 14px;
    background: var(--si-surface);
    padding: clamp(22px, 2.6vw, 32px);
  }
  ${p} .f-nom {
    font-family: var(--sans);
    font-size: var(--t-explique);
    color: var(--si-ink);
  }
  ${p} .f-prix {
    font-family: var(--mono);
    font-size: var(--t-argument);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
    margin-top: 6px;
  }
  ${p} .f-prix small {
    font-family: var(--sans);
    font-size: var(--t-detail);
    color: var(--si-muted);
    margin-left: 6px;
  }
  ${p} .f-dit {
    margin-top: 14px;
    font-family: var(--sans);
    font-size: var(--t-explique);
    line-height: 1.55;
    color: var(--si-muted);
    max-width: 40ch;
  }
  ${p} .f-liste { list-style: none; margin: 18px 0 0; padding: 0; display: grid; gap: 9px; }
  ${p} .f-liste li {
    position: relative;
    padding-left: 24px;
    font-family: var(--sans);
    font-size: var(--t-explique);
    line-height: 1.45;
    color: var(--si-ink);
  }
  /* La coche est dessinee par deux bords, pas par un caractere : un « ✓ » est
     compte comme emoji par le standard, et son dessin change d'une fonte a
     l'autre. */
  ${p} .f-liste li::before {
    content: "";
    position: absolute;
    left: 2px;
    top: 0.42em;
    width: 9px; height: 5px;
    border-left: 1.6px solid var(--si-verified);
    border-bottom: 1.6px solid var(--si-verified);
    transform: rotate(-45deg);
  }
  /* Le bouton suit la liste, il n'est plus pousse au bas de la carte. */
  ${p} .f-action { margin-top: 22px; justify-content: center; }
  ${p} .forfait .btn { width: 100%; }

  /* Le programme des fondateurs. Un bloc, pas une troisieme carte : ce n'est
     pas un forfait de plus, c'est une condition sur les deux. */
  ${p} .fondateurs-bloc {
    margin-top: clamp(16px, 2vw, 26px);
    /* Meme bord droit que les cartes : deux blocs de largeurs differentes
       posés l'un sous l'autre se lisent comme deux colonnes decalees. */
    max-width: 880px;
    border: 1px solid rgb(var(--si-verified-rgb) / 0.28);
    border-radius: 14px;
    background: rgb(var(--si-verified-rgb) / 0.05);
    padding: clamp(20px, 2.4vw, 28px);
  }
  ${p} .fb-p {
    margin-top: 10px;
    font-family: var(--sans);
    font-size: var(--t-explique);
    line-height: 1.55;
    color: var(--si-body);
    max-width: 62ch;
  }
  /* Le tableau des prix fondateurs. Les montants sont a chasse fixe et en
     chiffres tabulaires : quatre prix qui ne s'alignent pas verticalement se
     comparent mal, et c'est precisement pour les comparer qu'ils sont la. */
  ${p} .fb-table {
    margin-top: clamp(18px, 2.2vw, 26px);
    width: 100%;
    max-width: 640px;
    border-collapse: collapse;
    font-family: var(--sans);
    font-size: var(--t-detail);
    text-align: right;
  }
  ${p} .fb-table th[scope="col"] {
    font-weight: 400;
    color: var(--si-muted);
    padding-bottom: 9px;
    border-bottom: 1px solid rgb(var(--si-verified-rgb) / 0.3);
  }
  ${p} .fb-table th[scope="row"] { font-weight: 400; color: var(--si-ink); }
  ${p} .fb-table th:first-child { text-align: left; }
  ${p} .fb-table td {
    font-family: var(--mono);
    font-variant-numeric: tabular-nums;
    color: var(--si-ink);
  }
  ${p} .fb-table th, ${p} .fb-table td { padding: 10px 0 10px clamp(14px, 2vw, 28px); }
  ${p} .fb-table tbody tr + tr th, ${p} .fb-table tbody tr + tr td {
    border-top: 1px solid rgb(var(--si-verified-rgb) / 0.18);
  }
  /* Le prix regulier est barre : c'est ce qu'on ne paie pas. */
  ${p} .fb-table .reg { color: var(--si-muted); text-decoration: line-through; }
  ${p} .fb-cond {
    margin-top: 16px;
    font-family: var(--sans);
    font-size: var(--t-detail);
    line-height: 1.55;
    color: var(--si-muted);
  }
  ${p} .fb-cond b { font-weight: 400; color: var(--si-verified); }
  @media (max-width: 900px) {
    ${p} .forfaits { grid-template-columns: 1fr; }
    /* Quatre colonnes de prix ne tiennent pas au pouce. Le tableau se lit en
       defilement horizontal dans son propre cadre, plutot que d'ecraser ses
       montants ou de pousser la page de cote. */
    ${p} .fondateurs-bloc { overflow-x: auto; }
    ${p} .fb-table { min-width: 460px; }
  }

`;
}
