"use client";

/**
 * La page d'accueil de SAFE.
 *
 * Neuf sections, dans l'ordre où une avocate se pose les questions : ce
 * qu'est SAFE, ce qui cloche aujourd'hui, ce que ça change, ce que contient la
 * suite, pourquoi faire confiance au fidéicommis, ce que devient l'équipe,
 * combien ça coûte, les objections, la prochaine étape.
 *
 * Trois d'entre elles se démontrent au défilement, et trois seulement :
 * l'assemblage de la marque qui devient l'application (hero), le parcours
 * administratif d'un dossier, le rapprochement du fidéicommis. Le reste est
 * écrit, posé, lisible sans qu'on ait à faire quoi que ce soit.
 *
 * RÈGLE DE LA PAGE : aucun texte n'attend un geste pour exister. Le mouvement
 * DÉSIGNE ce dont l'écran d'à côté parle en ce moment ; il ne révèle jamais
 * l'argument lui-même. Une page dont la promesse se mérite au défilement est
 * une page vide pour qui ne défile pas.
 *
 * Le montage épinglé est réservé au large. Au téléphone, les deux scènes
 * deviennent des carrousels au doigt, et la page suit exactement le chemin de
 * « mouvement réduit » (voir SEUIL_TELEPHONE).
 *
 * Refonte du 2026-08-20, d'après docs/product/ARCHITECTURE_SITE_PUBLIC_SAFE_2026-08-20.md.
 * Le port React du prototype public/experience-cinema.html (journal 2026-07-25)
 * en reste l'ancêtre : la mécanique de défilement et l'assemblage viennent de là.
 */

import { useEffect, useRef, useState } from "react";
import { TARIFICATION, prixFr } from "@/lib/tarification";
import { SafeLogo } from "@/components/branding/SafeLogo";
import {
  ASSEMBLY_PIECE_A_PATH,
  ASSEMBLY_PIECE_B_PATH,
  SAFE_PALETTE,
} from "@/components/brand/safe-mark";
import { HeroLiveApp } from "@/components/public-site/HeroLiveApp";
/* Le pied de page du site, pas un pied de page d'accueil.
   L'accueil en portait un a lui : 98 px, fond transparent, huit liens en
   ligne. Toutes les autres pages en servent un de 386 px, vert foret, en
   trois colonnes, qui porte la mention de responsabilite professionnelle.
   Un visiteur qui passait de l'accueil a Tarification changeait de site en
   bas de page. C'est le composant partage qui gagne : il est sur dix pages,
   il porte la mention, et il n'y a aucune raison que la page la plus lue
   soit la seule a en avoir un autre. */
import { Footer } from "@/components/public-site/shared";

