# SAFE Configuration Artifacts

Ce document liste les artefacts que le moteur de configuration doit produire apres validation.

## Artefacts obligatoires

### 1. Recommendation artifact

Usage:

- lecture interne
- support a la consultation

Contient:

- bundle recommande
- raisons
- overrides proposes
- triggers de custom

### 2. Final configuration artifact

Usage:

- application technique
- reference de verite du cabinet

Contient:

- JSON `CabinetInterface`
- JSON `CabinetConfig`
- metadonnees bundle
- version de configuration

### 3. Seed execution plan

Usage:

- execution ordonnee des seeds
- validation de l'activation

Contient:

- seed id
- ordre
- parametres
- statut attendu

### 4. Activation checklist

Usage:

- deployment client
- suivi jour 1 a jour 30

Contient:

- environnement
- utilisateurs
- permissions
- integrations
- parcours critiques

### 5. Custom backlog

Usage:

- separer ce qui est dans le standard de ce qui doit etre facture ou planifie a part

Contient:

- item
- raison
- impact
- priorite

## Versionnement recommande

Chaque configuration finale devrait idealement avoir:

- `bundle_id`
- `bundle_version`
- `config_version`
- `generated_at`
- `generated_from_audit_id`

## Regle pratique

Si un artefact n'aide ni a activer ni a gouverner le cabinet, il ne doit pas etre genere par defaut.
