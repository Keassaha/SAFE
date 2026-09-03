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
    --green: var(--si-ink-strong);
    --forest: var(--si-ink-strong);
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

    /* Le titre d'ouverture d'une page. Il ne servait plus a rien : l'ouverture
       prenait « --t-marque », la mesure des titres de SECTION, et pesait donc
       exactement autant qu'eux. Il reprend du service au cran C3, aligne sur
       l'accueil. */
    --t-affiche: clamp(21px, 1.9vw, 26px);
    /* Descendu le 2026-08-24 avec l'affiche : l'echelle entiere pesait trop
       lourd. L'ECART entre l'affiche et la marque est conserve, c'est lui qui
       dit lequel des deux est le heros de la page. */
    /* Descendu de 46 px a 33 px le 2026-08-25. Le hero est passe a 38 px au
       cran C3 : un titre de section a 46 px pesait donc PLUS que le titre de
       la page, et la hierarchie disait le contraire de la verite. Il reste
       cinq pixels sous le hero, ce qui suffit tant que les deux ne partagent
       pas la meme fonte. */
    --t-marque: clamp(19px, 1.7vw, 22px);
    --t-titre: clamp(26px, 3.1vw, 40px);     /* le sous-titre qui le développe */
    /* Le titre d'un CHAPITRE. Il existe parce qu'une page qui raconte a besoin
       de trois niveaux, pas deux : la page, le chapitre, la phrase. Sans lui,
       un titre de chapitre pesait exactement autant que le titre de la page,
       et rien ne disait ou on se trouvait dans l'histoire. */
    --t-chapitre: clamp(19px, 1.7vw, 22px);
    /* Le rembourrage d'une section de RECIT. La moitie de celui d'une section
       de produit, parce qu'un chapitre n'a pas de fenetre a faire respirer.

       Resserre une seconde fois le 2026-08-25 : chaque chapitre porte
       desormais son filet de separation, donc la distance n'a plus a dire
       toute seule ou l'un finit et ou l'autre commence. Elle ne sert plus
       qu'a respirer. */
    --souffle-recit: clamp(38px, 5vh, 58px);
    --t-argument: clamp(19px, 1.75vw, 24px); /* la phrase mise en avant */
    --t-corps: clamp(16px, 1.25vw, 18px);    /* la prose */
    /* La prose qui EXPLIQUE, calee sur la phrase de tete. Voir la note dans
       ExperienceCinema.tsx : ce qui developpe une idee prend cette mesure, ce
       qui legende un chiffre garde --t-detail. */
    --t-explique: clamp(18px, 1.55vw, 21px);
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
    font-family: var(--sans);
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
    font-size: var(--t-explique);
    line-height: 1.45;
    letter-spacing: -0.006em;
    max-width: 40ch;
    color: var(--muted);
  }
  ${p} .recit .dire b { font-weight: 400; color: var(--si-ink); }

  /* ── Le titre d'ouverture, en Geist ───────────────────────────────────────
     Meme demande que sur l'accueil : le hero prend la fonte des sous-textes.
     Le titre de CHAPITRE reste en serif : c'est l'ecart entre les deux qui
     dit lequel ouvre la page et lequel ouvre un chapitre. */
  ${p} .recit.ouverture h1 {
    font-family: var(--sans);
    font-weight: 400;
    font-size: var(--t-affiche);
    /* Meme cran que l'accueil, C3. Voir la note dans ExperienceCinema.tsx. */
    line-height: 1.02;
    /* -0.024 em et non -0.042 depuis que SAFE Grotesk porte le resserrement
       DANS son fichier, 9/1000 d'em par cote. Les deux s'additionnaient. */
    letter-spacing: -0.024em;
    max-width: 26ch;
  }
  ${p} .recit.ouverture h1 em { font-style: normal; color: var(--si-brand-green); }

  /* ── Le chapitre ──────────────────────────────────────────────────────────
     Trois pieces, et elles ne servent QUE sur une page qui raconte. Une page
     de produit n'a pas de chapitres : elle a des sections, ce qui n'est pas la
     meme chose. C'est pourquoi rien ici ne s'applique sans la classe.

     Le numero en mono, l'accent editorial, et un titre qui descend d'un cran.
     L'ecart entre le titre de page et le titre de chapitre est ce qui dit
     lequel des deux est le heros, exactement comme entre l'affiche et la
     marque plus haut. */
  ${p} .recit .chapitre {
    font-family: var(--mono);
    font-size: var(--t-menu);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--si-brand-green);
    margin-bottom: 13px;
  }

  /* ── Le recit en colonne unique et son rail ───────────────────────────────
     Remplace la colonne vertebrale du 2026-08-25 au matin. Elle marquait la
     descente d'un filet et de six points, mais elle ne NOMMAIT pas les
     chapitres : on savait qu'on avancait, jamais dans quoi.

     Le rythme d'abord. Le rembourrage de section du site est calibre pour une
     page de PRODUIT, ou chaque section porte une fenetre d'application. Un
     recit n'a que du texte : ses chapitres sont des paragraphes, pas des
     sections. Il descend donc a la moitie.

     La grille ensuite. Le rail tient 200 px a gauche, le recit occupe le
     reste dans une mesure de lecture unique. Le titre, la citation et la
     prose descendent l'un sous l'autre : c'est ce que veut dire lineaire.

     Le rail est COLLANT et non fixe : colle, il s'arrete de lui-meme au bout
     du recit, sans qu'on ait a calculer ou l'arreter. */
  ${p}:has(.recit-chapitres) .recit { padding-block: var(--souffle-recit); }
  ${p}:has(.recit-chapitres) .recit.ouverture {
    padding-block: clamp(132px, 19vh, 216px) var(--souffle-recit);
  }
  ${p} .grille-recit {
    display: grid;
    grid-template-columns: 200px minmax(0, 1fr);
    gap: clamp(40px, 5vw, 76px);
    align-items: start;
  }
  ${p} .rail-chapitres { position: sticky; top: clamp(96px, 14vh, 140px); }
  ${p} .rail-titre {
    font-family: var(--sans);
    font-size: var(--t-detail);
    font-weight: 600;
    color: var(--si-ink);
    margin: 0 0 16px;
  }
  ${p} .rail-chapitres ol { list-style: none; margin: 0; padding: 0; }
  ${p} .rail-chapitres li { position: relative; }
  ${p} .rail-chapitres a {
    display: block;
    padding: 8px 0 8px 32px;
    font-family: var(--sans);
    font-size: var(--t-detail);
    color: var(--si-subtle);
    text-decoration: none;
    transform-origin: left center;
    /* 240 ms : assez lent pour qu'on voie le chapitre changer, assez court
       pour que le rail ne traine pas derriere le defilement. */
    transition:
      color 240ms ease,
      transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  ${p} .rail-chapitres a:hover { color: var(--si-body); }
  ${p} .rail-chapitres li:hover .rail-sym { opacity: 0.62; }

  /* ── Le symbole du resume ─────────────────────────────────────────────────
     Le rail portait un point. Il disait « vous etes ici » et rien d'autre. Le
     symbole dit en plus DE QUOI parle le chapitre, et les six empiles font du
     resume une table des matieres visuelle. Demande CEO du 2026-08-25.

     Trois etats, un seul a la fois, exactement ceux du point qu'il remplace :

       a venir   encre a 30 %, discret
       derriere  encre a 50 %, un peu plus present
       courant   VERT et grossi

     Le zoom descend a 1,22 alors que le point montait a 2. Un rond supporte de
     doubler ; une forme dessinee devient molle et son trait s'epaissit a
     l'oeil. La couleur porte donc l'essentiel du signal, le zoom l'appuie. */
  ${p} .rail-chapitres .rail-sym {
    position: absolute;
    left: 0;
    top: 50%;
    margin-top: -10px;
    color: var(--si-ink);
    opacity: 0.3;
    pointer-events: none;
    transform-origin: center;
    transition:
      color 240ms ease,
      opacity 240ms ease,
      transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Derriere : le chemin parcouru. */
  ${p} .rail-chapitres li.passe a { color: var(--si-muted); }
  ${p} .rail-chapitres li.passe .rail-sym { opacity: 0.5; }

  /* Courant : le symbole devient vert et grossit, le libelle avance avec lui.
     Les deux marques disent la meme chose au meme instant, l'une par la
     couleur, l'autre par la taille. C'est ce qui rend le reperage instantane
     sans avoir a lire le libelle. */
  ${p} .rail-chapitres li.on a {
    color: var(--si-ink);
    transform: translateX(4px);
  }
  ${p} .rail-chapitres li.on .rail-sym {
    color: var(--si-brand-green);
    opacity: 1;
    transform: scale(1.22);
  }

  @media (prefers-reduced-motion: reduce) {
    ${p} .rail-chapitres a,
    ${p} .rail-chapitres .rail-sym { transition-duration: 1ms; }
    ${p} .rail-chapitres li.on a { transform: none; }
    ${p} .rail-chapitres li.on .rail-sym { transform: none; }
  }

  /* Un chapitre, en descente. */
  ${p} .chap-bloc { scroll-margin-top: clamp(96px, 14vh, 140px); }
  ${p} .chap-bloc + .chap-bloc {
    margin-top: var(--souffle-recit);
    padding-top: var(--souffle-recit);
    border-top: 1px solid var(--si-line);
  }
  ${p} .chap-bloc h2 { margin: 0 0 14px; max-width: 20ch; }
  ${p} .chap-bloc .cit { max-width: 34ch; }
  ${p} .colonne-recit { max-width: 62ch; }

  @media (max-width: 900px) {
    /* La grille redevient un simple bloc, elle ne se contente pas de passer a
       une colonne. Deux raisons, toutes deux mesurees :

       1. Un element colle dans une GRILLE est contenu par sa zone de grille.
          En une colonne, la zone du resume ne fait que sa propre hauteur : il
          se decollait donc des qu'on avait defile de sa hauteur. En bloc, il
          est contenu par la section entiere et tient jusqu'au dernier
          chapitre.
       2. Un element de grille a « min-width: auto » : la ligne de six entrees
          forcait sa colonne a s'elargir, et la page debordait de 448 px vers
          la droite au lieu de laisser le ruban defiler. */
    ${p} .grille-recit { display: block; }
    /* Le bandeau est tire hors de la colonne par une marge negative, pour
       toucher les deux bords de l'ecran. Sans ce clip, la page debordait de
       26 px vers la droite. On dit « clip » et non « hidden » : « hidden »
       cree un contexte de defilement qui casse le « position: sticky » du
       bandeau, ce qui reviendrait a echanger un defaut contre un pire. */
    ${p} .recit-chapitres { overflow-x: clip; }
    ${p} .rail-chapitres, ${p} .colonne-recit { min-width: 0; }

    /* ── Le resume au telephone ───────────────────────────────────────────
       En colonne, une table des matieres de six lignes mange le premier
       ecran. Elle devient donc un bandeau d'UNE ligne, qui defile
       horizontalement et reste COLLE sous la barre.

       Colle et non statique : pose en haut du recit, il disparaissait au
       premier defilement, et le suivi vert ne servait plus a rien. Or c'est
       precisement au telephone, ou l'on ne voit qu'un ecran a la fois, qu'on
       a le plus besoin de savoir ou l'on est.

       Le titre du resume tombe : la page dit deja de quoi elle parle, et sur
       une ligne collante chaque pixel de hauteur se paie. */
    ${p} .rail-chapitres {
      position: sticky;
      top: 60px;
      z-index: 3;
      margin: 0 calc(-1 * var(--gouttiere)) 26px;
      padding: 9px var(--gouttiere);
      background: var(--si-canvas);
      border-bottom: 1px solid var(--si-line);
    }
    ${p} .rail-titre { display: none; }
    ${p} .rail-chapitres ol {
      display: flex;
      flex-wrap: nowrap;
      gap: 0 22px;
      overflow-x: auto;
      scrollbar-width: none;
      scroll-behavior: smooth;
    }
    ${p} .rail-chapitres ol::-webkit-scrollbar { display: none; }
    ${p} .rail-chapitres li { flex: 0 0 auto; }
    ${p} .rail-chapitres a { padding: 3px 0 3px 22px; white-space: nowrap; }
    ${p} .rail-chapitres .rail-sym { margin-top: -8px; }
    ${p} .rail-chapitres .rail-sym svg { width: 16px; height: 16px; }
    ${p} .colonne-recit { max-width: none; }
  }

  /* ── La citation ──────────────────────────────────────────────────────────
     La phrase qui porte le chapitre passe dans le serif et entre guillemets.
     Ce n'est pas un ornement : les guillemets attribuent la phrase a quelqu'un,
     et sur cette page ce quelqu'un signe a la fin. On ne cite donc QU'UNE
     phrase par chapitre, celle qui porte la these. Citer aussi les phrases de
     produit reviendrait a mettre de la voix dans une bouche pour faire joli.

     Les guillemets pendent dans la marge : le texte reste aligne sur la
     colonne, et l'ouverture se voit sans decaler la lecture. */
  /* La citation est passee en Geist elle aussi le 2026-08-25, sur demande.
     Elle etait le dernier endroit du site public en serif. Ce qui la tient
     encore a part, ce sont les guillemets verts et la mesure courte : la voix
     est portee par la ponctuation, plus par la fonte. */
  /* ── Trois niveaux, pas six ────────────────────────────────────────────────
     Un chapitre portait SIX tailles : 11, 12, 15, 18, 24 et 27 px. Chacune
     avait sa raison le jour ou elle est arrivee, et ensemble elles disaient
     qu'il y avait six rangs d'importance dans un texte qui n'en a que trois.
     Demande CEO du 2026-08-25.

     L'echelle d'un chapitre tient desormais en trois roles :

       le repere   11 px, mono          le rang, le numero, l'endroit
       le titre    27 px                un seul par chapitre
       le corps    18 px                tout ce qui se lit en phrases

     La citation, la prose, la chute et les entrees d'index partagent donc la
     MEME taille. Ce qui les distingue n'est plus le corps mais la couleur et
     la ponctuation : la citation garde son encre pleine et ses guillemets
     verts, la prose passe au gris. Une difference de trois pixels entre deux
     blocs ne se lit pas comme une hierarchie, elle se lit comme une hesitation. */
  ${p} .recit .cit {
    font-family: var(--sans);
    font-weight: 400;
    font-size: var(--t-explique);
    line-height: 1.5;
    letter-spacing: -0.012em;
    color: var(--si-ink);
    max-width: 30ch;
    margin: 0 0 12px;
    padding-left: 1.05em;
    position: relative;
  }
  ${p} .recit .cit::before {
    content: "\u00AB";
    position: absolute;
    left: 0;
    top: -0.06em;
    color: var(--si-brand-green);
    font-size: 1.3em;
    line-height: 1;
  }
  ${p} .recit .cit::after { content: "\u00A0\u00BB"; color: var(--si-brand-green); }
  /* Le corps qui suit la citation.
     Il est BICOLORE quand il se donne en deux moities, du meme geste que la
     phrase d'ouverture : l'affirmation en encre pleine, ce qui la developpe
     en gris. Ce n'est pas une hierarchie de qualite, c'est un point d'entree.
     L'oeil sait ou commencer et lit la suite s'il veut, au lieu de tomber
     dans un bloc d'un seul ton. Demande CEO du 2026-08-25.

     Le gris est donc le fond, et l'encre l'exception. L'inverse revenait a
     mettre l'accent sur les trois quarts du texte. */
  ${p} .recit .apres-cit {
    font-family: var(--sans);
    color: var(--si-muted);
    font-size: var(--t-explique);
    line-height: 1.68;
    max-width: 44ch;
    margin: 0;
  }
  ${p} .recit .apres-cit b { font-weight: 400; color: var(--si-ink); }

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
  ${p} .ligne .l { font-family: var(--sans); font-size: 13px; color: var(--si-ink); }
  ${p} .ligne .l small { color: var(--muted); font-size: 12px; }
  ${p} .ligne .v {
    font-family: var(--mono);
    font-size: 13px;
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
  ${p} .index-modules .mod .n { font-family: var(--mono); font-size: var(--t-menu); color: var(--si-subtle); }
  ${p} .index-modules .mod .t { font-family: var(--sans); font-size: var(--t-corps); color: var(--si-ink); }
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
    font-size: 13px;
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
    font-size: 13px;
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

  /* ── La jonction entre deux chapitres ────────────────────────────────────
     Entre le dernier écran d'une section et le titre de la suivante, la page
     passait d'un contenu à un autre sans rien dire : un vide, puis un titre.
     La jonction marque le seuil : un numéro en mono (le même vocabulaire que
     .fig-num et .morceau .n, jamais une police différente — l'identité de
     marque fixe la typographie du site à deux familles, et une transition se
     signale par le mouvement, pas par une troisième police), un tiret qui
     s'allonge, le nom du chapitre qui commence.

     Centrée, jamais alignée sur la colonne : c'est un repère de lecture, pas
     un contenu, et un repère centré se distingue d'un coup d'œil de tout ce
     qui l'entoure. */
  ${p} .jonction {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding-block: clamp(48px, 8vh, 96px);
  }
  ${p} .jonction .tick { width: 48px; height: 1.5px; border-radius: 2px; background: var(--green); opacity: 1; }
  ${p} .jonction .num {
    font-family: var(--mono);
    font-size: var(--t-menu);
    letter-spacing: 0.1em;
    color: var(--si-subtle);
  }
  ${p} .jonction .titre {
    font-family: var(--sans);
    font-size: var(--t-menu);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
  }

  /* ── Le vocabulaire d'appoint ─────────────────────────────────────────────
     La phrase qui referme une section, le lien de fin de bloc dont le filet
     s'allonge au survol (le seul mouvement de ces sections), et l'exergue qui
     nomme le rang de ce qu'on lit. */
  ${p} .chute {
    font-family: var(--sans);
    font-weight: 400;
    font-size: var(--t-corps);
    line-height: 1.68;
    letter-spacing: -0.012em;
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
  ${p} .morceaux { margin-top: clamp(26px, 3.4vh, 42px); }
  /* Aucun filet entre les entrees (demande CEO du 2026-08-25). Les chapitres
     sont deja separes par un filet chacun : une liste qui en remet un entre
     chacune de ses lignes fabrique une grille la ou il n'y a qu'une suite.
     L'ecart vertical suffit a separer, et il coute moins de hauteur. */
  ${p} .morceau {
    display: grid;
    grid-template-columns: 30px 1fr auto;
    column-gap: 14px;
    align-items: baseline;
    padding: 9px 0;
  }
  ${p} .morceau .n {
    font-family: var(--mono);
    font-size: var(--t-menu);
    letter-spacing: 0.1em;
    color: var(--si-subtle);
  }
  ${p} .morceau .t { font-family: var(--sans); font-size: var(--t-explique); color: var(--si-ink); }
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

    /* ── La jonction entre deux chapitres ────────────────────────────────────
       Le seul mouvement qui lui appartient, en plus du fondu commun à toutes
       les cibles : le tiret vert, plein à l'arrivée, part d'un tiret court et
       terne, comme celui du rail de chapitres à droite de la page. Une même
       forme dit une même chose aux deux endroits : « vous changez de
       chapitre ». */
    ${p} .jonction[data-parait] .tick {
      width: 12px;
      opacity: 0.45;
      transition: width 0.9s var(--doux), opacity 0.6s ease;
    }
    ${p} .jonction[data-parait="vu"] .tick { width: 48px; opacity: 1; }
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
    font-family: var(--sans);
    font-weight: 400;
    font-size: var(--t-argument);
    line-height: 1.35;
  }
  ${p} .q p {
    max-width: 58ch;
    font-family: var(--sans);
    font-size: 14px;
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
    box-shadow: 0 14px 28px -18px rgb(var(--si-ink-strong-rgb) / 0.85);
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
    font-family: var(--sans);
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
    ${p} .onglets button { flex: 0 0 auto; padding: 9px 12px 11px; font-size: 13px; }
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
  ".recit .chapitre",
  ".recit .cit",
  ".recit .apres-cit",
  ".recit .capture",
  ".recit .onglets",
  ".recit .chute",
  ".recit .actions",
  ".recit .note",
  ".recit .signature",
  ".recit .morceau",
  /* Les cinq reglages du mouvement 5. La ligne d'introduction ET chaque carte
     du bento, pour qu'elles se posent l'une apres l'autre au lieu d'arriver
     d'un bloc : c'est la seule chose de ce mouvement qui bougeait, et elle ne
     bougeait pas. Le rang se compte parmi les freres, donc l'ordre de lecture,
     et le decalage vient de la regle generale plus bas. */
  ".recit .adaptations .mene",
  ".recit .bento .reglage",
  /* Les cinq temps du mouvement 6, meme geste et meme decalage. */
  ".recit .parcours .l",
  ".recit .index-modules .mod",
  ".recit .q",
  ".recit .plan",
  ".recit .figures > *",
  ".recit .formulaire",
  ".recit .jonction",
  /* La fiche de dossier de l'accueil s'anime bloc par bloc, avec le meme
     geste que le reste de la page : c'est l'observateur existant qui la
     revele, pas une animation de plus. */
  ".recit .anime-bloc",
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
  chapitre,
  citer,
}: {
  titre: React.ReactNode;
  dire?: [React.ReactNode, React.ReactNode];
  suite?: React.ReactNode;
  /** Le rang du chapitre, sur une page qui raconte. Descend aussi le titre. */
  chapitre?: string;
  /** La premiere moitie de `dire` passe entre guillemets, la seconde en prose. */
  citer?: boolean;
}) {
  /* Le chapitre et son titre partagent UNE cellule de la grille. Sans cette
     enveloppe, `.tete` se retrouvait avec trois enfants pour deux colonnes, et
     la phrase passait a la ligne sous le titre. */
  const colonneTitre = chapitre ? (
    <div>
      <p className="chapitre">{chapitre}</p>
      <h2>{titre}</h2>
    </div>
  ) : (
    <h2>{titre}</h2>
  );

  return (
    <div className={chapitre ? "tete tete-chapitre" : "tete"}>
      {colonneTitre}
      {dire && citer ? (
        <div>
          <blockquote className="cit">{dire[0]}</blockquote>
          <p className="apres-cit">
            {dire[1]}
            {suite}
          </p>
        </div>
      ) : dire ? (
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

/**
 * Les symboles du résumé.
 *
 * Un par chapitre, tous au même poids de trait, tous tirés de ce que le
 * chapitre raconte. Aucun n'est décoratif : quelqu'un qui parcourt le résumé
 * sans lire apprend déjà le mouvement du récit.
 *
 * Ce qui les tient ensemble, c'est que DEUX D'ENTRE EUX SE RÉPONDENT. Au
 * constat, trois traits qui ne se rejoignent jamais ; à l'application, six
 * carrés qui se touchent. Posés l'un au-dessus de l'autre dans le résumé, ils
 * disent le récit entier avant qu'on ait lu une ligne. Un jeu d'icônes
 * achetées n'aurait pas fait ça.
 *
 * Ils sont écrits en JSX et non en chaîne : une forme injectée par innerHTML
 * ne se relit pas, et celles-ci ont vocation à être discutées.
 */
const SYMBOLES_RECIT: Record<string, React.ReactNode> = {
  /** Trois traits parallèles qui ne se touchent pas : les trois ruptures. */
  ruptures: <path d="M3 6h7M14 6h7M3 12h11M18 12h3M3 18h5M12 18h9" />,
  /** Quatre cellules : la première version de SAFE. */
  tableur: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1" />
      <path d="M3.5 9.5h17M12 4.5v15" />
    </>
  ),
  /** Six carrés qui se touchent : les six registres, un seul contexte. */
  registres: (
    <>
      <rect x="3.5" y="5.5" width="5" height="5" />
      <rect x="9.5" y="5.5" width="5" height="5" />
      <rect x="15.5" y="5.5" width="5" height="5" />
      <rect x="3.5" y="13.5" width="5" height="5" />
      <rect x="9.5" y="13.5" width="5" height="5" />
      <rect x="15.5" y="13.5" width="5" height="5" />
    </>
  ),
  /** Un centre et ses satellites : l'application et les outils autonomes. */
  satellites: (
    <>
      <rect x="8.5" y="8.5" width="7" height="7" rx="1" />
      <circle cx="5" cy="5" r="1.6" />
      <circle cx="19" cy="5" r="1.6" />
      <circle cx="5" cy="19" r="1.6" />
      <circle cx="19" cy="19" r="1.6" />
    </>
  ),
  /** Quatre temps sur une ligne. Le dernier reste ouvert : on ne l'arrête pas. */
  temps: (
    <>
      <path d="M3 12h18" />
      <circle cx="4.5" cy="12" r="1.8" />
      <circle cx="9.5" cy="12" r="1.8" />
      <circle cx="14.5" cy="12" r="1.8" />
      <circle cx="19.5" cy="12" r="1.8" fill="none" />
    </>
  ),
  /** Une seule marque : le seul chapitre qui ne décrit pas un système. */
  personne: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </>
  ),
};

/**
 * Le symbole d'une entrée du résumé.
 *
 * 20 px et non 26 : dans une entrée de 14 px, plus gros écrase le libellé.
 * Il est retiré aux lecteurs d'écran, le libellé dit déjà le chapitre.
 */
function SymboleRail({ nom }: { nom?: string }) {
  const forme = nom ? SYMBOLES_RECIT[nom] : null;
  if (!forme) return null;
  return (
    <span className="rail-sym" aria-hidden>
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {forme}
      </svg>
    </span>
  );
}

/**
 * Un chapitre de récit, en colonne unique.
 *
 * Il remplace la grille à deux colonnes (titre à gauche, phrase à droite) pour
 * les pages qui RACONTENT. Deux colonnes font ping-ponger l'oeil de gauche à
 * droite à chaque chapitre ; un récit se lit en descendant. Demande CEO du
 * 2026-08-25, sur le modèle de cursor.com/grok.
 */
export function Chapitre({
  rang,
  nom,
  titre,
  cite,
  prose,
  children,
}: {
  /** « 01 ». Sert d'ancre, de libellé de rail et de repère de lecture. */
  rang: string;
  nom: string;
  titre: React.ReactNode;
  /** La phrase qui porte le chapitre. Elle passe entre guillemets. */
  cite?: React.ReactNode;
  /**
   * La prose du chapitre. Donnee en DEUX moities, elle devient bicolore :
   * l'affirmation prend l'encre pleine, ce qui la developpe reste en gris.
   *
   * On ne coupe pas une phrase pour le plaisir de la couper. Deux des six
   * chapitres du recit portent une seule phrase courte : ils restent d'un
   * seul ton, et c'est juste. Une bicolore posee partout ne signale plus
   * rien.
   */
  prose?: React.ReactNode | readonly [React.ReactNode, React.ReactNode];
  children?: React.ReactNode;
}) {
  return (
    <article className="chap-bloc" id={`ch-${rang}`} data-chapitre={rang}>
      <p className="chapitre">
        Chapitre {rang} · {nom}
      </p>
      <h2>{titre}</h2>
      {cite ? <blockquote className="cit">{cite}</blockquote> : null}
      {Array.isArray(prose) ? (
        <p className="apres-cit">
          <b>{prose[0]}</b> {prose[1]}
        </p>
      ) : prose ? (
        <p className="apres-cit">{prose}</p>
      ) : null}
      {children}
    </article>
  );
}

/**
 * Le récit et son rail.
 *
 * Le rail est une table des matières qui SUIT la lecture : le chapitre courant
 * passe du gris à l'encre et un point se pose devant lui. C'est le seul
 * mouvement de la page, et il dit une chose vraie, où on est rendu.
 *
 * Le repère de lecture est une ligne à 28 % de la hauteur de la fenêtre, pas
 * le simple fait d'être visible : avec des chapitres de hauteurs très
 * différentes, « visible » en désigne deux ou trois à la fois et le point
 * saute. On prend le dernier chapitre dont le haut a franchi la ligne.
 *
 * Le calcul se fait au défilement, en lecture seule sur la mise en page, et
 * il est encadré par requestAnimationFrame : lire une position pendant que le
 * navigateur peint force un recalcul complet à chaque pixel parcouru.
 */
export function RecitChapitres({
  titre,
  chapitres,
  children,
}: {
  titre: string;
  /** `[rang, nom, symbole]`. Le symbole est une cle de SYMBOLES_RECIT. */
  chapitres: readonly (readonly [string, string, string?])[];
  children: React.ReactNode;
}) {
  const [actif, setActif] = React.useState<string>(chapitres[0]?.[0] ?? "");

  React.useEffect(() => {
    const blocs = Array.from(document.querySelectorAll<HTMLElement>("[data-chapitre]"));
    if (!blocs.length) return;

    let enAttente = false;
    const calculer = () => {
      enAttente = false;
      const ligne = window.innerHeight * 0.28;
      let courant = blocs[0];
      for (const b of blocs) {
        if (b.getBoundingClientRect().top <= ligne) courant = b;
      }
      const rang = courant.getAttribute("data-chapitre");
      if (rang) setActif((v) => (v === rang ? v : rang));
    };
    const auDefilement = () => {
      if (enAttente) return;
      enAttente = true;
      requestAnimationFrame(calculer);
    };

    calculer();
    window.addEventListener("scroll", auDefilement, { passive: true });
    window.addEventListener("resize", auDefilement);
    return () => {
      window.removeEventListener("scroll", auDefilement);
      window.removeEventListener("resize", auDefilement);
    };
  }, []);

  /* Le rang courant dans la liste. Le rail a besoin de l'ORDRE et pas
     seulement du chapitre actif : ce qui est DERRIERE se marque autrement que
     ce qui reste a lire. */
  const iActif = Math.max(
    0,
    chapitres.findIndex(([rang]) => rang === actif),
  );

  /* Au telephone le resume devient un bandeau d'une seule ligne, plus large que
     l'ecran. Sans ce recentrage, on lirait le chapitre 05 pendant que le
     bandeau montre encore le 01 : un suivi qui ne suit pas est pire que pas de
     suivi du tout. Sur ecran large la liste tient en entier, la condition sur
     la largeur de defilement rend donc l'effet inerte. */
  const ruban = React.useRef<HTMLOListElement>(null);
  React.useEffect(() => {
    const ol = ruban.current;
    if (!ol || ol.scrollWidth <= ol.clientWidth) return;
    const courant = ol.querySelector<HTMLElement>("li.on");
    if (!courant) return;
    const doux = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ol.scrollTo({
      left: Math.max(0, courant.offsetLeft - (ol.clientWidth - courant.offsetWidth) / 2),
      behavior: doux ? "smooth" : "auto",
    });
  }, [actif]);

  return (
    <section className="recit recit-chapitres">
      <div className="inner grille-recit">
        <nav className="rail-chapitres" aria-label="Chapitres">
          <p className="rail-titre">{titre}</p>
          <ol ref={ruban}>
            {chapitres.map(([rang, nom, symbole], i) => (
              <li key={rang} className={i < iActif ? "passe" : i === iActif ? "on" : undefined}>
                <a href={`#ch-${rang}`} aria-current={i === iActif ? "true" : undefined}>
                  {rang} · {nom}
                </a>
                <SymboleRail nom={symbole} />
              </li>
            ))}
          </ol>
        </nav>
        <div className="colonne-recit">{children}</div>
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
