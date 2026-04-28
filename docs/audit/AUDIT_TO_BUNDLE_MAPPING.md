# SAFE Audit -> Bundle Mapping

Ce document definit comment les reponses d'audit doivent alimenter la recommandation de bundle.

## Logique de sortie

L'algorithme n'a pas besoin d'etre "intelligent" au sens vague. Il doit etre lisible et deterministic:

1. extraire les dimensions cle
2. filtrer les bundles eligibles
3. scorer les bundles restants
4. produire:
   - un bundle recommande
   - des overrides proposes
   - des triggers de custom

## Dimensions decisives

### A. Juridiction

Questions source:

- province

Impact:

- filtre les bundles par province
- determine le regime principal de conformite

### B. Structure de pratique

Questions source:

- domaines de pratique
- type de clientele
- langues
- volume de dossiers

Impact:

- choisit entre specialisation, dualite, hybride

### C. Facturation

Questions source:

- mode principal de facturation
- taux horaire
- logique forfaitaire
- frequence

Impact:

- choisit entre `horaire`, `forfait`, `mixte`
- detecte les cas qui sortent en custom

### D. Fiducie et conformite

Questions source:

- fideicommis_usage
- gestion_fideicommis
- aide_juridique
- auditIssues ou equivalent

Impact:

- active les bundles conformite lourde
- detecte les obligations critiques

### E. Structure d'equipe

Questions source:

- nb_utilisateurs
- adjoint_statut
- comptable_statut
- utilisateur_principal

Impact:

- refine la variante du bundle
- prepare les permissions et la formation

## Mapping initial vers les bundles actuels

### Bundle `on-solo-real-estate-immigration-flat-fee`

Conditions fortes:

- province = `ON`
- domaines dominants contiennent `immobilier` et/ou `immigration`
- mode principal = `forfait`
- fideicommis = `actif` ou `peu` ou besoin imminent
- taille equipe = `1` ou `2`

Overrides typiques:

- langue `fr` en plus de `en`
- moyens de paiement
- relances

Custom triggers:

- billing mixte complexe
- workflow immobilier externe trop specifique

### Bundle `qc-solo-family-flat-fee`

Conditions fortes:

- province = `QC`
- domaine dominant = `famille`
- mode principal = `forfait`
- petite equipe

Custom triggers:

- aide juridique reguliere
- forte part de litige hors standard

### Bundle `qc-small-business-hourly`

Conditions fortes:

- province = `QC`
- domaine dominant = `affaires` ou `corporatif`
- mode principal = `horaire`
- besoin de time tracking visible

Custom triggers:

- retainer structure
- revenue recognition avancee

### Bundle `qc-hybrid-multi-practice-small-firm`

Conditions fortes:

- province = `QC`
- 2+ domaines distincts
- mode `mixte` ou realite de plusieurs styles selon dossier

Custom triggers:

- trop de logiques incompatibles
- governance equipe tres atypique

### Bundle `on-immigration-boutique-stage-billing`

Conditions fortes:

- province = `ON`
- domaine dominant = `immigration`
- facturation par etapes ou forfait progressif

Custom triggers:

- dependance forte a un outil immigration tiers

### Bundle `qc-generalist-foundation-hourly`

Conditions fortes:

- province = `QC`
- cabinet peu structure
- pratique generaliste
- mode horaire ou flou

Custom triggers:

- portefeuille trop heterogene
- attentes conformite/fiducie avancees

## Sortie minimale de l'algorithme

```json
{
  "recommended_bundle_id": "on-solo-real-estate-immigration-flat-fee",
  "confidence": "high",
  "why": [
    "Province Ontario",
    "Pratiques dominantes immobilier + immigration",
    "Facturation forfaitaire",
    "Petite equipe"
  ],
  "recommended_overrides": [
    "accepted_payment_methods",
    "dashboard_widgets"
  ],
  "custom_triggers": [],
  "consultation_topics": [
    "validation du workflow immobilier",
    "strategie de relance",
    "roles assistant"
  ]
}
```

## Regle de prudence

Quand le mapping hesite entre deux bundles:

- ne pas inventer un nouveau bundle trop vite
- remonter les deux options en consultation
- demander quelle logique domine vraiment: pratique, billing ou conformite