const CSS = `
  .xc {
    /* Thème de la vitrine. Il déclarait ses propres couleurs, restées sur
       l'ancienne palette verte, ce qui faisait diverger l'accueil du produit.
       Chaque variable pointe maintenant vers la palette. Les noms sont
       conservés : les 1 800 lignes de règles en dessous s'en servent. */
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

    /* ── Vocabulaire du mouvement ────────────────────────────────────────────
       Une seule courbe et deux durées pour toute la page.

       La courbe précédente, cubic-bezier(0.16, 1, 0.3, 1), part à très haute
       vitesse puis traîne sur sa fin : chaque apparition commençait par un
       à-coup. Celle-ci accélère et ralentit doucement, ce qui se lit comme un
       glissement (décision CEO du 13 août 2026).

       La courbe n'était que la moitié du problème. Les apparitions animaient
       aussi la hauteur, les colonnes de grille, les marges et le corps du
       texte : quatre propriétés qui forcent un recalcul de mise en page à
       chaque image. Plus rien ne bouge ici que l'opacité, la translation et
       la couleur, les seules qui n'en demandent aucun. */
    --doux: cubic-bezier(0.33, 0.06, 0.2, 1);
    --duree-entree: 780ms;
    --duree-teinte: 620ms;

    /* ── La colonne ──────────────────────────────────────────────────────────
       Une seule largeur de page et une seule gouttière, pour toute la vitrine.

       Audit du 13 août 2026 : la page employait dix-sept largeurs de contenu
       et six bords gauches pour huit titres de section, de 84 à 140 px. La
       cause n'était pas une faute de valeur mais une différence de structure :
       les scènes épinglées centraient une grille de 1160 px dans une boîte de
       1272, ce qui ajoutait 56 px à gauche, quand les sections écrites posaient
       leur contenu à même le retrait.

       Le retrait se DÉDUIT désormais de la largeur de page : la boîte de
       contenu vaut toujours --page au plus, donc une grille de --page la
       remplit exactement et ne peut plus se recentrer. Toutes les scènes
       partagent la même arête, à toutes les largeurs. Voir .colonne. */
    --page: 1160px;
    --gouttiere: min(6vw, 84px);

    /* ── L'échelle typographique ─────────────────────────────────────────────
       Vingt rampes clamp() aux triplets tous différents, dont six pour le seul
       rôle « titre de section », donnaient 24 tailles en texte éditorial. Deux
       rampes atteignaient 56 px avec des pentes différentes : les titres se
       rejoignaient aux extrêmes et divergeaient au milieu.

       L'échelle existait déjà, nommée et commentée, mais seulement sous 860 px
       (voir la requête de média plus bas). Au-dessus, ses vingt-six appels
       retombaient sur cinq valeurs littérales écrites dans les valeurs de
       repli : le système était déclaré et jamais appliqué au large.

       Le même vocabulaire monte donc en desktop, ce qui évite d'en inventer un
       second. Six rôles, six valeurs. Aucune scène n'en montre plus de quatre
       à la fois, ce qu'exige PS-007. Une taille qui change signale un
       changement de rôle, jamais un ajustement pour qu'une phrase tombe
       bien (T3). */
    --t-affiche: clamp(44px, 7.4vw, 92px);   /* le titre d'ouverture, une seule fois */
    --t-marque: clamp(34px, 4.4vw, 56px);    /* le titre d'une section écrite */
    --t-titre: clamp(26px, 3.1vw, 40px);     /* le sous-titre qui développe la marque */
    --t-argument: clamp(19px, 1.75vw, 24px); /* la phrase mise en avant d'un point */
    --t-corps: clamp(16px, 1.25vw, 18px);    /* la prose */
    --t-detail: 14px;                        /* la justification sous un point */
    --t-menu: 11px;                          /* exergue, méta, libellé : le plancher */

    background: var(--bg);
    color: var(--ink);
    font-family: var(--sans);
    -webkit-font-smoothing: antialiased;
    overflow-x: clip;
  }

  .xc a { color: inherit; text-decoration: none; }
  .xc img { display: block; max-width: 100%; }

  /* ── La serif titre, Geist parle ───────────────────────────────────────────
     Décision CEO du 21 août 2026, prise sur le premier écran puis étendue à
     toute la page.

     La règle du 13 août disait l'inverse : tout ce qui relevait du discours
     portait Instrument Serif, et Geist était réservée à l'interface. Une page
     entière en serif de titrage se lit comme un document ; l'accueil doit se
     lire comme un produit. Et le chapeau d'ouverture, qui énumère neuf postes
     d'affilée, était précisément le passage où la serif traînait le plus.

     La frontière est donc la fonction, plus le registre :

     1. INSTRUMENT SERIF, uniquement ce qui TITRE. Le titre d'ouverture, les
        titres de section, les titres de bloc, les questions. Rien d'autre. La
        serif garde son poids parce qu'elle devient rare.
     2. GEIST SANS, tout ce qui se LIT. Chapeaux, justifications, réponses,
        conclusions, forfaits, libellés, actions. C'est aussi la fonte des
        boutons, donc la page ne change plus de voix entre une phrase et
        l'action qu'elle propose.
     3. GEIST MONO, les chiffres et les repères, comme avant.

     Deux exceptions, et elles ne sont pas de la vitrine :
     - Les maquettes de l'application (#hero-app, .fi-ecran, .co-ecran) suivent
       la typographie du produit, pas celle de la page : Geist pour les
       libellés, mono pour les chiffres, serif pour le seul titre d'écran
       (SAFE_PREMIUM_DESIGN_STANDARD §2.3). Les repeindre, ce serait montrer un
       produit qui n'existe pas.
     - La famille reste déclarée règle par règle plutôt qu'imposée par un
       sélecteur global : c'est ce qui a permis de retourner la règle en une
       passe sans toucher aux deux registres ci-dessus. */

  /* Une référence de dossier reste d'un seul tenant. Sur une colonne étroite,
     « 2026-011 » passait à la ligne après son trait d'union et se lisait comme
     deux références au lieu d'une, sur la page même qui vend la rigueur
     comptable (SAFE_PREMIUM_DESIGN_STANDARD L1). */
  .xc .ref { white-space: nowrap; }

  .xc .kicker {
    font-family: var(--sans);
    font-size: 11px;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--green);
  }

  /* Barre flottante en verre. Détachée du bord, arrondie, claire.
     Le verre dit qu'elle passe AU-DESSUS des scènes qui défilent (P10), et sa
     clarté permet au logo de garder sa teinte de charte. Repli opaque plus bas
     pour les navigateurs sans backdrop-filter et pour les personnes qui
     réduisent la transparence. */
  /* La barre du site (décision CEO du 18 août 2026).

     La vitrine portait trois en-têtes : cette pastille flottante, la pastille
     de verre des pages partagées, et la barre du diagnostic gratuit. La
     dernière est retenue, parce qu'elle est la seule à montrer une action.
     L'accueil s'y range.

     Ce qui change ici : la barre touche les bords au lieu de flotter dans un
     retrait, elle se pose sur un filet au lieu d'une ombre, elle perd ses
     coins arrondis, et son opacité monte de 0,82 à 0,92 pour rester claire
     au-dessus des scènes sombres du récit. Les retraits latéraux reprennent
     ceux du composant partagé, 24 px puis 44 px, et non plus la gouttière de
     la page. */
  .xc #nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 0 44px;
    height: 60px;
    background: rgb(var(--si-surface-rgb) / 0.92);
    backdrop-filter: blur(18px) saturate(1.35);
    -webkit-backdrop-filter: blur(18px) saturate(1.35);
    border-bottom: 1px solid var(--line);
  }
  @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    .xc #nav { background: var(--si-surface); }
  }
  @media (prefers-reduced-transparency: reduce) {
    .xc #nav { background: var(--si-surface); backdrop-filter: none; -webkit-backdrop-filter: none; }
  }
  .xc #nav .brand {
    display: inline-flex;
    align-items: center;
    color: var(--si-ink);
  }
  .xc #nav .links { display: flex; gap: 4px; font-size: 13px; }
  .xc #nav .links a {
    padding: 8px 12px;
    border-radius: 8px;
    color: var(--si-muted);
    transition: color 140ms ease, background-color 140ms ease;
  }
  .xc #nav .links a:hover { color: var(--si-ink); background: rgb(var(--si-line-ink-rgb) / 0.05); }
  .xc #nav .navright { display: flex; align-items: center; gap: 6px; }
  .xc #nav .signin {
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13px;
    color: var(--si-muted);
    transition: color 140ms ease;
  }
  .xc #nav .signin:hover { color: var(--si-ink); }
  /* Une seule action pleine dans la barre, en noir. */
  .xc #nav .cta {
    display: inline-flex;
    align-items: center;
    height: 36px;
    padding: 0 16px;
    border-radius: 8px;
    background: var(--si-forest);
    color: var(--si-surface);
    font-size: 13px;
    font-weight: 500;
    transition: background-color 140ms ease;
  }
  .xc #nav .cta:hover { background: var(--si-forest-soft); }

  /* Le rail indiquait où l'on se trouve sans permettre d'y aller : quatre
     jalons inertes, retirés du clavier et des lecteurs d'écran, sur une page
     de près de quatorze mille pixels. Un repère qui connaît la structure de la
     page doit servir à la parcourir. Il devient donc une vraie navigation :
     ancres natives, donc fonctionnelle sans script et au clavier.

     Invisible, il passe aussi en visibility hidden : un lien qu'on ne voit pas
     ne doit pas pouvoir recevoir le focus. */
  /* Le rail des scènes.

     Il vit dans la marge, et la marge n'existe que si l'écran est plus large
     que la colonne. À 1280 px, la page occupe 1160 : il ne reste que 60 px de
     chaque côté, et le libellé du jalon passait par-dessus l'écran de
     démonstration, qui est aligné à droite de la colonne. Il ne s'affiche donc
     qu'au-delà de 1400 px, où la marge lui appartient vraiment. En dessous, la
     page se lit très bien sans lui : il repère, il ne dit rien. */
  @media (max-width: 1399px) {
    .xc #rail { display: none; }
  }
  .xc #rail {
    position: fixed;
    right: 22px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 40;
    display: flex;
    flex-direction: column;
    gap: 4px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.8s ease, visibility 0s linear 0.8s;
    pointer-events: none;
  }
  .xc #rail.on {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transition: opacity 0.8s ease, visibility 0s;
  }
  .xc #rail .stop {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: flex-end;
    /* la cible tactile fait au moins 24 px de haut, le tiret reste fin */
    padding: 7px 0 7px 14px;
    border-radius: 6px;
    font-family: var(--sans);
    font-size: var(--t-menu);
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .xc #rail .stop span { opacity: 0; transition: opacity 0.65s ease; }
  /* un tiret par étape : celui de l'étape en cours s'allonge et se nomme */
  .xc #rail .stop i {
    width: 12px; height: 1.5px;
    border-radius: 2px;
    background: var(--faint);
    opacity: 0.4;
    transition: width 0.65s cubic-bezier(0.16, 1, 0.3, 1), background 0.65s ease, opacity 0.65s ease;
  }
  .xc #rail .stop.live span { opacity: 1; color: var(--muted); }
  .xc #rail .stop.live i { width: 26px; background: var(--green); opacity: 1; }
  /* Viser un jalon dit son nom avant qu'on ait cliqué : sans cela, on
     choisirait entre quatre tirets identiques. */
  .xc #rail .stop:hover span,
  .xc #rail .stop:focus-visible span { opacity: 1; color: var(--muted); }
  .xc #rail .stop:hover i,
  .xc #rail .stop:focus-visible i { width: 20px; opacity: 0.85; }

  .xc .pinzone { position: relative; }
  .xc .pinzone .pin {
    position: sticky;
    /* repère du marqueur de chapitre */
    isolation: isolate;
    top: 0;
    height: 100vh;
    height: 100svh;
    overflow: hidden;
  }

  /* ── La course des scènes épinglées ──────────────────────────────────────
     Elle valait 340vh ici, 400 pour le parcours et 300 pour la vérification.
     Mesuré au défilement, à 1440 x 900 : sur les dix-sept vues de la page,
     huit montraient un titre déjà lu, dont quatre d'affilée sous « Saisi une
     fois. Utilisé jusqu'à la fermeture du dossier. » La liste des cinq étapes
     est lisible en entier dès la première de ces vues : le lecteur avait fini
     de lire, puis défilait trois écrans de plus pour voir changer une carte.

     La course est donc ramenée à un peu plus de deux vues par scène. Rien
     n'est retiré du récit : sceneEtapes repartit ses etapes sur
     (hauteur - 100vh), donc raccourcir la zone accélère la cadence sans
     supprimer une seule étape ni une seule ligne. Le pouce n'est pas touché,
     les zones y passent en height:auto. */
  .xc #zone-hero { height: 250vh; }
  .xc #hero-canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  /* ── L'application, vivante ────────────────────────────────────────────────
     Le cadre contenait une capture JPEG. Une capture vieillit en silence : elle
     ne suit ni la palette, ni les libellés, ni les chiffres du produit, et on
     s'en aperçoit des mois plus tard.

     C'est maintenant du DOM réel, navigable : la barre de menu ouvre ses
     sous-menus et change d'écran. Le contenu est dessiné dans une boîte
     logique fixe de 1000x563, puis mise à l'échelle par transform. C'est le
     même espace de coordonnées que le canvas d'assemblage, donc les papiers
     se rangent exactement là où les blocs apparaissent, et la typographie
     reste nette à toutes les tailles au lieu d'être rééchantillonnée.

     Les chiffres sont ceux du Cabinet Demo (Me Camille Roy) relevés en base,
     pas des montants inventés. */
  /* Neutre au large : même origine de coordonnées que .pin, aucun rognage. */
  .xc #hero-cadre { position: absolute; inset: 0; pointer-events: none; }
  .xc #hero-cadre > * { pointer-events: auto; }

  .xc #hero-app {
    position: absolute;
    width: 1000px;
    height: 563px;
    transform-origin: top left;
    opacity: 0;
    border-radius: 14px;
    box-shadow: 0 46px 90px -46px rgb(var(--si-line-ink-rgb) / 0.55);
    border: 1px solid var(--line);
    background: var(--si-canvas);
    overflow: hidden;
    will-change: opacity, transform;
    /* Inerte pendant l'assemblage : on n'attrape pas un menu qui vole encore.
       La classe .live est posée par le script une fois le cadre stabilisé. */
    pointer-events: none;
    font-size: 13px;
    color: var(--si-ink);
    text-align: left;
  }
  .xc #hero-app.live { pointer-events: auto; }

  /* Barre de navigation du produit */
  .xc #hero-app .ha-nav {
    display: flex;
    align-items: center;
    gap: 14px;
    height: 46px;
    padding: 0 14px;
    background: var(--si-surface);
    border-bottom: 1px solid var(--si-line);
  }
  .xc #hero-app .ha-brand {
    display: flex; align-items: center; gap: 7px;
    font-weight: 600; font-size: 13px; letter-spacing: 0.04em;
  }
  /* La pastille porte le vert de la marque, pas le --si-forest : celui-ci vaut
     #1A1A1A dans la palette courante, ce qui donnerait un logo noir. */
  .xc #hero-app .ha-brand .mark {
    display: inline-flex;
    width: 17px; height: 17px;
  }
  .xc #hero-app .ha-brand .mark svg { display: block; }
  .xc #hero-app .ha-cab {
    font-size: 12px; color: var(--si-muted);
    padding-left: 13px; border-left: 1px solid var(--si-line);
    white-space: nowrap;
  }
  .xc #hero-app .ha-menu { display: flex; align-items: center; gap: 2px; margin-left: 6px; }
  .xc #hero-app .ha-item {
    position: relative;
    display: flex; align-items: center; gap: 5px;
    padding: 6px 10px;
    border-radius: 7px;
    font-size: 12.5px;
    color: var(--si-muted);
    cursor: pointer;
    white-space: nowrap;
  }
  /* Le survol est porté par .safe-zoom-menu (app/globals.css), la grammaire
     canonique du produit : l'élévation dit « sélectionnable », jamais un aplat.
     On ne redéfinit surtout pas :hover ici, un sélecteur avec #id l'emporterait
     sur la classe globale et la vitrine se remettrait à diverger du produit. */
  .xc #hero-app .ha-item:hover { color: var(--si-ink); }
  .xc #hero-app .ha-item.on {
    color: var(--si-ink);
    background: var(--si-surface);
    box-shadow: inset 0 0 0 1px var(--si-line);
    font-weight: 500;
  }
  .xc #hero-app .ha-item .car {
    width: 7px; height: 7px;
    border-right: 1.4px solid currentColor;
    border-bottom: 1.4px solid currentColor;
    transform: translateY(-2px) rotate(45deg);
    transition: transform 160ms ease;
  }
  .xc #hero-app .ha-item.open .car { transform: translateY(1px) rotate(-135deg); }
  .xc #hero-app .ha-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }
  .xc #hero-app .ha-search {
    display: flex; align-items: center;
    width: 154px; height: 26px;
    padding: 0 9px;
    border: 1px solid var(--si-line);
    border-radius: 7px;
    font-size: 11.5px;
    color: var(--si-muted);
    background: var(--si-surface);
    white-space: nowrap;
    overflow: hidden;
  }
  .xc #hero-app .ha-lang {
    display: flex; border: 1px solid var(--si-line); border-radius: 7px; overflow: hidden;
    font-size: 11px;
  }
  .xc #hero-app .ha-lang span { padding: 4px 7px; color: var(--si-muted); }
  .xc #hero-app .ha-lang span.on { background: var(--si-forest); color: var(--si-surface); }
  .xc #hero-app .ha-avatar {
    width: 24px; height: 24px; border-radius: 50%;
    background: var(--si-forest); color: var(--si-surface);
    display: grid; place-items: center;
    font-size: 11px; font-weight: 600;
  }

  /* Sous-menu déroulant */
  .xc #hero-app .ha-drop {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    min-width: 186px;
    padding: 5px;
    background: var(--si-surface);
    border: 1px solid var(--si-line);
    border-radius: 10px;
    box-shadow: 0 18px 38px -20px rgb(var(--si-line-ink-rgb) / 0.45);
    display: none;
    z-index: 20;
  }
  .xc #hero-app .ha-item.open .ha-drop { display: block; }
  .xc #hero-app .ha-drop b {
    display: block;
    padding: 5px 9px 6px;
    font-size: var(--t-menu); font-weight: 600;
    letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--si-muted);
  }
  .xc #hero-app .ha-drop a {
    display: flex; align-items: center; justify-content: space-between;
    padding: 6px 9px;
    border-radius: 7px;
    font-size: 12.5px;
    color: var(--si-ink);
    cursor: pointer;
  }
  /* Entrée listée mais sans écran dans l'extrait. Elle ne se soulève pas :
     « ce qui se soulève doit s'ouvrir » (components/ui/rangee-ouvrable.ts).
     Promettre un geste inexistant apprend à l'œil à se méfier de l'animation. */
  .xc #hero-app .ha-drop a.inerte { color: var(--si-muted); cursor: default; }

  /* Bandeau d'état */
  .xc #hero-app .ha-strip {
    display: flex; align-items: center; gap: 20px;
    height: 32px; padding: 0 16px;
    background: var(--si-forest);
    color: var(--si-surface);
    font-size: 11.5px;
  }
  .xc #hero-app .ha-strip .s { display: flex; align-items: center; gap: 6px; opacity: 0.92; }
  .xc #hero-app .ha-strip .s i {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--si-verified-on-forest);
  }
  .xc #hero-app .ha-strip .s.warn i { background: var(--si-amber-on-forest, #E0B54A); }
  .xc #hero-app .ha-strip .s b { font-weight: 600; }
  .xc #hero-app .ha-strip .date { margin-left: auto; opacity: 0.62; font-family: var(--sans); font-size: var(--t-menu); }

  /* Corps */
  .xc #hero-app .ha-body { padding: 14px 16px; }
  .xc #hero-app .ha-screen { display: none; }
  .xc #hero-app .ha-screen.on { display: block; }
  .xc #hero-app .ha-card {
    background: var(--si-surface);
    border: 1px solid var(--si-line);
    border-radius: 12px;
    padding: 13px 14px;
  }
  .xc #hero-app .ha-kicker {
    font-family: var(--sans);
    font-size: var(--t-menu); letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--si-muted);
  }
  .xc #hero-app .ha-h {
    font-family: var(--serif); font-weight: 400;
    font-size: 21px; line-height: 1.1; margin-top: 5px;
    letter-spacing: -0.015em;
  }
  .xc #hero-app .ha-tiles {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; margin-top: 11px;
  }
  /* Les tuiles de chiffres, comme dans le produit.
     Elles étaient un aplat d'encre. Le tableau de bord réel les peint avec
     « safe-action-degrade », un dégradé de l'encre vers le vert forêt
     profond, et pose une lueur verte dans le coin bas gauche
     (« glow-verified »). Un
     aplat noir ne ressemble pas à SAFE, il ressemble à un cadre de
     démonstration. Les deux règles sont recopiées ici depuis globals.css
     parce que la vitrine ne charge pas les classes utilitaires du produit. */
  .xc #hero-app .ha-tile {
    position: relative;
    overflow: hidden;
    background-color: var(--si-ink);
    background-image: linear-gradient(135deg, var(--si-ink) 0%, var(--si-action-vert) 100%);
    color: var(--si-surface);
    border-radius: 10px;
    padding: 9px 11px 11px;
    cursor: pointer;
  }
  .xc #hero-app .ha-tile::after {
    content: "";
    position: absolute;
    left: -34px;
    bottom: -48px;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(46, 125, 91, 0.4), transparent 70%);
    pointer-events: none;
  }
  .xc #hero-app .ha-tile > * { position: relative; z-index: 1; }
  .xc #hero-app .ha-tile .lab {
    font-family: var(--sans);
    font-size: var(--t-menu); letter-spacing: 0.09em; text-transform: uppercase;
    opacity: 0.72;
  }
  .xc #hero-app .ha-tile .sub { font-size: var(--t-menu); opacity: 0.66; margin-top: 6px; }
  .xc #hero-app .ha-tile .val {
    font-family: var(--mono);
    font-size: 17px; letter-spacing: -0.02em; margin-top: 2px;
  }
  .xc #hero-app .ha-tile.amber .val { color: var(--si-amber-on-forest, #E7C36A); }
  .xc #hero-app .ha-cols {
    display: grid; grid-template-columns: 1.42fr 1fr; gap: 11px; margin-top: 11px;
  }
  .xc #hero-app .ha-act {
    display: inline-flex; align-items: center;
    height: 30px; padding: 0 13px;
    border-radius: 8px;
    background: var(--si-forest); color: var(--si-surface);
    font-size: 12px; font-weight: 500;
    margin-top: 11px;
    cursor: pointer;
  }
  .xc #hero-app .ha-kv {
    display: flex; justify-content: space-between; gap: 10px;
    padding: 4.5px 0;
    border-bottom: 1px solid var(--si-line2);
    font-size: 12px;
  }
  .xc #hero-app .ha-kv:last-child { border-bottom: 0; }
  .xc #hero-app .ha-kv .k { color: var(--si-muted); }
  .xc #hero-app .ha-kv .v { font-family: var(--mono); font-size: 11.5px; }
  .xc #hero-app .ha-ptitle { font-size: 12.5px; font-weight: 600; margin-bottom: 7px; }
  .xc #hero-app .ha-mini { font-size: 11px; color: var(--si-muted); margin-top: 3px; }

  /* Registre (écrans Facturation / Comptes) */
  .xc #hero-app table.ha-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
  .xc #hero-app .ha-tbl th {
    text-align: left; font-size: var(--t-menu); letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--si-muted); font-weight: 600;
    padding: 0 8px 7px; border-bottom: 1px solid var(--si-line);
  }
  .xc #hero-app .ha-tbl td { padding: 7px 8px; border-bottom: 1px solid var(--si-line2); }
  .xc #hero-app .ha-tbl td.num { font-family: var(--mono); font-size: 11.5px; text-align: right; }
  .xc #hero-app .ha-tbl tr:last-child td { border-bottom: 0; }
  .xc #hero-app .ha-tag {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 7px; border-radius: 999px;
    font-size: var(--t-menu);
    background: rgb(var(--si-forest-rgb) / 0.09); color: var(--si-verified);
  }
  /* Aging : cinq tranches d'ancienneté, lues d'un coup d'œil. */
  .xc #hero-app .ha-aging { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
  .xc #hero-app .ha-aging .ag {
    border: 1px solid var(--si-line);
    border-radius: 9px;
    padding: 8px 10px;
  }
  .xc #hero-app .ha-aging .l {
    display: block;
    font-family: var(--mono);
    font-size: var(--t-menu); letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--si-muted);
  }
  .xc #hero-app .ha-aging .m {
    display: block; margin-top: 5px;
    font-family: var(--mono); font-size: 12.5px;
  }
  /* Au-delà de 30 jours, le montant passe à l'encre d'alerte : c'est là que la
     relance devient prioritaire. */
  .xc #hero-app .ha-aging .m.chaud { color: var(--si-amber-ink); }

  .xc #hero-app .ha-tag.late { background: rgb(var(--si-danger-rgb) / 0.10); color: var(--si-danger-ink); }
  .xc #hero-app .ha-tag.part { background: rgb(138 106 30 / 0.12); color: var(--si-amber-ink); }
  /* Décor : jamais cliquable. Ces blocs sont déclarés APRÈS #hero-app, donc ils
     peignent par-dessus, et opacity 0 ne retire rien du test de collision.
     Une fois le titre estompé, il continuait d'avaler les clics destinés au
     menu de l'application : le menu paraissait mort alors qu'il écoutait. */
  .xc #hero-canvas,
  .xc #hero-copy,
  .xc.anime #hero-caption,
  .xc #hero-hint { pointer-events: none; }
  /* La marge du hero est celle des sections, pas une marge à elle.
     Elle centrait DEUX fois : max-width:var(--page) plus margin:0 auto
     ramenaient déjà le bloc à 1160 px centrés, donc à 140 px du bord sur un
     écran de 1440, puis padding-inline rajoutait par-dessus
     (1440 - 1160) / 2, soit 140 px de plus. Le titre d'ouverture partait à
     280 px quand toutes les sections partent à 140.

     La formule reste, le double centrage part : c'est exactement le montage
     de section.flat, ou l'element pleine largeur porte le padding et son
     .inner porte la mesure. Mesuré : 140 px, comme « Le constat ». */
  .xc #hero-copy {
    position: absolute;
    left: 0; right: 0;
    top: 17vh;
    padding-inline: max(var(--gouttiere), (100% - var(--page)) / 2);
    will-change: transform, opacity;
  }
  /* ── Lignes légèrement irrégulières, côté éditorial ──────────────────────
     Une serif de titrage se pose mal sur une grille parfaite : chaque bloc
     démarre au même pixel, la colonne devient un mur, et la lettre a l'air
     posée sur une règle plutôt qu'écrite.

     Trois écarts, très légers, aucun décoratif :

     1. Alignement OPTIQUE du titre. Le « S » d'une Instrument Serif porte un
        approche latérale : aligné au pixel, il paraît rentré par rapport au
        paragraphe. Un retrait de 0,055em le remet d'aplomb à l'œil.
     2. Largeurs de lecture qui varient légèrement d'un bloc à l'autre, au
        lieu d'une mesure unique. Le bord droit cesse d'être un mur.
     3. Décalages horizontaux minuscules entre l'exergue, le titre et le
        chapeau. Deux à six pixels : on ne les voit pas, on les sent.

     Cette liberté s'arrête à l'éditorial. Dans les registres et les
     rapprochements, l'alignement sert à VÉRIFIER des chiffres : la grille y
     reste rigoureuse (DESIGN_HUMAIN §11, « anti-grille vs précision
     opérationnelle »). */
  .xc #hero-copy .kicker { margin-left: 2px; }
  .xc #hero-copy h1 {
    margin-top: 20px;
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--t-affiche);
    line-height: 0.99;
    letter-spacing: -0.026em;
    max-width: 13.4ch;
    /* Compense l'approche latérale de la capitale, pas un décalage arbitraire. */
    margin-left: -0.055em;
  }
    /* Le mot mis en valeur porte exactement le vert du logo, pas l'encre
     de l'action ni le vert de validation. */
  .xc #hero-copy h1 em { font-style: italic; color: var(--si-brand-green); }
  /* Le chapeau d'ouverture est en Geist, la fonte de l'action (demande CEO du
     21 août 2026).

     Il porte la seule énumération de la page : neuf postes d'affilée, puis ce
     qu'on y voit. Une serif de titrage traîne sur ce genre de liste, et la
     première vue est le seul endroit où le chapeau se lit AVANT le titre, pas
     après. Il prend donc la même voix que le bouton qui le suit.

     C'est une exception nommée à la règle du 13 août (« tout ce qui relève du
     discours porte la serif »), et elle s'arrête à la première vue : la prose
     des sections garde la serif. */
  .xc #hero-copy p.lede {
    margin-top: 30px;
    margin-left: 6px;
    max-width: 49ch;
    font-family: var(--sans);
    /* Geist se lit plus large qu'Instrument Serif à corps égal : un demi-point
       de moins rend au chapeau la mesure qu'il avait. */
    font-size: calc(var(--t-corps) - 0.5px);
    line-height: 1.6;
    color: var(--muted);
  }
  /* L'action du premier écran.

     Le hero n'en portait aucune : la seule façon d'engager quoi que ce soit
     depuis la première vue était le bouton de la barre de navigation, qui est
     un ustensile de site, pas la proposition de la page. Une page qui ouvre
     sur une promesse doit dire dans la même respiration ce qu'on peut en
     faire (DIRECTION_LANDING §6.01, DESIGN_HUMAIN M2).

     Le bloc rétablit pointer-events : #hero-copy est neutralisé en entier
     pour ne pas avaler les clics destinés à l'application, et l'action est le
     seul élément du titre qui doit rester saisissable. Le script la retire du
     test de collision dès que le titre s'estompe. */
  .xc #hero-copy p.lede-suite { margin-top: 14px; max-width: 44ch; color: var(--si-ink); }
  .xc #hero-copy .hero-actions {
    margin-top: 36px;
    margin-left: 5px;
    display: flex;
    align-items: center;
    gap: 22px;
    flex-wrap: wrap;
    pointer-events: auto;
  }
  .xc #hero-copy .hero-second {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 14px;
    color: var(--muted);
    transition: color 140ms ease;
  }
  .xc #hero-copy .hero-second i {
    display: block;
    width: 14px; height: 1.5px;
    border-radius: 2px;
    background: currentColor;
    opacity: 0.5;
    transition: width 180ms ease, opacity 180ms ease;
  }
  .xc #hero-copy .hero-second:hover { color: var(--ink); }
  .xc #hero-copy .hero-second:hover i { width: 22px; opacity: 1; }
  /* Réassurance factuelle, reprise mot pour mot de la page de diagnostic.
     Aucun chiffre qui ne soit pas tenu ailleurs sur le site. */
  /* La réassurance suit le chapeau : elle vit dans le même bloc, sous la même
     action, et rester la seule ligne en serif s'y lirait comme un oubli. */
  .xc #hero-copy .hero-reassure {
    margin-top: 16px;
    margin-left: 6px;
    font-family: var(--sans);
    font-size: var(--t-detail);
    line-height: 1.5;
    color: var(--muted);
  }
  .xc #hero-hint {
    position: absolute;
    left: 0; right: 0;
    bottom: 4.5vh;
    text-align: center;
    font-family: var(--sans);
    font-size: var(--t-menu);
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted);
    transition: opacity 0.4s ease;
  }
  .xc #hero-caption {
    position: absolute;
    left: 0; right: 0;
    bottom: 5.5vh;
    text-align: center;
    font-family: var(--sans);
    font-size: 13.5px;
    color: var(--muted);
    opacity: 0;
    will-change: opacity, transform;
  }

  /* ── Les points des deux scènes ───────────────────────────────────────────
     Une seule grammaire pour le parcours d'un dossier et pour la vérification
     du fidéicommis. Elle était écrite trois fois, avec trois jeux de tailles ;
     les deux scènes disent la même chose de la même façon, elles la disent donc
     avec les mêmes règles.

     Ce qui a changé, et pourquoi (décision CEO du 13 août 2026).

     Un point arrivait en grand, puis rétrécissait en ligne de liste pendant
     que le suivant prenait sa place, et il portait une justification sous lui.
     Un chapitre faisait donc coexister quatre corps de texte et en animait
     deux, en même temps que la hauteur du bloc, ses colonnes et ses marges.
     Beaucoup de charge, et beaucoup de recalcul de mise en page, pour dire
     « celui-ci est le point en cours ».

     Un point a maintenant UN corps, qui ne change jamais, et UNE phrase. La
     sous-ligne est retirée : ce qu'elle expliquait, la phrase le dit déjà.
     Ce qui distingue le point en cours de ceux déjà lus est l'encre, pas la
     taille.

     La liste occupe sa place dès le départ. Rien ne se déplie, donc rien ne
     pousse la colonne pendant qu'on la lit, et la hauteur de la scène ne
     dépend plus d'un maximum deviné. */
  .xc .fi-args, .xc .co-args { display: grid; list-style: none; }
  .xc .fi-arg, .xc .co-arg {
    display: grid;
    grid-template-columns: 26px 1fr;
    column-gap: 14px;
    align-items: baseline;
    padding: clamp(9px, 1vw, 13px) 0;
  }
  /* Les points ne s'allument plus au passage du défilement.

     Ils partaient à opacité nulle et n'existaient qu'une fois atteints : la
     preuve précédait la promesse, mais seulement pour qui défilait jusqu'au
     bout. Une page dont le texte n'apparaît qu'au geste se lit comme une page
     vide à qui ne le fait pas, et personne ne demande à voir ce qu'il ne
     soupçonne pas.

     Les cinq étapes et les trois preuves sont donc posées, lisibles, dès
     l'arrivée dans la section. Le défilement ne révèle rien : il DÉSIGNE.
     C'est l'encre du point courant qui change, et l'écran d'à côté qui montre
     ce dont ce point parle. */
  .xc .fi-arg .n, .xc .co-arg .n {
    font-family: var(--mono);
    font-size: var(--t-menu);
    letter-spacing: 0.1em;
    /* Le vert de marque tombe à 4,26 pour 11 px, sous le seuil AA. Le vert de
       validation donne 5,88 et dit la même chose ici. Même arbitrage que pour
       le domaine de pratique, plus bas. */
    color: var(--verified);
  }
  /* Un seul corps pour les neuf points de la page. Il est calé sur le chapitre
     le plus chargé, le parcours, qui porte cinq étapes et leur justification :
     mesuré, sa colonne tient dans une vue de 720 px de haut, barre de
     navigation comprise. */
  .xc .fi-arg .e, .xc .co-arg .e {
    font-family: var(--sans);
    font-weight: 400;
    font-size: var(--t-argument);
    line-height: 1.24;
    letter-spacing: -0.014em;
    color: var(--muted);
    max-width: 34ch;
    transition: color var(--duree-teinte) ease;
  }
  /* Le point en cours porte l'encre pleine ET grandit d'un cran : c'est lui
     que la démonstration d'à côté est en train de montrer. Un point déjà lu
     reste entièrement lisible, il passe simplement au second plan.

     L'encre seule ne suffisait pas (retour CEO du 21 août 2026). Le passage du
     gris à l'encre est un écart de luminance sur un texte de seize pixels : à
     la vitesse où l'on défile, il se voit à peine, et rien ne dit alors quel
     point l'écran est en train de prouver.

     Cinq pour cent, pas plus. Au-delà, une mise à l'échelle rééchantillonne la
     lettre et le texte devient mou (SAFE_PREMIUM_DESIGN_STANDARD §2.8, qui
     tolère 2 % sur un libellé de treize pixels et réserve les valeurs plus
     franches aux surfaces). Ici la cible est une phrase de seize à dix-huit
     pixels, qui encaisse un peu plus, et le geste doit se voir depuis la
     colonne d'à côté.

     L'origine reste le bord gauche : la colonne des numéros ne bouge pas d'un
     pixel, c'est elle qui tient la liste alignée pendant que le point grandit. */
  .xc .fi-arg, .xc .co-arg {
    transform-origin: left center;
    transition: transform 420ms var(--doux);
  }
  .xc .fi-arg.actif, .xc .co-arg.actif { transform: scale(1.05); }
  .xc .fi-arg.actif .e, .xc .co-arg.actif .e {
    color: var(--si-ink);
  }
  /* La description revient au large.

     Elle avait été retirée le 13 août au motif que la démonstration est EN
     FACE du point et montre déjà ce qu'une phrase expliquerait. L'argument
     tient tant que la démonstration a joué : elle est pilotée par le
     défilement, donc le point qu'on n'a pas encore atteint n'a rien en face
     de lui, et son titre seul ne dit pas ce qu'il fait. « Encaisser et
     comptabiliser » se comprend, « Tenir les registres à jour » beaucoup
     moins.

     La phrase est donc écrite pour les cinq étapes, à la taille d'une
     justification et non d'un argument : elle explique le point, elle ne
     rivalise pas avec lui. */
  .xc .fi-arg .d, .xc .co-arg .d {
    grid-column: 2;
    margin-top: 5px;
    max-width: 42ch;
    font-family: var(--sans);
    font-size: var(--t-detail);
    line-height: 1.45;
    color: var(--muted);
  }
  /* Cinq étapes dans une vue épinglée, et la vue peut ne faire que 720 px de
     haut : le point se resserre pour que la colonne tienne sans rogner.
     Mesuré à 1280 par 720, la colonne du parcours passe de 756 à 640 px.
     Trois preuves gardent l'aisance. */
  .xc .co-arg { padding-block: 6px; }
  .xc .co-arg .e { font-size: var(--t-corps); line-height: 1.3; }

  .xc #zone-verification { height: 190vh; }
  .xc #zone-parcours { height: 220vh; }

  /* ── Le parcours d'un dossier (section 03) ────────────────────────────────
     Même langage que la vérification : les étapes d'un côté, l'écran qui les
     démontre de l'autre. La démonstration passe à gauche parce qu'ici on suit
     un dossier, et qu'on le regarde avancer avant de lire ce qu'on en conclut.

     Les montants vivent sur l'opération qui les produit : ni jeton flottant,
     ni ligne verticale de parcours.

     La scène reste sur le canevas. La page alterne franchement d'une surface à
     l'autre : le problème sur blanc, le parcours sur canevas, la suite sur
     canevas, la vérification sur blanc, l'équipe sur blanc, l'offre sur
     canevas. */
  .xc .co-pin { display: grid; align-content: center; padding: 66px 0 18px; padding-inline: max(var(--gouttiere), (100% - var(--page)) / 2); }
  .xc .co-grid {
    width: 100%;
    max-width: var(--page);
    margin: 0 auto;
    display: grid;
    /* La colonne de texte prend le large : elle porte cinq étapes et leur
       justification, quand l'écran de démonstration plafonne de toute façon à
       520 px. Chaque dizaine de pixels rendue au texte enlève une ligne à une
       description, donc de la hauteur à une scène qui doit tenir dans une vue
       de 720 px. */
    grid-template-columns: 0.95fr 1.05fr;
    gap: clamp(28px, 4vw, 64px);
    align-items: center;
  }
  .xc .co-copy { min-width: 0; }
  .xc .co-copy h2 {
    margin-top: 14px;
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--t-titre);
    line-height: 1.1;
    letter-spacing: -0.018em;
    max-width: 26ch;
  }
  .xc .co-intro {
    margin-top: 14px;
    font-family: var(--sans);
    font-size: var(--t-corps);
    line-height: 1.6;
    color: var(--muted);
    max-width: 46ch;
  }

  /* Le parcours qui se construit. Les points suivent la grammaire partagée
     déclarée plus haut : un corps unique, une phrase, sa justification, et
     l'encre pour dire lequel est en cours. */
  .xc .co-narration { margin-top: clamp(14px, 1.6vw, 20px); }
  /* La chute du parcours. Elle portait le corps d'un argument, ce qui la
     mettait au rang des cinq étapes qu'elle conclut. Elle prend le corps de la
     prose : c'est un point final, pas une sixième étape. Et la scène est
     épinglée dans une vue qui peut ne faire que 720 px : chaque cran compte. */
  .xc .co-fin {
    margin-top: 18px;
    font-family: var(--sans);
    font-weight: 400;
    font-size: var(--t-corps);
    line-height: 1.5;
    color: var(--si-ink);
    max-width: 46ch;
  }
  .xc .co-fin .co-comptable {
    display: block;
    margin-top: 9px;
    font-family: var(--sans);
    font-size: 13px;
    line-height: 1.5;
    color: var(--muted);
    max-width: 42ch;
  }

  /* La démonstration du parcours. Même surface que celle de la vérification :
     un écran réel, une profondeur très légère, aucune bordure. */
  .xc .co-stage { min-width: 0; }
  /* La surface s'inverse avec la section. Sur le blanc de la vérification,
     l'écran prend le canevas ; sur le canevas du parcours, il prend le blanc. Mesuré
     après le passage au gris : l'écran et son fond avaient exactement la même
     teinte, la fenêtre ne se détachait plus que par son ombre. */
  .xc .co-ecran {
    width: 100%;
    max-width: 520px;
    padding: 20px 22px 22px;
    border-radius: 14px;
    background: var(--si-surface);
    box-shadow: 0 26px 56px -46px rgb(var(--si-line-ink-rgb) / 0.42);
  }
  .xc .co-ou {
    font-family: var(--sans);
    font-size: var(--t-menu);
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted);
  }
  /* Réservée sur la plus haute des trois vues, mesurée à 375 px : une valeur
     plus courte laissait la fin du parcours déborder hors de la surface. */
  .xc .co-vue-zone { position: relative; min-height: 384px; }
  .xc .co-vue { margin-top: 15px; }
  .xc.anime .co-vue {
    position: absolute;
    inset: 15px 0 auto 0;
    opacity: 0;
    transform: translateY(6px);
    transition: opacity 320ms ease, transform 380ms cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
  }
  .xc.anime .co-vue.on { opacity: 1; transform: none; pointer-events: auto; }
  /* Le domaine de pratique : c'est lui qui décide de tout le reste, donc il se
     lit en premier et porte le vert de marque. */
  .xc .co-domaine { display: grid; gap: 3px; }
  .xc .co-domaine .lb {
    font-family: var(--sans);
    font-size: var(--t-menu);
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted);
  }
  /* Mesuré sur le canevas : le vert du logo tombait à 4,26 pour 19 px, sous le
     seuil AA. Le vert de validation passe à 5,88 et dit la même chose ici, le
     domaine étant une donnée confirmée du dossier. */
  .xc .co-domaine .vl {
    font-family: var(--sans);
    font-weight: 400;
    font-size: var(--t-argument);
    line-height: 1.15;
    letter-spacing: -0.014em;
    color: var(--verified);
    transition: opacity 240ms ease;
  }
  .xc .co-sous {
    margin-top: 13px;
    font-size: 12.5px;
    color: var(--muted);
  }
  .xc .co-liste { margin-top: 9px; display: grid; }
  .xc .co-item {
    display: grid;
    grid-template-columns: 1fr auto;
    column-gap: 14px;
    row-gap: 2px;
    padding: 9px 0;
  }
  .xc .co-item .t { font-size: 13.5px; color: var(--si-ink); }
  .xc .co-item .s { grid-column: 1; font-size: 11.5px; color: var(--muted); }
  /* Le montant vit sur l'opération qui le produit, plus dans un bloc à part. */
  .xc .co-item .m {
    grid-column: 2;
    grid-row: 1 / span 2;
    align-self: center;
    font-family: var(--mono);
    font-size: 13.5px;
    font-variant-numeric: tabular-nums;
    color: var(--si-ink);
  }
  .xc.anime .co-item {
    opacity: 0;
    transform: translateY(6px);
    transition: opacity 340ms ease, transform 380ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .xc.anime .co-item.on { opacity: 1; transform: none; }
  /* Le total se détache par un filet, jamais par un fond coloré. */
  .xc .co-item.total { margin-top: 4px; padding-top: 13px; border-top: 1px solid var(--line); }
  .xc .co-item.total .t { color: var(--si-ink); }
  /* La confirmation porte une marque en plus de sa couleur : le vert ne dit
     jamais seul qu'une chose est réglée. */
  .xc .co-dit {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-top: 14px;
    font-size: 12.5px;
    line-height: 1.5;
    color: var(--verified);
    max-width: 40ch;
  }
  .xc .co-dit .marque { font-size: 11px; }

  /* ── La vérification du fidéicommis (section 05) ──────────────────────────
     Section blanche, éditoriale, sans un seul cadre. La hiérarchie tient à
     trois choses : la taille, l'espace et le contraste. Le vert n'apparaît que
     sur les numéros, les états actifs et les confirmations.

     Le fond porte le blanc de la marque (--si-surface, l'albâtre du produit),
     pas un blanc pur inventé pour l'occasion. */
  .xc #zone-verification, .xc #zone-verification .pin { background: var(--si-surface); }
  /* Les deux scènes épinglées dégagent la barre de navigation.

     Elles centraient leur contenu dans 100 vh sans rien réserver en haut, et
     la barre est fixe sur 60 px : sur une vue de 720 px, l'exergue de la
     section passait dessous. Une scène qui commence sous une barre de menu
     donne l'impression d'être arrivée trop tard. */
  .xc .fi-pin { display: grid; align-content: center; padding: 66px 0 18px; padding-inline: max(var(--gouttiere), (100% - var(--page)) / 2); }
  .xc .fi-grid {
    width: 100%;
    max-width: var(--page);
    margin: 0 auto;
    display: grid;
    grid-template-columns: 0.94fr 1.06fr;
    gap: clamp(32px, 5vw, 84px);
    align-items: center;
  }
  .xc .fi-copy { min-width: 0; }
  .xc .fi-copy h2 {
    margin-top: 16px;
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--t-titre);
    line-height: 1.1;
    letter-spacing: -0.018em;
    max-width: 20ch;
  }

  /* Les deux scènes suivent la grammaire des points déclarée plus haut. Il ne
     reste ici que ce qui est propre à celle-ci : son intro et la respiration
     au-dessus de sa liste. */
  .xc .fi-intro {
    margin-top: 16px;
    max-width: 46ch;
    font-family: var(--sans);
    font-size: var(--t-corps);
    line-height: 1.62;
    color: var(--muted);
  }
  .xc .fi-narration { margin-top: clamp(12px, 1.5vw, 18px); }
  .xc .fi-arg { padding-block: 8px; }
  /* La réserve qui accompagne toute preuve de conformité. Elle est écrite,
     jamais suggérée : SAFE soutient la tenue, il ne la garantit pas. */
  .xc .fi-precision {
    margin-top: 22px;
    padding-left: 16px;
    border-left: 2px solid var(--line);
    max-width: 46ch;
    font-family: var(--sans);
    font-size: var(--t-detail);
    line-height: 1.55;
    color: var(--muted);
  }

  /* La démonstration. Seule surface de la section : elle représente un écran
     réel, donc une profondeur très légère, portée par la teinte du canevas et
     une ombre diffuse. Aucune bordure. */
  .xc .fi-stage { min-width: 0; }
  .xc .fi-ecran {
    position: relative;
    width: 100%;
    max-width: 520px;
    margin-left: auto;
    padding: 22px 24px 24px;
    border-radius: 14px;
    background: var(--si-canvas);
    box-shadow: 0 26px 56px -46px rgb(var(--si-line-ink-rgb) / 0.42);
  }
  /* Mesuré sur le canevas : la teinte atténuée tombait à 3,03 pour 9,5 px,
     sous le seuil AA. Ce libellé dit où l'on se trouve, ce n'est pas de la
     décoration : il passe à l'encre secondaire (4,78). */
  .xc .fi-ou {
    font-family: var(--sans);
    font-size: var(--t-menu);
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted);
  }
  /* Hauteur réservée : quatre vues de hauteurs différentes qui se remplacent
     feraient sauter la colonne à chaque étape. */
  .xc .fi-vue-zone { position: relative; min-height: 268px; }
  .xc .fi-vue { margin-top: 16px; }
  .xc.anime .fi-vue {
    position: absolute;
    inset: 16px 0 auto 0;
    opacity: 0;
    transform: translateY(6px);
    transition: opacity 340ms ease, transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
    will-change: opacity, transform;
  }
  .xc.anime .fi-vue.on { opacity: 1; transform: none; pointer-events: auto; }
  /* Une source de chiffre : un libellé, un montant. Pas de filet entre les
     deux, l'alignement suffit à les relier. */
  .xc .fi-src {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 16px;
    padding: 11px 0;
  }
  .xc .fi-src .l { font-size: 13.5px; color: var(--muted); }
  .xc .fi-src .m {
    font-family: var(--mono);
    font-size: 14.5px;
    font-variant-numeric: tabular-nums;
    color: var(--si-ink);
  }
  .xc .fi-src .m.vert { color: var(--verified); }
  /* Tout ce qui se pose ligne à ligne dans un écran de démonstration.

     Quatre règles disaient ceci, une par classe : la source, l'entrée de
     journal, la phrase de conclusion, le refus. Le balisage déclare
     maintenant data-ligne et la mécanique des scènes pose « on » : la
     feuille n'a plus à connaître le nom de chaque ligne. */
  .xc.anime [data-ligne] {
    opacity: 0;
    transform: translateY(6px);
    transition: opacity 360ms ease, transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .xc.anime [data-ligne].on { opacity: 1; transform: none; }
  /* La phrase qui dit ce que les chiffres viennent de prouver. */
  .xc .fi-dit {
    margin-top: 14px;
    font-size: 12.5px;
    line-height: 1.55;
    color: var(--muted);
    max-width: 40ch;
  }
  .xc .fi-dit.vert { color: var(--verified); }
  /* Mini-chronologie : deux entrées datées, reliées par le seul trait de la
     section, qui n'est pas décoratif puisqu'il porte la continuité. */
  .xc .fi-temps {
    position: relative;
    padding: 10px 0 10px 20px;
    display: grid;
    grid-template-columns: 1fr auto;
    row-gap: 4px;
    column-gap: 14px;
    align-items: baseline;
  }
  .xc .fi-temps::before {
    content: "";
    position: absolute;
    left: 3px; top: 17px;
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--si-subtle);
  }
  .xc .fi-temps + .fi-temps::after {
    content: "";
    position: absolute;
    left: 5px; top: -8px; height: 25px;
    width: 1px;
    background: rgb(var(--si-line-ink-rgb) / 0.14);
  }
  /* Même correction : une date est une information, elle doit se lire. */
  .xc .fi-temps .h {
    grid-column: 1 / -1;
    font-family: var(--mono);
    font-size: var(--t-menu);
    letter-spacing: 0.08em;
    color: var(--muted);
  }
  .xc .fi-temps .t { font-size: 13px; color: var(--si-ink); }
  .xc .fi-temps .m {
    font-family: var(--mono);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    color: var(--muted);
  }
  .xc .fi-temps .m.vert { color: var(--verified); }
  .xc .fi-temps[data-temps="1"]::before { background: var(--si-brand-green); }
  .xc .fi-op { font-size: 13px; color: var(--si-ink); }
  /* Le refus. Texte exact du produit, en ambre : c'est un arrêt, pas une
     erreur du cabinet. */
  .xc .fi-refus {
    margin-top: 14px;
    padding-left: 16px;
    border-left: 2px solid var(--si-amber-ink);
    font-size: 12.5px;
    line-height: 1.55;
    color: var(--si-amber-ink);
    max-width: 42ch;
  }



  /* ── Les sections écrites ─────────────────────────────────────────────────
     Le problème, la suite, l'équipe, l'offre, les questions et l'appel final
     ne portent aucune interface. Leur hiérarchie tient à trois choses : la
     taille du titre, l'espace entre les groupes, et le filet.

     Une seule règle donne le titre de toutes ces sections. Elle était écrite
     trois fois, une par section, avec trois valeurs proches. */
  .xc section.flat h2 {
    margin-top: 14px;
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--t-marque);
    line-height: 1.08;
    letter-spacing: -0.018em;
    max-width: 20ch;
  }
  .xc section.flat > .inner > .lede {
    margin-top: 22px;
    max-width: 62ch;
    font-family: var(--sans);
    font-size: var(--t-corps);
    line-height: 1.66;
    color: var(--muted);
  }
  /* La phrase qui referme une section : même famille que les titres, un cran
     plus petite, en encre pleine. C'est le point final d'un raisonnement, pas
     un argument de plus. */
  .xc section.flat .chute {
    font-family: var(--sans);
    font-weight: 400;
    font-size: var(--t-argument);
    line-height: 1.32;
    letter-spacing: -0.014em;
    color: var(--si-ink);
    max-width: 38ch;
  }
  /* Le lien de fin de bloc. Le filet sous le mot s'allonge au survol : c'est
     le seul mouvement de ces sections, et il confirme une cible. */
  .xc section.flat .more {
    display: inline-block;
    margin-top: 18px;
    font-family: var(--sans);
    font-size: 14px;
    color: var(--ink);
    border-bottom: 1px solid rgb(var(--si-line-ink-rgb) / 0.22);
    padding-bottom: 2px;
    transition: border-color var(--duree-teinte) ease;
  }
  .xc section.flat .more:hover { border-color: var(--si-ink); }
  /* L'exergue d'un bloc secondaire : il nomme le rang de ce qu'on lit
     (SAFE Cabinet, Outils SAFE, Accompagnement), en petites capitales. */
  .xc section.flat .rang {
    font-family: var(--sans);
    font-size: var(--t-menu);
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted);
  }

  /* ── 02 · Le problème ─────────────────────────────────────────────────────
     Cinq lignes numérotées à gauche, la conclusion à droite. La liste porte le
     poids : c'est elle qui est reconnaissable, et le commentaire ne fait que
     nommer ce qu'on vient de reconnaître.

     Chaque ligne dit l'endroit où la chose vit aujourd'hui, en mono et à
     droite. Aucun nom de logiciel : personne ici ne sait dans quoi travaille
     le cabinet qui lit la page. */
  .xc .deux-colonnes {
    margin-top: clamp(32px, 4vw, 52px);
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: clamp(32px, 5vw, 76px);
    align-items: start;
  }
  .xc .morceau {
    display: grid;
    grid-template-columns: 30px 1fr auto;
    column-gap: 14px;
    align-items: baseline;
    padding: 15px 0;
    border-top: 1px solid var(--line);
  }
  .xc .morceau:last-child { border-bottom: 1px solid var(--line); }
  .xc .morceau .n {
    font-family: var(--mono);
    font-size: var(--t-menu);
    letter-spacing: 0.1em;
    color: var(--si-subtle);
  }
  .xc .morceau .t {
    font-family: var(--sans);
    font-size: var(--t-corps);
    line-height: 1.45;
    color: var(--si-ink);
  }
  .xc .morceau .ou {
    font-family: var(--mono);
    font-size: var(--t-menu);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    white-space: nowrap;
  }
  .xc #probleme .cote p {
    max-width: 42ch;
    font-family: var(--sans);
    font-size: var(--t-corps);
    line-height: 1.66;
    color: var(--muted);
  }
  /* La conclusion garde son rang malgré la règle de prose ci-dessus : elle est
     dans la même colonne, donc c'est ici qu'il faut le dire. */
  .xc #probleme .cote .chute {
    margin-top: 22px;
    font-size: var(--t-argument);
    line-height: 1.32;
    color: var(--si-ink);
  }

  /* ── 04 · La suite ────────────────────────────────────────────────────────
     Trois blocs de poids différents, jamais trois cartes identiques. SAFE
     Cabinet prend la largeur et porte la liste de ce qu'il tient ensemble ;
     les outils et l'accompagnement se partagent la rangée du dessous, un cran
     plus bas. C'est la hiérarchie qui dit lequel est le produit central, pas
     une étiquette. */
  .xc .bloc-maitre {
    margin-top: clamp(32px, 4vw, 52px);
    display: grid;
    grid-template-columns: 1.05fr 0.95fr;
    gap: clamp(28px, 4vw, 64px);
    align-items: center;
    padding: clamp(28px, 3.4vw, 40px) 0;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }
  .xc .bloc-maitre h3 {
    margin-top: 12px;
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--t-titre);
    line-height: 1.12;
    letter-spacing: -0.018em;
    max-width: 18ch;
  }
  .xc .bloc-maitre p {
    margin-top: 14px;
    max-width: 46ch;
    font-family: var(--sans);
    font-size: var(--t-corps);
    line-height: 1.62;
    color: var(--muted);
  }
  /* Les neuf postes, en mono : ce sont des noms de registres, pas de la prose.
     Ils reprennent mot pour mot ceux du titre d'ouverture. */
  .xc .contexte {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 10px;
    list-style: none;
  }
  .xc .contexte li {
    padding: 7px 12px;
    border: 1px solid var(--line);
    border-radius: 6px;
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: 0.02em;
    color: var(--si-ink);
    background: var(--si-surface);
  }
  .xc .deux-blocs {
    margin-top: clamp(28px, 3.4vw, 44px);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(28px, 4vw, 64px);
  }
  .xc .deux-blocs .bloc { padding-top: 4px; }
  .xc .deux-blocs h3 {
    margin-top: 10px;
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--t-argument);
    line-height: 1.22;
    letter-spacing: -0.014em;
    max-width: 22ch;
  }
  .xc .deux-blocs p {
    margin-top: 12px;
    max-width: 44ch;
    font-family: var(--sans);
    font-size: var(--t-detail);
    line-height: 1.6;
    color: var(--muted);
  }
  /* L'outil publié se nomme. Le reste de la suite ne s'annonce pas : un
     catalogue promis avant d'exister est une promesse qu'on ne tient pas le
     jour où quelqu'un clique. */
  .xc .deux-blocs p.detail { color: var(--si-ink); }

  /* ── 06 · L'équipe ────────────────────────────────────────────────────────
     Deux points de vue de même poids, séparés par un filet vertical. La
     composition change volontairement de celle de la suite : ici, aucun des
     deux ne domine, et c'est le propos. */
  .xc .deux-vues {
    margin-top: clamp(32px, 4vw, 52px);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(28px, 4vw, 64px);
    padding-top: clamp(24px, 3vw, 34px);
    border-top: 1px solid var(--line);
  }
  .xc .deux-vues .vue p {
    margin-top: 12px;
    max-width: 40ch;
    font-family: var(--sans);
    font-size: var(--t-corps);
    line-height: 1.62;
    color: var(--muted);
  }
  .xc #equipe .chute { margin-top: clamp(28px, 3.4vw, 44px); }

  /* ── 07 · L'offre ─────────────────────────────────────────────────────────
     Les trois temps de la mise en service, sous les deux forfaits : le prix
     seul ne dit pas ce qui se passe après, et c'est la question qui suit le
     prix dans toutes les conversations. */
  .xc #tarifs .etapes {
    margin-top: clamp(32px, 4vw, 48px);
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: clamp(24px, 3.4vw, 48px);
  }
  .xc #tarifs .etape { border-top: 1px solid var(--line); padding-top: 16px; }
  .xc #tarifs .etape .n {
    font-family: var(--mono);
    font-size: var(--t-menu);
    letter-spacing: 0.1em;
    color: var(--verified);
  }
  .xc #tarifs .etape .t {
    margin-top: 10px;
    font-family: var(--sans);
    font-size: var(--t-argument);
    line-height: 1.25;
    letter-spacing: -0.014em;
    color: var(--si-ink);
  }
  .xc #tarifs .etape .d {
    margin-top: 8px;
    max-width: 34ch;
    font-family: var(--sans);
    font-size: var(--t-detail);
    line-height: 1.55;
    color: var(--muted);
  }
  .xc #tarifs .actions { margin-top: clamp(32px, 4vw, 48px); display: flex; gap: 18px; flex-wrap: wrap; }

  .xc section.flat { padding-block: clamp(84px, 12vh, 150px); padding-inline: max(var(--gouttiere), (100% - var(--page)) / 2); }
  .xc section.flat .inner { max-width: var(--page); margin: 0 auto; }
  .xc section.flat.surface { background: var(--surface); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }

  .xc #tarifs .plan {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 16px;
    padding: 26px 0;
    border-bottom: 1px solid var(--line);
  }
  .xc #tarifs .plan:first-of-type { margin-top: 34px; border-top: 1px solid var(--line); }
  .xc #tarifs .plan .name { font-family: var(--sans); font-size: 16px; }
  .xc #tarifs .plan .detail { margin-top: 4px; font-family: var(--sans); font-size: 13.5px; color: var(--muted); }
  /* Le prix et son unité restent un chiffre : mono, comme tout montant du
     site. La serif s'arrête au texte qui l'entoure. */
  .xc #tarifs .plan .price { font-family: var(--mono); font-size: var(--t-argument); text-align: right; }
  .xc #tarifs .plan .price small { font-family: var(--mono); font-size: var(--t-menu); color: var(--muted); margin-left: 4px; }
  .xc #tarifs .note { margin-top: 18px; font-family: var(--sans); font-size: 13px; color: var(--muted); }

  .xc #questions .q {
    display: grid;
    grid-template-columns: 0.86fr 1.14fr;
    gap: 18px;
    padding: 26px 0;
    border-top: 1px solid var(--line);
  }
  .xc #questions .q h3 { font-family: var(--serif); font-weight: 400; font-size: var(--t-argument); line-height: 1.35; }
  .xc #questions .q p { max-width: 58ch; font-family: var(--sans); font-size: 14.5px; line-height: 1.65; color: var(--muted); }
  .xc #questions .liste-q { margin-top: clamp(32px, 4vw, 44px); }

  /* La fermeture s'aligne à gauche, comme les huit chapitres qui la précèdent.
     Elle était le seul bloc centré de la page : après seize écrans de colonne
     à 140 px, un dernier écran centré se lit comme un gabarit rapporté, et
     c'est le tell A2 de DESIGN_HUMAIN (« tout centré »). La page garde donc
     une seule ligne de départ du premier mot au dernier bouton. */
  .xc #cta h2 { max-width: 18ch; }
  .xc #cta p { margin: 22px 0 0; max-width: 50ch; font-family: var(--sans); font-size: 16px; line-height: 1.65; color: var(--muted); }
  .xc #cta .reassure { margin-top: 20px; font-size: var(--t-detail); color: var(--muted); }
  .xc #cta .actions { margin-top: 34px; display: flex; gap: 18px; flex-wrap: wrap; }
  .xc .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 44px;
    padding: 0 24px;
    border-radius: 7px;
    background: var(--green);
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 14px 28px -18px rgb(var(--si-forest-rgb) / 0.85);
    transition: transform 0.2s ease;
  }
  .xc .btn:hover { transform: translateY(-2px); }
  /* Le bouton second n'avait ni fond, ni bord, ni ombre : rien ne disait qu'on
     pouvait cliquer, sinon sa position à côté du bouton plein. Un filet suffit
     à le rendre saisissable sans lui donner le poids d'une action principale
     (DESIGN_HUMAIN P6 : un contrôle explique son usage par ses signifiants). */
  .xc .btn.ghost {
    background: transparent;
    color: var(--ink);
    box-shadow: none;
    border: 1px solid var(--line);
    transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
  }
  .xc .btn.ghost:hover {
    border-color: rgb(var(--si-line-ink-rgb) / 0.22);
    background: rgb(var(--si-line-ink-rgb) / 0.03);
  }

  /* La mention des maquettes, en fin de recit. Meme traitement que la note de
     bas de section sur Fonctionnalites : un filet tres discret, l'encre la plus
     legere, et une mesure large parce qu'on ne la lit pas, on la trouve. */
  .xc #cta .mention-maquettes {
    margin-top: 48px;
    padding-top: 20px;
    border-top: 1px solid var(--line-douce, var(--line));
    max-width: 74ch;
    font-family: var(--sans);
    font-size: 12.5px;
    line-height: 1.6;
    color: var(--faint, var(--muted));
  }

  /* ── Bouton et panneau de navigation au téléphone ── */
  /* Le bouton de menu est encadré : sans filet, rien ne disait qu'on pouvait
     appuyer, sinon trois traits posés dans le vide. Même cadre que celui du
     composant partagé, 36 px, que la règle tactile de globals.css porte à 44
     au doigt. */
  .xc #burger {
    display: none;
    width: 36px;
    height: 36px;
    align-items: center;
    justify-content: center;
    background: var(--si-surface);
    border: 1px solid var(--line);
    border-radius: 7px;
    cursor: pointer;
    color: var(--si-ink);
  }
  .xc #burger span { display: block; width: 19px; }
  .xc #burger i {
    display: block;
    height: 1.6px;
    background: currentColor;
    border-radius: 2px;
    transition: transform 0.25s ease, opacity 0.2s ease;
  }
  .xc #burger i + i { margin-top: 4.5px; }
  .xc #burger span.ouvert i:nth-child(1) { transform: translateY(6.1px) rotate(45deg); }
  .xc #burger span.ouvert i:nth-child(2) { opacity: 0; }
  .xc #burger span.ouvert i:nth-child(3) { transform: translateY(-6.1px) rotate(-45deg); }

  .xc #voile {
    position: fixed;
    inset: 0;
    z-index: 55;
    border: 0;
    background: rgb(var(--si-ink-rgb) / 0.45);
    animation: xcFade 0.25s ease;
  }
  /* Le panneau suit la barre : ancré sous le bouton qui l'ouvre, à droite,
     240 px, comme celui du composant partagé. Il occupait toute la largeur
     sous une barre qui, elle, flottait dans un retrait. */
  .xc #menu-mobile {
    position: fixed;
    top: 70px;
    right: var(--marge, 20px);
    width: 240px;
    z-index: 60;
    padding: 8px;
    border-radius: 12px;
    background: rgb(var(--si-surface-rgb) / 0.94);
    backdrop-filter: blur(18px) saturate(1.35);
    -webkit-backdrop-filter: blur(18px) saturate(1.35);
    border: 1px solid rgb(var(--si-line-ink-rgb) / 0.10);
    box-shadow: 0 16px 36px -26px rgb(var(--si-line-ink-rgb) / 0.45);
    animation: xcSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .xc #menu-mobile a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 44px;
    padding: 0 12px;
    border-radius: 8px;
    font-size: 13px;
    color: var(--si-muted);
  }
  .xc #menu-mobile a:hover { background: rgb(var(--si-line-ink-rgb) / 0.05); }
  .xc #menu-mobile a span { color: var(--si-subtle); }
  @keyframes xcFade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes xcSlide { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: none; } }
  @keyframes xcMarquee { from { transform: translateX(0); } to { transform: translateX(-100%); } }

  /* ═══════════════════════════════════════════════════════════════════════
     TÉLÉPHONE
     ═══════════════════════════════════════════════════════════════════════

     Ce bloc n'est pas une pile de rattrapages, c'est la version téléphone de
     la page. Elle tient en quatre décisions.

     1. DEUX VOIX, PAS TROIS. Au large, la page parle en trois familles : la
        serif porte le discours, Geist Sans l'interface, Geist Mono les
        chiffres et les exergues. Sur 375 px, trois familles dans un même écran
        se lisent comme un défaut de fabrication plutôt que comme une
        intention. Le mono se replie donc sur le sans, et les chiffres gardent
        ce que la loi L1 protège réellement : l'alignement, obtenu par
        font-variant-numeric: tabular-nums posé à la racine.

     2. UNE SEULE ÉCHELLE. Les tailles vivaient chapitre par chapitre, chacune
        réglée à la main : le titre d'une scène ne valait pas celui de la
        suivante sans qu'aucune règle ne l'ait décidé. Sept variables
        décrivent maintenant tout ce qui se lit, du titre d'ouverture au plus
        petit libellé, et rien ne descend sous 11 px au doigt.

     3. RIEN NE DÉBORDE. Les mots longs du métier — « fidéicommis »,
        « rapprochement », « conformité » — se coupent au lieu de pousser leur
        bloc hors de l'écran, et tout enfant de grille peut redescendre sous sa
        largeur intrinsèque.

     4. ÇA RESPIRE. Une marge latérale unique, un rythme vertical unique.

     Le mouvement n'est pas traité ici : le téléphone emprunte plus bas le bloc
     « sans mouvement », qui le lui retire en entier. */
  @media (max-width: 860px) {
    .xc {
      /* L'échelle. Sept tailles pour toute la page. */
      --t-affiche: 33px;   /* le titre d'ouverture, une seule fois par page */
      --t-marque: 28px;    /* le mot de chapitre : Simple, Fiable, Complet */
      --t-titre: 23px;     /* le titre d'un chapitre */
      --t-argument: 17px;  /* un point numéroté */
      --t-corps: 14.5px;   /* la prose */
      --t-detail: 13px;    /* la justification sous un point */
      --t-menu: 11px;      /* exergue, méta, libellé d'écran : le plancher */

      /* Une seule marge latérale pour toute la page. */
      --marge: 20px;

      /* La colonne du numéro devant un argument, et la mesure de lecture.
         Au large, un argument se lit sur 30 caractères et le numéro tient dans
         26 px ; sur 375 px, la colonne du numéro se resserre et la mesure
         disparaît, sinon elle rogne une largeur déjà comptée. */
      --col-numero: 22px;
      --gout-numero: 10px;
      --pad-argument: 14px;
      --mesure-argument: none;
      --mesure-detail: none;

      /* Une scène ne réserve plus une vue entière : elle prend la hauteur de
         ce qu'elle raconte. Voir le bloc « sans mouvement » plus bas. */
      --haut-scene: 0;

      /* Deux voix. */
      --mono: var(--sans);
      font-variant-numeric: tabular-nums;

      /* Un mot plus large que sa colonne se coupe au lieu de la percer. */
      overflow-wrap: break-word;
    }
    /* Pas de césure automatique. Elle avait été posée par précaution, et elle
       coupait « enfin » en « en-fin » au milieu du chapeau : une coupure
       correcte en français, mais qui se lit comme une coquille dans une phrase
       de vente. overflow-wrap suffit pour ce qu'on cherchait réellement à
       éviter, un mot plus large que sa colonne. */
    /* Par défaut, un enfant de grille refuse de descendre sous la largeur de
       son plus long mot et pousse toute la rangée hors de l'écran. */
    .xc .fi-grid > *, .xc .co-grid > *, .xc .q > *,
    .xc .deux-colonnes > *, .xc .deux-blocs > *, .xc .deux-vues > *,
    .xc .bloc-maitre > *, .xc .morceau > *, .xc .co-arg > *,
    .xc .fi-arg > *, .xc .co-item > * { min-width: 0; }

    /* ── Barre de navigation ────────────────────────────────────────────────
       Elle flotte au-dessus de tout le défilement : chaque pixel qu'elle prend
       est un pixel définitivement perdu sur 812. Elle passe de 56 à 48 px et se
       rapproche du bord. Les liens se rangent dans le menu, le bouton reste
       une cible de 44 px. */
    /* L'action ne se range plus dans le menu. C'est le trait qui distingue la
       barre retenue : sur un téléphone, la prochaine étape doit rester à
       portée de pouce sans ouvrir quoi que ce soit. Seuls les liens et la
       connexion passent derrière le bouton de menu. */
    .xc #rail, .xc #nav .links, .xc #nav .signin { display: none; }
    /* Le retrait de la barre suit celui de la page, 20 px : le logo se pose
       sur la même arête que le titre en dessous. Les pages partagées alignent
       les deux à 24 px, l'accueil aligne les deux à 20. */
    .xc #nav { padding: 0 var(--marge); }
    .xc #nav .navright { gap: 16px; }
    .xc #nav .cta { height: 34px; padding: 0 16px; border-radius: 7px; }
    .xc #burger { display: inline-flex; }

    /* ── Première vue ───────────────────────────────────────────────────────
       Deux décors disparaissent, pour la même raison : ils s'adressaient à une
       souris et à un grand écran.

       Le canevas d'assemblage d'abord. Les cartes qui dérivaient derrière le
       titre réagissaient au survol du curseur : au doigt, elles ne faisaient
       que salir la lecture du titre.

       L'application navigable ensuite. Composée sur 1000 px puis ramenée à la
       largeur du téléphone, elle tombait à 0,33 d'échelle et ses libellés à
       moins de 7 px. Le script la retire (poserHeroStatique) ; la feuille de
       style fait la même chose pour qu'elle n'apparaisse pas le temps d'une
       image avant que le script ne tourne.

       Reste ce qui parle : l'exergue, le titre, le chapeau, l'action. */
    /* ── La première vue prend tout l'écran ─────────────────────────────────
       Le canevas d'assemblage reste retiré : ses cartes dérivaient au survol
       du curseur, geste qui n'existe pas au doigt.

       L'application, elle, revient. Elle avait été retirée pour une raison
       exacte : composée sur 1000 px puis ramenée à 375, elle tombait à 0,33
       d'échelle et ses libellés à moins de 7 px. La faute n'était pas de la
       montrer, elle était de la montrer ENTIÈRE. Une fenêtre de bureau ne
       rentre pas dans un téléphone ; un fragment, oui.

       Elle est donc AGRANDIE, pas réduite, et le cadre la rogne : on voit une
       colonne du tableau de bord à 1,15 fois sa taille de composition, soit
       des libellés à 15 px, plus lisibles que sur un écran de bureau. C'est
       le parti de la référence : montrer un morceau vrai et net plutôt qu'un
       tout illisible.

       La scène occupe une vue entière, titre en haut, fenêtre en bas, et la
       fenêtre est coupée par le bas de l'écran : elle continue au-delà, ce
       qui dit qu'il y a un produit derrière et invite à défiler. */
    .xc #hero-canvas, .xc #hero-caption { display: none; }
    /* La scène reprend une course de défilement, la plus courte possible.

       L'assemblage était joué au temps : il partait tout seul à l'arrivée et
       se terminait sans qu'on ait rien fait. Ce n'est pas ce que raconte la
       scène du large, où ce sont les feuilles qui se rangent PARCE QU'ON
       descend. Le geste fait le propos : on tire vers le bas, le cabinet se
       rassemble (décision CEO du 18 août 2026).

       Une vue et demie de course, pas quatre comme au large. C'est le minimum
       pour que le rassemblement se lise sans que la page s'allonge d'un
       chapitre entier. */
    .xc #zone-hero { height: 250svh !important; }
    .xc #zone-hero .pin {
      position: sticky;
      top: 0;
      height: 100svh;
      min-height: 100svh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .xc #hero-copy {
      position: static;
      order: 1;
      flex: none;
      padding: 84px var(--marge) 0;
    }

    /* La fenêtre. Elle prend ce qui reste de la vue sous le titre, avec un
       plancher pour que la coupe reste franche sur les petits écrans. */
    /* La fenêtre. Elle avait un bord droit franc : l'application s'y arrêtait
       net, sur un filet, au milieu d'une colonne de chiffres. Une capture
       coupée au couteau se lit comme une image détourée et collée.

       Le bord droit disparaît donc et l'image s'éteint dedans. Le cadre garde
       ses deux arêtes vraies, à gauche et en haut, celles qui disent « ceci
       est une fenêtre de logiciel » ; du côté où elle déborde, elle se fond
       dans la page (retour CEO du 18 août 2026). */
    .xc #hero-cadre {
      position: relative;
      inset: auto;
      order: 2;
      flex: 1 1 auto;
      min-height: 300px;
      margin: 22px 0 0 var(--marge);
      /* La hauteur et le retrait haut sont repris par le script en fin de
         course, quand le texte s'efface pour laisser voir l'application
         entière, bord bas compris. */
      /* Le cadre n'existe pas encore au départ.

         Tant que les feuilles dérivent, il n'y a pas de logiciel : il y a des
         papiers sur un bureau. Une surface blanche déjà posée derrière eux
         annonçait la fin avant le début, et se lisait comme un trou clair
         dans la page (retour CEO du 18 août 2026).

         La page reste donc entièrement grise pendant la dérive. Le blanc, le
         filet et l'arrondi arrivent AVEC le rassemblement : c'est le script
         qui monte --cadre-a de zéro à un pendant que les feuilles se rangent,
         de sorte que la fenêtre se matérialise en même temps que son contenu. */
      --cadre-a: 0;
      border: 1px solid rgb(var(--si-line-ink-rgb) / calc(0.14 * var(--cadre-a)));
      border-right: 0;
      border-bottom: 0;
      border-radius: 12px 0 0 0;
      background: rgb(var(--si-surface-rgb) / var(--cadre-a));
      overflow: hidden;
      -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 72%, transparent 100%);
      mask-image: linear-gradient(90deg, #000 0%, #000 72%, transparent 100%);
    }
    /* L'application derrière la fenêtre : agrandie, ancrée sur la colonne de
       droite du tableau de bord, celle qui porte le travail à traiter.
       L'origine du rognage vit dans deux variables pour se régler d'un seul
       endroit. */
    .xc #hero-app {
      /* Le cadrage part du HAUT de l'application, barre de navigation
         comprise : sans elle on voyait un panneau de chiffres qui pouvait
         venir de n'importe où. Avec elle on voit un logiciel, son cabinet,
         ses menus et sa bande d'état, puis la lecture rapide et le travail à
         traiter (retour CEO du 18 août 2026). */
      --crop-x: 0px;
      --crop-y: 0px;
      --crop-echelle: 0.72;
      display: block;
      position: absolute;
      left: 0;
      top: 0;
      opacity: 1;
      border: 0;
      border-radius: 0;
      box-shadow: none;
      transform-origin: top left;
      transform: scale(var(--crop-echelle)) translate(calc(-1 * var(--crop-x)), calc(-1 * var(--crop-y)));
    }
    .xc #hero-copy h1 {
      margin-top: 16px;
      font-size: var(--t-affiche);
      line-height: 1.04;
      letter-spacing: -0.02em;
      max-width: none;
    }
    .xc #hero-copy p.lede {
      margin-top: 20px;
      font-size: var(--t-corps);
      line-height: 1.58;
      max-width: none;
    }
    /* La barre range son action dans le menu : ce bloc porte donc la seule
       action visible de la première vue. */
    /* Une seule action, et rien après elle.

       La première vue portait le bouton, un lien « Voir ce que fait SAFE » et
       une ligne de réassurance. Trois choses à décider au lieu d'une, sur le
       seul écran où l'on n'a encore rien vu du produit, et cent-vingt pixels
       pris sur la fenêtre qui, elle, montre le produit.

       Le lien secondaire et la réassurance sont retirés au téléphone
       (décision CEO du 18 août 2026). La démonstration commence juste en
       dessous : elle dit ce que fait SAFE mieux qu'un lien vers une autre
       page, et le diagnostic reste gratuit qu'on l'écrive ou non. */
    /* Le lien secondaire reste caché : au pouce, la suite se découvre en
       défilant, et l'indication du bas le dit déjà.

       La réassurance, elle, revient. Elle avait été retirée avec lui le
       18 août pour rendre cent-vingt pixels à la fenêtre du produit. Ce sont
       trois faits vérifiables (conçu au Québec, adapté aux deux provinces,
       données au Canada) et c'est la seule preuve de la première vue au
       téléphone, puisque la démonstration y arrive plus bas. */
    .xc #hero-copy .hero-second { display: none; }
    .xc #hero-copy .hero-reassure {
      margin-top: 16px;
      margin-left: 0;
      font-size: var(--t-detail);
      line-height: 1.5;
    }
    .xc #hero-copy .hero-actions { margin-top: 24px; gap: 16px; }
    .xc #hero-hint { font-size: var(--t-menu); }
    .xc #hero-caption { font-size: var(--t-detail); }

    /* ── Exergues et libellés ───────────────────────────────────────────────
       Le mono tenait ses majuscules espacées à 11 px. Le sans est plus large à
       taille égale : l'interlettrage se resserre, sinon « SYSTÈME DE GESTION
       POUR CABINETS D'AVOCATS » passe sur deux lignes et touche le bord. */
    .xc .kicker, .xc .fi-ou, .xc .co-ou,
    .xc .ha-kicker, .xc .lab, .xc .lb, .xc .sub, .xc .h, .xc .date {
      font-size: var(--t-menu);
      letter-spacing: 0.09em;
    }

    /* ── Sections ───────────────────────────────────────────────────────────
       Une seule grammaire pour toute la page : l'exergue, le titre, ce qui
       suit. Chaque section réglait la sienne ; elles partagent la même. */
    .xc section.flat h2, .xc .fi-copy h2, .xc .co-copy h2 {
      margin-top: 12px;
      font-size: var(--t-titre);
      line-height: 1.14;
      max-width: none;
    }
    /* Les points des deux scènes partagent un seul corps, ici comme au
       large. La sous-ligne n'existe plus, donc l'échelle du téléphone n'a plus
       qu'une taille à donner pour eux.

       L'interligne s'ouvre de 1,24 à 1,36. Au large, un point tient sur une
       ligne et l'interligne serré le tient groupé ; sur 335 px, les points de
       la vérification passent tous à deux lignes, et le même serrage donne un pavé
       compact que l'oeil lit comme un paragraphe et non comme un point. */
    .xc .fi-arg .e, .xc .co-arg .e {
      font-size: var(--t-argument);
      line-height: 1.36;
      max-width: none;
    }
    .xc .fi-narration, .xc .co-narration { margin-top: 26px; }
    .xc .co-intro {
      margin-top: 8px;
      font-size: var(--t-detail);
      line-height: 1.5;
      max-width: none;
    }
    .xc .co-fin { margin-top: 14px; font-size: var(--t-corps); }

    /* Les deux volets de chaque chapitre s'empilent, et le propos passe
       toujours avant sa démonstration : on lit d'abord de quoi il s'agit. */
    .xc .fi-grid { grid-template-columns: 1fr; gap: 18px; }
    .xc .co-grid { grid-template-columns: 1fr; gap: 16px; }
    .xc .co-stage { order: 2; }
    .xc .co-copy { order: 1; }
    /* ── Les points, au téléphone ───────────────────────────────────────────
       Au large, ce qui tient les trois points ensemble est la colonne : ils
       partagent une arête gauche, l'écran de démonstration leur fait face, et
       le point en cours porte l'encre pleine pendant que le défilement le
       désigne. Rien de tout cela ne survit sur 335 px. Le défilement piloté
       est coupé, donc les trois points sont tous « en cours » en même temps ;
       la démonstration passe dessous au lieu d'être en face ; et le numéro
       vert, seul repère restant, est un détail de 11 px posé à gauche d'un
       texte qui fait le double.

       Il restait donc trois phrases de même poids, sans rien pour dire où
       l'une finit et où la suivante commence, séparées par du vide. C'est ce
       vide qui se lit comme un brouillon.

       Le filet remplace le vide. Ce n'est pas une invention pour l'occasion :
       la page s'en sert déjà deux fois plus bas, pour les forfaits et pour
       les questions. Les points des piliers prennent la même grammaire, donc
       le téléphone lit trois listes bâties pareil au lieu de trois blocs qui
       se ressemblent vaguement. Le dernier filet ferme la liste et la détache
       de la phrase de chute, qui conclut le chapitre et n'en fait pas partie. */
    /* ── Les points se lisent en travers, un par écran ──────────────────────
       Empilés, les trois points d'un pilier prenaient la hauteur d'un écran à
       eux seuls, et le chapitre en demandait deux avant sa démonstration. On
       lisait donc trois affirmations d'affilée sans jamais en voir une seule
       posément.

       Ils passent en travers, une carte par point (décision CEO du 18 août
       2026). Une carte occupe 82 % de la largeur : la suivante dépasse assez
       pour qu'on sache qu'elle existe, et le geste pour l'atteindre est celui
       qu'on fait déjà partout ailleurs sur un téléphone. L'aimant arrête la
       course sur une carte, jamais entre deux.

       Chaque carte porte le point et une phrase qui le pose. La phrase n'a pas
       sa place au large, où la démonstration est en face du texte ; ici elle
       est dessous, donc hors du regard, et la phrase reprend son rôle.

       La barre de défilement disparaît : c'est la carte coupée au bord droit
       qui dit qu'on peut pousser, pas un rail gris. */
    .xc .fi-args, .xc .co-args {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: 88%;
      gap: 16px;
      overflow-x: auto;
      overscroll-behavior-x: contain;
      scroll-snap-type: x mandatory;
      /* Sans cette ligne, l'aimant colle la première carte au bord de la BOÎTE
         et non au bord du contenu : la liste s'ouvrait décalée de vingt
         pixels, première carte coupée à gauche. */
      scroll-padding-inline: var(--marge);
      scrollbar-width: none;
      /* La liste sort de la colonne pour que la première carte s'aligne sur le
         texte et que la dernière puisse atteindre le bord. */
      margin-inline: calc(-1 * var(--marge));
      padding-inline: var(--marge);
      /* De l'air sous les cartes pour l'ombre, repris en marge négative. */
      padding-bottom: 14px;
      margin-bottom: -14px;
    }
    .xc .fi-args::-webkit-scrollbar,
    .xc .co-args::-webkit-scrollbar { display: none; }

    /* La carte d'un point.

       Elle reprend la fiche de la page « à propos », qui a été validée : un
       numéro en tête, le propos en serif, la phrase en sans dessous, et de
       l'air (retour CEO du 18 août 2026). Ce qui change ici tient en trois
       choses.

       Elle respire davantage : 28 px de retrait au lieu de 24, et surtout un
       filet sous le numéro qui sépare l'étiquette du propos. Sans lui, les
       trois blocs se touchaient et la carte se lisait comme un paragraphe
       encadré.

       Elle est plus haute que son contenu : une hauteur commune, donc trois
       cartes de même taille quel que soit le nombre de lignes, et la phrase
       calée en bas. Trois cartes inégales dans un carrousel donnent un bord
       bas qui monte et descend à chaque glissement.

       Et elle répond au doigt : celle qu'on a devant soi porte l'encre pleine
       et une ombre plus franche, les autres reculent d'un ton. C'est la même
       distinction que fait le défilement piloté au large, rendue ici par la
       position dans le carrousel. */
    .xc .fi-arg, .xc .co-arg {
      display: flex;
      flex-direction: column;
      min-height: 210px;
      scroll-snap-align: start;
      padding: 28px 30px 30px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: var(--si-surface);
      box-shadow: 0 1px 2px rgb(var(--si-line-ink-rgb) / 0.04),
                  0 10px 20px -18px rgb(var(--si-line-ink-rgb) / 0.22);
      transition: box-shadow 320ms var(--doux), border-color 320ms var(--doux);
    }
    .xc .fi-arg, .xc .co-arg, .xc .fi-arg.actif, .xc .co-arg.actif { transform: none; }
    .xc .fi-arg.actif, .xc .co-arg.actif {
      border-color: rgb(var(--si-line-ink-rgb) / 0.16);
      box-shadow: 0 1px 2px rgb(var(--si-line-ink-rgb) / 0.05),
                  0 20px 38px -24px rgb(var(--si-line-ink-rgb) / 0.40);
    }
    .xc .fi-arg .n, .xc .co-arg .n {
      display: block;
      top: 0;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--line);
    }
    .xc .fi-arg .e, .xc .co-arg .e {
      margin-top: 18px;
      color: var(--si-ink);
    }
    .xc .fi-arg .d, .xc .co-arg .d {
      display: block;
      /* La phrase suit son propos de près.

         Elle a d'abord été poussée au bas de la carte pour que les trois
         phrases s'alignent entre elles. Mauvais calcul : avec un propos d'une
         seule ligne, la carte se creusait de cent trente pixels de vide en son
         milieu. La hauteur commune reste, mais le jeu se prend EN BAS, sous la
         phrase, où il se lit comme du dégagement et non comme un trou. */
      margin-top: 14px;
      font-family: var(--sans);
      font-size: var(--t-detail);
      line-height: 1.55;
      color: var(--si-body);
    }

    /* Les repères de position, posés par le script sous chaque carrousel.
       Le repère courant s'allonge au lieu de changer de couleur : à cette
       taille, une différence de forme se voit d'un coup d'œil là où une
       différence de teinte demande de comparer. */
    .xc .arg-points {
      display: flex;
      gap: 6px;
      margin-top: 16px;
    }
    .xc .arg-points i {
      display: block;
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: rgb(var(--si-line-ink-rgb) / 0.18);
      transition: width 260ms var(--doux), background-color 260ms var(--doux);
    }
    .xc .arg-points i.on {
      width: 20px;
      background: var(--si-verified);
    }
    /* Le numéro est calé sur la première ligne de texte, pas sur son milieu :
       à deux lignes, un numéro centré flotte entre les deux et ne désigne
       plus rien. L'alignement sur la ligne de base le fait, sauf qu'à 11 px
       contre 17 px la base commune enfonce le numéro d'environ un pixel sous
       la panse des minuscules. Le décalage le remonte à hauteur d'oeil. */
    .xc .fi-arg .n, .xc .co-arg .n {
      position: relative;
      top: -1px;
    }

    /* Le dégagement en tête de chapitre tient compte de la barre flottante
       (10 px de haut plus 48 px de hauteur) : sans lui, elle recouvrait le mot
       du chapitre. */
    .xc .fi-pin { padding: 88px var(--marge) 72px; }
    .xc .co-pin { padding: 88px var(--marge) 72px; }
    .xc section.flat { padding: 64px var(--marge); }

    /* ── Écrans de démonstration ────────────────────────────────────────────
       Ce sont des captures du produit, pas des illustrations : les retirer
       reviendrait à décrire au lieu de montrer. Elles prennent toute la
       largeur et leurs libellés remontent au plancher de 11 px — à 9 px, elles
       montraient qu'il y avait quelque chose sans qu'on puisse le lire. */
    .xc .fi-ecran, .xc .co-ecran {
      max-width: none;
      margin-left: 0;
      padding: 14px 15px 15px;
    }
    .xc .fi-src { padding: 9px 0; }
    .xc .fi-src .l, .xc .fi-src .m { font-size: var(--t-detail); }
    .xc .fi-dit, .xc .fi-refus { font-size: var(--t-menu); }
    .xc .co-sous { margin-top: 10px; }
    .xc .co-item { padding: 7px 0; }
    .xc .co-item .t, .xc .co-item .m { font-size: var(--t-detail); }
    .xc .co-item .s { font-size: var(--t-menu); }

    /* ── Les sections écrites, au pouce ─────────────────────────────────────
       Toutes leurs grilles à deux colonnes s'empilent. L'ordre de lecture est
       déjà le bon dans le balisage : la liste avant son commentaire, le bloc
       maître avant les deux blocs secondaires, la vue de l'adjointe avant
       celle de l'avocate. */
    .xc .deux-colonnes,
    .xc .deux-blocs,
    .xc .deux-vues,
    .xc .bloc-maitre,
    .xc #tarifs .etapes {
      grid-template-columns: 1fr;
      gap: 22px;
    }
    .xc .deux-colonnes { margin-top: 26px; gap: 26px; }
    .xc .bloc-maitre { margin-top: 26px; padding: 22px 0; }
    .xc .deux-vues { margin-top: 26px; padding-top: 22px; }
    .xc #tarifs .etapes { margin-top: 28px; }
    /* Le repère de l'endroit passe sous la phrase : à 335 px, une colonne de
       droite en plus de la colonne du numéro ne laisse plus rien au texte. */
    .xc .morceau { grid-template-columns: 26px 1fr; row-gap: 6px; padding: 13px 0; }
    .xc .morceau .t { font-size: var(--t-detail); line-height: 1.5; }
    .xc .morceau .ou { grid-column: 2; }
    .xc .bloc-maitre h3, .xc .deux-blocs h3 { font-size: var(--t-argument); max-width: none; }
    .xc .bloc-maitre p, .xc .deux-blocs p, .xc .deux-vues .vue p,
    .xc #probleme .cote p, .xc #tarifs .etape .d { max-width: none; font-size: var(--t-detail); }
    .xc section.flat .chute, .xc .fi-precision { max-width: none; font-size: var(--t-corps); }
    .xc .contexte li { font-size: var(--t-menu); padding: 6px 10px; }
    .xc #tarifs .actions { margin-top: 28px; flex-direction: column; align-items: stretch; }
    .xc .fi-intro { margin-top: 12px; font-size: var(--t-detail); line-height: 1.5; max-width: none; }
    .xc #questions .liste-q { margin-top: 26px; }

    /* ── La mesure ──────────────────────────────────────────────────────────
       Sept blocs de texte portaient un plafond en ch calculé pour le large et
       jamais relevé ici. Mesuré sur 375 px, la colonne offre 335 px et ces
       blocs s'arrêtaient à 169, 190, 227, 240 et 275 px : la moitié de
       l'écran restait vide à droite pendant que la phrase se cassait en trois
       lignes courtes. « Des réponses précises aux questions importantes »
       tombait sur trois lignes dans 169 px.

       Un plafond en ch protège d'une ligne trop longue. Sur un téléphone, la
       largeur de l'écran est déjà ce plafond : 335 px donnent au plus 40
       caractères, très en deçà des 65 de PS-008. Le plafond n'y protège de
       rien, il ne fait que rogner. Il tombe donc, et les huit blocs prennent
       la colonne, comme tout le reste de la page. */
    .xc .co-fin, .xc .co-fin .co-comptable,
    .xc #tarifs .head h2, .xc #questions h2, .xc #cta h2 { max-width: none; }

    /* ── Bas de page ────────────────────────────────────────────────────────
       Les trois sections plates gardaient l'échelle du large : leurs titres
       montaient à 46 et 56 px, et le prix pesait plus lourd que le nom du
       forfait qu'il chiffre. Elles rejoignent l'échelle commune. */
    .xc #tarifs .head h2, .xc #questions h2, .xc #cta h2 {
      font-size: var(--t-titre);
      line-height: 1.14;
    }
    /* Le prix se cale sur le nom du forfait, pas sur le milieu du bloc. Avec
       align-items: center, un prix de 22 px se centrait sur deux lignes de
       texte et venait se poser entre « Solo » et sa description : il ne
       chiffrait visuellement ni l'un ni l'autre. Aligné sur la ligne de base
       du nom, il chiffre le nom. */
    .xc #tarifs .plan { padding: 20px 0; gap: 12px; align-items: baseline; }
    .xc #tarifs .plan:first-of-type { margin-top: 24px; }
    .xc #tarifs .plan .name { font-size: var(--t-argument); }
    .xc #tarifs .plan .detail { font-size: var(--t-detail); }
    .xc #tarifs .plan .price { font-size: 22px; }
    .xc #tarifs .plan .price small { font-size: var(--t-menu); }
    .xc #tarifs .note, .xc #questions .more, .xc #tarifs .more { font-size: var(--t-detail); }
    .xc #questions .q { grid-template-columns: 1fr; gap: 8px; }
    .xc #questions .q h3 { font-size: var(--t-argument); }
    .xc #questions .q p { font-size: var(--t-corps); max-width: none; }
    .xc #cta p { margin-top: 16px; font-size: var(--t-corps); max-width: none; }
    .xc #cta .actions { margin-top: 26px; gap: 12px; }
    /* Deux actions côte à côte tombaient chacune sous la largeur d'un pouce :
       elles s'empilent, pleine largeur, comme celles de la synthèse. */
    .xc #cta .actions { flex-direction: column; align-items: stretch; }
    /* ── L'entrée des textes ────────────────────────────────────────────────
       Posée par le script (voir entreeTelephone), et seulement quand le
       système ne demande pas moins de mouvement. La classe sur la racine est
       la garantie que rien ne reste invisible si le script ne tourne pas :
       sans elle, aucune de ces deux règles ne s'applique et la page arrive à
       son état final, comme avant. */
    .xc.tel-anime [data-tel-entre] {
      opacity: 0;
      transform: translateY(12px);
      transition:
        opacity 620ms var(--doux),
        transform 620ms var(--doux);
    }
    .xc.tel-anime [data-tel-entre="vu"] {
      opacity: 1;
      transform: none;
    }

  }

  /* Sans mouvement — et au téléphone, qui suit la même règle.

     Le pouce hérite de tout ce bloc parce que le script y prend déjà le chemin
     statique (voir SEUIL_TELEPHONE). Les deux devaient rester d'accord : quand
     le script posait la vérification à son état final mais que la feuille de style
     gardait ses arguments à opacité nulle et hauteur nulle, le chapitre
     s'affichait à moitié effacé sur trois écrans de vide. Une seule liste de
     règles pour les deux cas, et la question ne peut plus se poser. */
  @media (prefers-reduced-motion: reduce), (max-width: 860px) {
    /* On cible la CLASSE et non chaque identifiant : ajouter un chapitre ne
       doit pas pouvoir laisser trois écrans de vide à quelqu'un qui a désactivé
       les animations. Sans cette règle, la zone garde sa course de défilement
       alors que son contenu ne bouge plus. */
    .xc .pinzone { height: auto !important; }
    /* Sur un grand écran, une scène dépinglée garde la hauteur d'une vue :
       elle reste une scène, on la lit d'un bloc. Au téléphone, la même règle
       recentrait un contenu plus court dans une vue trop haute et rouvrait
       exactement les vides qu'on venait de fermer. La hauteur devient donc une
       variable, que le bloc téléphone met à zéro : chaque chapitre prend la
       hauteur de ce qu'il contient, et c'est son dégagement qui le fait
       respirer. */
    .xc .pinzone .pin { position: relative; height: auto; min-height: var(--haut-scene, 100vh); }
    /* L'indication de défilement reste au téléphone. Elle avait été retirée
       avec l'ancienne première vue, qui n'avait plus rien à révéler plus bas.
       Elle en a de nouveau : trois états de rassemblement qui ne partent que
       si l'on descend. Sans elle, on peut rester devant des pièces éparpillées
       en croyant que c'est l'état final (retour CEO du 18 août 2026). */
    .xc #hero-hint {
      display: flex;
      position: absolute;
      left: 0;
      right: 0;
      bottom: 18px;
      z-index: 2;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: var(--t-menu);
      /* Le script pilote son effacement au fil du rassemblement. */
      opacity: 1;
    }
    /* La flèche : un chevron dessiné en deux filets, qui descend et remonte.
       Trois pixels de course, assez pour désigner un sens, trop peu pour
       attirer l'oeil pendant qu'on lit le titre. */
    .xc #hero-hint i {
      display: block;
      width: 7px;
      height: 7px;
      border-right: 1.4px solid currentColor;
      border-bottom: 1.4px solid currentColor;
      transform: rotate(45deg);
      animation: xcDescendre 1.9s ease-in-out infinite;
    }
    @keyframes xcDescendre {
      0%, 100% { transform: translateY(-1.5px) rotate(45deg); }
      50%      { transform: translateY(1.5px) rotate(45deg); }
    }
    /* Sans mouvement, les points des deux scènes se lisent à la
       suite, tous posés et tous en encre pleine : il n'y a plus de « point en
       cours » quand il n'y a plus de défilement qui le désigne. Sans cette
       règle, le script figerait la scène à son dernier temps et les points non
       encore venus resteraient transparents.

       Une seule déclaration pour les deux scènes, puisqu'elles partagent
       désormais la même grammaire. */
    .xc.anime #zone-verification .fi-arg,
    .xc.anime #zone-parcours .co-arg {
      padding: var(--pad-argument, 11px) 0;
      transform: none;
      transition: none;
    }
    .xc.anime #zone-verification .fi-arg .e,
    .xc.anime #zone-parcours .co-arg .e {
      color: var(--si-ink);
    }
    .xc.anime #zone-verification .fi-vue-zone { min-height: 0; }
    .xc.anime #zone-verification .fi-vue {
      position: static;
      opacity: 1;
      transform: none;
      pointer-events: auto;
      margin-top: 24px;
    }

    /* ── Les écrans de démonstration se lisent tous, à la suite ─────────────
       Les deux scènes montrent plusieurs états du logiciel dans un même
       cadre, en les faisant se relayer : une classe « on » passe de l'un à
       l'autre au fil du défilement, sur une transition d'opacité de 240 ms.

       Dépinglés et remis dans le flux, ces écrans occupent chacun leur place
       dans la page, mais un seul portait encore la classe « on » : les autres
       gardaient leur hauteur en restant invisibles. Mesuré à l'époque : plus de
       500 px de vide entre deux démonstrations.

       Deux déclarations, pas une. L'opacité en « !important » reprend la main sur
       la règle de relais, qui vise la même propriété avec autant de poids ; et
       la transition est coupée, sinon une bascule de « on » arrivant après la
       pose statique relancerait un fondu vers un état qu'on vient de fixer. */
    .xc.anime #zone-verification .fi-vue,
    .xc.anime #zone-parcours .co-vue {
      position: static;
      opacity: 1 !important;
      transform: none !important;
      transition: none;
      pointer-events: auto;
    }

    /* Le parcours suit la même règle : sans mouvement, ses cinq moments sont
       déjà à leur forme finale et le parcours s'affiche en entier. */
    .xc.anime #zone-parcours .co-fin { opacity: 1; }
    .xc.anime #zone-parcours .co-vue-zone { min-height: 0; }
    .xc.anime #zone-parcours .co-vue {
      position: static;
      opacity: 1;
      transform: none;
      pointer-events: auto;
      margin-top: 22px;
    }
    .xc.anime #zone-parcours .co-item,
    .xc.anime #zone-parcours .co-dit { opacity: 1; transform: none; }
    .xc.anime [data-ligne] { opacity: 1; transform: none; }
  }
  /* ═══════════════════════════════════════════════════════════════════════
     TÉLÉPHONE · L'ÉCRAN RÉPOND À LA CARTE
     ═══════════════════════════════════════════════════════════════════════

     Ce bloc vient APRÈS « sans mouvement » et le corrige sur un point. Sans
     mouvement, les trois démonstrations d'un chapitre s'affichent à la suite :
     c'est juste, puisqu'il n'y a plus de défilement pour désigner la bonne.

     Au téléphone il y en a un, et c'est le doigt sur le carrousel. Une seule
     démonstration est donc montrée, celle du point qu'on a devant soi, et
     elle change quand la carte change (décision CEO du 18 août 2026). Les
     trois écrans empilés disaient « voici tout », alors que le chapitre
     raconte « voici ce point, et voici ce qu'il donne à l'écran ».

     La scène garde une hauteur fixe : sans elle, passer d'un écran court à un
     écran long ferait sauter la page sous le doigt pendant le geste. */
  @media (max-width: 860px) and (prefers-reduced-motion: no-preference) {
    .xc.anime #zone-verification .fi-vue,
    .xc.anime #zone-parcours .co-vue {
      position: absolute;
      inset: 0;
      opacity: 0 !important;
      transition: opacity 260ms ease;
      pointer-events: none;
    }
    .xc.anime #zone-verification .fi-vue.on,
    .xc.anime #zone-parcours .co-vue.on {
      opacity: 1 !important;
      pointer-events: auto;
    }
    .xc.anime #zone-verification .fi-vue-zone,
    .xc.anime #zone-parcours .co-vue-zone {
      position: relative;
      min-height: 420px;
    }

    /* ── Le retrait des cartes, repris ici ────────────────────────────────
       Le bloc « sans mouvement » pose un retrait « var(--pad-argument) 0 » sur les
       points, ce qui est juste pour une liste verticale : le retrait
       horizontal y vient de la colonne de la page.

       Dans une carte, ce zéro colle le texte au filet. Et comme ce sélecteur
       est plus spécifique que celui du carrousel, c'est lui qui gagnait :
       « Vos chiffres, en langage clair. » commençait exactement sur la
       bordure, à gauche comme à droite (retour CEO du 18 août 2026).

       Le retrait est donc redonné ici, à spécificité égale et plus bas dans la
       feuille. Trente pixels sur les côtés : le texte respire des deux bords
       au lieu de les toucher. */
    .xc.anime #zone-verification .fi-arg,
    .xc.anime #zone-parcours .co-arg {
      padding: 28px 30px 30px;
    }
  }
`;

