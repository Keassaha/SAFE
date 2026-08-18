# 2026-08-18 — Lot 4 : le dossier de fin d'année

## Ce qu'il remplace

Le « Rapport annuel d'impôts » affichait quatre lignes, toutes du côté revenus :
facturé, TPS collectée, TVQ collectée, paiements reçus. Aucune déduction.

Votre spec le disait sans détour : un onglet nommé rapport d'impôts qui ne porte
aucune déduction est **pire** qu'un onglet absent, parce qu'il donne au cabinet le
sentiment d'être prêt. C'était un défaut de promesse avant d'être un défaut technique.

Le composant a été supprimé, pas laissé à côté. Deux écrans qui prétendent la même
chose finissent toujours par diverger.

## Le chiffre qui n'existait nulle part

**Le net à remettre** : taxe collectée moins taxe payée récupérable. Un cabinet qui
remet la taxe collectée sans déduire ce qu'il a payé sur ses achats remet trop, tous
les trimestres, sans jamais le voir.

Il est en tête de page, en gros, avec son calcul écrit dessous. C'est ce pour quoi on
ouvre cet écran.

## L'ordre de lecture est un choix

Net à remettre d'abord. **Zones d'incertitude juste après.** Détail ensuite.

Les incertitudes ne sont pas reléguées en bas de page parce qu'elles **qualifient** le
total : les repousser reviendrait à présenter un chiffre comme définitif alors qu'il ne
l'est pas.

Six zones sont détectées, chacune avec son nombre et son montant :

| Code | Ce qu'elle dit |
| --- | --- |
| `TAXES_ESTIMEES` | calculée depuis le montant, pas lue sur un reçu, donc pas réclamable |
| `CATEGORIE_AUTRES` | tant que ça y reste, la déductibilité ne s'établit pas |
| `PRORATA_VEHICULE_ABSENT` | exclu du dossier plutôt que déduit au hasard |
| `PLAFOND_QC_NON_CALCULE` | le montant est un maximum, pas un montant final |
| `PIECES_MANQUANTES` | la seule liste sur laquelle le cabinet agit |
| `PERIODE_NON_VERROUILLEE` | ces chiffres peuvent encore changer |

Un dossier propre n'en affiche aucune. C'est ce qui rend les six crédibles quand elles
apparaissent.

## Déclarer plutôt qu'inventer

Le plafond québécois sur les frais de représentation est le cas d'école. Ses paliers
sont `A_CONFIRMER` depuis la recherche du 17 : « 2 %, 650 $ ou 1,25 % du chiffre
d'affaires, selon le cas », sans que les bornes soient connues.

J'aurais pu poser une valeur plausible. Le module **déclare** à la place : le montant
affiché est un maximum, et un astérisque le dit dans le tableau. Un comptable qui reçoit
un chiffre présenté comme calculé ne le revérifie pas.

Même logique pour le véhicule : sans prorata, la dépense est exclue et le taux affiche
« à établir », jamais 0 % ni 100 %.

## Aucun montant déductible par ligne

Règle héritée du lot 2 et tenue ici : le tableau affiche un **taux**, jamais un montant
déductible. Le plafond s'applique au cumul de l'exercice, donc ce montant n'existe pas
avant la clôture. Un test verrouille son absence.

## Vérifié

16 tests sur le calcul, dont le net à remettre, le demi-crédit du repas, l'exclusion du
véhicule sans prorata, et le cas d'un dossier propre sans aucune incertitude. 1574 tests
au total, `tsc` propre, lint propre, parité i18n.

## Non vérifié

L'écran n'a pas été vu : la fenêtre Chrome rapporte toujours un viewport de 0x0. Le
calcul, lui, est couvert de bout en bout.

## Ce qui reste pour clore le chantier dépenses

- **Le prorata véhicule** : moteur, export et dossier le consomment tous les trois, rien
  ne le saisit encore.
- **Les paliers du plafond québécois**, et le traitement ontarien du plafond.
- **Un export réel** ouvert dans QuickBooks, Xero ou Sage, au moins une fois.
