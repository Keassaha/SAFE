# Système d'interaction SAFE

> **Livrable de l'étape 1** du mandat « Reconstruire le design system et
> l'interaction system ». Diagnostic et système. **Aucune implémentation.**
>
> Mesuré le 6 août 2026 sur les **181 fichiers réellement montés** depuis
> `app/(app)`. Le code mort est exclu : compter dessus fait corriger des écrans
> que personne n'affiche.
>
> Rang : ce document se place **au-dessus** de
> [SAFE_PREMIUM_DESIGN_STANDARD](SAFE_PREMIUM_DESIGN_STANDARD.md) pour tout ce
> qui touche au comportement. Le référentiel premium reste opposable sur le
> visuel. [SYSTEME_DE_PROFONDEUR_TROIS_PLANS](SYSTEME_DE_PROFONDEUR_TROIS_PLANS.md)
> devient le §5 de ce document.

---

## 1 — Diagnostic de l'interface actuelle

### Ce qui est déjà tenu

Huit lots ont assaini les fondations. Il faut le dire, sinon le diagnostic est
faux : une seule source de jetons, un système de profondeur à trois plans avec
replis opaques, une garde de mouvement réduit, des états de chargement et
d'erreur sur les parcours critiques, une primitive de chiffres, un centre
d'obligations qui a remplacé le bandeau rouge permanent.

**Le namespace de couleur est presque unifié** : 3 185 usages `si-*` contre 78
`zinc-*` et 8 `text-primary`. La bataille des namespaces est gagnée à 97 %.

**Une seule famille d'icônes** : `lucide-react`, sans exception.

### Ce qui ne l'est pas

Le problème n'est plus la cohérence des couleurs. Il est ailleurs, et il est
mesurable.

| Mesure | Valeur | Lecture |
|---|---:|---|
| Bordures dans le code monté | **1 949** | ~11 par fichier |
| Coins arrondis | 763 | |
| Composants `<Card>` | 159 | |
| Ombres | 78 | |
| Tailles typographiques distinctes | **34** | 9 classes + **25 valeurs en dur** |
| Valeurs d'espacement arbitraires | 12 | hors échelle |
| Épaisseurs de trait d'icône | **7** | pour une seule famille |
| Variantes de bouton | **14** | |
| `hover:` / `focus-visible:` | 436 / 59 | **ratio 7 pour 1** |
| `<EmptyState>` monté | **5** | sur 181 fichiers |
| Peek, split view, master-detail | **0** | |
| Actions révélées au survol | 2 | |

---

## 2 — Problèmes classés par gravité

### P0 — Bloquants

**P0.1 — `⌘K` est lié deux fois.**
`components/capture/QuickCapture.tsx:28` et `components/layout/Header.tsx:359`
écoutent tous deux `window`, appellent tous deux `preventDefault()`. Une pression
ouvre la capture rapide **et** met le focus dans la recherche. Deux
comportements pour un geste : c'est la démonstration qu'aucune autorité ne
gouverne les raccourcis.

**P0.2 — Le focus clavier couvre 13 % de ce que couvre le survol.**
436 états de survol contre 59 états de focus. Toute personne qui travaille au
clavier perd la trace de sa position sur la majorité des contrôles. Ce n'est pas
un défaut d'accessibilité en marge, c'est une classe entière d'utilisateurs
exclue du produit.

### P1 — Structurels

**P1.1 — Syndrome du rectangle.**
1 949 bordures, 159 cartes, 763 arrondis. La hiérarchie est portée par
l'encadrement au lieu de l'espace, de l'alignement et du ton. C'est ce qui
produit l'impression « tableur avec des rectangles » plutôt que « logiciel ».
`GeneralJournalPageView` porte 51 bordures à lui seul, `MonthlyReportScreen` 49.

