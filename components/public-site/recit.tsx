"use client";

/**
 * Le vocabulaire de récit du site public.
 *
 * ── Pourquoi ce fichier existe ───────────────────────────────────────────────
 * Le contrat de section conçu pour l'accueil (titre à gauche, une phrase à
 * droite, la scène en dessous sur toute la largeur) vivait enfermé dans le
 * littéral CSS de `ExperienceCinema`, sous la portée `.xc`. Aucune autre page
 * ne pouvait s'en servir : elles avaient chacune leur `Section` locale, leur
 * alternance blanc/gris, leurs colonnes centrées à 640 ou 768 px, et leurs
 * propres tailles de titre.
 *
 * Les règles vivent donc ici, PARAMÉTRÉES PAR LA PORTÉE. L'accueil les appelle
 * avec `.xc`, le reste du site avec `.safe-vitrine`. Il n'y a qu'un endroit où
 * « une section de récit » se décide, comme il n'y a qu'un endroit où « une
 * carte » se décide (components/ui/Card.tsx).
 *
 * ── Le contrat, en une phrase ────────────────────────────────────────────────
 *   1. le titre, à gauche, deux lignes au plus ;
 *   2. UNE phrase, à droite, à la même hauteur, bicolore ;
 *   3. le corps en dessous, sur toute la largeur ;
 *   4. l'index numéroté, s'il y a lieu.
 *
 * Ce qui reste interdit : les ombres autour d'une scène (un filet suffit), les
 * fondus d'apparition sur le texte, et le remplissage de l'espace rendu. Le
 * vide entre deux blocs est plus grand que tout ce qu'il sépare.
 */

import React from "react";
import Image from "next/image";

/* ── Les jetons ─────────────────────────────────────────────────────────────
   Les couleurs viennent toutes de la palette (lib/ds/palettes.ts) : ce bloc
   ne fait que leur donner les noms courts dont se servent les règles en
   dessous. Les largeurs et l'échelle typographique, elles, se décident ici.

   L'échelle a six rôles et six valeurs. Une taille qui change signale un
   changement de rôle, jamais un ajustement pour qu'une phrase tombe bien. */
export function jetonsRecit(portee: string): string {
  return `
  ${portee} {
    --bg: var(--si-canvas);
    --surface: var(--si-surface);
    --ink: var(--si-ink);
    --muted: var(--si-muted);
    --faint: var(--si-subtle);
    --green: var(--si-forest);
    --forest: var(--si-forest);
    --verified: var(--si-verified);
    --amber: var(--si-amber-ink);
    --line: var(--si-line);
    --line-soft: var(--si-line2);
    --serif: var(--font-instrument-serif), Georgia, serif;
    --sans: var(--font-geist-sans), -apple-system, "Segoe UI", sans-serif;
    --mono: var(--font-geist-mono), ui-monospace, monospace;

    --doux: cubic-bezier(0.33, 0.06, 0.2, 1);
    --duree-entree: 780ms;
    --duree-teinte: 620ms;

    /* Une seule largeur de page et une seule gouttière pour toute la vitrine.
       Le retrait se DÉDUIT de la largeur de page : la boîte de contenu vaut
       toujours --page au plus, donc une grille de --page la remplit
       exactement et ne peut plus se recentrer. */
    --page: 1160px;
    --gouttiere: min(6vw, 84px);
    --marge: 20px;

    --t-affiche: clamp(44px, 7.4vw, 92px);   /* le titre d'ouverture, une fois */
    --t-marque: clamp(34px, 4.4vw, 56px);    /* le titre d'une section */
    --t-titre: clamp(26px, 3.1vw, 40px);     /* le sous-titre qui le développe */
    --t-argument: clamp(19px, 1.75vw, 24px); /* la phrase mise en avant */
    --t-corps: clamp(16px, 1.25vw, 18px);    /* la prose */
    --t-detail: 14px;                        /* la justification sous un point */
    --t-menu: 11px;                          /* exergue, méta, libellé */
  }`;
}

