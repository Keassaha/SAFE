# 2026-08-11 — Le zoom souple devient la marque de fabrique

Le CEO ouvre la page Dossiers et pose trois constats dans la même phrase.

Le tableau des dossiers n'a pas les animations de celui des clients : ce sont
deux tableaux différents. « Liste des dossiers » est en gras, coincé entre une
barre de recherche et sept filtres qui se mélangent. Et quand il sélectionne une
ligne, il obtient une zone grise au lieu du relief qu'il voit chez les clients.

Puis la demande, qui va bien plus loin que la page : **le zoom souple devient
l'animation principale, partout où il est question de sélectionner quelque
chose dans le site.**

## Ce qui existait déjà

`.safe-zoom` et `.safe-zoom-rang` vivaient dans `app/globals.css` depuis le
chantier du registre clients. Le registre clients les portait. Personne d'autre.

Trois registres avaient donc trois grammaires :

| | Clients | Dossiers | Employés |
|---|---|---|---|
| Survol de rangée | zoom + ombre | aplat `si-canvas` | aplat `si-surface/30` |
| Rangée cochée | zoom | aplat `si-forest/5` | pas de sélection |
| En-tête | 12 px, `ChevronsUpDown` | 12 px, `ArrowUpDown` | 12 px, fond teinté |
| Menu d'actions | `RowMenu` en portail | menu maison, rogné en bas de liste | deux boutons permanents |
| Vue mobile | fiche empilée | défilement horizontal | défilement horizontal |
| Hauteur des contrôles | 40 px | 40 px | `py-2` |

Passer d'une liste à l'autre demandait de réapprendre l'objet.

## Ce qui a été fait

### Une grammaire unique

`components/ui/registre.tsx` tient désormais le vocabulaire : en-tête triable et
non triable, classes de rangée, de cellule, de case à cocher, géométrie des
contrôles de barre d'outils, feuille et barre d'outils du registre.

Chaque registre garde ses colonnes, un dossier n'est pas un employé. Tout le
reste vient d'un seul endroit.

Le menu maison des dossiers est remplacé par `RowMenu`, rendu dans un portail :
il ne se fait plus rogner par le `overflow-x-auto` du tableau sur les dernières
lignes. Les deux boutons permanents des employés le rejoignent, ce qui retire
deux cibles par ligne.

Dossiers et employés reçoivent la vue mobile en fiches que seuls les clients
avaient.

### Le zoom, étendu

Deux ajouts au vocabulaire de `globals.css` :

- `.safe-zoom-rang[data-selectionne="true"]` — la rangée cochée reste soulevée,
  un cran plus haut que le survol. Une sélection dure, un survol passe.
- `.safe-zoom-menu` — menus, onglets, navigation, listes déroulantes. Échelle
  1,02, parce qu'un libellé de menu est court et survolé une fraction de
  seconde, là où une rangée de registre reste sous 1,006 pour ne pas empâter la
  donnée.

La rangée dont le menu est ouvert prend le même relief que la rangée cochée,
au lieu du fond gris qu'elle prenait.

Propagé à : les trois registres, le déroulant de la barre supérieure, le menu du
compte, le menu d'actions de ligne, les onglets, les entrées de la navigation
latérale, les listes déroulantes et boutons d'outil des barres de filtres.

**Aucun aplat gris de survol ne subsiste sur une surface sélectionnable.** Le
fond teinté ne dit plus qu'une seule chose, et c'est « vous êtes ici ».

Deux pièges rencontrés, tous deux dus au même mécanisme : un conteneur en
`overflow-hidden` rogne l'entrée qui grandit. Les menus reçoivent donc un
`px-1.5` et leurs entrées s'insèrent au lieu de border la paroi.

### La page Dossiers, dégagée

« Liste des dossiers » saute. Posé au-dessus d'une liste de dossiers, sur une
page qui s'appelle Dossiers, il disait trois fois la même chose et volait la
largeur de la recherche. Idem pour « Liste des employés ». Les trois registres
passent sur la même feuille, sans titre.

La barre d'outils tenait sept contrôles en permanence. Trois restent visibles,
statut, type et client, parce qu'ils servent chaque jour. Les quatre autres,
les deux dates, la fiducie et les tâches en retard, passent derrière « Plus de
filtres », qui porte une pastille dès qu'ils sont actifs. Rien n'est perdu, rien
ne filtre en douce.

Ce bouton devait ouvrir un panneau flottant. La feuille du registre est en
`overflow-hidden` pour tenir ses coins arrondis : elle le rognait. Il ouvre donc
une seconde ligne, qui ne masque aucune donnée.

Les contrôles passent de 40 à 36 px de haut, sur les trois registres. La barre
gonflait au détriment de la liste qu'elle sert.

## Le référentiel corrigé

PS-043 interdisait tout agrandissement au survol. La règle visait les
`hover:scale-105` improvisés, pas un primitif de produit ; elle contredisait
désormais la décision du CEO. Elle est réécrite pour interdire l'agrandissement
**écrit à la main** et nommer le zoom souple comme unique mouvement de survol
autorisé.

PS-045 est ajoutée : aucune surface sélectionnable peinte en gris au survol.

