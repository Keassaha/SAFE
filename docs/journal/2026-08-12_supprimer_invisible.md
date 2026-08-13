# « Supprimer » était écrit en blanc sur blanc

> 12 août 2026. Signalé par le CEO sur `/temps` : « il y a des écritures
> mélangées ici et on ne voit pas le supprimer ».

## Ce qui se passait

Trois choses au même endroit, mesurées avant d'être corrigées.

### 1. L'entrée « Supprimer » existait, mais en blanc

Le menu d'une rangée affichait « Modifier » puis une zone vide de la hauteur
d'une entrée. Le curseur y devenait une main : l'entrée était bien là,
cliquable, et invisible.

```
--safe-status-error: var(--si-surface);   /* #FFFFFF */
```

Du blanc, posé sur le fond blanc du menu. **Rapport de contraste : 1,00.**

Ce n'était pas une faute de frappe. C'était un demi-retour en arrière. La
décision « noir et vert seulement » du 11 août avait inversé la paire, fond
d'encre plein et texte clair, pour la pastille d'état bloquant. Puis l'urgence
a récupéré sa couleur le même jour, `--si-danger` est revenu à `#A83232`, et
ces deux lignes-là ne l'ont pas suivi.

La portée dépassait largement `/temps` : **46 emplois de `text-status-error`**
peignaient du blanc sur blanc dans tout le produit, et 24 emplois de
`bg-status-error-bg` rendaient un aplat noir là où un fond dilué était attendu.
Aucun des 24 ne posait de texte clair dessus : la paire était cassée dans le
même sens partout.

### 2. Le menu se mêlait aux rangées

`/temps` gardait le vieux menu en position absolue, dans un conteneur
`overflow-x-auto` qui force `overflow-y` à `auto`. Les pastilles des rangées du
dessous dépassaient autour du panneau, et le menu se faisait rogner sur les
dernières lignes. Clients, dossiers et employés étaient déjà passés au portail
partagé ; ce tableau était resté seul en arrière.

### 3. Deux conventions de numérotation dans la même liste

« Des écritures mélangées » était à prendre au pied de la lettre. Le registre
affichait `2026-0042`, `2026-0035`, puis `2026-001`.

Le produit numérote sur **trois** chiffres : `lib/dossiers/numero.ts` et
`lib/facturation/invoice-numero-format.ts` écrivent tous deux
`${année}-${padStart(3)}`. Le simulateur d'activité s'était inventé une largeur
de quatre. Résultat dans le cabinet de démonstration : **47 dossiers sur 49 et
les 31 factures** portaient un numéro que l'application n'aurait jamais produit.

Défaut du simulateur, pas de l'application. Mais il se voyait précisément là où
le CEO regardait.

### 4. La rangée se soulevait sans rien ouvrir

`safe-zoom-rang` fait lever la rangée au survol. Sur `/temps`, il n'y avait
aucune destination au clic : il fallait viser le menu à trois points. Une
animation qui promet un geste inexistant apprend à l'œil à s'en méfier.

## Ce qui a été fait

### La couleur, à la source

Les jetons hérités repointent sur la palette, avec le contrat écrit au-dessus :
`--safe-status-<état>` est un **texte** lisible sur surface claire,
`--safe-status-<état>-bg` est un **fond dilué**.

| Jeton | Avant | Après | Contraste sur blanc |
|---|---|---|---:|
| `--safe-status-error` | `#FFFFFF` | `var(--si-danger-ink)` | 1,00 → **9,06** |
| `--safe-status-error-bg` | `#1A1A1A` | `rgb(danger / 0,10)` | — |
| `--safe-status-warning` | `#3C3E40` | `var(--si-amber-ink)` | **7,53** |
| `--safe-status-warning-bg` | `#F4F5F7` | `rgb(amber / 0,12)` | — |
| `--safe-status-overdue` | `#65686B` | `var(--si-amber-ink)` | — |

Un retard cesse d'être peint en gris de texte ordinaire : il appelle un geste,
donc il garde une teinte.

Une correction, huit lignes, 83 emplois réparés. Pas une page touchée.

### Le menu, comme les trois autres registres

`TimeEntriesTable` passe à `RowMenu` : portail, position fixe, Échap, flèches.
Mesuré sur la dernière rangée, celle qui se faisait rogner : cinq points de
sonde à l'intérieur du panneau retournent tous le menu, aucun ancêtre rogneur,
aucun débordement de la fenêtre.

`RowMenu` gagne `rowMenuItemDangerClass`. Deux classes de couleur sur un même
élément ne se départagent pas par l'ordre dans la chaîne mais par l'ordre dans
la feuille compilée : on compose une variante entière plutôt que d'écraser
`text-si-body` après coup.

### La numérotation revient à celle du produit

`scripts/simuler-activite.mjs` cesse d'inventer un format. Il reprend les deux
règles des services :

- largeur trois, `ANNÉE-XXX` ;
- séquence assise sur le **max analysé**, pas sur un `count()`. C'est la règle
  anti-réemploi : un enregistrement supprimé ne rend jamais son numéro, et la
  séquence des factures émises doit rester sans trou.

Les enregistrements déjà posés ont été renumérotés **sur place**, sans rien
supprimer, après un essai à blanc et un contrôle de collision. Les deux
dossiers du seed, `2026-001` et `2026-002`, n'ont pas bougé.

Vérifié après coup : une seule convention sur les 49 dossiers et les 31
factures, **zéro doublon, zéro trou**. La prochaine facture émise par
l'application portera `2026-032`, dans la suite.

### Ce qui se soulève s'ouvre

`rangeeOuvrable` dans `components/ui/rangee-ouvrable.ts`, une seule
implémentation pour les quatre registres. Sur `/temps` elle ouvre la saisie,
ailleurs elle mène à la fiche que le lien du nom pointait déjà.

Quatre gestes gardent la main sur eux-mêmes :

- un lien, un bouton, une case, une entrée de menu font leur propre travail ;
- une sélection de texte en cours n'est pas un clic. On copie un nom de client
  dans un registre : naviguer l'effacerait au relâchement ;
- Cmd, Ctrl, Maj et molette appartiennent au navigateur ;
- un clic déjà traité en amont ne se rejoue pas.

Le clavier ne passe jamais par la rangée : une `<tr>` ne se tabule pas. Chaque
registre garde un vrai lien ou un vrai bouton dans une cellule, et c'est
celui-là qui porte l'accès (WCAG 2.1.1). Sur `/temps`, c'est la description qui
devient bouton. Le clic sur la rangée est un raccourci à la souris, jamais le
seul chemin.

## Les garde-fous

Deux suites, parce qu'une correction de couleur qui ne se teste pas se
réinverse au prochain arbitrage.

`lib/ds/__tests__/jetons-statut.test.ts` lit `app/globals.css`, résout les
`var(--si-*)` contre la palette et calcule le contraste. Vérifié en remettant
la valeur fautive : **trois tests tombent**, dont « la paire de error n'est
jamais inversée ».

`components/ui/__tests__/rangee-ouvrable.test.ts` couvre les sept cas de la
décision. La logique a été extraite pure, sans DOM, comme `computeMenuPosition`
avant elle.

## Ce qui reste

`components/dashboard/DashboardTransactionsList.tsx` porte un bouton à trois
points **sans `onClick`**. Il ne fait rien depuis toujours, sur une carte non
reprise par la refonte. Signalé, pas corrigé : ce n'est pas le sujet du jour.

`app/ds-preview/temps` est une route publique temporaire, à retirer avec les
autres `ds-preview` une fois les écrans validés.
