# 2026-07-17 · Deep dive dans l'app Agendrix (compte Deeperflow) : code, design, animations, système d'options

## Méthode

Prise de contrôle autorisée par le CEO (navigateurs en lecture + extension Chrome).
Analyse du vrai produit connecté (app.agendrix.com, org Deeperflow, essai Plan
Essentiel) : téléchargement et analyse des 3 bundles CSS (468 Ko), inspection DOM,
visite des écrans Horaires / Dépenses / Tableau de bord / Facturation.

## Stack technique

- **React** (bundle `application-react-*`), **Tailwind préfixé `tw-`** + un vrai
  design system séparé (`design-system-styles-*.css`, 42 Ko).
- Container queries Tailwind (`@xl:`, `@3xl:`) pour les vitrines.
- Toasts : Toastify. Icônes maison (.Icon). Intercom embarqué.

## Système de tokens (extrait des CSS)

- Couleurs en triplets RGB composables : `--color-primary-500: 15 105 115` (sarcelle
  #0F6973) avec rampe 25→800. **Le canevas de page EST `primary-25` (#F2F8F8)** :
  toute l'app baigne dans la couleur de marque à 2 %.
- `secondary` = corail #F5A08C (rampe 25→800) : TOUS les CTA. `tertiary` turquoise,
  `accent` violet, `success` #18C46E, `warning` #FFA737, `danger` #FD5D63, chacun
  avec rampe complète.
- **17 gammes pastel** (300-600) pour colorer quarts/positions + **18 `--color-tag-*`**.
- `--color-skin-*` (6 tons de peau pour émojis). `--border-radius: .625rem` (10 px),
  `--header-height: 3.75rem`.
- Typo : **Montserrat 600-700** (titres, H1 33 px sarcelle), **Rubik** (corps 16 px,
  gris #72777D), **Quentin** (manuscrite, signatures électroniques).
- Formes : pilules 9999px dominantes (35 règles), rayons .5/.625/.75/1 rem.

## Inventaire des animations (keyframes + usages)

- `pulse-animation` 7s infinite : halo `secondary/40%` sur UN seul élément par écran
  (bouton cadeau/parrainage). L'attention est rationnée.
- `shake` (translateX ±10px, bezier .36,.07,.19,.97) : erreur du pointeur PIN
  (CodeInputBox) — feedback physique d'erreur.
- `tw-pulse` 2s : CodeInputBox--validating (pendant validation du PIN) + skeletons
  de chargement du dashboard.
- `floating-alert-animation` 1s (opacity 0 jusqu'à 80 %, puis scale .95→1) : alerte
  flottante du Scheduler qui « attend puis paraît ».
- `wave` : indicateur de frappe dans la messagerie (3 points).
- `movingLg/SmSecondaryDot` + `WarningDot` (15-35s, rotate+translateX) : points
  décoratifs EN ORBITE sur les vitrines de modules.
- Transitions : 200ms `cubic-bezier(.4,0,.2,1)` (standard Material) partout ;
  47 occurrences de ce bezier. Focus = anneau 3px `primary-200` offset -5px.

## Composants clés (census CSS)

CalendarDay(76), CodeInput/Box(106), OnboardingLayout(48), Scheduler(45), Sidebar(45),
HRSurveyRecap(45), Tooltip(41), WeekPicker(34), ButtonBase(22), Billing(17),
TimeBanksTable(14), ActionButton(12), SlideOut(10), Modal(8), TimesheetTable(6),
LandingPages(6), ScheduleTemplate(5).

## Micro-détails de métier remarquables

- **Drag sémantique du Scheduler** : la cellule survolée en glisser devient
  `success-500/30%` (vert = le dépôt va assigner) ou `primary-500/10%` (copie).
  La couleur du feedback DIT ce qui va se passer.
- **TimesheetTable** (feuilles de temps = leur « compta ») : survol de ligne = ombre
  multi-couches TEINTÉE de la couleur de marque (primary/5 %, 3.5 %, 3 %) + lignes
  warning avec bordures accent. Une table comptable qui répond au survol.
- **SlideOut** (panneau détail) : dégradé blanc → primary-25.
- **Aujourd'hui** dans la grille : pilule sarcelle inversée dans l'en-tête de colonne.
- Totaux épinglés en bas de grille (« Total avec filtres / pour la succursale »).
- Dashboard = **widgets personnalisables** (bouton « Personnaliser »), squelettes
  pulsants, horloge vivante teintée corail, widget « High fives ».

## LE système d'options (ce que le CEO veut répliquer)

Trois couches parfaitement huilées :

1. **Module non activé ≠ page vide ni erreur** : visiter sa section affiche une
   **vitrine in-app** (`.LandingPages`) : accroche corail, H1 Montserrat sarcelle
   avec POINT FINAL CORAIL, 3 coches bénéfices, CTA pilule corail « Commencer »,
   illustration à droite (reçu + gros sceau-coche corail, dégradés radiaux corail,
   clip-path ellipse, points en orbite). Layout 50/50 en container queries.
   Ex. Dépenses : « Prenez le contrôle des demandes de dépenses des employés. » +
   « numérisation de reçus par IA ».
2. **Redirection douce** : un module inaccessible (Paie) redirige vers l'écran
   voisin actif (Horaires) au lieu d'un 404.
3. **Page Facturation = seule page sombre de l'app** (prise de contrôle sarcelle
   700, badge « Plan Essentiel · Se termine dans 8 jours », « Aucun contrat »,
   illustration 3D). Puis : 2 plans (Essentiel 3,25 $ / Plus 5,25 $ par
   utilisateur/mois, vague sarcelle vs dégradé corail) et la grille **« Modules
   complémentaires »** : Temps et présences 2,25 $/util., Dépenses 59 $/mois FIXE,
   Ressources 59 $/mois, Primes 1 $/util., Pointage par appel 1 $/util. Chaque carte :
   icône-app carrée sombre, titre + point corail, description, prix corail énorme,
   CTA « Ajouter à votre essai gratuit », fond dégradé corail-50→primary-25.
   + carte support « Besoin d'un coup de main? ».

## Transposition SAFE proposée (à valider)

1. **Système d'options SAFE** (= vision catalogue/ADR-009 validée par le marché) :
   états de module actif / non activé→vitrine in-app / verrouillé→redirection douce.
   Gabarit de vitrine en thème Forêt lumineuse : accroche ambre ou verte, H1 serif
   avec point final VERT, 3 coches, CTA forêt « Activer », illustration avec sceau
   qui SE DESSINE (Encre et sceau) au lieu du sceau statique corail.
2. **Option « Temps et présences du personnel »** (la demande explicite du CEO :
   l'identique d'Agendrix pour les cabinets) : horaires de l'équipe du cabinet
   (adjointes, techniciens, stagiaires), feuille de temps de PRÉSENCE (vs temps
   facturable déjà dans SAFE), banques de temps, préparation de paie. Différenciateur
   SAFE : lier présence ↔ temps facturable (« 7 h au bureau, 5,2 h facturées »).
   PRUDENCE : gros chantier, hors doctrine « brancher avant de bâtir » ; commencer
   par la VITRINE (mesurer l'intérêt) avant de construire le module.
3. **Page abonnement SAFE en forêt sombre** (la seule page sombre, comme eux).
4. Micro-emprunts interface : drag sémantique vert (déjà dans le geste
   glisser-payer), ombre de survol teintée forêt sur les tables compta, totaux
   épinglés, pilule « aujourd'hui » inversée, squelettes pulsants, UN halo pulsant
   max par écran.

## Volet espace et fonds (mesuré au pixel, même journée)

Question CEO : « gestion de l'espace, du fond etc ». Mesures faites en direct sur le
dashboard et le planificateur (viewport 1470x742) :

1. **Un seul fond structurel** : canevas `primary-25` #F2F8F8. Barre du haut (60 px)
   et rail d'icônes (60 px) sont TRANSPARENTS, posés sur le canevas. Le chrome est
   invisible : aucune barre délimitée, aucune structure dessinée.
2. **Îles blanches arrondies** : les surfaces de travail (grille, vitrines, panneau
   secondaire) flottent en blanc pur, rayon ~12 px, gouttières ~8 px sur le canevas.
   Deux niveaux de fond seulement : canevas teinté + île blanche. (+ sombre réservé
   à la page paiement.)
3. **Élévation teintée marque** : ombre de carte mesurée = 3 couches OPAQUES
   `primary-100` #DAE7E7 (0 3px 5px / 0 6px 10px / 0 7px 18px). Bordures de grille =
   `primary-300`. **Zéro gris neutre dans la structure** : tout le « gris » est du
   sarcelle dilué.
4. **Échelle de respiration 16/20/40** : padding contenu 40 px uniforme, gap widgets
   20 px partout, padding interne carte 16 px, colonnes 260 px, rangées grille 61 px,
   cellules 144 px, radius carte 12 px sans bordure.
5. **Densité par zone, langage constant** : dashboard aéré (masonry 260 px), grille
   dense (61 px), vitrines 50/50 très aérées.

Transposition SAFE proposée (widget livré) : garder la bannière forêt (signature,
seule autorité), mais adopter le modèle « canevas albâtre + îles #FBFCFA rayon 12 px
gouttière 8 px », remplacer les ombres/filets gris par des teintes forêt
(#DDE5DE en 3 couches, filets vert dilué), échelle 16/20/40. Règle mémorisable :
« Deux fonds seulement ; l'élévation se teinte forêt ; le gris neutre disparaît. »

## Statut

Analyse livrée + vitrine SAFE maquettée en widget + modèle spatial comparé en widget.
Rien d'implémenté. Décisions CEO attendues : (a) gabarit vitrine d'option, (b) priorité
vitrine « Temps et présences », (c) page abonnement sombre, (d) modèle spatial
« canevas + îles » avec ombres teintées forêt.
