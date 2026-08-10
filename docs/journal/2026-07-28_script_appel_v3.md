# 2026-07-28 · Script d'appel v3

## Ce qui a été fait

Refonte de l'étage 2 du pipeline d'acquisition (l'appel à froid) dans
`docs/marketing/ventes/SCRIPT_APPEL_v3.md`.

## Ce qui a été observé dans la v2

Cinq écarts entre la règle écrite et le script écrit :

1. Le script annonçait l'offre et le prix au téléphone, alors que la règle du pipeline dit
   que l'appel ne vend rien. L'objection « c'est quoi le piège » est causée par le script
   lui-même.
2. Présentation en « consultant qui a développé un projet », qui est la phrase de tout
   vendeur de logiciel. L'actif réel du fondateur, teneur de livres de cabinets d'avocats,
   était absent.
3. Soixante mots avant la première pause, aucune question dans les vingt premières
   secondes.
4. « Conforme aux règles du Barreau » affirmé à l'oral, donc invérifiable, et hors sujet
   pour une cible ontarienne.
5. Aucune information récoltée pendant l'appel, donc courriel de suivi générique.

## Décisions prises

- **Aucun chiffre au téléphone.** Prix, nombre de places et durée passent entièrement dans
  le courriel. Motif : un chiffre prononcé est un chiffre à défendre, avant toute valeur
  perçue.
- **Nouvelle identité d'ouverture** : « Je fais la comptabilité de cabinets d'avocats,
  c'est mon métier. » L'outil devient la conséquence du métier, pas l'inverse.
- **Une question de diagnostic obligatoire par appel**, dont la réponse devient la première
  ligne du courriel. C'est le seul travail ajouté, et la seule chose mesurée en plus
  (colonne « question posée » dans le suivi).
- La variante Ontario ne change pas le script, puisque la mention du Barreau en sort. Elle
  change une ligne du courriel, à écrire seulement quand l'état du support LSO dans le
  produit aura été vérifié à l'écran.

## Reste ouvert

- L'état exact du support des comptes en fiducie ontariens dans le produit, à vérifier
  avant tout appel ontarien.
- Recalibrage des hypothèses de conversion après cinquante appels réels.
- La v3 n'a pas encore été relue par le CEO ni dite à voix haute.