/* ── Les règles ─────────────────────────────────────────────────────────── */
export function reglesRecit(p: string): string {
  return `
  /* ── Le contrat de section ────────────────────────────────────────────────
     C'est la grille de Linear, mesurée sur leur page : leurs sections portent
     vingt-cinq mots et toute la densité vit DANS le logiciel montré. */
  ${p} .recit {
    padding-block: clamp(96px, 14vh, 176px);
    padding-inline: max(var(--gouttiere), (100% - var(--page)) / 2);
  }
  ${p} .recit .inner { max-width: var(--page); margin: 0 auto; }
  /* La première section d'une page passe sous une barre flottante : elle prend
     donc plus d'air en haut, et un peu moins en bas puisque ce qui suit lui
     répond. Une seule par page, comme il n'y a qu'un h1. */
  ${p} .recit.ouverture { padding-block: clamp(132px, 19vh, 216px) clamp(64px, 9vh, 112px); }
  /* Le premier bloc d'une section ne prend pas d'écart : le rembourrage de la
     section le donne déjà. Sans ça, une section sans titre s'ouvrait sur cent
     pixels de vide en trop. */
  ${p} .recit .inner > :first-child { margin-top: 0; }
  ${p} .recit .tete {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(32px, 5vw, 88px);
    align-items: start;
  }
  ${p} .recit h1,
  ${p} .recit h2 {
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--t-marque);
    line-height: 1.06;
    letter-spacing: -0.02em;
    max-width: 15ch;
  }

  /* ── La phrase qui accompagne le titre ────────────────────────────────────
     Elle est BICOLORE, et c'est tout son mouvement. Linear allume son
     paragraphe segment par segment pendant le défilement : le texte est là
     depuis le début, ce qui change est son encre. On garde l'idée et on retire
     la dépendance au défilement. Aucun fondu d'entrée : un texte qui apparaît
     est un texte qui manquait une seconde plus tôt. */
  ${p} .recit .dire {
    font-family: var(--sans);
    font-size: clamp(18px, 1.55vw, 22px);
    line-height: 1.45;
    letter-spacing: -0.006em;
    max-width: 40ch;
    color: var(--muted);
  }
  ${p} .recit .dire b { font-weight: 400; color: var(--si-ink); }

  /* ── La ligne de scène : un libellé, une valeur alignée à droite en mono. */
  ${p} .ligne {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: baseline;
    gap: 16px;
    padding: 11px 0;
    border-bottom: 1px solid var(--line2, var(--line));
  }
  ${p} .ligne:last-of-type { border-bottom: 0; }
  ${p} .ligne .l { font-family: var(--sans); font-size: 13.5px; color: var(--si-ink); }
  ${p} .ligne .l small { color: var(--muted); font-size: 12px; }
  ${p} .ligne .v {
    font-family: var(--mono);
    font-size: 13.5px;
    font-variant-numeric: tabular-nums;
    color: var(--si-ink);
  }
  ${p} .ligne .v.attente { color: var(--si-amber-ink); }
  ${p} .ligne .v.vert { color: var(--verified); }
  ${p} .ligne.total { margin-top: 6px; padding-top: 15px; border-top: 1px solid var(--line); border-bottom: 0; }
  ${p} .ligne.total .l, ${p} .ligne.total .v { font-size: 15px; }

  /* ── La capture d'un écran réel ───────────────────────────────────────────
     Une FENÊTRE, pas une image : filet à 28 % d'encre (un filet de section et
     le bord d'une fenêtre ne disent pas la même chose), coins à 16 px, barre
     de navigation de l'application comprise.

     Le fondu du bas porte sur TOUT l'élément, par un masque : le filet s'éteint
     avec le contenu qu'il borde. Conséquence assumée, un masque coupe l'ombre
     portée, peinte hors de la boîte. L'élévation vient donc du SOCLE et d'un
     filet clair d'un pixel sous le bord haut, tous deux à l'intérieur du
     masque. */
  ${p} .capture {
    position: relative;
    margin-top: clamp(56px, 8vh, 104px);
    /* Le débordement se prend sur ce qui RESTE une fois la colonne posée,
       jamais sur un pourcentage de la largeur : entre 860 et 1300 px la
       gouttière ne vaut que 6vw, et un cadre collé au bord ne se lit plus
       comme un cadre. */
    margin-inline: calc(-1 * clamp(0px, (100vw - var(--page)) * 0.14, 96px));
    border: 1px solid rgb(var(--si-line-ink-rgb) / 0.28);
    border-radius: 16px;
    overflow: hidden;
    background: var(--bg);
    box-shadow: inset 0 1px 0 rgb(var(--si-surface-rgb) / 0.9);
    -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 72%, transparent 100%);
    mask-image: linear-gradient(to bottom, #000 0%, #000 72%, transparent 100%);
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
  }
  ${p} .capture img { display: block; width: 100%; height: auto; }

  /* ── La fenêtre interactive ──────────────────────────────────────────────
     Une seule fenêtre, plusieurs écrans, et une rangée d'onglets au-dessus.

     C'est ce que fait Linear de sa section produit : le cadre ne bouge pas,
     ce qui change est ce qu'on regarde dedans. Cinq images empilées coûteraient
     plus d'un méga-octet au chargement, donc une seule est rendue à la fois et
     la suivante n'arrive qu'au clic.

     L'onglet actif se distingue par son ENCRE et son filet, jamais par un fond
     coloré : le fond est réservé au produit qui est en dessous. */
  ${p} .onglets {
    margin-top: clamp(56px, 8vh, 104px);
    display: flex;
    flex-wrap: wrap;
    gap: 4px 2px;
    border-bottom: 1px solid var(--line);
  }
  ${p} .onglets button {
    appearance: none;
    background: none;
    border: 0;
    border-bottom: 1px solid transparent;
    margin-bottom: -1px;
    padding: 10px 16px 12px;
    font-family: var(--sans);
    font-size: 14px;
    color: var(--muted);
    cursor: pointer;
    transition: color var(--duree-teinte) ease, border-color var(--duree-teinte) ease;
  }
  ${p} .onglets button:hover { color: var(--si-ink); }
  ${p} .onglets button[aria-selected="true"] {
    color: var(--si-ink);
    border-bottom-color: var(--si-ink);
  }
  ${p} .onglets button:focus-visible {
    outline: 2px solid var(--green);
    outline-offset: -2px;
    border-radius: 4px;
  }
  /* La fenêtre qui suit les onglets se colle à eux : l'écart d'une scène
     autonome ferait flotter la barre au-dessus de rien. */
  ${p} .onglets + .capture { margin-top: clamp(20px, 2.4vw, 34px); }
  /* Le changement d'écran est un fondu court, sans déplacement. Un écran qui
     glisse se lit comme un carrousel ; ici on change de page, pas de diapo. */
  ${p} .capture img { animation: recitParaitre 320ms var(--doux) both; }
  @keyframes recitParaitre { from { opacity: 0 } to { opacity: 1 } }
  @media (prefers-reduced-motion: reduce) {
    ${p} .capture img { animation: none; }
  }

  /* ── Le socle ─────────────────────────────────────────────────────────────
     Le relief vient du fond. Une section qui porte une fenêtre repose sur un
     plan plus SOMBRE que le canevas. Le sens de l'écart n'est pas libre : la
     teinte à l'intérieur de la fenêtre est celle du canevas de l'application
     et on ne peut pas la changer, c'est une photo. Un socle plus clair aurait
     fait de la fenêtre un trou. */
  ${p} .recit.socle {
    background: rgb(var(--si-ink-rgb) / 0.045);
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }

  /* ── L'index numéroté ─────────────────────────────────────────────────────
     Deux colonnes, un filet vertical entre elles, un numéro en mono et un nom.
     Les entrées sont NOMMÉES, jamais décrites : c'est ce qui remplace les
     paragraphes qu'on écrivait pour chacune. */
  ${p} .index-modules {
    margin-top: clamp(44px, 6vh, 76px);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px clamp(32px, 5vw, 80px);
  }
  ${p} .index-modules .mod {
    display: grid;
    grid-template-columns: 44px 1fr;
    align-items: baseline;
    gap: 12px;
  }
  ${p} .index-modules .mod .n { font-family: var(--mono); font-size: 12.5px; color: var(--si-subtle); }
  ${p} .index-modules .mod .t { font-family: var(--sans); font-size: 15px; color: var(--si-ink); }
  ${p} .index-modules .colonne-droite { border-left: 1px solid var(--line); padding-left: clamp(24px, 4vw, 56px); }

  /* ── Les figures ──────────────────────────────────────────────────────────
     Numérotées en mono, séparées par des filets verticaux, légendées en deux
     temps. La rangée du cadre prend tout ce qui reste, sinon les trois
     colonnes finissent à trois hauteurs et les légendes ne s'alignent plus. */
  ${p} .figures {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: clamp(28px, 4vw, 64px);
    margin-top: clamp(56px, 8vh, 104px);
  }
  ${p} .figures > * + * { border-left: 1px solid var(--line); padding-left: clamp(28px, 4vw, 64px); }
  ${p} .figures > * { display: grid; grid-template-rows: auto 1fr auto auto; }
  ${p} .fig-num {
    font-family: var(--mono);
    font-size: var(--t-menu);
    letter-spacing: 0.12em;
    color: var(--si-subtle);
  }
  ${p} .fig-cadre {
    margin-top: 18px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--si-surface);
    padding: 16px 18px;
  }
  ${p} .fig-titre { margin-top: 20px; font-family: var(--sans); font-size: 15px; color: var(--si-ink); }
  ${p} .fig-dit {
    margin-top: 8px;
    max-width: 34ch;
    font-family: var(--sans);
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--muted);
  }

  /* ── La rangée de forfait ────────────────────────────────────────────────
     Un nom, ce qu'il couvre, et le prix aligné à droite. Le prix reste un
     CHIFFRE, donc en mono, comme tout montant du site : la serif s'arrête au
     texte qui l'entoure. Aligné sur la ligne de base du nom, pas sur le milieu
     du bloc, sinon un prix de 22 px se centre entre le nom et sa description
     et ne chiffre visuellement ni l'un ni l'autre. */
  ${p} .plan {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: baseline;
    gap: 16px clamp(24px, 4vw, 64px);
    padding: 26px 0;
    border-bottom: 1px solid var(--line);
  }
  ${p} .plan:first-of-type { border-top: 1px solid var(--line); }
  ${p} .plan .name { font-family: var(--sans); font-size: 16px; color: var(--si-ink); }
  ${p} .plan .detail {
    margin-top: 4px;
    max-width: 52ch;
    font-family: var(--sans);
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--muted);
  }
  ${p} .plan .price {
    font-family: var(--mono);
    font-size: var(--t-argument);
    font-variant-numeric: tabular-nums;
    text-align: right;
    color: var(--si-ink);
  }
  ${p} .plan .price small { font-family: var(--mono); font-size: var(--t-menu); color: var(--muted); margin-left: 6px; }

  /* ── Le vocabulaire d'appoint ─────────────────────────────────────────────
     La phrase qui referme une section, le lien de fin de bloc dont le filet
     s'allonge au survol (le seul mouvement de ces sections), et l'exergue qui
     nomme le rang de ce qu'on lit. */
  ${p} .chute {
    font-family: var(--sans);
    font-weight: 400;
    font-size: var(--t-argument);
    line-height: 1.32;
    letter-spacing: -0.014em;
    color: var(--si-ink);
    max-width: 38ch;
  }
  ${p} .more {
    display: inline-block;
    margin-top: 18px;
    font-family: var(--sans);
    font-size: 14px;
    color: var(--ink);
    border-bottom: 1px solid rgb(var(--si-line-ink-rgb) / 0.22);
    padding-bottom: 2px;
    transition: border-color var(--duree-teinte) ease;
  }
  ${p} .more:hover { border-color: var(--si-ink); }
  ${p} .rang {
    font-family: var(--sans);
    font-size: var(--t-menu);
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted);
  }

  /* ── La liste numérotée ───────────────────────────────────────────────────
     Un numéro, une phrase, et à droite en mono l'endroit où la chose vit. */
  ${p} .morceaux { margin-top: clamp(56px, 8vh, 104px); }
  ${p} .morceau {
    display: grid;
    grid-template-columns: 30px 1fr auto;
    column-gap: 14px;
    align-items: baseline;
    padding: 15px 0;
    border-top: 1px solid var(--line);
  }
  ${p} .morceau:last-child { border-bottom: 1px solid var(--line); }
  ${p} .morceau .n {
    font-family: var(--mono);
    font-size: var(--t-menu);
    letter-spacing: 0.1em;
    color: var(--si-subtle);
  }
  ${p} .morceau .t { font-family: var(--sans); font-size: var(--t-corps); color: var(--si-ink); }
  ${p} .morceau .ou {
    font-family: var(--mono);
    font-size: var(--t-menu);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--si-subtle);
    text-align: right;
  }

  /* ── L'apparition au défilement ──────────────────────────────────────────
     Deux gestes seulement, et ils ne font pas la même chose.

     1. LE BLOC PARAÎT. Opacité et translation, rien d'autre : ce sont les deux
        seules propriétés qui ne forcent aucun recalcul de mise en page, donc
        les seules qui tiennent soixante images par seconde sur une page qui
        porte des captures de trois mille pixels.

     2. LA PHRASE S'ALLUME. C'est le geste de Linear, et il est d'une autre
        nature : le texte est là depuis le début, ce qui change est son ENCRE.
        Les mots de la première moitié passent du gris à l'encre pleine, de
        gauche à droite. Rien n'apparaît, donc rien ne manquait.

     La doctrine écrite plus haut interdisait tout fondu sur le texte. Elle
     visait le texte qui SURGIT, pas le texte qui s'éclaire : un bloc qui monte
     de quatorze pixels en sept cents millisecondes ne se lit pas comme une
     absence comblée, il se lit comme une page qui se pose. Décision CEO du
     23 août 2026.

     Tout est sous « prefers-reduced-motion: no-preference » : qui a demandé
     moins de mouvement au niveau du système reçoit la page posée, sans une
     seule transition, et sans que rien ne lui manque. */
  @media (prefers-reduced-motion: no-preference) {
    ${p} [data-parait] {
      opacity: 0;
      transform: translateY(14px);
      transition:
        opacity var(--duree-entree) var(--doux),
        transform var(--duree-entree) var(--doux);
    }
    ${p} [data-parait="vu"] { opacity: 1; transform: none; }

    /* Le balayage d'encre. Chaque mot part en gris et rejoint l'encre pleine,
       avec quarante millisecondes d'écart : assez pour qu'on voie la vague
       passer, assez peu pour qu'une phrase de dix mots soit finie avant qu'on
       ait fini de la lire. */
    ${p} .dire b .mot {
      color: var(--muted);
      transition: color 520ms var(--doux);
    }
    ${p} .dire[data-parait="vu"] b .mot { color: var(--si-ink); }
  }

  /* ── La liste de questions ───────────────────────────────────────────────
     La question à gauche, la réponse à droite, un filet entre deux. C'est le
     contrat de section appliqué à l'échelle d'une ligne. */
  ${p} .liste-q { margin-top: clamp(56px, 8vh, 104px); }
  ${p} .q {
    display: grid;
    grid-template-columns: 0.86fr 1.14fr;
    gap: 18px clamp(32px, 5vw, 88px);
    padding: 26px 0;
    border-top: 1px solid var(--line);
  }
  ${p} .q h3 {
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--t-argument);
    line-height: 1.35;
  }
  ${p} .q p {
    max-width: 58ch;
    font-family: var(--sans);
    font-size: 14.5px;
    line-height: 1.65;
    color: var(--muted);
  }
  ${p} .q p + p { margin-top: 12px; }

  /* ── Les actions et la note ──────────────────────────────────────────────
     Un seul bouton plein par section. Le second porte un filet : sans lui,
     rien ne disait qu'on pouvait cliquer, sinon sa position à côté du premier. */
  ${p} .actions { margin-top: clamp(44px, 6vh, 72px); display: flex; gap: 18px; flex-wrap: wrap; }
  ${p} .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 44px;
    padding: 0 24px;
    border-radius: 7px;
    background: var(--green);
    color: #fff;
    font-family: var(--sans);
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 14px 28px -18px rgb(var(--si-forest-rgb) / 0.85);
    transition: transform 0.2s ease;
  }
  ${p} .btn:hover { transform: translateY(-2px); }
  ${p} .btn.ghost {
    background: transparent;
    color: var(--ink);
    box-shadow: none;
    border: 1px solid var(--line);
    transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
  }
  ${p} .btn.ghost:hover {
    border-color: rgb(var(--si-line-ink-rgb) / 0.22);
    background: rgb(var(--si-line-ink-rgb) / 0.03);
  }
  ${p} .note { margin-top: 22px; font-family: var(--sans); font-size: 13px; color: var(--muted); max-width: 62ch; }
  ${p} .note-faible { color: var(--si-subtle); }

  /* ── Deux colonnes de même poids, séparées par un filet ─────────────────── */
  ${p} .duo {
    margin-top: clamp(56px, 8vh, 104px);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(32px, 5vw, 80px);
  }
  ${p} .duo > * + * { border-left: 1px solid var(--line); padding-left: clamp(32px, 5vw, 80px); }
  ${p} .duo h3 {
    margin-top: 10px;
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--t-argument);
    line-height: 1.22;
    letter-spacing: -0.014em;
    max-width: 22ch;
  }
  ${p} .duo p {
    margin-top: 12px;
    max-width: 46ch;
    font-family: var(--sans);
    font-size: var(--t-detail);
    line-height: 1.6;
    color: var(--muted);
  }`;
}