`§2.8` du référentiel décrit le geste, ses trois échelles et ses trois
contraintes. Les durées de `.safe-zoom` et `.safe-zoom-rang` passent de 300 à
260 ms, valeur du jeton `--safe-motion-slow` : elles dépassaient le plafond de
§2.6 depuis leur écriture.

## Second passage : l'atelier d'édition

Le CEO ouvre `/edition` et pose deux constats : « je vois deux couleurs, ce qui
n'est pas très intéressant » et « les polices ne matchent pas celles des autres
pages ».

Une seule cause aux deux. `EditionDashboard` ne passait par aucun composant
maison. Il portait une palette `V1` de six hexadécimales recopiées à la main,
écrivait tout son style en attributs `style`, et se peignait son propre fond par
dessus la coquille avec un `margin: -1.5rem`. Or la palette du produit est
pilotable depuis `lib/ds/palettes.ts` depuis le chantier du socle couleur : les
valeurs figées ici ne bougeaient plus avec elle. Le fond peint par la page et le
canvas servi par la coquille avaient divergé, et cet écart est exactement les
« deux couleurs ».

Le titre, lui, était en Geist 26 px semi-gras, quand Clients et Dossiers titrent
en Instrument Serif 32 px via `PageHeader`. Deux familles pour un même niveau de
titre dans la même application.

Reconstruit sur le vocabulaire du produit :

| | Avant | Après |
|---|---|---|
| En-tête | `<h1>` maison, Geist 26 px | `PageHeader`, Instrument Serif 32 px |
| Mesures | 4 cartes encadrées | barre de synthèse, même `<dl>` que Clients |
| Listes | `<div>` à bordure inline | `safe-feuille` |
| Rangées | aucun état de survol | `safe-zoom-rang` |
| Statut | pastille maison | `StatusBadge` |
| Couleurs | 6 hexadécimales figées | jetons `si-*` uniquement |
| Styles inline | 34 attributs `style` | 0 |

Trois défauts corrigés au passage :

- **« Bonjour Me. »** Le prénom venait de `nom.split(" ")[0]`, et `nom` vaut
  « Me Camille Roy » pour une avocate. Les titres de civilité sont désormais
  retirés avant de prendre le prénom. L'écran dit « Bonjour Camille. »
- **Les deux colonnes ne démarraient pas sur la même ligne.** Une section avec
  « Tout voir » est plus haute qu'une section sans. L'étiquette de section a
  maintenant une hauteur fixe.
- **« 0 h » s'écartait en deux espaces.** `tabular-nums` réserve à chaque glyphe
  la largeur d'un chiffre, y compris au « h ». L'unité passe en sans.

L'audit de design perd 8 hexadécimales en dur, et `EditionDashboard.tsx` sort de
la liste des fichiers qui portent la dette.

## Troisième passage : les boutons qui manquaient

« Il n'y a aucun bouton pour ajouter un nouveau document. »

C'était exact, et ce n'était pas un oubli d'affichage : **il n'existait aucun
chemin**. Créer un document supposait d'ouvrir `/edition`, de deviner qu'il faut
d'abord entrer dans un dossier, puis de trouver un popover dans l'en-tête de
`/edition/[dossierId]`. Trois gestes et un changement de page pour l'action
première de l'écran, qui n'avait donc pas de bouton du tout.

`components/edition/NewDocumentModal.tsx` : dossier, titre, type, puis entrée
directe dans l'éditeur. Le dossier est demandé plutôt que déduit, parce qu'un
document appartient toujours à un dossier et que le choisir après coup coûte un
déplacement. Quand le cabinet n'a aucun dossier, la modale le dit et propose d'en
créer un au lieu d'offrir un formulaire qui échouerait.

Boutons ajoutés ou corrigés :

| Emplacement | Avant | Après |
|---|---|---|
| En-tête | « Voir la bibliothèque », plein | « Nouveau document » plein, bibliothèque en second |
| Documents récents, vide | une phrase | « Créer un document » |
| Mes dossiers, vide | un lien souligné | « Créer un dossier » |
| Session en cours | « Reprendre », lien texte | bouton secondaire |

Le bandeau de session prenait au passage `bg-si-forest/5` et `text-si-forest`.
Depuis la bascule de palette du 2026-08-11, `forest` **est l'encre noire** :
l'action est achromatique et la couleur appartient aux états. Le bandeau se
peignait donc en gris tout en réservant le jeton d'action, ce qui l'aurait fait
virer au vert le jour où l'accent serait restauré, sans qu'il ait changé de sens.
Il passe sur `si-line` / `si-surface2`. Même correction pour la pastille de
l'assistant et la puce des suggestions, décoratives donc achromatiques.

Flux vérifié de bout en bout dans le navigateur : bouton, modale, création,
arrivée dans l'éditeur avec la minuterie lancée. Un document de test nommé
« Test bouton creation SAFE » subsiste dans le dossier Beaulieu du cabinet de
développement.

## Ce qui n'a pas pu être vérifié

Le registre employés a été vérifié structurellement, feuille et barre d'outils.
Ses rangées ne l'ont pas été : le cabinet de test n'a aucun employé.

L'atelier d'édition compte d'autres écrans encore écrits en style inline :
`DocumentEditor` (70 écarts), `SendToClientDialog`, `VersionsPanel`,
`DossierAtelierView`, `EditionBibliotheque`. Seul l'accueil a été repris.