**P1.2 — 34 tailles de texte, dont 25 écrites en dur.**
De `text-[9px]` à `text-[35px]`. Une échelle typographique n'existe pas : elle
est reconstituée au cas par cas dans chaque fichier. C'est la première cause du
« presque aligné mais pas tout à fait » qui se ressent sans se voir.

**P1.3 — 14 variantes de bouton pour 4 rôles.**
`tertiary`, `soft`, `danger`, `outlined`, `dark`, `landing-*` sont des alias
historiques qui convergent déjà vers les quatre niveaux. Le typage autorise
pourtant les quatorze : rien n'empêche un écran d'en inventer un quinzième.

**P1.4 — Aucun pattern de préservation du contexte.**
Zéro peek, zéro split view, zéro master-detail. Tout parcours passe par
page → clic → nouvelle page → retour. Sur une liste de dossiers, consulter trois
fiches coûte six navigations complètes.

### P2 — Finition

**P2.1 — 5 états vides sur 181 fichiers.** La quasi-totalité des listes ne dit
rien quand elle est vide.
**P2.2 — 7 épaisseurs de trait d'icône** pour une famille unique.
**P2.3 — 12 valeurs d'espacement arbitraires** hors échelle.
**P2.4 — 474 hexadécimales en dur et 427 classes de palette hors jeton.**

---

## 3 — Principes UX violés

| Problème | Principe |
|---|---|
| ⌘K doublé | Constitution d'interaction absente |
| Focus 13 % | Accessibilité, parité clavier-souris |
| 1 949 bordures | Hiérarchie par l'encadrement plutôt que par l'espace |
| 34 tailles | Absence d'échelle, rythme typographique rompu |
| 14 variantes | Hiérarchie d'action diluée |
| 0 peek | Coût d'interaction, continuité spatiale |
| 5 états vides | Recouvrabilité, orientation |

---

## 4 — Philosophie : cohérence sous complexité

SAFE gagne des fonctions à chaque lot. Le critère n'est donc pas « premium »,
c'est **la capacité à rester calme et prévisible pendant que le produit
grossit**.

Trois règles gouvernent tout le reste.

**Le comportement prime sur l'apparence.** Un écran n'a pas le droit d'inventer
une manière d'ouvrir, de fermer, de sauvegarder ou d'échouer. Il consomme celles
qui existent. Cette règle seule aurait empêché le doublage de `⌘K`.

**L'encadrement est le dernier recours.** Avant une bordure : l'espace,
l'alignement, la typographie, un ton de fond, la proximité. La bordure ne
s'emploie que lorsqu'elle porte une information spatiale qu'aucun des cinq
précédents ne porte.

**L'interface se tait par défaut.** Elle n'élève son contraste que lorsqu'une
chose mérite l'attention. C'est la ligne que le centre d'obligations a déjà
ouverte en remplaçant le bandeau rouge.

---

## 5 — Système de surfaces

Six niveaux. Le système de profondeur à trois plans y est absorbé : ses trois
verres deviennent les traitements des niveaux 3 à 5.

| Niveau | Rôle | Fond | Trait | Élévation |
|---|---|---|---|---|
| **S0** Canvas | fond applicatif | atmosphérique | aucun | aucune |
| **S1** Navigation | rail, en-tête | ton légèrement distinct | filet bas seulement | verre subtle si collant |
| **S2** Espace de travail | contenu, listes | canvas ou surface | **aucun par défaut** | aucune |
| **S3** Surface active | ligne sélectionnée, panneau | surface + ton | filet si nécessaire | aucune |
| **S4** Superposition | menu, popover, tiroir | verre elevated | filet du niveau | ombre du niveau |
| **S5** Modale | décision | verre focus ou opaque élevé | filet du niveau | ombre du niveau |

**Règles dures.**

- **S2 ne porte ni bordure ni ombre par défaut.** C'est la règle qui fait tomber
  les 1 949 bordures. Une carte se mérite : l'objet doit être sélectionnable,
  déplaçable, porteur de sa propre action, ou appartenir à un autre plan.
