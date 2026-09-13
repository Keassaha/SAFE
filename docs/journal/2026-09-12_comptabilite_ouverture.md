# 2026-09-12 — La Comptabilité : un seul titre, les boutons sur la ligne des onglets, six colonnes

Rang 5 de la file du cadre `docs/product/CHANTIER_SIMPLIFICATION_ADMIN_FINANCE.md`.
Ouvert, validé en image et livré le même jour. La fiche est complète, avec un point
retiré de la proposition (voir Livraison).

Cet écran a déjà reçu un lot le 2026-09-09 (`bc30dc3`, « l'écran cesse de mélanger les
livres et de faire deviner ») : barre de chiffres, onglets dans la carte, filtres sur
une ligne, plus de carte dans la carte. Ce qui reste est ce que ce lot n'a pas atteint.

**Périmètre de ce lot : la page et l'onglet Journal général.** L'onglet Paiements est
déjà fait (rang 2). L'onglet Journal des dépenses est le rang 6, et **c'est le chantier
actif de l'autre session** (commits « dépenses » à 18 h 59 et « débours » à 19 h 39) :
je n'y touche pas.

## Écran : `/comptabilite`, onglet Journal général            Ouvert le : 2026-09-12

### Mesures avant
- Écarts (design-audit, perRoute) : **50**. Répartition vérifiée fichier par fichier :
  - dans le périmètre de ce lot, **20** : la vue du journal général 7 (une couleur en
    dur, trois cercles pleins, trois roues qui tournent), la carte de chiffres
    `ComptaKpiCard` 7 (chargée par le journal pour sa version autonome, jamais
    affichée ici), le tableau des mouvements 2, la légende 2, la page 2 ;
  - dans le journal des dépenses, **25** (fenêtre d'import de reçu 14, tableau 7, quatre
    petits), hors périmètre : rang 6 ;
  - dans des composants partagés, **5**.
- Lignes montées pour cet onglet : page 47, vue 350, journal général 1 052, tableau des
  mouvements 194, légende 65, fenêtre de motif 169. Environ 1 900.
- **Deux titres** : « Comptabilité » puis, trente pixels plus bas, « L'argent du
  cabinet » en 22 px au-dessus de la barre de chiffres. Aucun autre écran d'argent n'a
  ce second titre.
- **Sept éléments empilés avant la première écriture** : le titre, le second titre, la
  barre de chiffres, la phrase « Journaux et tableaux, pour aller plus loin. Comprendre
  les chiffres », la rangée d'onglets, une rangée pour les deux boutons, une rangée de
  filtres, puis une rangée « Vue brute · 143 écritures ».
- Les filtres portent chacun leur libellé devant le champ (« Du », « Au », « Type »,
  « Recherche ») : huit éléments pour quatre questions. La recherche est à droite, en
  dernier, alors que partout ailleurs elle ouvre la barre.
- Les onglets portent des icônes et des pastilles pleines pour le compte.
- Le tableau des mouvements a **huit colonnes** avec ses propres classes d'en-tête et
  de cellule, hors grammaire du registre ; le client se tronque à 220 px et le dossier
  à 180 px pour faire tenir les huit.
- L'impact trésorerie négatif est en rouge sur chaque dépense et chaque débours : une
  sortie d'argent normale porte la couleur de l'erreur.
- Actions pleines : 1 (« Nouvelle écriture »). Déjà conforme.
- Geste principal : « lire ce que les livres disent ce mois-ci, et retrouver une
  écriture ». La saisie manuelle est l'exception, pas la règle : les écritures viennent
  des factures, des paiements et des dépenses.
- Le lien « Comprendre les chiffres » déplie une légende de cinq petites cartes, chacune
  avec une icône dans un carré teinté, sous un titre en serif : une carte dans la page
  pour une légende.

### Consignes CEO, datées, mot pour mot
- 2026-09-12 · « ouvre la Comptabilité » (rang 5 de la file).
- 2026-09-12 · « Oui, on met à exécution », sur les deux images, sans modification.
- Pour mémoire, celles du 2026-09-09 restent acquises : plus de largeur propre à la
  page, onglets horizontaux, pas de titre de section qui répète l'onglet, pas de bouton
  « Appliquer », le fidéicommis hors de la synthèse.

### Proposition
- Ce qui change :
  1. **Le second titre disparaît.** La barre de chiffres se pose sous le titre et sa
     phrase, comme sur la Facturation, le Fidéicommis et le Temps.
  2. **« Comprendre les mouvements » devient un lien discret** à droite de l'en-tête.
     Il déplie la légende en liste sobre, sans cartes ni icônes dans des carrés.
  3. **Les boutons rejoignent la ligne des onglets**, à droite. La rangée qu'ils
     occupaient seuls disparaît. Les pastilles de compte deviennent un nombre en gris ;
     les icônes d'onglet partent.
  4. **La barre du journal prend la grammaire du registre** : recherche à gauche ; à
     droite un sélecteur de période (ce mois, trois mois, l'exercice, tout, personnalisée
     qui révèle les deux dates), le type, la bascule « Vue brute » et le compte. Plus de
     libellé devant chaque champ.
  5. **Le tableau passe de huit à six colonnes** dans la grammaire du registre : le
     dossier se lit sous le client, la pièce sous la provenance. Les deux montants gardent
     leurs colonnes et leurs signes.
  6. **L'impact trésorerie négatif s'écrit en encre**, pas en rouge : une sortie d'argent
     n'est pas une erreur, le signe suffit. L'ambre reste sur ce qui augmente le dû, le
     vert sur ce qui le réduit.
  7. Les 20 écarts du périmètre sont corrigés au passage (jetons dans le journal général,
     la carte de chiffres, la légende, le tableau, la page).