/* Le seuil du téléphone. Une seule déclaration pour le script et pour la
   feuille de style : tant qu'il vit à deux endroits, l'un des deux finit par
   dériver et la page se retrouve à mi-chemin entre deux comportements. */
const SEUIL_TELEPHONE = "(max-width: 860px)";

function runExperience(root: HTMLElement): () => void {
  /* Au téléphone, la page suit exactement le chemin de « mouvement réduit ».

     Ce n'est pas une privation, c'est le bon rendu. Le montage cinématique
     suppose une souris qui survole, un grand écran et une course de défilement
     confortable : au pouce, il produisait quinze écrans de défilement, des
     chapitres figés à mi-opacité et des chiffres fantômes. Le chemin statique
     existe déjà, il est complet, chaque chapitre s'y pose à son état final.

     Une seule constante commande donc les deux cas. Ajouter une animation
     plus tard la coupera au téléphone sans qu'on ait à y penser. */
  const PHONE = window.matchMedia(SEUIL_TELEPHONE).matches;
  const REDUCED =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches || PHONE;

  /* Le script est là : on autorise les états de départ masqués. Tant que cette
     classe n'est pas posée, tout le texte s'affiche normalement. */
  root.classList.add("anime");

  /* Les teintes du canevas d'assemblage.

     Elles étaient écrites en dur, et elles portaient l'ancienne direction
     claire verdâtre : les feuilles qui s'assemblent se peignaient en #FBFCFA
     sur une page devenue #EBEDEF, donc l'ouverture était la seule surface du
     site à ne pas suivre la palette (L5, aucune valeur brute).

     Un canevas ne comprend pas une variable CSS : il faut la lui lire. Les
     valeurs sont donc prises sur l'élément racine au montage, une fois, et
     c'est la palette qui décide. Les valeurs de repli ne servent que si le
     style n'est pas encore appliqué. */
  const jetons = getComputedStyle(root);
  const jeton = (nom: string, repli: string) =>
    jetons.getPropertyValue(nom).trim() || repli;
  const encreRgb = jeton("--si-line-ink-rgb", "26 26 26");
  const COL = {
    bg: jeton("--bg", "#EBEDEF"),
    surface: jeton("--surface", "#FFFFFF"),
    line: jeton("--line", "rgb(26 26 26 / 0.11)"),
    /* L'ombre de la fenêtre qui se forme. Elle était teintée forêt, d'une
       époque où l'encre du site l'était aussi. Elle prend l'encre courante. */
    ombre: (a: number) => "rgb(" + encreRgb + " / " + a + ")",
  };

  const $ = (id: string) => root.querySelector<HTMLElement>("#" + id)!;
  const $$ = (sel: string) => Array.prototype.slice.call(root.querySelectorAll(sel)) as HTMLElement[];

  function mulberry32(seed: number) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const phase = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  /* Courbe des apparitions de texte, l'équivalent en script de --doux.
     easeOutCubic démarre à trois fois la vitesse moyenne : l'élément part d'un
     coup dès le premier pixel de défilement, ce qui se lit comme une secousse.
     Celle-ci part de zéro et arrive à zéro, donc le texte s'installe au lieu
     d'être jeté à sa place (décision CEO du 13 août 2026). */
  const fmt = (n: number) =>
    n.toLocaleString("fr-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " $";

  function fitCanvas(canvas: HTMLCanvasElement) {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const r = canvas.getBoundingClientRect();
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
    }
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: r.width, h: r.height };
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ── Scène 1 ── */
  const heroZone = $("zone-hero");
  const heroCanvas = $("hero-canvas") as HTMLCanvasElement;
  const heroShot = $("hero-app");
  const heroCopy = $("hero-copy");
  const heroCaption = $("hero-caption");
  const heroHint = $("hero-hint");

  /* Format du cadre.

     Il était en 16:10 (1000x625). Or la légende occupe le bas de l'écran, donc
     c'est TOUJOURS la hauteur qui borne la taille du cadre, jamais la largeur :
     mesuré sur six résolutions, de 1280x720 à 2560x1440, l'image plafonnait à
     62-64 % de la largeur quel que soit le facteur de largeur demandé.

     En 16:9, à budget vertical identique, la largeur devient la contrainte
     active sur tous les écrans courants et l'image passe à ~88 % de la largeur,
     comme une vraie fenêtre d'application posée sur la page.

     Les facteurs se lisent directement : `frameH = H * 0.78` et, quand la
     largeur borne, `frameW = W * 0.88`. */
  const FRAME_W = 1000;
  const FRAME_H = 563;
  /* ── L'assemblage de la marque ────────────────────────────────────────────
     La scène d'ouverture, et la seule chose de la page qui DÉMONTRE le titre
     au lieu de l'affirmer : des pièces éparpillées se rassemblent en une
     marque, et cette marque devient l'application.

     « L'Assemblage » est fait de deux volumes imbriqués, une pièce gauche et
     une pièce droite. La scène les prend au mot :

       1. LE DÉSORDRE. Une vingtaine de pièces détachées, gauches et droites
          mêlées, dispersées et de travers. Aucune n'est à sa place, et on voit
          bien que ce sont deux pièces différentes qui traînent.
       2. LE RASSEMBLEMENT. Le défilement les ramène toutes vers le centre :
          les gauches sur la gauche du repère, les droites sur sa droite. Les
          vingt pièces se superposent exactement et il n'en reste qu'une de
          chaque. Un seul logo, net, au milieu.
       3. LA RELÈVE. Le logo rejoint le repère de la barre de l'application, en
          rétrécissant jusqu'à sa taille, pendant que l'application apparaît.
          Les pièces deviennent un logo, et ce logo devient le logo du logiciel.

     Elle était réservée au téléphone. Le large jouait autre chose : des
     rectangles pâles qui se rangeaient en tableau de bord. Même idée, autre
     vocabulaire, et la marque n'y apparaissait jamais. Les deux chemins jouent
     donc la même scène depuis le 21 août 2026, et elle n'est écrite qu'une
     fois : seuls changent la taille du logo assemblé, le minutage, et ce qui
     brasse les pièces avant qu'elles ne se rangent.

     Les tracés viennent de safe-mark.ts, seule source des formes du logo
     (CLAUDE.md) : Path2D les accepte tels quels, et le repère vit dans un
     carré de 24, donc une seule mise à l'échelle suffit. */
  const PIECE_A = new Path2D(ASSEMBLY_PIECE_A_PATH);
  const PIECE_B = new Path2D(ASSEMBLY_PIECE_B_PATH);
  /* Repère du dessin : la pièce A occupe la moitié gauche du carré de 24, la
     pièce B la moitié droite. Chacune est ramenée à son propre centre pour
     pouvoir tourner sur elle-même pendant la dérive. */
  const CENTRES = [
    { path: PIECE_A, cx: 8.1, cy: 12, teinte: SAFE_PALETTE.forest },
    { path: PIECE_B, cx: 15.9, cy: 12, teinte: SAFE_PALETTE.emeraude },
  ];

  /* Vingt pièces. Douze remplissaient mal une fenêtre entière une fois les
     pièces réduites ; vingt donnent la sensation d'un tas, ce que le mot
     « désordre » suppose (retour CEO du 18 août 2026). Elles se superposent
     toutes sur deux positions à l'arrivée, donc le logo final reste net quel
     qu'en soit le nombre. */
  const NB_PIECES = 20;
  const rnd = mulberry32(20260725);
  const pieces = Array.from({ length: NB_PIECES }, (_, i) => ({
    type: i % 2,
    sx: rnd(),
    sy: rnd(),
    sr: (rnd() - 0.5) * 2.2,
    /* Une pièce détachée doit se lire comme un fragment, pas comme un panneau
       (retour CEO du 18 août 2026). */
    taille: 0.16 + rnd() * 0.22,
    derive: rnd() * Math.PI * 2,
    /* Profondeur : une pièce proche suit le geste davantage qu'une pièce
       lointaine. C'est ce qui fait le relief plutôt qu'un bloc qui coulisse. */
    fond: 0.4 + rnd() * 0.9,
    retard: (i / NB_PIECES) * 0.34,
    /* Une pièce sur quatre part de la marge gauche, les autres de la bande de
       droite. Ne sert qu'au large, où le titre occupe la colonne du milieu. */
    bord: i % 4 === 0,
    /* Écart accumulé sous la poussée du curseur, et sa vitesse. */
    ox: 0, oy: 0, vx: 0, vy: 0,
  }));

  /* le curseur brasse les pièces tant qu'elles ne sont pas rangées */
  const pointer = { x: -9999, y: -9999, speed: 0 };
  const onPointerMove = (e: PointerEvent) => {
    const r = heroCanvas.getBoundingClientRect();
    const nx = e.clientX - r.left, ny = e.clientY - r.top;
    pointer.speed = Math.min(40, Math.hypot(nx - pointer.x, ny - pointer.y));
    pointer.x = nx; pointer.y = ny;
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  /**
   * Où la relève dépose le logo : le repère de la barre de l'application, celui
   * qui est en haut à gauche de la fenêtre.
   *
   * La cible est MESURÉE sur le vrai élément, pas devinée : le cadrage de la
   * fenêtre peut changer, la marque restera au bon endroit.
   */
  function cibleMarque(W: number, H: number) {
    const repere = heroShot.querySelector<HTMLElement>(".ha-brand .mark");
    const rCadre = heroCanvas.getBoundingClientRect();
    let x = W / 2, y = H * 0.42, cote = 17;
    if (repere) {
      const rr = repere.getBoundingClientRect();
      if (rr.width > 0) {
        x = rr.left - rCadre.left + rr.width / 2;
        y = rr.top - rCadre.top + rr.height / 2;
        cote = rr.width;
      }
    }
    return { x, y, cote };
  }

  type ReglageAssemblage = {
    /** Bornes du rassemblement, en progression de scène. */
    rassemble: [number, number];
    /** Bornes de la relève vers le repère de l'application. */
    releve: [number, number];
    /** Côté du logo une fois rassemblé, en pixels. */
    grand: number;
    /** Inclinaison de l'appareil, de -1 à 1. Zéro au large. */
    roulis?: number;
    /** Le curseur pousse les pièces libres. Vrai au large seulement. */
    curseur?: boolean;
    /** Où la marque se rassemble, en fraction de largeur. 0,5 par défaut.

        Au pouce, le centre est vide : la scène vit sous le texte. Au large, le
        titre tient la moitié gauche, et une marque rassemblée au milieu se
        pose sur sa dernière ligne pendant qu'elle finit de s'effacer. Elle se
        rassemble donc un peu à droite, dans l'espace que les pièces occupaient
        déjà, et sa relève vers le repère de l'application n'en devient que
        plus lisible : elle traverse la fenêtre au lieu d'y tomber. */
    centre?: number;
    /** Les pièces partent des marges au lieu de toute la surface.

        Au pouce, la scène vit sous l'appel à l'action : elle peut occuper
        toute sa fenêtre sans rien recouvrir. Au large, le titre tient la
        colonne du milieu, et des pièces qui lui passent dessus font du
        désordre par-dessus du texte, pas une ouverture (retour CEO du 18 août
        2026, sur le pouce, qui vaut ici aussi). Elles l'encadrent donc : la
        bande de droite, un peu la marge de gauche, jamais la colonne de
        lecture. Elles la traversent seulement pour se rassembler, quand le
        titre a fini de s'effacer. */
    marges?: boolean;
  };

  function dessinerAssemblage(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    p: number,
    temps: number,
    r: ReglageAssemblage
  ) {
    const releve = easeInOut(phase(p, r.releve[0], r.releve[1]));
    /* Une fois la relève terminée, il n'y a plus rien à dessiner : c'est
       l'application qui occupe la place. */
    if (releve >= 1) return;

    const fin = cibleMarque(W, H);
    const cote = lerp(r.grand, fin.cote, releve);
    const cx = lerp(W * (r.centre ?? 0.5), fin.x, releve);
    const cy = lerp(H / 2, fin.y, releve);
    const avance = easeInOut(phase(p, r.rassemble[0], r.rassemble[1]));

    pieces.forEach((pc) => {
      const local = easeOutCubic(phase(avance, pc.retard, 1));
      const d = CENTRES[pc.type];

      /* Dérive : elle s'éteint à mesure que la pièce rejoint sa place. */
      const dx = Math.sin(temps * 0.00042 + pc.derive) * 16 * (1 - local);
      const dy = Math.cos(temps * 0.00034 + pc.derive * 1.7) * 12 * (1 - local);
      /* L'inclinaison, pondérée par la profondeur. Elle s'éteint elle aussi
         une fois la pièce en place : un logo assemblé ne flotte pas au gré du
         poignet. */
      const roulis = (r.roulis ?? 0) * pc.fond * 26 * (1 - local);

      /* Départ dispersé, arrivée sur le repère. Les gauches et les droites
         gardent leur côté : une pièce ne traverse jamais le logo. */
      const etale = r.marges
        ? pc.bord
          ? 0.01 + pc.sx * 0.13
          : 0.66 + pc.sx * 0.33
        : pc.sx * 1.02 - 0.01;
      const x0 = etale * W + dx + roulis;
      const y0 = pc.sy * H * 0.94 + H * 0.03 + dy;
      const x1 = cx + (d.cx - 12) * (cote / 24);
      const y1 = cy + (d.cy - 12) * (cote / 24);

      /* La taille suit le trajet, mais avec du retard.

         Position et taille partageaient la même course : à mi-chemin, une
         pièce était déjà à moitié grandie ET encore à moitié dispersée, donc
         des formes de cent cinquante pixels traversaient la colonne du titre.
         Au pouce ça ne se voyait pas, la scène vit sous le texte ; au large,
         c'est exactement le désordre par-dessus du texte qu'on refuse.

         Là où les marges protègent une colonne de lecture, le fragment reste
         donc petit pendant qu'il voyage et ne prend sa taille que sur la fin,
         quand les vingt pièces sont déjà empilées au centre. On voit des
         fragments se rejoindre, puis une marque apparaître, au lieu de deux
         gestes mélangés. */
      const grossit = r.marges ? easeOutCubic(clamp01((local - 0.42) / 0.58)) : local;
      const ech = lerp(cote * pc.taille, cote, grossit) / 24;
      let x = lerp(x0, x1, local);
      let y = lerp(y0, y1, local);
      let rot = pc.sr * (1 - local);

      const libre = 1 - local;
      if (r.curseur && libre > 0.02) {
        const ex = x + pc.ox - pointer.x;
        const ey = y + pc.oy - pointer.y;
        const dist = Math.hypot(ex, ey);
        const R = 170;
        if (dist < R && dist > 0.001) {
          const force = (1 - dist / R) * (0.9 + pointer.speed * 0.12) * libre;
          pc.vx += (ex / dist) * force * 3.2;
          pc.vy += (ey / dist) * force * 3.2;
        }
        pc.vx *= 0.88; pc.vy *= 0.88;
        pc.ox = (pc.ox + pc.vx) * 0.965;
        pc.oy = (pc.oy + pc.vy) * 0.965;
        x += pc.ox * libre;
        y += pc.oy * libre;
        rot += pc.ox * 0.0022 * libre;
      } else if (r.curseur) {
        pc.ox *= 0.8; pc.oy *= 0.8; pc.vx = 0; pc.vy = 0;
      }

      ctx.save();
      ctx.globalAlpha = lerp(0.5, 1, local) * (1 - releve);
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(ech, ech);
      ctx.translate(-d.cx, -d.cy);
      ctx.fillStyle = d.teinte;
      ctx.fill(d.path);
      ctx.restore();
    });
  }

  function drawHero(p: number, time: number) {
    const f = fitCanvas(heroCanvas);
    const ctx = f.ctx, W = f.w, H = f.h;
    ctx.clearRect(0, 0, W, H);

    /* 88 % de largeur, 78 % de hauteur, la plus contraignante des deux gagne :
       le cadre ne déborde donc jamais. Le 0.78 est calibré pour que son bord
       bas s'arrête au-dessus de #hero-caption (bottom: 5.5vh) — il reste 11 à
       30 px de marge de 1194x670 à 2560x1440. */
    let scale = Math.min(W * 0.88 / FRAME_W, H * 0.78 / FRAME_H);
    if (W < 860) scale = Math.min(W * 0.92 / FRAME_W, H * 0.5 / FRAME_H);
    const frameW = FRAME_W * scale, frameH = FRAME_H * scale;
    const fx = (W - frameW) / 2;
    /* Cadre plus haut qu'avant : la poussée vers le bas passe de 3 % à 1,5 %
       pour conserver la marge sous le bord bas. */
    /* Minutage de la scène.

       L'assemblage occupait la quasi-totalité du défilement : l'application
       n'était entièrement révélée qu'à p = 0.92 et ne devenait cliquable qu'à
       p = 0.95, soit 16vh de défilement avant que l'épinglage ne lâche. On
       voyait donc un tableau de bord fini, on cliquait, rien ne répondait.

       Tout le montage se termine maintenant vers p = 0.58. Le reste de la
       scène, environ 128vh, est une plage de repos : le cadre ne bouge plus,
       et c'est là qu'on se sert du menu. Un décor qui invite au clic doit
       laisser le temps de cliquer. */
    const fy = lerp(H * 0.58, (H - frameH) / 2 + H * 0.015, phase(p, 0.20, 0.52));

    /* Le cadre d'abord, les pièces par-dessus : le logo vient se poser SUR la
       fenêtre, puis rentre dans sa barre. */
    const frameA = phase(p, 0.42, 0.62);
    if (frameA > 0) {
      ctx.save();
      ctx.globalAlpha = frameA;
      ctx.fillStyle = COL.surface;
      ctx.strokeStyle = COL.line;
      roundRect(ctx, fx, fy, frameW, frameH, 14 * scale);
      ctx.shadowColor = COL.ombre(0.28);
      ctx.shadowBlur = 60 * scale;
      ctx.shadowOffsetY = 30 * scale;
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.stroke();
      ctx.restore();
    }

    /* Le minutage du large. Il est plus serré que celui du pouce parce que la
       course est plus longue : le rassemblement se termine quand le titre a
       fini de s'effacer, la relève emmène le logo pendant que l'application
       se pose, et tout est terminé à 0,60. Le reste de la scène est une plage
       de repos où l'on se sert du menu. Un décor qui invite au clic doit
       laisser le temps de cliquer.

       La taille du logo assemblé est bornée par la largeur ET par la hauteur :
       sur un écran large, un logo réglé sur la seule hauteur deviendrait un
       panneau au milieu de la page. */
    dessinerAssemblage(ctx, W, H, p, time, {
      rassemble: [0.14, 0.54],
      releve: [0.54, 0.72],
      grand: Math.min(W * 0.22, H * 0.42),
      curseur: !REDUCED,
      marges: true,
      centre: 0.6,
    });

    /* L'extrait est dessiné dans sa boîte logique 1000x563 puis mis à
       l'échelle : la typographie reste nette au lieu d'être rééchantillonnée
       comme l'était la capture. */
    const shotA = phase(p, 0.56, 0.72);
    heroShot.style.left = fx + "px";
    heroShot.style.top = fy + "px";
    heroShot.style.transform = "scale(" + scale + ")";
    heroShot.style.borderRadius = (14 / scale) + "px";
    heroShot.style.opacity = String(easeInOut(shotA));
    /* Cliquable dès que le fondu est terminé (0.58), pas plus tard : le seuil
       précédent laissait voir une application finie mais inerte. */
    heroShot.classList.toggle("live", p > 0.73);

    const lift = easeInOut(phase(p, 0.14, 0.34));
    /* Le titre s'efface entre 18 et 34 % de la course, soit avant que les
       pièces ne grandissent (elles prennent leur taille à partir de 42 % de
       leur propre trajet, voir dessinerAssemblage). Réglé plus tard, on voyait
       une masse verte posée sur un titre à demi effacé : deux gestes en même
       temps, donc aucun des deux. */
    const copyA = 1 - phase(p, 0.18, 0.34);
    heroCopy.style.transform = "translateY(" + (-lift * 9) + "vh)";
    heroCopy.style.opacity = String(copyA);
    /* Le titre porte désormais une action, donc une zone saisissable. Estompée,
       elle intercepterait les clics destinés au menu de l'application, comme le
       faisait le titre lui-même avant d'être neutralisé. */
    heroCopy.style.visibility = copyA > 0.2 ? "visible" : "hidden";
    heroCaption.style.opacity = String(phase(p, 0.70, 0.78));
    heroCaption.style.transform = "translateY(" + ((1 - phase(p, 0.70, 0.78)) * 12) + "px)";
    heroHint.style.opacity = String(p < 0.04 ? 1 : 0);
  }

  /* Hero sans mouvement.

     La scène du haut est la seule dont l'état final ne contient pas son propre
     texte : à p = 1, le titre a fini de s'estomper pour laisser l'application
     seule à l'écran. Or les autres chapitres sont figés à p = 1 quand les
     animations sont désactivées. Résultat, une personne qui a coché « réduire
     les animations » arrivait sur une page dont le titre, la promesse et
     l'action étaient invisibles.

     Sans mouvement, la scène ne se joue pas : elle se lit. L'assemblage
     disparaît (immobile, ce n'est qu'un tas de rectangles), le titre reste en
     place et l'application se pose dessous, à une échelle qui la garde lisible.
     La zone grandit pour les contenir tous les deux. */
  let assemblageEnCours = false;

  function poserHeroStatique() {
    const pin = heroZone.querySelector<HTMLElement>(".pin")!;
    const W = pin.clientWidth;
    const marge = Math.min(W * 0.06, 84);

    /* Le canevas n'est éteint ici que hors téléphone. Au pouce, c'est
       jouerAssemblage qui le pilote, et cette fonction est rappelée après le
       chargement des polices puis à chaque redimensionnement : elle éteignait
       l'assemblage en pleine course, une demi-seconde après son départ. */
    if (!PHONE) heroCanvas.style.display = "none";
    heroCopy.style.opacity = "1";
    heroCopy.style.transform = "none";
    heroCopy.style.visibility = "visible";

    /* L'application de la première vue est dessinée sur 1000 px de large puis
       ramenée à la largeur disponible. Sur 375 px, le facteur tombe à 0,33 :
       ses libellés se retrouvaient entre 2,7 et 7 px à l'écran. On voyait
       qu'il y avait un logiciel, on ne pouvait rien y lire, et c'est la
       première chose que rencontrait un prospect venu d'un lien.

       Une preuve qu'on ne peut pas lire n'est plus une preuve. Elle est donc
       retirée au téléphone. Les trois écrans des chapitres, eux, se composent
       à la largeur réelle et restent lisibles : la démonstration n'est pas
       perdue, elle est déplacée là où elle tient. */
    if (PHONE) {
      /* La feuille de style tient tout : la fenêtre, le rognage et l'échelle.
         Le script efface donc ce qu'il aurait pu poser en ligne lors d'un
         passage précédent au large, sinon ses valeurs l'emporteraient sur les
         règles du bloc téléphone. */
      heroShot.style.left = "";
      heroShot.style.top = "";
      heroShot.style.transform = "";
      heroShot.style.borderRadius = "";
      heroShot.style.display = "";
      /* L'opacité appartient à l'assemblage tant qu'il tourne. Une fois posée
         à 1 par sa dernière image, elle n'est plus touchée. */
      if (!assemblageEnCours) heroShot.style.opacity = "";
      /* L'application est navigable au doigt comme elle l'est à la souris :
         la légende dit vrai, elle reste. */
      heroShot.classList.add("live");
      heroCaption.style.display = "";
      /* L'indication de défilement appartient à l'assemblage : c'est lui qui
         l'efface quand elle a servi. */
      return;
    }

    const scale = Math.min((W - marge * 2) / FRAME_W, 1);
    const haut = heroCopy.offsetTop + heroCopy.offsetHeight + 52;
    heroShot.style.left = ((W - FRAME_W * scale) / 2) + "px";
    heroShot.style.top = haut + "px";
    heroShot.style.transform = "scale(" + scale + ")";
    heroShot.style.borderRadius = (14 / scale) + "px";
    heroShot.style.opacity = "1";
    heroShot.classList.add("live");

    heroCaption.style.opacity = "1";
    heroCaption.style.transform = "none";
    heroHint.style.opacity = "0";
    pin.style.minHeight = (haut + FRAME_H * scale + 108) + "px";
  }

  /* ── Une seule mécanique pour les deux démonstrations ────────────────────
     La page en gardait trois, écrites trois fois, avec chacune ses bornes,
     son compteur de temps et sa façon de désigner le point courant. Elles
     faisaient toutes la même chose : découper une course de défilement en
     étapes, montrer l'écran de l'étape en cours, et dire lequel des points
     écrits à côté cet écran est en train de prouver.

     C'est donc écrit une fois. Une scène déclare ses étapes dans le balisage
     (`data-etape` pour un point, `data-vue` pour l'écran qui lui répond,
     `data-ligne` pour ce qui se pose ligne à ligne dedans) et la mécanique se
     charge du reste. Ajouter une étape est un ajout de balisage, pas un
     réglage de bornes.

     Ce qui a changé de nature : les points ne sont plus révélés, ils sont
     DÉSIGNÉS. Ils vivent tous à l'écran dès l'arrivée dans la section, et le
     défilement ne fait qu'indiquer lequel des cinq est démontré en ce moment.
     Une page dont le texte n'existe qu'après le geste ne se lit pas, elle se
     mérite. */
  type Scene = {
    /** Pose la scène à l'étape `t`. Appelée par le défilement, et par le doigt
     *  sur le carrousel du téléphone. */
    poser: (t: number) => void;
    /** Joue la scène à la progression `p` (0 à 1) de sa course épinglée. */
    draw: (p: number) => void;
  };

  function sceneEtapes(
    zoneId: string,
    ou: string[],
    pendant?: (t: number, q: number) => void
  ): Scene {
    const zone = $(zoneId);
    const args = $$("#" + zoneId + " [data-etape]");
    const vues = $$("#" + zoneId + " [data-vue]");
    const libelle = zone.querySelector<HTMLElement>("[data-ou]");
    const lignes = vues.map((v) =>
      Array.prototype.slice.call(v.querySelectorAll("[data-ligne]")) as HTMLElement[]
    );
    const n = Math.max(1, vues.length);
    let courant = -1;

    function poser(t: number) {
      const i = t < 0 ? 0 : t > n - 1 ? n - 1 : t;
      if (i === courant) return;
      courant = i;
      args.forEach((el, k) => el.classList.toggle("actif", k === i));
      vues.forEach((el, k) => el.classList.toggle("on", k === i));
      if (libelle) libelle.textContent = ou[i] || "";
      /* Les autres écrans sont posés à leur état complet : on peut y revenir
         par le rail ou en remontant sans qu'ils se rejouent. */
      lignes.forEach((ls, k) => {
        if (k !== i) ls.forEach((el) => el.classList.add("on"));
      });
    }

    function draw(p: number) {
      let t = Math.floor(p * n);
      if (t > n - 1) t = n - 1;
      if (t < 0) t = 0;
      poser(t);
      /* Progression à l'intérieur de l'étape courante : c'est elle qui fait
         entrer les lignes une à une plutôt que d'un bloc. */
      const q = clamp01(p * n - t);
      lignes[t].forEach((el, i) => el.classList.toggle("on", q > 0.05 + i * 0.1));
      if (pendant) pendant(t, q);
    }

    return { poser, draw };
  }

  /* ── Le parcours d'un dossier ──
     Une information entre une fois et traverse le cabinet : l'ouverture monte
     le cartable du domaine, le travail s'y rattache, la facture se prépare
     sans être reconstruite, le paiement se rattache à la facture, et les
     registres suivent. Cinq étapes, cinq états du même dossier.

     Les sections de cartable et leurs sources viennent de
     `lib/dossiers/cartable-templates` : ce sont celles que le produit monte
     réellement à l'ouverture. */
  const parcoursZone = $("zone-parcours");
  const coCartable = $$("#co-cartable .co-item");
  const coDomaineNom = $("co-domaine-nom");
  const coSous = $("co-sous");
  const coCart1 = $("co-cart-1");
  const coCart2 = $("co-cart-2");
  const coCart3 = $("co-cart-3");
  const coCart3s = $("co-cart-3s");

  /* Deux cartables réels. Le second ne sert pas à faire défiler des exemples :
     il montre que ce sont les sections elles-mêmes qui changent avec le
     domaine, pas seulement une étiquette. Le mandat, lui, ne bouge pas : il
     est commun aux deux. */
  const CO_DOMAINES = [
    {
      nom: "Droit de la famille",
      s1: "Pièces Madame (P-)",
      s2: "Pièces Monsieur (D-)",
      s3: "Procédures",
      s3source: "C.p.c. art. 109 et s.",
    },
    {
      nom: "Litige civil",
      s1: "Phase préjudiciaire",
      s2: "Pièces demanderesse (P-)",
      s3: "Pièces défenderesse (D-)",
      s3source: "Règl. Cour Qc art. 13",
    },
  ];
  let coDomaineCourant = -1;

  function poserDomaine(i: number) {
    if (i === coDomaineCourant) return;
    coDomaineCourant = i;
    const d = CO_DOMAINES[i];
    coDomaineNom.textContent = d.nom;
    coCart1.textContent = d.s1;
    coCart2.textContent = d.s2;
    coCart3.textContent = d.s3;
    coCart3s.textContent = d.s3source;
    coSous.textContent =
      i === 0 ? "Cartable monté automatiquement" : "Autre domaine, autre cartable";
  }

  const parcours = sceneEtapes(
    "zone-parcours",
    [
      "Nouveau dossier",
      "Dossier en cours",
      "Facture en préparation",
      "Encaissement",
      "Registres du cabinet",
    ],
    (t, q) => {
      /* Le cartable se monte section par section, puis le domaine bascule : on
         voit d'abord que la structure arrive seule, ensuite qu'elle dépend du
         domaine de pratique. */
      coCartable.forEach((el, i) => el.classList.toggle("on", t > 0 || q > 0.08 + i * 0.11));
      poserDomaine(t === 0 && q > 0.72 ? 1 : 0);
    }
  );

  /* ── Le rapprochement du fidéicommis ──
     Trois preuves, dans l'ordre où elles se démontrent : les trois sources
     portent le même montant, une opération incohérente est refusée avant son
     inscription, une correction s'ajoute sans effacer l'écriture d'origine.

     Les refus affichés ne sont pas écrits pour la vitrine : ce sont les
     messages exacts de `lib/services/fideicommis/errors.ts`. */
  const verificationZone = $("zone-verification");
  const verification = sceneEtapes("zone-verification", [
    "Rapprochement · juin 2026",
    "Retrait · fidéicommis",
    "Journal du dossier · juin 2026",
  ]);

  /* La maquette navigable « fiche client → dossier » a été retirée : la page
     portait deux extraits d'application qui ne se ressemblaient pas, l'un avec
     les vraies données du cabinet, l'autre avec une cliente inventée. La
     section « arrière-boutique » ne montre plus d'écran du tout, donc son
     câblage (data-goto / data-tab) n'a plus d'objet. */

  /* ── Extrait navigable du hero ──────────────────────────────────────────
     Délégation sur des attributs data.
     Deux gestes seulement, ce sont ceux d'une vraie barre de menu :
       - cliquer un menu ouvre ou ferme son tiroir (un seul à la fois) ;
       - cliquer une entrée qui porte un écran bascule le corps. */
  const heroApp = $("hero-app");

  function closeHeroMenus() {
    heroApp.querySelectorAll(".ha-item.open").forEach((el) => {
      el.classList.remove("open");
      el.setAttribute("aria-expanded", "false");
    });
  }

  function showHeroScreen(name: string) {
    heroApp.querySelectorAll("[data-ha-pane]").forEach((pn) =>
      pn.classList.toggle("on", pn.getAttribute("data-ha-pane") === name)
    );
    /* L'onglet actif suit l'écran : « Tableau de bord » se surligne seul, les
       autres écrans vivent sous le menu qui les contient. */
    const parentMenu: Record<string, string> = {
      dash: "dash", clients: "pratique", facturation: "finances", comptes: "finances",
    };
    heroApp.querySelectorAll(".ha-item").forEach((it) =>
      it.classList.toggle("on", it.getAttribute("data-ha-menu") === parentMenu[name])
    );
    closeHeroMenus();
  }

  const onHeroAppClick = (e: Event) => {
    const target = e.target as HTMLElement;

    /* Entrée listée sans écran : on ne fait rien, et surtout on ne laisse pas
       le clic remonter jusqu'au menu, qui refermerait le tiroir sous les doigts
       de quelqu'un en train de le lire. */
    if (target.closest(".ha-drop a.inerte")) { e.preventDefault(); return; }

    // Une entrée de tiroir (ou un bouton d'action) qui porte un écran.
    const toScreen = target.closest("[data-ha-screen]");
    if (toScreen && !toScreen.hasAttribute("data-ha-menu")) {
      e.preventDefault();
      showHeroScreen(toScreen.getAttribute("data-ha-screen")!);
      return;
    }

    // Un menu de la barre.
    const item = target.closest(".ha-item") as HTMLElement | null;
    if (item) {
      e.preventDefault();
      const ouvrable = item.querySelector(".ha-drop");
      if (!ouvrable) {
        const direct = item.getAttribute("data-ha-screen");
        if (direct) showHeroScreen(direct);
        else closeHeroMenus();
        return;
      }
      const etait = item.classList.contains("open");
      closeHeroMenus();
      if (!etait) {
        item.classList.add("open");
        item.setAttribute("aria-expanded", "true");
      }
      return;
    }

    closeHeroMenus();
  };

  const onHeroAppKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") { closeHeroMenus(); return; }
    if (e.key !== "Enter" && e.key !== " ") return;
    const el = (e.target as HTMLElement).closest("[data-ha-screen], .ha-item");
    if (!el) return;
    e.preventDefault();
    onHeroAppClick(e);
  };

  heroApp.addEventListener("click", onHeroAppClick);
  heroApp.addEventListener("keydown", onHeroAppKey);
  /* Cliquer ailleurs dans la page referme le tiroir, comme partout. */
  const onDocClickHero = (e: Event) => {
    if (!heroApp.contains(e.target as Node)) closeHeroMenus();
  };
  document.addEventListener("click", onDocClickHero);

  /* ── Les scènes ───────────────────────────────────────────────────────────
     Le rail ne jalonne que ce qui se démontre : l'ouverture, le parcours d'un
     dossier, la vérification du fidéicommis. Les sections écrites (le
     problème, la suite, l'équipe, l'offre) se lisent d'un bloc et n'ont pas
     d'étape à repérer. */
  const rail = $("rail");
  const railStops: Record<string, HTMLElement> = {
    hero: rail.querySelector('[data-rail="hero"]')!,
    parcours: rail.querySelector('[data-rail="parcours"]')!,
    verification: rail.querySelector('[data-rail="verification"]')!,
  };
  const zones: Record<string, HTMLElement> = {
    hero: heroZone,
    parcours: parcoursZone,
    verification: verificationZone,
  };
  function zoneVisible(el: HTMLElement) {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight * 0.5 && r.bottom > window.innerHeight * 0.5;
  }
  function updateRail() {
    let anyLive = false;
    /* On parcourt les JALONS, pas les zones : toutes les zones n'en ont pas un. */
    Object.keys(railStops).forEach((key) => {
      const live = zoneVisible(zones[key]);
      railStops[key].classList.toggle("live", live);
      /* Le jalon courant se dit aussi, il ne se montre pas seulement : la
         longueur du tiret et sa couleur ne portent pas l'information à elles
         seules (DESIGN_HUMAIN C3). */
      if (live) railStops[key].setAttribute("aria-current", "true");
      else railStops[key].removeAttribute("aria-current");
      if (live) anyLive = true;
    });
    rail.classList.toggle("on", anyLive);
  }

  /* ── Boucle ── */
  const shown: Record<string, number> = { hero: 0, parcours: 0, verification: 0 };
  let rafId = 0;
  let vivante = false;
  /* Images consécutives sans aucune scène proche. La boucle ne s'endort qu'au
     bout de plusieurs, et tout défilement remet le compteur à zéro. Une
     condition instantanée suffisait en théorie, mais l'événement de défilement
     et l'image suivante tombent dans le même tour de boucle : la demande de
     réveil pouvait arriver juste avant l'image qui décidait de dormir, et se
     perdre. La boucle mourait alors au milieu de la page. */
  let repos = 0;

  /* ── La vitesse d'une scène ne dépend plus du poignet ─────────────────────
     Le défilement donnait la progression au pixel, amortie d'un sixième par
     image. Deux défauts, tous deux visibles.

     Le premier : l'amortissement se comptait PAR IMAGE. À 60 Hz une scène
     rattrapait son retard en une quinzaine d'images ; à 120 Hz, en deux fois
     moins de temps. La même page allait donc deux fois plus vite sur un écran
     rapide, ce qui n'est pas une décision de design mais un accident de
     matériel. Le facteur est maintenant ramené à une durée : à 60 comme à 120,
     le rattrapage dure le même temps.

     Le second, et c'est celui qui se voyait : un coup de molette un peu vif
     déplaçait la cible d'un demi-écran, et la scène s'y jetait. On ne voyait
     pas des pièces se rassembler, on voyait un état remplacer un autre. Chaque
     scène a donc une VITESSE MAXIMALE, exprimée en progression par seconde :
     le doigt donne la destination, jamais la vitesse. Qui défile vite arrive
     vite en bas de la zone et regarde la scène finir son geste ; le mouvement
     reste le même pour tout le monde (retour CEO du 21 août 2026).

     L'ouverture est la plus lente des trois : c'est elle qu'on regarde. Les
     deux démonstrations suivent le doigt de plus près, parce qu'un écran qui
     traîne derrière l'étape qu'on lit se lit comme un retard, pas comme un
     glissement. */
  const AMORTI_60 = 0.16;
  /* Le plafond du hero valait 0,4, réglé sur une course de 340 vh. Elle est
     passée à 250 : à 900 px de haut il reste 1350 px, donc un défilement d'un
     écran déplace la progression de 0,67. À 0,4 par seconde, la scène mettait
     1,7 s à rattraper un geste qui en dure trois dixièmes, et l'épinglage
     lâchait pendant qu'elle jouait encore. 0,7 la laisse glisser sans la
     laisser décrocher du doigt (décision CEO du 21 août 2026). */
  const VITESSE: Record<string, number> = { hero: 0.7, parcours: 0.95, verification: 0.95 };

  let dernierTemps = 0;

  function frame(time: number) {
    const vh = window.innerHeight;
    /* Bornée à 50 ms : après un onglet en arrière-plan ou une longue image, le
       delta réel vaut parfois plusieurs secondes, et la scène ferait un bond
       exactement là où on cherche à en éviter un. */
    const dt = dernierTemps ? Math.min(0.05, (time - dernierTemps) / 1000) : 1 / 60;
    dernierTemps = time;
    /* Le même amortissement qu'avant à 60 Hz, exprimé en durée. */
    const amorti = 1 - Math.pow(1 - AMORTI_60, dt * 60);
    const near: Record<string, boolean> = {};
    let proche = false;
    Object.keys(shown).forEach((k) => {
      const r = zones[k].getBoundingClientRect();
      // ne dessiner que les scènes proches du viewport : c'est ce qui garde le défilement fluide
      near[k] = r.bottom > -300 && r.top < vh + 300;
      if (near[k]) proche = true;
      const total = r.height - vh;
      /* Une zone pas encore mise en page mesure zéro. Sans le premier test,
         `total <= 0` la traitait comme une scène plus courte que la vue et la
         posait à sa FIN : au chargement, la démonstration du parcours affichait
         « Registres du cabinet » alors que le visiteur n'y était pas encore, et
         elle le gardait tant qu'il ne s'en approchait pas, puisque les scènes
         lointaines ne sont pas redessinées. */
      const target = r.height <= 0 ? 0 : total <= 0 ? 1 : clamp01(-r.top / total);
      /* Les scènes hors de vue rejoignent leur cible sans lissage. C'est ce qui
         permet d'endormir la boucle sans jamais figer une scène à mi-course :
         au retour, elle est déjà dans le bon état. */
      if (!near[k]) {
        shown[k] = target;
      } else {
        const ecart = target - shown[k];
        let pas = ecart * amorti;
        const plafond = (VITESSE[k] ?? 1) * dt;
        if (pas > plafond) pas = plafond;
        else if (pas < -plafond) pas = -plafond;
        shown[k] += pas;
      }
      if (Math.abs(target - shown[k]) < 0.0005) shown[k] = target;
    });

    if (near.hero) drawHero(shown.hero, time);
    if (near.parcours) parcours.draw(shown.parcours);
    if (near.verification) verification.draw(shown.verification);
    updateRail();

    /* La boucle ne s'arrêtait jamais : six mesures de position par image, pour
       toute la durée de la visite, y compris dans le bas de page (tarifs,
       questions, appel final) où plus rien n'est animé. Elle s'endort quand
       aucune scène n'est restée proche pendant une poignée d'images, et le
       défilement la réveille. La performance est une décision de design
       (DESIGN_HUMAIN M7). */
    repos = proche ? 0 : repos + 1;
    if (repos > 10) { vivante = false; return; }
    rafId = requestAnimationFrame(frame);
  }

  function reveiller() {
    repos = 0;
    if (vivante) return;
    vivante = true;
    rafId = requestAnimationFrame(frame);
  }

  /* Le rail se met à jour même quand la boucle dort : il reste le repère de
     position du lecteur, et une image par événement de défilement suffit. */
  let railPlanifie = false;
  function suivreRail() {
    if (railPlanifie) return;
    railPlanifie = true;
    requestAnimationFrame(() => { railPlanifie = false; updateRail(); });
  }

  /* Sans mouvement, aucune boucle du tout : chaque chapitre est posé une fois à
     son état final. Un nouveau calcul au redimensionnement suffit. */
  function poserStatique() {
    poserHeroStatique();
    parcours.draw(1);
    verification.draw(1);
    updateRail();
  }

  /* ── L'assemblage, au téléphone ─────────────────────────────────────────
     C'est la scène d'ouverture du large : des feuilles éparpillées dérivent,
     puis se rangent et deviennent l'application. Elle dit littéralement ce
     que dit le titre, « SAFE tient votre cabinet ensemble », et c'est la
     seule chose de la page qui le démontre au lieu de l'affirmer.

     Au large, elle est pilotée par 420 vh de défilement épinglé. Ce mécanisme
     ne se transpose pas : au pouce, l'épinglage coûte quatre écrans de course
     pour une scène, et la page en compte déjà assez.

     Elle est donc jouée AU TEMPS. Elle part à l'arrivée dans la vue, dure
     deux secondes deux, et se termine sur l'application posée dans sa
     fenêtre. Une seule fois : on ne rejoue pas une ouverture à chaque
     remontée, ça se lit comme un défaut.

     Les feuilles se rangent exactement là où les blocs de l'application vont
     apparaître. Les cibles sont dans l'espace logique de 1000 px du produit,
     et la fenêtre en montre un fragment : la même transformation que la
     feuille de style applique à l'application est donc appliquée ici, lue
     depuis ses variables pour que les deux ne puissent pas diverger. */
  /* ── L'ouverture du téléphone, en trois états ───────────────────────────
     Le titre dit « SAFE tient votre cabinet ensemble ». L'ouverture le montre,
     et elle le montre avec la marque elle-même plutôt qu'avec des papiers
     anonymes (décision CEO du 18 août 2026).

     « L'Assemblage » est fait de deux volumes imbriqués, une pièce gauche et
     une pièce droite. La scène les prend au mot :

       1. LE DÉSORDRE. Une douzaine de pièces détachées, gauches et droites
          mêlées, dispersées et de travers sous l'appel à l'action. Aucune
          n'est à sa place, et on voit bien que ce sont deux pièces
          différentes qui traînent.
       2. LE RASSEMBLEMENT. Le défilement les ramène toutes vers le centre :
          les gauches sur la gauche du repère, les droites sur sa droite. Les
          douze pièces se superposent exactement et il n'en reste qu'une de
          chaque. Un seul logo, net, au milieu.
       3. LA RELÈVE. Le logo s'efface et l'application prend sa place dans sa
          fenêtre.

     Les tracés viennent de safe-mark.ts, seule source des formes du logo
     (CLAUDE.md) : Path2D les accepte tels quels, et le repère vit dans un
     carré de 24, donc une seule mise à l'échelle suffit.

     Rien de tout cela ne joue derrière le texte : la scène occupe le bas de
     la vue, sous le bouton. Des pièces qui passent derrière un titre, c'est
     du désordre par-dessus du texte, pas une ouverture. */
  function jouerAssemblage() {
    const cadre = root.querySelector<HTMLElement>("#hero-cadre");
    if (!cadre) return () => {};

    let planifie = false;
    let dernierP = -1;
    /* Horodatage de l'image précédente, pour compter l'amortissement en durée
       plutôt qu'en images. */
    let derniereImage = 0;
    /* La progression AFFICHÉE, qui poursuit celle du défilement sans la
       rattraper tout de suite. Voir poser(). */
    let p = 0;

    /* ── Les pièces suivent l'inclinaison du téléphone ───────────────────────
       On penche l'appareil à gauche, les pièces glissent à gauche ; à droite,
       elles suivent. Chacune a sa profondeur, donc elles ne bougent pas du
       même pas : c'est ce décalage qui donne le relief plutôt qu'un bloc qui
       coulisse (demande CEO du 18 août 2026).

       Coût : un écouteur qui ne fait qu'écrire un nombre, et une image
       redessinée seulement quand l'inclinaison a bougé d'un demi-degré et que
       la scène est à l'écran. Rien ne tourne quand le téléphone est posé, ni
       quand on a quitté la première vue. La valeur est lissée à chaque image,
       sinon le bruit du capteur fait vibrer les pièces à l'arrêt.

       iOS demande une permission explicite pour ce capteur, et une permission
       ne se demande que sur un geste. On ne la demande pas : l'effet est un
       agrément, pas un contenu. Là où le capteur répond, il enrichit la
       scène ; ailleurs, personne ne voit qu'il manque quelque chose. */
    let inclinaisonCible = 0;
    let inclinaison = 0;
    let hauteurCopie = 0;
    let hauteurCadre = 0;

    function surInclinaison(e: DeviceOrientationEvent) {
      if (e.gamma == null) return;
      /* gamma vaut le roulis gauche-droite en degrés. Trente degrés suffisent
         à couvrir toute la course : au-delà on ne regarde plus l'écran. */
      const g = Math.max(-30, Math.min(30, e.gamma)) / 30;
      if (Math.abs(g - inclinaisonCible) < 0.017) return;
      inclinaisonCible = g;
      redessiner();
    }

    /* Le pouce joue la même scène que le large, avec trois réglages à lui :
       un logo assemblé plus grand (la fenêtre est étroite, il doit tenir la
       vue), un minutage plus lent (la course de défilement y est plus courte
       mais le geste plus lent), et l'inclinaison de l'appareil à la place du
       curseur. */
    function dessiner(p: number, temps: number) {
      const f = fitCanvas(heroCanvas);
      const ctx = f.ctx, W = f.w, H = f.h;
      ctx.clearRect(0, 0, W, H);
      dessinerAssemblage(ctx, W, H, p, temps, {
        rassemble: [0.02, 0.58],
        releve: [0.44, 0.68],
        grand: Math.min(W * 0.46, H * 0.44),
        roulis: inclinaison,
      });
    }

    function poser() {
      planifie = false;
      const zone = heroZone.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const course = Math.max(1, heroZone.offsetHeight - vh);
      const cible = clamp01(-zone.top / course);

      /* ── La scène traîne derrière le doigt ────────────────────────────────
         La progression suivait le défilement au pixel : un coup de pouce un
         peu vif et les pièces sautaient d'un état à l'autre, ce qui se lit
         comme un saut d'image et non comme un mouvement (retour CEO du
         18 août 2026).

         Elle rejoint maintenant sa cible d'un huitième par image. Le doigt
         donne la destination, la scène met une quinzaine d'images à y arriver,
         et cette inertie est exactement ce qu'on appelle un défilement doux :
         on ne ralentit pas la page, on ralentit ce qu'elle raconte.

         Tant que l'écart n'est pas résorbé, une image de plus est demandée, et
         seulement tant qu'il ne l'est pas : la scène immobile ne coûte rien. */
      let encore = false;
      /* Même bride qu'au large : l'amortissement se compte en durée et la
         progression a une vitesse maximale, pour que la scène glisse au même
         rythme quel que soit l'écran et quelle que soit la vivacité du pouce.
         Le delta est borné à 50 ms, sinon un retour d'arrière-plan ferait
         exactement le bond qu'on cherche à éviter. */
      const maintenant = performance.now();
      const dt = derniereImage ? Math.min(0.05, (maintenant - derniereImage) / 1000) : 1 / 60;
      derniereImage = maintenant;
      const ecartP = cible - p;
      if (Math.abs(ecartP) > 0.0004) {
        const amorti = 1 - Math.pow(1 - 0.125, dt * 60);
        let pas = ecartP * amorti;
        const plafond = 0.4 * dt;
        if (pas > plafond) pas = plafond;
        else if (pas < -plafond) pas = -plafond;
        p += pas;
        encore = true;
      } else {
        p = cible;
      }

      /* Lissage du capteur d'inclinaison, même principe. */
      const ecart = inclinaisonCible - inclinaison;
      if (Math.abs(ecart) > 0.002) {
        inclinaison += ecart * 0.2;
        encore = true;
      } else {
        inclinaison = inclinaisonCible;
      }

      if (!encore && Math.abs(p - dernierP) < 0.0004) return;
      dernierP = p;
      if (encore && !planifie) {
        planifie = true;
        requestAnimationFrame(poser);
      }

      const temps = performance.now();
      const fini = p >= 0.72;

      assemblageEnCours = !fini;
      heroCanvas.style.display = fini ? "none" : "block";
      if (!fini) dessiner(p, temps);

      /* L'application arrive dans la fenêtre pendant que le logo s'efface. */
      /* L'application et sa fenêtre montent pendant que le logo descend vers
         la barre : les deux courses se chevauchent largement, de sorte qu'on
         ne voit jamais ni un logo seul sur du vide, ni une fenêtre vide. */
      heroShot.style.opacity = String(easeInOut(phase(p, 0.44, 0.66)));
      heroShot.classList.toggle("live", fini);
      cadre!.style.setProperty("--cadre-a", String(easeInOut(phase(p, 0.38, 0.62))));

      /* Le texte a dit ce qu'il avait à dire : il s'efface et la fenêtre prend
         la vue, bord bas de l'interface compris. */
      /* Elle a servi dès que le rassemblement commence pour de bon. */
      heroHint.style.opacity = String(1 - phase(p, 0.04, 0.20));

      const ouvre = easeInOut(phase(p, 0.66, 0.84));
      heroCopy.style.opacity = String(1 - ouvre);
      heroCopy.style.transform = "translateY(" + ouvre * -28 + "px)";
      heroCopy.style.pointerEvents = ouvre > 0.6 ? "none" : "";
      /* Le texte ne fait pas que s'effacer, il LIBÈRE SA PLACE.
         Effacé seul, il gardait sa hauteur dans la colonne : la fenêtre
         restait clouée au tiers bas de l'écran et les deux cents pixels du
         titre devenaient une plage grise au-dessus d'elle. On voyait une
         application repoussée en bas d'un vide (retour CEO du 18 août 2026).
         Sa hauteur naturelle est mesurée une fois, au repos, puis rendue à la
         fenêtre au même rythme que l'effacement. */
      if (ouvre <= 0) {
        heroCopy.style.maxHeight = "";
        hauteurCopie = heroCopy.offsetHeight;
      } else if (hauteurCopie > 0) {
        heroCopy.style.overflow = "hidden";
        heroCopy.style.maxHeight = hauteurCopie * (1 - ouvre) + "px";
      }
      /* Tant que le texte est là, la fenêtre garde son retrait sous lui. Une
         fois la place rendue, ses deux marges passent en automatique et elle
         se pose au milieu de la vue au lieu de rester accrochée en haut. */
      cadre!.style.marginTop = ouvre > 0.001 ? "auto" : "22px";

      /* ── Le cadre se règle sur l'application, pas l'inverse ──────────────
         La fenêtre prend toute la vue une fois le texte parti, mais
         l'application ne mesure que 563 px de haut dans son espace logique :
         à 0,72 elle en occupe 405, et les trois cents restants étaient du
         blanc sous un tableau de bord, ce qui se lit comme une capture mal
         détourée.

         Premier essai : agrandir l'application jusqu'à remplir la hauteur.
         Erreur de sens. Agrandir montre MOINS d'application, et la demande
         était d'en voir plus (retour CEO du 18 août 2026).

         C'est donc le cadre qui se referme sur elle. L'échelle ne bouge plus,
         la hauteur de la fenêtre rejoint celle de l'application, et la
         fenêtre se centre dans la vue. Plus de blanc, l'interface est lue à
         la même taille qu'avant, et on voit son bord bas. */
      const hApp = FRAME_H * 0.72;
      if (ouvre <= 0) {
        cadre!.style.flex = "";
        cadre!.style.height = "";
        cadre!.style.marginBottom = "";
        hauteurCadre = cadre!.clientHeight;
      } else if (hauteurCadre > 0) {
        cadre!.style.flex = "none";
        cadre!.style.height = lerp(hauteurCadre, hApp, ouvre) + "px";
        /* Ce que la fenêtre rend est repris en bas, pour qu'elle glisse vers
           le milieu de la vue au lieu de rester collée en haut. */
        cadre!.style.marginBottom = "auto";
      }
    }

    function auDefilement() {
      if (planifie) return;
      planifie = true;
      requestAnimationFrame(poser);
    }

    /* Le redessin dû à l'inclinaison passe par la même porte que celui dû au
       défilement, donc au plus une image par rafraîchissement, et il force le
       recalcul que le garde de progression bloquerait sinon. */
    function redessiner() {
      dernierP = -1;
      auDefilement();
    }

    heroCanvas.style.display = "block";
    heroShot.style.opacity = "0";
    poser();
    window.addEventListener("scroll", auDefilement, { passive: true });
    window.addEventListener("resize", auDefilement);
    window.addEventListener("deviceorientation", surInclinaison, { passive: true });

    return () => {
      assemblageEnCours = false;
      window.removeEventListener("scroll", auDefilement);
      window.removeEventListener("resize", auDefilement);
      window.removeEventListener("deviceorientation", surInclinaison);
    };
  }

  let arreterAssemblage = () => {};

  /* ── Le carrousel commande la démonstration ─────────────────────────────
     Les trois points d'un pilier se lisent en travers, une carte par point.
     La démonstration qui suit ne montre plus les trois écrans à la file : elle
     montre CELUI du point qu'on a devant soi, et elle change quand la carte
     change (décision CEO du 18 août 2026).

     Rien de neuf n'est écrit pour cela. Chaque chapitre possède déjà sa
     fonction de mise en scène, celle que le défilement épinglé appelle au
     large : elle range les points, désigne l'actif, allume le bon écran et
     met à jour le fil d'Ariane du cadre. Le doigt sur le carrousel remplace
     simplement le défilement comme source du numéro.

     L'indice se déduit de la position de course divisée par le pas d'une
     carte, arrondi : c'est l'aimant qui garantit qu'on tombe juste, on n'a
     donc pas à deviner entre deux. */
  function carrouselsTelephone() {
    const listes: Array<[string, (t: number) => void]> = [
      [".co-args", parcours.poser],
      [".fi-args", verification.poser],
    ];
    const nettoyages: Array<() => void> = [];

    listes.forEach(([sel, poser]) => {
      const liste = root.querySelector<HTMLElement>(sel);
      if (!liste) return;
      const cartes = Array.from(liste.children) as HTMLElement[];
      if (!cartes.length) return;

      /* ── Dire qu'on peut pousser ────────────────────────────────────────
         La carte suivante qui dépasse au bord droit le suggère, mais elle le
         suggère seulement : on ne sait pas combien il y en a, ni où l'on en
         est. Une rangée de repères le dit, un par carte, celui du point courant
         allongé. Elle est posée par le script et non écrite dans le balisage :
         le carrousel n'existe qu'au téléphone, ses repères non plus.

         Ils ne sont pas cliquables et sont retirés aux lecteurs d'écran : la
         liste est déjà parcourable au doigt et au clavier, et la position est
         déjà donnée par le numéro de chaque carte. Un repère de plus à
         franchir ne rendrait service à personne. */
      const repères = document.createElement("div");
      repères.className = "arg-points";
      repères.setAttribute("aria-hidden", "true");
      cartes.forEach(() => repères.appendChild(document.createElement("i")));
      liste.insertAdjacentElement("afterend", repères);
      nettoyages.push(() => repères.remove());

      let planifie = false;
      let dernier = -1;

      function lire() {
        planifie = false;
        const pas =
          cartes.length > 1
            ? cartes[1].offsetLeft - cartes[0].offsetLeft
            : liste!.clientWidth;
        if (pas <= 0) return;
        const i = Math.max(0, Math.min(cartes.length - 1, Math.round(liste!.scrollLeft / pas)));
        if (i === dernier) return;
        dernier = i;
        Array.from(repères.children).forEach((r, k) =>
          (r as HTMLElement).classList.toggle("on", k === i)
        );
        poser(i);
      }

      function auDefilement() {
        if (planifie) return;
        planifie = true;
        requestAnimationFrame(lire);
      }

      /* poserStatique est rejouée après le chargement des polices et à chaque
         redimensionnement, et elle repose la scène sur son DERNIER temps. Le
         carrousel doit donc reprendre la main derrière elle, sinon la carte
         montre le point 1 pendant que l'écran montre le point 3. */
      function reprendre() {
        dernier = -1;
        auDefilement();
      }

      lire();
      liste.addEventListener("scroll", auDefilement, { passive: true });
      window.addEventListener("resize", reprendre);
      nettoyages.push(() => {
        liste.removeEventListener("scroll", auDefilement);
        window.removeEventListener("resize", reprendre);
      });
    });

    return () => nettoyages.forEach((f) => f());
  }

  let arreterCarrousels = () => {};

  /* ── L'entrée des textes au téléphone ───────────────────────────────────
     Le défilement piloté est coupé au pouce : la page y est posée d'un coup à
     son état final, et elle arrivait donc entièrement figée. Une page qui ne
     bouge jamais se lit comme un document, pas comme un produit.

     Ce n'est pas le film du large qu'on remet, ce serait vingt écrans de
     course de défilement. C'est la plus petite chose qui donne le sentiment
     que la page répond : chaque bloc de texte monte de douze pixels et prend
     son encre quand il entre dans l'écran, une seule fois. Deux propriétés,
     opacité et translation, les deux seules qui ne demandent aucun recalcul
     de mise en page.

     Le décalage se lit dans l'ordre de lecture : un bloc part 70 ms après son
     voisin du dessus, plafonné à quatre crans pour qu'une liste de six points
     n'attende pas une demi-seconde. */
  function entreeTelephone() {
    const cibles = $$(
      /* Le titre d'ouverture n'est PAS dans cette liste, et c'est délibéré.
         Un bloc marqué ici part à opacité nulle et n'existe qu'une fois
         l'observateur passé. Pour tout ce qui vit sous la ligne de flottaison,
         le risque est nul : on ne le voit qu'après avoir défilé. Pour la
         première vue, il est total : si l'observateur tarde d'une image, la
         page s'ouvre sur un écran vide. La promesse ne se gagne pas au
         défilement. */
      "#hero-cadre, .fi-copy h2, .co-copy h2, .co-intro," +
      " .fi-arg, .co-arg, .co-fin, .fi-stage, .co-stage," +
      /* Un bloc par unité de lecture, jamais deux imbriqués : une phrase déjà
         contenue dans une rangée marquée n'a pas besoin de sa propre entrée. */
      " section.flat .kicker, section.flat h2, section.flat > .inner > .lede," +
      " section.flat .morceau, section.flat .cote p, section.flat .chute," +
      " section.flat .plan, section.flat .note, section.flat .etape," +
      " section.flat .q, section.flat .bloc, section.flat .vue," +
      " section.flat .contexte, #cta > .inner > p, #cta .actions, #cta .reassure"
    );
    if (!cibles.length) return () => {};

    cibles.forEach((el) => el.setAttribute("data-tel-entre", ""));

    const obs = new IntersectionObserver(
      (entrees) => {
        entrees.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          /* Le rang se compte parmi les frères déjà marqués, donc l'ordre de
             lecture, et non l'ordre d'arrivée dans l'observateur. */
          const freres = el.parentElement
            ? Array.from(el.parentElement.children).filter((n) => n.hasAttribute("data-tel-entre"))
            : [el];
          const rang = Math.min(freres.indexOf(el), 3);
          el.style.transitionDelay = rang * 70 + "ms";
          el.setAttribute("data-tel-entre", "vu");
          obs.unobserve(el);
        });
      },
      /* La marge négative en bas retarde le déclenchement de douze pour cent
         de la vue : un bloc qui s'anime alors qu'il touche à peine le bord
         bas se termine avant qu'on l'ait regardé. */
      { rootMargin: "0px 0px -12% 0px", threshold: 0.01 }
    );
    cibles.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }

  let arreterEntree = () => {};

  if (REDUCED) {
    poserStatique();
    /* La hauteur du titre décide de la place de l'application : mesurée avant
       le chargement des polices, elle serait trop courte et les deux se
       chevaucheraient. */
    document.fonts?.ready.then(poserStatique).catch(() => {});
    window.addEventListener("resize", poserStatique);
    window.addEventListener("scroll", suivreRail, { passive: true });
    /* Au téléphone seulement. Quelqu'un qui a demandé moins de mouvement au
       niveau du système garde la page posée, sans aucune entrée. */
    if (PHONE && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.classList.add("tel-anime");
      arreterEntree = entreeTelephone();
      arreterAssemblage = jouerAssemblage();
      arreterCarrousels = carrouselsTelephone();
      /* Derrière la pose statique différée par les polices. */
      document.fonts?.ready.then(() => window.dispatchEvent(new Event("resize"))).catch(() => {});
    }
  } else {
    /* Les deux scènes sont remises à leur première étape avant que la boucle
       ne parte. Sans cela, une visite qui a d'abord été servie en régime
       téléphone — une fenêtre élargie au-delà de 860 px, un écran tourné —
       gardait l'état final posé par le chemin statique : on arrivait sur le
       parcours d'un dossier par sa dernière étape, et rien ne le corrigeait
       tant qu'on ne s'en approchait pas, puisque les scènes lointaines ne sont
       pas redessinées. */
    parcours.poser(0);
    verification.poser(0);
    reveiller();
    window.addEventListener("scroll", reveiller, { passive: true });
    window.addEventListener("resize", reveiller, { passive: true });
  }

  return () => {
    cancelAnimationFrame(rafId);
    arreterEntree();
    arreterAssemblage();
    arreterCarrousels();
    root.classList.remove("anime");
    root.classList.remove("tel-anime");
    /* Les deux chemins peignent en style en ligne. Tant qu'on ne relançait
       jamais la mise en place, les laisser derrière soi était sans effet ;
       depuis qu'un changement de régime relance, ils survivraient au régime
       suivant — un canevas d'assemblage resté en display:none, une application
       figée à la position calculée pour l'autre largeur. On rend chaque élément
       à sa feuille de style. */
    [heroCanvas, heroCopy, heroShot, heroCaption, heroHint].forEach((el) => {
      el.removeAttribute("style");
    });
    heroZone.querySelector<HTMLElement>(".pin")?.style.removeProperty("min-height");
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("scroll", reveiller);
    window.removeEventListener("resize", reveiller);
    window.removeEventListener("resize", poserStatique);
    window.removeEventListener("scroll", suivreRail);
    heroApp.removeEventListener("click", onHeroAppClick);
    heroApp.removeEventListener("keydown", onHeroAppKey);
    document.removeEventListener("click", onDocClickHero);
  };
}

