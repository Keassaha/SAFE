# Doctrine de l'interface intérieure SAFE

> **Portée.** L'intérieur de l'application (dossiers, compta, facturation, fidéicommis,
> conformité). Pas la landing, qui a sa propre direction.
>
> **Rang.** Ce fichier applique [DESIGN_HUMAIN.md](DESIGN_HUMAIN.md) au contexte
> « écran de travail ». En cas de conflit, DESIGN_HUMAIN.md §0 prime, toujours.
> Les principes empruntés à Linear viennent de
> [DIRECTION_LANDING_SAFE_INSPIREE_LINEAR_2026.md](../product/DIRECTION_LANDING_SAFE_INSPIREE_LINEAR_2026.md)
> §7, étendus à l'intérieur par décision CEO du 2026-07-23 (principes seulement,
> pas les tokens de la landing).
>
> **Objectif.** Une interface spacieuse, claire et professionnelle. Trois mots qui
> ont ici une définition technique, pas esthétique. Voir §1.

---

## §1 — Ce que veulent dire « spacieux, clair, professionnel »

C'est la section la plus importante du fichier, parce que ces trois mots se
trahissent facilement.

**Spacieux ne veut pas dire « tout écarter ».** Gonfler uniformément tous les
espacements produit une interface molle et enfantine, et c'est un tell d'IA
(DESIGN_HUMAIN A9). L'espace vient de trois choses :

1. **Retrait extérieur généreux**, contenu intérieur dense. La marge autour du bloc
   respire, les éléments dedans restent serrés.
2. **Moins d'éléments**, pas des éléments plus écartés. Retirer une colonne inutile
   donne plus d'air que d'ajouter 8px partout.
3. **Une seule zone vide franche par écran.** Le bas d'une liste qui se termine dans
   du vide est un signal de fin, pas un manque à combler (M6).

**Clair veut dire hiérarchie, pas contraste faible.** Le gris pâle sur fond pâle est
joli en capture d'écran et illisible à l'usage (A8). La clarté vient du poids
typographique et de l'espace, pas de la teinte.

**Professionnel veut dire retenue et constance.** Zéro effet décoratif. Un accent
unique. Des chiffres alignés. Les mêmes gestes au même endroit sur tous les écrans.
Un écran comptable qui ressemble à un tableau de bord marketing perd la confiance de
l'avocate en trois secondes.

---

## §2 — Espace et rythme

Échelle unique, base **4px**. N'utiliser que ces valeurs : `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`.
Toute valeur hors échelle doit se justifier par un alignement optique précis.

| Rôle | Valeur | Note |
|---|---:|---|
| Retrait latéral du contenu | `24px` | `16px` sous 760px |
| Retrait interne d'un panneau | `12px` à `16px` | jamais plus, sinon l'écran gonfle |
| Gouttière entre colonnes d'une ligne | `12px` | constante sur tous les tableaux |
| Écart entre deux groupes | `24px` | crée le rythme, voir ci-dessous |
| Écart entre éléments d'un même groupe | `4px` à `8px` | serré, c'est voulu |
| Hauteur de ligne de tableau | `44px` desktop, `56px` tactile | densité de travail |
| Hauteur de barre d'outils | `44px` | constante partout |
| Hauteur d'en-tête de groupe | `36px` | collant en haut au défilement |

**Règle de rythme (A9).** Le rapport entre l'espace intra-groupe et l'espace
inter-groupe doit être d'au moins 1 pour 3. Si les champs d'un formulaire sont à
`8px` les uns des autres, les sections sont à `24px` minimum. C'est ce contraste qui
crée la lecture, pas la quantité absolue d'espace.

**Largeur de lecture.** Tout paragraphe descriptif est plafonné à `65ch`. Au delà,
l'œil perd la ligne. Les tableaux, eux, prennent toute la largeur disponible.

---

## §3 — Typographie

Duo de marque validé, aucune autre famille, aucun alias secondaire.