- Ce qui ne change pas, exprès : les quatre chiffres de la synthèse et leurs liens, les
  trois onglets et leur mécanique (état local, adresse partageable), la fenêtre de
  saisie manuelle et celle du motif d'annulation, l'export CSV, la vue brute et la vue
  des corrections, l'onglet Dépenses (autre session), l'onglet Paiements (déjà livré),
  les données, l'API.
- Images :
  - avant, reconstitué depuis le code : `docs/journal/captures/2026-09-12_comptabilite_avant_maquette.png`
  - proposition : `docs/journal/captures/2026-09-12_comptabilite_proposition.png`
- Validation : **2026-09-12, « Oui, on met à exécution »**, images acceptées telles quelles.

### Ce que ça donne, en cibles
| | Avant | Cible |
|---|---:|---:|
| Écarts sur la route | 50 | ≤ 30, dont 25 appartiennent au journal des dépenses (rang 6) et 5 aux composants partagés |
| Écarts du périmètre de ce lot | 20 | 0 |
| Titres | 2 | 1 |
| Éléments empilés avant la première écriture | 7 | 4 (titre, barre de chiffres, onglets avec boutons, barre du journal) |
| Éléments dans la barre de filtres | 8 | 5 |
| Colonnes | 8 | 6 |
| Montants en rouge sur une opération normale | tous les débits | 0 |

## Ce que je n'ai pas pu vérifier
- L'écran réel avec une session ouverte ; la maquette « avant » est reconstituée depuis
  le code.
- Ce que l'autre session prépare dans le journal des dépenses : mes changements évitent
  ses fichiers, mais la page qui les embarque est commune.

### Livraison
- Commit : voir `git log -1 -- components/comptabilite/JournalBrutTable.tsx` (code et
  documents en un commit, après l'écriture de cette section).
- Capture après : `docs/journal/captures/2026-09-12_comptabilite_apres.png`, composants
  réels rendus sur `/ds-preview/comptabilite` : la légende dépliée, la rangée d'onglets
  avec ses boutons, la barre du journal, le journal brut, puis la vue expliquée sur les
  mêmes lignes (client long, écriture du cabinet sans client, pièce longue, montant à
  sept chiffres, ligne annulable).
- **Un point de la proposition n'a pas été appliqué, exprès.** Le point 6 proposait
  d'écrire les sorties d'argent en encre plutôt qu'en rouge. Il contredisait une
  consigne du CEO du 2026-09-09, consignée dans le code : « en rouge on voit que c'est
  sorti et en vert que c'est entré, c'est plus simple ». Une consigne enregistrée est
  définitive tant que le CEO ne la change pas ; le rouge et le vert restent, dans les
  deux vues. C'est moi qui n'aurais pas dû le proposer.
- Ce qui a été construit :
  - `JournauxOnglets` : la rangée d'onglets en tête de feuille, sans icône, le compte en
    gris, les boutons du journal actif à droite sur la même ligne (le journal général
    y projette les siens par le portail qui existait).
  - `ComptabilitePageView` : un seul titre, « Comprendre les mouvements » en lien discret
    à droite de l'en-tête, la légende en liste (`MovementLegend` réécrit), la feuille des
    journaux en `safe-feuille`, plus de pastille pleine ni de coins à 16 px.
  - `GeneralJournalPageView` : la barre dans la grammaire du registre (recherche à
    gauche ; période en sélecteur avec « Personnalisée » qui révèle les deux dates, type,
    bascule de vue, compte) ; plus de rangée de boutons seule ni de rangée « Vue brute ·
    N écritures » ; plus de roue qui tourne (export, saisie, chargement) ; la fonction
    d'affichage des montants extraite dans `lib/accounting/journal-display.ts`.
  - `JournalBrutTable` (nouveau) et `MovementsTable` (réécrit) : six colonnes dans la
    grammaire du registre, le dossier sous le client, la pièce sous la provenance,
    largeurs fixées pour que rien ne pousse le tableau hors de l'écran.
  - `ComptaKpiCard` : jetons à la place des couleurs en dur (sert au journal autonome et
    à la console).
  - 10 libellés ajoutés dans les deux langues ; une route de contrôle visuel.
- Ce qui n'a pas été touché : les quatre chiffres et leurs liens, la mécanique des
  onglets, la saisie manuelle, le motif d'annulation, l'export, la vue des corrections,
  l'onglet Dépenses (autre session), l'onglet Paiements, les données, l'API.

### Mesures après
| | Avant | Après |
|---|---:|---:|
| Écarts sur la route | 50 | **30**, dont 25 au journal des dépenses (rang 6) et 5 partagés |
| Écarts du périmètre de ce lot | 20 | **0** |
| Écarts de `/journal/general` (le journal autonome) | 21 | 4 |
| Titres | 2 | 1 |
| Éléments empilés avant la première écriture | 7 | 4 |
| Éléments dans la barre de filtres | 8 | 5 (7 en période personnalisée) |
| Colonnes | 8 | 6 |
| Montants en rouge sur une sortie | tous | tous, consigne du 2026-09-09 gardée |

Typecheck vert, 2 154 tests verts (180 fichiers), parité FR/EN parfaite.

### Ce que je n'ai pas pu vérifier
- La page réelle avec ses trois onglets et une session ouverte : la route de contrôle
  ne monte pas les onglets Dépenses et Paiements, qui viennent de l'API.
- Les boutons du journal projetés dans la ligne des onglets : le portail cible le même
  identifiant qu'avant, déplacé dans la rangée. À regarder sur le port 3001.
