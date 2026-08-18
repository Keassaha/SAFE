# 2026-08-18 — Le prorata véhicule, et le NaN qui serait passé

## Ce qui manquait

Trois endroits consommaient le prorata d'usage du véhicule, et rien ne le saisissait :
le moteur de taxe réclamable (lot 2), l'export comptable (lot 3) et le dossier de fin
d'année (lot 4). Les trois retombaient sur `null` codé en dur, donc la catégorie
véhicule était systématiquement exclue.

## Par exercice, pas une valeur unique

L'usage d'affaires varie d'une année à l'autre. Une valeur unique appliquée à tout
l'historique produirait une déduction fausse sur des exercices possiblement déjà
déclarés.

La lecture ne retombe donc **jamais** sur une autre année. Un prorata absent en 2025
reste absent, même si 2026 en porte un : déduire un exercice avec le chiffre du voisin
serait une affirmation que rien ne soutient.

## Stocké dans la config, sans migration

`Cabinet.config` est déjà un JSON qui porte les numéros de taxes et la configuration de
facture. Le prorata y rejoint ses voisins naturels. Aucune migration, donc aucun gate de
déploiement supplémentaire sur un chantier qui en compte déjà deux non appliqués.

## La faiblesse est écrite à l'écran

L'arbitrage CEO n° 1 l'exigeait, et c'est tenu mot pour mot :

> Un pourcentage que vous déclarez se défend moins bien qu'un registre de kilométrage.
> L'ARC attend la date, la destination, le motif et les kilomètres de chaque déplacement.
> Tant que ce registre n'existe pas dans SAFE, votre dossier de fin d'année signale ce
> point comme une zone à éclaircir.

Taire ce point donnerait au cabinet une confiance que le chiffre ne mérite pas. La date
de saisie et l'auteur sont conservés : sans registre, savoir **quand** et **par qui** la
valeur a été affirmée est tout ce qui reste de défendable.

## Le défaut que les tests ont trouvé

`NaN` franchissait le garde-fou.

`typeof NaN === "number"` est vrai, et **toute** comparaison avec NaN est fausse : ni
`< 0` ni `> 1` ne le rejetaient. Il serait ressorti en prorata valide, puis se serait
propagé dans chaque montant de taxe du dossier de fin d'année, transformant des totaux
en `NaN` sans qu'aucune erreur ne soit levée.

Corrigé par `Number.isFinite`. C'est le deuxième défaut de la journée trouvé par un test
écrit pour un cas qui semblait théorique.

## Un choix répété : refuser plutôt que corriger

Une valeur hors bornes est **refusée**, pas ramenée entre 0 et 1. Un clamp silencieux
transformerait une faute de saisie en déduction fabriquée. Refuser laisse l'incertitude
visible, et le dossier de fin d'année la déclare.

C'est la même logique que le motif d'annulation en liste fermée et que les catégories
sans taxe : le produit préfère dire qu'il ne sait pas.

## Vérifié

10 tests sur le prorata, 1584 au total, `tsc` propre, lint propre, parité i18n.

## Non vérifié

L'écran de saisie n'a pas été vu : viewport Chrome toujours à 0x0.

## Effet sur les incertitudes du dossier

Un prorata renseigné fait disparaître `PRORATA_VEHICULE_ABSENT` du dossier de fin
d'année et fait entrer la taxe véhicule dans le réclamable, au taux déclaré. C'est une
incertitude sur six qui se ferme, sur trois écrans à la fois.