| Rôle | Police | Taille | Graisse | Note |
|---|---|---:|---:|---|
| Titre d'écran ou de fiche | Instrument Serif | `26px` à `32px` | 400 | jamais sous `20px`, une seule graisse |
| Titre de section | Geist Sans | `13px` | 580 | pas de serif ici, c'est du mobilier |
| Libellé de colonne, en-tête | Geist Sans | `11px` à `12px` | 540 | discret (T1) |
| Corps et libellés d'interface | Geist Sans | `13px` | 450 | taille de travail par défaut |
| Texte fort dans une ligne | Geist Sans | `13px` | 520 | le titre de la ligne, rien d'autre |
| Secondaire, méta | Geist Sans | `11px` à `12px` | 450 | couleur `si-muted` |
| **Tout chiffre** | **Geist Mono** | `12px` à `13px` | 450 | `font-variant-numeric: tabular-nums` obligatoire |

**Règles dures**

- **Instrument Serif est réservé aux titres éditoriaux.** Jamais dans un tableau,
  jamais dans un bouton, jamais dans une pastille.
- **Tout nombre est en Geist Mono avec chiffres tabulaires.** Montants, soldes,
  heures, références de dossier, dates numériques. Sans ça les colonnes de chiffres
  ne s'alignent pas verticalement et le balayage est cassé.
- **Interlettrage négatif léger** sur l'interface (`-0.008em`). Rien sur le mono.
- **Pas de majuscules forcées** sauf les libellés de section en petites capitales
  (token `tracking-caps`, `0.08em`).
- **Quatre niveaux maximum par écran.** Si vous en avez besoin d'un cinquième, c'est
  que l'écran fait deux choses.

---

## §4 — Couleur

Tokens réels du projet, namespace `si-*`. Ne pas inventer de teinte.

| Token | Valeur | Rôle exclusif |
|---|---|---|
| `si-canvas` | `#EFF2ED` | fond de l'application, jamais un fond de contenu |
| `si-surface` | `#FBFCFA` | surface de travail, listes, panneaux |
| `si-forest` | `#0B1F19` | action principale, marque |
| `si-forest-soft` | `#16312A` | survol de l'action principale |
| `si-ink` | `#1F2A24` | texte principal |
| `si-muted` | `#5A665F` | texte secondaire, libellés |
| `si-verified` | `#2E7D5B` | validé, rapproché, conforme |
| `si-amber` | `#B07A1C` | fond de pastille d'alerte seulement |
| `si-amber-ink` | `#835A10` | **texte** d'alerte, seule variante lisible (AA) |
| `si-line` | `rgba(31,42,36,0.10)` | filets, séparateurs |
| `si-line2` | `rgba(31,42,36,0.06)` | séparateur très discret |

**Règles dures**

- **Un seul accent.** Le vert forêt porte l'action principale et le statut positif.
  Il ne décore rien. Un écran avec cinq touches de vert n'a plus d'action principale (M2).
- **`si-amber` en fond, `si-amber-ink` en texte.** Ne jamais écrire du texte en
  `si-amber` sur fond clair, le contraste tombe sous AA.
- **La couleur ne porte jamais seule une information.** Un statut a une forme et un
  mot en plus de sa couleur. Daltonisme, impression noir et blanc, dossier d'inspection.
- **Le rouge est réservé aux montants négatifs et aux erreurs bloquantes.** Pas aux
  échéances, qui sont ambre.
- **Griser ce qui est inactif** plutôt que le masquer (C1). Une période verrouillée
  reste visible, en gris, non éditable.

---

## §5 — Boutons et contrôles

Section demandée explicitement. Quatre niveaux, pas cinq.

### 5.1 Hiérarchie

| Niveau | Apparence | Usage | Fréquence |
|---|---|---|---|
| **Primaire** | fond `si-forest`, texte blanc | l'action principale de l'écran | **une seule par écran** (M2) |
| **Secondaire** | fond transparent, filet `si-line`, texte `si-ink` | action réelle mais non principale | 0 à 2 par écran |
| **Discret (ghost)** | aucun fond, aucun filet, texte `si-muted` | mobilier de barre d'outils : filtrer, affichage, options | libre |
| **Destructif** | texte rouge, jamais un fond rouge plein | supprimer, annuler une écriture | avec confirmation obligatoire |

**La règle qui compte** : si deux boutons pleins verts cohabitent à l'écran,
l'écran est mal conçu. Descendez l'un des deux en secondaire.

### 5.2 Dimensions

