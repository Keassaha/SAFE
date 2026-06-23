# SAFE Lead — Brief produit v1

Date : 2026-06-21

## Intention

SAFE Lead est la surface de génération et qualification de leads chauds pour cabinets d'avocats. Elle vit en parallèle de l'application principale, dans la Console SAFE Inc., et s'appuie d'abord sur les modèles CRM existants : `Lead`, `LeadContact`, `Activity`, `Task`, `Campaign`, `LeadMagnet` et `LeadMagnetConsumption`.

## Frontière v1

- Générer : rendre visibles les sources qui créent des opportunités qualifiées.
- Qualifier : prioriser les cabinets selon fit firmographique, engagement et enrichissement.
- Relancer : exposer les leads chauds sans activité récente.
- Convertir : pousser vers audit, consultation Phase 2, signature, puis activation.

## Hors périmètre immédiat

- Pas de nouveau schéma Prisma tant que les signaux v1 ne sont pas stabilisés.
- Pas d'automatisation d'envoi de messages sans validation humaine.
- Pas de scoring IA opaque : les composantes du score doivent rester explicables.

## Définition d'un lead chaud

Un lead est chaud lorsqu'il combine :

- un score total de 70 ou plus, ou un signal d'intention fort ;
- un cabinet compatible avec SAFE : province cible, taille exploitable, domaine pertinent ;
- une prochaine action claire : relance, audit, consultation, proposition.

## Route préparée

La première interface est disponible dans la Console SAFE Inc. :

- `/console/safe-lead`

Elle est volontairement construite sur les données CRM existantes pour permettre l'itération produit avant d'ajouter une couche d'automatisation.
