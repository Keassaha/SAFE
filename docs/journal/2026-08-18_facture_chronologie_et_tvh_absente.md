# 2026-08-18 — La chronologie des factures, et la TVH qui n'apparaissait pas

## Demande

Que les dates paraissent sur les factures et dans le formulaire de temps, que le temps
de chaque tâche soit visible, et que tout soit naturellement aligné chronologiquement.

## Ce qui allait déjà

Les deux gabarits, PDF et web, affichaient déjà description, **date**, **heures**, taux
et montant. Le formulaire de temps porte un champ date étiqueté, avec le bon jour par
défaut depuis le correctif de ce matin.

## Ce qui n'allait pas : l'ordre

`sortOrder` était attribué en deux passes à la création de la facture : **toutes** les
prestations, puis **tous** les débours. Et aucune des deux requêtes source n'avait
d'`orderBy`, donc l'ordre à l'intérieur de chaque groupe était celui que Postgres
voulait bien rendre.

Sur une facture mêlant honoraires et débours, le client lisait une suite de dates qui
montait, retombait, puis remontait. Une facture d'avocat se lit comme un récit du
dossier : si les dates sautent, le client cherche l'erreur au lieu de lire le travail.

**Corrigé aux deux bouts.** À la création, les deux requêtes trient par date. À
l'affichage, un tri chronologique s'applique dans le presenter, ce qui répare aussi les
factures **déjà émises**.

Trois règles, dans cet ordre : un rabais ciblé colle à sa ligne parente, le reste se
trie par date, ce qui n'a pas de date passe en fin. Les rabais globaux ferment la
facture, puisqu'ils portent sur l'ensemble et non sur un jour.

## Le défaut trouvé en chemin, et il est grave

Pour vérifier sans dépendre du navigateur cassé, j'ai **rendu une vraie facture PDF** et
je l'ai relue. C'est ce qui a révélé le reste.

Le gabarit Derisier calculait `taxTotal = totals.tps + totals.tvq`, **sans `hst`**.

Le projet stocke la TVH dans la colonne `tps` (invariant de `lib/billing/taxes.ts`),
mais le presenter la ré-étiquette avant l'affichage : pour un cabinet en TVH, il rend
`tps = 0`, `tvq = 0`, `hst = le montant`.

Sur les factures d'un cabinet **ontarien**, la somme valait donc zéro. Deux effets, tous
deux visibles par le client :

- la **ligne de TVH disparaissait**, étant conditionnée à `taxTotal > 0` ;
- le **« Sous-total » affichait le total taxes comprises**.

Me Derisier est en Ontario. Ses factures ne montraient aucune taxe. Une facture
d'inscrit qui ne montre pas la taxe qu'elle perçoit n'est pas seulement fausse, elle est
indéfendable.

### Un second défaut dans le même fichier

Le régime était dérivé de `client.billingProvince`, alors que la doctrine dit qu'il vient
du **cabinet**. C'est exactement le défaut corrigé ailleurs au commit `d09d142` :
« l'aperçu annonçait un total que la facture ne portait pas ». Il avait survécu ici. Le
gabarit lit désormais `totals.taxRegime`, déjà résolu par le presenter.

### Ce que ça dit de la méthode

Aucun test ne couvrait ce calcul parce qu'il vivait en ligne dans le JSX. Il est sorti en
fonction pure `resumeTaxes`, et huit tests le tiennent, dont l'invariant « sous-total plus
taxes retombe sur le total » sur quatre régimes.

Rendre l'artefact réel a trouvé en une fois ce que la lecture du code n'avait pas vu en
plusieurs passages sur ce fichier aujourd'hui.

## Vérifié

Facture PDF rendue et relue : quatre lignes dans l'ordre des dates (3, 9, 14 et 22 août),
le débours correctement intercalé entre les honoraires, heures et taux par ligne,
sous-total 2 225 $, TVH 13 % à 289,25 $, total 2 514,25 $.

12 tests d'ordre chronologique, 8 tests de taxes, 1625 au total, `tsc` propre, aucune
alerte de lint nouvelle.

## Non vérifié

Le rendu web de la facture (`/facture/[token]`) et le formulaire de temps n'ont pas été
vus à l'écran : viewport Chrome toujours à 0x0. Leur code gère la TVH correctement, et
seul le gabarit PDF portait le défaut.
