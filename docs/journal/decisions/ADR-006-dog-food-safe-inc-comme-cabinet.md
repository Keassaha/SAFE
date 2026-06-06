# ADR-006 — Dog food : SAFE Inc. devient un cabinet client de SAFE

- **Date** : 2026-06-05
- **Statut** : Accepté
- **Lien spec** : `docs/product/CRM_SPEC_v1.md` (v1.1)

## Contexte

Le CEO veut une console de pilotage qui inclut compta et facturation de SAFE Inc. lui-même. Trois options :

1. Construire un module compta dédié dans la console (+4-6 semaines)
2. Utiliser un outil externe (Wave, QuickBooks)
3. **Faire de SAFE Inc. un cabinet client de SAFE** (dog food)

## Décision

SAFE Inc. devient un cabinet client de son propre produit. Le CEO utilise SAFE comme n'importe quel cabinet d'avocats client pour sa compta, ses dépenses, sa facturation aux clients SAFE.

## Justification

- **Effort divisé par 5** : zéro ligne de code à écrire pour compta + facturation (déjà dans SAFE)
- **QA permanent** : le founder utilise son produit chaque jour, détection de bugs en temps réel
- **Crédibilité maximale** pour le case study J+90 : « j'utilise SAFE pour gérer SAFE »
- **Cohérence stratégique** : on prouve que le produit fonctionne pour un vrai business
- **Pédagogie** : chaque friction rencontrée devient une idée d'amélioration produit

## Conséquences

**Positives** :
- Pas de double maintenance d'un module compta dédié
- Founder = utilisateur numéro 1
- Contenu LinkedIn naturel (« voici comment j'ai facturé via SAFE aujourd'hui »)
- Le `Cabinet SAFE Inc.` est aussi le premier cabinet en preview/test pour les nouvelles features

**Négatives** :
- SAFE doit être suffisamment mature pour gérer une entreprise réelle (en cours)
- Certaines spécificités SAFE Inc. (SaaS, abonnements récurrents, Stripe Connect pour clients cabinets) peuvent ne pas être 100% nativement supportées
- Risque mélange visuel : dans la console, on voit le cabinet SAFE Inc. comme un client parmi d'autres

## Implications techniques

- Créer un `Cabinet` avec `raisonSociale = "SAFE Inc."` en production
- Provisionner les `User` (CEO admin_cabinet)
- Activer modules : Facturation, Comptabilité, Documents
- Pas activer modules : Fidéicommis (pas pertinent), Conflict check (pas pertinent)
- Configurer Stripe pour recevoir paiements clients SAFE
- Modèle TVQ/TPS Québec à valider

## Alternatives rejetées

- **Module compta dédié dans la console** : +4-6 semaines, double maintenance, perte crédibilité
- **Outil externe (Wave, QuickBooks)** : zéro intégration, perte dog food, sortie de l'écosystème SAFE