/* ── Les mêmes règles, au pouce ─────────────────────────────────────────────
   Toutes les grilles s'empilent, et l'ordre de lecture est déjà le bon dans le
   balisage : le titre, la phrase, la scène, l'index. À rendre À L'INTÉRIEUR
   d'une requête de média, c'est l'appelant qui décide du seuil. */
export function reglesRecitAuPouce(p: string): string {
  return `
    ${p} .recit { padding-block: 72px; padding-inline: var(--marge); }
    ${p} .recit .tete { grid-template-columns: 1fr; gap: 18px; }
    ${p} .recit.ouverture { padding-block: 108px var(--marge); }
    ${p} .recit h1, ${p} .recit h2 { font-size: var(--t-titre); max-width: none; }
    ${p} .recit .dire { font-size: var(--t-corps); max-width: none; }
    ${p} .ligne { padding: 9px 0; }
    ${p} .ligne .l, ${p} .ligne .v { font-size: var(--t-detail); }
    ${p} .ligne .l small { font-size: var(--t-menu); }
    ${p} .ligne.total .l, ${p} .ligne.total .v { font-size: var(--t-corps); }
    /* Le cadre survit au téléphone, avec un rayon plus court et sans déborder
       jusqu'aux bords : un cadre collé au bord ne se lit plus comme un cadre. */
    ${p} .capture { margin-top: 32px; margin-inline: calc(-0.5 * var(--marge)); border-radius: 12px; }
    /* Les onglets défilent horizontalement plutôt que de s'empiler : quatre
       lignes de boutons au-dessus d'une image mangeraient l'écran. */
    ${p} .onglets {
      margin-top: 32px;
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
    }
    ${p} .onglets::-webkit-scrollbar { display: none; }
    ${p} .onglets button { flex: 0 0 auto; padding: 9px 12px 11px; font-size: 13.5px; }
    ${p} .index-modules { margin-top: 32px; grid-template-columns: 1fr; gap: 12px; }
    ${p} .index-modules .colonne-droite { border-left: 0; padding-left: 0; }
    ${p} .figures { grid-template-columns: 1fr; gap: 32px; margin-top: 32px; }
    ${p} .figures > * + * { border-left: 0; padding-left: 0; border-top: 1px solid var(--line); padding-top: 32px; }
    ${p} .fig-dit { max-width: none; }
    ${p} .chute { max-width: none; font-size: var(--t-corps); }
    ${p} .morceaux { margin-top: 26px; }
    ${p} .morceau { grid-template-columns: 30px 1fr; padding: 12px 0; }
    /* Le repère de l'endroit passe sous la phrase : à 335 px, une colonne de
       droite en plus de celle du numéro ne laisse plus rien au texte. */
    ${p} .morceau .ou { grid-column: 2; text-align: left; }
    ${p} .morceau .t { font-size: var(--t-detail); }
    ${p} .plan { padding: 20px 0; }
    ${p} .plan .detail { max-width: none; }
    ${p} .liste-q { margin-top: 32px; }
    ${p} .q { grid-template-columns: 1fr; gap: 10px; padding: 20px 0; }
    ${p} .q p { max-width: none; }
    ${p} .actions { margin-top: 28px; flex-direction: column; align-items: stretch; }
    ${p} .btn { justify-content: center; }
    ${p} .duo { margin-top: 32px; grid-template-columns: 1fr; gap: 26px; }
    ${p} .duo > * + * { border-left: 0; padding-left: 0; border-top: 1px solid var(--line); padding-top: 26px; }
    ${p} .duo h3, ${p} .duo p { max-width: none; }`;
}