/* ── Routes publiques ─────────────────────────────────────────────────────
   L'application s'appelle SAFE, pas « SAFE Cabinet » (décision CEO du 21 août
   2026, contre la proposition d'architecture du 20). Il n'y a donc pas de
   sous-marque à nommer dans la navigation : une entrée mène à l'application,
   une autre aux outils, et le mot SAFE reste porté par la marque elle-même.

   L'entrée de l'application n'a pas de route à son nom et pointe vers
   `/fonctionnalites`, qui décrit exactement ce qu'elle promet.

   CORRESPONDANCE TEMPORAIRE, à revoir quand la route existera :
     L'application → /fonctionnalites
     Rencontre     → /demo  (la page de contact du site)
*/
const ROUTES = {
  cabinet: "/fonctionnalites",
  outils: "/calculateurs",
  tarification: "/tarification",
  aPropos: "/a-propos",
  connexion: "/connexion",
  evaluation: "/audit-gratuit",
  rencontre: "/demo",
  faq: "/faq",
  conditions: "/conditions",
  confidentialite: "/confidentialite",
};

/* Un seul vocabulaire pour tout le site (2026-08-21).

   Le même écran portait deux noms selon la page d'où l'on venait. Il s'appelle
   SAFE Cabinet, ici comme dans la barre partagée et dans la page À propos :
   c'est le nom tranché par le CEO le 21 août 2026, après deux allers-retours
   dans la même journée, et c'est celui de l'architecture du site. Aucune route
   ne bouge. */