| Taille | Hauteur | Retrait horizontal | Usage |
|---|---:|---:|---|
| `sm` | `26px` | `8px` | pastilles de filtre, contrôles dans une ligne |
| `md` | `30px` à `32px` | `10px` à `12px` | défaut, barres d'outils |
| `lg` | `36px` à `40px` | `14px` à `16px` | validation de formulaire, action d'une modale |

- Bouton à icône seule : carré strict, `28x28` en `md`.
- Icône dans un bouton avec texte : `14px` à `16px`, écart `6px` du libellé.
- Libellé en `13px`, graisse `520` à `550`. Jamais en gras lourd, jamais en majuscules.

### 5.3 Formes

Ne jamais appliquer le même rayon partout, c'est un tell d'IA (A4).

| Élément | Rayon |
|---|---:|
| Boutons et petits contrôles | `6px` |
| Champs de saisie | `6px` |
| Panneaux et cartes internes | `8px` à `10px` |
| Superpositions, modales, palette | `12px` |
| Pastilles de statut et de filtre | `pleine` (réservé, voir ci-dessous) |

**Le rayon plein est réservé aux statuts et aux filtres.** Un bouton d'action n'est
jamais une pilule. C'est ce qui distingue au premier regard « je déclenche » de
« je décris ».

### 5.4 États

Les quatre états sont obligatoires sur chaque contrôle, sans exception.

- **Repos** : tel que défini.
- **Survol** : assombrissement du fond de `4 %` à `6 %`. Aucun déplacement, aucun
  agrandissement, aucune ombre qui apparaît.
- **Focus clavier** : contour `2px` `si-forest` à `35 %` d'opacité, `outline-offset: -2px`.
  Jamais supprimé. C'est une exigence d'accessibilité, pas une option.
- **Désactivé** : opacité `45 %`, curseur par défaut, et **une raison lisible** à
  proximité ou en info-bulle. Un bouton grisé sans explication est un cul-de-sac.

### 5.5 Interdits

- Dégradés dans un bouton.
- Ombre portée sur un bouton.
- Emoji dans un libellé (A6).
- Un bouton qui grandit ou se soulève au survol.
- Une action essentielle révélée par le seul survol (MB1). Toujours un déclencheur
  persistant, le menu `...` par exemple, parce que ces écrans sont consultés sur tablette.

---

## §6 — Élévation, filets et bordures

**Principe emprunté à Linear** : on sépare par des filets, pas par des ombres.

- Séparation par défaut : filet `1px` en `si-line`.
- **Ombres autorisées uniquement pour ce qui flotte réellement** : palette de
  commande, menu, modale, info-bulle, notification. Deux niveaux, pas plus.
- **Aucune ombre sur un élément posé dans le flux** : ligne, panneau, tableau, section.
- Pas de flou, pas de verre dépoli, sauf l'en-tête de groupe collant qui peut porter
  un fond semi-opaque pour rester lisible au défilement.

Conséquence directe pour la compta : **les cartes KPI doivent disparaître.** Un total
important n'a pas besoin d'une boîte à ombre autour. Il a besoin d'être en haut, en
Geist Mono, plus grand que le reste. Voir §7.

---

## §7 — Tableaux et données chiffrées

Le cœur de la compta. Ces règles sont non négociables.

- **Texte à gauche, nombres à droite** (L2, 🟢). On compare les nombres par leur
  dernier chiffre. Un montant centré casse le balayage vertical d'une colonne.
- **En-tête de colonne aligné sur sa colonne.** Un en-tête de colonne numérique est
  donc aligné à droite lui aussi.
- **Chiffres tabulaires obligatoires**, sinon les colonnes dansent.
- **Ligne de total franchement distincte** : filet supérieur plus marqué, graisse
  `560`, jamais un fond coloré.
- **Tronquer les textes bavards** avec ellipse, valeur complète accessible (E1). Une
  description de 90 caractères ne doit pas voler la place de la colonne « solde ».
- **Laisser la donnée dicter la forme** (L1). Un journal chronologique se lit mieux
  en ligne de temps qu'en tableau trié par date (P1). Un statut récurrent se lit
  mieux en pastille qu'en mot répété.
- **Barre de synthèse inline** en haut de liste plutôt que des cartes KPI :
  une ligne de `36px`, filet en dessous, chiffres en mono, libellés en `si-muted`.
  Exemple : `124 850,00 $ en fidéicommis · 1 rapprochement à vérifier`.

