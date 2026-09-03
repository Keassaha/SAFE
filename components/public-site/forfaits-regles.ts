/**
 * Les règles de la section tarifaire régulière et du panneau des fondateurs.
 *
 * Elles vivent hors de `forfaits.tsx` pour deux raisons. La première est la
 * limite de taille d'un composant d'interface (PS-093) : le balisage et trois
 * cents lignes de feuille dans le même fichier la dépassaient. La seconde est
 * qu'une feuille se relit mieux d'un bloc que coupée par du JSX.
 *
 * La portée est un paramètre, comme partout sur la vitrine (voir `recit.tsx`) :
 * il n'y a qu'un endroit où « une carte de forfait » se décide, et il sert
 * n'importe quelle racine.
 *
 * ── Ce que cette feuille NE FAIT PAS ─────────────────────────────────────────
 * Aucune hexadécimale (PS-001), aucune couleur Tailwind générique (PS-002),
 * aucune ombre sur un élément du flux (PS-005), aucune durée ni courbe écrite à
 * la main (PS-040, PS-041), aucun agrandissement au survol écrit ici (PS-043 :
 * le soulèvement vient de `.safe-zoom`, dans globals.css).
 *
 * Quatre tailles typographiques seulement (PS-007) :
 *   --t-menu      l'étiquette de catégorie, la marque, la mention, la note
 *   --t-detail    le sélecteur, le bouton, l'en-tête et les lignes de détail
 *   --t-corps     le nom du forfait
 *   --t-argument  le prix
 *
 * Le prix reste SOUS le titre d'ouverture de la page, mesuré à 24,3 px : un
 * montant qui pèserait plus que le titre dirait que la page parle du chiffre
 * avant de dire de quoi elle parle.
 */

import { MATIERE_VERTE, MATIERE_VERTE_IMAGE, OMBRE_VERTE, encresSurVert } from "./matiere-verte";