const LIENS_NAV: [string, string][] = [
  [ROUTES.cabinet, "SAFE Cabinet"],
  [ROUTES.outils, "Outils SAFE"],
  [ROUTES.tarification, "Tarification"],
  [ROUTES.aPropos, "À propos"],
];

/* Les cinq registres du problème. Ce ne sont pas cinq fonctionnalités : c'est
   la liste de ce qu'un cabinet tient déjà, ailleurs, séparément. Le libellé de
   droite nomme l'endroit, pas un produit : personne ici ne sait dans quel
   logiciel travaille le cabinet qui lit la page. */
const MORCEAUX: [string, string][] = [
  ["Un dossier est ouvert dans un système.", "Dossiers"],
  ["Le temps est noté ailleurs.", "Feuille de temps"],
  ["Les échéances restent dans un calendrier.", "Calendrier"],
  ["La facture est préparée plus tard.", "Facturation"],
  ["Les paiements, la comptabilité et le fidéicommis sont vérifiés dans d'autres registres.", "Registres"],
];

/* Ce que SAFE Cabinet tient dans un même contexte. Les neuf mots du hero, dans
   le même ordre : la page ne doit pas énumérer deux listes différentes de la
   même chose. */
const CONTEXTE = [
  "Clients",
  "Dossiers",
  "Temps",
  "Facturation",
  "Paiements",
  "Comptabilité",
  "Fidéicommis",
  "Échéances",
  "Rapports",
];

