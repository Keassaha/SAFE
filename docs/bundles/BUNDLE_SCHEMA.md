# SAFE Bundle Schema

Ce document definit la forme attendue d'un bundle standard SAFE.

## Role d'un bundle

Un bundle est un preset de configuration pour un type de cabinet recurrent.
Il ne contient pas de code custom. Il assemble du standard SAFE avec:

- navigation
- disciplines
- mode de facturation
- conformite
- documents
- widgets
- automatisations
- seeds a lancer

## Identite minimale

Chaque bundle doit avoir:

- `bundle_id`
- `label`
- `version`
- `status`
- `target_profile`
- `eligibility_rules`
- `default_config`
- `activation_pack`
- `allowed_overrides`
- `custom_triggers`

## Structure logique

```yaml
bundle_id: on-solo-real-estate-immigration-flat-fee
label: Solo ON - Real Estate + Immigration - Flat Fee
version: 1
status: active

target_profile:
  provinces: [ON]
  team_size: [solo-plus-assistant]
  practices: [immobilier, immigration]
  billing_models: [forfait]

eligibility_rules:
  required:
    - province = ON
    - practices subset of [immobilier, immigration]
    - billing principal = forfait
  preferred:
    - trust_account = true
    - language = en
  excluded:
    - contingency fee required
    - multi-office firm

default_config:
  locale: en
  ongletsActifs: []
  ongletsMasques: []
  disciplines: []
  modeFacturation: {}
  modules: {}
  conformite: {}
  widgets: []

activation_pack:
  seeds: []
  required_documents: []
  required_integrations: []
  critical_user_journeys: []

allowed_overrides:
  - reminder_days
  - accepted_payment_methods
  - dashboard_widgets

custom_triggers:
  - mixed billing per dossier with complex revenue recognition
  - province-specific legal workflow not covered by SAFE
```

## Regles de conception

1. Un bundle doit couvrir un pattern repetable, pas un cabinet unique.
2. Un bundle doit rester simple a activer en moins d'une journee de configuration.
3. Un bundle ne doit pas masquer une vraie dette produit.
4. Si un ecart revient chez plusieurs cabinets, il faut enrichir le bundle ou creer un nouveau bundle.
5. Si un ecart est rare et couteux, il doit sortir en custom facturable.

## Sorties attendues plus tard

Ce schema est d'abord documentaire. Il pourra ensuite etre traduit en:

- JSON de recommendation issu de l'audit
- seed d'activation
- configuration `CabinetInterface`
- checklist Delivery pre-remplie