/** Le seuil unique du site : au-delà on lit une page, en deçà une colonne. */
export const SEUIL_TELEPHONE = "(max-width: 860px)";

/**
 * La feuille du site public. `PageShell` la pose une fois ; toute page qui
 * vit dedans peut employer le contrat sans rien déclarer.
 */
export function VocabulaireRecit() {
  const feuille =
    jetonsRecit(".safe-vitrine") +
    reglesRecit(".safe-vitrine") +
    `\n  @media ${SEUIL_TELEPHONE} {` +
    reglesRecitAuPouce(".safe-vitrine") +
    `\n  }`;
  return <style dangerouslySetInnerHTML={{ __html: feuille }} />;
}

/* ── Les composants ─────────────────────────────────────────────────────── */

/* ── L'observateur ──────────────────────────────────────────────────────────
   Une seule instance pour toute la page, montée par la coquille. Elle marque
   les blocs elle-même plutôt que d'obliger chaque composant à le déclarer :
   une page qui oublie un attribut ne doit pas se retrouver avec un bloc qui
   ne paraît jamais. */
const CIBLES = [
  ".recit h1",
  ".recit h2",
  ".recit .dire",
  ".recit .capture",
  ".recit .onglets",
  ".recit .chute",
  ".recit .actions",
  ".recit .note",
  ".recit .signature",
  ".recit .morceau",
  ".recit .index-modules .mod",
  ".recit .q",
  ".recit .plan",
  ".recit .figures > *",
  ".recit .formulaire",
].join(", ");

