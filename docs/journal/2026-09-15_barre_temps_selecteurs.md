# 2026-09-15 — La barre du Temps : une seule forme de contrôle, et des sélecteurs qui disent leur sujet

Suite directe du lot `/temps` du 2026-09-12. Le CEO a rouvert l'écran sur une
capture, à propos d'un seul objet : le cadre Liste / Semaine.

## Écran : `/temps`, barre du registre                    Ouvert le : 2026-09-15

### Consignes CEO, datées, mot pour mot
- 2026-09-12 · « cette section n'est pas très belle et incohérente avec le design »,
  capture du cadre Liste / Semaine à l'appui.
- 2026-09-15 · « je déteste le cadre que tu as fait Liste / Semaine [...] limite si tu
  veux, rajoute une autre façon de filtrer, mais je n'aime pas ça. »
- 2026-09-15 · « oui pour les deux, vas-y » — sur l'image, donc le cadre devient un
  sélecteur ET les libellés nomment leur sujet.

**Note de méthode.** Ma première proposition, le 2026-09-12, gardait le cadre et
l'embellissait : piste grise, surface claire sur la moitié choisie, zoom souple. Le
CEO a refusé la prémisse, pas le dessin. Retirer l'objet était plus simple que le
rendre beau. À retenir : quand un contrôle jure avec ses voisins, la première
question est s'il doit exister, pas comment le repeindre.

### Mesures avant
- Écarts (design-audit) : `components/temps/TimeFiltersBar.tsx` **0**, `/temps` 11.
  Le cadre ne violait aucune règle mécanique du référentiel — aucun `grep` ne le
  voyait. C'est un écart de cohérence, que seul l'œil attrape.
- **Le seul objet de la barre à ne pas être un sélecteur** : une recherche, quatre
  sélecteurs, puis un cadre à deux moitiés, puis le compte.
- **Un second aplat noir sur l'écran.** La moitié choisie prenait `bg-si-ink
  text-si-surface`, le traitement de l'action principale, alors que « Nouvelle
  entrée » est l'action principale de l'écran. Deux pleins noirs, plus d'action
  principale (R5, PS-020).
- **Pas de zoom souple**, alors que `components/ui/registre.tsx` écrit noir sur blanc
  que « la liste déroulante, la bascule et le bouton d'outil » le portent. Les deux
  autres contrôles du même genre dans le produit, les onglets (`components/ui/Tabs.tsx`)
  et la bascule du diagramme de trésorerie (`CashflowChart.tsx`), marquent le choix
  par une surface claire posée sur une piste, jamais par un aplat.
- **Trois hauteurs qui se contredisent** : cadre `h-9` (36 px), boutons `min-h-tap`
  (44 px) à l'intérieur, `overflow-hidden` qui les coupe. Angles internes vifs.
- **Quatre sélecteurs sur cinq disaient « Tout » ou « Tous »** au repos. En anglais,
  pire : `allTime` et `allStatuses` valaient tous deux `"All"`. Lue de gauche à
  droite, la barre ne nommait plus ce qu'elle triait.

### Livraison
- `components/temps/TimeFiltersBar.tsx` : le `<div role="group">` et son aide
  `bascule()` disparaissent, remplacés par un `<select>` sur `registreSelectClass`,
  étiqueté `viewLabel` (« Affichage »). Le composant garde exactement la même
  interface : `viewMode` et `onViewModeChange` ne bougent pas, donc
  `TempsPageClient.tsx` n'est pas touché.
- Libellés, FR et EN, dans l'espace `temps` seulement :

  | clé | avant FR | après FR | avant EN | après EN |
  |---|---|---|---|---|
  | `allTime` | Tout | Toute période | All | Any period |
  | `allStatuses` | Tous | Tous les statuts | All | All statuses |
  | `viewList` | Liste | Vue liste | List | List view |
  | `viewWeek` | Semaine | Vue semaine | Week | Week view |

  Vérifié avant d'y toucher : `allStatuses` existe aussi dans cinq autres écrans
  (clients, dossiers, import, dépenses, équipe), mais chacun dans son propre espace
  de noms. Aucun d'eux ne bouge.
- Images : `captures/2026-09-12_bascule_liste_semaine_proposition.png` (première
  proposition, refusée dans sa prémisse), `captures/2026-09-12_barre_temps_selecteurs_proposition.png`
  (proposition retenue), `captures/2026-09-15_barre_temps_apres.png` (écran réel).

### Mesures après
| | Avant | Après |
|---|---:|---:|
| Formes de contrôle dans la barre | 2 (sélecteur + cadre) | **1** |
| Aplats noirs sur l'écran | 2 | **1** (« Nouvelle entrée ») |
| Sélecteurs qui nomment leur sujet au repos | 2 sur 5 | **5 sur 5** |
| Libellés EN distincts pour période et statut | non (« All », « All ») | **oui** |
| Écarts `/temps` | 11 | 11 |
| Écarts nouveaux, partout | | 0 |

Typecheck vert, lint vert, 41 tests du Temps verts.

Relevé sur l'écran rendu, `/ds-preview/temps` :

```
Période             → « Toute période »      (34 px)
Filtrer par dossier → « Tous les dossiers »  (34 px)
Qui                 → « Toutes les entrées » (34 px)
Statut facturation  → « Tous les statuts »   (34 px)
Affichage           → « Vue liste »          (34 px)

Cadres [role=group] restants : 0
Aplats noirs dans la barre   : 0
Options de l'affichage       : Vue liste, Vue semaine
Erreurs JS                   : aucune
```

Cinq sélecteurs, une seule hauteur, et le passage en « Vue semaine » répond.

## Ce que je n'ai pas pu vérifier
- Le rendu en anglais sur l'écran réel.
- **L'écran sous vraies données.** La base locale `safe_local` a été vidée entre le
  2026-09-12 et le 2026-09-15 : il ne reste que « Cabinet Test » et **zéro** ligne dans
  `TimeEntry`, et le compte de démonstration `camille.demo@safecabinet.ca` n'existe
  plus (connexion refusée, 401). La vérification est donc passée par
  `/ds-preview/temps`, qui rend les composants RÉELS sur des données fictives. C'est
  le mécanisme de contrôle visuel du projet, mais ce n'est pas l'écran branché sur
  une base.
- Le compteur d'écarts ne bouge pas : le cadre était invisible pour l'audit
  automatique. C'est la limite de l'outil, pas une absence de progrès. Aucune règle
  mesurable ne couvre « un contrôle qui jure avec ses voisins ».

## Resté ouvert, signalé sans y toucher
- **Deux zéros en tête d'écran.** « Cette semaine » et « Ce mois » affichent 0 h
  alors que 210 entrées attendent une facture. Le chiffre est juste, les heures du
  cabinet de démonstration sont antérieures, mais l'écran a l'air cassé.
- **Deux comptes voisins qui ne comptent pas la même chose.** La barre annonce
  236 entrées, la ligne « À facturer » en compte 210, sans que rien ne l'explique.
