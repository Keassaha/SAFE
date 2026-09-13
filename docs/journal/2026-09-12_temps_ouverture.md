# 2026-09-12 — Le Temps : un chronomètre sur une ligne, une barre de chiffres, un sélecteur par question

Rang 4 de la file du cadre `docs/product/CHANTIER_SIMPLIFICATION_ADMIN_FINANCE.md`.
Ouvert, validé en image et livré le même jour. La fiche est complète.

L'écran a trois visages selon le mode de facturation du cabinet : horaire (par défaut),
mixte (onglets Horaire / Forfait, qui embarque la vue horaire), forfait (registre des
tâches). La proposition porte sur la vue horaire, que le mode mixte reçoit par
ricochet. Le registre des tâches du mode forfait ne reçoit que la correction de ses
écarts.

## Écran : `/temps`, vue horaire                          Ouvert le : 2026-09-12

### Mesures avant
- Écarts (design-audit, perRoute) : **45**. Le registre lui-même est déjà dans la
  grammaire commune (rangée, en-têtes, menu de ligne). Les écarts sont autour : le
  bouton de chrono 3, la fenêtre de choix du mode mixte 2, le formulaire d'entrée 1,
  le chrono de la barre du haut 1, la fenêtre nouveau client 1, le registre des tâches
  du mode forfait 5, et le reste dans des composants partagés.
- Lignes montées, vue horaire : page 156, vue 324, chrono 222, cartes de chiffres 76,
  barre de filtres 185, tableau 276, grille de semaine 113, formulaire 451, nouveau
  client 99. Environ 1 900.
- **Quatre blocs avant la première ligne** : l'en-tête, une carte « Saisie rapide »
  avec titre et phrase d'explication, une carte de quatre cases en grille, puis la
  carte de l'historique avec son titre, ses onglets et **deux rangées de filtres**.
- **Treize contrôles dans la barre de filtres** : quatre pastilles de période, deux
  champs de date, une bascule Toutes / Mes entrées, une bascule Vue semaine, la
  recherche, trois sélecteurs (dossier, utilisateur, statut). Plus deux onglets
  au-dessus.
- **Deux tris faits deux fois** : les onglets « Actives / Archives (facturées) » et le
  sélecteur « Tous / Non facturé / Facturé » filtrent la même chose ; la bascule
  « Toutes les entrées / Mes entrées » et le sélecteur d'utilisateur aussi.
- **Quatre contrôles pleins, noirs** : « Nouvelle entrée », « Démarrer », la pastille
  de période choisie et la bascule choisie. Une seule devrait l'être.
- Le numéro de dossier est en vert dans chaque ligne, et un badge « Non facturée »
  se répète sur chaque ligne de l'onglet par défaut : la couleur ne réclame plus rien.
- Colonnes : 8, dont le menu. Grammaire du registre déjà en place pour les cellules.
- Geste principal : « noter une heure travaillée, et voir ce qui reste à facturer ».
- Clics depuis le menu : Finances › Temps › Nouvelle entrée, puis un formulaire de dix
  champs (client, dossier, avocat, date, durée, description, type d'activité,
  facturable, statut, taux). Le taux se pré-remplit depuis le 2026-09-12 (lot
  `bcb8a11`).
- Le lien « Honoraires à facturer » mène bien à la section des honoraires de la
  Facturation. Rien à corriger.
- Un défaut de langue : l'étiquette de la grille de semaine est fabriquée en
  français quelle que soit la langue de l'utilisateur (`fr-FR` en dur).

### Consignes CEO, datées, mot pour mot
- 2026-09-12 · « ouvre le Temps » (rang 4 de la file).
- 2026-09-12 · « Oui, on met à exécution », sur les deux images, sans modification.
  « Démarrer » reste donc secondaire, « Nouvelle entrée » seule action pleine.

### Proposition
- Ce qui change :
  1. La phrase du geste sous le titre : « Les heures travaillées, et ce qu'il reste à
     facturer. » Une seule action pleine, « Nouvelle entrée ».
  2. **Le chronomètre tient sur une ligne**, sans titre ni phrase d'explication : le
     compteur, l'état, client, dossier, « sur quoi travaillez-vous », Démarrer en
     bouton secondaire. Rien de sa mécanique ne change (pause, reprise, arrêt,
     enregistrement, nouveau client).
  3. **Les quatre cases en grille deviennent une barre de chiffres**, la grammaire de la
     Facturation : cette semaine, ce mois, à facturer (avec le nombre d'entrées en
     appoint), facturable.
  4. **Le registre prend la grammaire commune jusqu'à sa barre** : recherche à gauche ;
     à droite un sélecteur par question, période (cette semaine, ce mois, trois mois,
     tout, personnalisée qui révèle les deux dates), dossier, qui (mes entrées, toutes,
     ou une personne), statut (à facturer, facturées, toutes) ; une bascule Liste /
     Semaine ; le compte. Les onglets et la bascule Toutes / Mes entrées disparaissent,
     leurs questions ont chacune un sélecteur. Treize contrôles deviennent six.
  5. Le numéro de dossier cesse d'être vert ; « À facturer » se dit en ambre et en
     toutes lettres, « Facturée » en gris. Plus de badge par ligne.
  6. La grille de semaine parle la langue de l'utilisateur.
  7. Les écarts hors composants partagés sont corrigés au passage (chrono, fenêtres,
     registre des tâches).