/* Les trois temps de la mise en service. Ils décrivent ce que SAFE fait, pas
   ce que le cabinet doit préparer : c'est la différence entre un
   accompagnement et un mode d'emploi. */
const IMPLANTATION: [string, string, string][] = [
  ["01", "Comprendre votre cabinet", "SAFE relève vos méthodes, vos outils et vos priorités."],
  ["02", "Configurer le bon cadre", "Le système est adapté à votre province, à votre facturation et à votre pratique."],
  ["03", "Commencer avec votre vrai travail", "Vos dossiers et vos données sont préparés avant la mise en service."],
];

const QUESTIONS: [string, string][] = [
  [
    "SAFE remplace-t-il mon logiciel comptable ?",
    "SAFE tient la comptabilité liée aux opérations du cabinet et prépare une information structurée. Le diagnostic permet de déterminer la place que doit conserver votre logiciel comptable actuel.",
  ],
  [
    "SAFE garantit-il la conformité ?",
    "Non. SAFE soutient la tenue, la vérification et la traçabilité. La responsabilité professionnelle demeure celle du cabinet.",
  ],
  [
    "SAFE remplace-t-il mon adjointe ?",
    "Non. SAFE prépare, relie et signale. Votre équipe conserve le jugement, la connaissance du cabinet et la relation avec les clients.",
  ],
  [
    "À qui appartiennent mes données ?",
    "À votre cabinet. Vous conservez la propriété de vos données et pouvez les exporter dans les formats offerts.",
  ],
  [
    "Où sont hébergées les données ?",
    "Les données sont hébergées au Canada. Les accès sont contrôlés selon les rôles et les responsabilités de chaque membre du cabinet.",
  ],
];