/**
 * Découpe la première moitié de la phrase en mots, pour que l'encre les
 * traverse un par un. On ne touche qu'aux nœuds de texte : un lien ou une
 * emphase à l'intérieur garde sa structure.
 */
function decouperEnMots(hote: Element) {
  if (hote.querySelector(".mot")) return;
  hote.childNodes.forEach((n) => {
    if (n.nodeType !== Node.TEXT_NODE || !n.textContent) return;
    const frag = document.createDocumentFragment();
    n.textContent.split(/(\s+)/).forEach((bout) => {
      if (!bout.trim()) {
        frag.appendChild(document.createTextNode(bout));
        return;
      }
      const m = document.createElement("span");
      m.className = "mot";
      m.textContent = bout;
      frag.appendChild(m);
    });
    n.parentNode?.replaceChild(frag, n);
  });
}

export function AnimationsRecit() {
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    /* Les deux racines du site : la coquille des pages écrites, et la portée
       de l'accueil, qui a sa propre feuille. Les deux portent des sections de
       récit, donc les deux méritent le même geste. */
    const racine = document.querySelector(".safe-vitrine") ?? document.querySelector(".xc");
    if (!racine) return;

    const blocs = Array.from(racine.querySelectorAll<HTMLElement>(CIBLES));
    blocs.forEach((el) => {
      el.setAttribute("data-parait", "");
      if (el.classList.contains("dire")) {
        const gras = el.querySelector("b");
        if (gras) decouperEnMots(gras);
      }
    });

    const obs = new IntersectionObserver(
      (entrees) => {
        entrees.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          /* Le rang se compte parmi les frères DÉJÀ marqués, donc l'ordre de
             lecture et non l'ordre d'arrivée dans l'observateur. Plafonné à
             quatre : au-delà, une liste de dix rangées finirait une seconde
             après qu'on l'a dépassée. */
          const freres = el.parentElement
            ? Array.from(el.parentElement.children).filter((n) => n.hasAttribute("data-parait"))
            : [el];
          const rang = Math.min(Math.max(freres.indexOf(el), 0), 4);
          el.style.transitionDelay = rang * 70 + "ms";
          el.querySelectorAll<HTMLElement>(".mot").forEach((m, i) => {
            m.style.transitionDelay = rang * 70 + 90 + i * 40 + "ms";
          });
          el.setAttribute("data-parait", "vu");
          obs.unobserve(el);
        });
      },
      /* La marge négative retarde le déclenchement de dix pour cent de la vue :
         un bloc qui s'anime alors qu'il touche à peine le bord bas se termine
         avant qu'on l'ait regardé. */
      { rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
    );
    /* Ce qui est DÉJÀ PASSÉ ne s'anime pas.

       Un observateur ne signale que ce qui croise la vue. Une page ouverte sur
       une ancre, ou rouverte à la position où on l'avait laissée, laisse donc
       au-dessus d'elle des blocs qui n'ont jamais croisé la vue et qui restent
       à l'opacité zéro. On les pose d'emblée : ils ne sont pas à découvrir, on
       les a déjà dépassés. */
    blocs.forEach((el) => {
      if (el.getBoundingClientRect().bottom <= 0) {
        el.setAttribute("data-parait", "vu");
        return;
      }
      obs.observe(el);
    });

    return () => obs.disconnect();
  }, []);
  return null;
}