- Aucune surface vitrée n'est descendante d'une autre (PS-006g, déjà acquis).
- La navigation reçoit **moins** de contraste que l'espace de travail.

---

## 6 — Système typographique

Neuf rôles. **Aucune taille en dur.** Les 25 valeurs `text-[Npx]` disparaissent.

| Rôle | Taille | Graisse | Interligne | Usage |
|---|---:|---|---:|---|
| `display` | 32 | 400 serif | 1.1 | titre d'écran éditorial |
| `title` | 22 | 600 | 1.2 | titre de page |
| `section` | 16 | 600 | 1.3 | titre de section |
| `body` | 14 | 400 | 1.5 | texte courant |
| `body-sm` | 13 | 400 | 1.45 | texte dense, tableaux |
| `label` | 12 | 500 | 1.4 | libellé de champ |
| `meta` | 12 | 400 | 1.4 | métadonnée |
| `caption` | 11 | 500 | 1.3 | capitale d'en-tête |
| `numeric` | hérite | 500-600 | hérite | mono tabulaire, primitive `Figure` |

Quatre graisses au maximum, celles déjà employées. Le serif reste réservé au
`display`, jamais dans un tableau, un bouton ou une pastille.

---

## 7 — Système d'espacement

L'échelle Tailwind est déjà respectée à 19 pas. **Les 12 valeurs arbitraires
disparaissent**, sans exception.

| Pas | Emploi |
|---:|---|
| 4 | icône ↔ libellé |
| 8 | éléments très proches |
| 12 | éléments d'un même groupe |
| 16 | espace interne d'un composant |
| 24 | entre groupes |
| 32 | entre sections |
| 48 | grandes séparations |

**Densité par contexte.** Liste et tableau : lignes de 44 px, espace interne 12.
Formulaire : 16. Page de configuration ou d'accueil : 24 à 32. C'est la
« comfortable professional density » : ni page vitrine, ni tableur.

**Règle du rapport.** L'espace entre deux groupes vaut au moins trois fois
l'espace interne du groupe. Sans ce rapport, le regroupement ne se lit pas et
l'on ajoute une bordure pour compenser. C'est l'origine mécanique des 1 949
bordures.

---

## 8 — Jetons, trois niveaux

L'architecture existe déjà en partie dans `lib/ds/tokens.ts`. Elle se formalise.

```
PRIMITIF        forest.800, sand.100, 14px, 6px, 180ms
   ↓            aucune consommation directe par un écran
SÉMANTIQUE      surface.canvas, text.primary, border.subtle,
                action.primary, status.danger, elevation.overlay
   ↓
COMPOSANT       button.primary.bg, table.row.hover, modal.shadow
```

Un écran ne consomme **que** le niveau sémantique ou composant. Les 474
hexadécimales et 427 classes de palette hors jeton sont des consommations
directes du niveau primitif, ou pire, de rien du tout.

---

## 9 — Système de composants

**Quatre variantes de bouton. Pas quatorze.**

`primary` · `secondary` · `ghost` · `destructive`

Les dix alias restent en place le temps d'une migration, marqués dépréciés dans
le typage, puis retirés. Un écran ne porte **qu'une seule action primaire**.

**Anatomie commune à tout contrôle.**

```
Container · Leading icon · Label · Trailing icon
Badge · Loading indicator · Focus ring · Disabled reason
```

**Onze états, documentés, jamais improvisés.**

```
default · hover · focus-visible · pressed · selected
disabled · loading · success · warning · error · empty
```

Un composant sans ses états n'entre pas dans le système. Le spécimen
`/ds-preview` est la preuve : ce qui n'y figure pas n'existe pas.

---

## 10 — Système d'icônes

Famille unique `lucide-react`, déjà acquis.

