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
import { SafeLogo } from "@/components/branding/SafeLogo";
import {
  ASSEMBLY_PIECE_A_PATH,
  ASSEMBLY_PIECE_B_PATH,
  SAFE_PALETTE,
} from "@/components/brand/safe-mark";
import Image from "next/image";
import { Objections, reglesObjections, type Objection } from "./objections";
import { HeroLiveApp } from "@/components/public-site/HeroLiveApp";
import { MENU_PRINCIPAL } from "@/components/public-site/menu-principal";
import { SafeMark } from "@/components/branding/SafeLogo";
import { AnimationsRecit } from "@/components/public-site/recit";
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
    --green: var(--si-ink-strong);
    --forest: var(--si-ink-strong);
    --verified: var(--si-verified);
    --amber: var(--si-amber-ink);
    --line: var(--si-line);
    --line-soft: var(--si-line2);
    /* La serif ne sert plus aux TITRES depuis le 2026-08-25 (demande CEO) :
       ils sont tous passes en Geist, comme les heros. Elle reste declaree
       parce qu'elle porte encore la voix citee de /a-propos, et parce qu'une
       page peut vouloir la serif deliberement plutot que par defaut. */
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
    /* Le titre d'ouverture, une seule fois par page.
       Il valait 92 px, ou il occupait la place du produit. Descendu a 48 px, il
       passait SOUS le titre de la premiere section (--t-marque, 56 px) : le
       heros d'une page ne peut pas etre plus petit que le premier argument
       qu'elle avance, sinon la hierarchie ment. Il domine donc --t-marque
       d'environ dix points, sans revenir a l'affiche qui ecrasait la scene. */
    /* Descendu a 38 px le 2026-08-25, cran C3, apres mesure de cursor.com.
       Leur titre fait 26 px et n'a AUCUN sous-texte : tout le reste de leur
       hero est a 16 px. Le notre doit encore expliquer ce qu'est SAFE, il
       garde donc douze pixels d'avance sur le leur. */
    /* Remonte a 34 px le 2026-08-27 en milieu de journee, pour le titre LONG
       de 88 caracteres (« ae9c544 », les quatre domaines). Ce raisonnement ne
       tient plus : le brief de direction artistique du 2026-08-26 21h31 et sa
       maquette validee (SECTION1_titre-54px-valide.png, ~/Downloads) demandent
       le titre COURT d'origine, « Votre cabinet tient ensemble. », et le CEO
       l'a reconfirme le 27 a 5h41. Les deux titres ne sont pas deux options de
       la meme decision, c'est UNE decision : la taille suit la longueur.

       84 px le soir du 26, cran C3 a 26 px le 25, 34 px pour le titre long le
       27 : trois valeurs, trois contextes differents, aucune ne s'applique au
       titre court repris ici.

       54 PX, MESURE DANS LA MAQUETTE VALIDEE, PAS DEVINE. Hauteur de capitale
       du « V » de « Votre » : 78px sur l'image a 2x (2880px de large pour une
       page de 1440), soit 39px reel. SAFE Grotesk porte sa capitale a 718
       milliemes d'em (LISEZ-MOI.md) : 39 / 0,718 = 54,3. Le nom du fichier et
       la mesure des pixels s'accordent.

       Domine --t-marque (22px) de 32 points, largement au-dela des « dix
       points » de la regle informelle ecrite plus haut : cette regle valait
       pour un hero SANS colonne de description a cote, la maquette validee en
       a une, et un titre court porte davantage de poids visuel a lui seul. */
    --t-affiche: clamp(26px, 2.5vw, 36px);
    /* Descendu de 46 px a 33 px le 2026-08-25. Le hero est passe a 38 px au
       cran C3 : un titre de section a 46 px pesait donc PLUS que le titre de
       la page, et la hierarchie disait le contraire de la verite. Il reste
       cinq pixels sous le hero, ce qui suffit tant que les deux ne partagent
       pas la meme fonte. */
    --t-marque: clamp(19px, 1.7vw, 22px);
    --t-titre: clamp(26px, 3.1vw, 40px);     /* le sous-titre qui développe la marque */
    --t-argument: clamp(19px, 1.75vw, 24px); /* la phrase mise en avant d'un point */
    --t-corps: clamp(16px, 1.25vw, 18px);    /* la prose */
    /* ── La prose qui EXPLIQUE ────────────────────────────────────────────
       Demande CEO du 2026-08-26 : tous les textes d'explication prennent la
       taille de la phrase de tete, celle qui commence par « La fragmentation
       de vos dossiers ». Elle valait 21 px et n'etait ecrite nulle part comme
       mesure : chaque bloc avait la sienne, et la page en portait SIX, 13,
       14, 16, 18, 21 et 24.

       La regle qui les separe : ce qui developpe une idee prend cette taille,
       ce qui LEGENDE un chiffre ou nomme un endroit garde --t-detail. Une
       metadonnee sous un montant n'est pas une explication ; la passer a
       21 px ferait un mur et rendrait le chiffre secondaire. */
    --t-explique: clamp(18px, 1.55vw, 21px);
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

  /* ── Les rubriques deroulantes ──────────────────────────────────────────
     Une rubrique n'ouvre un menu que si elle a au moins deux destinations
     REELLES. Le contenu vit dans menu-principal.ts, ecrit une seule fois pour
     les deux barres du site.

     Ouverture au survol ET au focus : un menu qui ne s'ouvre qu'a la souris
     n'existe pas pour qui navigue au clavier. Le chevron tourne, seul
     mouvement de la barre. */
  .xc #nav .grp { position: relative; }
  .xc #nav .grp > a { display: inline-flex; align-items: center; gap: 6px; }
  .xc #nav .grp > a .chev {
    width: 7px; height: 7px; border-right: 1.4px solid currentColor;
    border-bottom: 1.4px solid currentColor; transform: translateY(-2px) rotate(45deg);
    transition: transform 160ms ease; opacity: 0.55;
  }
  .xc #nav .grp:hover > a .chev,
  .xc #nav .grp:focus-within > a .chev { transform: translateY(1px) rotate(-135deg); opacity: 0.9; }
  .xc #nav .drop {
    position: absolute; top: calc(100% + 10px); left: -6px; z-index: 40;
    min-width: 268px; padding: 6px;
    background: var(--si-surface);
    border: 1px solid var(--si-border);
    border-radius: 12px;
    box-shadow: 0 1px 2px rgb(var(--si-line-ink-rgb) / 0.06),
                0 22px 48px -26px rgb(var(--si-line-ink-rgb) / 0.34);
    opacity: 0; visibility: hidden; transform: translateY(-4px);
    transition: opacity 140ms ease, transform 140ms ease, visibility 140ms;
  }
  .xc #nav .grp:hover .drop,
  .xc #nav .grp:focus-within .drop { opacity: 1; visibility: visible; transform: none; }
  .xc #nav .drop a {
    display: block; padding: 9px 11px; border-radius: 8px;
    color: var(--si-ink); font-size: 13px; line-height: 1.3;
  }
  .xc #nav .drop a span {
    display: block; margin-top: 2px; font-size: 11px; color: var(--si-muted);
  }
  .xc #nav .drop a:hover { background: rgb(var(--si-line-ink-rgb) / 0.05); color: var(--si-ink); }
  /* Le pont invisible : sans lui, le curseur qui descend vers le menu passe
     par un vide de dix pixels et le menu se referme sous la souris. */
  .xc #nav .grp::after {
    content: ""; position: absolute; top: 100%; left: 0; right: 0; height: 12px;
  }
  .xc #nav .navright { display: flex; align-items: center; gap: 6px; }
  .xc #nav .signin {
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13px;
    color: var(--si-muted);
    transition: color 140ms ease;
  }
  .xc #nav .signin:hover { color: var(--si-ink); }
  /* Le chemin tiede, ajoute le 2026-08-24.
     La barre ne portait que deux intentions : « je suis deja client » et
     « je veux m'engager ». Entre les deux, un visiteur qui veut simplement
     parler a quelqu'un n'avait nulle part ou aller, et l'evaluation est un
     engagement eleve. Contour seulement : une seule action pleine par barre. */
  .xc #nav .parler {
    display: none;
    align-items: center;
    height: 36px;
    padding: 0 15px;
    border-radius: 8px;
    border: 1px solid var(--si-border);
    background: var(--si-surface);
    color: var(--si-ink);
    font-size: 13px;
    transition: border-color 140ms ease;
  }
  .xc #nav .parler:hover { border-color: var(--si-border-strong); }
  @media (min-width: 861px) { .xc #nav .parler { display: inline-flex; } }
  /* Une seule action pleine dans la barre, en noir. */
  .xc #nav .cta {
    display: inline-flex;
    align-items: center;
    height: 36px;
    padding: 0 16px;
    border-radius: 8px;
    background: var(--si-ink-strong);
    color: var(--si-surface);
    font-size: 13px;
    /* 400 comme le bouton du hero : aucun gras dans le discours de la page. */
    font-weight: 400;
    transition: background-color 140ms ease;
  }
  .xc #nav .cta:hover { background: var(--si-ink-strong-soft); }

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
  /* Le seuil monte de 1400 à 1600 px : les écrans de démonstration occupent
     maintenant toute leur colonne, donc la marge où vivait le rail appartient
     de nouveau au contenu en dessous de 1600. */
  @media (max-width: 1599px) {
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
  /* Raccourcie le 2026-08-24 : 250vh valaient 2 250 px sur une vue de 900,
     soit deux ecrans et demi avant que la premiere section commence. Le
     produit doit etre visible avant le bas du premier ecran. Consequence
     assumee, ecrite plus haut : la scene se joue sur (hauteur - 100vh), donc
     raccourcir accelere la cadence. */
  /* Raccourcie une seconde fois le 2026-08-25 : 160vh valaient encore 1 440 px
     sur une vue de 900, soit six cents pixels de defilement APRES que
     l'application soit entierement visible. Sans animation d'ouverture, cette
     course ne sert plus rien : elle etait la reserve dont l'assemblage avait
     besoin. 118vh laissent la fenetre se poser puis rendent la main. */
  .xc #zone-hero { height: 118vh; }
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
  /* ── Le cadre de l'ouverture ──────────────────────────────────────────────
     Il porte .capture : même filet, même rayon, même débordement, même fondu
     du bas que les fenêtres des sections. L'alignement des deux illustrations
     n'est donc plus un calcul, c'est la même règle.

     L'extrait est dessiné dans une boîte logique fixe puis ramené à la largeur
     du cadre par une seule mesure au montage. Le rayon de l'extrait tombe :
     c'est le cadre qui arrondit maintenant. */
  .xc #hero-cadre > * { pointer-events: auto; }

  .xc #hero-app {
    position: relative;
    /* Même boîte logique que FRAME_W / FRAME_H plus bas dans ce fichier : les
       deux doivent bouger ensemble, sinon le canevas d'assemblage dépose le
       logo à côté du repère. */
    width: 1360px;
    height: 640px;
    transform-origin: top left;
    background: var(--si-canvas);
    overflow: hidden;
    /* Inerte tant que le script n'a pas posé l'échelle : on n'attrape pas un
       menu qui n'est pas encore à sa place. */
    pointer-events: none;
    font-size: 13px;
    color: var(--si-ink);
    text-align: left;
  }
  .xc #hero-app.live { pointer-events: auto; }

  /* ── Le cadre du logiciel et son fondu ─────────────────────────────────────
     Demande CEO du 2026-08-24 : « des contours et un fondu a la fin ».

     Une capture posee a plat dans le flux se lit comme une illustration. Un
     bord ferme, des coins arrondis et une ombre a trois couches disent que ce
     rectangle est une application, sans qu'un mot ait a le dire. Le bord est
     nettement plus ferme que les filets de la page : un filet de section et le
     bord d'une fenetre ne racontent pas la meme chose.

     Le fondu du bas est un MASQUE, pas un degrade pose par-dessus : un degrade
     vers une couleur fixe se voit des que le fond change, et il faudrait le
     repeindre a chaque reskin. Le masque, lui, laisse passer le fond quel
     qu'il soit. Consequence assumee : un masque coupe l'ombre portee, qui est
     peinte hors de la boite. L'elevation vient donc du liseré clair interieur
     et de l'ombre de contact, tous deux a l'interieur du masque, et l'ombre
     longue est portee par le CADRE parent, qui n'est pas masque. */
  /* Le cadre rentre dans la colonne de la page (demande CEO du 2026-08-26).
     Il occupait toute la largeur de la fenetre, donc l'application commencait
     au bord de l'ecran quand le titre commencait a 140. Il prend le meme
     rembourrage que les sections : un seul calcul, un seul bord. */
  /* Le cadre rentre dans la colonne de la page (demande CEO du 2026-08-26).
     Il occupait toute la largeur de la fenetre, donc l'application commencait
     au bord de l'ecran quand le titre commencait a 140.

     C'est une CONTRAINTE de boite et non un rembourrage. Le script mesure la
     largeur du cadre pour dimensionner l'extrait : un rembourrage laissait la
     boite a 1440, l'extrait etait donc calcule pour 1440 puis pousse vers la
     droite, et il debordait. Une largeur maximale donne au script la bonne
     mesure des le montage. */
  .xc #hero-cadre {
    filter: drop-shadow(0 28px 64px rgb(var(--si-line-ink-rgb) / 0.30));
  }
  .xc #hero-app.live {
    border: 1px solid rgb(var(--si-line-ink-rgb) / 0.20);
    border-radius: 14px;
    box-shadow:
      inset 0 1px 0 rgb(var(--si-surface-rgb) / 0.85),
      0 2px 6px -2px rgb(var(--si-line-ink-rgb) / 0.16);
    -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 78%, transparent 100%);
    mask-image: linear-gradient(to bottom, #000 0%, #000 78%, transparent 100%);
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
  }

  /* Barre de navigation du produit */
  /* La barre est une CARTE FLOTTANTE, pas un bandeau colle au bord.
     Demande CEO du 2026-08-27, « inspire-toi reellement de la vraie
     interface ». Releve sur docs/design/references-app/tableau-de-bord.png :
     l'application detache sa barre des quatre bords, l'arrondit et la pose sur
     le canevas. Une barre collee au bord se lit comme un en-tete de site ; une
     barre detachee se lit comme la fenetre d'un logiciel. */
  .xc #hero-app .ha-nav {
    display: flex;
    align-items: center;
    gap: 14px;
    height: 46px;
    margin: 10px 12px 0;
    padding: 0 14px;
    background: var(--si-surface);
    border: 1px solid var(--si-line);
    border-radius: 12px;
    box-shadow: 0 1px 2px rgb(var(--si-ink-strong-rgb) / 0.04);
  }
  /* L'icone qui precede chaque menu. Elle existe dans l'application et
     manquait ici : sans elle la barre n'a plus le rythme du produit, elle a
     celui d'un menu de site. */
  .xc #hero-app .ha-item .ico {
    display: inline-block;
    width: 13px; height: 13px;
    margin-right: 5px;
    vertical-align: -2px;
    opacity: 0.75;
  }
  .xc #hero-app .ha-item .ico svg { display: block; width: 100%; height: 100%; }
  .xc #hero-app .ha-brand {
    display: flex; align-items: center; gap: 7px;
    font-weight: 600; font-size: 13px; letter-spacing: 0.04em;
  }
  /* La pastille porte le vert de la marque, pas le --si-ink-strong : celui-ci vaut
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
  /* La navigation est CENTRÉE dans la barre, pas accrochée à la marque.
     Header.tsx pose sa nav en flex-1 justify-center entre deux groupes
     shrink-0. La réplique la collait derrière le nom du cabinet, ce qui
     laissait tout le vide à droite et donnait le rythme d'un menu de site. */
  .xc #hero-app .ha-menu {
    display: flex; align-items: center; gap: 2px;
    flex: 1 1 auto; min-width: 0;
    justify-content: center;
  }
  .xc #hero-app .ha-item {
    position: relative;
    display: flex; align-items: center; gap: 5px;
    padding: 6px 10px;
    border-radius: 7px;
    font-size: 12px;
    color: var(--si-muted);
    cursor: pointer;
    white-space: nowrap;
  }
  /* Le survol est porté par .safe-zoom-menu (app/globals.css), la grammaire
     canonique du produit : l'élévation dit « sélectionnable », jamais un aplat.
     On ne redéfinit surtout pas :hover ici, un sélecteur avec #id l'emporterait
     sur la classe globale et la vitrine se remettrait à diverger du produit. */
  .xc #hero-app .ha-item:hover { color: var(--si-ink); }
  /* « Vous êtes ici » se dit par l'ENCRE SEULE. Header.tsx bascule la couleur
     du texte de si-muted vers si-ink, et rien d'autre. La réplique peignait
     une pastille bordée que la barre ne dessine jamais, et cette pastille se
     lisait comme un onglet sélectionné. */
  .xc #hero-app .ha-item.on {
    color: var(--si-ink);
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
  /* Le raccourci clavier dans le champ de recherche : c'est lui qui dit qu'on
     est dans un logiciel et non sur un site. */
  .xc #hero-app .ha-search .kbd {
    margin-left: auto;
    padding: 1px 4px;
    border: 1px solid var(--si-line);
    border-radius: 4px;
    font-family: var(--mono);
    font-size: 9px;
    line-height: 1.3;
    color: var(--si-muted);
  }
  .xc #hero-app .ha-cloche {
    position: relative;
    display: block;
    width: 15px; height: 15px;
    color: var(--si-muted);
  }
  .xc #hero-app .ha-cloche svg { display: block; width: 100%; height: 100%; }
  /* La pastille de notification. Le seul rouge de la fenetre, et il porte un
     compte reel : c'est une alerte, pas une decoration. */
  .xc #hero-app .ha-cloche .pastille {
    position: absolute;
    top: -4px; right: -4px;
    min-width: 11px; height: 11px;
    padding: 0 2px;
    border-radius: 999px;
    background: var(--si-danger-ink, #a32d2d);
    color: #fff;
    font-family: var(--sans);
    font-size: 8px;
    font-style: normal;
    line-height: 11px;
    text-align: center;
  }
  .xc #hero-app .ha-temps {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px;
    color: var(--si-muted);
  }
  .xc #hero-app .ha-temps svg { display: block; width: 12px; height: 12px; }
  .xc #hero-app .ha-search {
    display: flex; align-items: center;
    width: 154px; height: 26px;
    padding: 0 9px;
    border: 1px solid var(--si-line);
    border-radius: 7px;
    font-size: 11px;
    color: var(--si-muted);
    background: var(--si-surface);
    white-space: nowrap;
    overflow: hidden;
  }
  /* Le commutateur de langue : un étui clair, et la langue courante posée
     dessus en gris pâle. LocaleSwitcher.tsx teinte le bouton actif en
     primary-100 sur un étui blanc bordé, et cette rampe vaut un gris très
     clair, pas l'encre pleine. La réplique remplissait le bouton actif en
     noir, ce qui en faisait l'objet le plus lourd de la barre alors que ce
     n'est qu'un réglage. */
  .xc #hero-app .ha-lang {
    display: flex; gap: 2px;
    padding: 2px;
    border: 1px solid var(--si-line); border-radius: 7px;
    background: var(--si-surface);
    font-size: 11px;
  }
  .xc #hero-app .ha-lang span { padding: 3px 6px; border-radius: 5px; color: var(--si-muted); }
  .xc #hero-app .ha-lang span.on {
    background: rgb(var(--si-ink-strong-rgb) / 0.09);
    color: var(--si-ink);
  }
  .xc #hero-app .ha-avatar {
    width: 24px; height: 24px; border-radius: 50%;
    background: var(--si-ink-strong); color: var(--si-surface);
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
    font-size: 12px;
    color: var(--si-ink);
    cursor: pointer;
  }
  /* Entrée listée mais sans écran dans l'extrait. Elle ne se soulève pas :
     « ce qui se soulève doit s'ouvrir » (components/ui/rangee-ouvrable.ts).
     Promettre un geste inexistant apprend à l'œil à se méfier de l'animation. */
  .xc #hero-app .ha-drop a.inerte { color: var(--si-muted); cursor: default; }

  /* Bandeau d'état */
  /* Pastille arrondie et detachee, comme dans l'application. Elle vit
     maintenant DANS le corps du tableau de bord, entre la carte d'action et
     les montants, a la meme marge que les cartes : c'est la position que lui
     donne DashboardViewSafe.tsx, et elle n'existe que sur cet ecran. */
  .xc #hero-app .ha-strip {
    display: flex; align-items: center; gap: 13px;
    height: 32px;
    margin-top: 11px;
    padding: 0 14px;
    border-radius: 10px;
    background: var(--si-ink-strong);
    color: var(--si-surface);
    font-size: 11px;
  }
  .xc #hero-app .ha-strip .s { display: flex; align-items: center; gap: 6px; opacity: 0.92; }
  .xc #hero-app .ha-strip .s i {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--si-verified-on-forest);
  }
  .xc #hero-app .ha-strip .s.warn i { background: var(--si-amber-on-forest, #E0B54A); }
  .xc #hero-app .ha-strip .s b { font-weight: 600; }
  /* Le filet vertical entre deux mesures, comme ComplianceStrip. Sans lui, les
     trois couples libelle/valeur se lisent comme une seule phrase. */
  .xc #hero-app .ha-strip .sep {
    width: 1px; height: 13px;
    background: rgb(var(--si-surface-rgb) / 0.16);
  }
  /* La date est en chasse fixe dans l'application (font-mono), et c'est ce
     qui la range du cote des donnees plutot que du texte. */
  .xc #hero-app .ha-strip .date { margin-left: auto; opacity: 0.7; font-family: var(--mono); font-size: var(--t-menu); }

  /* Corps */
  .xc #hero-app .ha-body { padding: 12px 12px 14px; }
  /* Le titre de page. L'application en porte un, grand, sous la barre ; la
     replique n'en avait aucun et enchainait la barre sur une carte, ce qui lui
     donnait l'air d'un panneau et non d'un ecran. */
  .xc #hero-app .ha-titre {
    margin: 4px 2px 10px;
    font-family: var(--sans);
    font-size: 19px;
    font-weight: 400;
    letter-spacing: -0.014em;
    color: var(--si-ink);
  }
  /* L'en-tete de la carte d'action : le bouton passe A DROITE, sur la ligne du
     titre, comme dans l'application. Il etait empile dessous, ce qui allongeait
     la carte et cassait la lecture « ce qu'il y a a faire / le faire ». */
  .xc #hero-app .ha-tete {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }
  .xc #hero-app .ha-tete .ha-act { flex: none; margin-top: 2px; }
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
    font-family: var(--sans); font-weight: 400;
    font-size: 21px; line-height: 1.1; margin-top: 5px;
    letter-spacing: -0.015em;
  }
  .xc #hero-app .ha-tiles {
    display: grid; grid-template-columns: repeat(5, 1fr); gap: 9px; margin-top: 11px;
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
    font-size: 16px; letter-spacing: -0.02em; margin-top: 2px;
  }
  .xc #hero-app .ha-tile.amber .val { color: var(--si-amber-on-forest, #E7C36A); }
  .xc #hero-app .ha-cols {
    display: grid; grid-template-columns: 1.42fr 1fr; gap: 11px; margin-top: 11px;
  }
  .xc #hero-app .ha-act {
    display: inline-flex; align-items: center;
    height: 30px; padding: 0 13px;
    border-radius: 8px;
    background: var(--si-ink-strong); color: var(--si-surface);
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
  .xc #hero-app .ha-kv .v { font-family: var(--mono); font-size: 11px; }
  /* Le titre d'une carte. CardTitle (components/ui/Card.tsx) vaut 20 px,
     graisse normale, encre pleine. La replique l'ecrivait a 12 px en gras :
     un titre de carte y devenait plus petit que le corps qu'il annonce, et
     gras la ou l'application ne l'est jamais. Ramene a l'echelle de la
     fenetre, c'est 16 px. */
  .xc #hero-app .ha-ptitle,
  .xc #hero-app .ha-titre-carte {
    font-family: var(--sans);
    font-size: 16px; font-weight: 400; line-height: 1.2;
    letter-spacing: -0.012em;
    color: var(--si-ink);
    margin-top: 4px; margin-bottom: 8px;
  }
  .xc #hero-app .ha-mini { font-size: 11px; color: var(--si-muted); margin-top: 3px; }

  /* ── Les deux alertes de la carte d'action ────────────────────────────────
     BandeauAction les separe du bloc par un filet, pose une puce de 6 px
     (ambre pour un retard ou le fideicommis, verte sinon) et pousse une
     fleche oblique a droite. La replique n'avait AUCUNE regle pour ces
     classes : les deux lignes tombaient en texte nu. */
  .xc #hero-app .ha-alertes {
    margin-top: 11px;
    padding-top: 8px;
    border-top: 1px solid var(--si-line2);
  }
  .xc #hero-app .ha-bullet {
    display: flex; align-items: center; gap: 9px;
    margin: 0 -6px;
    padding: 4px 6px;
    border-radius: 8px;
    font-size: 12px;
    color: var(--si-body);
    cursor: pointer;
  }
  .xc #hero-app .ha-bullet i {
    width: 6px; height: 6px; flex: none;
    border-radius: 50%;
    background: var(--si-verified);
  }
  .xc #hero-app .ha-bullet i.warn { background: var(--si-amber); }
  .xc #hero-app .ha-bullet b {
    margin-left: auto;
    font-weight: 400;
    font-size: 12px;
    color: var(--si-muted);
  }

  /* ── Flux du cabinet et Vos performances, cote a cote ─────────────────────
     lg:grid-cols-[1.7fr_1fr] dans DashboardViewSafe. Empilees, les deux
     cartes etiraient le diagramme sur toute la fenetre. */
  .xc #hero-app .ha-flux-rangee {
    display: grid; grid-template-columns: 1.7fr 1fr; gap: 11px;
    margin-top: 11px;
    align-items: start;
  }

  /* ── Le diagramme, recopie de CashflowChart.tsx ───────────────────────────
     Il n'existait qu'en balisage : pas une seule de ses huit classes n'avait
     de regle, donc « Facture » et « Encaisse » se collaient en un mot et les
     colonnes ne se dessinaient pas. Le CEO l'a vu dans le fondu de la page. */
  .xc #hero-app .ha-legend {
    display: flex; align-items: center; gap: 14px;
    margin-bottom: 11px;
  }
  .xc #hero-app .ha-legend-i {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; color: var(--si-body);
  }
  .xc #hero-app .ha-legend-i i {
    width: 9px; height: 9px; border-radius: 3px;
    /* Le facture n'est qu'une creance : il reste gris. L'encaisse est ce qui
       est reellement rentre, il prend le vert de l'etat valide. */
    background: var(--si-border-strong);
  }
  .xc #hero-app .ha-legend-i.verified i { background: var(--si-verified); }
  /* La bascule 6 / 12 mois, a droite de la legende. */
  .xc #hero-app .ha-fenetre { display: flex; align-items: center; gap: 3px; margin-left: auto; }
  .xc #hero-app .ha-fenetre span {
    padding: 2px 7px; border-radius: 6px;
    font-size: 11px; color: var(--si-muted);
  }
  .xc #hero-app .ha-fenetre span.on { background: var(--si-surface2); color: var(--si-ink); }

  .xc #hero-app .ha-plot { display: flex; align-items: flex-start; gap: 8px; }
  /* L'axe des montants, en forme courte (« 28 k$ »), comme la fonction
     compact() du composant reel. Les cinq etiquettes sont centrees sur les
     cinq filets : d'ou la boite plus haute de 10 px et le retrait de 5 px. */
  .xc #hero-app .ha-axe {
    display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end;
    width: 40px; height: 142px; margin-top: -5px;
    font-size: 10px; line-height: 10px; color: var(--si-muted);
  }
  .xc #hero-app .ha-bars {
    position: relative;
    flex: 1;
    display: flex; align-items: flex-end; justify-content: space-around;
  }
  /* Grille HORIZONTALE seule, en retrait : elle sert la lecture, elle ne la
     dispute pas (CartesianGrid vertical={false}). */
  .xc #hero-app .ha-grille {
    position: absolute; left: 0; right: 0; top: 0;
    height: 132px;
    display: flex; flex-direction: column; justify-content: space-between;
  }
  .xc #hero-app .ha-grille i { height: 1px; background: var(--si-line2); }
  .xc #hero-app .ha-bar-grp {
    position: relative; z-index: 1;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
  }
  .xc #hero-app .ha-bar-pair { display: flex; align-items: flex-end; gap: 4px; height: 132px; }
  /* Le relief est porte par la matiere, jamais par la geometrie : degrade
     vertical, capuchon arrondi, ombre au sol. La hauteur reste mesuree sur un
     axe plat, sinon le diagramme ment. */
  .xc #hero-app .ha-bar {
    width: 24px;
    border-radius: 4px 4px 0 0;
    background: linear-gradient(180deg,
      rgb(var(--si-border-strong-rgb) / 0.76) 0%,
      var(--si-border-strong) 100%);
    box-shadow: 0 4px 7px -3px rgb(var(--si-ink-rgb) / 0.2);
  }
  .xc #hero-app .ha-bar.v {
    background: linear-gradient(180deg,
      rgb(var(--si-verified-rgb) / 0.8) 0%,
      var(--si-verified) 100%);
  }
  .xc #hero-app .ha-bar-lbl { font-size: 10px; color: var(--si-muted); }
  /* Le repli textuel : le diagramme n'est jamais le seul porteur du chiffre. */
  .xc #hero-app .ha-repli { margin-top: 9px; font-size: 11px; color: var(--si-muted); }

  /* Les cinq ratios, filet a partir du deuxieme, valeur en chasse fixe. */
  .xc #hero-app .ha-perf { padding: 8px 0; }
  .xc #hero-app .ha-perf.filet { border-top: 1px solid var(--si-line2); }
  .xc #hero-app .ha-perf .ligne {
    display: flex; align-items: baseline; justify-content: space-between; gap: 10px;
  }
  .xc #hero-app .ha-perf .k { font-size: 12px; color: var(--si-body); }
  .xc #hero-app .ha-perf .v {
    font-family: var(--mono); font-size: 14px; color: var(--si-ink);
  }
  .xc #hero-app .ha-perf .v.amber { color: var(--si-amber-ink); }
  .xc #hero-app .ha-perf .a { margin-top: 2px; font-size: 10.5px; color: var(--si-muted); }

  /* ── La navette, recopiee de LawyerGlance.tsx ─────────────────────────────
     Autre bloc sans une seule regle. Le compte est a droite du titre, le
     numero de dossier est une PASTILLE bordee et non un suffixe colle au type
     par un point median, et chaque message porte son invite « Ouvrir ». */
  .xc #hero-app .ha-navette-tete { display: flex; align-items: baseline; gap: 6px; }
  .xc #hero-app .ha-navette-tete .ha-titre-carte { margin-bottom: 0; }
  .xc #hero-app .ha-navette-tete .ha-mini { margin-top: 0; }
  .xc #hero-app .ha-navette-tete .compte {
    margin-left: auto;
    padding: 1px 8px; border-radius: 999px;
    background: rgb(var(--si-ink-strong-rgb) / 0.08);
    color: var(--si-ink-strong);
    font-family: var(--mono); font-size: 11px;
  }
  .xc #hero-app .ha-nav-item {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 9px 0;
    border-top: 1px solid var(--si-line2);
  }
  .xc #hero-app .ha-nav-item:first-child { border-top: 0; }
  .xc #hero-app .ha-nav-ico {
    flex: none;
    width: 27px; height: 27px; border-radius: 7px;
    display: grid; place-items: center;
    font-size: 12px;
    background: rgb(var(--si-ink-strong-rgb) / 0.06); color: var(--si-ink-strong);
  }
  .xc #hero-app .ha-nav-ico.warn {
    background: rgb(var(--si-amber-rgb) / 0.13); color: var(--si-amber-ink);
  }
  .xc #hero-app .ha-nav-item .txt { display: block; min-width: 0; flex: 1; }
  .xc #hero-app .ha-nav-item .entete { display: flex; align-items: center; gap: 7px; }
  .xc #hero-app .ha-nav-item .type {
    font-size: 10px; letter-spacing: 0.07em; text-transform: uppercase;
    color: var(--si-muted);
  }
  .xc #hero-app .ha-nav-item .ref {
    padding: 1px 6px; border-radius: 6px;
    border: 1px solid var(--si-line); background: var(--si-canvas);
    font-size: 10.5px; color: var(--si-muted);
  }
  .xc #hero-app .ha-nav-item .body {
    display: block; margin-top: 4px;
    font-size: 12.5px; color: var(--si-ink);
  }
  .xc #hero-app .ha-nav-item .who {
    display: block; margin-top: 2px;
    font-size: 11px; color: var(--si-muted);
  }
  .xc #hero-app .ha-nav-item .ouvrir {
    display: inline-flex; align-items: center; gap: 5px;
    margin-top: 6px;
    font-size: 11px; color: var(--si-ink-strong);
  }
  .xc #hero-app .ha-nav-item .ouvrir b { font-weight: 400; }

  /* ── L'etat des obligations, recopie de ds-safe/sections.tsx ──────────────
     Deux colonnes, un filet en haut de chaque ligne, un carre d'etat teinte
     (vert quand c'est fait, ambre quand ca reste a faire) et le compte en
     chasse fixe a droite. Troisieme bloc qui n'avait aucune regle. */
  .xc #hero-app .ha-oblig-grid {
    display: grid; grid-template-columns: 1fr 1fr; column-gap: 30px;
  }
  .xc #hero-app .ha-oblig-item {
    display: flex; align-items: center; gap: 11px;
    padding: 9px 0;
    border-top: 1px solid var(--si-line2);
  }
  .xc #hero-app .ha-oblig-ico {
    flex: none;
    width: 21px; height: 21px; border-radius: 6px;
    display: grid; place-items: center;
    font-size: 11px;
    background: rgb(var(--si-verified-rgb) / 0.1); color: var(--si-verified);
  }
  .xc #hero-app .ha-oblig-ico.warn {
    background: rgb(var(--si-amber-rgb) / 0.13); color: var(--si-amber-ink);
  }
  .xc #hero-app .ha-oblig-item .txt { display: block; flex: 1; min-width: 0; }
  .xc #hero-app .ha-oblig-item .t { display: block; font-size: 12px; color: var(--si-ink); }
  .xc #hero-app .ha-oblig-item .d {
    display: block; margin-top: 1px;
    font-size: 10.5px; color: var(--si-muted);
  }
  .xc #hero-app .ha-oblig-item .s {
    flex: none;
    font-family: var(--mono); font-size: 10px; color: var(--si-muted);
  }

  /* ── L'activite recente, recopiee d'ActivityCard ──────────────────────────
     Une puce verte, l'action en evidence, l'entite en retrait, puis la date
     relative et l'auteur dessous. C'etait une liste cle/valeur, qui perdait
     l'auteur et ecrasait les deux lignes en une. */
  .xc #hero-app .ha-activite {
    display: flex; align-items: flex-start; gap: 9px;
    padding: 7px 0;
  }
  .xc #hero-app .ha-activite.filet { border-top: 1px solid var(--si-line2); }
  .xc #hero-app .ha-activite .pastille {
    flex: none;
    width: 6px; height: 6px; margin-top: 5px;
    border-radius: 50%;
    background: var(--si-verified);
  }
  .xc #hero-app .ha-activite .txt { display: block; min-width: 0; flex: 1; }
  .xc #hero-app .ha-activite .quoi {
    display: block;
    font-size: 12px; color: var(--si-muted);
  }
  .xc #hero-app .ha-activite .quoi b { font-weight: 500; color: var(--si-ink); }
  .xc #hero-app .ha-activite .quand {
    display: block; margin-top: 1px;
    font-size: 10.5px; color: var(--si-muted);
  }

  /* Registre (écrans Facturation / Comptes) */
  .xc #hero-app table.ha-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
  .xc #hero-app .ha-tbl th {
    text-align: left; font-size: var(--t-menu); letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--si-muted); font-weight: 600;
    padding: 0 8px 7px; border-bottom: 1px solid var(--si-line);
  }
  .xc #hero-app .ha-tbl td { padding: 7px 8px; border-bottom: 1px solid var(--si-line2); }
  .xc #hero-app .ha-tbl td.num { font-family: var(--mono); font-size: 11px; text-align: right; }
  .xc #hero-app .ha-tbl tr:last-child td { border-bottom: 0; }
  .xc #hero-app .ha-tag {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 7px; border-radius: 999px;
    font-size: var(--t-menu);
    background: rgb(var(--si-ink-strong-rgb) / 0.09); color: var(--si-verified);
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
    font-family: var(--mono); font-size: 12px;
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
  /* Remis en service le 2026-08-27 : la maquette validee porte l'exergue
     « SYSTEME DE GESTION POUR CABINETS D'AVOCATS » au-dessus du titre, en
     gris et non en vert -- seul le mot final du titre garde la teinte de
     marque. Le .kicker du reste du site est vert (ligne 240) ; celui du hero
     est donc surcharge ICI seulement, pas au niveau de la regle partagee. */
  /* 16px, la mesure de leur exergue « Agents », relevee au pixel dans leur
     mode CLAIR le 2026-08-27.

     Elle valait 14px une heure plus tot : j'avais mesure un « Agents » de
     sous-menu de navigation, invisible parce que son parent porte une opacite
     nulle, au lieu de celui du hero. Une mesure prise sur le mauvais element
     ne se voit pas dans le chiffre, seulement dans le resultat.

     Le plancher de 11px reste celui des libelles de tableau ; l'exergue
     d'ouverture, lui, se lit avant le titre. */
  /* EN MINUSCULES, demande CEO du 2026-08-27. Cursor ecrit « Agents », pas
     « AGENTS » : leur exergue est une etiquette qui se lit, pas un libelle de
     tableau.

     L'interlettrage tombe avec les capitales. Les 0,09em du « .kicker » du
     site existent parce qu'une suite de capitales se referme sur elle-meme et
     demande a etre aeree ; une minuscule porte deja ses blancs dans son
     dessin, et l'ecarter la delave. */
  .xc #hero-copy .kicker {
    margin-left: 2px;
    color: var(--muted);
    font-size: 16px;
    text-transform: none;
    letter-spacing: normal;
  }
  /* Le titre du hero est en GEIST, la fonte des sous-textes. Demande CEO du
     2026-08-25, apres avoir regarde cursor.com.

     Leur propre fonte, CursorGothic, est une commande privee sans licence
     publique : elle ne se reprend pas. Ce qui se reprend est leur geste, et il
     tient en trois reglages : un gothique, en graisse NORMALE, resserre. Ils
     ne grossissent pas le titre, ils le serrent.

     L'approche laterale change avec la fonte. Le serif demandait -0,055em pour
     rattraper le flanc de sa capitale ; le gothique a un flanc plus droit et
     n'en demande que la moitie. */
  .xc #hero-copy h1 {
    margin-top: 20px;
    font-family: var(--sans);
    font-weight: 400;
    font-size: var(--t-affiche);
    /* ── L'echelle optique de Cursor, mesuree le 2026-08-27 ──────────────────
       Demande CEO : « inspire toi des tailles de cette page ». Relevees sur
       cursor.com/product, toutes en graisse 400, jamais en gras :

           72px  suivi -0,030em  interligne 1,10
           36px  suivi -0,020em  interligne 1,20
           26px  suivi -0,0125em interligne 1,25
           16px  suivi +0,005em  interligne 1,50
           14px  suivi +0,010em  interligne 1,50

       La lecon n'est pas une valeur, c'est une REGLE : le suivi et l'interligne
       suivent la taille. On serre en grand, on ouvre en petit. Leur suivi
       devient meme POSITIF sous 16px, ou une lettre serree se remplit.

       36 PX, LEUR VALEUR EXACTE, mesuree dans leur DOM le 2026-08-27 sur
       cursor.com/fr/product : h1 a 36px, graisse 400, suivi -0,72px, interligne
       43,2px. Le titre valait 54px ici, tire de la maquette ; le CEO a demande
       le meme jour de respecter EXACTEMENT leurs dimensions.

       L'interligne suit leur regle sans reserve : 43,2 / 36 = 1,2.

       LE SUIVI RESTE PLUS SERRE QUE LE LEUR. Mis a leur valeur exacte le
       2026-08-27, le CEO a repondu que les lettres etaient « un peu eloignees
       les unes des autres ». Cursor est une reference, pas une loi : sur sa
       propre marque, c'est son oeil qui tranche.

       Leur suivi vaut -0,020em a 36px. On garde le meme rapport de serrage que
       le CEO a valide, une fois et demie le leur, soit -0,030em effectifs.
       -0,012em de feuille + 0,018 incrustes dans la fonte = -0,030em.

       Verifie : la paire la plus critique est « Vo », dont la diagonale menage
       un blanc naturel, et rien ne se touche avant -0,046em effectifs. */
    line-height: 1.2;
    letter-spacing: -0.012em;
    /* ── L'encre du titre : un gris chaud, pas un presque-noir ──────────────
       Demande CEO du 2026-08-27, « n'oublie pas les differentes couleurs de
       nuances ». Releve au pixel dans le mode clair de cursor.com/product :

           fond         rgb(247, 247, 244)   le notre : rgb(247, 247, 246)
           titre        rgb(38, 37, 30)      le notre : rgb(22, 24, 23)
           gris         rgb(99, 99, 98)      le notre : rgb(102, 106, 103)

       Le gris est deja le bon a trois unites pres. Le titre, lui, etait
       SEIZE unites plus sombre et plus froid que le leur : plus contraste,
       donc plus dur. Leur noir est un gris chaud, ou le rouge domine le bleu
       de huit unites.

       Pose ICI et pas sur « --ink » : ce jeton sert tout le site ET toute
       l'application, ou un registre comptable a besoin de son contraste plein.
       Le hero est le seul endroit ou l'encre a un role d'affiche. */
    color: rgb(38 37 30);
    /* 34ch, la mesure de Cursor : leur bloc de tete fait 810px de large a
       36px. Ramene a 811px sur demande du CEO le 2026-08-27, soit 33,38
       caracteres de notre fonte a cette taille. Le titre et sa suite grise
       partagent cette meme colonne, comme chez eux.

       Valait 22ch pour casser le titre apres « tient », quand il faisait 54px
       et que la description vivait a cote. A 36px la phrase entiere tient sur
       une ligne, et c'est le dessin de Cursor : une ligne noire, la suite en
       gris dessous.

       Historique de la mesure, qui suit toujours la phrase : elle valait 26ch pour le titre
       long de 88 caracteres, 13,4ch avant lui. Chaque fois qu'une seule vaut,
       c'est parce que le titre a change, pas la regle.

       ⚠ 33,38ch valait 811px, mesure fixee par le CEO le 2026-08-27 QUAND la
       description etait empilee dessous et partageait cette colonne. Elle est
       repartie a droite le meme jour : la colonne de gauche fait desormais
       545px, donc cette valeur ne borne plus rien. Elle est conservee telle
       quelle en attendant que le CEO dise a quoi les 811px doivent s'appliquer
       dans le montage a deux colonnes. */
    max-width: 33.38ch;
    /* Compense l'approche latérale de la capitale, pas un décalage arbitraire. */
    margin-left: -0.028em;
  }
    /* Le mot mis en valeur porte exactement le vert du logo, pas l'encre
     de l'action ni le vert de validation. */
  .xc #hero-copy h1 em { font-style: normal; color: var(--si-brand-green); }
  /* ── Le titre a gauche, le sous-titre a DROITE et plus petit ──────────────
     C'est la maquette validee par le CEO, et c'est aussi le contrat que
     dix-huit tetes de section tiennent ailleurs sur le site (« fab1326 »,
     titre a gauche, phrase a droite, meme hauteur).

     J'avais empile les deux au meme corps le 2026-08-27, en copiant la mesure
     du DOM de cursor.com ou le sous-titre est la SUITE de la phrase, meme
     taille, seule la couleur changeant. Le CEO l'a refuse le jour meme :
     « pourquoi tu melanges le sous-titre, mets-le a droite dans une police
     plus petite ».

     La lecon : on prend de Cursor les MESURES du titre, pas leur montage. Leur
     hero n'a qu'une colonne parce qu'il n'a rien a poser a cote ; le notre
     porte une fenetre de produit, et la colonne de droite equilibre le bloc
     au lieu de l'allonger vers le bas. */
  /* « baseline » et non « start » ni « center ».
     Demande CEO du 2026-08-27, « aligne le titre et le sous-titre ».

     « center » centrait les deux blocs l'un sur l'autre : le sous-titre, plus
     haut de trois lignes, demarrait donc BIEN AU-DESSUS du titre.

     « start », qui regit les dix-huit autres tetes de section (« fab1326 »),
     ne conviendrait pas ici. Il aligne les hauts de BOITE, ce qui suffit
     ailleurs parce que titre et sous-titre y font 22 et 21px : deux boites de
     hauteur presque egale. Ici le titre fait 36px et sa boite est 12px plus
     haute, donc des hauts de boite alignes donneraient des TEXTES decales.

     « baseline » aligne les premieres lignes de base, ce que l'oeil lit comme
     « a la meme hauteur » quelles que soient les deux tailles. */
  .xc #hero-copy .hero-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: clamp(32px, 5vw, 88px);
    align-items: baseline;
  }
  /* La taille de toute prose qui EXPLIQUE (regle CEO du 2026-08-26), et non
     celle du titre : c'est ce qui la distingue de la suite de la phrase. */
  .xc #hero-copy .hero-desc {
    font-family: var(--sans);
    font-size: var(--t-explique);
    line-height: 1.5;
    letter-spacing: 0.005em;
    color: var(--muted);
    max-width: 42ch;
  }
  /* Le chapeau d'ouverture est en Geist, la fonte de l'action (demande CEO du
     21 août 2026).

     Il porte la seule énumération de la page : neuf postes d'affilée, puis ce
     qu'on y voit. Une serif de titrage traîne sur ce genre de liste, et la
     première vue est le seul endroit où le chapeau se lit AVANT le titre, pas
     après. Il prend donc la même voix que le bouton qui le suit.

     C'est une exception nommée à la règle du 13 août (« tout ce qui relève du
     discours porte la serif »), et elle s'arrête à la première vue : la prose
     des sections garde la serif. */

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
    /* 36 px quand un chapeau separait l'action du titre. Sans lui, l'action
       repond directement au titre et n'a plus besoin de cette distance. */
    margin-top: 26px;
    margin-left: 5px;
    display: flex;
    align-items: center;
    gap: 22px;
    flex-wrap: wrap;
    pointer-events: auto;
  }
  /* Vert et fleche, pas gris et trait qui s'allonge. Remis en service le
     2026-08-27 : la maquette validee ecrit « Voir SAFE en action → » dans la
     teinte de marque, pas dans --muted. Le trait qui grandit au survol reste
     le bon geste ailleurs (« .more », ligne ~1897) ; ici la fleche glisse de
     3px a la place, seul mouvement qui reste au lien. */
  .xc #hero-copy .hero-second {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 14px;
    color: var(--si-brand-green);
    transition: color 140ms ease;
  }
  .xc #hero-copy .hero-second span {
    display: inline-block;
    transition: transform var(--duree-teinte) ease;
  }
  .xc #hero-copy .hero-second:hover span { transform: translateX(3px); }
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
  .xc .bandeau-reassurance {
    overflow: hidden;
    border-block: 1px solid var(--si-line);
    padding-block: 15px;
    /* Les deux bords s'eteignent, sinon un fait est coupe net au milieu d'un
       mot et l'oeil s'y accroche pour rien. */
    -webkit-mask-image: linear-gradient(to right, transparent, #000 7%, #000 93%, transparent);
    mask-image: linear-gradient(to right, transparent, #000 7%, #000 93%, transparent);
  }
  .xc .ruban { display: flex; width: max-content; animation: xcRuban 42s linear infinite; }
  .xc .bandeau-reassurance:hover .ruban { animation-play-state: paused; }
  .xc .ruban .serie {
    display: flex; align-items: center;
    gap: clamp(34px, 4.4vw, 62px);
    padding-right: clamp(34px, 4.4vw, 62px);
  }
  .xc .ruban b {
    font-family: var(--sans); font-weight: 400;
    font-size: var(--t-detail); color: var(--si-muted); white-space: nowrap;
    display: inline-flex; align-items: center;
    gap: clamp(34px, 4.4vw, 62px);
  }
  /* Le point de separation vit SUR le libelle, pas entre deux libelles : un
     separateur en element se serait duplique avec la copie du ruban. */
  .xc .ruban b::after {
    content: ""; width: 3px; height: 3px; border-radius: 50%;
    background: var(--si-border-strong); flex: 0 0 auto;
  }
  @keyframes xcRuban { from { transform: none; } to { transform: translateX(-50%); } }
  @media (prefers-reduced-motion: reduce) { .xc .ruban { animation: none; } }

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
    font-size: 13px;
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
  .xc #hero-caption {
    margin-top: 18px;
    text-align: center;
    font-family: var(--sans);
    font-size: 13px;
    color: var(--muted);
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
  /* La justification d'une étape ne s'écrit qu'au téléphone.

     Elle avait été remise au large pour que le point se comprenne sans
     attendre la démonstration. Le résultat, mesuré : cinq justifications de
     deux à trois lignes dans une colonne épinglée, soit un pavé de texte à
     côté d'un écran de produit. Linear tient ses sections à vingt-cinq mots et
     met toute la densité DANS le logiciel ; c'est aussi ce que dit la
     direction de la landing (DIRECTION_LANDING_SAFE_INSPIREE_LINEAR §3.4 :
     « la densité est concentrée dans le logiciel, le discours autour reste
     court »).

     Au large, la démonstration est en face du point et elle est visible dès
     l'arrivée : c'est elle qui explique. Au pouce, elle passe SOUS la carte du
     carrousel et n'est plus dans le même regard, donc la phrase reprend son
     utilité. */
  .xc .fi-arg .d, .xc .co-arg .d { display: none; }
  /* Cinq étapes dans une vue épinglée, et la vue peut ne faire que 720 px de
     haut : le point se resserre pour que la colonne tienne sans rogner.
     Mesuré à 1280 par 720, la colonne du parcours passe de 756 à 640 px.
     Trois preuves gardent l'aisance. */
  /* Le retrait des étapes suit la hauteur de la vue, pas une valeur fixe.
     Sur 720 px il fallait serrer pour que les cinq tiennent ; sur 900, ce même
     serrage laissait 200 px de vide au bas de la colonne et un pavé de texte
     en haut. */
  .xc .co-arg { padding-block: clamp(6px, 1.1vh, 15px); }
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
    grid-template-columns: 1.1fr 0.9fr;
    gap: clamp(32px, 4.5vw, 72px);
    /* Les deux colonnes partaient chacune de son propre centre : mesuré à
       1440 x 900, l'écran de démonstration commençait 97 px sous le titre et
       finissait 96 px avant la fin du texte. Rien ne s'alignait sur rien. Elles
       partagent maintenant une arête haute, comme les deux colonnes de toutes
       les sections écrites. */
    align-items: start;
  }
  .xc .co-copy { min-width: 0; }
  .xc .co-copy h2 {
    margin-top: 14px;
    font-family: var(--sans);
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
  /* L'écran occupe toute sa colonne. Il plafonnait à 520 px, ce qui laissait
     une marge morte à sa droite sur les écrans larges : la preuve est ce qu'on
     vient voir, elle prend la place que le discours rend. */
  .xc .co-ecran {
    width: 100%;
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
  .xc .co-vue-zone { position: relative; min-height: 336px; }
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
    font-size: 12px;
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
  .xc .co-item .t { font-size: 13px; color: var(--si-ink); }
  .xc .co-item .s { grid-column: 1; font-size: 11px; color: var(--muted); }
  /* Le montant vit sur l'opération qui le produit, plus dans un bloc à part. */
  .xc .co-item .m {
    grid-column: 2;
    grid-row: 1 / span 2;
    align-self: center;
    font-family: var(--mono);
    font-size: 13px;
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
    font-size: 12px;
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
    grid-template-columns: 0.9fr 1.1fr;
    gap: clamp(32px, 4.5vw, 72px);
    /* Même arête haute que le parcours : l'écart valait 140 px. */
    align-items: start;
  }
  .xc .fi-copy { min-width: 0; }
  .xc .fi-copy h2 {
    margin-top: 16px;
    font-family: var(--sans);
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
  .xc .fi-arg { padding-block: clamp(8px, 1.4vh, 20px); }
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
  .xc .fi-vue-zone { position: relative; min-height: 194px; }
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
  .xc .fi-src .l { font-size: 13px; color: var(--muted); }
  .xc .fi-src .m {
    font-family: var(--mono);
    font-size: 14px;
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
    font-size: 12px;
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
    font-size: 12px;
    line-height: 1.55;
    color: var(--si-amber-ink);
    max-width: 42ch;
  }



  /* ── Le contrat de section ────────────────────────────────────────────────
     Un seul montage pour tous les blocs de récit, tenu du premier au dernier :

       1. le titre, à gauche, deux lignes au plus ;
       2. UNE phrase, à droite, à la même hauteur ;
       3. la scène produit en dessous, sur toute la largeur ;
       4. l'index numéroté des parties du logiciel, s'il y a lieu.

     C'est la grille de Linear, mesurée sur leur page : leurs sections portent
     vingt-cinq mots et toute la densité vit DANS le logiciel montré. La nôtre
     en portait jusqu'à cent quatre-vingts.

     Ce qui disparaît avec ce contrat : les scènes épinglées, leur course de
     défilement, la liste d'étapes à côté de l'écran, le carrousel du téléphone
     et le rail des chapitres. Une section ne se parcourt plus, elle se lit.

     Ce qui reste interdit : les ombres autour d'une scène (un filet suffit),
     les fondus d'apparition sur le texte (voir .dire), et le remplissage de
     l'espace rendu. Le vide entre deux blocs est plus grand que tout ce qu'il
     sépare. */
  .xc .recit {
    padding-block: clamp(96px, 14vh, 176px);
    padding-inline: max(var(--gouttiere), (100% - var(--page)) / 2);
  }
  .xc .recit .inner { max-width: var(--page); margin: 0 auto; }
  .xc .recit .tete {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(32px, 5vw, 88px);
    align-items: start;
  }
  /* Le h1 de l'ouverture et les h2 des sections partagent la règle : sur une
     page de récit, la hiérarchie tient à la position et au vide, pas à une
     septième taille. */
  .xc .recit h1 em { font-style: italic; color: var(--si-brand-green); }
  .xc .recit h1,
  .xc .recit h2 {
    font-family: var(--sans);
    font-weight: 400;
    font-size: var(--t-marque);
    line-height: 1.06;
    letter-spacing: -0.02em;
    max-width: 15ch;
  }

  /* ── La phrase qui accompagne le titre ────────────────────────────────────
     Elle est BICOLORE, et c'est tout son mouvement.

     Linear allume son paragraphe segment par segment pendant le défilement :
     le texte est là depuis le début, ce qui change est son encre. On garde
     l'idée et on retire la dépendance au défilement : la première partie porte
     l'encre pleine, la suite reste en gris. Le contraste dit où commencer,
     sans rien cacher et sans rien animer.

     Aucun fondu d'entrée sur ce bloc : un texte qui apparaît est un texte qui
     manquait une seconde plus tôt. */
  .xc .recit .dire {
    font-family: var(--sans);
    font-size: var(--t-explique);
    line-height: 1.45;
    letter-spacing: -0.006em;
    max-width: 40ch;
    color: var(--muted);
  }
  .xc .recit .dire b { font-weight: 400; color: var(--si-ink); }

  /* ── La scène produit ─────────────────────────────────────────────────────
     Elle prend toute la largeur de la colonne et se pose sur un filet, jamais
     sur une ombre : le référentiel réserve l'élévation à ce qui flotte
     réellement, et une scène ne flotte pas, elle est le contenu.

     La surface est le blanc du produit, sur le canevas de la page : c'est le
     seul écart de teinte, et il suffit à la détacher. */
  /* Une ligne de scène : un libellé, une valeur alignée à droite en mono. */
  .xc .ligne {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: baseline;
    gap: 16px;
    padding: 11px 0;
    border-bottom: 1px solid var(--line2, var(--line));
  }
  .xc .ligne:last-of-type { border-bottom: 0; }
  .xc .ligne .l { font-family: var(--sans); font-size: 13px; color: var(--si-ink); }
  .xc .ligne .l small { color: var(--muted); font-size: 12px; }
  .xc .ligne .v {
    font-family: var(--mono);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    color: var(--si-ink);
  }
  .xc .ligne .v.attente { color: var(--si-amber-ink); }
  .xc .ligne .v.vert { color: var(--verified); }
  /* Le total se sépare par un filet plein, jamais par un fond. */
  .xc .ligne.total { margin-top: 6px; padding-top: 15px; border-top: 1px solid var(--line); border-bottom: 0; }
  .xc .ligne.total .l, .xc .ligne.total .v { font-size: 15px; }
  /* ── La capture d'un écran réel ───────────────────────────────────────────
     Ce ne sont pas des maquettes : ce sont les écrans du Cabinet Demo,
     photographiés sur la version courante de l'application, avec ses vrais
     dossiers, ses vraies heures et ses vrais soldes.

     ── Le cadre ─────────────────────────────────────────────────────────────
     Linear pose ses écrans dans un cadre franchement visible : un filet clair
     à environ 10 % de blanc sur un fond presque noir, des coins arrondis, et
     le contenu tranché par le bord bas. L'objet se lit comme une fenêtre posée
     SUR la page, pas comme une partie d'elle.

     Transposé en clair, à contraste perçu équivalent :

       1. le filet monte à 28 % d'encre, pas les 11 % de --line. Un filet de
          section et le bord d'une fenêtre ne disent pas la même chose et ne
          peuvent pas avoir le même poids. Il porte d'ailleurs seul : la teinte
          à l'intérieur du cadre près des bords est celle du canevas de
          l'application, rien d'autre que le trait ne sépare l'objet du fond ;
       2. les coins s'arrondissent à 16 px, comme une fenêtre, pas comme une
          carte ;
       3. la capture est celle d'une FENÊTRE de 1360 px, pas d'un extrait. À
          cette largeur, la colonne de contenu de l'application remplit presque
          tout et il ne reste que sa marge propre autour. Sans ça, le cadre
          enfermerait des gouttières vides et se lirait comme une image collée
          dans une boîte ;
       4. la barre de navigation de l'application est DANS la capture. Elle en
          avait été retirée tant que la fenêtre n'avait pas de bord : deux
          barres l'une sous l'autre, sans rien pour les séparer, se lisaient
          comme un montage. Le cadre visible tranche la question, et la barre
          est ce qui dit qu'un logiciel a des menus.

     ── La dissolution du bas ────────────────────────────────────────────────
     Le fondu ne porte plus sur l'image seule : il porte sur TOUT l'élément,
     par un masque. Le filet du bas s'éteint donc avec le contenu qu'il borde,
     au lieu de rester net sous une image qui a disparu. Une fenêtre dont trois
     côtés sont tracés et dont le quatrième s'efface se lit comme une fenêtre
     qui continue plus bas ; l'inverse se lit comme un bogue de rendu.

     Conséquence assumée : un masque coupe l'ombre portée, qui est peinte hors
     de la boîte. L'élévation ne vient donc plus d'une ombre mais du SOCLE, plus
     bas dans cette feuille, et d'un filet clair d'un pixel juste sous le bord
     haut, qui allume l'arête supérieure. Les deux tiennent à l'intérieur du
     masque et se dissolvent avec le reste. */
  .xc .capture {
    position: relative;
    margin-top: clamp(56px, 8vh, 104px);
    /* Le débordement se prend sur ce qui RESTE une fois la colonne posée,
       jamais sur un pourcentage de la largeur. Avec 5vw, la fenêtre passait à
       dix pixels du bord de l'écran entre 860 et 1300 px : à ces largeurs la
       gouttière ne vaut que 6vw, et un cadre collé au bord ne se lit plus
       comme un cadre. Sous 1160 px il ne déborde donc pas du tout et s'aligne
       sur la colonne de texte ; au-delà, il prend 14 % de la place gagnée. */
    margin-inline: calc(-1 * clamp(0px, (100vw - var(--page)) * 0.14, 96px));
    border: 1px solid rgb(var(--si-line-ink-rgb) / 0.28);
    border-radius: 16px;
    overflow: hidden;
    background: var(--bg);
    /* L'arête haute, allumée. Une ombre intérieure vit dans la boîte, donc le
       masque la dissout comme le reste, au contraire d'une ombre portée. */
    box-shadow: inset 0 1px 0 rgb(var(--si-surface-rgb) / 0.9);
    -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 72%, transparent 100%);
    mask-image: linear-gradient(to bottom, #000 0%, #000 72%, transparent 100%);
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
  }
  .xc .capture img {
    display: block;
    width: 100%;
    height: auto;
  }

  /* ── Le socle de l'accueil a ete remplace par l'alternance AB ────────────
     Il posait un plan sombre sous chaque section portant une fenetre. Deux de
     ces sections se suivaient, ce qui donnait deux bandes grises collees et
     cassait le rythme demande. L'alternance plus bas fait le meme travail de
     separation et le fait sur toute la page, pas seulement sous les fenetres.

     La classe « socle » elle-meme reste vivante : components/public-site/recit.tsx
     la sert aux autres pages publiques. Seule la copie de l'accueil tombe. */



  /* ── L'apparition au défilement ──────────────────────────────────────────
     Les mêmes règles que le reste du site, écrites ici parce que l'accueil a
     sa propre feuille. Elles doivent bouger avec celles de
     components/public-site/recit.tsx : c'est la seule paire encore en double
     dans le site, et la déduplication est le prochain chantier.

     Deux gestes, de natures différentes. Le BLOC PARAÎT, par opacité et
     translation seulement : les deux seules propriétés qui ne forcent aucun
     recalcul de mise en page. La PHRASE S'ALLUME, mot à mot, du gris à l'encre
     pleine : le texte est là depuis le début, ce qui change est son encre.
     Rien ne surgit, donc rien ne manquait. */
  @media (prefers-reduced-motion: no-preference) {
    .xc [data-parait] {
      opacity: 0;
      transform: translateY(14px);
      transition:
        opacity var(--duree-entree) var(--doux),
        transform var(--duree-entree) var(--doux);
    }
    .xc [data-parait="vu"] { opacity: 1; transform: none; }
    .xc .dire b .mot { color: var(--muted); transition: color 520ms var(--doux); }
    .xc .dire[data-parait="vu"] b .mot { color: var(--si-ink); }
  }

  /* ── L'index des parties du logiciel ──────────────────────────────────────
     Deux colonnes, un filet vertical entre elles, un numéro en mono et un nom.
     Les modules sont NOMMÉS, jamais décrits : c'est ce qui remplace les
     paragraphes qu'on écrivait pour chacun. */
  .xc .index-modules {
    margin-top: clamp(44px, 6vh, 76px);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px clamp(32px, 5vw, 80px);
  }
  .xc .index-modules .mod {
    display: grid;
    grid-template-columns: 44px 1fr;
    align-items: baseline;
    gap: 12px;
  }
  /* Le rang d'un registre est un REPERE, comme le rang d'un chapitre : meme
     jeton, pas une mesure de plus. Cette regle avait une jumelle dans
     recit.tsx, corrigee la seule le 2026-08-25, et l'ecart avait survecu
     ici pendant une journee. */
  .xc .index-modules .mod .n {
    font-family: var(--mono);
    font-size: var(--t-menu);
    color: var(--si-subtle);
  }
  .xc .index-modules .mod .t { font-family: var(--sans); font-size: var(--t-explique); color: var(--si-ink); }
  .xc .index-modules .colonne-droite { border-left: 1px solid var(--line); padding-left: clamp(24px, 4vw, 56px); }

  /* ── Les trois figures ────────────────────────────────────────────────────
     Un fragment de produit, pas une illustration : ce qu'on montre existe à
     l'écran du cabinet. Numérotées en mono, séparées par des filets verticaux,
     légendées en deux temps. */
  .xc .figures {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: clamp(28px, 4vw, 64px);
    margin-top: clamp(56px, 8vh, 104px);
  }
  .xc .figures > * + * { border-left: 1px solid var(--line); padding-left: clamp(28px, 4vw, 64px); }
  /* Les trois cadres n'ont pas le même nombre de lignes : posés tels quels,
     ils finissent à trois hauteurs différentes et les légendes ne s'alignent
     plus. La rangée du cadre prend donc tout ce qui reste, et les trois
     colonnes retrouvent la même arête. */
  .xc .figures > * { display: grid; grid-template-rows: auto 1fr auto auto; }
  .xc .fig-num {
    font-family: var(--mono);
    font-size: var(--t-menu);
    letter-spacing: 0.12em;
    color: var(--si-subtle);
  }
  .xc .fig-cadre {
    margin-top: 18px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--si-surface);
    padding: 16px 18px;
  }
  .xc .fig-titre {
    margin-top: 20px;
    font-family: var(--sans);
    font-size: 15px;
    color: var(--si-ink);
  }
  .xc .fig-dit {
    margin-top: 8px;
    max-width: 34ch;
    font-family: var(--sans);
    font-size: 13px;
    line-height: 1.55;
    color: var(--muted);
  }

  /* ── Les sections écrites ─────────────────────────────────────────────────
     Le problème, la suite, l'équipe, l'offre, les questions et l'appel final
     ne portent aucune interface. Leur hiérarchie tient à trois choses : la
     taille du titre, l'espace entre les groupes, et le filet.

     Une seule règle donne le titre de toutes ces sections. Elle était écrite
     trois fois, une par section, avec trois valeurs proches. */
  /* La phrase qui referme une section : même famille que les titres, un cran
     plus petite, en encre pleine. C'est le point final d'un raisonnement, pas
     un argument de plus. */
  .xc .chute {
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
  .xc .more {
    display: inline-block;
    margin-top: 18px;
    font-family: var(--sans);
    font-size: 14px;
    color: var(--ink);
    border-bottom: 1px solid rgb(var(--si-line-ink-rgb) / 0.22);
    padding-bottom: 2px;
    transition: border-color var(--duree-teinte) ease;
  }
  .xc .more:hover { border-color: var(--si-ink); }
  /* L'exergue d'un bloc secondaire : il nomme le rang de ce qu'on lit
     (SAFE Cabinet, Outils SAFE, Accompagnement), en petites capitales. */
  .xc .rang {
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
  /* La liste porte le poids, la conclusion se cale sur sa fin.

     Les deux colonnes partaient du haut : la liste faisait cinq rangées, le
     commentaire deux paragraphes, et il restait une bande vide de deux cents
     pixels sous le commentaire, en plein milieu de la page. Aligner par le bas
     donne à la section une arête inférieure franche, et met la conclusion là
     où on arrive quand on a fini de lire la liste. */
  /* La liste des cinq endroits prend toute la largeur. Elle vivait dans une
     grille à deux colonnes, avec la conclusion calée en bas à droite : la
     conclusion est maintenant la phrase du contrat de section, en haut, et la
     colonne de droite n'a plus rien à porter. */
  /* ── Le gabarit d'argumentation ─────────────────────────────────────────
     Valide par le CEO le 2026-08-24. Chaque section de l'argumentation suit
     la meme partition, et c'est ce qui la rend lisible d'une section a
     l'autre :
       1. le titre a gauche, une phrase a droite (contrat de recit.tsx) ;
       2. un objet qui resume l'argument d'un coup d'oeil : les cinq endroits
          en pastilles, la chaine des montants, les trois sources ;
       3. LA SCENE : une bande en retrait, et dedans une fenetre a bord marque
          qui montre le vrai ecran ;
       4. la legende du pli, sous la fenetre, jamais dedans ;
       5. la sortie de section.

     La scene est un PLAN distinct : fond en creux, filet en haut. C'est ce qui
     dit, sans un mot, que ce rectangle est un logiciel et non une image. */
  /* La scene n'a PAS de fond a elle (dec. CEO 2026-08-24).
     Une bande grise sous chaque section decoupait la page en tranches et
     ajoutait un troisieme plan qui ne disait rien de plus : le contour de la
     fenetre et son fondu suffisent a dire que ce rectangle est un logiciel.
     Il reste le debordement, qui donne a la scene sa largeur de scene. */
  /* La scene ne deborde plus de sa colonne (demande CEO du 2026-08-26).
     Elle etait tiree de 39 px vers l'exterieur a 1440 : les titres, les
     phrases, les listes et les liens commencaient tous a 140 px, et les
     fenetres seules a 101. Un bord de plus dans une page qui en compte deja
     deux, et l'oeil le voit sans savoir le nommer. */
  .xc .scene-produit {
    margin-top: clamp(40px, 6vh, 72px);
    margin-inline: 0;
  }
  .xc .fenetre-produit {
    margin: 0;
    border: 1px solid rgb(var(--si-line-ink-rgb) / 0.20);
    border-radius: 14px;
    overflow: hidden;
    background: var(--si-surface);
    box-shadow:
      inset 0 1px 0 rgb(var(--si-surface-rgb) / 0.85),
      0 2px 6px -2px rgb(var(--si-line-ink-rgb) / 0.16),
      0 28px 64px -30px rgb(var(--si-line-ink-rgb) / 0.34);
  }
  .xc .fenetre-produit .barre-fenetre {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 14px;
    background: var(--si-canvas);
    border-bottom: 1px solid rgb(var(--si-line-ink-rgb) / 0.12);
    font-family: var(--mono);
    font-size: var(--t-menu);
    color: var(--si-muted);
  }
  .xc .fenetre-produit .pastilles-fenetre { display: flex; gap: 5px; }
  .xc .fenetre-produit .pastilles-fenetre i {
    width: 8px; height: 8px; border-radius: 50%;
    background: rgb(var(--si-line-ink-rgb) / 0.18);
  }
  .xc .fenetre-produit .barre-fenetre em { font-style: normal; color: var(--si-ink); }
  .xc .fenetre-produit .barre-fenetre .ecart { flex: 1; }
  .xc .fenetre-produit img { display: block; width: 100%; height: auto; }
  /* Le fondu du bas, par MASQUE et non par degrade : un degrade vers une
     couleur fixe se voit des que le fond change, un masque laisse passer le
     fond quel qu'il soit. */
  .xc .fenetre-produit.fondue img {
    -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 82%, transparent 100%);
    mask-image: linear-gradient(to bottom, #000 0%, #000 82%, transparent 100%);
  }
  .xc .legende-pli {
    margin-top: 12px;
    display: flex; align-items: center; gap: 10px;
    font-family: var(--mono);
    font-size: var(--t-menu);
    color: var(--si-muted);
  }
  .xc .legende-pli::before {
    content: ""; flex: none; width: 26px; height: 1px;
    background: rgb(var(--si-line-ink-rgb) / 0.24);
  }
  .xc .sortie-section {
    margin-top: clamp(22px, 3vh, 32px);
    padding-top: 16px;
    border-top: 1px solid var(--si-line);
    font-size: var(--t-corps);
  }
  .xc .sortie-section a { color: var(--si-verified); }
  .xc .sortie-section a:hover { text-decoration: underline; text-underline-offset: 3px; }

  /* ── La chaine : la meme somme d'un bout a l'autre ────────────────────────
     C'est l'argument que Cursor ne peut pas faire. Eux montrent un agent qui
     produit un resultat ; ici on montre une somme qu'on peut SUIVRE, de
     l'heure consignee au solde restant. Chaque maillon porte un chiffre reel
     du cabinet de demonstration, et le dernier est plein : c'est celui qui
     reste a rentrer. */
  .xc .chaine {
    display: flex; flex-wrap: wrap; align-items: stretch; gap: 0;
    margin-top: clamp(34px, 4.4vw, 52px);
  }
  .xc .chaine .maillon {
    flex: 1 1 160px; min-width: 0;
    border: 1px solid var(--si-line);
    border-radius: 12px;
    background: var(--si-surface);
    padding: 14px 16px;
    display: flex; flex-direction: column; gap: 4px;
  }
  .xc .chaine .maillon .k {
    font-family: var(--mono); font-size: var(--t-menu);
    letter-spacing: 0.11em; text-transform: uppercase; color: var(--si-muted);
  }
  .xc .chaine .maillon .v {
    font-family: var(--mono); font-size: var(--t-argument);
    font-variant-numeric: tabular-nums; letter-spacing: -0.01em;
  }
  .xc .chaine .maillon .s { font-size: var(--t-detail); color: var(--si-muted); line-height: 1.4; }
  .xc .chaine .maillon.reste {
    border-color: rgb(38 101 74 / 0.34);
    background: rgb(38 101 74 / 0.09);
  }
  .xc .chaine .maillon.reste .v { color: var(--si-verified); }
  /* La deuxieme phrase de la tete de section : elle repond a la premiere.
     Meme mesure, meme encre, un ecart au-dessus. Pas une nouvelle taille. */
  .xc .recit .tete .dire-suite { margin-top: 14px; }

  /* ── La fiche client ─────────────────────────────────────────────────────
     Elle reprend la STRUCTURE de l'ecran client du produit : en-tete et
     actions, onglets, alertes, trois totaux, historique, deux colonnes.
     Aucun motif nouveau, les memes surfaces et les memes filets que le reste
     de la vitrine. Le fond suit le gris actuel, il n'est plus ecrit en dur.

     Chaque bloc porte « anime-bloc » : c'est l'observateur deja present dans
     recit.tsx qui les revele un a un au defilement, avec le geste de la page.
     On n'ajoute pas une animation, on entre dans celle qui existe. */
  .xc .fiche { background: var(--si-canvas); padding: clamp(18px, 2.4vw, 28px); }
  .xc .fiche .fiche-tete {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 20px; flex-wrap: wrap;
  }
  .xc .fiche .retour { font-size: var(--t-menu); color: var(--si-muted); }
  .xc .fiche h4 {
    font-family: var(--sans); font-weight: 400; font-size: var(--t-titre);
    line-height: 1.06; margin-top: 6px; letter-spacing: -0.016em;
  }
  .xc .fiche .actes { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .xc .fiche .actes .bt {
    font-size: var(--t-menu); padding: 6px 12px; border-radius: 8px;
    border: 1px solid var(--si-border); background: var(--si-surface); color: var(--si-ink);
  }
  .xc .fiche .etat {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 11px; border-radius: 999px; font-size: var(--t-menu);
    border: 1px solid rgb(38 101 74 / 0.32); background: rgb(38 101 74 / 0.09);
    color: var(--si-verified);
  }
  .xc .fiche .etat i { width: 5px; height: 5px; border-radius: 50%; background: var(--si-verified); }
  .xc .fiche .onglets-fiche {
    display: flex; gap: 22px; margin-top: 20px;
    /* Le rembourrage vit sur les BOUTONS, pas ici : sinon le trait de
       l'onglet actif se pose 11 px sous le filet et pend dans le vide. Le
       filet reste sur le conteneur, et le trait actif le recouvre. */
    border-bottom: 1px solid var(--si-border); padding-bottom: 0;
    font-size: var(--t-detail); color: var(--si-muted);
  }
  .xc .fiche .onglets-fiche .on { color: var(--si-ink); box-shadow: 0 11px 0 -10px var(--si-ink); }
  .xc .fiche .alertes {
    margin-top: 18px; padding: 14px 18px; border-radius: 10px;
    border: 1px solid rgb(138 100 18 / 0.30); background: rgb(138 100 18 / 0.07);
  }
  .xc .fiche .alertes .ta {
    font-family: var(--mono); font-size: var(--t-menu); letter-spacing: 0.11em;
    text-transform: uppercase; color: var(--si-amber-ink); margin-bottom: 7px;
  }
  .xc .fiche .alertes .al { font-size: var(--t-detail); color: var(--si-ink); margin-top: 3px; }
  .xc .fiche .totaux {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 18px;
  }
  .xc .fiche .tot {
    border: 1px solid var(--si-border); border-radius: 12px;
    background: var(--si-surface); padding: 14px 16px;
  }
  /* Le libelle, le nombre et sa precision sont trois SPANS, donc en ligne par
     defaut. Ils portaient chacun un « margin-top », qui ne fait rien sur un
     element en ligne : les trois se collaient, « ACTIFS43 », « TOTAL948,54 $ »,
     « SOLDE TOTAL89 275,00 $7 clients avec des fonds ».

     La regle existait, mais UNIQUEMENT dans la requete du telephone, ou le
     defaut avait ete vu et corrige. Sur ordinateur il tenait toujours, et le
     CEO l'a releve sur les trois figures le 2026-08-26. Elle remonte ici, ou
     elle vaut pour toutes les largeurs. */
  .xc .fiche .tot .k,
  .xc .fiche .tot .v,
  .xc .fiche .tot .s { display: block; }
  .xc .fiche .tot .k {
    font-family: var(--mono); font-size: var(--t-menu); letter-spacing: 0.11em;
    text-transform: uppercase; color: var(--si-muted);
  }
  .xc .fiche .tot .v {
    font-family: var(--mono); font-size: var(--t-argument); margin-top: 8px;
    font-variant-numeric: tabular-nums;
  }
  .xc .fiche .tot .s { font-size: var(--t-menu); color: var(--si-muted); margin-top: 4px; }
  .xc .fiche .carte-bloc {
    margin-top: 14px; border: 1px solid var(--si-border);
    border-radius: 12px; background: var(--si-surface); overflow: hidden;
  }
  .xc .fiche .carte-bloc .ct {
    display: flex; align-items: baseline; justify-content: space-between; gap: 14px;
    padding: 14px 18px; border-bottom: 1px solid var(--si-border);
  }
  .xc .fiche .carte-bloc .ctt { font-family: var(--sans); font-weight: 400; font-size: var(--t-argument); }
  .xc .fiche .carte-bloc .ct span { font-size: var(--t-menu); color: var(--si-muted); }
  .xc .fiche .lignes { padding: 4px 18px 10px; }
  .xc .fiche .lg {
    display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: baseline;
    padding: 11px 0; border-bottom: 1px solid var(--si-line2, var(--si-line));
    font-size: var(--t-detail);
  }
  .xc .fiche .lg:last-child { border-bottom: 0; }
  .xc .fiche .lg .v { font-family: var(--mono); font-variant-numeric: tabular-nums; color: var(--si-ink); }
  .xc .fiche .lg .v.attente { color: var(--si-amber-ink); }
  .xc .fiche .lg small { color: var(--si-muted); font-size: var(--t-menu); }
  .xc .fiche .duo-fiche { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .xc .fiche .duo-fiche .carte-bloc { margin-top: 14px; }
  /* ── Les pastilles de la fiche dossier ────────────────────────────────────
     Reprises du produit, pas inventees. Dans
     app/(app)/dossiers/[id]/page.tsx, une personne rattachee au cabinet porte
     « border-emerald-200/70 bg-emerald-50 text-emerald-700 » et une partie
     externe « border-si-line bg-si-canvas text-si-muted ». La vitrine reprend
     ce contraste : le vert dit « c'est notre client », le gris « c'est
     quelqu'un d'autre ». */
  .xc .fiche .lg .pastille-cl,
  .xc .fiche .lg .pastille-ex,
  .xc .fiche .lg .grav-bloq,
  .xc .fiche .lg .grav-crit,
  .xc .fiche .lg .grav-comp {
    padding: 2px 8px;
    border: 1px solid;
    border-radius: 8px;
    font-family: var(--sans);
    font-size: var(--t-menu);
  }
  .xc .fiche .lg .pastille-cl {
    border-color: rgb(var(--si-brand-green-rgb, 46 125 91) / 0.28);
    background: rgb(var(--si-brand-green-rgb, 46 125 91) / 0.08);
    color: var(--si-brand-green);
  }
  .xc .fiche .lg .pastille-ex {
    border-color: var(--si-line);
    background: var(--si-canvas, var(--bg));
    color: var(--si-muted);
  }
  /* Les trois gravites de « Etat de preparation », telles que le produit les
     nomme (lib/dossiers/preparation-status.ts:333) : Bloquant, Critique,
     A completer. Trois crans, donc trois encres, sinon le mot « Bloquant »
     pese autant que « A completer » et le tri ne sert plus a rien. */
  .xc .fiche .lg .grav-bloq {
    border-color: rgb(var(--si-danger-rgb) / 0.3);
    background: rgb(var(--si-danger-rgb) / 0.1);
    color: var(--si-danger-ink);
  }
  .xc .fiche .lg .grav-crit {
    border-color: rgb(138 106 30 / 0.3);
    background: rgb(138 106 30 / 0.1);
    color: var(--si-amber-ink);
  }
  .xc .fiche .lg .grav-comp {
    border-color: var(--si-line);
    background: var(--si-canvas, var(--bg));
    color: var(--si-muted);
  }
  /* Le lien de « Prochaine action » : c'en est un dans le produit, il en a
     donc la couleur ici aussi. */
  .xc .fiche .lg .lien { color: var(--si-brand-green); }
  /* La ligne d'identification sous le nom du dossier : date d'ouverture et
     responsables. Elle repond a « depuis quand, et par qui » avant meme qu'on
     lise le contenu. */
  /* Les pastilles sous le titre, comme dans l'ecran : « Avocat : Me Camille
     Roy » puis « Actif ». Elles etaient a droite, avec les actions, ce qui
     melangeait ce que le dossier EST avec ce qu'on peut y FAIRE. */
  .xc .fiche .fiche-pastilles {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
  }
  /* La derniere action porte le fond plein : c'est « Modifier le dossier », la
     seule des quatre qui engage une ecriture. */
  .xc .fiche .actes .bt.principal {
    background: var(--si-ink-strong);
    border-color: var(--si-ink-strong);
    color: var(--si-surface);
  }
  .xc .fiche .fiche-sous {
    margin-top: 4px;
    font-size: var(--t-detail);
    color: var(--si-muted);
  }
  @media (max-width: 900px) {
    .xc .fiche .totaux { grid-template-columns: 1fr; }
    .xc .fiche .duo-fiche { grid-template-columns: 1fr; gap: 0; }
  }

  /* ── La barre de l'application, figee ────────────────────────────────────
     Elle situe la page. Elle ne se navigue pas : l'illustration ne porte que
     sur l'ecran affiche, et un menu qui s'ouvrirait sur rien decevrait plus
     qu'il ne montrerait. */
  .xc .fenetre-produit .barre-app {
    display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
    margin: 14px; padding: 10px 16px;
    background: var(--si-surface);
    border: 1px solid var(--si-border);
    border-radius: 12px;
    box-shadow: 0 10px 26px -22px rgb(var(--si-line-ink-rgb) / 0.40);
    font-size: var(--t-menu); color: var(--si-muted);
  }
  .xc .fenetre-produit .barre-app .mk {
    display: inline-flex; align-items: center; gap: 7px;
    font-weight: 600; letter-spacing: 0.06em; color: var(--si-ink);
  }
  .xc .fenetre-produit .barre-app .sep { width: 1px; height: 18px; background: var(--si-border); }
  .xc .fenetre-produit .barre-app .cab { color: var(--si-ink); font-weight: 500; }
  .xc .fenetre-produit .barre-app nav { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
  .xc .fenetre-produit .barre-app nav .on { color: var(--si-ink); font-weight: 500; }
  .xc .fenetre-produit .barre-app .cv {
    display: inline-block; width: 6px; height: 6px; margin-left: 4px;
    border-right: 1.3px solid currentColor; border-bottom: 1.3px solid currentColor;
    transform: translateY(-2px) rotate(45deg); opacity: 0.5;
  }
  .xc .fenetre-produit .barre-app .ecart { flex: 1; }
  .xc .fenetre-produit .barre-app .ch {
    border: 1px solid var(--si-border); border-radius: 8px;
    padding: 5px 10px; min-width: 130px; color: var(--si-subtle);
  }
  .xc .fenetre-produit .barre-app .cl {
    border: 1px solid var(--si-border); border-radius: 5px; padding: 1px 5px; color: var(--si-subtle);
  }
  /* La pastille de notifications porte son compte, comme dans le produit. */
  .xc .fenetre-produit .barre-app .cloche {
    display: inline-grid; place-items: center; width: 17px; height: 17px;
    border-radius: 50%; background: #A83232; color: #fff; font-size: 9px;
  }
  .xc .fenetre-produit .barre-app .av {
    display: inline-grid; place-items: center; width: 22px; height: 22px;
    border-radius: 50%; background: var(--si-ink-strong); color: var(--si-surface); font-size: 10px;
  }
  /* Le chevron d'un lien qui sort de l'application. */
  .xc .fiche .actes .ext {
    display: inline-block; width: 8px; height: 8px; margin-left: 5px;
    border-top: 1.3px solid currentColor; border-right: 1.3px solid currentColor;
    transform: translateY(-1px) rotate(45deg); opacity: 0.6;
  }

  /* ── Les plaques de nombres portent un contour d'encre ────────────────────
     Detail releve par le CEO sur l'ecran reel : les trois totaux ne sont pas
     bordes du meme filet clair que les autres cartes, ils portent un contour
     d'encre. C'est ce qui les detache du reste de la page. */
  .xc .fiche .tot { border-color: var(--si-ink); }

  .xc .conclusion-fiche {
    margin-top: 20px;
    font-size: var(--t-explique);
    max-width: 64ch;
    line-height: 1.5;
    color: var(--si-ink);
  }

  /* Les panneaux de la fiche : un seul visible a la fois, comme dans le
     produit. Pas de transition de hauteur, qui ferait sauter la page sous le
     doigt : le panneau change, la page ne bouge pas. */
  .xc .fiche .vue { display: none; }
  .xc .fiche .vue.on { display: block; }
  .xc .fiche .onglets-fiche button {
    font: inherit; font-size: var(--t-detail); color: var(--si-muted);
    background: none; border: 0; padding: 0 0 10px;
    /* Un pixel de recouvrement : le trait de 2 px mange le filet de 1 px au
       lieu de s'aligner a cote. C'est ce qui fait un onglet et non un
       soulignement. */
    margin-bottom: -1px;
    cursor: pointer; border-bottom: 2px solid transparent;
    transition: color 140ms ease, border-color 140ms ease;
  }
  .xc .fiche .onglets-fiche button:hover { color: var(--si-ink); }
  .xc .fiche .onglets-fiche button.on { color: var(--si-ink); border-bottom-color: var(--si-ink); box-shadow: none; }
  .xc .fiche .onglets-fiche button:focus-visible { outline: 2px solid var(--si-verified); outline-offset: 3px; border-radius: 3px; }
  /* Le compteur de l'onglet, « Cartable (10) ». Il porte l'argument de la
     section : dix sections parce que le dossier est immobilier. Gris, pour
     qu'il se lise comme une quantite et non comme une partie du nom. */
  .xc .fiche .onglets-fiche button small {
    margin-left: 4px;
    font-size: inherit;
    color: var(--si-muted);
  }
  /* Les deux derniers onglets existent dans le produit mais ne s'ouvrent pas
     dans l'extrait : ils le disent au lieu de promettre un clic qui ne repond
     pas. Un onglet mort qui a l'air vivant decoit plus qu'il ne montre. */
  .xc .fiche .onglets-fiche button.inerte {
    opacity: 0.45;
    cursor: default;
  }
  .xc .fiche .onglets-fiche button.inerte:hover { color: var(--si-muted); }

  /* ── Le contour fondant ──────────────────────────────────────────────────
     Demande CEO : un contour qui se fond, pas un bord net qui s'arrete. Le
     masque porte sur la FENETRE entiere, donc le bord s'eteint avec ce qu'il
     borde. Un masque coupe l'ombre portee, peinte hors de la boite : l'ombre
     longue vit donc sur le parent, hors du masque. */
  .xc .scene-produit .fenetre-fondante { filter: drop-shadow(0 30px 66px rgb(var(--si-line-ink-rgb) / 0.26)); }
  .xc .fenetre-produit.contour-fondu {
    -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 68%, transparent 100%);
    mask-image: linear-gradient(to bottom, #000 0%, #000 68%, transparent 100%);
    box-shadow: inset 0 1px 0 rgb(var(--si-surface-rgb) / 0.85);
  }

  /* La mention de demonstration. Elle n'est pas discrete : une histoire
     reconstruite presentee comme une donnee reelle est le defaut que la
     regle interne interdit. */
  .xc .mention-demo {
    display: flex; align-items: center; gap: 9px;
    margin-top: 14px; padding: 10px 14px;
    border: 1px dashed rgb(var(--si-line-ink-rgb) / 0.28);
    border-radius: 9px;
    font-size: var(--t-detail); color: var(--si-muted);
  }
  /* Graisse 400 depuis le 2026-08-27 : « aucun texte bold » dans le discours
     de la page. C'est l'encre pleine, et non le gras, qui distingue desormais
     la part reconstruite du reste de la phrase. */
  .xc .mention-demo b { font-weight: 400; color: var(--si-ink); }
  .xc .reponse-fiche {
    margin-top: 18px; font-size: var(--t-corps); max-width: 64ch; line-height: 1.5;
  }

  .xc .statut-rappro {
    margin-top: 16px;
    font-size: var(--t-detail);
    color: var(--si-muted);
    max-width: 64ch;
    line-height: 1.5;
  }
  .xc .statut-rappro b { font-weight: 400; color: var(--si-amber-ink); }

  /* ── L'effet AB : une section sur deux change de fond ────────────────────
     Demande CEO. La page se lisait comme une seule surface continue, et rien
     ne disait ou une section finissait. Une alternance de deux tons proches
     suffit : elle se sent plus qu'elle ne se voit, et elle donne un rythme
     sans decouper la page en tranches.

     Les deux tons viennent de la palette, aucun n'est ecrit en dur. L'ecart
     entre eux est faible, moins de trois pour cent de luminance : c'est ce
     qui evite la bande grise que le CEO avait fait retirer plus tot.

     Le filet de separation du bas de page tombe la ou le fond change deja :
     deux signaux pour dire la meme chose, c'est un de trop. */
  .xc section.recit:nth-of-type(even) { background: var(--si-surface2); }

  /* Les trois dernieres sections portaient leur propre rembourrage,
     clamp(88px, 12vh, 148px) contre clamp(96px, 14vh, 176px) pour les autres.
     Elles respiraient donc 120 px quand les premieres respiraient 140, et la
     page se resserrait a mesure qu'on descendait.

     La regle disait vouloir leur donner « un degagement plus large ». Elle
     faisait l'inverse : 12vh est plus petit que 14vh. Le commentaire decrivait
     une intention, pas le code, et personne n'avait mesure.

     Retiree le 2026-08-26 sur demande du CEO, « uniformise la taille des
     differentes sections ». Il n'y a plus qu'un rythme vertical pour toute la
     page. */
  /* Le titre d'une sous-partie a l'interieur d'une section. Il ne cree pas un
     niveau de titre de plus : c'est un libelle, dans la meme graisse que les
     autres exergues de la page. */

  .xc .chaine .lien {
    flex: 0 0 28px; display: grid; place-items: center;
    color: var(--si-subtle); font-size: var(--t-detail);
  }

  /* « À propos » est mis en avant depuis le 2026-08-25 (demande CEO). Elle
     sortait d'un sous-menu, ou la page qui dit QUI construit SAFE demandait
     deux gestes pour etre atteinte.

     La mise en avant est l'ENCRE PLEINE, et rien d'autre. Dans une barre de
     libelles gris, un seul en encre se detache sans effort ; une pastille ou
     une graisse en plus l'aurait fait passer pour un bouton, et la barre en
     porte deja trois. */
  /* La regle voisine s'ecrit « .xc #nav .links a » : un ID pese plus que
     n'importe quel nombre de classes. Une regle en « nav » aurait ete ecrite,
     lue, et sans effet. */
  .xc #nav .links a.en-avant { color: var(--si-ink); }


  /* Le zoom souple, version fenetre. La classe partagee « .safe-zoom » pose
     une box-shadow : sur un parent transparent aux coins arrondis, elle
     dessinerait un rectangle derriere la fenetre. On garde donc sa courbe et
     son amplitude, et on approfondit l'ombre PORTEE, qui epouse la forme. */
  /* ── Les illustrations au telephone ───────────────────────────────────────
     Demande CEO du 2026-08-25 : les extraits gardent les DIMENSIONS d'un
     ordinateur et retrecissent, au lieu de se reorganiser pour le pouce.

     C'est le traitement du hero, mesure puis repris : sa fenetre rend une
     largeur logique de 1360 px a l'echelle 0,720, et le bord de l'ecran la
     coupe. On voit un ecran d'ordinateur, pas une version telephone du meme
     ecran. C'est ce que la page raconte, donc c'est ce qu'elle doit montrer.

     « zoom » et non « transform: scale » : « zoom » retaille la BOITE en meme
     temps que le dessin, donc la hauteur du parent suit toute seule. Avec
     « scale », le parent garderait la hauteur d'origine et laisserait mille
     pixels de vide sous chaque fenetre.

     La section « figures » gardait ici une exception, une echelle de 0,877 sur
     des fenetres de 399 px, parce qu'etirees a 1238 px leurs montants
     tombaient hors de l'ecran. Elle est retiree le 2026-08-26 et l'exception
     avec elle : il ne reste qu'une echelle pour toutes les fenetres. */
  @media (max-width: 900px) {
    .xc .fenetre-fondante { width: 100%; overflow: hidden; }
    .xc .fenetre-produit { width: 1238px; zoom: 0.72; }
    /* ── La chaine, au telephone ────────────────────────────────────────────
       Le balisage alterne deja un cadran et une fleche. Sur ecran large ils
       se suivent horizontalement et la fleche tombe entre deux cadrans, ce
       qu'elle doit faire.

       Au telephone, « flex-wrap: wrap » cassait cette alternance : chaque
       cadran, avec sa base de 160 px, prenait la ligne entiere, et la fleche
       de 28 px se posait A SA DROITE au lieu de venir apres lui. On lisait
       donc cinq cadrans flanques d'une fleche qui ne reliait rien.

       En colonne, l'ordre du balisage redevient l'ordre a l'ecran. La fleche
       pivote d'un quart de tour pour montrer le bas, et sa hauteur EST
       l'ecart entre deux cadrans : un seul reglage tient l'espacement, au
       lieu d'une marge qui s'ajouterait a elle. */
    .xc .chaine { flex-direction: column; flex-wrap: nowrap; }
    .xc .chaine .maillon { flex: 0 0 auto; width: 100%; }
    /* La fleche CHANGE de glyphe, elle ne pivote pas. « rotate » fait tourner
       la BOITE avec le dessin : une fleche large de 350 px devenait un bloc de
       350 px de haut, qui chevauchait les cadrans au-dessus et en dessous. */
    .xc .chaine .lien {
      flex: 0 0 auto;
      height: 30px;
      width: 100%;
      font-size: 0;
    }
    .xc .chaine .lien::before { content: "↓"; font-size: var(--t-detail); }
  }
  /* Deux fenetres cote a cote, pour les deux bouts d'une meme chaine. */
  .xc .duo-fenetres { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(14px, 2vw, 22px); }
  .xc .duo-fenetres .fenetre-produit { margin: 0; }
  @media (max-width: 900px) { .xc .duo-fenetres { grid-template-columns: 1fr; } }

  .xc .pastilles .resolu {
    border: 1px solid rgb(38 101 74 / 0.34);
    background: rgb(38 101 74 / 0.10);
    color: var(--si-verified);
  }

  .xc .morceaux { margin-top: clamp(56px, 8vh, 104px); }
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
  /* Les deux regles « #probleme .cote » ont ete retirees le 2026-08-27. Elles
     etaient DEJA mortes avant : « .cote » n'apparait dans aucun balisage de la
     page. La reecriture de la section 02 les a rendues doublement orphelines,
     l'ancre « #probleme » n'existant plus non plus. */

  /* ── 04 · La suite ────────────────────────────────────────────────────────
     Trois blocs de poids différents, jamais trois cartes identiques. SAFE
     Cabinet prend la largeur et porte la liste de ce qu'il tient ensemble ;
     les outils et l'accompagnement se partagent la rangée du dessous, un cran
     plus bas. C'est la hiérarchie qui dit lequel est le produit central, pas
     une étiquette. */
  /* Le bloc maître ne porte plus qu'une colonne.

     Il en avait deux : la phrase à gauche, et à droite les neuf registres en
     pastilles. Les deux disaient exactement les mêmes neuf mots, dans le même
     ordre, à trente centimètres l'un de l'autre. Une redite ne devient pas une
     preuve parce qu'on la met en mono dans un cadre : elle occupe la moitié du
     bloc et elle ajoute neuf objets à compter.

     La phrase reste, les pastilles partent, et la place rendue est du vide,
     pas un autre contenu. */
  /* Le bloc maître reprend la coupe du contrat de section, un cran plus bas :
     le nom et le titre à gauche, ce qu'il tient et le lien à droite, à la même
     hauteur. Il n'occupait que la moitié gauche, et la moitié droite restait
     vide sur quatre cent cinquante pixels au milieu de la page. */
  .xc .bloc-maitre {
    margin-top: clamp(56px, 8vh, 104px);
    padding: clamp(30px, 3.6vw, 44px) 0;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(32px, 5vw, 88px);
    align-items: start;
  }
  .xc .bloc-maitre h3 {
    margin-top: 12px;
    font-family: var(--sans);
    font-weight: 400;
    font-size: var(--t-titre);
    line-height: 1.12;
    letter-spacing: -0.018em;
    max-width: 18ch;
  }
  .xc .bloc-maitre p {
    max-width: 46ch;
    font-family: var(--sans);
    font-size: var(--t-corps);
    line-height: 1.62;
    color: var(--muted);
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
    font-family: var(--sans);
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
  /* La tete reste celle de TOUTES les sections : le titre a gauche, sa phrase
     a droite, a la meme hauteur. Regle CEO du 2026-08-26, apres que j'aie
     essaye de sortir cette seule section du contrat. Une section qui invente
     sa propre tete casse la colonne que les autres tiennent.

     Ce qui eloignait le titre de l'argument n'etait pas la tete mais l'ecart
     qui la suivait : il valait clamp(56px, 8vh, 104px) et un filet, sous
     lequel deux colonnes de petit gris arrivaient deux ecrans plus bas. */
  /* ── Les quatre domaines ──────────────────────────────────────────────────
     Meme poids pour les quatre : c'est le propos. Un domaine plus large ou plus
     gras se lirait comme le vrai produit et les trois autres comme des options.
     Aucune image : la page en porte deja trois, et ce bloc doit se lire en dix
     secondes. */
  .xc .domaines {
    margin-top: clamp(40px, 5vw, 64px);
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: clamp(20px, 2.6vw, 40px);
  }
  .xc .domaine { border-top: 1px solid var(--line); padding-top: 16px; }
  .xc .domaine .n {
    font-family: var(--mono);
    font-size: var(--t-menu);
    letter-spacing: 0.1em;
    color: var(--verified);
  }
  .xc .domaine .t {
    margin-top: 10px;
    font-family: var(--sans);
    font-size: var(--t-argument);
    line-height: 1.25;
    letter-spacing: -0.014em;
    color: var(--si-ink);
  }
  .xc .domaine .d {
    margin-top: 8px;
    font-family: var(--sans);
    font-size: var(--t-detail);
    line-height: 1.55;
    color: var(--muted);
  }

  /* ── Les deux vues, sous les deux colonnes de la tete ─────────────────────
     La grille est EXACTEMENT celle de « .tete » : memes colonnes, meme
     gouttiere. C'est ce qui met la photographie de l'equipe sous le titre et
     celle de l'avocate sous « SAFE ne remplace pas l'equipe ». Demande CEO du
     2026-08-26.

     Avec une grille a elle, la section posait deux bords verticaux de plus au
     milieu de la page. La regle du site est qu'un bloc se cale sur une colonne
     existante, il n'en cree pas.

     La reduction de taille demandee plus tot dans la journee tient toujours,
     mais elle porte sur la PHOTOGRAPHIE et non sur la grille : borner la
     grille a 880 px la decalait des colonnes de la tete, ce qui est justement
     le defaut a corriger. Chaque cellule fait donc sa demi-page, et l'image
     s'arrete a 422 px a l'interieur. */
  .xc .deux-vues {
    margin-top: clamp(32px, 4.4vh, 52px);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(32px, 5vw, 88px);
  }
  .xc .deux-vues .vue { margin: 0; }
  /* La photographie porte le meme rayon que les cartes de forfait, et le meme
     filet : c'est une surface du site, pas une image rapportee. */
  .xc .vue-photo {
    width: 100%;
    /* 422 px : la taille arretee le 2026-08-26. Elle vit ici, sur l'image, et
       non sur la grille, pour que la cellule garde sa colonne. */
    max-width: 422px;
    height: auto;
    aspect-ratio: 3 / 2;
    object-fit: cover;
    border-radius: 14px;
    border: 1px solid var(--si-border);
  }
  .xc .deux-vues .vue figcaption { margin-top: 18px; max-width: 422px; }
  /* Le role, en minuscules et en encre pleine. Il portait « .rang », les
     capitales espacees de 11 px que le site emploie pour ses exergues. Deux
     defauts : elles annoncent une categorie la ou ces libelles nomment
     quelqu'un, et a 11 px elles pesaient moins que la phrase qu'elles
     introduisent. Elles prennent la mesure du texte d'explication, et c'est
     l'encre qui les distingue, pas la casse. */
  /* Ecrit « .xc .deux-vues .vue p.vue-role » et non « .xc .vue-role » : la
     regle voisine des paragraphes compte trois classes et un element, elle
     l'emportait. Le role sortait donc en gris, a la couleur exacte de la
     phrase qu'il introduit, et rien ne les separait plus. */
  .xc .deux-vues .vue p.vue-role {
    margin-top: 0;
    font-family: var(--sans);
    font-size: var(--t-explique);
    line-height: 1.35;
    letter-spacing: -0.01em;
    color: var(--si-ink);
  }
  .xc .deux-vues .vue p {
    margin-top: 10px;
    font-family: var(--sans);
    font-size: var(--t-explique);
    line-height: 1.55;
    color: var(--si-muted);
  }
  .xc #equipe .chute { margin-top: clamp(28px, 3.4vw, 44px); }

  /* ── 07 · L'offre ─────────────────────────────────────────────────────────
     Les trois temps de la mise en service, sous les deux forfaits : le prix
     seul ne dit pas ce qui se passe après, et c'est la question qui suit le
     prix dans toutes les conversations. */
  /* Le prix et la mise en service sont deux sujets : l'écart qui les sépare
     est le plus grand de la section, et le plus petit sépare une étape de sa
     justification. C'est ce rapport qui fait lire, pas la quantité de vide
     (SAFE_PREMIUM_DESIGN_STANDARD §2.2, un pour trois au moins). */

  /* Une section de récit peut prendre la surface blanche. On ne s'en sert
     pas aujourd'hui : la page tient sur un seul canevas, et c'est ce qui
     laisse les deux captures s'y fondre sans bord visible. */
  .xc .recit.surface { background: var(--surface); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }

  /* Le prix et son unité restent un chiffre : mono, comme tout montant du
     site. La serif s'arrête au texte qui l'entoure. */

  .xc #questions .q {
    display: grid;
    grid-template-columns: 0.86fr 1.14fr;
    gap: 18px;
    padding: 26px 0;
    border-top: 1px solid var(--line);
  }
  .xc #questions .q h3 { font-family: var(--sans); font-weight: 400; font-size: var(--t-argument); line-height: 1.35; }
  .xc #questions .q p { max-width: 58ch; font-family: var(--sans); font-size: 14px; line-height: 1.65; color: var(--muted); }
  .xc #questions .liste-q { margin-top: clamp(56px, 8vh, 104px); }

  /* La fermeture s'aligne à gauche, comme les huit chapitres qui la précèdent.
     Elle était le seul bloc centré de la page : après seize écrans de colonne
     à 140 px, un dernier écran centré se lit comme un gabarit rapporté, et
     c'est le tell A2 de DESIGN_HUMAIN (« tout centré »). La page garde donc
     une seule ligne de départ du premier mot au dernier bouton. */
  .xc #cta .reassure { margin-top: 20px; font-family: var(--sans); font-size: var(--t-detail); color: var(--muted); }
  .xc #cta .actions { margin-top: clamp(44px, 6vh, 72px); display: flex; gap: 18px; flex-wrap: wrap; }
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
    /* Graisse 400, demande CEO du 2026-08-27 : « je veux aucun texte bold ».
       Verifie sur cursor.com/product le meme jour : AUCUN de leurs liens ni de
       leurs boutons en CursorGothic ne depasse 400, action principale comprise.
       La hierarchie se fait par la taille, la position et le fond, jamais par
       la graisse. Un bouton plein sur fond vert est deja l'element le plus
       lourd de la vue ; l'engraisser en plus, c'est le dire deux fois. */
    font-weight: 400;
    box-shadow: 0 14px 28px -18px rgb(var(--si-ink-strong-rgb) / 0.85);
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
    font-size: 12px;
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
      /* Descendus avec l'echelle de bureau le 2026-08-25 : a 33 px le titre du
         telephone etait devenu PLUS gros que celui de l'ecran large. */
      --t-affiche: 23px;   /* le titre d'ouverture, une seule fois par page */
      --t-marque: 20px;    /* le mot de chapitre : Simple, Fiable, Complet */
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
    .xc .deux-blocs > *, .xc .deux-vues > *,
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
    .xc #nav .links, .xc #nav .signin { display: none; }
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
    /* Au pouce aussi : 250svh etaient la course de l'assemblage, eteint depuis.
       Ce qui reste a parcourir est la hauteur du titre et de la fenetre. */
    .xc #zone-hero { height: 132svh !important; }
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
      /* ── Le cadre redevient un cadre (2026-08-25) ─────────────────────────
         Tout ce bloc etait ecrit POUR l'assemblage : le cadre naissait
         invisible, « --cadre-a » monte de zero a un par le script pendant que
         les feuilles se rangent, sans bord droit ni bord bas, et un fondu
         horizontal eteignait sa droite pour qu'il ait l'air de deriver depuis
         la gauche.

         L'assemblage est eteint. « --cadre-a » restait donc a ZERO : plus de
         filet, plus de fond, et le fondu a 72 % coupait la fenetre en plein
         milieu d'une carte sombre, qui se dissolvait dans le blanc a droite.
         Un decor d'animation survit rarement a l'animation.

         Le cadre est donc pose, entier et tout de suite : quatre bords, quatre
         coins, aucun fondu horizontal. Le fondu du BAS reste, porte par
         « #hero-app.live » : il dit que l'ecran continue sous le pli, ce qui
         est vrai. Le fondu de droite disait que l'ecran s'efface, ce qui ne
         l'etait pas. */
      border: 1px solid rgb(var(--si-line-ink-rgb) / 0.16);
      border-radius: 12px;
      background: var(--si-surface);
      overflow: hidden;
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
    /* L'interligne suit la regle de Cursor, qui donne 1,32 a nos 23px entre
       leurs points 16px (1,50) et 26px (1,25).

       Le suivi garde le meme ecart que le bureau : le CEO trouve leur regle
       trop lache sur notre fonte. 0,005em de feuille + 0,018 incrustes =
       -0,013em effectifs, contre -0,007 pour leur regle pure.

       Il reste POSITIF dans la feuille, comme chez Cursor sous 16px : a cette
       taille une lettre trop serree se remplit, et l'ouvrir n'est pas un choix
       de gout mais de lisibilite au pouce. C'est pourquoi le telephone ne suit
       pas le bureau au chiffre pres. */
    .xc #hero-copy h1 {
      margin-top: 16px;
      font-size: var(--t-affiche);
      line-height: 1.32;
      letter-spacing: 0.005em;
      max-width: none;
    }
    /* L'exergue redescend au plancher : a 14px, la mesure de Cursor sur ecran
       large, « SYSTEME DE GESTION POUR CABINETS D'AVOCATS » passe sur DEUX
       lignes a 375px et prend une hauteur due a la fenetre du produit.
       Constate a l'ecran le 2026-08-27. */
    /* La taille redescend, mais NI les capitales NI leur interlettrage ne
       reviennent : le bloc « exergues et libelles » plus bas les rendrait a
       tous les .kicker de la page, et celui du hero n'en est plus un. */
    .xc #hero-copy .kicker { font-size: 13px; letter-spacing: normal; }

    /* La grille des deux colonnes SE REMET A PLAT. Sans cette ligne, le titre
       reste enferme dans la colonne de gauche d'une grille prevue pour 1160px
       et se casse en trois lignes a 375px. Constate le 2026-08-27, apres avoir
       retire cette remise a plat pendant l'intermede ou la description etait
       empilee : une regle de telephone qui repond a un montage de bureau meurt
       avec lui.

       La description reste masquee au pouce pour la raison qui a deja retire
       le lien secondaire le 18 aout : le budget vertical. Elle prendrait trois
       lignes prises sur la fenetre du produit, seule preuve de la premiere
       vue. */
    .xc #hero-copy .hero-row { display: block; }
    .xc #hero-copy .hero-desc { display: none; }
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
    .xc #hero-copy .hero-actions { margin-top: 24px; gap: 16px; }

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
    .xc .recit h1, .xc .recit h2, .xc .fi-copy h2, .xc .co-copy h2 {
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
    .xc .recit { padding: 64px var(--marge); }

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

    /* ── Le contrat de section, au pouce ────────────────────────────────────
       Toutes les grilles s'empilent, et l'ordre de lecture est déjà le bon
       dans le balisage : le titre, la phrase, la scène, l'index.

       La scène garde ses deux volets l'un sous l'autre, séparés par le filet
       qui les séparait horizontalement. Les chiffres restent alignés à droite,
       ce qui est la seule chose que la loi du chiffre protège vraiment. */
    .xc .recit { padding-block: 72px; padding-inline: var(--marge); }
    .xc .recit .tete { grid-template-columns: 1fr; gap: 18px; }
    .xc .recit h2 { font-size: var(--t-titre); max-width: none; }
    .xc .recit .dire { font-size: var(--t-corps); max-width: none; }
    .xc .ligne { padding: 9px 0; }
    .xc .ligne .l { font-size: var(--t-detail); }
    .xc .ligne .l small { font-size: var(--t-menu); }
    .xc .ligne .v { font-size: var(--t-detail); }
    .xc .ligne.total .l, .xc .ligne.total .v { font-size: var(--t-corps); }
    /* La capture prend toute la largeur de l'écran, gouttières comprises.
       À cette échelle on ne lit plus les libellés du logiciel, et c'est vrai
       de toute capture d'un écran de bureau sur un téléphone : ce qu'on montre
       ici, c'est la forme d'un produit réel, pas son contenu. Le propos, lui,
       est au-dessus, en toutes lettres. */
    /* Le cadre survit au téléphone, avec un rayon plus court et sans
       déborder jusqu'aux bords de l'écran : un cadre collé au bord ne se lit
       plus comme un cadre. À cette échelle on ne lit plus les libellés du
       logiciel, et c'est vrai de toute capture d'un écran de bureau sur un
       téléphone ; ce qu'on montre, c'est la forme d'un produit réel. Le propos,
       lui, est au-dessus, en toutes lettres. */
    .xc .capture {
      margin-top: 32px;
      margin-inline: calc(-0.5 * var(--marge));
      border-radius: 12px;
    }
    .xc .index-modules { margin-top: 32px; grid-template-columns: 1fr; gap: 12px; }
    .xc .index-modules .colonne-droite { border-left: 0; padding-left: 0; }
    .xc .figures { grid-template-columns: 1fr; gap: 32px; margin-top: 32px; }
    .xc .figures > * + * { border-left: 0; padding-left: 0; border-top: 1px solid var(--line); padding-top: 32px; }
    .xc .fig-dit { max-width: none; }

    /* ── Les sections écrites, au pouce ─────────────────────────────────────
       Toutes leurs grilles à deux colonnes s'empilent. L'ordre de lecture est
       déjà le bon dans le balisage : la liste avant son commentaire, le bloc
       maître avant les deux blocs secondaires, la vue de l'adjointe avant
       celle de l'avocate. */
    .xc .deux-blocs,
    .xc .deux-vues,
    .xc .bloc-maitre,
    .xc .morceaux { margin-top: 26px; }
    .xc .bloc-maitre { margin-top: 26px; padding: 22px 0; }
    .xc .domaines { margin-top: 28px; grid-template-columns: 1fr 1fr; gap: 20px; }
    .xc .deux-vues { margin-top: 26px; }
    /* Le repère de l'endroit passe sous la phrase : à 335 px, une colonne de
       droite en plus de la colonne du numéro ne laisse plus rien au texte. */
    .xc .morceau { grid-template-columns: 26px 1fr; row-gap: 6px; padding: 13px 0; }
    .xc .morceau .t { font-size: var(--t-detail); line-height: 1.5; }
    .xc .morceau .ou { grid-column: 2; }
    .xc .bloc-maitre h3, .xc .deux-blocs h3 { font-size: var(--t-argument); max-width: none; }
    .xc .bloc-maitre p, .xc .deux-blocs p,
    .xc .deux-vues .vue p { max-width: none; }
    .xc .chute, .xc .fi-precision { max-width: none; font-size: var(--t-corps); }
    .xc .contexte li { font-size: var(--t-menu); padding: 6px 10px; }
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

    /* ── Bas de page ────────────────────────────────────────────────────────
       Les trois sections plates gardaient l'échelle du large : leurs titres
       montaient à 46 et 56 px, et le prix pesait plus lourd que le nom du
       forfait qu'il chiffre. Elles rejoignent l'échelle commune. */
    /* Le prix se cale sur le nom du forfait, pas sur le milieu du bloc. Avec
       align-items: center, un prix de 22 px se centrait sur deux lignes de
       texte et venait se poser entre « Solo » et sa description : il ne
       chiffrait visuellement ni l'un ni l'autre. Aligné sur la ligne de base
       du nom, il chiffre le nom. */
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
  /* ── L'assemblage d'ouverture est retire (dec. CEO 2026-08-24) ────────────
     La premiere vue s'ouvrait sur des feuilles eparpillees qui derivaient puis
     se rangeaient en application, pilotees par une longue course de defilement
     epinglee. Le CEO ne veut plus cette ouverture : la page commence sur le
     titre, l'action, et le logiciel pose en dessous.

     On ne supprime pas la mecanique, on cesse de l'emprunter. Le chemin
     statique existait deja, ecrit pour le telephone et pour qui demande moins
     de mouvement : `poserHeroStatique` compose exactement cette vue, et son
     rendu au large centre l'application sous le texte a l'echelle qui tient.
     Il devient donc le seul chemin. Passer cette constante a false rallume
     l'assemblage sans rien avoir a reecrire. */
  const ASSEMBLAGE_OUVERTURE = false;
  const REDUCED =
    !ASSEMBLAGE_OUVERTURE ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    PHONE;

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
  /* La legende a ete retiree du balisage le 2026-08-26. « $ » porte une
     assertion non nulle : sans ce « ?. » sur chaque usage, le script levait une
     exception et la page entiere restait blanche, typecheck vert. C'est la
     deuxieme fois qu'un element retire fait tomber la scene par ce chemin. */
  const heroCaption = root.querySelector<HTMLElement>("#hero-caption");
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
  const FRAME_W = 1360;
  /* 640 et non 772 : l'extrait ne remplit que 550 px de sa boîte, et les 220
     restants n'étaient que du canevas d'application vide sous son contenu.
     Une boîte à la mesure de ce qu'elle porte laisse la largeur borner, donc
     la fenêtre s'élargit au lieu de s'allonger dans le vide. */
  const FRAME_H = 640;
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

    /* 92 % de largeur, 78 % de hauteur, la plus contraignante des deux gagne :
       le cadre ne déborde donc jamais.

       La largeur passe de 88 à 92 % : c'est la hauteur qui bornait, et la
       fenêtre finissait exactement à la largeur des captures des sections.
       L'ouverture doit être la plus grande vue de la page, pas son égale. Avec
       une boîte logique ramenée à 640 (voir FRAME_H), c'est la largeur qui
       borne, et la fenêtre gagne près de 90 px sur celles du bas. */
    let scale = Math.min(W * 0.92 / FRAME_W, H * 0.78 / FRAME_H);
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
    if (heroCaption) {
      heroCaption.style.opacity = String(phase(p, 0.70, 0.78));
      heroCaption.style.transform = "translateY(" + ((1 - phase(p, 0.70, 0.78)) * 12) + "px)";
    }
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
      if (heroCaption) heroCaption.style.display = "";
      /* L'indication de défilement appartient à l'assemblage : c'est lui qui
         l'efface quand elle a servi. */
      return;
    }

    /* ── L'extrait s'aligne sur le TITRE ──────────────────────────────────
       Il etait centre sur la largeur du volet, avec une marge propre de 6 %
       plafonnee a 84 px. Le titre, lui, commence au bord de la colonne de la
       page, a 140 px sur un ecran de 1440. Deux bords gauches a 56 px l'un de
       l'autre dans le premier ecran, et l'oeil le voit sans savoir le nommer.
       Demande CEO du 2026-08-26.

       On lit le bord du TITRE plutot que de recalculer la colonne : la mesure
       de la page vit dans la feuille de style, et la recopier ici creerait
       deux verites a accorder. Repli sur l'ancienne marge si le titre n'est
       pas encore mesurable. */
    const bordTitre = Math.round(
      (heroCopy.querySelector("h1") ?? heroCopy).getBoundingClientRect().left -
        pin.getBoundingClientRect().left,
    );
    const gauche = bordTitre > 0 ? bordTitre : marge;
    const scale = Math.min((W - gauche * 2) / FRAME_W, 1);
    const haut = heroCopy.offsetTop + heroCopy.offsetHeight + 52;
    heroShot.style.left = gauche + "px";
    heroShot.style.top = haut + "px";
    heroShot.style.transform = "scale(" + scale + ")";
    heroShot.style.borderRadius = (14 / scale) + "px";
    heroShot.style.opacity = "1";
    heroShot.classList.add("live");

    if (heroCaption) {
      heroCaption.style.opacity = "1";
      heroCaption.style.transform = "none";
    }
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
      aujourdhui: "aujourdhui",
      dash: "dash",
      clients: "pratique", dossiers: "pratique", agenda: "pratique",
      "file-assistante": "pratique", employes: "pratique", "mes-heures": "pratique",
      facturation: "finances", comptabilite: "finances", comptes: "finances",
      inspection: "finances", conformite: "finances", temps: "finances",
      patrimoine: "outils", edition: "outils", rapports: "outils", import: "outils",
      parametres: "parametres",
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

  /* ── L'extrait de la fiche client est navigable, comme celui du heros ─────
     Meme vocabulaire, meme delegation : un attribut sur l'onglet, un attribut
     sur le panneau, un seul ecouteur. On ne monte pas une deuxieme mecanique
     a cote de la premiere.

     Les onglets sont de vrais boutons : le clavier les atteint sans qu'on ait
     a poser un role ni un index de tabulation a la main. */
  /* La mecanique sert TOUS les extraits navigables de la page, pas seulement
     la fiche client : chaque conteneur porte « extrait-nav », et l'ecouteur se
     pose sur chacun. Ajouter un extrait plus bas ne demande donc rien de plus
     que le balisage. Les etats restent locaux a leur conteneur : ouvrir un
     onglet dans un extrait ne touche pas celui d'a cote. */
  const extraits = Array.from(root.querySelectorAll<HTMLElement>(".extrait-nav"));
  const montrerVue = (hote: HTMLElement, nom: string) => {
    hote.querySelectorAll("[data-fiche-vue]").forEach((v) =>
      v.classList.toggle("on", v.getAttribute("data-fiche-vue") === nom),
    );
    hote.querySelectorAll("[data-fiche-onglet]").forEach((o) => {
      const actif = o.getAttribute("data-fiche-onglet") === nom;
      o.classList.toggle("on", actif);
      o.setAttribute("aria-selected", actif ? "true" : "false");
    });
  };
  const onExtraitClick = (e: Event) => {
    const cible = (e.target as HTMLElement).closest("[data-fiche-onglet]");
    if (!cible) return;
    const hote = cible.closest<HTMLElement>(".extrait-nav");
    const nom = cible.getAttribute("data-fiche-onglet");
    if (hote && nom) montrerVue(hote, nom);
  };
  extraits.forEach((ex) => ex.addEventListener("click", onExtraitClick));
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
  /* Le rail a ete retire avec l'assemblage d'ouverture : son seul jalon
     nommait cette animation. La recherche devient tolerante a son absence,
     pour que repasser ASSEMBLAGE_OUVERTURE a true suffise a tout rendre. */
  const rail = root.querySelector<HTMLElement>("#rail");
  const railStops: Record<string, HTMLElement> = {};
  const jalonHero = rail?.querySelector<HTMLElement>('[data-rail="hero"]');
  if (jalonHero) railStops.hero = jalonHero;
  const zones: Record<string, HTMLElement> = {
    hero: heroZone,
  };
  function zoneVisible(el: HTMLElement) {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight * 0.5 && r.bottom > window.innerHeight * 0.5;
  }
  function updateRail() {
    /* Le rail a ete retire avec l'assemblage : son seul jalon nommait
       l'animation d'ouverture. La fonction reste, tolerante a son absence,
       pour que rallumer ASSEMBLAGE_OUVERTURE suffise a tout rendre. */
    if (!rail) return;
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
  const shown: Record<string, number> = { hero: 0 };
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
  const VITESSE: Record<string, number> = { hero: 0.4 };

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
      /* Plus personne ne lit « --cadre-a » depuis le 2026-08-25 : la feuille du
         telephone pose le cadre entier des le depart, l'assemblage etant
         eteint. La ligne reste pour que la mecanique soit complete si le
         drapeau est rallume, mais il faudra alors REMETTRE dans la feuille le
         cadre qui nait invisible. « Rallumer suffit a tout rendre » ne vaut
         plus tout a fait ici, et c'est ecrit plutot que suppose. */
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


  if (REDUCED) {
    poserStatique();
    /* La hauteur du titre décide de la place de l'application : mesurée avant
       le chargement des polices, elle serait trop courte et les deux se
       chevaucheraient. */
    document.fonts?.ready.then(poserStatique).catch(() => {});
    window.addEventListener("resize", poserStatique);
    window.addEventListener("scroll", suivreRail, { passive: true });
    /* L'assemblage du telephone est ETEINT depuis le 2026-08-25, demande CEO.

       Il survivait seul a l'extinction du 24 aout : sur ordinateur l'ouverture
       ne jouait plus, sur telephone elle jouait encore. Le resultat mesure
       etait une page d'accueil qui ouvrait sur une animation de LOGO,
       l'application restant a opacite 0 jusqu'a 900 px de defilement, soit
       au-dela du premier ecran. On voyait la marque, jamais le produit.

       « poserStatique » place desormais seule la fenetre, visible des le
       premier ecran.

       La condition garde « ASSEMBLAGE_OUVERTURE » en tete, comme le chemin de
       l'ordinateur plus haut : rallumer le drapeau suffit a tout rendre, et
       « jouerAssemblage » ne devient pas du code que plus rien n'appelle. */
    if (
      ASSEMBLAGE_OUVERTURE &&
      PHONE &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      root.classList.add("tel-anime");
      arreterAssemblage = jouerAssemblage();
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
    arreterAssemblage();
    root.classList.remove("anime");
    root.classList.remove("tel-anime");
    /* Les deux chemins peignent en style en ligne. Tant qu'on ne relançait
       jamais la mise en place, les laisser derrière soi était sans effet ;
       depuis qu'un changement de régime relance, ils survivraient au régime
       suivant — un canevas d'assemblage resté en display:none, une application
       figée à la position calculée pour l'autre largeur. On rend chaque élément
       à sa feuille de style. */
    [heroCanvas, heroCopy, heroShot, heroCaption, heroHint].forEach((el) => {
      el?.removeAttribute("style");
    });
    heroZone.querySelector<HTMLElement>(".pin")?.style.removeProperty("min-height");
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("scroll", reveiller);
    window.removeEventListener("resize", reveiller);
    window.removeEventListener("resize", poserStatique);
    window.removeEventListener("scroll", suivreRail);
    extraits.forEach((ex) => ex.removeEventListener("click", onExtraitClick));
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
  [ROUTES.tarification, "Tarification"],
  [ROUTES.aPropos, "À propos"],
];

/* La rangee des cinq endroits a ete retiree le 2026-08-25, demande CEO, sur
   les deux formats. Elle nommait la boite courriel, le chiffrier, le dossier
   papier, le comptable et la memoire de l'adjointe, puis les resolvait en
   « un seul dossier ». La fiche qui suit dit la meme chose en la MONTRANT, et
   deux demonstrations de la meme idee affaiblissent la premiere.

   Les libelles partent avec elle : une constante que plus rien ne lit est un
   piege pour la prochaine lecture. */

/* Les quatre domaines de SAFE. Chacun est tenu par du code, pas par une
   promesse : voir la note de la section « contenu ». */
const DOMAINES: [string, string, string][] = [
  [
    "01",
    "Vos dossiers",
    "Le client, les parties, le mandat, les documents et les échéances restent reliés au même dossier.",
  ],
  [
    "02",
    "Votre facturation",
    "Le temps et les débours deviennent une facture avec ses taxes, puis un paiement suivi jusqu'à l'encaissement.",
  ],
  [
    "03",
    "Votre comptabilité",
    "Chaque facture, paiement, dépense et débours s'inscrit au journal sans que personne le ressaisisse. L'export vers votre logiciel comptable reste disponible.",
  ],
  [
    "04",
    "Votre conformité",
    "Le fidéicommis se rapproche à trois sources, et ce qu'un inspecteur demande est rassemblé au même endroit.",
  ],
];

/* Les deux points de vue de la section « equipe ». Chacun porte sa
   photographie : l'image dit de qui on parle avant qu'on ait lu le role. */
const VUES: [string, string, string, string][] = [
  [
    "/images/equipe/equipe-administrative.webp",
    "Trois personnes travaillent dans un bureau ; l'une consulte le tableau de bord SAFE.",
    "Pour l'équipe administrative",
    "L'adjointe conserve la connaissance du cabinet. Moins de ressaisie, de recherche et de suivis invisibles.",
  ],
  [
    "/images/equipe/avocate.webp",
    "Une avocate annote un document a son bureau, le Code civil du Quebec a portee de main.",
    "Pour l'avocate",
    "L'avocate conserve le jugement professionnel. Les montants, les échéances et ce qui demande une décision.",
  ],
];

const QUESTIONS: Objection[] = [
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
      <style dangerouslySetInnerHTML={{ __html: CSS + reglesObjections(".xc") }} />

      <nav id="nav">
        <a className="brand" href="#top" aria-label="SAFE, retour au haut de la page">
          <SafeLogo size={20} />
        </a>
        <div className="links">
          {MENU_PRINCIPAL.map((e) =>
            e.sous ? (
              <div className="grp" key={e.label}>
                <a href={e.href}>
                  {e.label}
                  <i className="chev" aria-hidden />
                </a>
                <div className="drop">
                  {e.sous.map((sc) => (
                    <a key={sc.href + sc.label} href={sc.href}>
                      {sc.label}
                      {sc.note ? <span>{sc.note}</span> : null}
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <a key={e.href} href={e.href} className={e.enAvant ? "en-avant" : undefined}>
                {e.label}
              </a>
            ),
          )}
        </div>
        {/* Le bouton de menu vit dans le groupe de droite, aux côtés de
            l'action : au téléphone les deux se tiennent ensemble contre le
            bord, au lieu d'être écartés aux deux extrémités de la barre par
            le space-between. */}
        <div className="navright">
          <a className="signin" href={ROUTES.connexion}>Connexion</a>
          <a className="parler" href={ROUTES.rencontre}>Parler à quelqu&apos;un</a>
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

      {/* Le rail de chapitres est retiré avec l'assemblage (dec. CEO 2026-08-24).
          Il ne portait qu'un jalon, « Assembler », qui nommait l'animation
          d'ouverture. Sans elle, le mot ne désigne plus rien : un repère qui
          pointe une scène disparue est pire qu'une absence de repère. */}

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
            {/* Titre court et exergue reviennent le 2026-08-27 : la maquette
                validee par le CEO (brief du 2026-08-26 21h31, confirme le 27 a
                5h41 -- « le titre de la section etait : SAFE tient votre
                cabinet ensemble, puis a droite la description ») montre les
                deux ensemble, jamais l'un a la place de l'autre. Le
                raisonnement du 2026-08-25 qui les avait fait fusionner
                supposait un hero SANS colonne de description ; la maquette en
                a une, l'exergue nomme la categorie et le titre porte le
                resultat, comme prevu a l'origine. */}
            <p className="kicker">Système de gestion pour cabinets d&apos;avocats</p>
            <div className="hero-row">
              <h1>Votre cabinet tient <em>ensemble.</em></h1>
              <p className="hero-desc">Vous travaillez dans le dossier. La facturation, la comptabilité et le fidéicommis en découlent, sans ressaisie.</p>
            </div>
            <div className="hero-actions">
              <a className="btn" href={ROUTES.evaluation}>Évaluer mon cabinet</a>
              {/* Le chemin tiede : un visiteur qui veut seulement regarder n'avait
                  que « Connexion ». Il mene a la demonstration, pas a une ancre. */}
              <a className="hero-second" href={ROUTES.rencontre}>
                Voir SAFE en action <span aria-hidden>→</span>
              </a>
            </div>
          </div>
          {/* La legende de l'extrait est retiree le 2026-08-26, demande CEO. Elle
              disait « Un extrait navigable de SAFE. Ouvrez un menu et circulez :
              l'ecran repond. » La bande d'etat de la fenetre le dit deja, et une
              page qui explique comment se servir d'elle-meme avoue qu'elle n'est
              pas evidente. */}
          <p id="hero-hint">
            Faites défiler vers le bas
            <i aria-hidden />
          </p>
        </div>
      </div>

      {/* ── Le bandeau de reassurance ────────────────────────────────────────
          Ces quatre faits vivaient en une ligne grise sous le titre, ou ils ne
          se lisaient pas : on regarde la fenetre, pas la petite ligne.

          Ils passent APRES l'illustration, en ruban qui glisse de la droite
          vers la gauche (demande CEO du 2026-08-25). Un ruban se remarque
          parce qu'il bouge, et il ne coute aucune hauteur au premier ecran.

          Le ruban est DOUBLE et se translate de la moitie de sa largeur : la
          seconde moitie prend la place de la premiere a l'instant ou celle-ci
          sort, donc la boucle ne saute pas. La copie est masquee aux lecteurs
          d'ecran, sinon la liste est annoncee deux fois.

          Il s'arrete au survol : un fait qu'on veut lire ne doit pas fuir. Et
          il ne bouge pas du tout pour qui a demande moins de mouvement.

          Aucun de ces quatre faits n'est neuf. Ils sont tenus ailleurs sur le
          site : un bandeau ne sert pas a glisser une promesse de plus. */}
      {/* RETIRÉ TEMPORAIREMENT le 2026-08-29, à la demande du CEO.
          Le balisage est mis en commentaire et NON supprimé : la feuille de
          style du ruban reste en place plus haut (.bandeau-reassurance,
          .ruban, @keyframes xcRuban), inerte tant qu'aucun élément ne la
          porte. Remettre le ruban en ligne se fait en décommentant ce bloc,
          sans rien reconstruire.

      <div className="bandeau-reassurance">
        <div className="ruban">
          <span className="serie">
            <b>Données hébergées au Canada</b>
            <b>Barreau du Québec et Barreau de l&apos;Ontario</b>
            <b>Registre de fidéicommis vérifiable</b>
            <b>Accès contrôlés selon les rôles du cabinet</b>
          </span>
          <span className="serie" aria-hidden>
            <b>Données hébergées au Canada</b>
            <b>Barreau du Québec et Barreau de l&apos;Ontario</b>
            <b>Registre de fidéicommis vérifiable</b>
            <b>Accès contrôlés selon les rôles du cabinet</b>
          </span>
        </div>
      </div>
      */}

      {/* ── 02 · Le dossier administratif ───────────────────────────────────
         Section reecrite le 2026-08-27 sur le brief de direction artistique du
         2026-08-26, choix CEO « remplacer le constat ».

         Elle disait « Vous ouvrez cinq endroits pour un seul dossier » et
         posait un PROBLEME. Le brief ne porte aucun mouvement de ce genre :
         ses six temps sont Conviction, Dossier, Facturation, Conformite,
         Realite, Projection. La section prouve donc desormais l'organisation
         administrative au lieu de decrire son absence.

         ⚠ CE QUE CETTE SECTION NE DOIT PAS FAIRE, et qu'elle faisait :
         mettre la facturation au premier plan. Le brief l'ecrit noir sur
         blanc. La fenetre menait sur « Total facture », « Total recu »,
         « Solde du » et un historique financier : c'est le mouvement 03, pas
         celui-ci. L'argent revient deux sections plus bas, une fois que le
         travail administratif a ete montre. */}
      <section className="recit" id="dossier">
        <div className="inner">
          <div className="tete">
            <h2>Chaque dossier s&apos;ouvre avec la bonne structure.</h2>
            <p className="dire">
              <b>SAFE organise le dossier selon le domaine de pratique</b> et la manière de
              travailler du cabinet.
            </p>
          </div>

          {/* ── L'interieur d'un dossier ────────────────────────────────────
              La liste ci-dessus prouve que SAFE range des dossiers. Elle ne
              prouve pas que les informations sont RELIEES a l'interieur d'un
              dossier, et c'est ce que la section promet. La fiche repond a une
              seule question : ou en est ce dossier.

              Le cabinet Demo ne porte aucun dossier qui reunisse a la fois du
              temps non facture, du fideicommis, une facture et une echeance :
              son dossier Tremblay reel n'a qu'une entree de 1,5 h et rien
              d'autre. La fiche est donc RECONSTRUITE, et elle le dit. Une
              histoire reconstruite presentee comme une donnee reelle est
              exactement ce que la regle interne interdit.

              Les chiffres se verifient entre eux : 1 983,32 - 1 000,00
              = 983,32 de solde, et 1,75 + 2,50 = 4,25 h non facturees, toutes
              consignees APRES l'emission de la facture, sinon elles y
              seraient. */}
          <div className="scene-produit">
            <div className="fenetre-fondante">
            <figure className="fenetre-produit contour-fondu">
              <div className="barre-fenetre">
                <span className="pastilles-fenetre" aria-hidden><i /><i /><i /></span>
                <span><em>SAFE</em> · Clinique Longueuil inc. · dossier 2026-017</span>
                <span className="ecart" />
                <span>Pratique · Dossiers</span>
              </div>

              {/* La fiche reprend la STRUCTURE de l'ecran client du produit,
                  dans l'ordre : l'en-tete et ses actions, les onglets, le bloc
                  d'alertes, les trois totaux, l'historique financier, puis les
                  deux colonnes information et fideicommis. Rien n'est invente
                  comme motif : c'est la page « clients » telle qu'elle est, avec
                  les donnees de la demonstration. */}
              {/* La barre de l'application, FIGEE. Elle situe la page : sans
                  elle, la fiche flotte hors du produit. Elle ne se navigue pas
                  parce que l'illustration ne porte que sur cette page-la, et
                  qu'un menu qui s'ouvre sur rien deçoit plus qu'il ne montre.
                  aria-hidden : un lecteur d'ecran n'a rien a y faire. */}
              <div className="barre-app" aria-hidden>
                <span className="mk"><SafeMark size={15} />SAFE</span>
                <span className="sep" />
                <span className="cab">Me Roy</span>
                <nav>
                  <span>Tableau de bord</span>
                  <span>Aujourd&apos;hui</span>
                  <span className="on">Pratique <b className="cv" /></span>
                  <span>Finances <b className="cv" /></span>
                  <span>Outils <b className="cv" /></span>
                  <span>Paramètres</span>
                </nav>
                <span className="ecart" />
                <span className="ch">Rechercher clie</span>
                <span className="cl">⌘K</span>
                <span className="cloche">2</span>
                <span>Temps</span>
                <span className="av">C</span>
              </div>

              <div className="fiche extrait-nav">
                {/* L'en-tete est celle d'un DOSSIER, plus celle d'un client.
                    Le dossier est reel : « 2026-002 · Beaulieu — achat
                    immeuble commercial », client « Constructions Beaulieu
                    inc. », type immobilier, ouvert le 10 aout 2026, releve
                    dans docs/design/references-app/dossiers.png. */}
                {/* ── L'EN-TETE DE L'ECRAN REEL ──────────────────────────
                    Realignee le 2026-08-27, apres la refonte du dossier
                    (commit « 1dfbfa8 »). Les donnees viennent d'une capture du
                    CEO : dossier 2026-017, client Clinique Longueuil inc.,
                    domaine immobilier, Me Camille Roy responsable. */}
                <div className="fiche-tete anime-bloc">
                  <div>
                    <p className="retour">&larr; Retour a la liste &middot; Clinique Longueuil inc.</p>
                    <h4>2026-017 &mdash; Clinique Longueuil &mdash; immobilier</h4>
                    {/* Les pastilles vivent SOUS le titre, pas a droite : c'est
                        l'ordre de l'ecran. */}
                    <p className="fiche-pastilles">
                      <span className="bt">Avocat : Me Camille Roy</span>
                      <span className="etat"><i aria-hidden />Actif</span>
                    </p>
                  </div>
                  {/* Les QUATRE actions reelles de l'en-tete, relevees sur
                      capture le 2026-08-27. « Resume IA » n'apparait que si la
                      cle d'API existe : elle est presente sur le poste du CEO,
                      d'ou sa presence ici. */}
                  <div className="actes">
                    <span className="bt">D&eacute;marrer le chrono</span>
                    <span className="bt">R&eacute;sum&eacute; IA</span>
                    <span className="bt">Voir le client</span>
                    <span className="bt principal">Modifier le dossier</span>
                  </div>
                </div>

                {/* Les CINQ onglets de l'ecran, avec leurs compteurs. C'est la
                    signature visuelle de la fiche depuis la refonte, et c'est
                    « Cartable (10) » qui porte l'argument de la section : dix
                    sections ouvertes parce que le dossier est immobilier.

                    De vrais boutons : le clavier les atteint sans qu'on pose un
                    role ni un index de tabulation a la main. */}
                <div className="onglets-fiche anime-bloc" role="tablist" aria-label="Vues du dossier">
                  <button type="button" role="tab" aria-selected="true" className="on" data-fiche-onglet="apercu">Vue d&rsquo;ensemble</button>
                  <button type="button" role="tab" aria-selected="false" data-fiche-onglet="dossiers">Cartable <small>(10)</small></button>
                  <button type="button" role="tab" aria-selected="false" data-fiche-onglet="carte">Pi&egrave;ces attendues <small>(0)</small></button>
                  <button type="button" role="tab" aria-selected="false" data-fiche-onglet="notes">Notes internes</button>
                  <button type="button" role="tab" aria-selected="false" data-fiche-onglet="documents">Documents <small>(0)</small></button>
                </div>

                <div className="vue on" data-fiche-vue="apercu">
                {/* ── LA SEQUENCE REELLE DE L'ECRAN ─────────────────────────
                    Relevee dans app/(app)/dossiers/[id]/page.tsx le
                    2026-08-27, apres que le CEO ait constate que la version
                    precedente etait INVENTEE : trois colonnes « parties,
                    etapes attendues, echeances » qui n'existent nulle part
                    dans le produit.

                    L'ecran reel enchaine, dans cet ordre exact :
                      1. l'en-tete colle, fil d'Ariane et client
                      2. « Personnes du dossier »
                      3. « Ou j'en etais ? »
                      4. « Etat de preparation »
                      5. le cartable a onglets verticaux

                    Les libelles ne sont pas rediges, ils sont pris aux
                    sources : « Personnes du dossier » a messages/fr.json:1385,
                    les pastilles a 1389-1401, les etats a
                    lib/dossiers/preparation-status.ts:325, les gravites a 333. */}
                {/* Le RESUME D'OUVERTURE ouvre la vue d'ensemble, comme dans
                    l'ecran depuis la refonte du 2026-08-27. Le domaine de
                    pratique le mene : c'est lui qui decide des dix sections du
                    cartable, et il ne s'affichait NULLE PART avant. */}
                <div className="carte-bloc anime-bloc">
                  <div className="ct"><p className="ctt">Le dossier</p></div>
                  <div className="lignes">
                    <div className="lg"><span>Domaine de pratique</span><span className="v">immobilier</span></div>
                    <div className="lg"><span>Client</span><span className="v">Clinique Longueuil inc.</span></div>
                    <div className="lg"><span>Ouvert le</span><span className="v">24 juin 2026 &middot; il y a 65 jours</span></div>
                    <div className="lg"><span>Statut</span><span className="v">Actif</span></div>
                    <div className="lg"><span>Avocat responsable</span><span className="v">Me Camille Roy</span></div>
                  </div>
                </div>

                <div className="duo-fiche anime-bloc">
                  <div className="carte-bloc">
                    <div className="ct"><p className="ctt">Personnes du dossier</p></div>
                    <div className="lignes">
                      <div className="lg"><span>Clinique Longueuil inc.</span><span className="v pastille-cl">Client principal</span></div>
                      <div className="lg"><span>9271-4408 Qu&eacute;bec inc.</span><span className="v pastille-ex">Partie adverse</span></div>
                      <div className="lg"><span>Caisse, pr&ecirc;teur</span><span className="v pastille-ex">Tiers</span></div>
                    </div>
                  </div>
                  {/* ⚠ Le bloc « Ou j'en etais ? » a ete RETIRE le 2026-08-27.
                      Il montrait une derniere action et une prochaine action
                      inventees, sur un dossier qui n'en a aucune : la capture
                      du CEO affiche « Aucune action enregistree pour
                      l'instant ».

                      Et il contredisait la refonte de l'ecran : celle-ci a
                      FUSIONNE « Ou j'en etais ? » dans « Etat du dossier »,
                      precisement parce que les deux repetaient la meme phrase.
                      Le garder ici aurait illustre un ecran qui n'existe plus. */}
                </div>

                {/* « Etat de preparation ». C'est CE bloc qui prouve la phrase
                    de conclusion du brief : ce qui a ete fait, ce qui manque,
                    ce qui doit suivre. Il n'a pas ete concu pour la vitrine,
                    il existe dans le produit. */}
                <div className="carte-bloc anime-bloc" style={{ marginTop: 14 }}>
                  <div className="ct">
                    <p className="ctt">&Eacute;tat du dossier</p>
                    <span>Incomplet &middot; Aucune action enregistr&eacute;e pour l&rsquo;instant.</span>
                  </div>
                  <div className="lignes">
                    <p className="ta">Manquants (5)</p>
                    <div className="lg"><span>Aucune assistante juridique assign&eacute;e</span><span className="v grav-crit">Critique</span></div>
                    <div className="lg"><span>Mandat absent</span><span className="v grav-crit">Critique</span></div>
                    <div className="lg"><span>Identit&eacute; du client non v&eacute;rifi&eacute;e</span><span className="v grav-crit">Critique</span></div>
                    <div className="lg"><span>Mode de facturation non d&eacute;fini</span><span className="v grav-crit">Critique</span></div>
                    <div className="lg"><span>1 section(s) cartable obligatoire(s) vide(s)</span><span className="v grav-comp">&Agrave; compl&eacute;ter</span></div>
                    <div className="lg"><span>Prochaine action</span><span className="v lien">Assigner une assistante au dossier &rarr;</span></div>
                  </div>
                </div>

                </div>

                {/* Le dossier lui-meme : ce que l'onglet « Dossiers » ouvre
                    dans le produit. Une ligne de dossier, puis ce qui lui est
                    rattache. */}
                {/* ── L'ONGLET CARTABLE ──────────────────────────────────
                    Les DIX sections reelles d'un dossier immobilier, relevees
                    sur une capture du CEO le 2026-08-27. Elles viennent de
                    lib/dossiers/cartable-templates/index.ts, ou neuf domaines
                    de pratique ouvrent chacun les leurs : « Offre et
                    convention » et « Recherche de titres » n'existent que dans
                    l'immobilier, un divorce ouvrirait « Pieces Madame (P-) » a
                    la place.

                    C'est TOUT l'argument de la section, et il se lit ici sans
                    qu'on ait besoin de l'ecrire. */}
                <div className="vue" data-fiche-vue="dossiers">
                  <div className="carte-bloc" style={{ marginTop: 18 }}>
                    <div className="ct">
                      <p className="ctt">Cartable du dossier</p>
                      <span>Dix sections, ouvertes parce que le dossier est immobilier</span>
                    </div>
                    <div className="lignes">
                      <div className="lg"><span>Mandat et engagement</span><span className="v attente">Aucun document</span></div>
                      <div className="lg"><span>Offre et convention</span><span className="v">&mdash;</span></div>
                      <div className="lg"><span>Financement et hypoth&egrave;que</span><span className="v">&mdash;</span></div>
                      <div className="lg"><span>Recherche de titres</span><span className="v">&mdash;</span></div>
                      <div className="lg"><span>Documents de cl&ocirc;ture</span><span className="v">&mdash;</span></div>
                      <div className="lg"><span>D&eacute;bours et ajustements</span><span className="v">&mdash;</span></div>
                      <div className="lg"><span>Correspondance</span><span className="v">&mdash;</span></div>
                      <div className="lg"><span>Fid&eacute;icommis</span><span className="v">&mdash;</span></div>
                      <div className="lg"><span>Notes et honoraires</span><span className="v">&mdash;</span></div>
                      <div className="lg"><span>Fermeture du dossier</span><span className="v">&mdash;</span></div>
                    </div>
                  </div>
                </div>

                {/* ── L'ONGLET NOTES INTERNES ────────────────────────────────
                    Le fil de la navette, exactement tel que la capture le
                    montre : aucun message, et les trois actions qui restent
                    disponibles malgre le vide. */}
                <div className="vue" data-fiche-vue="notes">
                  <div className="carte-bloc" style={{ marginTop: 18 }}>
                    <div className="ct">
                      <p className="ctt">Navette</p>
                      <span>fil interne</span>
                    </div>
                    <div className="lignes">
                      <div className="lg"><span>Aucun message sur ce dossier.</span><span className="v">&mdash;</span></div>
                      <div className="lg"><span>Approuver &middot; Renvoyer &middot; Marquer pr&ecirc;t pour revue</span><span className="v lien">Envoyer &rarr;</span></div>
                    </div>
                  </div>
                </div>

                {/* ── L'ONGLET DOCUMENTS ─────────────────────────────────────
                    Zero document, comme son compteur l'annonce. On montre
                    l'etat vide et son invite, tels que l'ecran les formule. */}
                <div className="vue" data-fiche-vue="documents">
                  <div className="carte-bloc" style={{ marginTop: 18 }}>
                    <div className="ct">
                      <p className="ctt">Documents r&eacute;dig&eacute;s</p>
                      <span>Documents cr&eacute;&eacute;s depuis l&rsquo;&eacute;diteur &middot; li&eacute;s &agrave; ce dossier</span>
                    </div>
                    <div className="lignes">
                      <div className="lg"><span>Aucun document r&eacute;dig&eacute; pour ce dossier.</span><span className="v lien">Cr&eacute;er le premier &rarr;</span></div>
                    </div>
                  </div>
                </div>

                {/* ── L'ONGLET PIECES ATTENDUES ──────────────────────────────
                    Zero piece sur ce dossier, comme le compteur de l'onglet
                    l'annonce. On montre donc l'ETAT VIDE et l'offre qui va
                    avec, telle que l'ecran la formule : SAFE peut creer la
                    liste reglementaire, puis le cabinet l'ajuste.

                    Inventer trois pieces pour remplir la vue serait exactement
                    l'erreur qui a fait suspendre cette section. */}
                <div className="vue" data-fiche-vue="carte">
                  <div className="carte-bloc" style={{ marginTop: 18 }}>
                    <div className="ct">
                      <p className="ctt">Pi&egrave;ces attendues</p>
                      <span>Aucune pi&egrave;ce attendue sur ce dossier</span>
                    </div>
                    <div className="lignes">
                      <div className="lg"><span>5 dates &agrave; saisir pour que les &eacute;ch&eacute;ances se calculent</span><span className="v attente">&Agrave; saisir</span></div>
                      <div className="lg"><span>SAFE peut cr&eacute;er la liste r&eacute;glementaire du domaine, avec les articles qui la commandent, puis vous l&rsquo;ajustez.</span><span className="v lien">Cr&eacute;er la liste &rarr;</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </figure>
            </div>

            {/* La phrase de conclusion vient APRES l'illustration : elle
                nomme ce qu'on vient de voir, au lieu de l'annoncer avant que
                l'oeil l'ait constate. */}
            {/* Phrase de conclusion du brief, mot pour mot. L'ancienne
                enumerait sept choses dont la facturation et le fideicommis :
                elle promettait donc le mouvement 03 au milieu du 02. */}
            <p className="conclusion-fiche">
              L&apos;équipe voit ce qui a été fait, ce qui manque et ce qui doit suivre.
            </p>
            {/* ⚠ L'AVERTISSEMENT MANQUAIT. Le commentaire de la section
                affirmait que la fiche reconstruite « le dit » ; la classe
                « .mention-demo » existait bien en feuille mais n'etait posee
                sur AUCUN element de la page. La regle interne du 2026-08-14
                interdit de presenter une donnee reconstruite comme reelle.

                Ce qui est reel : le dossier 2026-002, son client, son type et
                sa date d'ouverture, releves dans l'application. Ce qui est
                reconstruit : les parties, les etapes, les echeances et les
                pieces, le Cabinet Demo n'en portant pas. */}
            <p className="mention-demo">
              Dossier réel du cabinet de démonstration, 2026-017. <b>Parties, étapes, échéances et
              pièces reconstruites</b> pour illustrer la structure d&apos;une vente immobilière.
            </p>
          </div>


          <p className="sortie-section">
            <a href={ROUTES.cabinet}>Voir la structure par domaine de pratique &rarr;</a>
          </p>
        </div>
      </section>

      {/* ── 01 bis · Ce que SAFE contient ───────────────────────────────────
         Demande CEO du 2026-08-26 : « je veux que la presentation de SAFE soit
         plus claire et complete. Alors on va simplifier, mais equilibre. »

         La page prouvait DEUX domaines sur quatre : la facturation par la
         chaine du temps, la conformite par le rapprochement. Les dossiers
         n'apparaissaient qu'en creux, dans le constat, et la comptabilite
         nulle part. Quelqu'un qui parcourait la page ne pouvait pas savoir que
         SAFE tient un journal.

         Quatre blocs de meme poids, une phrase chacun, aucune image. C'est le
         seul endroit de la page ou l'offre se dit en entier, et il se lit en
         dix secondes. Il repond au constat qui le precede : cinq endroits,
         puis les quatre choses reunies.

         Chaque ligne est verifiable dans le code, pas promise. Pour la
         troisieme, qui est la plus facile a surestimer :
         lib/services/journal/billing-journal.ts inscrit chaque facture et
         chaque paiement au journal, cabinet-expense-journal.ts chaque depense,
         debours-dossier-journal.ts chaque debours paye. Ils sont appeles depuis
         invoice-service, payment-allocation-service et payment-reversal, donc
         personne ne ressaisit. */}
      <section className="recit" id="contenu">
        <div className="inner">
          <div className="tete">
            <h2>Quatre choses, réunies</h2>
            <p className="dire">
              <b>Vous les tenez déjà, séparément.</b> Rien à brancher, rien à ajouter plus
              tard.
            </p>
          </div>
          <div className="domaines">
            {DOMAINES.map(([n, titre, texte]) => (
              <div className="domaine" key={n}>
                <span className="n" aria-hidden>{n}</span>
                <p className="t">{titre}</p>
                <p className="d">{texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 02 · Le temps consigné devient la facture ───────────────────────
         Contrat de section : titre à gauche, une phrase à droite, la scène en
         dessous sur toute la largeur, l'index des modules en pied.

         La scène montre les DEUX bouts de la même chaîne, côte à côte : les
         heures telles qu'on les consigne, et la facture telle qu'elle en sort.
         L'arithmétique se vérifie sur la page : 0,25 + 1,00 + 0,25 = 1,50 h,
         à 450,00 $ l'heure = 675,00 $ d'honoraires ; TPS 5 % = 33,75 $ ;
         TVQ 9,975 % = 67,33 $ (les taux qu'applique lib/invoice-calculations) ;
         débours non taxables 195,00 $ ; total 971,08 $. */}
      <section className="recit" id="continuite">
        <div className="inner">
          <div className="tete">
            <h2>Vous consignez une heure. Elle arrive sur la facture.</h2>
            <p className="dire">
              <b>La même entrée traverse le dossier, la feuille de temps, la facture et le
              paiement.</b> Vous ne la saisissez qu&apos;une fois.
            </p>
          </div>

          {/* ── La chaine ──────────────────────────────────────────────────
              CORRECTION DU 2026-08-24. La chaine reliait une entree de 2,5 h
              a 350,00 $ l'heure a la facture 2026-008. Verification en base :
              cette entree appartient au dossier 2026-042, client Services
              Longueuil inc., alors que la facture 2026-008 appartient au
              dossier 2026-015, client Clinique Longueuil inc. Deux dossiers,
              deux clients. La chaine etait plus propre a lire et fausse.

              La vraie composition, lue dans la base du cabinet Demo et
              verifiee au cent pres :
                3,00 h (Cloture, 18 avril) + 2,75 h (Negociation, 8 juin)
                + 2,00 h (Cloture, 25 juin) = 7,75 h a 225,00 $ l'heure
                = 1 743,75 $ d'honoraires
                + TPS 5 % 87,19 $ + TVQ 9,975 % 173,94 $ = 2 004,88 $
                encaisse 1 042,54 $, reste du 962,34 $.

              Une facture porte plusieurs entrees : la chaine le DIT au lieu de
              faire croire qu'une heure devient une facture. */}
          <div className="chaine">
            <div className="maillon">
              <span className="k">Consigné</span>
              <span className="v">7,75 h</span>
              <span className="s">trois entrées · dossier 2026-015</span>
            </div>
            <span className="lien" aria-hidden>&rarr;</span>
            <div className="maillon">
              <span className="k">Valorisé</span>
              <span className="v">1 743,75 $</span>
              <span className="s">225,00 $ l&apos;heure</span>
            </div>
            <span className="lien" aria-hidden>&rarr;</span>
            <div className="maillon">
              <span className="k">Facturé</span>
              <span className="v">2 004,88 $</span>
              <span className="s">facture 2026-008 · TPS 87,19 $ · TVQ 173,94 $</span>
            </div>
            <span className="lien" aria-hidden>&rarr;</span>
            <div className="maillon">
              <span className="k">Encaissé</span>
              <span className="v">1 042,54 $</span>
              <span className="s">paiement partiel</span>
            </div>
            <span className="lien" aria-hidden>&rarr;</span>
            <div className="maillon reste">
              <span className="k">Reste dû</span>
              <span className="v">962,34 $</span>
              <span className="s">suivi encore actif</span>
            </div>
          </div>


          {/* ── L'extrait navigable de la chaine ────────────────────────────
              Les deux captures figees deviennent UN extrait, avec deux ecrans :
              les entrees telles qu'on les consigne, et la facture qu'elles
              composent. Meme cadre, meme barre figee, meme mecanique d'onglets
              que la fiche client plus haut.

              Tous les chiffres viennent de la base du cabinet Demo, dossier
              2026-015 : trois entrees a 225,00 $ l'heure dont la somme,
              1 743,75 $, est exactement le sous-total taxable de la facture
              2026-008. */}
          <div className="scene-produit">
            <div className="fenetre-fondante">
            <figure className="fenetre-produit contour-fondu">
              <div className="barre-fenetre">
                <span className="pastilles-fenetre" aria-hidden><i /><i /><i /></span>
                <span><em>SAFE</em> · Clinique Longueuil inc. · dossier 2026-015</span>
                <span className="ecart" />
                <span>Finances</span>
              </div>

              <div className="barre-app" aria-hidden>
                <span className="mk"><SafeMark size={15} />SAFE</span>
                <span className="sep" />
                <span className="cab">Me Roy</span>
                <nav>
                  <span>Tableau de bord</span>
                  <span>Aujourd&apos;hui</span>
                  <span>Pratique <b className="cv" /></span>
                  <span className="on">Finances <b className="cv" /></span>
                  <span>Outils <b className="cv" /></span>
                  <span>Paramètres</span>
                </nav>
                <span className="ecart" />
                <span className="ch">Rechercher clie</span>
                <span className="cl">⌘K</span>
                <span className="cloche">2</span>
                <span>Temps</span>
                <span className="av">C</span>
              </div>

              <div className="fiche extrait-nav">
                <div className="fiche-tete anime-bloc">
                  <div>
                    <p className="retour">&lsaquo; Retour à la facturation</p>
                    <h4>Clinique Longueuil inc.</h4>
                  </div>
                  <div className="actes">
                    <span className="bt">Exporter</span>
                    <span className="bt">Voir le PDF <i className="ext" aria-hidden /></span>
                  </div>
                </div>

                <div className="onglets-fiche anime-bloc" role="tablist" aria-label="Du temps à la facture">
                  <button type="button" role="tab" aria-selected="true" className="on" data-fiche-onglet="temps">Fiche de temps (3)</button>
                  <button type="button" role="tab" aria-selected="false" data-fiche-onglet="facture">Facture 2026-008</button>
                </div>

                <div className="vue on" data-fiche-vue="temps">
                  <div className="carte-bloc" style={{ marginTop: 18 }}>
                    <div className="ct">
                      <p className="ctt">Entrées du dossier</p>
                      <span>225,00 $ l&apos;heure · non facturées</span>
                    </div>
                    <div className="lignes">
                      <div className="lg"><span>25 juin — Clôture</span><span className="v">2,00 h · 450,00 $</span></div>
                      <div className="lg"><span>8 juin — Négociation</span><span className="v">2,75 h · 618,75 $</span></div>
                      <div className="lg"><span>18 avril — Clôture</span><span className="v">3,00 h · 675,00 $</span></div>
                      <div className="lg"><span>Total consigné</span><span className="v">7,75 h · 1 743,75 $</span></div>
                    </div>
                  </div>
                </div>

                <div className="vue" data-fiche-vue="facture">
                  <div className="totaux" style={{ marginTop: 18 }}>
                    <div className="tot"><p className="k">Total</p><p className="v">2 004,88 $</p><p className="s">émise le 2 août 2026</p></div>
                    <div className="tot"><p className="k">Déjà payé</p><p className="v">1 042,54 $</p><p className="s">paiement partiel</p></div>
                    <div className="tot"><p className="k">Solde dû</p><p className="v">962,34 $</p><p className="s">échéance 1er sept.</p></div>
                  </div>
                  <div className="carte-bloc">
                    <div className="ct">
                      <p className="ctt">Facture 2026-008</p>
                      <span>Ce qui la compose</span>
                    </div>
                    <div className="lignes">
                      <div className="lg"><span>Honoraires · 7,75 h à 225,00 $</span><span className="v">1 743,75 $</span></div>
                      <div className="lg"><span>TPS 5 %</span><span className="v">87,19 $</span></div>
                      <div className="lg"><span>TVQ 9,975 %</span><span className="v">173,94 $</span></div>
                      <div className="lg"><span>Total</span><span className="v">2 004,88 $</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </figure>
            </div>
          </div>

          <p className="sortie-section">
            <a href={ROUTES.cabinet + "#chaine"}>Voir la facturation &rarr;</a>
          </p>

          <div className="index-modules">
            <div className="mod"><span className="n">1.1</span><span className="t">Dossiers</span></div>
            <div className="mod colonne-droite"><span className="n">1.2</span><span className="t">Feuille de temps</span></div>
            <div className="mod"><span className="n">1.3</span><span className="t">Facturation</span></div>
            <div className="mod colonne-droite"><span className="n">1.4</span><span className="t">Paiements</span></div>
          </div>
        </div>
      </section>


      {/* ── 03 · Le fidéicommis se vérifie à trois sources ──────────────────
         Même contrat. La scène montre le rapprochement tel qu'il se présente
         au cabinet : trois sources, un montant, et le journal en dessous, où
         une correction s'ajoute sans que l'écriture d'origine disparaisse.

         Le refus affiché est le message exact de
         lib/services/fideicommis/errors.ts, pas une formule écrite pour la
         vitrine. */}
      <section className="recit" id="verification">
        <div className="inner">
          <div className="tete">
            <h2>Vos trois sources se comparent chaque mois</h2>
            <p className="dire">
              <b>Le relevé bancaire, le registre et les soldes par client.</b> SAFE signale
              l&apos;écart, et c&apos;est vous qui décidez ce qu&apos;on en fait.
            </p>
          </div>

          {/* ── L'extrait navigable du fideicommis ──────────────────────────
              Meme modele que les deux sections precedentes : un cadre, une
              barre d'application figee, un contour fondu, deux ecrans.

              Tous les chiffres sont releves dans la base du cabinet Demo :
              huit depots pour 92 200,00 $, un retrait de 2 925,00 $, donc un
              solde de 89 275,00 $ reparti sur sept clients. */}
          <div className="scene-produit">
            <div className="fenetre-fondante">
            <figure className="fenetre-produit contour-fondu">
              <div className="barre-fenetre">
                <span className="pastilles-fenetre" aria-hidden><i /><i /><i /></span>
                <span><em>SAFE</em> · comptes en fidéicommis</span>
                <span className="ecart" />
                <span>Finances</span>
              </div>

              <div className="barre-app" aria-hidden>
                <span className="mk"><SafeMark size={15} />SAFE</span>
                <span className="sep" />
                <span className="cab">Me Roy</span>
                <nav>
                  <span>Tableau de bord</span>
                  <span>Aujourd&apos;hui</span>
                  <span>Pratique <b className="cv" /></span>
                  <span className="on">Finances <b className="cv" /></span>
                  <span>Outils <b className="cv" /></span>
                  <span>Paramètres</span>
                </nav>
                <span className="ecart" />
                <span className="ch">Rechercher clie</span>
                <span className="cl">⌘K</span>
                <span className="cloche">2</span>
                <span>Temps</span>
                <span className="av">C</span>
              </div>

              <div className="fiche extrait-nav">
                <div className="fiche-tete anime-bloc">
                  <div>
                    <p className="retour">&lsaquo; Retour à la facturation</p>
                    <h4>Comptes en fidéicommis</h4>
                  </div>
                  <div className="actes">
                    <span className="bt">Relevé mensuel</span>
                    <span className="bt">Inspection <i className="ext" aria-hidden /></span>
                  </div>
                </div>

                <div className="onglets-fiche anime-bloc" role="tablist" aria-label="Le fidéicommis">
                  <button type="button" role="tab" aria-selected="true" className="on" data-fiche-onglet="comptes">Comptes (7)</button>
                  <button type="button" role="tab" aria-selected="false" data-fiche-onglet="rappro">Rapprochement</button>
                </div>

                <div className="vue on" data-fiche-vue="comptes">
                  <div className="totaux" style={{ marginTop: 18 }}>
                    <div className="tot"><p className="k">Solde total</p><p className="v">89 275,00 $</p><p className="s">7 clients avec des fonds</p></div>
                    <div className="tot"><p className="k">Dépôts du mois</p><p className="v">0,00 $</p><p className="s">août 2026</p></div>
                    <div className="tot"><p className="k">Retraits du mois</p><p className="v">2 925,00 $</p><p className="s">un retrait, le 4 août</p></div>
                  </div>
                  <div className="carte-bloc">
                    <div className="ct">
                      <p className="ctt">Sommes détenues, client par client</p>
                      <span>Chaque somme appartient à quelqu&apos;un</span>
                    </div>
                    <div className="lignes">
                      <div className="lg"><span>Gestion Outremont inc.</span><span className="v">21 800,00 $</span></div>
                      <div className="lg"><span>Marc Bouchard</span><span className="v">16 900,00 $</span></div>
                      <div className="lg"><span>Distribution Beauport s.e.n.c.</span><span className="v">16 700,00 $</span></div>
                      <div className="lg"><span>Félix Gagnon</span><span className="v">13 200,00 $</span></div>
                      <div className="lg"><span>Trois autres clients</span><span className="v">20 675,00 $</span></div>
                    </div>
                  </div>
                </div>

                <div className="vue" data-fiche-vue="rappro">
                  <div className="carte-bloc" style={{ marginTop: 18 }}>
                    <div className="ct">
                      <p className="ctt">Trois sources, une comparaison</p>
                      <span>Ce qui doit concorder chaque mois</span>
                    </div>
                    <div className="lignes">
                      <div className="lg"><span>01 · Le relevé de la banque<br /><small>ce que l&apos;institution dit détenir</small></span><span className="v attente">à importer</span></div>
                      <div className="lg"><span>02 · Le registre de fidéicommis<br /><small>huit dépôts, un retrait</small></span><span className="v">89 275,00 $</span></div>
                      <div className="lg"><span>03 · La somme des soldes par client<br /><small>ce qui appartient à chacun</small></span><span className="v">89 275,00 $</span></div>
                      <div className="lg"><span>Écart entre le registre et les clients</span><span className="v">0,00 $</span></div>
                    </div>
                  </div>
                  <p className="statut-rappro">
                    Le registre et les soldes par client concordent. <b>Le relevé bancaire doit
                    encore être importé avant la certification</b> : le rapprochement du mois
                    n&apos;est pas terminé.
                  </p>
                </div>
              </div>
            </figure>
            </div>
          </div>

          <p className="sortie-section">
            <a href={ROUTES.cabinet + "#fideicommis"}>Voir le rapprochement en détail &rarr;</a>
          </p>

          <div className="index-modules">
            <div className="mod"><span className="n">2.1</span><span className="t">Comptes en fidéicommis</span></div>
            <div className="mod colonne-droite"><span className="n">2.2</span><span className="t">Rapprochement</span></div>
            <div className="mod"><span className="n">2.3</span><span className="t">Comptabilité</span></div>
            <div className="mod colonne-droite"><span className="n">2.4</span><span className="t">Rapports</span></div>
          </div>
        </div>
      </section>

      {/* La section « Ce que le cabinet retrouve, sans le chercher » tenait
         ici : trois fenetres repliquees, une question sous chacune. Retiree le
         2026-08-26 sur decision du CEO.

         Ses trois repliques etaient conformes a la procedure et leurs chiffres
         venaient de la base : c'est la SECTION qui sortait, pas leur exactitude.
         Si elles reviennent un jour, l'historique les porte, et
         docs/design/PROCEDURE_EXTRAITS_VITRINE.md dit comment en refaire. */}

      {/* ── 06 · L'équipe ───────────────────────────────────────────────────
         Deux points de vue, jamais un seul : c'est l'adjointe qui tient le
         cabinet en mouvement et l'avocate qui décide.

         Le CEO demandait le 2026-08-26 « qu'on sente le titre et qu'on voie
         l'argumentation ». J'avais repondu en sortant cette section du contrat
         du site : titre pleine largeur, phrase dessous. C'etait la mauvaise
         reponse, et il l'a corrigee le jour meme : LE TITRE ET SON SOUS-TITRE
         RESTENT DE PART ET D'AUTRE, dans CHAQUE section. Une section qui
         invente sa propre tete casse la colonne que toutes les autres tiennent,
         et le lecteur perd le repere qui lui dit qu'un chapitre commence.

         Ce qui separait vraiment le titre de l'argument, ce n'etait pas la
         tete : c'etaient deux ecrans de vide, puis deux colonnes de petit gris
         tout en bas. C'est cela qui est corrige. Chaque point de vue devient
         une carte, sa photographie, son role, sa phrase, et les cartes
         commencent tout de suite sous la tete. L'image dit de qui on parle
         avant qu'on ait lu le libelle. */}
      <section className="recit" id="equipe">
        <div className="inner">
          <div className="tete">
            <h2>SAFE soutient votre cabinet</h2>
            <p className="dire">
              {/* « Il lui donne un systeme commun pour travailler » survivait au
                  test de substitution du bareme : n'importe quel concurrent
                  pouvait l'ecrire. La phrase dit maintenant ce qui est retire
                  et ce qui ne l'est pas. Le TITRE ne bouge pas, il est du CEO. */}
              <b>Votre adjointe connaît vos dossiers mieux qu&apos;un logiciel ne le fera.</b>{" "}
              SAFE lui retire la ressaisie, pas la connaissance.
            </p>
          </div>

          <div className="deux-vues">
            {VUES.map(([image, alt, role, phrase]) => (
              <figure className="vue" key={role}>
                <Image
                  src={image}
                  alt={alt}
                  width={1400}
                  height={933}
                  /* L'emplacement est borne a 422 px depuis que « .deux-vues »
                     l'est a 880. Sans cette mesure, Next servirait le fichier
                     taille pour une demi-page. */
                  sizes="(max-width: 900px) 100vw, 440px"
                  className="vue-photo"
                />
                <figcaption>
                  {/* « .rang » est l'exergue en capitales espacees du reste du
                      site. Il ne sert plus ici : decision CEO du 2026-08-26,
                      ces deux libelles passent en minuscules. Une capitale
                      espacee annonce une CATEGORIE ; ces deux-la nomment
                      quelqu'un, et un nom se lit comme un nom. */}
                  <p className="vue-role">{role}</p>
                  <p>{phrase}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* La section « Commencer avec SAFE » tenait ici : les trois temps de
         la mise en route, le panneau des garanties, les deux cartes de forfait
         et le programme des fondateurs. Retiree le 2026-08-26 sur decision du
         CEO, « toute cette section sera supprimee ».

         Elle n'emporte rien avec elle : /tarification sert le meme modele,
         depuis le meme composant (./forfaits.tsx), et la barre de navigation y
         mene depuis chaque page. La section « cta » qui ferme l'accueil garde
         les deux actions, evaluer et reserver une rencontre. */}

      {/* ── 08 · Les questions ──────────────────────────────────────────── */}
      <section className="recit" id="questions">
        <div className="inner">
          {/* ── Vos objections ─────────────────────────────────────────────
              Le titre disait « Avant de nous parler », ce qui annonce une
              formalite. Un avocat qui lit cette page n'a pas des questions, il
              a des OBJECTIONS, et les nommer ainsi vaut mieux que de les
              deguiser. Demande CEO du 2026-08-26.

              Chaque objection se replie. On voit huit intitules au lieu de
              huit paragraphes, donc la section tient dans un ecran, et on
              n'ouvre que ce qui nous concerne.

              « details » et « summary » plutot qu'un etat React : le repli
              fonctionne sans JavaScript, la recherche interne du navigateur
              trouve le texte replie, et le clavier le pilote sans qu'on ait
              rien a ecrire. */}
          <div className="tete">
            <h2>Vos objections</h2>
            <p className="dire">
              <b>Nous en entendons cinq souvent.</b> Ouvrez celle qui vous concerne.
            </p>
          </div>
          {/* L'accordeon vit dans ./objections.tsx : /faq sert le MEME modele
              depuis le meme composant. */}
          <Objections entrees={QUESTIONS} />
          <a className="more" href={ROUTES.faq}>Lire toutes les questions →</a>
        </div>
      </section>

      {/* ── 09 · La prochaine étape ─────────────────────────────────────── */}
      <section className="recit" id="cta">
        <div className="inner">
          <div className="tete">
            <h2>Voyons ce que ça changerait chez vous</h2>
            <p className="dire">
              <b>Une quinzaine de minutes de questions sur votre pratique.</b> Vous recevez un
              rapport chiffré sous 24 heures.
            </p>
          </div>
          <div className="actions">
            <a className="btn" href={ROUTES.evaluation}>Évaluer mon cabinet</a>
            <a className="btn ghost" href={ROUTES.rencontre}>Réserver une rencontre</a>
          </div>
          <p className="reassure">Gratuit, sans carte de crédit. Rapport sous 24 heures.</p>
          {/* La mention vivait dans le pied de page de l'accueil. Elle concerne
              cette page, pas le site : elle rejoint donc la fin du récit, à la
              place exacte qu'elle occupe sur Fonctionnalités et sur À propos.

              Elle a changé le jour où les deux grands écrans ont cessé d'être
              des maquettes : ce sont des captures de l'application, sur un
              cabinet de démonstration. Dire « maquettes » serait maintenant
              une inexactitude à notre désavantage. */}
          <p className="mention-maquettes">
            La fiche de temps et les comptes en fidéicommis sont des captures de SAFE, prises sur
            un cabinet de démonstration : les dossiers et les montants qu’on y lit sont fictifs,
            l’interface est celle du logiciel. L’écran d’ouverture en est un extrait navigable.
          </p>
        </div>
      </section>

    </div>

      {/* Hors de .xc : la feuille injectée de l'accueil ne doit rien peindre
          dans un composant partagé par tout le site. */}
      <AnimationsRecit />
      <Footer />
    </>
  );
}
