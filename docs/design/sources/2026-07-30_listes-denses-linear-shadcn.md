# Listes denses réelles : Linear (Triage, Team page) + shadcn/ui (Tasks)

- **Créateur / source :** Linear (équipe design produit) · shadcn/ui (Tasks example)
- **URL :** https://linear.app/docs/triage · https://linear.app/docs/default-team-pages · https://ui.shadcn.com/examples/tasks
- **Date d'ingestion :** 2026-07-30
- **Durée / format :** interfaces consultées au navigateur, pas une vidéo
- **Transcription obtenue :** sans objet
- **Recherche approfondie faite :** partielle — voir §3

> **Note de méthode.** Cette fiche n'est pas une ingestion vidéo. Elle observe des
> interfaces existantes. Deux niveaux de preuve, à ne pas confondre :
>
> - **Linear** — captures produit officielles ouvertes en pleine résolution. Ce sont des
>   images retouchées à des fins de documentation. On y lit des **décisions de composition**
>   fiables (ce qui est montré, ce qui est caché, ce qui est aligné où), mais **aucune
>   mesure** n'en est tirée : les pixels d'une capture marketing ne prouvent rien.
> - **shadcn/ui Tasks** — interface **live**, valeurs relevées via CSS calculé dans le
>   navigateur. Les nombres cités sont mesurés, pas estimés.
>
> Écran étudié : la **liste dense**, équivalent direct des vues Dossiers, Clients,
> Factures et Employés de SAFE.

---

## 1. Résumé en 3 lignes

Deux traitements opposés du même problème : Linear supprime tout le chrome de tableau
(aucune entête, deux lignes par item, métadonnées empilées à droite), shadcn garde un
tableau à colonnes triables mais concentre 62 % de la largeur sur une seule colonne.
Les deux convergent sur la hiérarchie par la graisse, la troncature systématique et le
refus du survol comme seul déclencheur.

## 2. Principes extraits (bruts)

### A. Linear — vue Triage (liste d'items entrants)

- **Aucune entête de colonne.** La liste n'a ni ligne d'entête, ni libellé, ni tri visible.
  Le contenu est mono-objet, donc les colonnes n'ont rien à annoncer.
- **Deux lignes par item.** Ligne 1 = titre en contraste plein. Ligne 2 = provenance
  (Intercom, Sentry, un prénom) en gris atténué, précédée d'une icône de source ~16 px.
- **Colonne droite = pile de métadonnées alignées à droite.** L'identifiant (`ENG-619`)
  au-dessus, le temps relatif (`6m ago`, `3h ago`, `2d ago`) en dessous, tous deux atténués.
- **Temps relatif, jamais de date absolue** dans la liste.
- **Troncature avec ellipse** sur les titres longs
  (`UnknownError: Cannot inject key into script …`). Le titre ne passe jamais à la ligne.
- **Séparateurs en filet quasi invisible**, pleine largeur de la liste, sans bordure
  extérieure ni encadré de carte.
- **Fondu progressif en bas de liste** au lieu d'une coupure nette : indique qu'il reste
  du contenu sans ajouter de composant.
