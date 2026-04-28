# SAFE Audit Schema Canonique

Date de mise a jour: 2026-04-28

Ce document definit la structure cible de l'audit SAFE. Son role n'est pas seulement de generer un rapport ou un lead qualifie. Il doit produire une sortie assez structuree pour:

1. classer un cabinet
2. recommander un bundle
3. detecter les overrides toleres
4. detecter les triggers de custom
5. preparer la consultation de validation

## Objectif principal

L'audit doit repondre a une question simple:

`Quel bundle SAFE convient a ce cabinet, avec quel niveau d'ecart?`

## Sorties obligatoires

Chaque audit complete doit permettre de produire:

- `cabinet_profile`
- `practice_profile`
- `billing_profile`
- `compliance_profile`
- `operations_profile`
- `migration_profile`
- `recommended_bundle_id`
- `recommended_overrides`
- `custom_triggers`
- `consultation_topics`

## Les 8 blocs canoniques

### 1. Identite du cabinet

But:

- identifier le prospect
- situer le cadre legal principal
- capter la surface de configuration de base

Champs minimaux:

- raison sociale
- ville
- province
- forme juridique
- nom du contact principal
- titre du contact principal
- email
- telephone
- site web

Sorties derivees:

- `jurisdiction_primary`
- `locale_default`
- `contact_role`

### 2. Structure d'equipe

But:

- qualifier le niveau de delegation
- estimer le nombre de comptes et de permissions
- comprendre qui utilisera SAFE au quotidien

Champs minimaux:

- nombre d'utilisateurs
- presence d'adjoint
- presence de parajuriste
- presence de bookkeeper ou CPA
- utilisateur principal de SAFE
- aisance technologique de l'equipe

Sorties derivees:

- `team_size_band`
- `delegation_level`
- `primary_operator`
- `training_risk_level`

### 3. Profil de pratique

But:

- identifier les domaines dominants
- comprendre la complexite du portefeuille
- preparer la recommandation de bundle

Champs minimaux:

- domaines de pratique
- type de clientele
- langues de service
- nombre de dossiers actifs
- nouveaux dossiers par mois
- tendance de croissance

Sorties derivees:

- `practice_mix`
- `client_mix`
- `volume_band`
- `growth_stage`

### 4. Profil de facturation

But:

- detecter la logique economique du cabinet
- savoir si on reste dans le standard SAFE

Champs minimaux:

- mode principal de facturation
- existence d'un mode secondaire
- taux horaire si applicable
- logique forfaitaire si applicable
- frequence de facturation
- delai moyen de paiement
- type de moyens de paiement

Sorties derivees:

- `billing_primary`
- `billing_secondary`
- `billing_complexity_level`
- `cash_collection_risk`

### 5. Profil fiducie et conformite

But:

- capter les obligations les plus sensibles
- detecter les bundles conformite-heavy

Champs minimaux:

- usage du compte en fideicommis
- intensite d'utilisation
- frequence de reconciliation
- historique de probleme ou audit
- aide juridique oui/non
- besoins FINTRAC, PIPEDA, Loi 25 ou equivalent

Sorties derivees:

- `trust_required`
- `trust_regime`
- `trust_risk_level`
- `compliance_flags`

### 6. Profil operationnel

But:

- identifier les douleurs structurelles
- comprendre ou SAFE doit creer de la valeur rapidement

Champs minimaux:

- qui gere la facturation
- qui gere la fiducie
- heures admin non facturables
- visibilite sur les creances
- frustrations principales
- une automation revee

Sorties derivees:

- `ops_bottlenecks`
- `admin_load_level`
- `ar_visibility_level`
- `automation_priority`

### 7. Profil outils et migration

But:

- preparer la difficulte de migration
- capter la concurrence reelle

Champs minimaux:

- logiciel principal actuel
- niveau de satisfaction
- donnees a migrer
- format des donnees
- appareil principal

Sorties derivees:

- `incumbent_stack`
- `migration_complexity`
- `switch_readiness`

### 8. Priorite business et intention

But:

- distinguer curiosite et urgence reelle
- preparer la consultation

Champs minimaux:

- niveau d'urgence
- delai souhaite
- priorites top 3
- message libre

Sorties derivees:

- `urgency_level`
- `go_live_window`
- `sales_readiness`

## Profils derives a calculer

L'audit ne doit pas s'arreter aux reponses brutes. Il doit calculer:

### `cabinet_profile`

- `jurisdiction_primary`
- `team_size_band`
- `locale_default`
- `growth_stage`

### `practice_profile`

- `primary_practices`
- `secondary_practices`
- `practice_mix_type`

Valeurs types:

- `single_specialty`
- `dual_specialty`
- `hybrid_multi_practice`

### `billing_profile`

- `billing_primary`
- `billing_secondary`
- `billing_complexity_level`

Valeurs types:

- `simple_hourly`
- `simple_flat_fee`
- `mixed_standard`
- `advanced_custom`

### `compliance_profile`

- `trust_required`
- `trust_regime`
- `privacy_regime`
- `special_regimes`

### `operations_profile`

- `admin_load_level`
- `delegation_level`
- `tooling_maturity`
- `migration_complexity`

## Regle de conception

Une question ne doit rester dans l'audit que si elle aide au moins une des quatre choses suivantes:

1. choisir un bundle
2. calibrer un override
3. detecter un custom trigger
4. preparer la consultation

Si elle ne sert qu'a faire joli dans le rapport, elle doit etre retiree ou passee en optionnel.
