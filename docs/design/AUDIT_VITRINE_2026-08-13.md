# Audit visuel de la vitrine

> 13 août 2026. Demande du CEO : « trop de tailles de font, limite-toi à 2
> polices maximum, regarde la symétrie (simple et fiable ne sont pas alignés),
> et d'abord un audit de ce qui est incorrect ou inutile ».
>
> Relevés dans le navigateur sur le rendu réel de `/`, aux largeurs 320, 1280
> et 1440 px. Rapport lisible : voir l'artefact publié le même jour.

## Le relevé

| Mesure | Valeur |
|---|---:|
| Tailles de police, texte éditorial (maquettes exclues) | **24** |
| Tailles de police, page entière | 32 |
| Bords gauches distincts pour 8 titres de section | **6** |
| Largeurs de contenu (`max-width`) distinctes | 17 |
| Rampes `font-size: clamp()` distinctes | **20** |
| Emplois de Geist Mono portant de la prose | **50 / 135 (37 %)** |
| Textes sous le seuil AA de contraste | 54 |
| Textes sous 11 px | 65 (le plus petit à 8,5 px) |
| Valeurs d'espacement hors pas de 4 px (PS-003) | 498 |
| Écrans de défilement | 20,8 |

## Ce qui tient déjà

Quatre points sont justes, dont deux tells d'IA correctement évités.

- **Le texte n'est pas centré** : 293 blocs à gauche contre 9 centrés, 0 texte
  long centré. A2 évité.
- **Trois graisses seulement** : 400, 500, 600.
- **La preuve produit est recadrée**, jamais une capture entière (L6, A18).
- **Le récit de défilement est cohérent** (MO4).

Le problème n'est pas le goût, il est structurel.

## Constats

### D1 · Il n'y a pas de colonne vertébrale

Six bords gauches pour huit titres de section, dix-sept largeurs de contenu.

```
Bord gauche des titres, à 1440 px
  Simple      84      Complet    764
  Fiable     140      Synthèse   613
  Promesse   440      Tarifs      90
  CTA        458      Questions   90
```

**Cause exacte.** Les deux scènes portent le même `padding-left: 84px`. Mais
`zone-fiable` insère `.fi-grid` en `max-width: 1160px` centrée : dans une boîte
de 1272 px, le centrage ajoute 56 px. `84 + 56 = 140`.

À 1280 px la boîte tombe à 1112 px, le centrage cesse, les deux titres se
rejoignent à 77 px. **Le défaut n'apparaît qu'au-dessus de ~1330 px**, ce qui
explique qu'il ait échappé jusqu'ici.

L'écart de 6 px entre Tarifs et Simple est pire que celui de 56 : trop petit
pour se lire comme une intention, trop grand pour paraître aligné.

### D2 · Vingt-quatre tailles pour six rôles

`PS-007` autorise quatre niveaux typographiques par écran. Quatre scènes sur
six le dépassent : hero 15, simple 12, complet 12, fiable 10.

Vingt déclarations `clamp()` aux triplets tous différents. Le rôle « titre de
section en serif » est déclaré six fois :

```
.ch-mark       clamp(34px, 4.2vw, 56px)
#cta h2        clamp(34px, 4.6vw, 56px)   ← même sommet, autre pente
#tarifs h2     clamp(30px, 3.4vw, 46px)
#questions h2  clamp(30px, 3.4vw, 46px)
.fi-copy h2    clamp(28px, 3.1vw, 42px)
.co-copy h2    clamp(27px, 3.0vw, 40px)
```

Les deux premières se rejoignent aux extrêmes et divergent au milieu : à
1000 px, 42 px contre 46. Ce n'est pas une échelle, c'est un continuum. Chaque
bloc a été réglé pour que sa phrase tombe bien, pas pour tenir un rôle (T3).

Le plus net : trois piliers, même titre à 56 px, trois sous-titres à 46, 42 et
40 px.

### D3 · Le mono a quitté son rôle

`IDENTITE_SAFE.md §3.3` réserve Geist Mono aux « chiffres tabulaires,
références, numéros de facture, dates ». Mesuré : **85 emplois chartés,
50 hors charte** (« Assembler », « Lecture rapide », « Encaissements »,
« À traiter maintenant »). C'est cela qui donne la sensation d'une troisième
police de trop.