- Ce qui ne change pas, exprès : le formulaire d'entrée et ses dix champs, la
  mécanique du chronomètre, la grille de semaine, la pagination, le menu de ligne
  (modifier, marquer validé, supprimer), les données, l'API, les modes mixte et forfait
  dans leur structure.
- Images :
  - avant, reconstitué depuis le code : `docs/journal/captures/2026-09-12_temps_avant_maquette.png`
  - proposition : `docs/journal/captures/2026-09-12_temps_proposition.png`
- Validation : **2026-09-12, « Oui, on met à exécution »**, images acceptées telles quelles.

### Ce que ça donne, en cibles
| | Avant | Cible |
|---|---:|---:|
| Écarts | 45 | ≤ 8 (les partagés) |
| Blocs avant la première ligne | 4, dont deux rangées de filtres | 3 (en-tête, chrono, barre de chiffres) |
| Contrôles dans la barre du registre | 13 + 2 onglets | 6 |
| Tris faits deux fois | 2 | 0 |
| Contrôles pleins noirs | 4 | 1 |
| Saisies supprimées | 0 | aucune : l'écran est déjà court en saisie, le gain est en lecture et en tri |

## Ce que je n'ai pas pu vérifier
- L'écran réel avec une session ouverte ; la maquette « avant » est reconstituée
  depuis le code.
- Le mode de facturation du cabinet de Me Derisier (horaire, mixte ou forfait).

### Livraison
- Commit : voir `git log -1 -- components/temps/TimeSummaryBar.tsx` (code et documents en
  un commit, après l'écriture de cette section).
- Capture après : `docs/journal/captures/2026-09-12_temps_apres.png`, composants réels
  rendus sur `/ds-preview/temps` (barre de chiffres, barre du registre, tableau sur ses
  cas limites). Le chronomètre n'y est pas : il vit dans le contexte du chrono global,
  que la route de contrôle ne monte pas.
- Ce qui a été construit :
  - `TimeSummaryBar` remplace les quatre cases en grille (`TimeMetricsCards`, retiré).
  - `TimeFiltersBar` réécrit : il rend lui-même la barre du registre, avec la
    recherche à gauche et, à droite, un sélecteur par question (période avec
    « Personnalisée » qui révèle les deux dates, dossier, qui, statut), la bascule
    Liste / Semaine et le compte. Les onglets Actives / Archives et la bascule
    Toutes / Mes entrées ont disparu : chaque question a un seul contrôle.
  - `SaisieRapideBlock` tient sur une ligne : compteur, état, client, dossier, « sur
    quoi travaillez-vous », Démarrer en secondaire. Sa mécanique (pause, reprise,
    arrêt, enregistrement, nouveau client) n'a pas bougé.
  - `TempsPageClient` réécrit autour de `RegistreFeuille` ; les modes mixte et forfait
    gardent leurs points d'accroche (`hideHeader`, `hideAddButton`, ouverture
    contrôlée du formulaire).
  - Le tableau : le numéro de dossier en encre, l'état en toutes lettres (« À
    facturer » en ambre, « Facturée » en gris) au lieu d'un badge par ligne.
  - La grille de semaine parle la langue de l'utilisateur.
  - Jetons : le bouton de chrono, la fenêtre de choix, le formulaire, la fenêtre
    nouveau client, le menu du chrono global, le registre des tâches, et les trois
    composants du mode forfait montés par cette route (25 écarts à eux seuls).
  - 15 libellés ajoutés dans les deux langues ; la phrase du titre et « Nouvelle
    entrée » sans le « + » ; la route de contrôle visuel étendue.
- Ce qui n'a pas été touché : le formulaire d'entrée et ses dix champs, la grille de
  semaine, le menu de ligne, les données, l'API, la structure des modes mixte et forfait.

### Mesures après
| | Avant | Après |
|---|---:|---:|
| Écarts sur la route | 45 | **11**, tous dans des composants partagés |
| Écarts du produit | 1 041 | 956 (dont une part vient du lot débours de l'autre session) |
| Blocs avant la première ligne | 4, dont deux rangées de filtres | 3 (en-tête, chrono, barre de chiffres) |
| Contrôles dans la barre du registre | 13 + 2 onglets | 6 (7 en période personnalisée) |
| Tris faits deux fois | 2 | 0 |
| Contrôles pleins noirs | 4 | 1 (la bascule Liste / Semaine marque son état en encre, à 36 px, sans concurrencer l'action) |
| Badges par ligne | 1 | 0 |

Typecheck vert, 2 151 tests verts (179 fichiers), parité FR/EN parfaite.

### Ce que je n'ai pas pu vérifier
- Le chronomètre sur une ligne, rendu : il dépend du contexte du chrono global. Il
  compile et garde sa logique ; à regarder sur le port 3001, en démarrant puis en
  arrêtant un chrono.
- Les modes mixte et forfait rendus : la vue horaire y est embarquée sous un onglet,
  avec l'en-tête masqué. À regarder si le cabinet de Me Derisier est en mode mixte.
- Une remarque de méthode : le compteur d'écarts suit les imports, et la route `/temps`
  monte les trois composants du mode forfait même quand le cabinet est en mode
  horaire. Les 25 écarts qu'ils portaient comptaient donc pour l'écran, et ils sont
  corrigés.
