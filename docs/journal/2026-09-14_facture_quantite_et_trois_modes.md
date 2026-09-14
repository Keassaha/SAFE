# 2026-09-14 — La facture montre enfin ce que chaque chose vaut à l'unité

Demande du CEO : « la facture n'est pas assez détaillée [...] les titres comme le taux
(pour horaire) et pour Quantité (pour les heures) et une organisation aussi pour une
facture mixte et une facture par forfait. » Tranché ensuite : **« Quantité partout,
forfait avant horaire. »**

Ceci touche le document que les clients reçoivent, pas l'écran de préparation.

## Ce que j'ai trouvé

La quantité et le taux unitaire **existent depuis toujours sur chaque ligne de facture en
base** (`InvoiceLine.quantite`, `InvoiceLine.tauxUnitaire`). Ce n'était pas une donnée
manquante.

Le présentateur les mettait à `null` dès que le **dossier** était au forfait :

```
const showHourly = !isForfait && presentedType === "honoraires" && line.lineType === "fee";
hours: showHourly ? line.quantite : null,
```

Trois conséquences, toutes visibles par le client :

1. **Une facture au forfait perdait ses deux colonnes entièrement.** Le document les
   retirait, faute de ligne à remplir. Le client lisait trois montants et rien qui dise
   ce que chacun valait à l'unité.
2. **Une heure travaillée sur un dossier au forfait perdait son taux**, alors que la
   donnée était là. Le mode venait du dossier, jamais de la ligne.
3. **En mixte, tout vivait dans un seul tableau.** Les lignes au forfait y laissaient
   deux colonnes vides au milieu des lignes horaires, et rien ne distinguait ce qui était
   facturé d'avance de ce qui l'était au temps passé.

## Ce qui a été construit

**Le présentateur cesse d'effacer.** `quantite` et `taux` sont rendus sur toute ligne
d'honoraires. Les anciens noms `hours` et `rate` portent la même valeur, le temps que les
gabarits HTML historiques migrent : rien ne casse.

**Chaque ligne dit d'où vient son prix.** Un champ `basis` vaut `horaire` ou `forfait`,
lu sur la LIGNE : `sourceType === "time_entry"` ou un rattachement à une fiche de temps
disent l'horaire, `registre_tache` dit le forfait, et le mode du dossier ne sert plus que
de repli pour les lignes anciennes. Une ligne sans base déclarée rejoint l'horaire : mieux
vaut la ranger du mauvais côté que la faire disparaître d'un tableau.

**Le mode de la facture se déduit des lignes.** `grouperLignes` rend deux familles,
`honorairesForfait` et `honorairesHoraire`, leurs deux sous-totaux, et un
`modeHonoraires` qui vaut `mixte` quand les deux sont présentes.

**Le document.** « HEURES » devient « QUANTITÉ » dans les trois modes, décision du CEO,
et « QUANTITY » en anglais. Les deux colonnes se montrent dès qu'une ligne a de quoi les
remplir. Sur une facture mixte, le groupe se scinde en « Au forfait » puis « À l'heure »,
chacun sous-titré et sous-totalisé, le forfait d'abord. La quantité dit son unité :
« 2,50 h » pour du temps, un nombre nu pour un forfait — la colonne s'appelait « Heures »
et l'unité était implicite, elle ne l'est plus.

**Les deux gabarits** sont alignés : le standard et celui de Me Derisier.

**La colonne a été élargie de 9 à 12 %**, aux dépens de la prestation qui reste de loin la
plus large : « QUANTITÉ » se coupait en deux à 9 %. Constaté sur un PDF réel, pas deviné.

**L'aperçu en direct de l'écran de préparation** a été aligné : il dit désormais
exactement ce que le document dira.

## Vérifications

- Typecheck vert.
- **2 189 tests verts** (181 fichiers), dont 7 nouveaux : six sur la séparation des deux
  familles, un sur l'heure qui garde son taux malgré un dossier au forfait.
- Parité FR/EN parfaite.
- **Un PDF réel a été rendu et regardé** pour chaque mode, via `renderToBuffer` puis
  conversion en image : `docs/journal/captures/2026-09-14_facture_mixte_apres.png` et
  `…_facture_forfait_apres.png`.

**Un test disait le contraire et a été réécrit** : « forfait : ne projette pas heures ×
taux sur les honoraires » verrouillait précisément le comportement que le CEO fait
changer. Il vérifie maintenant que la quantité et le taux sont rendus, et le commentaire
dit pourquoi il a changé de camp.

## Ce que je n'ai pas pu vérifier

- **Une facture réelle du cabinet.** Les PDF regardés sont bâtis sur des données fictives.
- **Les factures déjà émises se rendront désormais avec leurs quantités visibles** si on
  les régénère. Aucun chiffre ne change, aucune n'est réécrite en base ; c'est
  l'apparence d'un document déjà envoyé qui différerait d'une nouvelle impression. Dit au
  CEO avant le oui.
- Les gabarits HTML historiques (`InvoiceTemplate.tsx`, `InvoiceTemplateClean.tsx`) lisent
  encore `hours`/`rate`. Ils continuent de fonctionner puisque les anciens noms portent la
  même valeur, mais ils n'ont reçu ni le mot « Quantité » ni la séparation des familles.
  À faire si ces écrans servent encore.