/** Une section de récit. `socle` la pose sur le plan sombre qui porte une fenêtre. */
export function Recit({
  id,
  socle,
  children,
}: {
  id?: string;
  socle?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={socle ? "recit socle" : "recit"} id={id}>
      <div className="inner">{children}</div>
    </section>
  );
}

/**
 * Le titre et sa phrase, à la même hauteur.
 *
 * `dire` attend deux moitiés : la première prend l'encre pleine, la seconde
 * reste en gris. Le contraste dit où commencer, sans rien cacher.
 */
export function Tete({
  titre,
  dire,
  suite,
}: {
  titre: React.ReactNode;
  dire?: [React.ReactNode, React.ReactNode];
  suite?: React.ReactNode;
}) {
  return (
    <div className="tete">
      <h2>{titre}</h2>
      {dire ? (
        <p className="dire">
          <b>{dire[0]}</b> {dire[1]}
          {suite}
        </p>
      ) : null}
    </div>
  );
}

/**
 * L'ouverture d'une page : le seul h1, et la phrase qui le tient.
 *
 * Elle remplace l'ancien PageHeader, qui centrait un exergue en mono, un titre
 * et une intro dans une colonne de 768 px. Trois pages sur huit avaient trois
 * largeurs de colonne différentes ; ici il n'y en a qu'une, celle du site.
 */