- **Entête d'écran minimal** : icône + nom + étoile de favori à gauche, actions en
  icônes seules à droite (avatar, filtre, options d'affichage). Aucun bouton libellé.

### B. Linear — page d'équipe (navigation et tableau de bord)

- **Compteurs alignés à droite dans la barre latérale** (`Inbox 5`, `Drafts 13`).
- **Point bleu unique** sur `Reviews` : « il y a du nouveau » sans chiffrer. Deux
  registres de notification distincts, choisis selon que le nombre est actionnable ou non.
- **Les entêtes de section n'ont pas d'icône** (`Workspace`, `Favorites`, `Your teams`),
  seulement un triangle de repli. Les feuilles, elles, en ont une. L'icône marque le
  niveau navigable, pas la décoration.
- **Cadenas discret** sur l'équipe `Legal` pour signaler la portée privée.
- **Onglets en pilules** (`Overview` / `Documents` / `Members`), sans soulignement.
- **Rail droit « Go to »** : raccourcis icône + libellé, séparés du contenu principal,
  qui évitent de charger la navigation latérale.

### C. Linear — menu contextuel

- Icônes 16 px alignées, libellés courts, surlignage plein sur l'élément visé,
  groupes séparés par des filets.

### D. shadcn/ui Tasks — valeurs mesurées en direct

| Ce qui est mesuré | Valeur relevée |
|---|---|
| Police | Geist |
| Taille entête / cellule | **14 px / 14 px** (identique) |
| Graisse entête / cellule | **500 / 400** |
| Hauteur ligne / entête | **49 px / 40 px** |
| Padding cellule | 8 px |
| Séparateur de ligne | 1 px à **10 % d'opacité** |
| Largeur colonne titre | **707 px** sur ~1130 px utiles (≈ 62 %) |
| Largeur colonnes métadonnées | 105 px (Priority), 131 px (Status), 108 px (Task ID) |
| Colonne case à cocher / menu | 27 px / 54 px, **entête vide** |
| Pastille de statut | 12 px, rayon pilule, **fond transparent + bordure** |
| Icônes | 16 px |
| Champ de filtre / bouton primaire | 32 px de haut, rayon 8 px |
| Troncature | présente sur **les 25 lignes** |
| Survol de ligne | `hover:bg-muted/50` **et** `has-aria-expanded:bg-muted/50` |

- **Hiérarchie par la graisse seule.** Entête et données à la même taille ; seul le poids
  (500 vs 400) sépare les deux registres.
- **Une colonne domine.** Le titre prend près des deux tiers de la largeur ; les
  métadonnées sont comprimées à ~100-130 px.
- **Les colonnes de contrôle n'ont pas de libellé.** Ni « Sélection », ni « Actions ».
- **Le menu de ligne est une colonne permanente**, pas une révélation au survol. Et
  `has-aria-expanded` maintient le surlignage quand le menu est ouvert : l'état de la
  ligne reste lisible pendant l'interaction.
- **Transition de couleur seule au survol** (`transition-colors`) : pas de déplacement,
  pas d'ombre, pas d'agrandissement.

## 3. Vérification / corroboration

- **Hiérarchie par la graisse, pas la taille (T2)** — mesurée chez shadcn, cohérente avec
  T1 déjà présente (Kole Jain), et pratique standard des design systems de tableaux.
  → **traitée comme consensus.**
- **Troncature systématique (E1)** — observée indépendamment chez Linear et shadcn.
  Renforce E1, qui était en source unique. → **passe de 🟡 à 🟢.**
- **Refus du survol seul (MB1)** — shadcn conserve une colonne de menu permanente et
  gère l'état ouvert au clavier. Confirme MB1 par la pratique d'un design system large.
  → **renforce MB1, affaiblit la position « hover pour garder l'écran propre ».**
- **Ratio de largeur ≈ 62 % pour la colonne porteuse** — mesuré sur **un seul** exemple.
  Cohérent avec la composition de Linear, mais **non corroboré ailleurs**. → 🟡, à traiter
  comme un ordre de grandeur, pas comme une valeur cible.
- **Hauteur de ligne 49 px** — valeur d'un seul design system, sur un écran de
  démonstration en desktop large. Non généralisable telle quelle. → 🟡.
- **Pastille contour vs pastille à fond coloré** — désaccord direct avec C1. Voir §5.
- **Absence totale d'entêtes chez Linear** — décision de composition claire, mais lue sur
  une capture de documentation, pas sur l'app live. → 🟡.

**Zones d'incertitude assumées.** Aucune mesure n'a pu être prise sur Linear (captures
seulement). Aucune donnée sur le rendu tablette ou mobile de ces deux listes. Aucune
donnée sur les états vide, chargement et erreur, qui n'apparaissaient sur aucune des
sources consultées.

## 4. Règles promues vers DESIGN_HUMAIN.md

| ID | Catégorie | Règle | Confiance |
|----|-----------|-------|-----------|
| L3 | §1 Layout | Une colonne porteuse domine la largeur (ordre de grandeur : la moitié aux deux tiers), les métadonnées sont comprimées autour de 100-130 px. | 🟡 |
| L4 | §1 Layout | Les colonnes de contrôle (case à cocher, menu de ligne) ont une entête vide, jamais « Actions ». | 🟡 |
| E2 | §2 Espacement | Ligne d'environ 48-50 px pour deux niveaux d'information, entête plus basse (~40 px), padding de cellule 8 px. Ordre de grandeur mesuré, à adapter à la densité voulue. | 🟡 |
| T2 | §3 Typographie | Même taille de police pour l'entête et les données ; la hiérarchie se fait par la graisse seule (moyenne vs régulière). Précise et confirme T1. | 🟢 |
| C2 | §4 Couleur | Séparateurs de lignes en filet à très faible opacité (~10 %), jamais un gris plein qui dessine une grille. | 🟡 |
| P3 | §6 Composants | Quand la provenance compte, deux lignes par item : titre en contraste plein, source atténuée avec icône 16 px. Métadonnées empilées et alignées à droite. | 🟡 |
| P4 | §6 Composants | Le menu de ligne est une colonne permanente, et la ligne reste surlignée tant que le menu est ouvert. | 🟢 |
| P5 | §6 Composants | Pas d'entête de colonne par défaut : elle ne se justifie que si elle sert au tri ou au filtre. Une liste mono-objet peut s'en passer entièrement. | 🟡 |
| MO1 | §8 Motion | Au survol d'une ligne, transition de couleur seule. Aucun déplacement, aucune ombre, aucun agrandissement. | 🟡 |
| A13 | §10 Anti-slop | Horodatage absolu complet dans une liste d'activité récente → temps relatif court. | 🟡 |
| A14 | §10 Anti-slop | Grille complète (bordures verticales et horizontales pleines) autour de chaque cellule → filets horizontaux à faible opacité seulement. | 🟡 |

## 5. Conflits détectés

**Pastille de statut : fond coloré dilué (C1, Kole Jain) vs contour sans fond (shadcn).**
C1 recommande un fond coloré subtil ; shadcn utilise une pilule à fond transparent avec
bordure. Les deux sont défendables. Reporté en §11 avec une règle de contexte SAFE.

**Entête de colonne : acquise (Kole Jain, T1) vs supprimable (Linear).**
T1 suppose que l'entête existe. Linear la supprime entièrement. Pas une contradiction
frontale : P5 tranche par le contexte (tri/filtre ou non). Noté sans entrée §11.

**Divulgation au survol (A11) vs colonne d'actions permanente (shadcn).**
Déjà arbitré en §11 par MB1. Cette source ajoute une corroboration du côté tactile,
sans ouvrir un nouveau conflit.