**Spécifique fidéicommis.** Le solde en fidéicommis est toujours visible sans
interaction, jamais replié, jamais derrière un onglet. Cet écran doit rester lisible
pour un inspecteur du Barreau et refléter la structure du registre légal. La sobriété
esthétique ne passe jamais devant l'affichage franc du solde.

---

## §8 — Identités et nommage

Règle de contexte propre à SAFE, tranchée dans DESIGN_HUMAIN §11.

**Les identités s'écrivent en clair.** Clients, parties adverses, juges,
responsables. Un avatar coloré seul crée un risque d'erreur de manipulation dans un
cabinet, où confondre deux parties a des conséquences réelles.

L'avatar est **un complément du nom, jamais un remplacement**. Si la place manque
pour le nom, retirez l'avatar, pas le nom.

---

## §9 — Divulgation progressive

- Ne montrer par défaut que ce qui sert à décider (H1).
- Ne pas afficher éditer, dupliquer et supprimer en permanence sur chaque ligne (A11).
- Le déclencheur reste **persistant et découvrable** : menu `...`, icône d'information,
  lien « voir le détail ». Jamais le survol seul (MB1).
- Signaler la profondeur par un indicateur discret plutôt que par un bloc déplié
  (P2) : un compteur de commentaires, un petit repère.

---

## §10 — Mouvement

- Durées : `120ms` à `260ms`.
- Courbe : `cubic-bezier(0.16, 1, 0.3, 1)`.
- Réservé aux confirmations, aux transitions d'écran et aux révélations utiles.
- `prefers-reduced-motion` respecté.
- **Aucun mouvement décoratif continu.** Rien qui pulse, rien qui flotte, rien qui
  brille.

---

## §11 — Voix dans l'interface

- Vouvoiement, toujours.
- **Aucun tiret long en milieu de phrase.** Virgule, deux points, ou deux phrases.
- Libellés concrets, jamais de remplissage vague (A7). « Rapprocher le relevé »,
  pas « Gérer vos opérations ».
- Un message d'erreur dit ce qui s'est passé et quoi faire ensuite.
- Une info-bulle courte au bon moment plutôt qu'une modale à six puces (U1, A12).
- Ton posé. Ne pas appuyer sur la peur ni sur l'urgence.

---

## §12 — Checklist avant de dire « terminé »

À passer sur chaque écran. Un seul « non » et l'écran n'est pas fini.

**Structure**
- [ ] Une action principale évidente, un seul bouton plein vert.
- [ ] Le rapport espace intra-groupe / inter-groupe est d'au moins 1 pour 3.
- [ ] Quatre niveaux typographiques maximum.
- [ ] Aucun paragraphe au delà de `65ch`.

**Données**
- [ ] Tous les nombres à droite, en Geist Mono, chiffres tabulaires.
- [ ] En-têtes alignés sur leur colonne.
- [ ] Ligne de total distincte sans fond coloré.
- [ ] Textes longs tronqués avec accès à la valeur complète.

**Contrôles**
- [ ] Les quatre états présents partout, focus clavier jamais supprimé.
- [ ] Aucune action essentielle en survol seul.
- [ ] Rayons différenciés selon le rôle, pilule réservée aux statuts et filtres.
- [ ] Chaque bouton désactivé a une raison lisible.

**Anti-slop (DESIGN_HUMAIN §10)**
- [ ] Aucun dégradé, aucun verre dépoli, aucune ombre sur un élément du flux.
- [ ] Aucun emoji, aucune icône purement décorative.
- [ ] Contraste vérifié, pas de gris sur gris.
- [ ] La structure vient du contenu réel, pas d'un gabarit.

**Conformité et voix**
- [ ] Le solde en fidéicommis est visible sans interaction.
- [ ] La couleur ne porte jamais seule une information.
- [ ] Les identités sont en clair, l'avatar ne remplace jamais un nom.
- [ ] Vouvoiement, aucun tiret long, aucun libellé vague.

---

## Journal

| Date | Modification |
|---|---|
| 2026-07-24 | Création. Dérivé de DESIGN_HUMAIN.md, de la direction Linear §7 et des tokens `si-*` réels du repo. |
