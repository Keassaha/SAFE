# 2026-08-10 — Le registre clients cesse d'être un empilement de cartes

Deuxième pas de la refonte, après le socle de couleur. Palette **Ardoise**
retenue par le CEO. Demande : améliorer visuellement la page clients. Le visuel
de cette page, c'était d'abord sa hiérarchie.

## Ce qu'il y avait

Quatre cartes de statistiques à icône qui se soulevaient au survol et entraient
en cascade, puis une carte englobant un tableau de dix colonnes, toutes alignées
à gauche, largeurs libres, quatre icônes d'action sur chaque ligne.

Le compte : sur 50 lignes, 200 cibles d'action affichées en permanence (A11).

## Ce qui a été fait

| Avant | Après | Règle |
|---|---|---|
| 4 cartes à icône, survol qui soulève | Barre de synthèse à plat, 4 mesures, un filet | refonte §9.1, MO1 |
| En-tête = grande carte verte | `variant="dashboard"`, en-tête sur la surface | refonte §7.3 |
| Carte englobant le registre | Section sur la page, séparation par filet | refonte §4.2 |
| 10 colonnes, tout à gauche | 7 colonnes, montants à droite | L2, L3, A15 |
| Courriel, téléphone, responsable, langue en colonnes | 2e ligne sous le nom | P3, E1 |
| 4 icônes permanentes par ligne | Un menu de ligne | A11, P4 |
| `23 juin 2026` | `il y a 2 h`, date complète au survol | A13 |
| « Inactif » en ambre | Neutre : l'ambre appelle un geste | C3 |
| Avatar à initiales | Retiré, le nom prend la place | §11, L3 |
| Aucune colonne de fidéicommis | Colonne fidéicommis, triable, négatif en encre danger | B-1 r.5 |

## Ce que la vérification a rattrapé

Quatre défauts, tous trouvés en regardant, pas en relisant.

**Un `<a>` dans un `<a>`.** Le lien courriel de la deuxième ligne se retrouvait
dans la carte-lien de la vue mobile. HTML invalide, hydratation cassée. La
deuxième ligne ne rend le courriel comme lien que dans la vue bureau.

**Le menu de ligne rogné.** `overflow-x-auto` force `overflow-y` à `auto` :
sur la dernière ligne, le menu débordait de 151 px et se faisait couper.

**Un second mécanisme de menu.** En corrigeant le point précédent, j'ai écrit une
logique de bascule maison. Le repo avait déjà `computeMenuPosition`, testé par
sept cas, dans `ClientQuickActions`. Le calcul est remonté dans
`components/ui/menu-position.ts` et un `components/ui/RowMenu` porte maintenant
le portail, le clamp d'écran, Échap avec retour du focus et la navigation aux
flèches. Les deux menus du produit partagent la même mécanique. Le test existant
n'a pas bougé : `ClientQuickActions` réexporte la fonction.

**Débordement horizontal à 320 px.** « 1 325 636,55 $ » en 22 px poussait la page
de 3 px. La barre passe à une colonne sous 400 px et le chiffre à 18 px. Reflow
vérifié : `scrollWidth === clientWidth` à 320 px.

## Décisions prises sans arbitrage

Trois choix que le CEO peut renverser :

- « Langue » quitte la liste et reste sur la fiche.
- Le tri par avocat responsable disparaît : sa colonne n'existe plus, et le
  filtre par avocat n'était déjà pas branché.
- Le fidéicommis entre dans la liste, à la place de rien.

## Aperçu

`/ds-preview/clients` rend les vrais composants sur des données fictives
choisies pour casser une mise en page : raison sociale longue, solde négatif,
montant à sept chiffres, client sans courriel, client sans responsable, client
archivé. Route publique, temporaire, à retirer une fois le registre validé.

## Deuxième passe : ce que l'aperçu ne montrait pas

L'aperçu initial ne rendait que la synthèse et le tableau. Le reste de la page
portait encore la grammaire de la carte englobante.

- Barre de recherche et listes de filtres : rayon 8 px → 6 px, celui des champs
  et des boutons (référentiel §6.6). Le bouton d'actualisation passe de 36 à
  40 px et s'aligne sur la rangée.
- Pagination : le bandeau `bg-si-canvas/40` et le padding de carte disparaissent,
  il reste un filet et un alignement sur les colonnes du tableau.
- Rythme de la barre d'outils : plus de troisième filet empilé. 24 px la
  séparent de la synthèse, 16 px du tableau. L'espace dit à quoi elle appartient.
- Les deux listes de filtres affichaient toutes les deux « Tous », côte à côte.
  Elles disent maintenant « Tous les statuts » et « Tous les types » (P6).
  Changement porté par `clients.allStatuses` et `clients.allTypes`, sans effet
  sur les autres écrans qui ont leurs propres espaces de noms.

L'aperçu rend désormais l'en-tête, les boutons et la barre d'outils réels : une
composition validée sur une vue incomplète ne valide rien.

## Observation hors périmètre

La colonne « Dossiers actifs » compte `_count.dossiers`, c'est-à-dire **tous** les
dossiers, sans filtre sur `statut`. Le libellé promet les dossiers actifs. Écart
antérieur à cette passe, non corrigé ici : le réparer change la donnée, pas la
mise en page.