/* Les états de départ à opacité nulle ne s'appliquent QUE si le script tourne.
   Sans lui, tout le texte reste lisible : une animation révèle un contenu qui
   serait là de toute façon, elle ne doit jamais être ce qui le fait exister. */
export default function ExperienceCinema() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuOuvert, setMenuOuvert] = useState(false);

  /* Le chemin (animé ou statique) est choisi au montage. Passer la barre des
     860 px en cours de visite — une rotation d'écran, une fenêtre qu'on
     élargit — laissait la page dans le mauvais régime : un téléphone tourné en
     paysage récupérait le montage cinématique, un ordinateur rétréci gardait
     les scènes épinglées sur une colonne. On relance donc la mise en place au
     franchissement du seuil, et à ce moment seulement. */
  const [regime, setRegime] = useState<"large" | "telephone">("large");

  useEffect(() => {
    const mq = window.matchMedia(SEUIL_TELEPHONE);
    const lire = () => setRegime(mq.matches ? "telephone" : "large");
    lire();
    mq.addEventListener("change", lire);
    return () => mq.removeEventListener("change", lire);
  }, []);

  useEffect(() => {
    if (!rootRef.current) return;
    return runExperience(rootRef.current);
  }, [regime]);

  return (
    <>
    <div className="xc" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <nav id="nav">
        <a className="brand" href="#top" aria-label="SAFE, retour au haut de la page">
          <SafeLogo size={20} />
        </a>
        <div className="links">
          {LIENS_NAV.map(([href, label]) => (
            <a key={href} href={href}>{label}</a>
          ))}
        </div>
        {/* Le bouton de menu vit dans le groupe de droite, aux côtés de
            l'action : au téléphone les deux se tiennent ensemble contre le
            bord, au lieu d'être écartés aux deux extrémités de la barre par
            le space-between. */}
        <div className="navright">
          <a className="signin" href={ROUTES.connexion}>Connexion</a>
          <a className="cta" href={ROUTES.evaluation}>Évaluer mon cabinet</a>
          <button
            type="button"
            id="burger"
            aria-label={menuOuvert ? "Fermer la navigation" : "Ouvrir la navigation"}
            aria-expanded={menuOuvert}
            onClick={() => setMenuOuvert((v) => !v)}
          >
            <span className={menuOuvert ? "ouvert" : ""} aria-hidden>
              <i /><i /><i />
            </span>
          </button>
        </div>
      </nav>

      {menuOuvert ? (
        <>
          <button
            type="button"
            id="voile"
            aria-label="Fermer la navigation"
            onClick={() => setMenuOuvert(false)}
          />
          <div id="menu-mobile">
            {/* Contact ne tient pas dans la barre du bureau, où il n'a jamais
                été, mais il est dans le menu du téléphone comme sur les autres
                pages : au pouce, le pied de page est à onze écrans de là. */}
            {[
              ...LIENS_NAV,
              [ROUTES.rencontre, "Contact"] as [string, string],
              [ROUTES.connexion, "Connexion"] as [string, string],
            ].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOuvert(false)}>
                {label}
                <span aria-hidden>›</span>
              </a>
            ))}
          </div>
        </>
      ) : null}

      <nav id="rail" aria-label="Chapitres de la page">
        <a className="stop" data-rail="hero" href="#zone-hero"><span>Assembler</span><i aria-hidden /></a>
        <a className="stop" data-rail="parcours" href="#zone-parcours"><span>Parcours</span><i aria-hidden /></a>
        <a className="stop" data-rail="verification" href="#zone-verification"><span>Vérification</span><i aria-hidden /></a>
      </nav>

      {/* ── 01 · L'ouverture ────────────────────────────────────────────────
         L'assemblage débouche sur l'application elle-même, navigable, et non
         sur une capture figée. Position et échelle pilotées au pixel par le
         canvas (drawHero).

         Le titre nomme les neuf postes que SAFE relie : la comptabilité, la
         facturation et l'administration se lisent donc dans la première vue,
         sans attendre que l'application se pose. */}
      <div className="pinzone" id="zone-hero">
        <div className="pin" id="top">
          <div id="hero-cadre">
            <canvas id="hero-canvas" />
            <HeroLiveApp />
          </div>
          <div id="hero-copy">
            <p className="kicker">La suite administrative des cabinets d&apos;avocats</p>
            <h1>SAFE tient votre cabinet <em>ensemble.</em></h1>
            <p className="lede">
              SAFE relie l&apos;administration, les dossiers, le temps, la facturation, les
              paiements, la comptabilité, le fidéicommis, les échéances et les rapports dans un
              même système.
            </p>
            <p className="lede lede-suite">
              Vous voyez ce qui est à jour, ce qui attend et ce qui demande votre attention.
            </p>
            <div className="hero-actions">
              <a className="btn" href={ROUTES.evaluation}>Évaluer mon cabinet</a>
              <a className="hero-second" href="#suite">
                Découvrir la suite SAFE<i aria-hidden />
              </a>
            </div>
            <p className="hero-reassure">
              Conçu au Québec. Adapté au Québec et à l&apos;Ontario. Données hébergées au Canada.
            </p>
          </div>
          {/* La légende ne dit pas « capture réelle » : le cadre contient
             l'application elle-même. Annoncer une image quand on peut cliquer
             dedans priverait le visiteur du geste. */}
          <p id="hero-caption">
            SAFE, en vrai. Ouvrez un menu et circulez : c&apos;est l&apos;application, pas une capture.
          </p>
          <p id="hero-hint">
            Faites défiler vers le bas
            <i aria-hidden />
          </p>
        </div>
      </div>

      {/* ── 02 · Le problème administratif ──────────────────────────────────
         Pas d'écran ici, et c'est voulu : la section parle de ce qui se passe
         AILLEURS que dans un logiciel. Montrer une interface à cet endroit
         reviendrait à répondre avant d'avoir posé la question.

         Les cinq lignes ne sont pas des fonctionnalités manquantes : c'est la
         liste de ce que le cabinet tient déjà, séparément. */}
      <section className="flat surface" id="probleme">
        <div className="inner">
          <p className="kicker">L&apos;administration s&apos;est construite par morceaux</p>
          <h2>Trop de tâches reposent encore sur la mémoire de l&apos;équipe.</h2>

          <div className="deux-colonnes">
            <div className="morceaux">
              {MORCEAUX.map(([texte, ou], i) => (
                <div className="morceau" key={ou}>
                  <span className="n" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                  <p className="t">{texte}</p>
                  <span className="ou">{ou}</span>
                </div>
              ))}
            </div>
            <div className="cote">
              <p>
                L&apos;information existe, mais elle reste dispersée. L&apos;équipe doit
                continuellement chercher, vérifier et ressaisir ce qui s&apos;est passé.
              </p>
              <p className="chute">
                Le problème n&apos;est pas le manque d&apos;effort. C&apos;est l&apos;absence de
                contexte partagé.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 03 · Le changement ──────────────────────────────────────────────
         Surtout pas cinq cartes côte à côte. Une seule information entre dans
         le système et le traverse : l'heure de consultation devient ligne de
         facture, puis paiement, puis écriture, puis chiffre de rapport. La
         continuité se voit au lieu de se lire.

         La chaîne de montants se vérifie : 675,00 $ d'honoraires, TPS 5 % et
         TVQ 9,975 % (les taux qu'applique `lib/invoice-calculations.ts`), plus
         195,00 $ de débours non taxables, soit 971,08 $ encaissés. */}
      <div className="pinzone" id="zone-parcours">
        <div className="pin co-pin">
          <div className="co-grid">
            {/* La démonstration passe à gauche : on suit un dossier, donc on le
                voit avancer avant de lire ce qu'on en conclut. */}
            <div className="co-stage">
              <div className="co-ecran">
                <p className="co-ou" data-ou>Nouveau dossier</p>

                <div className="co-vue-zone">
                  <div className="co-vue on" data-vue="0">
                    <p className="co-domaine">
                      <span className="lb">Domaine de pratique</span>
                      <span className="vl" id="co-domaine-nom">Droit de la famille</span>
                    </p>
                    <p className="co-sous" id="co-sous">Cartable monté automatiquement</p>
                    <div className="co-liste" id="co-cartable">
                      <div className="co-item">
                        <span className="t">Mandat et engagement</span>
                        <span className="s">RCNEPA art. 15-16</span>
                      </div>
                      <div className="co-item">
                        <span className="t" id="co-cart-1">Pièces Madame (P-)</span>
                        <span className="s">Règl. Cour Qc art. 13</span>
                      </div>
                      <div className="co-item">
                        <span className="t" id="co-cart-2">Pièces Monsieur (D-)</span>
                        <span className="s">Règl. Cour Qc art. 13</span>
                      </div>
                      <div className="co-item">
                        <span className="t" id="co-cart-3">Procédures</span>
                        <span className="s" id="co-cart-3s">C.p.c. art. 109 et s.</span>
                      </div>
                    </div>
                  </div>

                  <div className="co-vue" data-vue="1">
                    <p className="co-sous">Dossier Pelletier · 2026-002</p>
                    <div className="co-liste">
                      <div className="co-item" data-ligne>
                        <span className="t">Échéance inscrite</span>
                        <span className="s">Protocole de l&apos;instance · 12 juin</span>
                      </div>
                      <div className="co-item" data-ligne>
                        <span className="t">Temps consigné</span>
                        <span className="s">Consultation · 1 h 30 à 450,00 $ l&apos;heure</span>
                        <span className="m">675,00 $</span>
                      </div>
                      <div className="co-item" data-ligne>
                        <span className="t">Document déposé</span>
                        <span className="s">Pièce P-4 · rangée au cartable</span>
                      </div>
                      <div className="co-item" data-ligne>
                        <span className="t">Débours inscrit</span>
                        <span className="s">Frais de greffe · non taxable</span>
                        <span className="m">195,00 $</span>
                      </div>
                    </div>
                  </div>

                  <div className="co-vue" data-vue="2">
                    <p className="co-sous">Facture 2026-031 · préparée depuis le dossier</p>
                    <div className="co-liste">
                      <div className="co-item" data-ligne>
                        <span className="t">Honoraires</span>
                        <span className="s">Reprise du temps consigné, sans ressaisie</span>
                        <span className="m">675,00 $</span>
                      </div>
                      <div className="co-item" data-ligne>
                        <span className="t">TPS</span>
                        <span className="s">5 %</span>
                        <span className="m">33,75 $</span>
                      </div>
                      <div className="co-item" data-ligne>
                        <span className="t">TVQ</span>
                        <span className="s">9,975 %</span>
                        <span className="m">67,33 $</span>
                      </div>
                      <div className="co-item" data-ligne>
                        <span className="t">Débours</span>
                        <span className="s">Frais de greffe</span>
                        <span className="m">195,00 $</span>
                      </div>
                      <div className="co-item total" data-ligne>
                        <span className="t">Total de la facture</span>
                        <span className="m">971,08 $</span>
                      </div>
                    </div>
                  </div>

                  <div className="co-vue" data-vue="3">
                    <p className="co-sous">Paiement rattaché à la facture 2026-031</p>
                    <div className="co-liste">
                      <div className="co-item" data-ligne>
                        <span className="t">Paiement reçu</span>
                        <span className="s">Virement Interac · dossier 2026-002</span>
                        <span className="m">971,08 $</span>
                      </div>
                      <div className="co-item" data-ligne>
                        <span className="t">Solde de la facture</span>
                        <span className="s">Réglée</span>
                        <span className="m">0,00 $</span>
                      </div>
                      <div className="co-item" data-ligne>
                        <span className="t">Revenu d&apos;honoraires</span>
                        <span className="s">Écriture datée, rattachée au dossier</span>
                        <span className="m">675,00 $</span>
                      </div>
                      <div className="co-item" data-ligne>
                        <span className="t">Taxes à remettre</span>
                        <span className="s">TPS et TVQ perçues, jamais du revenu</span>
                        <span className="m">101,08 $</span>
                      </div>
                    </div>
                  </div>

                  <div className="co-vue" data-vue="4">
                    <p className="co-sous">Ce que le dossier laisse aux registres</p>
                    <div className="co-liste">
                      <div className="co-item" data-ligne>
                        <span className="t">Journal du dossier</span>
                        <span className="s">Chaque opération, datée et attribuée</span>
                      </div>
                      <div className="co-item" data-ligne>
                        <span className="t">Grand livre</span>
                        <span className="s">Écritures en ajout seul</span>
                      </div>
                      <div className="co-item" data-ligne>
                        <span className="t">Fidéicommis</span>
                        <span className="s">Registre et rapprochement du mois</span>
                      </div>
                      <div className="co-item" data-ligne>
                        <span className="t">Rapports du cabinet</span>
                        <span className="s">Revenus, taxes et créances à jour</span>
                      </div>
                    </div>
                    <p className="co-dit">
                      <span className="marque" aria-hidden>✓</span>
                      Le dossier peut se fermer. Les registres n&apos;ont rien à rattraper.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="co-copy">
              <p className="kicker">Une information entre. Le travail avance.</p>
              <h2>Saisi une fois. Utilisé jusqu&apos;à la fermeture du dossier.</h2>

              <div className="co-narration">
                <ol className="co-args">
                  <li className="co-arg actif" data-etape="0">
                    <span className="n" aria-hidden>01</span>
                    <p className="e">Ouvrir le dossier</p>
                    <p className="d">
                      SAFE prépare un cadre adapté au domaine de pratique, avec les
                      renseignements, les sections et les suivis nécessaires.
                    </p>
                  </li>
                  <li className="co-arg" data-etape="1">
                    <span className="n" aria-hidden>02</span>
                    <p className="e">Faire avancer le travail</p>
                    <p className="d">
                      Le temps, les débours, les documents et les échéances se rattachent au même
                      dossier au fil du travail.
                    </p>
                  </li>
                  <li className="co-arg" data-etape="2">
                    <span className="n" aria-hidden>03</span>
                    <p className="e">Préparer la facturation</p>
                    <p className="d">
                      Le travail déjà consigné devient une facture sans devoir être reconstruit
                      dans un autre système.
                    </p>
                  </li>
                  <li className="co-arg" data-etape="3">
                    <span className="n" aria-hidden>04</span>
                    <p className="e">Encaisser et comptabiliser</p>
                    <p className="d">
                      Les paiements se rattachent aux bonnes factures. Les revenus, les taxes et
                      les mouvements comptables restent reliés aux opérations qui les ont produits.
                    </p>
                  </li>
                  <li className="co-arg" data-etape="4">
                    <span className="n" aria-hidden>05</span>
                    <p className="e">Tenir les registres à jour</p>
                    <p className="d">
                      Le fidéicommis, les rapprochements et les rapports conservent le contexte du
                      client et du dossier.
                    </p>
                  </li>
                </ol>
                <p className="co-fin">
                  Moins de ressaisie. Moins de recherche. Une lecture plus claire de ce qui se
                  passe dans le cabinet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 04 · La suite ───────────────────────────────────────────────────
         Trois blocs de poids différents, pas trois cartes à icônes. SAFE
         Cabinet occupe la largeur et porte la liste de ce qu'il tient ; les
         outils et l'accompagnement se partagent la rangée du dessous, à un
         cran plus bas.

         Les outils : un seul est publié, et c'est le seul qui est nommé. Un
         catalogue annoncé avant d'exister est une promesse qu'on ne peut pas
         tenir le jour où quelqu'un clique. */}
      <section className="flat" id="suite">
        <div className="inner">
          <p className="kicker">Une suite qui évolue avec la pratique</p>
          <h2>Un système central. Des outils pour les tâches qui peuvent être simplifiées.</h2>

          <div className="bloc bloc-maitre">
            <div className="bloc-texte">
              <p className="rang">SAFE Cabinet</p>
              <h3>Le travail quotidien, dans un même système</h3>
              <p>
                Clients, dossiers, temps, facturation, paiements, comptabilité, fidéicommis,
                échéances et rapports partagent le même contexte.
              </p>
              <a className="more" href={ROUTES.cabinet}>Découvrir SAFE Cabinet →</a>
            </div>
            <ul className="contexte">
              {CONTEXTE.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>

          <div className="deux-blocs">
            <div className="bloc">
              <p className="rang">Outils SAFE</p>
              <h3>Un outil précis pour une tâche précise</h3>
              <p>
                Calculateurs, vérificateurs et générateurs spécialisés simplifient certaines
                tâches sans exiger l&apos;adoption de toute l&apos;application.
              </p>
              <p className="detail">
                Le premier est publié : le partage du patrimoine familial, calculé article par
                article.
              </p>
              <a className="more" href={ROUTES.outils}>Découvrir les outils SAFE →</a>
            </div>
            <div className="bloc">
              <p className="rang">Accompagnement SAFE</p>
              <h3>Une implantation adaptée au cabinet</h3>
              <p>
                SAFE analyse vos méthodes actuelles, configure le système et vous aide à
                commencer avec vos vrais dossiers et vos vraies données.
              </p>
              <a className="more" href={ROUTES.evaluation}>Évaluer mon cabinet →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 05 · La preuve distinctive ──────────────────────────────────────
         Section blanche et éditoriale. Aucune carte, aucun cadre, aucun filet
         décoratif : la hiérarchie tient à la typographie, à l'espace et au
         contraste.

         Les refus affichés ne sont pas inventés pour la vitrine : ce sont les
         messages exacts de `lib/services/fideicommis/errors.ts`. */}
      <div className="pinzone" id="zone-verification">
        <div className="pin fi-pin">
          <div className="fi-grid">
            <div className="fi-copy">
              <p className="kicker">Relier ne suffit pas</p>
              <h2>SAFE vérifie aussi ce qui doit concorder.</h2>
              <p className="fi-intro">
                SAFE conserve le lien entre le travail juridique, la facturation, les paiements et
                les écritures comptables. Pour le fidéicommis, il compare le solde bancaire, le
                registre et les soldes détenus pour chaque dossier.
              </p>

              <div className="fi-narration">
                <ol className="fi-args">
                  <li className="fi-arg actif" data-etape="0">
                    <span className="n" aria-hidden>01</span>
                    <p className="e">Trois sources, un même montant</p>
                    <p className="d">
                      Le relevé bancaire, le registre du fidéicommis et les soldes par dossier
                      sont rapprochés dans une même vue.
                    </p>
                  </li>
                  <li className="fi-arg" data-etape="1">
                    <span className="n" aria-hidden>02</span>
                    <p className="e">Les incohérences sont arrêtées</p>
                    <p className="d">
                      Un retrait supérieur au solde détenu pour un dossier est refusé avant son
                      inscription.
                    </p>
                  </li>
                  <li className="fi-arg" data-etape="2">
                    <span className="n" aria-hidden>03</span>
                    <p className="e">Chaque correction laisse une trace</p>
                    <p className="d">
                      L&apos;écriture d&apos;origine demeure au journal. La correction
                      s&apos;ajoute, datée et attribuée.
                    </p>
                  </li>
                </ol>
                <p className="fi-precision">
                  SAFE soutient la tenue, la vérification et la traçabilité. La responsabilité
                  professionnelle demeure celle du cabinet.
                </p>
              </div>
            </div>

            {/* La démonstration. Seule surface de la section : elle représente
                un vrai écran, donc elle a droit à une profondeur très légère,
                portée par la teinte du canevas plutôt que par une bordure. */}
            <div className="fi-stage">
              <div className="fi-ecran">
                <p className="fi-ou" data-ou>Rapprochement · juin 2026</p>

                <div className="fi-vue-zone">
                  <div className="fi-vue on" data-vue="0">
                    <div className="fi-src" data-ligne>
                      <span className="l">Solde bancaire</span>
                      <span className="m">21 000,00 $</span>
                    </div>
                    <div className="fi-src" data-ligne>
                      <span className="l">Registre du fidéicommis</span>
                      <span className="m">21 000,00 $</span>
                    </div>
                    <div className="fi-src" data-ligne>
                      <span className="l">Soldes par dossier</span>
                      <span className="m">21 000,00 $</span>
                    </div>
                    <p className="fi-dit" data-ligne>
                      Trois sources, un seul montant. La certification peut être produite.
                    </p>
                  </div>

                  <div className="fi-vue" data-vue="1">
                    <p className="fi-op">Retrait demandé · dossier <span className="ref">2026-011</span></p>
                    <div className="fi-src" data-ligne>
                      <span className="l">Montant du retrait</span>
                      <span className="m">1 200,00 $</span>
                    </div>
                    <div className="fi-src" data-ligne>
                      <span className="l">Solde détenu pour ce dossier</span>
                      <span className="m">850,00 $</span>
                    </div>
                    <p className="fi-refus" data-ligne>
                      Solde en fidéicommis insuffisant pour ce dossier. Un retrait ne peut jamais
                      dépasser le solde détenu pour ce dossier.
                    </p>
                  </div>

                  <div className="fi-vue" data-vue="2">
                    <div className="fi-temps" data-temps="0" data-ligne>
                      <span className="h">14 juin · 09 h 12</span>
                      <span className="t">Écart constaté sur le dossier <span className="ref">2026-011</span></span>
                      <span className="m">− 500,00 $</span>
                    </div>
                    <div className="fi-temps" data-temps="1" data-ligne>
                      <span className="h">14 juin · 09 h 41</span>
                      <span className="t">Écriture de correction · dossier <span className="ref">2026-011</span></span>
                      <span className="m vert">+ 500,00 $</span>
                    </div>
                    <p className="fi-dit" data-ligne>
                      L&apos;écriture d&apos;origine reste au journal. La correction s&apos;ajoute
                      en dessous, datée et attribuée.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 06 · L'équipe ───────────────────────────────────────────────────
         Deux points de vue, jamais un seul : c'est l'adjointe qui tient le
         cabinet en mouvement et l'avocate qui décide. La composition change
         volontairement de celle de la suite : ici deux colonnes de même poids,
         séparées par un filet, sous une phrase qui les tient ensemble. */}
      <section className="flat surface" id="equipe">
        <div className="inner">
          <p className="kicker">Conçu autour du travail réel</p>
          <h2>SAFE soutient l&apos;équipe qui tient le cabinet en mouvement.</h2>
          <p className="lede">
            L&apos;adjointe conserve la connaissance du cabinet. L&apos;avocate conserve le
            jugement professionnel. SAFE prépare, relie et signale pour que
            l&apos;administration ne repose plus uniquement sur leur mémoire.
          </p>

          <div className="deux-vues">
            <div className="vue">
              <p className="rang">Pour l&apos;équipe administrative</p>
              <p>
                Moins de ressaisie, de recherche et de suivis invisibles. Le travail à accomplir
                reste visible dans son contexte.
              </p>
            </div>
            <div className="vue">
              <p className="rang">Pour l&apos;avocate</p>
              <p>
                Une lecture claire des montants, des échéances et des décisions qui demandent son
                attention.
              </p>
            </div>
          </div>

          <p className="chute">
            SAFE ne remplace pas l&apos;équipe. Il lui donne un système commun pour travailler.
          </p>
        </div>
      </section>

      {/* ── 07 · L'offre ────────────────────────────────────────────────────
         Les prix viennent de `lib/tarification.ts`, seule source du site. Le
         palier Cabinet vaut 149,99 $ et non 149 $ : c'est ce que Stripe
         facture réellement, et un prix arrondi sur la vitrine deviendrait un
         écart à la première facture. */}
      <section className="flat" id="tarifs">
        <div className="inner">
          <div className="head">
            <p className="kicker">Une implantation accompagnée</p>
            <h2>Simple dès le départ. Adapté avant la mise en service.</h2>
          </div>
          <div className="plan">
            <div>
              <p className="name">Solo</p>
              <p className="detail">
                Pour une pratique individuelle qui veut relier son administration, sa facturation,
                sa comptabilité et son fidéicommis.
              </p>
            </div>
            <p className="price">{prixFr(TARIFICATION.paliers.solo.prix)} $<small>/ mois</small></p>
          </div>
          <div className="plan">
            <div>
              <p className="name">Cabinet</p>
              <p className="detail">
                Pour une petite équipe qui partage les dossiers, les suivis et les responsabilités
                administratives.
              </p>
            </div>
            <p className="price">{prixFr(TARIFICATION.paliers.cabinet.prix)} $<small>/ mois</small></p>
          </div>
          <p className="note">
            Configuration initiale comprise. Prix en dollars canadiens, taxes en sus.
          </p>

          <div className="etapes">
            {IMPLANTATION.map(([n, titre, texte]) => (
              <div className="etape" key={n}>
                <span className="n" aria-hidden>{n}</span>
                <p className="t">{titre}</p>
                <p className="d">{texte}</p>
              </div>
            ))}
          </div>

          <div className="actions">
            <a className="btn" href={ROUTES.evaluation}>Évaluer mon cabinet</a>
            <a className="btn ghost" href={ROUTES.tarification}>Voir la tarification complète</a>
          </div>
        </div>
      </section>

      {/* ── 08 · Les questions ──────────────────────────────────────────── */}
      <section className="flat surface" id="questions">
        <div className="inner">
          <p className="kicker">Avant de nous parler</p>
          <h2>Des réponses précises aux questions importantes.</h2>
          <div className="liste-q">
            {QUESTIONS.map(([q, r]) => (
              <div className="q" key={q}>
                <h3>{q}</h3>
                <p>{r}</p>
              </div>
            ))}
          </div>
          <a className="more" href={ROUTES.faq}>Lire toutes les questions →</a>
        </div>
      </section>

      {/* ── 09 · La prochaine étape ─────────────────────────────────────── */}
      <section className="flat" id="cta">
        <div className="inner">
          <p className="kicker">La prochaine étape</p>
          <h2>Voyons ce que SAFE pourrait simplifier dans votre cabinet.</h2>
          <p>
            Commencez par une évaluation de votre organisation administrative. SAFE relève les
            tâches répétitives, les informations dispersées et les points qui demandent une
            meilleure visibilité.
          </p>
          <div className="actions">
            <a className="btn" href={ROUTES.evaluation}>Évaluer mon cabinet</a>
            <a className="btn ghost" href={ROUTES.rencontre}>Réserver une rencontre</a>
          </div>
          <p className="reassure">Gratuit, sans carte de crédit. Rapport sous 24 heures.</p>
          {/* La mention vivait dans le pied de page de l'accueil. Elle concerne
              cette page, pas le site : elle rejoint donc la fin du récit, à la
              place exacte qu'elle occupe sur Fonctionnalités et sur À propos. */}
          <p className="mention-maquettes">
            Les écrans de cette page sont des maquettes, sur des données de démonstration. Elles
            reproduisent l’interface de SAFE sans être le logiciel.
          </p>
        </div>
      </section>

    </div>

      {/* Hors de .xc : la feuille injectée de l'accueil ne doit rien peindre
          dans un composant partagé par tout le site. */}
      <Footer />
    </>
  );
}
