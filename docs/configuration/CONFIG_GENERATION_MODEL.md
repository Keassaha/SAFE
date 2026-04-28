# SAFE Configuration Generation Model

Date de mise a jour: 2026-04-28

Ce document definit le modele du moteur `audit -> bundle -> configuration`.

## Objectif

A partir d'un audit structure, le moteur doit produire un paquet d'activation lisible, stable et executable.

Il ne doit pas "inventer un cabinet". Il doit:

1. choisir un bundle
2. appliquer les defaults du bundle
3. ajouter les overrides valides
4. remonter les ecarts hors standard
5. produire les artefacts d'activation

## Pipeline logique

```text
Audit brut
  -> profils derives
  -> bundle recommande
  -> validation consultation
  -> configuration finale
  -> artefacts d'activation
```

## Entites du modele

### 1. `AuditSnapshot`

Capture normalisee des reponses d'audit et des profils derives.

Contient:

- identite cabinet
- profils derives
- score de confiance
- flags de risque

### 2. `BundleDefinition`

Definition stable d'un bundle standard SAFE.

Contient:

- identite du bundle
- criteres d'eligibilite
- config par defaut
- artefacts requis
- overrides acceptables
- triggers de custom

### 3. `BundleRecommendation`

Resultat du moteur de mapping audit -> bundle.

Contient:

- bundle recommande
- score ou niveau de confiance
- raisons de recommandation
- alternatives proches
- overrides probables
- custom triggers detectes

### 4. `ConsultationDecision`

Decision finale apres consultation phase 2.

Contient:

- bundle final
- overrides valides
- items refuses
- custom items confirmes
- priorites d'activation

### 5. `CabinetConfigurationPackage`

Paquet final pret a appliquer au cabinet.

Contient:

- `cabinetInterfaceConfig`
- `cabinetConfig`
- `seedPlan`
- `activationChecklist`
- `integrationRequirements`
- `customBacklog`

## Sortie principale

Le coeur du moteur doit produire cette structure:

```ts
{
  auditSnapshot,
  bundleRecommendation,
  consultationDecision,
  configurationPackage
}
```

## Sous-paquets a produire

### A. `cabinetInterfaceConfig`

Equivalent cible de la table `CabinetInterface`.

Contient:

- `locale`
- `ongletsActifs`
- `ongletsMasques`
- `disciplines`
- `modules`
- `widgets`
- `checklistsParType`
- `modeFacturation`
- `conformite`

### B. `cabinetConfig`

Configuration plus generale du cabinet.

Contient:

- devise
- tauxInteret
- formatFacture
- envoiFactureClient

### C. `seedPlan`

Liste ordonnee des seeds a executer.

Exemples:

- checklists
- debours templates
- retention policies
- email templates
- forfait services

### D. `activationChecklist`

Checklist resumee issue du bundle et des integratons detectees.

### E. `integrationRequirements`

Liste des integrations requises, optionnelles ou bloquees.

Exemples:

- Resend
- Stripe
- DocuSign
- migration CSV

### F. `customBacklog`

Elements qui ne doivent pas etre glisses silencieusement dans le standard.

## Regles de conception

1. Le modele doit etre serialisable en JSON.
2. Chaque sortie doit pouvoir etre revue humainement.
3. Les items `custom` doivent etre explicitement separes du standard.
4. La configuration finale doit rester diffable entre deux versions d'un meme cabinet.
5. Le moteur doit pouvoir etre rejoue apres un audit corrige.
