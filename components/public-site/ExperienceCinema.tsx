"use client";

/**
 * Expérience cinématique de la page d'accueil.
 * Port React du prototype public/experience-cinema.html (journal 2026-07-25).
 * Scroll piloté : assemblage → vraie capture, rapprochement, facture, Navette.
 * Maquette navigable (fiche client → dossier) et brassage des papiers au curseur.
 */

import { useEffect, useRef, useState } from "react";
import { SafeLogo, SafeMark } from "@/components/branding/SafeLogo";
import {
  ASSEMBLY_PIECE_A_PATH,
  ASSEMBLY_PIECE_B_PATH,
  SAFE_PALETTE,
} from "@/components/brand/safe-mark";
import { HeroLiveApp } from "@/components/public-site/HeroLiveApp";

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
       et six bords gauches pour huit titres de section. « Simple » commençait
       à 84 px, « Fiable » à 140 px. La cause n'était pas une faute de valeur
       mais une différence de structure : les pins de « Fiable » et « Complet »
       centraient une grille de 1160 px dans une boîte de 1272, ce qui ajoutait
       56 px à gauche, quand « Simple » posait son contenu à même le retrait.

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
    --t-marque: clamp(34px, 4.4vw, 56px);    /* Simple, Fiable, Complet, et tout titre de section */
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

  /* ── Une seule voix pour tout ce qui se lit ────────────────────────────────
     Le titre d'ouverture était en Instrument Serif et la prose autour retombait
     sur Geist : le chapeau du hero, l'intro de « Complet », la justification de
     chaque point numéroté, la conclusion, les forfaits, les réponses. La page
     changeait donc de voix d'une ligne à l'autre sans qu'aucune règle ne le
     décide (décision CEO du 13 août 2026).

     Depuis, tout ce qui relève du discours porte la serif. La famille reste
     déclarée règle par règle plutôt qu'imposée par un sélecteur global : c'est
     la seule façon de ne pas la faire déborder sur les deux registres qui ne
     sont pas du discours.

     1. L'interface du site. Barre de navigation, boutons, pied de page. Une
        action n'est pas une phrase, et le référentiel l'interdit explicitement
        (SAFE_PREMIUM_DESIGN_STANDARD §2.3 : jamais de serif dans un bouton).
     2. Les maquettes de l'application (#hero-app, .em-fenetre, .fi-ecran,
        .co-ecran). Elles montrent SAFE tel qu'il est, donc elles suivent la
        typographie de l'application et non celle de la vitrine : Geist pour
        les libellés, mono pour les chiffres, la serif réservée au seul titre
        d'écran (SAFE_PREMIUM_DESIGN_STANDARD §2.3). Les passer en serif, ce
        serait montrer un produit qui n'existe pas. */

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

  .xc #zone-hero { height: 420vh; }
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
  .xc #hero-copy {
    position: absolute;
    left: 0; right: 0;
    top: 17vh;
    padding-inline: max(var(--gouttiere), (100% - var(--page)) / 2);
    max-width: var(--page);
    margin: 0 auto;
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
  .xc #hero-copy p.lede {
    margin-top: 30px;
    margin-left: 6px;
    max-width: 49ch;
    font-family: var(--serif);
    font-size: var(--t-corps);
    line-height: 1.62;
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
  .xc #hero-copy .hero-reassure {
    margin-top: 16px;
    margin-left: 6px;
    font-family: var(--serif);
    font-size: var(--t-detail);
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
    font-family: var(--serif);
    font-size: 13.5px;
    color: var(--muted);
    opacity: 0;
    will-change: opacity, transform;
  }

  .xc #preuves {
    display: flex;
    padding-block: 20px; padding-inline: max(var(--gouttiere), (100% - var(--page)) / 2);
    max-width: var(--page);
    margin: 0 auto;
    /* Quatre affirmations, donc du discours : même voix que le reste.
       Un demi-point de plus qu'en Geist, la serif se lisant plus petite à
       corps égal. Le même écart est appliqué partout sous 14 px. */
    font-family: var(--serif);
    font-size: var(--t-detail);
    color: var(--muted);
    overflow: hidden;
  }
  /* Au large : les quatre preuves tiennent sur une ligne, réparties.
     Au téléphone (voir la requête média) : bande qui défile toute seule,
     un seul rang lisible au lieu de quatre libellés à l'étroit. */
  .xc .pv-track {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    width: 100%;
  }
  .xc .pv-track.clone { display: none; }
  .xc #preuves span { display: flex; align-items: center; gap: 8px; white-space: nowrap; }
  .xc #preuves i { width: 6px; height: 6px; border-radius: 50%; background: var(--green); flex: none; }
  .xc .strip { background: var(--surface); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }


  /* ── Les quatre postes ──────────────────────────────────────────────────
     Pas de maquette d'application ici. La section parle d'un écart de
     personnel, pas d'un écran : la montrer sous forme d'écran affaiblirait
     le propos et ferait doublon avec le hero, qui porte déjà le vrai produit.

     Chaque carte tient trois niveaux de voix : le poste en petites capitales
     mono (le vocabulaire du grand cabinet), la question en serif (la voix de
     l'avocat), la réponse en sans (celle du produit). */



  /* la ligne ouvrable se signale : bord vert, fond teinté, léger relief */
  /* le libellé d'action devient un bouton plein, impossible à rater */
  @keyframes xcpulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.35; transform: scale(1.5); }
  }


  .xc .story .pin { display: grid; align-content: center; padding-inline: max(var(--gouttiere), (100% - var(--page)) / 2); }
  .xc .story .grid {
    max-width: var(--page);
    margin: 0 auto;
    width: 100%;
    display: grid;
    grid-template-columns: 0.92fr 1.08fr;
    gap: clamp(32px, 5vw, 76px);
    align-items: center;
  }
  .xc .story.reverse .grid { grid-template-columns: 1.08fr 0.92fr; }
  .xc .story h2 {
    margin-top: 18px;
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--t-marque);
    line-height: 1.08;
    letter-spacing: -0.018em;
    max-width: 15ch;
  }
  .xc .story p.body {
    margin-top: 20px;
    max-width: 48ch;
    font-size: var(--t-corps);
    line-height: 1.65;
    color: var(--muted);
  }
  .xc .story p.result {
    margin-top: 24px;
    padding-left: 16px;
    border-left: 2px solid var(--green);
    font-size: 14px;
    line-height: 1.55;
    max-width: 44ch;
  }


  /* ── Chapitres de la narration ─────────────────────────────────────────────
     Promesse et synthèse sont des respirations : rien à l'écran que du texte,
     centré, avec beaucoup de vide autour. Elles ne portent aucune interface,
     c'est ce qui leur donne leur poids. */
  /* Courses raccourcies : la promesse a perdu son chapeau et « Simple » sa
     démonstration. Une zone qui garde sa longueur alors que son contenu a
     maigri devient un couloir vide qu'il faut traverser au défilement. */
  .xc #zone-promesse { height: 120vh; }
  /* Trois arguments qui se rangent l'un après l'autre, chacun avec son écran :
     la course tient le même rythme que « Fiable », à un temps de moins. */
  .xc #zone-simple { height: 320vh; }

  .xc .pr-pin {
    display: grid;
    align-content: center;
    justify-items: center;
    text-align: center;
    padding-inline: max(var(--gouttiere), (100% - var(--page)) / 2);
  }
  /* La typographie de la promesse est déclarée hors de .anime, l'animation
     seule reste dedans. Ces deux lignes tenaient tout, famille et corps
     comprises, dans la règle animée : sans script, la promesse retombait en
     Geist 16 px, c'est-à-dire ni la bonne police ni la bonne taille. Le
     commentaire du script dit que sans lui « tout le texte s'affiche
     normalement » : il le dit maintenant pour de vrai. */
  .xc .pr-main {
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--t-marque);
    line-height: 1.04;
    letter-spacing: -0.026em;
    max-width: 16ch;
  }
  .xc.anime .pr-main {
    opacity: 0;
    will-change: opacity, transform;
  }

  /* Chute de chapitre : la phrase qui referme chaque pilier. Même famille que
     les titres, plus petite, en encre pleine. C'est le point final du
     raisonnement, pas une quatrième preuve. Elle se rapproche des points : le
     grand écart d'avant la détachait de ce qu'elle conclut. */
  .xc .ch-chute {
    margin-top: 14px;
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--t-argument);
    line-height: 1.3;
    letter-spacing: -0.014em;
    color: var(--si-ink);
  }
  .xc.anime .ch-chute {
    opacity: 0;
    will-change: opacity, transform;
  }

  /* Seconde ligne de la promesse. Elle portait le même corps que la première :
     deux lignes de même poids, donc aucune ne dominait. Elle passe à un peu
     plus de la moitié, garde la serif et la teinte atténuée. La promesse se
     lit maintenant en deux temps, l'affirmation puis sa condition. */
  /* Même spécificité que la règle de .pr-main plus haut, et déclarée après :
     sans cela, le corps de la première ligne l'emporterait et la seconde
     resterait aussi grosse qu'elle. */
  .xc .pr-suite {
    margin-top: 14px;
    font-size: var(--t-titre);
    line-height: 1.16;
    letter-spacing: -0.018em;
    max-width: 26ch;
    color: var(--muted);
  }

  /* Masque de révélation. Le texte est translaté sous une arête invisible et
     remonte à sa place : il ne surgit pas à plat, il entre. C'est le geste le
     plus discret qui donne l'impression de soin, et il ne coûte qu'un
     overflow plus une translation. */
  .xc .masque { display: block; overflow: hidden; padding-bottom: 0.08em; }
  .xc .masque > * { display: block; will-change: transform, opacity; }

  /* Marqueur de chapitre.

     Le mot traversait l'écran en gros plan par-dessus la démonstration, puis
     s'effaçait. On lisait donc un mot géant posé sur une carte de chiffres, et
     le repère avait disparu au moment précis où le texte qu'il annonce
     arrivait. Il ouvre maintenant le chapitre à sa place, au-dessus du titre,
     et il reste. Le léger zoom d'entrée est conservé : c'est lui qui donne la
     sensation d'entrer dans un point plutôt que de tourner une page. */
  .xc .ch-mark {
    display: block;
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--t-marque);
    line-height: 1;
    letter-spacing: -0.028em;
    color: var(--si-ink);
  }
  .xc .ch-mark + .kicker { display: block; margin-top: 16px; }
  .xc.anime .ch-mark { opacity: 0; will-change: opacity, transform; }

  /* Chapitre à deux volets : le propos à gauche, la démonstration à droite. */
  .xc .ch-pin {
    display: grid;
    align-content: center;
    padding-inline: max(var(--gouttiere), (100% - var(--page)) / 2);
  }
  /* Le chapitre « Simple » démontre par un émulateur du cabinet : les trois
     arguments à gauche, une fenêtre de SAFE à droite qui bascule d'un écran à
     l'autre selon l'argument en cours (décision CEO du 13 août 2026). */
  .xc #zone-simple .ch-pin {
    grid-template-columns: 0.94fr 1.06fr;
    gap: clamp(24px, 3.4vw, 56px);
    align-items: center;
  }
  .xc #zone-simple .ch-copy { min-width: 0; }
  .xc .ch-copy h2 {
    margin-top: 10px;
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--t-titre);
    line-height: 1.1;
    letter-spacing: -0.02em;
    max-width: 17ch;
  }
  /* ── Les points des trois piliers ─────────────────────────────────────────
     Une seule grammaire pour « Simple », « Fiable » et « Complet ». Elle était
     écrite trois fois, avec trois jeux de tailles ; les trois chapitres disent
     la même chose de la même façon, ils la disent donc désormais avec les
     mêmes règles.

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
  .xc .si-narration { margin-top: clamp(20px, 2.4vw, 30px); }
  .xc .si-args, .xc .fi-args, .xc .co-args { display: grid; list-style: none; }
  .xc .si-arg, .xc .fi-arg, .xc .co-arg {
    display: grid;
    grid-template-columns: 26px 1fr;
    column-gap: 14px;
    align-items: baseline;
    padding: clamp(9px, 1vw, 13px) 0;
  }
  /* Pas encore atteint : déjà à sa place, pas encore là. Deux propriétés
     animées, aucune qui touche à la mise en page. */
  .xc.anime .si-arg, .xc.anime .fi-arg, .xc.anime .co-arg {
    opacity: 0;
    transform: translateY(10px);
    transition:
      opacity var(--duree-entree) var(--doux),
      transform var(--duree-entree) var(--doux);
  }
  .xc.anime .si-arg.vu, .xc.anime .fi-arg.vu, .xc.anime .co-arg.vu {
    opacity: 1;
    transform: none;
  }
  .xc .si-arg .n, .xc .fi-arg .n, .xc .co-arg .n {
    font-family: var(--mono);
    font-size: var(--t-menu);
    letter-spacing: 0.1em;
    /* Le vert de marque tombe à 4,26 pour 11 px, sous le seuil AA. Le vert de
       validation donne 5,88 et dit la même chose ici. Même arbitrage que pour
       le domaine de pratique, plus bas. */
    color: var(--verified);
  }
  /* Un seul corps pour les neuf points de la page. Il est calé sur le chapitre
     le plus chargé, « Complet », qui porte en plus une intro et une chute :
     mesuré, sa colonne tient dans une vue de 620 px de haut, la hauteur d'un
     portable une fois la barre du navigateur retirée. */
  .xc .si-arg .e, .xc .fi-arg .e, .xc .co-arg .e {
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--t-argument);
    line-height: 1.24;
    letter-spacing: -0.014em;
    color: var(--muted);
    max-width: 34ch;
    transition: color var(--duree-teinte) ease;
  }
  /* Le point en cours porte l'encre pleine : c'est lui que la démonstration
     de droite est en train de montrer. Un point déjà lu reste entièrement
     lisible, il passe simplement au second plan. */
  .xc .si-arg.actif .e, .xc .fi-arg.actif .e, .xc .co-arg.actif .e {
    color: var(--si-ink);
  }
  /* La description n'existe qu'au téléphone. Au large, la démonstration est
     EN FACE du point : elle montre déjà ce qu'une phrase expliquerait, et la
     sous-ligne avait été retirée pour cette raison le 13 août. Au pouce, la
     démonstration passe dessous et n'est plus dans le même regard : la phrase
     reprend son utilité. */
  .xc .si-arg .d, .xc .fi-arg .d, .xc .co-arg .d { display: none; }

  /* ── L'émulateur du cabinet ───────────────────────────────────────────────
     Une fenêtre de SAFE posée à côté des arguments du chapitre « Simple ».
     Elle ne bouge pas : c'est son écran qui change quand l'argument change,
     au défilement puis au clic. Chaque écran est un extrait réel du Cabinet
     Demo, avec les chiffres relevés en base. Jamais une vue plus avancée que
     le produit.

     Hauteur fixe : trois écrans de hauteurs différentes qui se remplacent
     feraient sauter la colonne à chaque bascule. */
  .xc .ch-stage { position: relative; display: grid; place-items: center; }
  .xc .em-fenetre {
    width: 100%;
    max-width: 520px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--surface);
    box-shadow: 0 28px 60px -40px rgb(var(--si-line-ink-rgb) / 0.4);
    overflow: hidden;
  }
  .xc .em-barre {
    display: flex;
    align-items: center;
    gap: 7px;
    height: 34px;
    padding: 0 14px;
    background: var(--si-forest);
    font-family: var(--sans);
    font-size: var(--t-menu);
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--si-surface);
  }
  .xc .em-barre i {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--si-amber-on-forest, #E0B54A);
  }
  .xc .em-barre .em-ou { margin-left: auto; opacity: 0.66; }
  .xc .em-corps { position: relative; height: 318px; }
  .xc .em-ecran {
    position: absolute;
    inset: 0;
    padding: 18px 18px 14px;
    opacity: 0;
    transform: translateY(7px);
    transition: opacity 240ms ease, transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
  }
  .xc .em-ecran.on { opacity: 1; transform: none; pointer-events: auto; }
  .xc .em-kicker {
    font-family: var(--sans);
    font-size: var(--t-menu);
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--si-amber-ink);
  }
  .xc .em-h {
    margin-top: 9px;
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--t-argument);
    line-height: 1.16;
    letter-spacing: -0.015em;
  }
  .xc .em-mini {
    margin-top: 9px;
    font-size: 12.5px;
    line-height: 1.5;
    color: var(--muted);
    max-width: 40ch;
  }
  .xc .em-tiles {
    margin-top: 15px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .xc .em-tile {
    padding: 10px 12px 11px;
    border: 1px solid var(--line);
    border-radius: 9px;
    background: var(--si-canvas);
  }
  .xc .em-tile .lab {
    font-family: var(--sans);
    font-size: var(--t-menu);
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .xc .em-tile .sub { margin-top: 6px; font-size: 11px; color: var(--muted); }
  /* Le chiffre est sacré : mono tabulaire, jamais tronqué. */
  .xc .em-tile .val {
    margin-top: 3px;
    font-family: var(--mono);
    font-size: 14.5px;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.01em;
  }
  .xc .em-tile.amber .val { color: var(--si-amber-ink); }
  .xc .em-kv {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    padding: 7px 0;
    border-top: 1px solid var(--line-soft);
    font-size: 12.5px;
  }
  .xc .em-kv .v {
    font-family: var(--mono);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    color: var(--muted);
  }
  .xc .em-act {
    display: inline-flex;
    align-items: center;
    height: 29px;
    margin-top: 13px;
    padding: 0 13px;
    border-radius: 7px;
    background: var(--si-forest);
    color: var(--si-surface);
    font-size: 12px;
  }
  .xc .em-sous {
    margin-top: 13px;
    font-family: var(--sans);
    font-size: var(--t-menu);
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted);
  }
  /* Écran « saisi une fois » : la même heure, à sa source puis sur la facture.
     Le trait vertical dit que rien n'a été retapé entre les deux. */
  .xc .em-bloc {
    margin-top: 9px;
    padding: 11px 13px;
    border: 1px solid var(--line);
    border-radius: 9px;
    background: var(--si-canvas);
  }
  .xc .em-bloc .t { font-size: 13px; }
  .xc .em-bloc .s { margin-top: 4px; font-size: 11.5px; color: var(--muted); }
  .xc .em-ligne {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin-top: 7px;
    padding-top: 7px;
    border-top: 1px solid var(--line-soft);
    font-size: 12.5px;
  }
  .xc .em-ligne .m {
    font-family: var(--mono);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }
  .xc .em-relie {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 10px 0 0 14px;
    font-family: var(--sans);
    font-size: var(--t-menu);
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .xc .em-relie i {
    display: block;
    width: 1px;
    height: 18px;
    background: var(--si-brand-green);
    opacity: 0.5;
  }

  /* Synthèse. */
  /* Synthèse. Elle referme le récit depuis que la section « pour qui » a été
     retirée. Fond blanc comme les trois piliers qu'elle résume ; la
     tarification qui suit revient au canevas, et ce changement de surface
     marque le passage du récit à l'offre.

     Un cran plus petite qu'avant : elle conclut, elle ne rivalise plus avec
     les titres de chapitre. */
  .xc #zone-synthese, .xc #zone-synthese .pin { background: var(--si-surface); }
  /* Le bloc n'est plus animé depuis que la scène de synthèse a quitté la
     boucle de défilement : drawSynthese posait son opacité, drawSynthese a
     été retiré, la règle qui la mettait à zéro était restée. La phrase de
     clôture et les deux actions ne s'affichaient donc plus nulle part, ni au
     téléphone ni au large, et la page passait de « Complet » aux tarifs par
     un bloc blanc de 307 px. */
  .xc .sy-end { margin-top: 34px; }
  .xc .sy-claim { font-family: var(--serif); font-size: var(--t-corps); color: var(--muted); max-width: 36ch; margin: 0 auto; }
  .xc .sy-cta { margin-top: 22px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

  .xc #zone-fiable { height: 400vh; }
  .xc #zone-complet { height: 420vh; }

  /* ── Chapitre COMPLET ─────────────────────────────────────────────────────
     Même langage que « Fiable » : un message arrive en grand, se réduit et
     prend sa place dans une liste qui se construit. Deux différences voulues.
     La démonstration passe à gauche, parce qu'ici on suit un dossier et qu'on
     le regarde avancer avant de lire ce qu'on en conclut. Et le texte du point
     n'est pas celui du message : le bloc porte les deux et bascule de l'un à
     l'autre pendant qu'il rétrécit, ancré au même coin.

     Ce qui a été retiré : le jeton noir flottant qui portait le montant, et la
     ligne verticale du parcours. Les montants vivent maintenant sur
     l'opération qui les produit. */
  /* « Complet » revient au canevas (décision CEO du 13 août 2026). La page
     alterne alors franchement d'un chapitre à l'autre : Simple sur canevas,
     Fiable sur blanc, Complet sur canevas, la synthèse sur blanc, puis la
     tarification à nouveau sur canevas. */
  .xc .co-pin { display: grid; align-content: center; padding-inline: max(var(--gouttiere), (100% - var(--page)) / 2); }
  .xc .co-grid {
    width: 100%;
    max-width: var(--page);
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1.02fr 0.98fr;
    gap: clamp(30px, 4.6vw, 76px);
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
    max-width: 18ch;
  }
  .xc .co-intro {
    margin-top: 14px;
    font-family: var(--serif);
    font-size: var(--t-corps);
    line-height: 1.6;
    color: var(--muted);
    max-width: 46ch;
  }

  /* Le parcours qui se construit. Les points suivent la grammaire partagée
     déclarée avec « Simple » : un corps unique, une phrase, l'encre pour
     dire lequel est en cours. « Complet » portait en plus deux textes
     différents pour un même point, un grand message puis un libellé avec sa
     justification, et basculait de l'un à l'autre en rétrécissant. Le grand
     message est resté, seul : c'est lui qui raconte le parcours. */
  .xc .co-narration { margin-top: clamp(18px, 2.2vw, 28px); }
  .xc .co-fin {
    margin-top: 22px;
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--t-argument);
    line-height: 1.32;
    letter-spacing: -0.014em;
    color: var(--si-ink);
    max-width: 34ch;
  }
  .xc .co-fin .co-comptable {
    display: block;
    margin-top: 9px;
    font-family: var(--serif);
    font-size: 13px;
    line-height: 1.5;
    color: var(--muted);
    max-width: 42ch;
  }
  .xc.anime .co-fin { opacity: 0; transition: opacity 400ms ease; }
  .xc.anime .co-fin.on { opacity: 1; }

  /* La démonstration du parcours. Même surface que celle de « Fiable » :
     un écran réel, une profondeur très légère, aucune bordure. */
  .xc .co-stage { min-width: 0; }
  /* La surface s'inverse avec la section. Sur le blanc de « Fiable », l'écran
     prend le canevas ; sur le canevas de « Complet », il prend le blanc. Mesuré
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
    font-family: var(--serif);
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
  .xc.anime .co-dit { opacity: 0; transition: opacity 380ms ease; }
  .xc.anime .co-dit.on { opacity: 1; }

  /* ── Chapitre FIABLE ──────────────────────────────────────────────────────
     Section blanche, éditoriale, sans un seul cadre. La hiérarchie tient à
     trois choses : la taille, l'espace et le contraste. Le vert n'apparaît que
     sur les numéros, les états actifs et les confirmations.

     Le fond porte le blanc de la marque (--si-surface, l'albâtre du produit),
     pas un blanc pur inventé pour l'occasion. */
  .xc #zone-fiable, .xc #zone-fiable .pin { background: var(--si-surface); }
  .xc .fi-pin { display: grid; align-content: center; padding-inline: max(var(--gouttiere), (100% - var(--page)) / 2); }
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

  /* « Fiable » et « Complet » suivent la grammaire des points déclarée plus
     haut, avec « Simple ». Il ne reste ici que ce qui leur est propre : la
     respiration au-dessus de leur liste. */
  .xc .fi-narration { margin-top: clamp(12px, 1.5vw, 18px); }

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
  .xc .fi-vue-zone { position: relative; min-height: 236px; }
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
  .xc.anime .fi-src[data-src] {
    opacity: 0;
    transform: translateY(6px);
    transition: opacity 360ms ease, transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .xc.anime .fi-src[data-src].on { opacity: 1; transform: none; }
  /* La phrase qui dit ce que les chiffres viennent de prouver. */
  .xc .fi-dit {
    margin-top: 14px;
    font-size: 12.5px;
    line-height: 1.55;
    color: var(--muted);
    max-width: 40ch;
  }
  .xc .fi-dit.vert { color: var(--verified); }
  .xc.anime .fi-dit { opacity: 0; transition: opacity 400ms ease; }
  .xc.anime .fi-dit.on { opacity: 1; }
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
  .xc.anime .fi-temps {
    opacity: 0;
    transform: translateY(6px);
    transition: opacity 360ms ease, transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .xc.anime .fi-temps.on { opacity: 1; transform: none; }
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
  .xc.anime .fi-refus { opacity: 0; transition: opacity 400ms ease; }
  .xc.anime .fi-refus.on { opacity: 1; }


  /* sans display block, « Pour l'avocat » et le titre se collaient */

  .xc section.flat { padding-block: clamp(84px, 12vh, 150px); padding-inline: max(var(--gouttiere), (100% - var(--page)) / 2); }
  .xc section.flat .inner { max-width: var(--page); margin: 0 auto; }
  .xc section.flat.surface { background: var(--surface); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }

  .xc #tarifs .head h2 {
    margin-top: 14px;
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--t-marque);
    line-height: 1.08;
  }
  .xc #tarifs .plan {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 16px;
    padding: 26px 0;
    border-bottom: 1px solid var(--line);
  }
  .xc #tarifs .plan:first-of-type { margin-top: 34px; border-top: 1px solid var(--line); }
  .xc #tarifs .plan .name { font-family: var(--serif); font-size: 16px; }
  .xc #tarifs .plan .detail { margin-top: 4px; font-family: var(--serif); font-size: 13.5px; color: var(--muted); }
  /* Le prix et son unité restent un chiffre : mono, comme tout montant du
     site. La serif s'arrête au texte qui l'entoure. */
  .xc #tarifs .plan .price { font-family: var(--mono); font-size: var(--t-argument); text-align: right; }
  .xc #tarifs .plan .price small { font-family: var(--mono); font-size: var(--t-menu); color: var(--muted); margin-left: 4px; }
  .xc #tarifs .note { margin-top: 18px; font-family: var(--serif); font-size: 13px; color: var(--muted); }
  .xc #tarifs .more { margin-top: 18px; font-family: var(--serif); font-size: 14px; display: inline-block; color: var(--ink); }

  .xc #questions .q {
    display: grid;
    grid-template-columns: 0.86fr 1.14fr;
    gap: 18px;
    padding: 26px 0;
    border-top: 1px solid var(--line);
  }
  .xc #questions .q h3 { font-family: var(--serif); font-weight: 400; font-size: var(--t-argument); line-height: 1.35; }
  .xc #questions .q p { max-width: 58ch; font-family: var(--serif); font-size: 14.5px; line-height: 1.65; color: var(--muted); }
  .xc #questions h2 {
    margin-top: 14px;
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--t-marque);
    line-height: 1.08;
    max-width: 16ch;
  }
  .xc #questions .more { margin-top: 16px; font-family: var(--serif); font-size: 14px; display: inline-block; color: var(--ink); }

  .xc #cta { text-align: center; }
  .xc #cta h2 {
    margin: 18px auto 0;
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--t-marque);
    line-height: 1.05;
    letter-spacing: -0.02em;
    max-width: 18ch;
  }
  .xc #cta p { margin: 22px auto 0; max-width: 50ch; font-family: var(--serif); font-size: 16px; line-height: 1.65; color: var(--muted); }
  .xc #cta .actions { margin-top: 34px; display: flex; gap: 18px; justify-content: center; flex-wrap: wrap; }
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

  .xc footer {
    padding-block: 34px 44px; padding-inline: max(var(--gouttiere), (100% - var(--page)) / 2);
    border-top: 1px solid var(--line);
    display: flex;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    font-size: 12px;
    color: var(--muted);
  }
  .xc footer .flinks { display: flex; gap: 18px; flex-wrap: wrap; }
  .xc footer .fbrand { display: inline-flex; align-items: center; gap: 12px; }
  .xc footer a:hover { color: var(--ink); }

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
        réglée à la main : le titre de « Fiable » ne valait pas celui de
        « Complet » sans qu'aucune règle ne l'ait décidé. Sept variables
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
    .xc .grid > *, .xc .fi-grid > *, .xc .co-grid > *, .xc .ch-pin > *,
    .xc .em-tiles > *, .xc .q > *, .xc .si-arg > *, .xc .co-arg > *,
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
    .xc #hero-copy .hero-second,
    .xc #hero-copy .hero-reassure { display: none; }
    .xc #hero-copy .hero-actions { margin-top: 24px; gap: 16px; }
    .xc #hero-hint { font-size: var(--t-menu); }
    .xc #hero-caption { font-size: var(--t-detail); }

    /* ── Bande de preuves ───────────────────────────────────────────────────
       Trois états ont été essayés ici. Quatre libellés sur deux rangs : à
       l'étroit, et deux rangs de six mots ne se lisent pas comme une preuve.
       Une bande qu'on parcourt au doigt : elle cache la moitié de son contenu
       derrière un geste que personne ne fait. Une boucle continue : le texte
       glisse pendant qu'on le lit, donc on ne le lit pas.

       Celle-ci ne glisse pas pendant la lecture. Elle POSE une affirmation,
       la tient trois secondes immobile, puis la remplace. Un seul texte à la
       fois, toujours au même endroit, toujours aligné pareil : c'est un
       panneau qui tourne, pas un bandeau qui défile.

       Quatre affirmations, quatre temps, seize secondes de cycle. Le pas est
       fait en CSS sur une seule translation, donc aucun recalcul de mise en
       page et rien à réveiller au défilement. */
    .xc #preuves {
      display: block;
      position: relative;
      padding: 0 var(--marge);
      max-width: none;
      height: 46px;
      overflow: hidden;
      -webkit-mask-image: none;
      mask-image: none;
    }
    /* La bande tourne latéralement, un libellé à la fois.

       Deux montages ont échoué avant celui-ci. Une piste de quatre colonnes
       translatée : la règle de base répartit la piste en « space-between », et
       des colonnes plus larges que leur conteneur s'y recouvrent, donc les
       quatre libellés s'imprimaient les uns sur les autres. Une copie muette
       ancrée à droite pour masquer le raccord : elle demandait de calculer sa
       position à partir d'un retrait que le conteneur portait déjà, et elle
       tombait à vingt pixels de sa place.

       Plus de piste et plus de double. Les quatre libellés occupent le MÊME
       emplacement, et chacun a son tour : il entre par la droite, se pose,
       tient trois secondes immobile, puis sort par la gauche. Le décalage se
       fait par le retard de l'animation, un quart de cycle par libellé. Le
       retour du quatrième au premier n'a plus de raccord à masquer, puisqu'il
       n'y a rien à raccorder. */
    .xc .pv-track {
      display: block;
      position: relative;
      width: 100%;
      height: 100%;
      animation: none;
    }
    .xc .pv-track.clone { display: none; }
    .xc #preuves span {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 0;
      font-size: var(--t-detail);
      white-space: nowrap;
      opacity: 0;
      animation: xcPreuveGlisse 16s infinite;
    }
    .xc #preuves span:nth-child(1) { animation-delay: 0s; }
    .xc #preuves span:nth-child(2) { animation-delay: 4s; }
    .xc #preuves span:nth-child(3) { animation-delay: 8s; }
    .xc #preuves span:nth-child(4) { animation-delay: 12s; }
    /* La sortie d'un libellé mord d'un point sur l'entrée du suivant. Réglée
       bord à bord, la bande restait vide 160 ms à chaque tour, ce qui se lit
       comme un clignotement. */
    @keyframes xcPreuveGlisse {
      0%        { opacity: 0; transform: translateX(26px); }
      4%, 22%   { opacity: 1; transform: translateX(0); }
      26%, 100% { opacity: 0; transform: translateX(-26px); }
    }

    /* ── La promesse, sa surface et sa gravure ──────────────────────────────
       Elle partageait exactement le fond du chapitre « Simple » qui la suit :
       deux scènes de suite sur le même gris, donc rien ne disait qu'on avait
       changé de registre entre la phrase qui promet et le pilier qui démontre.

       Elle prend donc sa propre surface, et cette surface est un dégradé :
       elle s'assombrit vers son centre puis remonte au gris de la page à ses
       deux bords. Aucun filet, aucune arête. La scène se creuse, et c'est ce
       creux qui la sépare de ce qui l'entoure. */
    .xc #zone-promesse {
      position: relative;
      background: var(--si-surface2);
    }
    .xc .pr-pin { position: relative; overflow: hidden; }
    /* La gravure. Deux ombres opposées d'un pixel, l'une claire en haut,
       l'autre sombre en bas, et un remplissage à peine plus foncé que la
       pierre : c'est le vocabulaire du creux, celui d'une plaque gravée. Rien
       n'est peint en couleur de marque, sinon le logo se lirait comme un logo
       posé sur le fond au lieu d'être pris dedans. */
    .xc .pr-gravure {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 0;
      pointer-events: none;
      /* Ce qui fait un creux, ce n'est pas une forme pâle, c'est une arête.
         L'opacité de 0,14 posée sur tout l'élément emportait aussi les ombres
         de bord : la marque était une tache claire, pas une entaille.

         L'élément reste donc entièrement opaque. Ce sont les REMPLISSAGES qui
         se rapprochent de la pierre, en gardant leur vert, et les ombres qui
         travaillent à pleine force. La lumière vient d'en haut, comme partout
         ailleurs sur cette page : une entaille est donc sombre sur sa lèvre
         haute et éclairée sur sa lèvre basse. Deux ombres opposées d'un pixel
         et demi le disent, une troisième, plus douce et plus bas, donne la
         profondeur du creux. */
      opacity: 1;
      filter:
        drop-shadow(0 -1.5px 0 rgb(var(--si-line-ink-rgb) / 0.30))
        drop-shadow(0 1.5px 0 rgb(255 255 255 / 0.95))
        drop-shadow(0 4px 6px rgb(var(--si-line-ink-rgb) / 0.10));
    }
    .xc .pr-gravure svg { display: block; }
    /* Les deux teintes de charte, forêt et émeraude, mélangées à la pierre à
       environ un quart. Assez de vert pour qu'on reconnaisse la marque, assez
       de pierre pour qu'elle appartienne au mur au lieu d'être posée dessus.
       Les deux valeurs restent distinctes : aplaties sur une seule, les deux
       volumes de « L'Assemblage » fusionnent et le dessin disparaît. */
    .xc .pr-gravure svg path:first-child { fill: #C3CBC8 !important; }
    .xc .pr-gravure svg path:last-child { fill: #C9DAD3 !important; }
    .xc .pr-gravure svg * { stroke: none !important; }
    .xc .pr-pin .masque { position: relative; z-index: 1; }

    /* ── Exergues et libellés ───────────────────────────────────────────────
       Le mono tenait ses majuscules espacées à 11 px. Le sans est plus large à
       taille égale : l'interlettrage se resserre, sinon « SYSTÈME DE GESTION
       POUR CABINETS D'AVOCATS » passe sur deux lignes et touche le bord. */
    .xc .kicker, .xc .em-kicker, .xc .fi-ou, .xc .co-ou, .xc .em-ou,
    .xc .ha-kicker, .xc .lab, .xc .lb, .xc .sub, .xc .h, .xc .date {
      font-size: var(--t-menu);
      letter-spacing: 0.09em;
    }

    /* ── Chapitres ──────────────────────────────────────────────────────────
       Trois chapitres, une seule grammaire : le mot du chapitre, son titre,
       ses points numérotés, puis l'écran qui les prouve. Chacun réglait sa
       propre échelle ; ils partagent désormais la même. */
    .xc .ch-mark { font-size: var(--t-marque); }
    .xc .ch-mark + .kicker { margin-top: 10px; }
    .xc .ch-copy h2, .xc .story h2, .xc .fi-copy h2, .xc .co-copy h2 {
      margin-top: 12px;
      font-size: var(--t-titre);
      line-height: 1.14;
      max-width: none;
    }
    /* Les points des trois piliers partagent un seul corps, ici comme au
       large. La sous-ligne n'existe plus, donc l'échelle du téléphone n'a plus
       qu'une taille à donner pour eux.

       L'interligne s'ouvre de 1,24 à 1,36. Au large, un point tient sur une
       ligne et l'interligne serré le tient groupé ; sur 335 px, les points de
       « Fiable » passent tous à deux lignes, et le même serrage donne un pavé
       compact que l'oeil lit comme un paragraphe et non comme un point. */
    .xc .si-arg .e, .xc .fi-arg .e, .xc .co-arg .e {
      font-size: var(--t-argument);
      line-height: 1.36;
      max-width: none;
    }
    .xc .si-narration, .xc .fi-narration, .xc .co-narration { margin-top: 26px; }
    .xc .co-intro {
      margin-top: 8px;
      font-size: var(--t-detail);
      line-height: 1.5;
      max-width: none;
    }
    .xc .co-fin { margin-top: 14px; font-size: var(--t-corps); }
    .xc .ch-chute { margin-top: 16px; }

    /* Les deux volets de chaque chapitre s'empilent, et le propos passe
       toujours avant sa démonstration : on lit d'abord de quoi il s'agit. */
    .xc .story .grid, .xc .story.reverse .grid { grid-template-columns: 1fr; gap: 18px; }
    .xc .story.reverse .copy { order: -1; }
    .xc .story .pin { align-content: center; }
    .xc .story p.body { margin-top: 12px; font-size: var(--t-corps); line-height: 1.55; }
    .xc .story p.result { margin-top: 14px; font-size: var(--t-detail); line-height: 1.5; }
    .xc #zone-simple .ch-pin { grid-template-columns: 1fr; gap: 20px; }
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
    .xc .si-args, .xc .fi-args, .xc .co-args {
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
    .xc .si-args::-webkit-scrollbar,
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
    .xc .si-arg, .xc .fi-arg, .xc .co-arg {
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
    .xc .si-arg.actif, .xc .fi-arg.actif, .xc .co-arg.actif {
      border-color: rgb(var(--si-line-ink-rgb) / 0.16);
      box-shadow: 0 1px 2px rgb(var(--si-line-ink-rgb) / 0.05),
                  0 20px 38px -24px rgb(var(--si-line-ink-rgb) / 0.40);
    }
    .xc .si-arg .n, .xc .fi-arg .n, .xc .co-arg .n {
      display: block;
      top: 0;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--line);
    }
    .xc .si-arg .e, .xc .fi-arg .e, .xc .co-arg .e {
      margin-top: 18px;
      color: var(--si-ink);
    }
    .xc .si-arg .d, .xc .fi-arg .d, .xc .co-arg .d {
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
    .xc .si-arg .n, .xc .fi-arg .n, .xc .co-arg .n {
      position: relative;
      top: -1px;
    }

    /* Le dégagement en tête de chapitre tient compte de la barre flottante
       (10 px de haut plus 48 px de hauteur) : sans lui, elle recouvrait le mot
       du chapitre. */
    .xc #zone-simple .ch-pin { padding: 88px var(--marge) 72px; }
    .xc .fi-pin { padding: 88px var(--marge) 72px; }
    .xc .co-pin { padding: 88px var(--marge) 72px; }
    .xc section.flat { padding: 64px var(--marge); }

    /* ── Écrans de démonstration ────────────────────────────────────────────
       Ce sont des captures du produit, pas des illustrations : les retirer
       reviendrait à décrire au lieu de montrer. Elles prennent toute la
       largeur et leurs libellés remontent au plancher de 11 px — à 9 px, elles
       montraient qu'il y avait quelque chose sans qu'on puisse le lire. */
    .xc .fi-ecran, .xc .co-ecran, .xc .em-ecran {
      max-width: none;
      margin-left: 0;
      padding: 14px 15px 15px;
    }
    .xc .em-tiles { margin-top: 10px; gap: 6px; }
    .xc .fi-src { padding: 9px 0; }
    .xc .fi-src .l, .xc .fi-src .m { font-size: var(--t-detail); }
    .xc .fi-dit, .xc .fi-refus { font-size: var(--t-menu); }
    .xc .co-sous { margin-top: 10px; }
    .xc .co-item { padding: 7px 0; }
    .xc .co-item .t, .xc .co-item .m { font-size: var(--t-detail); }
    .xc .co-item .s { font-size: var(--t-menu); }

    /* ── Les deux respirations ──────────────────────────────────────────────
       « Bâtissez votre succès professionnel » et la synthèse finale occupent
       chacune un écran entier. Au large, c'est une respiration : la phrase
       arrive seule, on la lit, on repart. Sur 812 px de haut, la même règle
       donnait une phrase de deux lignes au centre de 600 px de vide, ce qui ne
       se lit pas comme une respiration mais comme un écran qui n'a pas fini de
       charger. Elles prennent la hauteur de ce qu'elles disent, et gardent un
       dégagement franc au-dessus et en dessous. */
    .xc .pr-pin { padding: 88px var(--marge); }
    .xc .pr-main { font-size: var(--t-titre); }
    .xc .sy-claim { font-size: var(--t-corps); }

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
    .xc .pr-main, .xc .pr-suite, .xc .sy-claim,
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
    .xc #cta .actions, .xc .sy-cta { flex-direction: column; align-items: stretch; }
    /* Le pied de page répartissait quatre groupes sur une rangée en
       space-between. Passés à la ligne faute de place, les groupes gardaient
       cette répartition : « Confidentialité » se retrouvait seul sur sa
       ligne, et les écarts entre les liens variaient d'une rangée à l'autre
       sans qu'aucun ne veuille rien dire. Les groupes s'empilent, et les
       liens d'un même groupe gardent un écart unique. */
    /* Le pied de page gardait la gouttière du large, soit 6vw : 22,5 px sur
       375, contre les 20 px de toute la page. Un décalage de 2,5 px ne se voit
       pas, il se sent, et c'est exactement l'écart que la colonne unique
       devait supprimer. */
    .xc footer {
      flex-direction: column;
      gap: 20px;
      padding-inline: var(--marge);
      font-size: var(--t-menu);
    }
    .xc footer .flinks { gap: 14px 18px; }
    /* Un lien tactile fait au moins 44 px de large (globals.css, cible au
       doigt). « FAQ » n'en mesure que 21 : les 23 px restants tombaient tous
       à sa droite et creusaient un trou de 41 px au milieu de la rangée, là
       où les autres liens sont séparés de 18. Le lien garde sa cible, le mot
       se centre dedans, et l'écart redevient le même partout. */
    .xc footer .flinks a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
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

    /* La promesse se relève de sous une arête.
       Les deux lignes montaient en fondu comme le reste de la page, donc la
       phrase arrivait d'un bloc. Elle est pourtant construite en deux temps,
       l'affirmation puis sa condition, et le balisage porte déjà le masque
       qu'il faut : un conteneur en overflow hidden autour de chaque ligne.

       Chaque ligne est donc poussée sous l'arête de son masque et remonte à
       sa place. Le fondu disparaît : ce n'est pas un texte qui apparaît, c'est
       un texte qui se lève. La seconde part 260 ms après la première, le temps
       de lire la première. */
    /* Les deux lignes de la promesse n'ont plus de transition : leur position
       est posée à chaque image par promesseAuDefilement, et une transition
       par-dessus un pilotage au défilement donne un retard élastique, pas un
       mouvement commandé. Elles partent sous l'arête de leur masque, et c'est
       le script qui les remonte. */
    .xc.tel-anime .pr-main { transform: translateY(110%); }
  }

  /* ── Les téléphones étroits ───────────────────────────────────────────────
     320 px, l'iPhone SE de première génération et une partie du parc Android.
     La page entière tient, à un mot près : « ENCAISSEMENTS » demande 108 px
     dans une tuile qui en offre 95, et son S final passait seul à la ligne.

     Le corps ne bouge pas, 11 px est le plancher de l'échelle. C'est
     l'interlettrage qui cède, de 0,09 à 0,04em, plus trois pixels repris sur
     le retrait de la tuile : le libellé rentre sur une ligne, et il reste
     assez d'air pour que la tuile ne se lise pas comme un texte serré. */
  @media (max-width: 360px) {
    .xc .em-tile { padding-inline: 9px; }
    .xc .em-tile .lab { letter-spacing: 0.04em; }
  }

  /* Sans mouvement — et au téléphone, qui suit la même règle.

     Le pouce hérite de tout ce bloc parce que le script y prend déjà le chemin
     statique (voir SEUIL_TELEPHONE). Les deux devaient rester d'accord : quand
     le script posait « Fiable » à son état final mais que la feuille de style
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
    /* Sans mouvement, le panneau cesse de tourner : les quatre affirmations
       reprennent leur rang unique et se lisent d'un coup, réparties comme au
       large. Personne ne perd d'information parce qu'il a demandé moins
       d'animation. */
    @media (prefers-reduced-motion: reduce) {
      .xc #preuves { height: auto; padding-block: 12px; }
      .xc .pv-track {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 6px 18px;
      }
      .xc #preuves span {
        position: static;
        inset: auto;
        height: auto;
        opacity: 1;
        transform: none;
        animation: none;
        font-size: var(--t-menu);
      }
      .xc .pv-track.clone { display: none; }
    }

    /* Sans mouvement, les trois points des trois piliers se lisent à la
       suite, tous posés et tous en encre pleine : il n'y a plus de « point en
       cours » quand il n'y a plus de défilement qui le désigne. Sans cette
       règle, le script figerait la scène à son dernier temps et les points non
       encore venus resteraient transparents.

       Une seule déclaration pour les trois chapitres, puisqu'ils partagent
       désormais la même grammaire. */
    .xc.anime #zone-simple .si-arg,
    .xc.anime #zone-fiable .fi-arg,
    .xc.anime #zone-complet .co-arg {
      opacity: 1;
      transform: none;
      padding: var(--pad-argument, 11px) 0;
    }
    .xc.anime #zone-simple .si-arg .e,
    .xc.anime #zone-fiable .fi-arg .e,
    .xc.anime #zone-complet .co-arg .e {
      color: var(--si-ink);
    }
    .xc.anime #zone-fiable .fi-vue-zone { min-height: 0; }
    .xc.anime #zone-fiable .fi-vue {
      position: static;
      opacity: 1;
      transform: none;
      pointer-events: auto;
      margin-top: 24px;
    }
    .xc.anime #zone-simple .em-corps { height: auto; }

    /* ── Les écrans de démonstration se lisent tous, à la suite ─────────────
       Les trois chapitres montrent plusieurs états du logiciel dans un même
       cadre, en les faisant se relayer : une classe « on » passe de l'un à
       l'autre au fil du défilement, sur une transition d'opacité de 240 ms.

       Dépinglés et remis dans le flux, ces écrans occupent chacun leur place
       dans la page, mais un seul portait encore la classe « on » : les autres
       gardaient leur hauteur en restant invisibles. Mesuré sur « Simple » :
       536 px de vide entre deux démonstrations, et davantage sur « Complet ».

       Deux déclarations, pas une. L'opacité en « !important » reprend la main sur
       la règle de relais, qui vise la même propriété avec autant de poids ; et
       la transition est coupée, sinon une bascule de « on » arrivant après la
       pose statique relancerait un fondu vers un état qu'on vient de fixer. */
    .xc.anime #zone-simple .em-ecran,
    .xc.anime #zone-fiable .fi-vue,
    .xc.anime #zone-complet .co-vue {
      position: static;
      opacity: 1 !important;
      transform: none !important;
      transition: none;
      pointer-events: auto;
    }

    /* « Complet » suit la même règle : sans mouvement, les trois moments sont
       déjà à leur forme finale et le parcours s'affiche en entier. */
    .xc.anime #zone-complet .co-fin { opacity: 1; }
    .xc.anime #zone-complet .co-vue-zone { min-height: 0; }
    .xc.anime #zone-complet .co-vue {
      position: static;
      opacity: 1;
      transform: none;
      pointer-events: auto;
      margin-top: 22px;
    }
    .xc.anime #zone-complet .co-item,
    .xc.anime #zone-complet .co-dit { opacity: 1; transform: none; }
    .xc.anime #zone-fiable .fi-src[data-src],
    .xc.anime #zone-fiable .fi-temps,
    .xc.anime #zone-fiable .fi-dit,
    .xc.anime #zone-fiable .fi-refus { opacity: 1; transform: none; }
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
    .xc.anime #zone-simple .em-ecran,
    .xc.anime #zone-fiable .fi-vue,
    .xc.anime #zone-complet .co-vue {
      position: absolute;
      inset: 0;
      opacity: 0 !important;
      transition: opacity 260ms ease;
      pointer-events: none;
    }
    .xc.anime #zone-simple .em-ecran.on,
    .xc.anime #zone-fiable .fi-vue.on,
    .xc.anime #zone-complet .co-vue.on {
      opacity: 1 !important;
      pointer-events: auto;
    }
    .xc.anime #zone-simple .em-corps,
    .xc.anime #zone-fiable .fi-vue-zone,
    .xc.anime #zone-complet .co-vue-zone {
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
    .xc.anime #zone-simple .si-arg,
    .xc.anime #zone-fiable .fi-arg,
    .xc.anime #zone-complet .co-arg {
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

  const COL = {
    bg: "#EFF2ED", surface: "#FBFCFA", line: "rgba(31,42,36,0.08)",
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
  const easeDoux = (t: number) => t * t * (3 - 2 * t);
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
  /* Les cibles ci-dessous sont décrites dans l'espace 1000x625 d'origine. On
     les ramène au nouveau format par un facteur unique : plus sûr que de
     réécrire trente coordonnées à la main. */
  const TARGET_VS = FRAME_H / 625;

  function dashboardTargets() {
    const t: Array<{ x: number; y: number; w: number; h: number }> = [];
    t.push({ x: 24, y: 20, w: 180, h: 16 });
    t.push({ x: 796, y: 20, w: 74, h: 16 });
    t.push({ x: 884, y: 20, w: 92, h: 16 });
    for (let i = 0; i < 5; i++) t.push({ x: 24, y: 74 + i * 34, w: 132, h: 14 });
    t.push({ x: 188, y: 66, w: 240, h: 108 });
    t.push({ x: 444, y: 66, w: 240, h: 108 });
    t.push({ x: 700, y: 66, w: 276, h: 108 });
    t.push({ x: 188, y: 198, w: 496, h: 252 });
    for (let j = 0; j < 5; j++) t.push({ x: 700, y: 198 + j * 52, w: 276, h: 40 });
    t.push({ x: 188, y: 474, w: 496, h: 26 });
    t.push({ x: 188, y: 512, w: 496, h: 26 });
    t.push({ x: 700, y: 474, w: 276, h: 64 });
    return t.map((c) => ({ ...c, y: c.y * TARGET_VS, h: c.h * TARGET_VS }));
  }

  const rnd = mulberry32(20260725);
  const papers = dashboardTargets().map((tg, i) => ({
    tg,
    sx: rnd(), sy: rnd(),
    sr: (rnd() - 0.5) * 1.4,
    sw: 34 + rnd() * 52, sh: 22 + rnd() * 30,
    drift: rnd() * Math.PI * 2,
    delay: (i % 7) / 7 * 0.3,
    ox: 0, oy: 0, vx: 0, vy: 0,
  }));

  /* le curseur brasse les papiers tant qu'ils ne sont pas rangés */
  const pointer = { x: -9999, y: -9999, speed: 0 };
  const onPointerMove = (e: PointerEvent) => {
    const r = heroCanvas.getBoundingClientRect();
    const nx = e.clientX - r.left, ny = e.clientY - r.top;
    pointer.speed = Math.min(40, Math.hypot(nx - pointer.x, ny - pointer.y));
    pointer.x = nx; pointer.y = ny;
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });

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

    const assemble = easeInOut(phase(p, 0.12, 0.50));

    const frameA = phase(p, 0.32, 0.54);
    if (frameA > 0) {
      ctx.save();
      ctx.globalAlpha = frameA;
      ctx.fillStyle = COL.surface;
      ctx.strokeStyle = COL.line;
      roundRect(ctx, fx, fy, frameW, frameH, 14 * scale);
      ctx.shadowColor = "rgba(11,31,25,0.28)";
      ctx.shadowBlur = 60 * scale;
      ctx.shadowOffsetY = 30 * scale;
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.stroke();
      ctx.restore();
    }

    papers.forEach((pp) => {
      const local = easeOutCubic(phase(assemble, pp.delay, 1));
      const driftX = Math.sin(time * 0.0004 + pp.drift) * 14 * (1 - local);
      const driftY = Math.cos(time * 0.00032 + pp.drift * 1.7) * 10 * (1 - local);
      const x0 = pp.sx * W * 0.9 + W * 0.05 + driftX;
      const y0 = pp.sy * H * 0.85 + H * 0.05 + driftY;
      const x1 = fx + pp.tg.x * scale, y1 = fy + pp.tg.y * scale;
      const w = lerp(pp.sw, pp.tg.w * scale, local);
      const h = lerp(pp.sh, pp.tg.h * scale, local);
      let x = lerp(x0, x1, local), y = lerp(y0, y1, local);
      let rot = pp.sr * (1 - local);

      const free = 1 - local;
      if (free > 0.02 && !REDUCED) {
        const dx = (x + w / 2 + pp.ox) - pointer.x;
        const dy = (y + h / 2 + pp.oy) - pointer.y;
        const d = Math.hypot(dx, dy);
        const R = 170;
        if (d < R && d > 0.001) {
          const force = (1 - d / R) * (0.9 + pointer.speed * 0.12) * free;
          pp.vx += (dx / d) * force * 3.2;
          pp.vy += (dy / d) * force * 3.2;
        }
        pp.vx *= 0.88; pp.vy *= 0.88;
        pp.ox = (pp.ox + pp.vx) * 0.965;
        pp.oy = (pp.oy + pp.vy) * 0.965;
        x += pp.ox * free;
        y += pp.oy * free;
        rot += pp.ox * 0.0022 * free;
      } else {
        pp.ox *= 0.8; pp.oy *= 0.8; pp.vx = 0; pp.vy = 0;
      }

      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(rot);
      const isCard = pp.tg.h > 60;
      ctx.globalAlpha = lerp(0.85, isCard ? 1 : 0.9, local);
      ctx.fillStyle = local > 0.7 && isCard ? COL.bg : COL.surface;
      ctx.strokeStyle = COL.line;
      roundRect(ctx, -w / 2, -h / 2, w, h, Math.min(8, h * 0.3));
      if (local < 0.7) {
        ctx.shadowColor = "rgba(11,31,25,0.16)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 8;
      }
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.stroke();
      ctx.restore();
    });

    /* L'extrait est dessiné dans sa boîte logique 1000x563 puis mis à
       l'échelle : la typographie reste nette au lieu d'être rééchantillonnée
       comme l'était la capture. */
    const shotA = phase(p, 0.44, 0.58);
    heroShot.style.left = fx + "px";
    heroShot.style.top = fy + "px";
    heroShot.style.transform = "scale(" + scale + ")";
    heroShot.style.borderRadius = (14 / scale) + "px";
    heroShot.style.opacity = String(easeInOut(shotA));
    /* Cliquable dès que le fondu est terminé (0.58), pas plus tard : le seuil
       précédent laissait voir une application finie mais inerte. */
    heroShot.classList.toggle("live", p > 0.59);

    const lift = easeInOut(phase(p, 0.18, 0.44));
    const copyA = 1 - phase(p, 0.24, 0.46);
    heroCopy.style.transform = "translateY(" + (-lift * 9) + "vh)";
    heroCopy.style.opacity = String(copyA);
    /* Le titre porte désormais une action, donc une zone saisissable. Estompée,
       elle intercepterait les clics destinés au menu de l'application, comme le
       faisait le titre lui-même avant d'être neutralisé. */
    heroCopy.style.visibility = copyA > 0.2 ? "visible" : "hidden";
    heroCaption.style.opacity = String(phase(p, 0.56, 0.64));
    heroCaption.style.transform = "translateY(" + ((1 - phase(p, 0.56, 0.64)) * 12) + "px)";
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

  /**
   * Montée sous masque. L'élément part sous son arête et remonte à sa place.
   * `decalage` en pourcentage de sa propre hauteur. L'opacité prend un peu
   * d'avance pour que le texte ne paraisse jamais sale pendant la course.
   *
   * Le décalage était d'une hauteur de ligne entière : la phrase traversait
   * toute sa boîte à chaque apparition. Une demi-hauteur suffit à donner le
   * geste, et le mouvement cesse d'attirer l'œil plus que le mot. L'avance de
   * l'opacité est réduite d'autant : à 1,6 le texte était déjà opaque au tiers
   * de la course, et la fin du mouvement se voyait toute seule.
   */
  function monter(el: HTMLElement, t: number, decalage = 55) {
    const e = easeDoux(clamp01(t));
    el.style.transform = "translateY(" + ((1 - e) * decalage) + "%)";
    el.style.opacity = String(easeDoux(clamp01(t * 1.25)));
  }

  /* Chutes de chapitre. Elles n'arrivent qu'une fois le dernier argument
     déplié : sinon on conclut un raisonnement que le visiteur lit encore. */
  /* Ciblées par leur chapitre, pas par leur rang : « Fiable » n'a plus de
     chute depuis sa refonte, et un index décalé aurait animé la mauvaise. */
  const chuteSimple = root.querySelector<HTMLElement>("#zone-simple .ch-chute")!;

  function chute(el: HTMLElement, t: number) {
    if (!el) return;
    const e = easeDoux(clamp01(t));
    el.style.opacity = String(e);
    el.style.transform = "translateY(" + ((1 - e) * 9) + "px)";
  }

  /* Marqueurs de chapitre : « Simple », « Fiable », « Complet ». */
  const markSimple = $$('[data-mark="simple"]')[0];
  const markFiable = $$('[data-mark="fiable"]')[0];
  const markComplet = $$('[data-mark="complet"]')[0];

  /**
   * Ouvre un chapitre par son nom. Le mot monte de quelques pixels puis se
   * pose. Il ne repart pas : c'est le titre du chapitre, pas une transition.
   *
   * L'agrandissement de 1,06 à 1 a été retiré : un mot de cinquante pixels qui
   * change de taille pendant sa course est exactement la charge visuelle qu'on
   * cherche à retirer de la page, et la mise à l'échelle rendait la lettre
   * molle tout du long. La fenêtre passe de 14 % à 24 % de la course du
   * chapitre : le même geste, étalé sur plus de défilement, donc plus lent à
   * l'œil sans être plus long à lire.
   */
  function marqueur(el: HTMLElement, p: number) {
    /* Jamais depuis zéro. C'est le titre du chapitre : arriver dessus par le
       rail, ou juste après le plan précédent, ne doit pas donner un écran où
       il manque son nom. Il entre à 0,4 et se pose. */
    const e = easeDoux(phase(p, 0, 0.24));
    el.style.opacity = String(0.4 + 0.6 * e);
    el.style.transform = "translateY(" + ((1 - e) * 10) + "px)";
  }

  /* ── Chapitre 1 · La promesse ──
     Le chapeau qui suivait la promesse a été retiré (décision CEO du 13 août
     2026) : la phrase se suffit, et la scène ne porte plus que deux temps. */
  const prMain = $("pr-1");
  const prSuite = $("pr-2");

  function drawPromesse(p: number) {
    /* Deux temps nets, séparés par un silence. La seconde ligne ne commence
       qu'une fois la première entièrement posée. */
    monter(prMain, phase(p, 0.12, 0.56));
    monter(prSuite, phase(p, 0.40, 0.80));
  }

  /* ── Chapitre 2 · Simple ──
     L'accordéon a été remplacé par la progression cumulative de « Fiable » :
     un argument arrive en grand, se réduit en point numéroté pendant que le
     suivant arrive, et rien ne disparaît. Les trois écrans du cabinet suivent
     l'argument en cours. */
  const siArgs = $$("#zone-simple .si-arg");
  const emEcrans = $$("#zone-simple .em-ecran");
  const emOu = $("em-ou");
  /* Le nom de l'écran dans le bandeau : on doit savoir où l'on se trouve dans
     le logiciel, pas seulement ce qu'on y voit. */
  const EM_OU = ["Tableau de bord", "Tableau de bord", "Temps"];
  const SI_BORNES = [0, 0.3, 0.6, 1];
  let siTempsCourant = -1;

  function poserSimpleTemps(t: number) {
    if (t === siTempsCourant) return;
    siTempsCourant = t;
    siArgs.forEach((el, i) => {
      /* Vu : le point est arrivé et il reste. Actif : c'est celui que la
         démonstration de droite est en train de montrer. Aucune des deux
         classes ne change une taille, seulement une opacité et une encre. */
      el.classList.toggle("vu", i <= t);
      el.classList.toggle("actif", i === Math.min(t, siArgs.length - 1));
    });
    /* Le dernier temps pose le troisième argument, mais l'écran ne recule
       pas : il reste sur la preuve qu'on vient de lire. */
    const vue = Math.min(t, 2);
    emEcrans.forEach((ec, k) => ec.classList.toggle("on", k === vue));
    emOu.textContent = EM_OU[vue] || "";
  }

  function drawSimple(p: number) {
    marqueur(markSimple, p);

    let t = 0;
    while (t < 2 && p >= SI_BORNES[t + 1]) t++;
    /* Passé ce seuil, les trois points sont posés et la chute peut conclure. */
    const fini = p > 0.88;
    poserSimpleTemps(fini ? 3 : t);
    /* Fenêtre élargie : sur 8 % de la course, la conclusion du chapitre
       apparaissait presque d'un bloc. Elle prend maintenant le double de
       défilement pour le même geste. */
    chute(chuteSimple, phase(p, 0.84, 1));
  }

  /* ── Chapitre 3 · Fiable ──
     Quatre temps sur la course : trois moments racontés, puis la synthèse qui
     les rassemble. Chaque moment a sa vue dans l'écran de droite, et la
     quatrième vue ramène le rapprochement à la concordance : la démonstration
     se termine en ordre, pas sur un refus. */
  const fiableZone = $("zone-fiable");
  const fiArgs = $$("#zone-fiable .fi-arg");
  const fiVues = $$("#zone-fiable .fi-vue");
  const fiOu = $("fi-ou");
  const fiSrcs = $$("#zone-fiable .fi-src[data-src]");
  const fiTemps = $$("#zone-fiable .fi-temps");
  const fiDit0 = $("fi-dit-0");
  const fiDit1 = $("fi-dit-1");
  const fiDit3 = $("fi-dit-3");
  const fiRefus = $("fi-refus");

  /* Où l'on se trouve dans le logiciel, temps par temps. */
  const FI_OU = [
    "Rapprochement · juin 2026",
    "Journal du dossier · juin 2026",
    "Retrait · fidéicommis",
    "Rapprochement · juin 2026",
  ];
  const FI_BORNES = [0, 0.26, 0.52, 0.76, 1];
  let fiTempsCourant = -1;

  function poserFiableTemps(t: number) {
    if (t === fiTempsCourant) return;
    fiTempsCourant = t;
    /* Ce qui a déjà été démontré est rangé, ce qui se démontre est en grand,
       ce qui vient ne prend pas encore de place. Au dernier temps, les trois
       sont rangés : la synthèse n'est pas un nouveau bloc, c'est l'état final
       des arguments eux-mêmes. */
    fiArgs.forEach((el, i) => {
      el.classList.toggle("vu", i <= t);
      el.classList.toggle("actif", i === Math.min(t, fiArgs.length - 1));
    });
    fiVues.forEach((el, i) => el.classList.toggle("on", i === t));
    fiOu.textContent = FI_OU[t] || "";
  }

  function drawFiable(p: number) {
    marqueur(markFiable, p);

    let t = 0;
    while (t < 3 && p >= FI_BORNES[t + 1]) t++;
    poserFiableTemps(t);
    /* Progression à l'intérieur du temps courant : c'est elle qui fait entrer
       les lignes une à une plutôt que d'un bloc. */
    const q = phase(p, FI_BORNES[t], FI_BORNES[t + 1]);

    /* Trois sources qui se posent l'une après l'autre : on comprend qu'elles
       viennent d'endroits différents avant de constater qu'elles disent la
       même chose. */
    fiSrcs.forEach((el, i) => el.classList.toggle("on", t > 0 || q > 0.05 + i * 0.15));
    fiDit0.classList.toggle("on", t > 0 || q > 0.62);

    fiTemps.forEach((el, i) => el.classList.toggle("on", t > 1 || (t === 1 && q > 0.05 + i * 0.28)));
    fiDit1.classList.toggle("on", t > 1 || (t === 1 && q > 0.66));

    /* Le refus arrive après les deux montants : on voit ce qui est demandé,
       puis pourquoi le système s'y oppose. */
    fiRefus.classList.toggle("on", t > 2 || (t === 2 && q > 0.34));
    fiDit3.classList.toggle("on", t === 3 && q > 0.14);
  }

  /* ── Chapitre 4 · Complet ──
     Un dossier, du premier écran à la dernière écriture. Trois moments qui se
     rangent comme dans « Fiable », mais un rythme un peu plus continu : les
     temps s'enchaînent sans marge morte, parce qu'ils racontent un parcours et
     non trois garanties séparées. */
  const completZone = $("zone-complet");
  const coArgs = $$("#zone-complet .co-arg");
  const coVues = $$("#zone-complet .co-vue");
  const coOu = $("co-ou");
  const coFin = $("co-fin");
  const coCartable = $$("#co-cartable .co-item");
  const coOps = $$('#zone-complet [data-op]');
  const coFins = $$('#zone-complet [data-fin]');
  const coDit = $("co-dit");
  const coDomaineNom = $("co-domaine-nom");
  const coSous = $("co-sous");
  const coCart1 = $("co-cart-1");
  const coCart2 = $("co-cart-2");
  const coCart3 = $("co-cart-3");
  const coCart3s = $("co-cart-3s");

  const CO_OU = ["Nouveau dossier", "Dossier en cours", "Fin de dossier"];
  const CO_BORNES = [0, 0.34, 0.66, 1];
  let coTempsCourant = -1;

  /* Deux cartables réels, tirés de `lib/dossiers/cartable-templates`. Le second
     ne sert pas à faire défiler des exemples : il montre que ce sont les
     sections elles-mêmes qui changent avec le domaine, pas juste une étiquette.
     Le mandat ne bouge pas, il est commun aux deux. */
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

  function poserCompletTemps(t: number) {
    if (t === coTempsCourant) return;
    coTempsCourant = t;
    coArgs.forEach((el, i) => {
      el.classList.toggle("vu", i <= t);
      el.classList.toggle("actif", i === Math.min(t, coArgs.length - 1));
    });
    coVues.forEach((el, i) => el.classList.toggle("on", i === Math.min(t, 2)));
    coOu.textContent = CO_OU[Math.min(t, 2)] || "";
  }

  function drawComplet(p: number) {
    marqueur(markComplet, p);

    let t = 0;
    while (t < 2 && p >= CO_BORNES[t + 1]) t++;
    /* Le dernier quart range le troisième moment : les trois points sont alors
       posés, et la conclusion arrive. */
    const fini = p > 0.9;
    poserCompletTemps(fini ? 3 : t);
    const q = phase(p, CO_BORNES[t], CO_BORNES[t + 1]);

    /* Le cartable se monte section par section, puis le domaine bascule : on
       voit d'abord que la structure arrive seule, ensuite qu'elle dépend du
       domaine. */
    coCartable.forEach((el, i) => el.classList.toggle("on", t > 0 || q > 0.08 + i * 0.11));
    poserDomaine(t === 0 && q > 0.72 ? 1 : 0);

    coOps.forEach((el, i) => el.classList.toggle("on", t > 1 || (t === 1 && q > 0.04 + i * 0.15)));
    coFins.forEach((el, i) => el.classList.toggle("on", t > 1 && q > 0.04 + i * 0.13));
    coDit.classList.toggle("on", t === 2 && q > 0.74);
    coFin.classList.toggle("on", fini);
  }

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

  /* ── Chapitres ────────────────────────────────────────────────────────────
     La page raconte désormais une promesse et trois piliers. Le rail ne jalonne
     que les quatre moments qui portent un argument : la promesse et la synthèse
     sont des respirations, pas des étapes, et n'y figurent donc pas. */
  const rail = $("rail");
  const railStops: Record<string, HTMLElement> = {
    hero: rail.querySelector('[data-rail="hero"]')!,
    simple: rail.querySelector('[data-rail="simple"]')!,
    fiable: rail.querySelector('[data-rail="fiable"]')!,
    complet: rail.querySelector('[data-rail="complet"]')!,
  };
  const zones: Record<string, HTMLElement> = {
    hero: heroZone,
    promesse: $("zone-promesse"),
    simple: $("zone-simple"),
    fiable: fiableZone,
    complet: completZone,
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
  const shown: Record<string, number> = {
    hero: 0, promesse: 0, simple: 0, fiable: 0, complet: 0,
  };
  let rafId = 0;
  let vivante = false;
  /* Images consécutives sans aucune scène proche. La boucle ne s'endort qu'au
     bout de plusieurs, et tout défilement remet le compteur à zéro. Une
     condition instantanée suffisait en théorie, mais l'événement de défilement
     et l'image suivante tombent dans le même tour de boucle : la demande de
     réveil pouvait arriver juste avant l'image qui décidait de dormir, et se
     perdre. La boucle mourait alors au milieu de la page. */
  let repos = 0;

  function frame(time: number) {
    const vh = window.innerHeight;
    const near: Record<string, boolean> = {};
    let proche = false;
    Object.keys(shown).forEach((k) => {
      const r = zones[k].getBoundingClientRect();
      // ne dessiner que les scènes proches du viewport : c'est ce qui garde le défilement fluide
      near[k] = r.bottom > -300 && r.top < vh + 300;
      if (near[k]) proche = true;
      const total = r.height - vh;
      const target = total <= 0 ? 1 : clamp01(-r.top / total);
      /* Les scènes hors de vue rejoignent leur cible sans lissage. C'est ce qui
         permet d'endormir la boucle sans jamais figer une scène à mi-course :
         au retour, elle est déjà dans le bon état. */
      shown[k] = near[k] ? shown[k] + (target - shown[k]) * 0.16 : target;
      if (Math.abs(target - shown[k]) < 0.0005) shown[k] = target;
    });

    if (near.hero) drawHero(shown.hero, time);
    if (near.promesse) drawPromesse(shown.promesse);
    if (near.simple) drawSimple(shown.simple);
    if (near.fiable) drawFiable(shown.fiable);
    if (near.complet) drawComplet(shown.complet);
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
    drawPromesse(1);
    drawSimple(1);
    drawFiable(1);
    drawComplet(1);
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

    const PIECE_A = new Path2D(ASSEMBLY_PIECE_A_PATH);
    const PIECE_B = new Path2D(ASSEMBLY_PIECE_B_PATH);
    /* Repère du dessin : la pièce A occupe la moitié gauche du carré de 24,
       la pièce B la moitié droite. Chacune est ramenée à son propre centre
       pour pouvoir tourner sur elle-même pendant la dérive. */
    const CENTRES = [
      { path: PIECE_A, cx: 8.1, cy: 12, teinte: SAFE_PALETTE.forest },
      { path: PIECE_B, cx: 15.9, cy: 12, teinte: SAFE_PALETTE.emeraude },
    ];

    /* Le nombre de pièces. Douze remplissaient mal une fenêtre entière une
       fois les pièces réduites ; vingt donnent la sensation d'un tas, ce que
       le mot « désordre » suppose (retour CEO du 18 août 2026). Elles se
       superposent toutes sur deux positions à l'arrivée, donc le logo final
       reste net quel qu'en soit le nombre. */
    const NB = 20;
    const pieces = Array.from({ length: NB }, (_, i) => ({
      type: i % 2,
      sx: rnd(),
      sy: rnd(),
      sr: (rnd() - 0.5) * 2.2,
      /* Plus petites qu'au premier jet, où elles emplissaient la fenêtre :
         une pièce détachée doit se lire comme un fragment, pas comme un
         panneau (retour CEO du 18 août 2026). */
      taille: 0.16 + rnd() * 0.22,
      derive: rnd() * Math.PI * 2,
      /* Profondeur : une pièce proche suit le poignet davantage qu'une pièce
         lointaine. C'est ce qui fait le relief. */
      fond: 0.4 + rnd() * 0.9,
      retard: (i / NB) * 0.34,
    }));

    let planifie = false;
    let dernierP = -1;
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

    function dessiner(p: number, temps: number) {
      const f = fitCanvas(heroCanvas);
      const ctx = f.ctx, W = f.w, H = f.h;
      ctx.clearRect(0, 0, W, H);

      /* ── Où le rassemblement s'achève ───────────────────────────────────
         Le logo ne s'efface pas sur place. Il rejoint le repère de la barre
         de l'application, celui qui est en haut à gauche de la fenêtre, en
         rétrécissant jusqu'à sa taille : les douze pièces deviennent un logo,
         et ce logo devient le logo du logiciel (retour CEO du 18 août 2026).

         La cible est MESURÉE sur le vrai élément, pas devinée : le cadrage de
         la fenêtre peut changer, la marque restera au bon endroit. */
      const repere = heroShot.querySelector<HTMLElement>(".ha-brand .mark");
      const rCadre = heroCanvas.getBoundingClientRect();
      let finX = W / 2;
      let finY = H * 0.42;
      let finCote = 17;
      if (repere) {
        const rr = repere.getBoundingClientRect();
        if (rr.width > 0) {
          finX = rr.left - rCadre.left + rr.width / 2;
          finY = rr.top - rCadre.top + rr.height / 2;
          finCote = rr.width;
        }
      }

      /* Le repère rassemblé : centré, à une taille qui tient dans la fenêtre. */
      const grand = Math.min(W * 0.46, H * 0.44);
      /* L'état 3 : le logo file vers la barre pendant que l'application
         apparaît. La course est longue et la courbe douce, c'est elle qui
         donne le glissé. */
      /* Toute la chorégraphie se termine à 84 % de la course, pas à 98 %.
         Réglée sur la fin, l'état final n'avait plus de défilement pour être
         regardé : l'épinglage lâchait au moment même où l'application finissait
         de se poser, et on passait dessus sans la voir. Le dernier sixième de
         la course est maintenant un temps d'arrêt sur le produit fini. */
      const releve = easeInOut(phase(p, 0.44, 0.68));
      if (releve >= 1) return;
      const cote = lerp(grand, finCote, releve);
      const cx = lerp(W / 2, finX, releve);
      const cy = lerp(H / 2, finY, releve);

      pieces.forEach((pc) => {
        const local = easeOutCubic(phase(easeInOut(phase(p, 0.02, 0.58)), pc.retard, 1));
        const d = CENTRES[pc.type];

        /* Dérive : elle s'éteint à mesure que la pièce rejoint sa place. */
        const dx = Math.sin(temps * 0.00042 + pc.derive) * 16 * (1 - local);
        const dy = Math.cos(temps * 0.00034 + pc.derive * 1.7) * 12 * (1 - local);
        /* L'inclinaison, pondérée par la profondeur de la pièce. Elle s'éteint
           elle aussi une fois la pièce en place : un logo assemblé ne flotte
           pas au gré du poignet. */
        const roulis = inclinaison * pc.fond * 26 * (1 - local);

        /* Départ dispersé, arrivée sur le repère. Les gauches et les droites
           gardent leur côté : une pièce ne traverse jamais le logo. */
        /* Dispersion plus large : les pièces occupent presque toute la
           fenêtre au lieu de se serrer au centre. */
        const x0 = pc.sx * W * 1.02 - W * 0.01 + dx + roulis;
        const y0 = pc.sy * H * 0.94 + H * 0.03 + dy;
        const x1 = cx + (d.cx - 12) * (cote / 24);
        const y1 = cy + (d.cy - 12) * (cote / 24);

        const ech = lerp(cote * pc.taille, cote, local) / 24;
        const x = lerp(x0, x1, local);
        const y = lerp(y0, y1, local);
        const rot = pc.sr * (1 - local);

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
      const ecartP = cible - p;
      if (Math.abs(ecartP) > 0.0004) {
        p += ecartP * 0.125;
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
      [".si-args", poserSimpleTemps],
      [".fi-args", poserFiableTemps],
      [".co-args", poserCompletTemps],
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

  /* ── La promesse, pilotée par le défilement ─────────────────────────────
     Les deux lignes entraient comme le reste de la page : un observateur les
     déclenchait au franchissement du bord, elles montaient, c'était fini. Sur
     une scène aussi courte, les deux étaient déjà à l'écran quand le
     déclencheur partait, donc tout se jouait avant qu'on ait regardé.

     Elles suivent maintenant le doigt. La position de la scène dans la vue
     donne une progression, et cette progression pose directement la hauteur
     des deux lignes sous l'arête de leur masque. On descend, elles montent ;
     on remonte, elles redescendent. Ce n'est plus une entrée qu'on rate,
     c'est un mouvement qu'on commande.

     La seconde ligne est décalée de 22 % de la course : la phrase se lit en
     deux temps, l'affirmation puis sa condition, comme elle est écrite.

     Une image par événement de défilement, deux propriétés posées, aucune qui
     touche à la mise en page. */
  function promesseAuDefilement() {
    const zone = root.querySelector<HTMLElement>("#zone-promesse");
    const l1 = $("pr-1");
    const l2 = $("pr-2");
    if (!zone || !l1 || !l2) return () => {};

    let planifie = false;

    function poser() {
      planifie = false;
      const r = zone!.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      /* La course se joue pendant que la scène traverse le MILIEU de l'écran,
         pas pendant qu'elle entre par le bas. Réglée sur l'entrée, elle était
         terminée quand le haut de la scène atteignait 59 % de la hauteur de
         vue : la phrase était déjà posée quand on arrivait dessus, et on ne
         voyait donc jamais rien bouger.
         Elle part quand le haut de la scène est à 88 % de la vue et se termine
         à 43 %, soit exactement la traversée du regard. */
      const p = clamp01((vh * 0.88 - r.top) / (vh * 0.45));
      const a = easeOutCubic(phase(p, 0, 0.62));
      const b = easeOutCubic(phase(p, 0.28, 0.9));
      l1!.style.transform = "translateY(" + (1 - a) * 110 + "%)";
      l2!.style.transform = "translateY(" + (1 - b) * 110 + "%)";
    }

    function auDefilement() {
      if (planifie) return;
      planifie = true;
      requestAnimationFrame(poser);
    }

    poser();
    window.addEventListener("scroll", auDefilement, { passive: true });
    window.addEventListener("resize", auDefilement);
    return () => {
      window.removeEventListener("scroll", auDefilement);
      window.removeEventListener("resize", auDefilement);
    };
  }

  let arreterPromesse = () => {};

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
      "#hero-copy > *, #hero-cadre, .ch-mark, .ch-mark + .kicker," +
      " .ch-copy h2, .fi-copy h2, .co-copy h2, .co-intro, .si-arg, .fi-arg," +
      " .co-arg, .ch-chute, .co-fin, .ch-stage, .fi-stage, .co-stage," +
      " section.flat .kicker, section.flat h2, section.flat .plan," +
      " section.flat .q, .sy-claim, .sy-cta, #cta p, #cta .actions"
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
      arreterPromesse = promesseAuDefilement();
      arreterCarrousels = carrouselsTelephone();
      /* Derrière la pose statique différée par les polices. */
      document.fonts?.ready.then(() => window.dispatchEvent(new Event("resize"))).catch(() => {});
    }
  } else {
    reveiller();
    window.addEventListener("scroll", reveiller, { passive: true });
    window.addEventListener("resize", reveiller, { passive: true });
  }

  return () => {
    cancelAnimationFrame(rafId);
    arreterEntree();
    arreterAssemblage();
    arreterPromesse();
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

const PREUVES = [
  "Conçu au Québec",
  "Données hébergées au Canada",
  "Pensé pour le fidéicommis",
  "Utilisé dans un vrai cabinet",
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
    <div className="xc" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <nav id="nav">
        <a className="brand" href="#top" aria-label="SAFE, retour au haut de la page">
          <SafeLogo size={20} />
        </a>
        <div className="links">
          <a href="/fonctionnalites">Fonctionnalités</a>
          <a href="/tarification">Tarification</a>
          <a href="/a-propos">À propos</a>
          <a href="/contact">Contact</a>
        </div>
        {/* Le bouton de menu vit dans le groupe de droite, aux côtés de
            l'action : au téléphone les deux se tiennent ensemble contre le
            bord, au lieu d'être écartés aux deux extrémités de la barre par
            le space-between. */}
        <div className="navright">
          <a className="signin" href="/connexion">Connexion</a>
          <a className="cta" href="/audit-gratuit">Faire le diagnostic</a>
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
            {[
              ["/fonctionnalites", "Fonctionnalités"],
              ["/tarification", "Tarification"],
              ["/a-propos", "À propos"],
              ["/contact", "Contact"],
            ].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOuvert(false)}>
                {label}
                <span aria-hidden>›</span>
              </a>
            ))}
            {/* Plus de bouton d'action ici : l'action est restée dans la
                barre, visible sans ouvrir le menu. La connexion prend une
                rangée comme les autres liens. */}
            <a href="/connexion" onClick={() => setMenuOuvert(false)}>
              Connexion
              <span aria-hidden>›</span>
            </a>
          </div>
        </>
      ) : null}

      <nav id="rail" aria-label="Chapitres de la page">
        <a className="stop" data-rail="hero" href="#zone-hero"><span>Assembler</span><i aria-hidden /></a>
        <a className="stop" data-rail="simple" href="#zone-simple"><span>Simple</span><i aria-hidden /></a>
        <a className="stop" data-rail="fiable" href="#zone-fiable"><span>Fiable</span><i aria-hidden /></a>
        <a className="stop" data-rail="complet" href="#zone-complet"><span>Complet</span><i aria-hidden /></a>
      </nav>

      {/* Scène 1 · L'assemblage → vraie capture */}
      <div className="pinzone" id="zone-hero">
        <div className="pin" id="top">
          {/* L'assemblage débouche sur l'application elle-même, navigable, et
             non sur une capture figée. Position et échelle pilotées au pixel
             par le canvas (drawHero).

             Le cadre qui l'entoure ne fait rien au large : il couvre la scène
             sans la rogner, et garde donc l'origine des coordonnées que le
             script emploie pour poser l'application au pixel. Au téléphone il
             devient une fenêtre : il rogne, et l'application est agrandie
             derrière lui au lieu d'être réduite. Voir le bloc téléphone. */}
          {/* Le canevas vit dans le cadre, donc dans le BAS de la vue, sous
              l'appel à l'action. Essayé au-dessus, couvrant la scène entière :
              les pièces passaient derrière le titre, ce qui fait du désordre
              par-dessus du texte et non une ouverture (retour CEO du 18 août
              2026). Au large, le cadre couvre toute la scène et rien ne
              change pour lui. */}
          <div id="hero-cadre">
            <canvas id="hero-canvas" />
            <HeroLiveApp />
          </div>
          <div id="hero-copy">
            <p className="kicker">SAFE · système de gestion pour cabinets d&apos;avocats</p>
            <h1>SAFE tient votre cabinet <em>ensemble.</em></h1>
            <p className="lede">
              Fidéicommis, dossiers, temps, facturation et conformité partagent enfin le même
              contexte. Vous voyez ce qui est à jour, ce qui attend et ce qui ne concorde pas.
            </p>
            <div className="hero-actions">
              <a className="btn" href="/audit-gratuit">Faire le diagnostic</a>
              <a className="hero-second" href="/fonctionnalites">
                Voir ce que fait SAFE<i aria-hidden />
              </a>
            </div>
            <p className="hero-reassure">Gratuit, sans carte de crédit. Rapport sous 24 h.</p>
          </div>
          {/* La légende disait « capture réelle ». Ce n'en est plus une : le
             cadre contient l'application elle-même. Annoncer une image quand
             on peut cliquer dedans priverait le visiteur du geste. */}
          <p id="hero-caption">
            SAFE, en vrai. Ouvrez un menu et circulez : c&apos;est l&apos;application, pas une capture.
          </p>
          {/* Le sens est écrit, pas sous-entendu. « Faites défiler » laisse
              choisir la direction, et l'ouverture ne se joue que vers le bas
              (retour CEO du 18 août 2026). La flèche le redit sans mot. */}
          <p id="hero-hint">
            Faites défiler vers le bas
            <i aria-hidden />
          </p>
        </div>
      </div>

      {/* Bande de preuves */}
      <div className="strip">
        <div id="preuves">
          <div className="pv-track">
            {PREUVES.map((p) => (<span key={p}><i />{p}</span>))}
          </div>
          {/* copie muette : elle prend le relais quand la première sort de
              l'écran, pour un défilement sans rupture au téléphone */}
          <div className="pv-track clone" aria-hidden="true">
            {PREUVES.map((p) => (<span key={p}><i />{p}</span>))}
          </div>
        </div>
      </div>

      {/* Chapitre 1 · La promesse ─────────────────────────────────────────
         Rien d'autre à l'écran. La promesse a besoin de vide autour d'elle
         pour peser, et l'application ne doit pas encore reparaître : le
         visiteur vient de la quitter, on le laisse sur la phrase. */}
      <div className="pinzone" id="zone-promesse">
        <div className="pin pr-pin">
          {/* La marque, gravée dans le fond. Elle ne se lit pas, elle se
              devine : c'est un relief, pas un logo posé. La scène de la
              promesse est la seule de la page à ne rien démontrer, elle n'a
              donc rien à côté de quoi ce relief pourrait entrer en concurrence
              (demande CEO du 18 août 2026). */}
          <span className="pr-gravure" aria-hidden>
            <SafeMark size={210} />
          </span>
          <span className="masque"><span className="pr-main" id="pr-1">Bâtissez votre succès professionnel</span></span>
          <span className="masque"><span className="pr-main pr-suite" id="pr-2">sur un système simple, fiable et complet.</span></span>
        </div>
      </div>

      {/* Chapitre 2 · Simple ───────────────────────────────────────────────
         La carte de factures qui occupait la moitié droite a été retirée
         (décision CEO du 13 août 2026). Le chapitre qui parle de simplicité
         ne montre plus qu'une chose à la fois : son propos. */}
      <div className="pinzone" id="zone-simple">
        <div className="pin ch-pin">
          <div className="ch-copy">
            {/* Le marqueur ouvre le chapitre à sa place, au-dessus du titre, et
                il reste. Il traversait l'écran en gros plan puis s'effaçait. */}
            <p className="ch-mark" data-mark="simple">Simple</p>
            <p className="kicker">Pilier 1 sur 3</p>
            <h2>La gestion de votre cabinet, sans la complexité comptable.</h2>
            {/* Trois arguments qui changent de rang, comme dans « Fiable ».
                L'accordéon a disparu : plus rien ne s'ouvre ni ne se ferme, un
                argument arrive en grand puis se range en point numéroté
                pendant que le suivant prend sa place. */}
            <div className="si-narration">
              <ol className="si-args">
                <li className="si-arg" data-siarg="0">
                  <span className="n" aria-hidden>01</span>
                  <p className="e">Vos chiffres, en langage clair.</p>
                  <p className="d">Facturé, encaissé, reste à recevoir. Ni débit ni crédit à l’écran.</p>
                </li>
                <li className="si-arg" data-siarg="1">
                  <span className="n" aria-hidden>02</span>
                  <p className="e">Une prochaine action claire.</p>
                  <p className="d">L’écran nomme ce qui se traite maintenant, et ce qui vient ensuite.</p>
                </li>
                <li className="si-arg" data-siarg="2">
                  <span className="n" aria-hidden>03</span>
                  <p className="e">Saisi une fois. Utilisé partout.</p>
                  <p className="d">Une heure notée au dossier devient une ligne de facture, sans la ressaisir.</p>
                </li>
              </ol>
              <p className="ch-chute">Moins de gestion. Plus de pratique.</p>
            </div>
          </div>

          {/* L'émulateur. Trois écrans du Cabinet Demo, un par argument. Le
              défilement les fait défiler, puis le clic sur un argument prend
              la main. Les chiffres sont ceux relevés en base, et l'heure de
              consultation porte le même montant que la chaîne du chapitre
              « Complet » : 1 h 30 à 450 $ l'heure. */}
          <div className="ch-stage">
            <div className="em-fenetre">
              <div className="em-barre">
                <i aria-hidden />Cabinet Demo
                <span className="em-ou" id="em-ou">Tableau de bord</span>
              </div>
              <div className="em-corps">
                <div className="em-ecran on" data-em="0">
                  <p className="em-kicker">Lecture rapide</p>
                  <p className="em-h">Vos chiffres, en langage simple</p>
                  <div className="em-tiles">
                    <div className="em-tile">
                      <p className="lab">Facturation</p><p className="sub">Facturé</p>
                      <p className="val">87 115,20 $</p>
                    </div>
                    <div className="em-tile">
                      <p className="lab">Encaissements</p><p className="sub">Encaissé</p>
                      <p className="val">49 055,00 $</p>
                    </div>
                    <div className="em-tile amber">
                      <p className="lab">Créances</p><p className="sub">Reste à recevoir</p>
                      <p className="val">38 060,20 $</p>
                    </div>
                    <div className="em-tile">
                      <p className="lab">Fidéicommis</p><p className="sub">Fidéicommis client</p>
                      <p className="val">0,00 $</p>
                    </div>
                  </div>
                  <p className="em-sous">Ni débit, ni crédit à l&apos;écran</p>
                </div>

                <div className="em-ecran" data-em="1">
                  <p className="em-kicker">À traiter maintenant</p>
                  <p className="em-h">Dix-sept factures attendent un paiement</p>
                  <p className="em-mini">
                    Onze sont en retard. Le rapprochement du fidéicommis n&apos;a pas encore été
                    fait ce mois-ci.
                  </p>
                  <span className="em-act">Voir les créances</span>
                  <p className="em-sous">Ensuite</p>
                  <div className="em-kv">
                    <span>Rapprocher le fidéicommis</span><span className="v">Ce mois</span>
                  </div>
                  <div className="em-kv">
                    <span>Relancer Pelletier · 2026-002</span><span className="v">5 533,18 $</span>
                  </div>
                </div>

                <div className="em-ecran" data-em="2">
                  <p className="em-kicker">Temps</p>
                  <p className="em-h">Saisie une fois, portée toute seule</p>
                  <div className="em-bloc">
                    <p className="t">Consultation · 1 h 30</p>
                    <p className="s">Me Camille Roy · 450 $ l&apos;heure</p>
                  </div>
                  <div className="em-relie"><i aria-hidden />Sans ressaisie</div>
                  <div className="em-bloc">
                    <p className="t">Facture 2026-031</p>
                    <div className="em-ligne">
                      <span>Honoraires professionnels · 1 h 30</span>
                      <span className="m">675,00 $</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Chapitre 3 · Fiable ───────────────────────────────────────────────
         Section blanche et éditoriale. Aucune carte, aucun cadre, aucun filet
         décoratif : la hiérarchie tient à la typographie, à l'espace et au
         contraste. Trois moments racontés l'un après l'autre pendant le
         défilement, chacun prouvé dans l'interface à droite, puis les trois
         rassemblés dans une synthèse ouverte.

         Les refus affichés ne sont pas inventés pour la vitrine : ce sont les
         messages exacts de `lib/services/fideicommis/errors.ts`. */}
      <div className="pinzone fiable-blanc" id="zone-fiable">
        <div className="pin fi-pin">
          <div className="fi-grid">
            <div className="fi-copy">
              <p className="ch-mark" data-mark="fiable">Fiable</p>
              <p className="kicker">Pilier 2 sur 3</p>
              <h2>Des contrôles intégrés là où ils comptent.</h2>

              {/* Trois arguments qui changent de rang, jamais remplacés.
                  Le courant est en grand ; ceux qui l'ont précédé sont rangés
                  au-dessus, numérotés. Le numéro est masqué à la voix de
                  synthèse : le rang est déjà porté par la liste ordonnée. */}
              <div className="fi-narration">
                <ol className="fi-args">
                  <li className="fi-arg" data-arg="0">
                    <span className="n" aria-hidden>01</span>
                    <p className="e">Vos chiffres restent cohérents, partout où vous les consultez.</p>
                  <p className="d">Le compte, le registre et les soldes par dossier portent le même montant.</p>
                  </li>
                  <li className="fi-arg" data-arg="1">
                    <span className="n" aria-hidden>02</span>
                    <p className="e">Chaque correction laisse une trace. Rien d&apos;important ne disparaît.</p>
                  <p className="d">L’écriture d’origine reste au journal. La correction s’ajoute en dessous, datée.</p>
                  </li>
                  <li className="fi-arg" data-arg="2">
                    <span className="n" aria-hidden>03</span>
                    <p className="e">Les incohérences sont détectées avant qu&apos;elles deviennent un problème.</p>
                  <p className="d">Un retrait au-delà du solde détenu pour le dossier est refusé, règle citée.</p>
                  </li>
                </ol>
              </div>
            </div>

            {/* La démonstration. Seule surface de la section : elle représente
                un vrai écran, donc elle a droit à une profondeur très légère,
                portée par la teinte du canevas plutôt que par une bordure. */}
            <div className="fi-stage">
              <div className="fi-ecran">
                <p className="fi-ou" id="fi-ou">Rapprochement · juin 2026</p>

                <div className="fi-vue-zone">
                <div className="fi-vue on" data-fivue="0">
                  <div className="fi-src" data-src="0">
                    <span className="l">Solde bancaire</span>
                    <span className="m">21 000,00 $</span>
                  </div>
                  <div className="fi-src" data-src="1">
                    <span className="l">Registre du fidéicommis</span>
                    <span className="m">21 000,00 $</span>
                  </div>
                  <div className="fi-src" data-src="2">
                    <span className="l">Soldes par dossier</span>
                    <span className="m">21 000,00 $</span>
                  </div>
                  <p className="fi-dit" id="fi-dit-0">Trois sources, un seul montant.</p>
                </div>

                <div className="fi-vue" data-fivue="1">
                  <div className="fi-temps" data-temps="0">
                    <span className="h">14 juin · 09 h 12</span>
                    <span className="t">Écart constaté sur le dossier <span className="ref">2026-011</span></span>
                    <span className="m">− 500,00 $</span>
                  </div>
                  <div className="fi-temps" data-temps="1">
                    <span className="h">14 juin · 09 h 41</span>
                    <span className="t">Écriture de correction · dossier <span className="ref">2026-011</span></span>
                    <span className="m vert">+ 500,00 $</span>
                  </div>
                  <p className="fi-dit" id="fi-dit-1">
                    L&apos;écriture d&apos;origine reste au journal. La correction s&apos;ajoute
                    en dessous, datée.
                  </p>
                </div>

                <div className="fi-vue" data-fivue="2">
                  <p className="fi-op">Retrait demandé · dossier <span className="ref">2026-011</span></p>
                  <div className="fi-src">
                    <span className="l">Montant du retrait</span>
                    <span className="m">1 200,00 $</span>
                  </div>
                  <div className="fi-src">
                    <span className="l">Solde détenu pour ce dossier</span>
                    <span className="m">850,00 $</span>
                  </div>
                  <p className="fi-refus" id="fi-refus">
                    Solde en fidéicommis insuffisant pour ce dossier. Un retrait ne peut
                    jamais dépasser le solde détenu pour ce dossier.
                  </p>
                </div>

                <div className="fi-vue" data-fivue="3">
                  <div className="fi-src">
                    <span className="l">Solde bancaire</span>
                    <span className="m">21 000,00 $</span>
                  </div>
                  <div className="fi-src">
                    <span className="l">Registre du fidéicommis</span>
                    <span className="m">21 000,00 $</span>
                  </div>
                  <div className="fi-src">
                    <span className="l">Soldes par dossier</span>
                    <span className="m">21 000,00 $</span>
                  </div>
                  <p className="fi-dit vert" id="fi-dit-3">
                    Concordance. La certification peut être produite.
                  </p>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Chapitre 4 · Complet ──────────────────────────────────────────────
         Surtout pas six cartes côte à côte. Une seule information entre dans
         le système et le traverse : la même heure de consultation devient
         ligne de facture, puis paiement, puis mouvement de fidéicommis, puis
         écriture, puis chiffre de rapport. Le montant se transforme sous les
         yeux, la continuité se voit au lieu de se lire. */}
      <div className="pinzone" id="zone-complet">
        <div className="pin co-pin">
          <div className="co-grid">
            {/* La démonstration passe à gauche : on suit un dossier, donc on le
                voit avancer avant de lire ce qu'on en conclut. Les sections de
                cartable et leurs sources viennent de
                `lib/dossiers/cartable-templates`, ce sont celles que le produit
                monte réellement à l'ouverture. */}
            <div className="co-stage">
              <div className="co-ecran">
                <p className="co-ou" id="co-ou">Nouveau dossier</p>

                <div className="co-vue-zone">
                <div className="co-vue on" data-covue="0">
                  <p className="co-domaine">
                    <span className="lb">Domaine de pratique</span>
                    <span className="vl" id="co-domaine-nom">Droit de la famille</span>
                  </p>
                  <p className="co-sous" id="co-sous">Cartable monté automatiquement</p>
                  <div className="co-liste" id="co-cartable">
                    <div className="co-item" data-cart="0">
                      <span className="t">Mandat et engagement</span>
                      <span className="s">RCNEPA art. 15-16</span>
                    </div>
                    <div className="co-item" data-cart="1">
                      <span className="t" id="co-cart-1">Pièces Madame (P-)</span>
                      <span className="s">Règl. Cour Qc art. 13</span>
                    </div>
                    <div className="co-item" data-cart="2">
                      <span className="t" id="co-cart-2">Pièces Monsieur (D-)</span>
                      <span className="s">Règl. Cour Qc art. 13</span>
                    </div>
                    <div className="co-item" data-cart="3">
                      <span className="t" id="co-cart-3">Procédures</span>
                      <span className="s" id="co-cart-3s">C.p.c. art. 109 et s.</span>
                    </div>
                  </div>
                </div>

                <div className="co-vue" data-covue="1">
                  <p className="co-sous">Dossier Pelletier · 2026-002</p>
                  <div className="co-liste">
                    <div className="co-item" data-op="0">
                      <span className="t">Échéance inscrite</span>
                      <span className="s">Protocole de l&apos;instance · 12 juin</span>
                    </div>
                    <div className="co-item" data-op="1">
                      <span className="t">Temps consigné</span>
                      <span className="s">Consultation · 1 h 30</span>
                      <span className="m">675,00 $</span>
                    </div>
                    <div className="co-item" data-op="2">
                      <span className="t">Document déposé</span>
                      <span className="s">Pièce P-4 · rangée au cartable</span>
                    </div>
                    <div className="co-item" data-op="3">
                      <span className="t">Débours inscrit</span>
                      <span className="s">Frais de greffe</span>
                      <span className="m">195,00 $</span>
                    </div>
                    <div className="co-item" data-op="4">
                      <span className="t">Facture préparée</span>
                      <span className="s">2026-031 · rien à ressaisir</span>
                      <span className="m">870,00 $</span>
                    </div>
                  </div>
                </div>

                <div className="co-vue" data-covue="2">
                  <p className="co-sous">Ce que le dossier a produit</p>
                  <div className="co-liste">
                    <div className="co-item" data-fin="0">
                      <span className="t">Facture 2026-031</span>
                      <span className="s">Envoyée au client</span>
                      <span className="m">675,00 $</span>
                    </div>
                    <div className="co-item" data-fin="1">
                      <span className="t">Paiement reçu</span>
                      <span className="s">Virement Interac</span>
                      <span className="m">776,36 $</span>
                    </div>
                    <div className="co-item" data-fin="2">
                      <span className="t">Débours réglés</span>
                      <span className="s">Du compte client</span>
                      <span className="m">195,00 $</span>
                    </div>
                    <div className="co-item" data-fin="3">
                      <span className="t">Écriture au grand livre</span>
                      <span className="s">Datée et protégée</span>
                    </div>
                    <div className="co-item" data-fin="4">
                      <span className="t">Revenus et taxes</span>
                      <span className="s">À jour, sans ressaisie</span>
                    </div>
                  </div>
                  <p className="co-dit" id="co-dit">
                    <span className="marque" aria-hidden>✓</span>
                    Le dossier est clos. Les rapports du cabinet sont à jour.
                  </p>
                </div>
                </div>
              </div>
            </div>

            <div className="co-copy">
              <p className="ch-mark" data-mark="complet">Complet</p>
              <p className="kicker">Pilier 3 sur 3</p>
              <h2>De l&apos;ouverture du dossier jusqu&apos;aux rapports.</h2>
              <p className="co-intro">
                SAFE adapte chaque étape à votre domaine de pratique, puis relie le travail
                juridique, l&apos;administration et la comptabilité dans un même système.
              </p>

              {/* Même grammaire que « Fiable » : le message se réduit et prend
                  sa place dans le parcours. Ici le texte du point n'est pas
                  celui du grand message, donc le bloc porte les deux et bascule
                  de l'un à l'autre pendant qu'il rétrécit et se déplace. */}
              <div className="co-narration">
                <ol className="co-args">
                  <li className="co-arg" data-coarg="0">
                    <span className="n" aria-hidden>01</span>
                    <p className="e">Le bon cadre, dès l&apos;ouverture.</p>
                  <p className="d">Le cartable réglementaire de votre domaine est monté à la création du dossier.</p>
                  </li>
                  <li className="co-arg" data-coarg="1">
                    <span className="n" aria-hidden>02</span>
                    <p className="e">Le dossier avance. Chaque opération suit.</p>
                  <p className="d">Temps, débours et documents se rattachent au dossier au fil du travail.</p>
                  </li>
                  <li className="co-arg" data-coarg="2">
                    <span className="n" aria-hidden>03</span>
                    <p className="e">Le dossier se termine. Le cabinet reste à jour.</p>
                  <p className="d">À la fermeture, la facturation et les rapports du cabinet sont déjà à jour.</p>
                  </li>
                </ol>
                <p className="co-fin" id="co-fin">
                  Un parcours adapté à votre pratique. Un cabinet relié de bout en bout.
                  <span className="co-comptable">
                    Votre comptable conserve sa place. SAFE lui fournit une information mieux
                    structurée.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Synthèse ──────────────────────────────────────────────────────────
         La section « Conçu pour les petits cabinets » a été retirée (décision
         CEO du 13 août 2026) : la démonstration terminée, c'est la synthèse qui
         referme le récit, sans détour par un dernier argument.

         Fond blanc, comme les trois piliers qui la précèdent. La tarification
         qui suit reprend le canevas : le changement de surface marque le
         passage du récit à l'offre. */}
      {/* La triade « simple, fiable, complet » était énoncée trois fois : par la
          promesse, par les trois piliers qui la démontrent, puis récapitulée
          ici sur un écran et demi. La troisième énonciation n'apprenait rien
          à qui venait de parcourir onze écrans, et repoussait le prix d'autant
          (audit du 13 août 2026).

          Restent la phrase de clôture et l'action, qui referment la
          démonstration et touchent maintenant la tarification. La scène quitte
          l'épinglage : elle n'a plus de temps à raconter. */}
      <section className="flat" id="zone-synthese">
        <div className="inner">
          <div className="sy-end" id="sy-end">
            <p className="sy-claim">Bâtissez votre cabinet sur de meilleures fondations.</p>
            {/* L'action pleine menait vers une page de contenu pendant que le
                diagnostic, seule prochaine étape réelle du parcours, était
                relégué en bouton fantôme. La synthèse referme la démonstration :
                c'est l'endroit de la page où l'engagement coûte le moins, il ne
                peut pas porter la hiérarchie inversée. */}
            <div className="sy-cta">
              <a className="btn" href="/audit-gratuit">Faire le diagnostic</a>
              <a className="btn ghost" href="/fonctionnalites">Voir ce que fait SAFE</a>
            </div>
          </div>
        </div>
      </section>
      {/* Tarification */}
      <section className="flat" id="tarifs">
        <div className="inner">
          <div className="head">
            <p className="kicker">Tarification</p>
            <h2>Simple dès le départ.</h2>
          </div>
          <div className="plan">
            <div>
              <p className="name">Solo</p>
              <p className="detail">Pour une pratique individuelle.</p>
            </div>
            <p className="price">99 $<small>/ mois</small></p>
          </div>
          <div className="plan">
            <div>
              <p className="name">Cabinet</p>
              <p className="detail">Pour une petite équipe qui travaille ensemble.</p>
            </div>
            <p className="price">149 $<small>/ mois</small></p>
          </div>
          <p className="note">Configuration initiale comprise. Prix en dollars canadiens, taxes en sus.</p>
          <a className="more" href="/tarification">Tous les détails de la tarification →</a>
        </div>
      </section>

      {/* Questions */}
      <section className="flat surface" id="questions">
        <div className="inner">
          <p className="kicker">Avant de nous parler</p>
          <h2>Des réponses précises aux questions importantes.</h2>
          <div style={{ marginTop: 44 }}>
            <div className="q">
              <h3>SAFE garantit-il ma conformité ?</h3>
              <p>
                Non. SAFE soutient la tenue, la vérification et la traçabilité. La responsabilité
                professionnelle demeure celle du cabinet.
              </p>
            </div>
            <div className="q">
              <h3>Est-ce que SAFE remplace mon adjointe ?</h3>
              <p>
                Non. SAFE prépare, relie et signale. Votre équipe conserve le jugement et la
                connaissance du cabinet.
              </p>
            </div>
            <div className="q">
              <h3>À qui appartiennent mes données ?</h3>
              <p>
                À votre cabinet. Les données sont hébergées au Canada et peuvent être exportées dans
                les formats offerts.
              </p>
            </div>
          </div>
          <a className="more" href="/faq">Lire toutes les questions →</a>
        </div>
      </section>

      {/* CTA final */}
      <section className="flat" id="cta">
        <div className="inner">
          <p className="kicker">La prochaine étape</p>
          <h2>Voyons si SAFE convient à votre façon de travailler.</h2>
          <p>
            Commencez par un diagnostic concret de votre cabinet. Vous décidez ensuite si une
            démonstration mérite vingt minutes de votre temps.
          </p>
          <div className="actions">
            <a className="btn" href="/audit-gratuit">Faire le diagnostic</a>
            <a className="btn ghost" href="/demo">Réserver une rencontre</a>
          </div>
        </div>
      </section>

      <footer>
        <span className="fbrand">
          <SafeLogo size={17} />
          <span>Maquettes et captures sur données de démonstration</span>
        </span>
        <span className="flinks">
          <a href="/fonctionnalites">Fonctionnalités</a>
          <a href="/a-propos">À propos</a>
          <a href="/faq">FAQ</a>
          <a href="/contact">Contact</a>
          <a href="/conditions">Conditions</a>
          <a href="/confidentialite">Confidentialité</a>
        </span>
      </footer>
    </div>
  );
}
