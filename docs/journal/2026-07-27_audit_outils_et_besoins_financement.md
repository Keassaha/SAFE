# 2026-07-27 · Audit des outils et besoins pour le financement

## Demande

Avant de déposer des demandes de financement : auditer les outils actuels, anticiper les
besoins futurs (outils IA à venir, embauche de professionnels), et traduire tout ça en
utilisation des fonds.

## Livrable

`docs/product/AUDIT_OUTILS_ET_BESOINS_FINANCEMENT.md`

## Ce que l'audit du dépôt a mesuré

- ~166 700 lignes de code (`app`, `lib`, `components`)
- 673 fichiers de test, Vitest
- SDK Anthropic branché sur 5 usages réels en production
- Stripe, Resend, Vercel Blob, Supabase, Prisma 6, Next 15, React 19

## Trous constatés, par ordre de risque

1. Aucune surveillance d'erreurs en production (pas de Sentry ni équivalent)
2. Aucune intégration continue (aucun workflow GitHub, les 673 tests ne tournent pas
   automatiquement)
3. Aucune mesure d'usage produit (pas d'analytique)
4. Restauration de sauvegarde jamais testée, à confirmer côté Supabase
5. Pas d'existence légale sous « SAFE » (déjà connu, bloque tout le financement)

Les points 1 à 3 coûtent presque rien et changent la catégorie de sérieux du dossier.

## Décisions et positions prises

- **Les trois vrais goulots sont la preuve, le temps du fondateur et la distribution.**
  Pas l'outillage. La liste d'abonnements ne doit donc pas porter le dossier.
- **Contractuels avant salariés**, et recrutement dans l'ordre des blocages :
  comptable fiscaliste d'abord, designer au premier financement, développeur à temps
  partiel seulement à la troisième cliente payante.
- **ElevenLabs, Seedance, Higgsfield classés en famille C** (distribution). ElevenLabs
  est le seul des trois avec un usage précis et défendable aujourd'hui : la voix off de
  la vidéo de démonstration de 3 minutes. Règle posée : un outil de génération média
  n'entre au budget que quand un actif précis est commandé.
- **Ne pas mettre la génération média en tête d'une demande de subvention.** Un
  conseiller lit alors un dossier de créateur de contenu, pas de logiciel.
- **Ne pas demander 75 000 $ avec une seule cliente à 150 $/mois.** Trois scénarios
  d'utilisation des fonds écrits : 9 500 $, 25 000 $, et 50 000 à 75 000 $ conditionné à
  une deuxième cliente signée.

## Budget d'outils

Trois paliers chiffrés : survie ~140 $/mois, crédible ~270 $/mois, financé ~655 $/mois.
Tous les montants sont marqués comme ordres de grandeur non vérifiés.

## Suite

Cinq actions, dont quatre non techniques : immatriculation sous le NEQ existant, rendez-vous
ID Gatineau (question précise sur l'admissibilité honoraires vs salaire), branchement
surveillance + CI, appel comptable fiscaliste, et les trois chiffres réels de Me Derisier.
