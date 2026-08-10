# 2026-07-30 — Cahier des charges du CRM intelligent

## Demande

Le CEO demande un cahier des charges complet pour transformer le CRM en système
intelligent couvrant tout le cycle de prospection : 25 livrables, modèle de données
complet, agents, apprentissage, conformité canadienne, roadmap en trois phases.

## Ce qui a été produit

[docs/product/CAHIER_DES_CHARGES_CRM_INTELLIGENT.md](../product/CAHIER_DES_CHARGES_CRM_INTELLIGENT.md),
1900 lignes, les 25 livrables demandés.

## Trois partis pris de rédaction

**Delta, pas page blanche.** Le schéma compte 96 modèles dont 20 dans la zone CRM. Chacune
des 35 tables demandées est classée : existe, à étendre, à créer, ou à ne pas créer avec
justification. Sept tables demandées ont été refusées comme sur-ingénierie à ce stade
(`pipelines`, `pipeline_stages`, `notes`, `reminders`, `roles`, `permissions`, et
l'éclatement de `emails`/`messages`/`calls`/`meetings` en quatre tables au lieu d'une).

**Sources officielles vérifiées, incertitudes marquées.** La section conformité s'appuie
sur des pages consultées le jour même (CRTC, CPVP, CAI), avec citations exactes. Trois
points sont marqués `⚠️ À VÉRIFIER` plutôt qu'affirmés, dont un déterminant : la loi
québécoise comporte-t-elle une exclusion des coordonnées d'affaires équivalente à celle de
la LPRPDE ? La majorité des prospects étant québécois, la réponse change ce que le CRM peut
stocker. Recommandation en attendant : régime le plus strict.

**Avis contraire donné, pas gardé.** La section 21 dit explicitement que la moitié des
fonctionnalités demandées coûtera plus qu'elle ne rapportera au volume actuel, et liste six
lots comme MVP réel. La section 25.4 nomme le risque principal : construire le CRM au lieu
de vendre. Un garde-fou est proposé, à accepter ou refuser explicitement.

## Découvertes en cours de rédaction

- `ANTHROPIC_API_KEY` **est présente** dans `.env.local`. La note en mémoire qui la disait
  bloquante était périmée. Quatre capacités IA tournent déjà en production.
- `ConsentLog` existe mais est rattaché à `Client`, pas à `LeadContact`. Il ne peut donc pas
  servir au consentement CRM. Une table `ContactConsent` est nécessaire, en P0.
- `CalendarEvent`, `RichDocument`, `AuditLog` existent et sont réutilisables plutôt que
  d'être recréés.

## MVP réel proposé, dans l'ordre

1. Conversion Lead → Cabinet, seul lot vraiment bloquant
2. Consentement tracé + adresse postale LCAP
3. Extraction de tâches depuis les notes, la demande centrale
4. Webhooks Resend, sans mesure tout le reste est de l'opinion
5. Import CSV et dédoublonnage
6. Garde de sécurité et premiers tests

Non retenus pour maintenant : séquences, prévisions, apprentissage statistique,
`Opportunity`, pipeline configurable, permissions granulaires, N3 externe, LinkedIn.

## En attente de décision CEO

- Validation du cahier des charges avant tout build (règle du repo : pas de build sans spec
  validée)
- Acceptation ou refus du garde-fou de la section 25.4
- Arbitrage sur le correctif du scoring d'engagement : écrire les tables manquantes (A) ou
  recalibrer sur le mesurable (B). Recommandation : B maintenant, A en phase 2
