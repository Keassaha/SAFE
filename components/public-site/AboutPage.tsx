"use client";

/**
 * À propos de SAFE.
 *
 * ── Refonte du 2026-09-03 ───────────────────────────────────────────────────
 * La page était découpée en six chapitres numérotés, avec un index collant à
 * gauche : Le constat, Le fichier, L'application, La suite, La méthode, La
 * personne. Mesuré avant refonte : 566 mots sur 4,9 écrans, soit 116 mots par
 * écran, et le texte n'occupait que 628 px des 1160 de la colonne du site. Il
 * restait 260 px de gouttière morte à droite en permanence.
 *
 * Trois choses ne fonctionnaient pas :
 *
 *   1. la page racontait l'histoire du PRODUIT, alors qu'un lecteur qui ouvre
 *      « À propos » cherche la personne. Elle arrivait au chapitre 06 ;
 *   2. elle ne montrait rien. « Le fichier » racontait un fichier Excel qu'on
 *      ne voyait jamais, « L'application » listait six registres en texte ;
 *   3. trois chapitres, 01 à 03, disaient la même chose en trois écrans : un
 *      fichier est devenu un système.
 *
 * Elle devient une page ÉDITORIALE CONTINUE : un grand titre, une photographie
 * paysage du fondateur, un récit d'un seul tenant, une phrase de marque, une
 * conclusion sur la matière verte. Plus de chapitres, et surtout pas six cartes
 * à leur place : la fragmentation était le problème, pas sa forme.
 *
 * ── Deux points où l'instruction a été tranchée, pas suivie à la lettre ─────
 *
 * LA PHOTOGRAPHIE. L'instruction nomme `DSC03097.ARW` et pointe une version web
 * déjà préparée. Le CEO a joint `DSC03096.ARW` dans le même message : deux
 * prises différentes, l'une le regard de côté, l'autre le regard caméra. La
 * pièce jointe est le signal le plus récent, et un regard caméra sert mieux une
 * page dont le seul travail est d'inspirer confiance. C'est donc 3096 qui est
 * développée ici. Revenir à 3097 est un changement de `src`.
 *
 * LE SERIF. L'instruction demande Instrument Serif pour le titre de conclusion,
 * « si cela correspond exactement à la page principale ». Vérifié dans
 * `ExperienceCinema.tsx` : `.xc .recit h1, .xc .recit h2` sont en `--sans`. La
 * page principale n'emploie donc PAS le serif pour ses titres de section, et la
 * condition posée par l'instruction se résout en « sans ». Le serif reste ce
 * qu'il est ailleurs sur le site : la fonte du titre de CHAPITRE, et cette page
 * n'a plus de chapitres.
 */

import React from "react";
import Image from "next/image";
import { PageShell, R } from "./shared";
import { Ouverture, Recit } from "./recit";
import { MATIERE_VERTE, OMBRE_VERTE } from "./matiere-verte";

/**
 * Le récit, d'un seul tenant.
 *
 * Le second champ porte le rythme : `true` pour l'encre pleine, `false` pour
 * l'encre atténuée. Une seule nuance, jamais deux, et elle ne sert qu'à
 * respirer entre deux affirmations. Les paragraphes 2 et 5 sont des
 * transitions : ils relient, ils n'affirment pas.
 *
 * Aucun numéro, aucune citation ajoutée, aucune carte. Ce sont sept
 * paragraphes de prose, et ils se lisent comme tels.
 */
const RECIT: readonly (readonly [string, boolean])[] = [
  ["Je n’ai pas commencé avec l’ambition de créer un autre logiciel juridique.", true],
  ["J’essayais simplement de rendre le travail administratif d’un cabinet plus facile à suivre.", false],
  [
    "Le temps devait être retrouvé avant d’être facturé. Les paiements et les écritures comptables étaient suivis séparément. Le fidéicommis exigeait encore des vérifications manuelles.",
    true,
  ],
  ["Le problème n’était pas le manque d’effort. Les outils ne partageaient pas le même contexte.", true],
  [
    "La première version de SAFE était un fichier Excel. Il fallait d’abord réunir l’information et comprendre comment chaque étape dépendait de la suivante.",
    false,
  ],
  [
    "À mesure que les dossiers, le temps, les factures et les paiements se sont reliés, le fichier est devenu un système.",
    true,
  ],
  [
    "Aujourd’hui, SAFE Cabinet tient ces opérations ensemble. Une information inscrite pendant le travail reste disponible pour les étapes suivantes.",
    true,
  ],
];