export function reglesTarifs(p: string): string {
  return `
  /* ═══ La section tarifaire régulière ═══════════════════════════════════════
     Le titre d'ouverture, la phrase, le sélecteur, les deux colonnes.

     Elle REMONTE, et l'ouverture descend vers elle. Le contrat de section pose
     176 px au-dessus des forfaits et l'ouverture en laisse 112 sous elle, soit
     près de trois cents pixels de vide entre le titre de la page et le premier
     prix. Sur une page dont le seul objet est de comparer deux montants, ce
     vide repoussait les deux cubes hors du premier écran.

     Le resserrement de l'ouverture est porté par ':has()' et non par une règle
     générale : il ne vaut que pour la page qui porte cette section, les autres
     pages du site gardent leur respiration. */
  ${p}:has(#forfaits) .recit.ouverture {
    padding-block: clamp(104px, 14vh, 148px) clamp(24px, 3vh, 36px);
  }
  ${p} .recit#forfaits { padding-block: clamp(24px, 3vh, 36px) clamp(64px, 9vh, 112px); }

  /* ── Le sélecteur de période ───────────────────────────────────────────────
     Un rail, deux choix de largeur égale, et un pouce qui glisse. Les deux
     boutons partagent la même largeur ('flex: 1 1 0') pour que le pouce se
     déplace d'exactement une demi-largeur : une position calculée sur des
     textes de longueurs différentes se serait décalée au premier mot changé.

     Le pouce est un RENFORT. L'état réel est porté par 'aria-pressed' et par
     l'encre du libellé, jamais par la seule position (PS-052). */
  /* Le rail est un CREUX, le pouce une surface qui en ressort. L'inverse,
     essayé d'abord, peignait le choix courant en gris sur un rail blanc : un
     aplat gris posé sur ce qui se sélectionne est précisément ce que PS-045
     interdit, et il disait « désactivé » là où il fallait lire « choisi ». */
  ${p} .periode {
    position: relative;
    display: flex;
    width: 100%;
    max-width: 340px;
    margin: 0 auto clamp(24px, 3.2vh, 32px);
    padding: 4px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--si-surface2);
  }
  ${p} .periode-pouce {
    position: absolute;
    top: 4px;
    bottom: 4px;
    left: 4px;
    width: calc(50% - 4px);
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--si-surface);
    transition: transform var(--safe-motion-slow) var(--safe-motion-ease);
  }
  ${p} .periode-pouce.a-droite { transform: translateX(100%); }
  /* ── Le calage vertical du libellé ────────────────────────────────────────
     'align-items: baseline' aligne « Annuel » et « 2 mois offerts » sur une
     même ligne de base, ce qu'on veut : deux tailles différentes posées côte à
     côte doivent partager leur pied, sinon la mention flotte.

     Mais sur une SEULE ligne de flexbox, l'alignement par ligne de base place
     la ligne en HAUT de la boîte. Mesuré le 2026-09-03 sur une fenêtre de
     1440 : le texte tombait à 287,3 px quand le bouton et le pouce sont
     centrés à 298,3, soit onze pixels trop haut dans un contrôle de 44. Le
     libellé n'était pas centré dans sa pastille, et ça se voyait.

     'flex-wrap: wrap' n'autorise pas un retour à la ligne ici, les deux
     libellés tenant largement : il sert à activer 'align-content', qui est la
     seule propriété capable de centrer la ligne SANS renoncer à la ligne de
     base à l'intérieur. Passer en 'align-items: center' aurait centré chaque
     mot sur son propre milieu et cassé le pied commun. */
  ${p} .periode-choix {
    position: relative;
    flex: 1 1 0;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    align-content: center;
    justify-content: center;
    gap: 8px;
    min-height: 44px;
    padding: 0 8px;
    border: 0;
    border-radius: 6px;
    background: none;
    font-family: var(--sans);
    font-size: var(--t-detail);
    font-weight: 400;
    color: var(--muted);
    cursor: pointer;
    transition: color var(--safe-motion-normal) var(--safe-motion-ease);
  }
  ${p} .periode-choix[aria-pressed="true"] { color: var(--si-ink); }
  ${p} .periode-choix:focus-visible {
    outline: 2px solid var(--si-ink-strong);
    outline-offset: -1px;
  }
  /* Le gain est une métadonnée du choix, pas une promesse : il prend la mesure
     des libellés et l'encre verte de l'accent éditorial, jamais un fond. */
  ${p} .periode-gain {
    font-family: var(--sans);
    font-size: var(--t-menu);
    color: var(--si-brand-green);
    white-space: nowrap;
  }

  /* ── Les deux colonnes ────────────────────────────────────────────────────
     Centrées comme un GROUPE, et bridées en largeur : à pleine page, chaque
     colonne dépassait cinq cents pixels et les deux prix se retrouvaient à un
     écran l'un de l'autre, ce qui est le contraire d'une comparaison. */
  ${p} .colonnes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(16px, 2.4vw, 24px);
    max-width: 760px;
    margin: 0 auto;
  }
  ${p} .colonne { display: flex; flex-direction: column; }

  /* ── Le cube ──────────────────────────────────────────────────────────────
     Trois pièces par colonne, et celle-ci ne porte que la décision. Les deux
     cubes tiennent la même hauteur sans qu'on la fixe : leur structure interne
     est identique, et la mention du bas réserve deux lignes pour que l'état
     annuel, plus long, ne déplace rien (voir '.cube-mention').

     Rayon de 12 px, contre 6 pour le bouton et un rayon plein pour la marque :
     trois rôles, trois rayons. Un rayon identique partout est un tell (A4). */
  ${p} .cube {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 216px;
    padding: 24px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--si-surface);
    transition:
      border-color var(--safe-motion-normal) var(--safe-motion-ease),
      background-color var(--safe-motion-normal) var(--safe-motion-ease);
  }
  /* Le pousseur. C'est lui qui envoie le prix au bas du cube et laisse le nom
     en haut, sans qu'aucune hauteur soit écrite. */
  ${p} .cube-vide { flex: 1 1 auto; min-height: 24px; }

  ${p} .cube-categorie {
    font-family: var(--sans);
    font-size: var(--t-menu);
    font-weight: 400;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted);
    /* Le nom passe sous la marque « Recommandé » plutôt qu'à côté : à 340 px
       de colonne, les deux sur une ligne se touchaient. */
    max-width: calc(100% - 116px);
  }
  /* Le nom prend la mesure du CORPS, pas celle de la prose qui explique.
     Mesuré : à --t-explique il pesait 19,8 px contre 22,4 pour le prix. Trois
     pixels d'écart ne se lisent pas comme une hiérarchie, ils se lisent comme
     une hésitation, et le prix cessait d'être l'information décisive de la
     colonne (DH H3). À 16 px l'écart est net, et la famille achève de séparer
     les deux rôles : le nom se lit, le prix se compte. */
  ${p} .cube-nom {
    margin-top: 8px;
    font-family: var(--sans);
    font-size: var(--t-corps);
    font-weight: 400;
    line-height: 1.2;
    letter-spacing: -0.014em;
    color: var(--si-ink);
  }

  /* ── La marque « Recommandé » ─────────────────────────────────────────────
     Un mot ET un signe, jamais une couleur seule (PS-052, L4). La coche est
     dessinée par deux bordures pivotées : un « ✓ » est classé emoji par le
     standard, et son dessin change d'une fonte à l'autre (A6).

     Rayon plein, parce qu'elle DÉCRIT. Ce qui déclenche garde un rayon court. */
  ${p} .cube-marque {
    position: absolute;
    top: 20px;
    right: 20px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border: 1px solid rgb(var(--si-verified-rgb) / 0.34);
    border-radius: 999px;
    font-family: var(--sans);
    font-size: var(--t-menu);
    font-weight: 400;
    color: var(--si-verified);
    white-space: nowrap;
    transition:
      border-color var(--safe-motion-normal) var(--safe-motion-ease),
      color var(--safe-motion-normal) var(--safe-motion-ease);
  }
  ${p} .cube-coche {
    width: 8px;
    height: 5px;
    border-left: 1.4px solid currentColor;
    border-bottom: 1.4px solid currentColor;
    transform: rotate(-45deg);
    transform-origin: center;
    margin-top: -3px;
  }

  /* ── Le prix ──────────────────────────────────────────────────────────────
     Le nombre en mono tabulaire (PS-010), jamais arrondi (PS-012) : 149,99 $
     reste 149,99 $. L'unité et la période lui restent attachées sur la même
     ligne de base, pour qu'on lise « 99 $ / mois » comme une seule chose. */
  ${p} .cube-prix {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }
  ${p} .prix-nombre {
    font-family: var(--mono);
    font-size: var(--t-argument);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.01em;
    color: var(--si-ink);
  }
  ${p} .prix-unite {
    font-family: var(--sans);
    font-size: var(--t-detail);
    color: var(--muted);
  }
  /* La mention ne réserve AUCUNE hauteur, et c'est le pousseur qui rend le
     cube stable. J'avais d'abord réservé deux lignes, en me disant que la
     mention mensuelle, plus longue que l'annuelle, passerait à la ligne et
     ferait sauter le bouton au changement de période. Mesuré : les deux
     tiennent sur une ligne de 16 px, et la réserve ajoutait donc seize pixels
     de vide au bas des deux cubes.

     Le cube tient une hauteur MINIMALE fixe et '.cube-vide' absorbe la
     différence : la mention peut passer à deux lignes sans que rien bouge en
     dessous, tant que le contenu reste sous cette hauteur. Réserver en plus
     revenait à payer deux fois la même sécurité. */
  ${p} .cube-mention {
    margin-top: 8px;
    font-family: var(--sans);
    font-size: var(--t-menu);
    line-height: 1.45;
    color: var(--muted);
  }

  /* ── L'état sélectionné du cube ───────────────────────────────────────────
     Le dégradé se révèle DANS LE CUBE, jamais sur la colonne ni sur la liste.

     PS-006 interdit le dégradé sur une surface de contenu. Le cube n'en est
     pas une : c'est la surface de DÉCISION de la colonne, du même rang que la
     pastille de navigation active de 'Header.tsx'. Il en reprend donc le
     dégradé mot pour mot ('.safe-action-degrade', encre vers vert forêt à
     135°), auquel s'ajoutent DEUX halos décentrés dans l'angle haut droit : le
     vert vérifié pour la masse, la pointe vive par-dessus pour la lumière. Un
     dégradé linéaire seul se lit comme un aplat de gabarit ; deux halos
     décentrés se lisent comme une matière.

     Les halos ne sont pas décoratifs, ils SÉPARENT. Le bouton posé douze
     pixels plus bas porte le même dégradé linéaire : sans eux, le cube survolé
     et son bouton fusionnaient en un seul bloc sombre, et la colonne perdait
     les trois pièces qui font toute sa lecture.

     Sur cette surface, les encres s'inversent en ton « onBrand » : le texte
     passe au blanc de surface, l'accent au vert clair (IDENTITE_SAFE §4.3). */
  /* La matière vient de 'matiere-verte.ts', la même qu'à l'accueil (décision
     CEO du 2026-09-03, « la même couleur de dégradé et texturée »).

     Le cube portait jusque-là sa propre recette, trois couches sans grain, et
     elle avait dérivé de celle de l'accueil sur trois points : l'angle du
     linéaire (135° contre 152°), la position des halos, et surtout l'absence
     de bruit. Deux verts de marque qui ne se ressemblent pas sur deux pages du
     même site, c'est exactement ce que le CEO a vu.

     ── Le vert devient PERMANENT sur le recommandé (2026-09-03) ──────────────
     Il ne se révélait qu'au survol, et sur les deux cubes. Trois défauts que
     la mesure confirme :

     1. la recommandation ne se voyait pas. Au repos, deux cubes blancs
        identiques à une pastille près : il fallait promener la souris pour
        apprendre lequel est conseillé, donc l'information n'existait pas pour
        qui ne bouge pas ;
     2. le vert répondait aussi sur Solo. Deux cubes qui s'allument de la même
        façon ne disent plus lequel est mis en avant, ils disent « survolé » ;
     3. le téléphone portait déjà la règle juste, en permanence, dans son
        propre bloc. La version bureau la contredisait.

     Le survol redevient ce qu'il doit être : un accusé de réception, porté par
     '.safe-zoom' et par le filet, jamais par un changement de nature. */
  ${p} .tarifs {
    --cube-allume: ${MATIERE_VERTE_IMAGE};
  }
  ${p} .cube-recommande {
    border-color: transparent;
    background-color: var(--si-action-vert);
    background-image: var(--cube-allume);
    background-size: 180px 180px, auto, auto, auto, auto;
  }
  /* Sur le vert, les encres s'inversent en ton « onBrand » : le texte passe au
     blanc de surface, l'accent au vert clair (IDENTITE_SAFE §4.3). */
  ${p} .cube-recommande .cube-nom,
  ${p} .cube-recommande .prix-nombre { color: var(--si-surface); }
  ${p} .cube-recommande .cube-categorie,
  ${p} .cube-recommande .prix-unite,
  ${p} .cube-recommande .cube-mention { color: rgb(var(--si-surface-rgb) / 0.74); }
  ${p} .cube-recommande .cube-marque {
    color: var(--si-verified-on-forest);
    border-color: rgb(var(--si-verified-on-forest-rgb) / 0.44);
  }
  /* Solo répond au survol par son filet seulement. Il ne devient pas vert : le
     vert dit « recommandé » sur cette page, et un Solo vert au passage de la
     souris démentirait la pastille du cube d'à côté. */
  ${p} .cube:not(.cube-recommande):hover,
  ${p} .colonne:focus-within .cube:not(.cube-recommande) {
    border-color: var(--si-border-strong);
  }

  /* ── Le bouton ────────────────────────────────────────────────────────────
     Sous le cube, jamais dedans, et exactement à sa largeur. Une seule action
     pleine par écran (PS-020) : Cabinet la prend, Solo garde un filet, sans
     lequel rien ne dirait qu'il est cliquable (DH P6).

     Rayon de 6 px : celui des contrôles. Le cube en a douze, la marque un
     rayon plein. */
  ${p} .tarif-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 46px;
    margin-top: 12px;
    padding: 0 16px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--si-surface);
    font-family: var(--sans);
    font-size: var(--t-detail);
    font-weight: 400;
    color: var(--si-ink);
    text-align: center;
    transition:
      border-color var(--safe-motion-normal) var(--safe-motion-ease),
      background-color var(--safe-motion-normal) var(--safe-motion-ease);
  }
  ${p} .tarif-action:hover { border-color: var(--si-border-strong); }
  ${p} .tarif-action.pleine {
    border-color: var(--si-ink-strong);
    background-color: var(--si-ink-strong);
    background-image: linear-gradient(135deg, var(--si-ink) 0%, var(--si-action-vert) 100%);
    color: var(--si-surface);
  }
  ${p} .tarif-action.pleine:hover {
    background-image: linear-gradient(135deg, var(--si-ink-strong-soft) 0%, var(--si-verified) 100%);
  }
  ${p} .tarif-action:focus-visible {
    outline: 2px solid var(--si-ink-strong);
    outline-offset: 2px;
  }

  /* ── Les détails ──────────────────────────────────────────────────────────
     Hors du cube, sous le bouton, sans carte autour : une liste enfermée dans
     un second cadre aurait fait lire deux offres par colonne.

     Une ligne par capacité, hauteur constante, filets HORIZONTAUX seulement
     (DH C2) : une bordure verticale fabriquerait une grille là où il n'y a
     qu'une suite. */
  ${p} .tarif-detail { margin-top: 24px; }
  ${p} .detail-entete {
    font-family: var(--sans);
    font-size: var(--t-detail);
    font-weight: 400;
    color: var(--si-ink);
    padding-bottom: 12px;
    border-bottom: 1px solid var(--line);
  }
  ${p} .detail-liste { list-style: none; margin: 0; padding: 0; }
  ${p} .detail-liste li {
    position: relative;
    display: flex;
    align-items: center;
    min-height: 44px;
    padding: 8px 0 8px 26px;
    border-bottom: 1px solid var(--line-soft);
    font-family: var(--sans);
    font-size: var(--t-detail);
    line-height: 1.45;
    color: var(--si-body);
  }
  ${p} .detail-liste li:last-child { border-bottom: 0; }
  /* La coche, dessinée par deux bordures. Elle double le libellé, elle ne le
     remplace pas : la couleur ne porte jamais seule l'inclusion (PS-052). */
  ${p} .detail-liste li::before {
    content: "";
    position: absolute;
    left: 2px;
    top: 50%;
    width: 8px;
    height: 5px;
    margin-top: -4px;
    border-left: 1.4px solid var(--si-verified);
    border-bottom: 1.4px solid var(--si-verified);
    transform: rotate(-45deg);
  }

  /* ── La note commerciale ──────────────────────────────────────────────────
     Centrée sous les deux colonnes. C'est le seul bloc centré de la section :
     un moment court et délibéré, à la mesure du groupe qu'il referme. */
  ${p} .tarifs-note {
    max-width: 60ch;
    margin: clamp(24px, 3.2vh, 32px) auto 0;
    font-family: var(--sans);
    font-size: var(--t-menu);
    line-height: 1.6;
    color: var(--muted);
    text-align: center;
  }

  /* ── Le fondu du prix ─────────────────────────────────────────────────────
     Le nombre seul est remplacé au changement de période, donc lui seul
     s'anime. Rien ne se déplace : l'unité, la mention et le bouton gardent
     leur ligne, et la réponse se produit à l'endroit du chiffre (DH MO3). */
  @media (prefers-reduced-motion: no-preference) {
    ${p} .prix-nombre { animation: tarifFondu var(--safe-motion-slow) var(--safe-motion-ease) both; }
  }
  @keyframes tarifFondu { from { opacity: 0.2 } to { opacity: 1 } }

  /* ── Moins de mouvement ───────────────────────────────────────────────────
     Toute transition tombe. Les états restent lisibles : le pouce saute à sa
     place, le dégradé se pose d'un coup, le prix ne fond pas. */
  @media (prefers-reduced-motion: reduce) {
    ${p} .periode-pouce,
    ${p} .periode-choix,
    ${p} .cube,
    ${p} .cube-marque,
    ${p} .tarif-action { transition: none; }
    ${p} .prix-nombre { animation: none; }
  }

  /* ═══ Le panneau des fondateurs ════════════════════════════════════════════
     Un tableau, parce que quatre prix se croisent avec deux paliers et trois
     périodes. Les montants sont en mono tabulaire et alignés à droite : on
     compare des nombres par leur dernier chiffre (PS-011, DH L2). */
  /* ── Les titres de section, à la mesure de l'accueil ──────────────────────
     ── La cause, mesurée le 2026-09-03 ──────────────────────────────────────
     Les deux portées du site ne déclarent pas le même jeton de titre :

       .xc            (accueil)      --t-marque : clamp(21px, 1.9vw, 26px)
       .safe-vitrine  (pages)        --t-marque : clamp(19px, 1.7vw, 22px)

     Un h2 de section fait donc 26 px sur l'accueil et 22 px ici, pour la même
     règle et le même rôle. À 22 px il passait SOUS la phrase posée à côté de
     lui, qui fait 21 px et porte une encre plus sombre sur une colonne plus
     large : un pixel d'écart ne se lit pas comme une hiérarchie, il se lit
     comme une hésitation. Le CEO l'a signalé deux fois, sur « Devenez
     fondateurs » puis sur la FAQ.

     '--t-affiche' de la vitrine vaut exactement 'clamp(21px, 1.9vw, 26px)',
     soit le '--t-marque' de l'accueil au pixel près. Les deux sections
     reprennent donc la mesure de l'accueil sans qu'aucune taille soit écrite
     à la main.

     Le suivi suit la taille : à 26 px l'échelle donne -0,0125 em là où 22 px
     en demandait -0,02 (voir la note dans ExperienceCinema.tsx). C'est la
     valeur de l'accueil, reprise telle quelle.

     La règle reste BRIDÉE à ces deux sections. Corriger '--t-marque' pour
     toute la vitrine réglerait la cause d'un coup, mais déplacerait les
     titres de toutes les autres pages, ce qui n'a pas été demandé. */
  ${p} .recit#fondateurs h2,
  ${p} .recit#questions h2 {
    font-size: var(--t-affiche);
    line-height: 1.06;
    letter-spacing: -0.0125em;
    max-width: 15ch;
  }



  /* ═══ La carte verte des fondateurs ════════════════════════════════════════
     La même surface que le parcours de l'accueil, à la portée de la vitrine.
     La matière vient de 'matiere-verte.ts' ; ce bloc ne décrit que la
     composition, jamais la couleur.

     Elle est CENTRÉE et bridée à 880 px, comme le tableau des prix au-dessus :
     les trois blocs de la section partagent désormais une largeur et un axe. */
  ${p} .carte-fondateurs {
    position: relative;
    overflow: hidden;
    max-width: 880px;
    margin: clamp(30px, 3.6vw, 48px) auto 0;
    border: 1px solid transparent;
    border-radius: 20px;
    padding: clamp(26px, 3vw, 44px);
    ${MATIERE_VERTE}
    ${OMBRE_VERTE}
  }
  /* Le filigrane de la marque a été retiré à la fusion du 2026-09-03 : il
     n'existe plus de vide où le poser, le tableau des prix occupe le haut à
     droite. Voir la note dans 'forfaits.tsx'. */
  ${p} .carte-fondateurs .cf-temps { position: relative; z-index: 1; }

  /* ── Le tableau des prix, en tête de la carte ─────────────────────────────
     Il occupait sa propre carte blanche jusqu'au 2026-09-03, trente pixels
     au-dessus de celle-ci. Deux cartes de même largeur pour une seule offre
     faisaient recommencer la lecture au milieu : le prix, puis un nouvel objet
     pour dire ce qu'il achète. Fusionnées sur demande du CEO.

     Aucun filet sous ce bloc : la première ligne d'engagement porte déjà le
     sien, et deux traits à quatre pixels l'un de l'autre se lisent comme une
     erreur d'alignement.

     Les montants sont en --t-corps, pas en --t-detail : c'est ce qu'on vient
     comparer, ils ne peuvent pas être plus petits que la prose d'à côté. */
  ${p} .carte-fondateurs .cf-prix {
    position: relative;
    z-index: 1;
    margin-bottom: clamp(18px, 2.2vw, 26px);
  }
  ${p} .carte-fondateurs .fb-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--sans);
    font-size: var(--t-corps);
    text-align: right;
  }
  /* Les en-têtes descendent en étiquette : ils nomment les colonnes, ils ne se
     lisent pas. C'est l'écart entre eux et les montants qui fait monter les
     montants, sans qu'aucun chiffre ait à grossir. */
  ${p} .carte-fondateurs .fb-table th[scope="col"] {
    font-size: var(--t-menu);
    font-weight: 400;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: rgb(var(--si-surface-rgb) / 0.62);
    padding-bottom: 14px;
    border-bottom: 1px solid rgb(var(--si-surface-rgb) / 0.16);
  }
  ${p} .carte-fondateurs .fb-table th[scope="row"] {
    font-weight: 400;
    color: var(--si-verified-on-forest);
  }
  ${p} .carte-fondateurs .fb-table th:first-child { text-align: left; }
  ${p} .carte-fondateurs .fb-table td {
    font-family: var(--mono);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.01em;
    color: var(--si-surface);
  }
  ${p} .carte-fondateurs .fb-table th,
  ${p} .carte-fondateurs .fb-table td { padding: 15px 0 15px clamp(16px, 2vw, 32px); }
  ${p} .carte-fondateurs .fb-table tbody tr + tr th,
  ${p} .carte-fondateurs .fb-table tbody tr + tr td {
    border-top: 1px solid rgb(var(--si-surface-rgb) / 0.10);
  }
  /* Le prix régulier est barré : c'est ce qu'on ne paie pas. */
  ${p} .carte-fondateurs .fb-table .reg {
    color: rgb(var(--si-surface-rgb) / 0.5);
    text-decoration: line-through;
  }

  /* Une ligne = un symbole, un rang, un nom, une phrase. Les trois premières
     colonnes sont de largeur FIXE : les noms tombent les uns sous les autres
     sans qu'on ait rien à maintenir. */
  ${p} .carte-fondateurs .l {
    display: grid;
    grid-template-columns: 38px 34px minmax(140px, 210px) 1fr;
    gap: clamp(14px, 1.6vw, 24px);
    align-items: center;
    padding: clamp(14px, 1.5vh, 19px) 0;
    border-top: 1px solid rgb(var(--si-surface-rgb) / 0.16);
  }
  ${p} .carte-fondateurs .l:last-child {
    border-bottom: 1px solid rgb(var(--si-surface-rgb) / 0.16);
  }
  ${p} .carte-fondateurs .pastille {
    width: 38px;
    height: 38px;
    border-radius: 11px;
    border: 1px solid rgb(var(--si-surface-rgb) / 0.28);
    background: rgb(var(--si-surface-rgb) / 0.09);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  ${p} .carte-fondateurs .pastille .ic {
    width: 18px;
    height: 18px;
    stroke-width: 1.5;
    display: block;
  }
  ${p} .carte-fondateurs .rang {
    font-family: var(--mono);
    font-size: var(--t-detail);
    font-variant-numeric: tabular-nums;
  }
  ${p} .carte-fondateurs .n {
    font-family: var(--sans);
    font-size: var(--t-corps);
    font-weight: 400;
    line-height: 1.25;
  }
  ${p} .carte-fondateurs .d {
    font-family: var(--sans);
    font-size: var(--t-detail);
    line-height: 1.5;
  }
  /* L'inversion des encres sur le vert, écrite une fois pour tout le site. */
  ${encresSurVert(`${p} .carte-fondateurs`)}

  /* Le pied : la phrase de clôture à gauche, le geste à droite. */
  ${p} .carte-fondateurs .cf-pied {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: clamp(24px, 3vw, 40px);
    margin-top: clamp(24px, 2.6vw, 34px);
  }
  ${p} .carte-fondateurs .cf-pied p {
    margin: 0;
    font-family: var(--sans);
    font-size: var(--t-corps);
    line-height: 1.35;
    letter-spacing: -0.014em;
    max-width: 34ch;
  }
  ${p} .carte-fondateurs .cf-actes { display: flex; gap: 10px; flex: none; }
  /* Le bouton sur le vert prend la surface claire : c'est la seule action
     pleine de la section, et elle est la dernière chose qu'on lit. */
  ${p} .carte-fondateurs .cf-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 46px;
    padding: 0 20px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: var(--si-surface);
    font-family: var(--sans);
    font-size: var(--t-detail);
    font-weight: 400;
    color: var(--si-ink-strong);
    white-space: nowrap;
    transition: background-color var(--safe-motion-normal) var(--safe-motion-ease);
  }
  ${p} .carte-fondateurs .cf-btn:hover { background: var(--si-verified-on-forest); }
  ${p} .carte-fondateurs .cf-btn:focus-visible {
    outline: 2px solid var(--si-surface);
    outline-offset: 2px;
  }

  /* ═══ Tablette ═════════════════════════════════════════════════════════════
     Deux colonnes tant que les contenus restent lisibles. On resserre le
     rembourrage et la gouttière AVANT de toucher à la typographie, et les
     colonnes perdent leur bride de largeur pour prendre la page.

     Le seuil de la vitrine est à 860 px : au-dessous, tout le site passe en une
     colonne. Les forfaits ne le suivent PAS jusqu'en bas. À 768 px, la tablette
     en portrait, deux colonnes de 356 px tiennent encore leurs quatre lignes de
     cube sans rien serrer ; les empiler à ce format aurait mis les deux prix à
     un écran l'un de l'autre, ce qui est le contraire d'une comparaison. */
  @media (max-width: 1000px) {
    ${p} .cube { padding: 20px; }
    ${p} .cube-marque { top: 16px; right: 16px; }
  }
  /* Le symbole et le rang gardent leur colonne, le nom passe AU-DESSUS de sa
     phrase : à cette largeur, quatre colonnes ne laisseraient que six mots par
     ligne à la phrase. */
  @media (max-width: 860px) {
    ${p} .carte-fondateurs .l {
      grid-template-columns: 38px 34px 1fr;
      row-gap: 5px;
      align-items: start;
    }
    ${p} .carte-fondateurs .pastille { align-self: center; }
    ${p} .carte-fondateurs .n, ${p} .carte-fondateurs .d { grid-column: 3; }
    ${p} .carte-fondateurs .cf-pied { flex-direction: column; align-items: stretch; }
    ${p} .carte-fondateurs .cf-pied p { max-width: none; }
    ${p} .carte-fondateurs .cf-btn { width: 100%; }
  }
  @media (max-width: 900px) {
    ${p} .colonnes { max-width: none; }
    ${p} .periode { max-width: none; }
    ${p} .cube-categorie { max-width: calc(100% - 108px); }
  }

  /* ═══ Téléphone ════════════════════════════════════════════════════════════
     Solo puis Cabinet, empilés, chacun gardant ses trois pièces dans l'ordre.

     Le bloc qui rappelait ici la matière du recommandé a été retiré le
     2026-09-03 : elle est désormais permanente à toutes les largeurs, et le
     téléphone n'a plus rien de particulier à redire. C'est le bureau qui a
     rejoint la règle du téléphone, pas l'inverse.

     Les cubes perdent leur hauteur minimale : à pleine largeur, le pousseur
     creuserait un vide de cent pixels au milieu de chacun. */
  @media (max-width: 680px) {
    ${p} .recit#forfaits { padding-block: 24px 48px; }
    ${p} .colonnes { grid-template-columns: 1fr; gap: 32px; }
    ${p} .cube { min-height: 0; }
    ${p} .cube-vide { min-height: 16px; }
    ${p} .tarifs-note { text-align: left; max-width: none; }
    /* Le tableau ne se replie pas : quatre colonnes de montants comparés
       perdent tout sens empilées. Il défile dans sa propre boîte, à l'intérieur
       de la carte, et la carte ne bouge pas. */
    ${p} .carte-fondateurs .cf-prix { overflow-x: auto; }
    ${p} .carte-fondateurs .fb-table { min-width: 460px; }
  }
`;
}
