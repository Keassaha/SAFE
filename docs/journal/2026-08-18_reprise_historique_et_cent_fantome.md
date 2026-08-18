# 2026-08-18 — La reprise de l'historique, et le cent qui n'existait pas

## Pourquoi la reprise

Le lot 1 décompose la taxe à la création. Les dépenses saisies avant lui portent
`taxOrigin = NULL` et ne comptent nulle part : ni dans la taxe récupérable, ni dans la
file à confirmer. Sans reprise, le lot 1 ne sert qu'aux dépenses futures et le premier
dossier de fin d'année reste vide.

## La garantie qui la rend honnête

Une ligne reprise est marquée **estimée**, jamais déclarée. La reprise répare le chiffre
sans prétendre l'avoir lu sur un reçu. Elle rend les états justes et laisse la ligne dans
la file de confirmation, là où le cabinet décidera pièce en main.

Cette garantie n'est pas déclarative : elle découle du fait qu'aucune valeur déclarée
n'est passée au décompteur. Un test la verrouille malgré tout, et le service lève une
erreur plutôt que d'écrire si le contrat changeait un jour.

## Deux temps, pas un bouton

Une reprise en masse qui s'exécute d'un clic est exactement ce qu'un cabinet ne peut pas
défendre en vérification. La bannière montre d'abord ce que ça donnerait, en chiffres, et
n'écrit que sur un second geste.

Elle disparaît d'elle-même quand il n'y a plus rien à reprendre : c'est une dette
ponctuelle, pas un réglage.

## Ce que la reprise ne touche pas

Le montant. Le journal général inscrit `expense.montant`, que la reprise laisse intact :
seule la ventilation HT/taxe change. Aucune écriture n'est donc à contrepasser, et la
boucle de correction du 17 n'a pas à être sollicitée.

## Le défaut que la vérification a trouvé

C'est le vrai gain de la journée.

En exerçant la reprise contre la **vraie base**, une ligne a refusé de retomber juste :
229,95 $ payés, mais HT + taxes = 229,96 $.

Cause : `splitInclusiveTaxes` arrondit la base, puis recalcule la taxe **sur la base
arrondie**. En régime TVH 13 %, 229,95 ÷ 1,13 = 203,4956 arrondi à 203,50, puis la taxe
sur 203,50 donne 26,46. Somme : 229,96.

Un cent qui n'existe pas. Le journal aurait dit 229,95 et la dépense 229,96, et l'écart se
serait accumulé ligne après ligne jusqu'au dossier de fin d'année.

**Correctif** : le HT se **déduit** du total au lieu d'être repris de la base calculée. Le
montant payé est la seule certitude, c'est lui qui arbitre. Le résidu va dans le HT et non
dans la taxe, pour ne jamais réclamer un cent de plus que ce que le taux donne.

### Ce que ça dit des tests

Mon test d'invariant existait déjà et couvrait quatre montants choisis à la main. Aucun ne
tombait sur le cas. Il balaie désormais **10 000 montants sur deux régimes**.

Un invariant d'arrondi ne se teste pas par exemples : il se balaie. Quatre cas choisis par
celui qui écrit le code testent surtout ce à quoi il a pensé.

## Vérifié

Reprise exercée contre `safe_local` : simulation sans écriture, application correcte,
salaire à zéro taxe, second passage sans effet (idempotence). 1536 tests au vert, `tsc` et
lint propres, parité i18n. Données de test retirées.

## Non vérifié

La bannière n'a pas pu être déclenchée à l'écran : la fenêtre Chrome rapporte toujours un
viewport de 0x0 et les événements React n'atteignent pas les boutons. Le **rendu** de la
bannière est confirmé (« 3 dépense(s) saisie(s) avant le calcul de taxe » et son bouton),
son **déclenchement** ne l'est pas. Le service, lui, est vérifié contre la vraie base.