### D4 · Le récit mange la conversion

| Section | Écrans | Part |
|---|---:|---:|
| Hero | 4,2 | 20 % |
| Complet | 4,2 | 20 % |
| Fiable | 4,0 | 19 % |
| Simple | 3,2 | 15 % |
| Synthèse | 1,5 | 7 % |
| Promesse | 1,2 | 6 % |
| Questions | 0,9 | 4 % |
| Tarifs | 0,7 | 3 % |
| Appel à l'action | 0,7 | 3 % |

Seize écrans avant de voir un prix.

### D5 · La même maquette, deux fois

La vue « Lecture rapide » et ses quatre tuiles (87 115,20 $ / 49 055,00 $ /
38 060,20 $) est rendue dans le hero (`.ha-screen`) puis à l'identique dans la
scène Simple (`.em-corps` / `.em-tiles`). 4,2 écrans puis 3,2 écrans sur le
même panneau.

### D6 · Le petit texte descend trop bas

65 éléments sous 11 px, le plus petit à 8,5 px. 54 textes sous AA, contrastes
compositant correctement les fonds dilués.

Le pire, à 3,03 : « Gratuit, sans carte de crédit », 13 px. Ce n'est pas une
maquette, c'est la mention rassurante sous l'appel à l'action.

### D7 · L'espacement n'a pas d'échelle

498 valeurs hors du pas de 4 px. Récidivistes : `padding 7px` (168 fois), 6, 9,
11, 13 px.

## Ce qui est inutile

- **La scène de synthèse** (1,5 écran). La triade est annoncée, développée en
  trois piliers, puis récapitulée : dite trois fois.
- **La deuxième copie de la maquette** (D5), environ un écran.
- **Seize des vingt rampes `clamp()`**. Quatre suffisent.
- **Les cinquante emplois du mono sur de la prose**.

## Arbitrage sur « deux polices maximum »

La consigne entre en tension avec la charte, qui en prévoit trois avec des
rôles distincts. Retirer Geist Mono retirerait les chiffres tabulaires des
montants, or « le chiffre est sacré » : dans un solde de fidéicommis,
l'alignement des unités est ce qui rend deux montants comparables. C'est
fonctionnel.

**Recommandation : garder trois familles, les ramener à leurs rôles.** Le mono
disparaît de toute prose. Sur les surfaces éditoriales, on lit alors deux
polices, effet demandé, sans perdre la lisibilité des montants.

Variante stricte si le CEO tranche à deux : la vitrine passe en Geist Sans avec
`font-variant-numeric: tabular-nums`, le mono ne survit que dans l'application.

## Trois directions

**1 · Une colonne, quatre tailles, un pas.** Le socle, préalable aux deux
autres. Un conteneur unique, une largeur maximale, un retrait latéral ; toute
dérogation justifiée en commentaire. Quatre rôles, quatre rampes. Espacement
remis sur le pas de 4.

**2 · Le registre plutôt que le film.** Assumer l'instrument comptable : hero
en vue de registre réelle, une phrase, un bouton. Piliers ramenés à un écran
chacun. Prix au tiers de la page. Page autour de 8 écrans.

**3 · Garder le film, discipliner la scène.** Le défilement narratif reste,
mais chaque scène adopte le même gabarit : exergue, titre, une phrase, une
preuve, aux mêmes position et taille. Ne règle pas la longueur.

## Méthode

Contrastes calculés en compositant les fonds semi-transparents : mesurer un
fond dilué comme opaque donne des ratios faux (une première passe annonçait
66 échecs dont un à 1,00, artefact du calcul ; le chiffre corrigé est 54, pire
cas 3,03). Tailles de police séparées entre éditorial et maquettes produit, ces
dernières portant légitimement une échelle plus petite.

Référentiels : `SAFE_PREMIUM_DESIGN_STANDARD.md` (PS-003, PS-007),
`DESIGN_HUMAIN.md` (§0, §3, §10), `IDENTITE_SAFE.md` §3.3.