| Paramètre | Décision |
|---|---|
| Épaisseur de trait | **1.75, unique** — les 7 valeurs actuelles convergent |
| Tailles | 14 (dense) · 16 (courant) · 20 (navigation) |
| Zone d'interaction | 40 px minimum, quelle que soit la taille dessinée |
| Alignement | optique, pas mathématique |
| Remplissage | contour uniquement, sauf état sélectionné |

Aucun emoji dans l'interface. Les 24 occurrences relevées disparaissent.

---

## 11 — Modèle d'interaction

**Divulgation progressive.** Trois rangs.

| Rang | Visibilité | Exemple |
|---|---|---|
| Primaire | immédiate | Facturer, Rapprocher |
| Secondaire | survol, focus clavier, menu de ligne | Modifier, Archiver |
| Avancé | palette de commandes, paramètres | Export, retraitement |

Une action révélée au survol doit **toujours** être atteignable au clavier et au
tactile. C'est la condition sans laquelle la divulgation progressive devient de
la dissimulation.

**Interface contextuelle.** Une sélection multiple transforme la barre d'outils
plutôt que d'ajouter une zone. « 4 sélectionnées · Marquer payées · Exporter ».

**Préservation du contexte.** Toute liste de plus de dix éléments dont on
consulte le détail passe en liste + détail, ou reçoit un aperçu. Priorité :
dossiers, clients, factures.

---

## 12 — Système de mouvement

Trois durées, une courbe, déjà présentes dans les jetons.

| Rang | Durée | Emploi |
|---|---:|---|
| Micro | 120 ms | survol, appui, bascule |
| Standard | 180 ms | menu, infobulle, pastille |
| Ample | 260 ms | panneau, modale, tiroir |

Ouverture en `ease-out`, fermeture en `ease-in`. **Toute animation est
interruptible** : un clic pendant une transition est suivi, jamais mis en file.
La garde de mouvement réduit est déjà posée et couvre l'ensemble.

Une animation répond à « que vient-il de se passer ». Aucune n'existe pour
décorer.

---

## 13 — Architecture de navigation

Aujourd'hui : 6 groupes, 21 entrées, tout au même rang.

| Rang | Contenu | Emplacement |
|---|---|---|
| Primaire | 4 à 5 destinations de travail | en-tête |
| Secondaire | sections d'une destination | dans la page |
| Contextuelle | actions de l'objet courant | près de l'objet |
| Utilitaire | obligations, langue, minuteur, compte | droite de l'en-tête |

La navigation reste **plus discrète** que l'espace de travail. Elle ne porte
aucune pastille permanente hors du centre d'obligations.

---

## 14 — Stratégie de densité

| Écran | Densité | Justification |
|---|---|---|
| Registres, journaux, tableaux | dense | consultés plusieurs fois par jour |
| Rapprochement, facture | moyenne | décision, chiffres à comparer |
| Aujourd'hui, conformité | aérée | orientation, une question à la fois |
| Configuration, onboarding | aérée | fréquence faible |

---

## 15 — Stratégie d'interface contextuelle

`⌘K` devient **une seule** commande, celle de la palette. La capture rapide
migre vers un autre raccourci ou devient une entrée de la palette. Le conflit
P0.1 se règle là, et nulle part ailleurs.

La palette est contextuelle : sur un dossier, elle propose les actions du
dossier avant les actions globales.

---

## 16 — Chargement, erreur, vide

**Chargement.** Aucun indicateur sous 1 s. Squelette entre 1 et 3 s, reproduisant
la mise en page réelle. Barre de progression au-delà. Jamais de spinner
bloquant pleine page.

**Erreur.** Trois obligations : dire ce qui s'est passé, préserver la saisie,
offrir la reprise. Aucune erreur technique brute.

**Vide.** Trois obligations : ce qui vivra ici, pourquoi c'est utile, la
prochaine action. Les 5 usages actuels doivent devenir la règle sur toute liste.

**Optimisme.** Autorisé sur les actions réversibles à fort taux de succès.
**Interdit** sur toute écriture comptable, certification, opération de
fidéicommis ou envoi au client.