export function Ouverture({
  titre,
  dire,
}: {
  titre: React.ReactNode;
  dire?: [React.ReactNode, React.ReactNode];
}) {
  return (
    <section className="recit ouverture">
      <div className="inner">
        <div className="tete">
          <h1>{titre}</h1>
          {dire ? (
            <p className="dire">
              <b>{dire[0]}</b> {dire[1]}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** L'index numéroté. Les entrées sont nommées, jamais décrites. */
export function IndexNumerote({ entrees }: { entrees: readonly (readonly [string, string])[] }) {
  return (
    <div className="index-modules">
      {entrees.map(([n, t], i) => (
        <div className={i % 2 === 1 ? "mod colonne-droite" : "mod"} key={n}>
          <span className="n">{n}</span>
          <span className="t">{t}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Une fenêtre de l'application.
 *
 * Les dimensions sont celles du fichier, pas une mise à l'échelle : Next
 * réserve la place exacte, donc rien ne saute au chargement.
 */
export function Capture({
  src,
  alt,
  largeur = 4080,
  hauteur = 2580,
  priorite,
}: {
  src: string;
  alt: string;
  largeur?: number;
  hauteur?: number;
  priorite?: boolean;
}) {
  return (
    <div className="capture">
      <Image
        src={src}
        alt={alt}
        width={largeur}
        height={hauteur}
        sizes="(max-width: 860px) 100vw, 1312px"
        quality={92}
        priority={priorite}
      />
    </div>
  );
}

export interface EcranProduit {
  readonly cle: string;
  readonly onglet: string;
  readonly src: string;
  readonly alt: string;
}

/**
 * Une fenêtre de l'application qu'on peut piloter.
 *
 * Le cadre ne bouge pas, ce qui change est l'écran qu'on regarde. Un seul
 * fichier est rendu à la fois : cinq captures en 3 200 px empilées pèseraient
 * plus d'un méga-octet au chargement, pour quatre écrans que personne ne
 * regardera peut-être.
 *
 * Les onglets sont de vrais boutons dans un `tablist` : la flèche du clavier
 * les parcourt, et le lecteur d'écran annonce lequel est choisi.
 */
export function FenetreInteractive({
  ecrans,
  id,
  largeur = 4080,
  hauteur = 2580,
}: {
  ecrans: readonly EcranProduit[];
  id: string;
  largeur?: number;
  hauteur?: number;
}) {
  const [actif, setActif] = React.useState(0);
  const ecran = ecrans[actif];
  return (
    <>
      <div className="onglets" role="tablist" aria-label="Écrans de SAFE Cabinet">
        {ecrans.map((e, i) => (
          <button
            key={e.cle}
            type="button"
            role="tab"
            id={`${id}-onglet-${e.cle}`}
            aria-selected={i === actif}
            aria-controls={`${id}-vue`}
            tabIndex={i === actif ? 0 : -1}
            onClick={() => setActif(i)}
            onKeyDown={(ev) => {
              if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft") return;
              ev.preventDefault();
              const pas = ev.key === "ArrowRight" ? 1 : -1;
              const suivant = (actif + pas + ecrans.length) % ecrans.length;
              setActif(suivant);
              document.getElementById(`${id}-onglet-${ecrans[suivant].cle}`)?.focus();
            }}
          >
            {e.onglet}
          </button>
        ))}
      </div>
      <div className="capture" id={`${id}-vue`} role="tabpanel" aria-labelledby={`${id}-onglet-${ecran.cle}`}>
        <Image
          key={ecran.cle}
          src={ecran.src}
          alt={ecran.alt}
          width={largeur}
          height={hauteur}
          sizes="(max-width: 860px) 100vw, 1312px"
          quality={92}
        />
      </div>
    </>
  );
}

/** La liste numérotée : un rang, une phrase, l'endroit où la chose vit. */
export function ListeNumerotee({
  entrees,
}: {
  entrees: readonly (readonly [string, string])[];
}) {
  return (
    <div className="morceaux">
      {entrees.map(([texte, ou], i) => (
        <div className="morceau" key={ou + i}>
          <span className="n" aria-hidden>
            {String(i + 1).padStart(2, "0")}
          </span>
          <p className="t">{texte}</p>
          <span className="ou">{ou}</span>
        </div>
      ))}
    </div>
  );
}