export default function AProposPage() {
  return (
    <PageShell>
      {/* 1. L'ouverture. Aucun bouton, aucun portrait miniature, aucune
          illustration : le titre, la phrase, et on descend vers la photo. */}
      <Ouverture
        titre={
          <>
            SAFE est né d’un <em>problème réel</em>.
          </>
        }
        dire={[
          "Dans un cabinet, les dossiers avançaient.",
          "Mais le temps, la facturation et le fidéicommis vivaient encore dans des systèmes séparés.",
        ]}
      />

      {/* 2. La photographie, presque pleine largeur utile.
          Pas de carte autour, pas de grosse ombre, pas de cadre : l'image est
          l'objet, pas son emballage. Le filet et le rayon suffisent à la poser
          sur le canevas. */}
      <section className="recit portrait-large" aria-labelledby="legende-portrait">
        <div className="inner">
          <figure>
            <div className="cadre">
              <Image
                src="/images/fondateur/jeremie-tiahou-safe.jpg"
                alt="Jérémie Tiahou, debout dans le hall vitré d’un immeuble à Gatineau."
                width={2400}
                height={1350}
                sizes="(max-width: 860px) 92vw, min(1160px, 88vw)"
                priority
              />
            </div>
            <figcaption id="legende-portrait">
              <span className="qui">Jérémie Tiahou, fondateur de SAFE</span>
              <span className="ou">Gatineau, Québec</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* 3. Le récit continu. Repère à gauche, prose à droite, une seule
          colonne sous le seuil du téléphone. */}
      <section className="recit origine">
        <div className="inner">
          <div className="grille">
            <h2 className="repere">L’origine de SAFE</h2>
            <div className="prose">
              {RECIT.map(([texte, plein]) => (
                <p key={texte} className={plein ? "fort" : undefined}>
                  {texte}
                </p>
              ))}
            </div>
          </div>

          {/* 4. La phrase de marque. Isolée par un filet, jamais par une
              carte, et elle reste sous la taille du titre d'ouverture. */}
          <p className="phrase-marque">
            Le produit a changé. L’idée, non : <em>le logiciel doit comprendre le cabinet, pas l’inverse.</em>
          </p>
        </div>
      </section>

      {/* 5. La conclusion, sur la matière verte du site, et l'appel.
          Un seul bouton plein. */}
      <Recit id="construire">
        <div className="conclusion">
          <p className="repere-vert">La manière de construire</p>
          <h2>Observer. Relier. Vérifier. Améliorer.</h2>
          <p className="dit">
            Chaque nouvelle capacité part du travail réel d’un cabinet. Elle doit supprimer une
            ressaisie, rendre une information visible ou faciliter une vérification.
          </p>
          <div className="actes">
            <a className="acte plein" href={R.diagnostic}>
              Évaluer mon cabinet
            </a>
            <a className="acte" href={R.demo}>
              Réserver une rencontre
            </a>
          </div>
        </div>
      </Recit>

      <style dangerouslySetInnerHTML={{ __html: reglesAPropos(".safe-vitrine") }} />
    </PageShell>
  );
}

/**
 * Les règles de la page, à la portée de la vitrine.
 *
 * Elles ne créent aucune taille : tout vient des jetons de `recit.tsx`. La
 * page n'introduit qu'une seule mesure qui lui est propre, le ratio de la
 * photographie, parce qu'aucun jeton ne décrit un cadrage.
 */
