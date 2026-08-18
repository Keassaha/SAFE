# 2026-08-18 — Lot 3 : l'export cesse d'envoyer le TTC en dépense

## Les deux défauts

**§0.4** L'export mappait une dépense en `Dr Dépenses (5000) / Cr Banque (1000)` pour le
montant complet. L'asymétrie sautait aux yeux à côté de la facture, traitée deux blocs
plus haut dans le même fichier :

```
Facture :  Dr Comptes à recevoir | Cr Honoraires + Cr Taxes à remettre   (3 lignes)
Dépense :  Dr Dépenses           | Cr Banque                              (2 lignes)
```

Conséquence : les dépenses partaient **surévaluées** chez le comptable, et la taxe
récupérable était invisible.

**§0.5** Les 26 catégories partaient toutes sur le compte unique 5000. Le travail de
classement était fait, puis jeté au moment précis où il servait.

## Ce qui va en actif, et ce qui n'y va pas

C'est la décision de fond du lot, et elle relie les trois précédents.

Le compte de taxe à recouvrer reçoit la taxe **réclamable**, pas la taxe **payée** :

- une taxe **estimée** n'y va pas, parce qu'elle n'est pas justifiable en vérification
  faute du montant lu sur la pièce (lot 1) ;
- sur un repas, seule la **moitié** y va, parce que la limite de 50 % s'applique aussi au
  crédit de taxe (lot 2) ;
- la part non récupérable n'est pas perdue : elle **reste dans la dépense**, parce que
  c'est ce qu'elle est, un coût.

Un repas de 114,98 $ produit donc : dépense 107,49 $, taxe à recouvrer 7,49 $, banque
114,98 $. Trois lignes balancées, et pas un dollar inventé.

Quand rien n'est récupérable, l'export reste à **deux lignes**. Inscrire un zéro dans un
compte de taxe à recouvrer polluerait le grand livre du comptable pour rien.

## Un compte par catégorie

26 comptes, codes indicatifs suivant le découpage usuel d'un cabinet juridique canadien,
tous surchargeables : c'est le plan du logiciel du comptable qui fait foi, pas le nôtre.

Une catégorie inconnue retombe sur le compte général plutôt que de faire échouer
l'export. Mieux vaut un export exact sur un compte fourre-tout qu'un export qui casse.

La catégorie rejoint aussi le mémo : même avec un compte dédié, le comptable qui relit une
ligne isolée doit voir le classement d'origine.

## Une seule règle, un seul endroit

La taxe réclamable est calculée par `taxeReclamable`, la même fonction que l'écran. La
recalculer dans l'export ferait diverger ce que le comptable reçoit de ce que le cabinet a
vu. Un écart entre les deux serait indéfendable.

## Le véhicule, prudence assumée

Le prorata d'usage n'est pas encore saisissable (reste du lot 2). L'export le traite donc
comme **indéterminé**, et aucune taxe de véhicule ne part en actif. Direction prudente :
sous-réclamer se corrige, sur-réclamer se fait reprendre.

À rebrancher dès que le prorata sera stocké.

## Vérifié

6 nouveaux tests d'export, dont l'équilibre débit/crédit sur les trois lignes, le
demi-crédit du repas, un compte distinct par catégorie et le garde-fou contre une taxe
supérieure au montant payé. 1558 tests au total, `tsc` et lint propres.

## Non vérifié

Aucun export réel n'a été produit et ouvert dans QuickBooks, Xero ou Sage. Les lignes sont
correctes par construction et par test, mais la lecture par le logiciel du comptable
reste à faire au moins une fois.