---

## 17 — Constitution d'interaction

Un nouvel écran ne doit inventer aucun de ces comportements.

| Geste | Règle |
|---|---|
| **Ouvrir** | Menu et popover : ancrés à leur déclencheur. Panneau : depuis la droite. Modale : centrée, voile. |
| **Fermer** | `Échap` ferme la surface la plus haute, une seule. Clic extérieur ferme menu et popover, jamais une modale porteuse de saisie. |
| **Focus** | À l'ouverture, sur le premier contrôle utile. Captif dans une modale. **Rendu au déclencheur** à la fermeture. |
| **Sélectionner** | Clic simple sélectionne. La barre d'outils devient contextuelle. `Échap` désélectionne. |
| **Éditer** | Sur place quand le champ est isolé. En panneau quand l'objet a plusieurs champs. |
| **Sauvegarder** | Explicite pour une écriture comptable. Automatique avec état visible pour un brouillon. Toujours un horodatage. |
| **Supprimer** | Jamais optimiste. Confirmation nommant l'objet. Archivage préféré à la suppression. |
| **Confirmer** | Uniquement si l'action est irréversible ou coûteuse. Le bouton porte le verbe, jamais « OK ». |
| **Charger** | Voir §16. |
| **Échouer** | Voir §16. |
| **Notifier** | Une obligation va au centre d'obligations. Un résultat d'action se confirme près de son objet. |
| **Clavier** | `⌘K` palette · `Échap` fermer · `Entrée` valider · flèches parcourir. Jamais nécessaire pour comprendre l'application. |

---

## 18 — Avant / après, par écran

| Écran | Aujourd'hui | Cible |
|---|---|---|
| **Tableau de bord** | tuiles encadrées de poids égal | une décision dominante, le reste en registre |
| **Clients, Dossiers** | tableau bordé, page par clic | liste dense + détail, actions au survol |
| **Facturation** | registre + navigation secondaire | inchangé sur la structure, bordures retirées |
| **Rapprochement** | trois tuiles bordées | trois colonnes séparées par l'espace |
| **Temps** | onglets + tableau | inchangé, densité resserrée |
| **Conformité** | déjà allégée au lot 8 | référence de la nouvelle densité |
| **Aujourd'hui** | déjà calme | **écran de référence du système** |

---

## Plan d'implémentation

Cinq temps. Aucun ne commence avant que le précédent soit figé.

**Lot 9 — Écran de référence.**
`/dossiers` reconstruit seul, du canvas jusqu'aux états. Liste dense, détail
préservé, actions au survol et au clavier, aucune bordure sur le plan 2.
Rien d'autre n'est touché.

**Lot 10 — Épreuve de l'écran de référence.**
Le même écran confronté au vide, à l'erreur, à 500 lignes, à un nom très long, à
320 px, au clavier seul, au mouvement réduit, au lecteur d'écran. Ce qui casse
corrige le système, pas l'écran.

**Lot 11 — Gel.**
Jetons, échelle typographique, primitives et états figés. Retrait des dix
variantes de bouton dépréciées, des 25 tailles en dur, des 12 espacements
arbitraires. Le spécimen devient la référence opposable.

**Lot 12 — Constitution appliquée.**
`⌘K` unifié, palette de commandes, focus rendu partout, états vides sur toutes
les listes.

**Lot 13 — Propagation.**
Le système appliqué écran par écran, dans l'ordre de fréquence d'usage.

**Critère de sortie, à chaque lot.** L'audit interne baisse, les tests de
contrat passent, l'écran est vu à trois largeurs, et aucun comportement nouveau
n'a été inventé.

---

## Journal

| Date | Modification |
|---|---|
| 2026-08-06 | Création. Diagnostic mesuré sur 181 fichiers montés, dix-huit livrables, plan en cinq lots. Absorbe le système de profondeur à trois plans comme §5. |