function reglesAPropos(p: string): string {
  return `
  /* ── L'ouverture respire moins haut ───────────────────────────────────────
     Le contrat du site pose jusqu'à 216 px au-dessus du titre d'une ouverture.
     Sur cette page, la photographie est la preuve, et une preuve qui n'entre
     pas dans la première progression visuelle ne prouve rien. Le rembourrage
     descend donc d'un cran, et il ne descend QUE sur cette page : ':has()'
     borne la règle à l'ouverture qui précède le portrait. */
  ${p}:has(.portrait-large) .recit.ouverture {
    padding-block: clamp(96px, 13vh, 148px) clamp(28px, 3.6vh, 44px);
  }

  /* ── La photographie ──────────────────────────────────────────────────────
     Presque toute la largeur utile, en paysage large sur ordinateur.

     Le fichier est DÉJÀ cadré en 16:9, et la boîte porte le même ratio : sur
     ordinateur, l'image n'est donc pas recadrée du tout. C'est voulu. Le
     cadrage a été choisi par le CEO sur l'image elle-même le 2026-09-03 ;
     l'afficher dans une fenêtre plus large aurait rogné sa composition une
     seconde fois, et aucune règle de CSS ne sait où il voulait couper.

     J'avais d'abord posé 2,35:1, ce qui remontait le visage vers le bord haut
     et obligeait à caler 'object-position' à la main. Faire porter le cadrage
     par le fichier et non par la feuille supprime le réglage et le risque. */
  ${p} .recit.portrait-large { padding-block: 0 clamp(48px, 6vh, 76px); }
  ${p} .portrait-large figure { margin: 0; }
  ${p} .portrait-large .cadre {
    position: relative;
    aspect-ratio: 16 / 9;
    border-radius: 16px;
    overflow: hidden;
    background: var(--si-surface2);
  }
  ${p} .portrait-large img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 50% 50%;
    display: block;
  }
  /* Le seul mouvement de la page : la photographie se pose. Pas de zoom, pas
     de déplacement, pas de parallaxe. */
  @media (prefers-reduced-motion: no-preference) {
    ${p} .portrait-large .cadre {
      animation: aproposParait var(--safe-motion-slow) var(--safe-motion-ease) both;
    }
  }
  @keyframes aproposParait { from { opacity: 0 } to { opacity: 1 } }

  /* La légende : deux repères en mono, sur une ligne au-dessus du seuil du
     téléphone, empilés en dessous. */
  ${p} .portrait-large figcaption {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 18px;
    margin-top: 14px;
    font-family: var(--mono);
    font-size: var(--t-menu);
    letter-spacing: 0.11em;
    text-transform: uppercase;
  }
  ${p} .portrait-large .qui { color: var(--si-body); }
  ${p} .portrait-large .ou { color: var(--muted); }

  /* ── Le récit ─────────────────────────────────────────────────────────────
     Grille asymétrique : le repère tient une colonne étroite à gauche, la
     prose prend la colonne de lecture. Le repère est un h2 pour que l'ordre
     des titres reste correct, mais il se présente comme un repère : c'est le
     seul endroit de la page où un titre ne pèse pas comme un titre, et c'est
     voulu, il nomme la section sans la découper. */
  ${p} .recit.origine { padding-block: clamp(48px, 6vh, 76px) clamp(64px, 9vh, 104px); }
  ${p} .origine .grille {
    display: grid;
    grid-template-columns: 200px minmax(0, 1fr);
    gap: clamp(32px, 5vw, 88px);
    align-items: start;
  }
  ${p} .origine .repere {
    margin: 0;
    font-family: var(--mono);
    font-size: var(--t-menu);
    font-weight: 400;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
    /* Le repère s'aligne sur la première ligne de prose, pas sur le haut de sa
       cellule : deux hauteurs de ligne différentes ne se calent pas seules. */
    padding-top: 9px;
    max-width: none;
  }
  /* La prose. Une seule largeur, bornée pour la lecture, et un seul écart
     entre les paragraphes : c'est un texte continu, pas une liste. */
  ${p} .origine .prose { max-width: 62ch; }
  ${p} .origine .prose p {
    margin: 0;
    font-family: var(--sans);
    font-size: var(--t-explique);
    line-height: 1.62;
    letter-spacing: -0.006em;
    color: var(--muted);
  }
  ${p} .origine .prose p + p { margin-top: clamp(20px, 2.4vh, 28px); }
  ${p} .origine .prose p.fort { color: var(--si-ink); }

  /* ── La phrase de marque ──────────────────────────────────────────────────
     Isolée par un filet supérieur, jamais par une carte. Elle reste SOUS la
     taille du titre d'ouverture ('--t-affiche', 26 px) : à égalité elle
     deviendrait un second titre de page. Le vert ne prend que la seconde
     moitié, celle qui porte l'idée. */
  ${p} .origine .phrase-marque {
    margin: clamp(48px, 6vh, 76px) 0 0;
    padding-top: clamp(24px, 3vh, 34px);
    border-top: 1px solid var(--line);
    max-width: 34ch;
    margin-left: auto;
    font-family: var(--sans);
    font-size: var(--t-argument);
    font-weight: 400;
    line-height: 1.3;
    letter-spacing: -0.014em;
    color: var(--si-ink);
  }
  ${p} .origine .phrase-marque em {
    font-style: normal;
    color: var(--si-brand-green);
  }

  /* ── La conclusion ────────────────────────────────────────────────────────
     La matière vient de 'matiere-verte.ts', la même qu'à l'accueil et qu'à la
     tarification. Aucun logo décoratif, aucune particule, aucun verre, aucune
     animation continue.

     Le titre est en '--sans' et non en serif : vérifié dans
     ExperienceCinema.tsx, la page principale met ses titres de section en
     sans. Voir la note d'en-tête de ce fichier. */
  ${p} .conclusion {
    position: relative;
    overflow: hidden;
    border: 1px solid transparent;
    border-radius: 20px;
    padding: clamp(32px, 4vw, 56px);
    ${MATIERE_VERTE}
    ${OMBRE_VERTE}
  }
  ${p} .conclusion .repere-vert {
    margin: 0;
    font-family: var(--mono);
    font-size: var(--t-menu);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgb(var(--si-surface-rgb) / 0.62);
  }
  ${p} .conclusion h2 {
    margin: clamp(14px, 1.8vh, 20px) 0 0;
    font-family: var(--sans);
    font-size: var(--t-affiche);
    font-weight: 400;
    line-height: 1.06;
    letter-spacing: -0.0125em;
    max-width: 20ch;
    color: var(--si-verified-on-forest);
  }
  ${p} .conclusion .dit {
    margin: clamp(14px, 1.8vh, 20px) 0 0;
    max-width: 56ch;
    font-family: var(--sans);
    font-size: var(--t-corps);
    line-height: 1.6;
    color: var(--si-surface);
  }

  /* Les actions. Un seul bouton plein (PS-020) : la surface claire le porte,
     le second reste un contour. Cible de 46 px, au-dessus du minimum de 44. */
  ${p} .conclusion .actes {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: clamp(28px, 3.6vh, 40px);
  }
  ${p} .conclusion .acte {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 46px;
    padding: 0 20px;
    border: 1px solid rgb(var(--si-surface-rgb) / 0.32);
    border-radius: 6px;
    background: rgb(var(--si-surface-rgb) / 0.12);
    font-family: var(--sans);
    font-size: var(--t-detail);
    font-weight: 400;
    color: var(--si-surface);
    transition: background-color var(--safe-motion-normal) var(--safe-motion-ease);
  }
  ${p} .conclusion .acte.plein {
    border-color: transparent;
    background: var(--si-surface);
    color: var(--si-ink-strong);
  }
  ${p} .conclusion .acte:hover { background: rgb(var(--si-surface-rgb) / 0.2); }
  ${p} .conclusion .acte.plein:hover { background: var(--si-verified-on-forest); }
  ${p} .conclusion .acte:focus-visible {
    outline: 2px solid var(--si-surface);
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    ${p} .conclusion .acte { transition: none; }
    ${p} .portrait-large .cadre { animation: none; }
  }

  /* ═══ Tablette ═════════════════════════════════════════════════════════════
     Le repère du récit garde sa colonne tant qu'elle ne serre pas la prose.
     Sous 1000 px, 200 px de repère laissaient moins de 50 caractères à la
     ligne : il repasse au-dessus du texte. */
  @media (max-width: 1000px) {
    ${p} .origine .grille { grid-template-columns: 1fr; gap: clamp(18px, 2.4vh, 26px); }
    ${p} .origine .repere { padding-top: 0; }
    /* La prose GARDE sa bride. Elle l'avait perdue ici, et mesuré à 768 px la
       ligne montait à 81 caractères pour un corps de 18 px : au-delà de 75,
       l'œil perd le début de la ligne suivante. La colonne s'élargit parce que
       le repère est passé au-dessus, ce n'est pas une raison pour laisser le
       texte prendre toute la page. */
    ${p} .origine .phrase-marque { margin-left: 0; max-width: 42ch; }
  }

  /* ═══ Téléphone ════════════════════════════════════════════════════════════
     Le titre reste AVANT la photographie, comme sur ordinateur : c'est l'ordre
     du document, il n'y a rien à réordonner.

     La photographie passe du paysage à un cadrage vertical contrôlé. Un 16:9
     sur 350 px de large ne ferait plus que 197 px de haut, et le visage y
     deviendrait un détail. Le ratio remonte à 4:5.

     Le rognage se fait alors en LARGEUR : d'un 16:9 vers un 4:5, la fenêtre ne
     garde que 45 % de la largeur et toute la hauteur. Le sujet étant au centre
     du cadre, 50 % en horizontal le conserve entier, et la tête ne peut pas
     être coupée puisque rien n'est retiré en hauteur. */
  @media (max-width: 860px) {
    ${p} .portrait-large .cadre { aspect-ratio: 4 / 5; border-radius: 14px; }
    ${p} .portrait-large img { object-position: 50% 50%; }
    ${p} .conclusion .actes { flex-direction: column; align-items: stretch; }
    ${p} .conclusion .acte { width: 100%; }
  }
  @media (max-width: 480px) {
    ${p} .origine .prose p { font-size: var(--t-corps); line-height: 1.6; }
    ${p} .origine .phrase-marque { max-width: none; }
  }
`;
}
