# SAFE Consultation Phase 2

Cette consultation vient apres l'audit gratuit. Son but n'est pas de refaire l'audit. Son but est de valider le bon niveau de standardisation avant activation.

## Role exact de la consultation

La consultation doit valider quatre choses:

1. le bundle recommande
2. les exceptions reelles
3. les integrations ou contraintes externes
4. les priorites de mise en service

## Ce que la consultation ne doit pas devenir

- une decouverte libre sans cadre
- une session de support general
- une reouverture complete de toutes les hypotheses deja captees par l'audit

## Inputs obligatoires

Avant la consultation, il faut deja avoir:

- l'audit structure
- le bundle recommande
- la liste des overrides possibles
- les triggers de custom proposes
- les zones incertaines a valider

## Agenda recommande

### Bloc 1. Validation du profil

- Avez-vous bien une pratique dominante dans `X` et `Y`?
- Votre province principale d'exercice est-elle bien `Z`?
- Votre equipe utilisatrice au quotidien sera bien `N` personnes?

### Bloc 2. Validation du bundle

- Le mode principal est-il bien `horaire`, `forfait` ou `mixte`?
- La logique de fiducie decrite correspond-elle a votre realite?
- Les modules proposes vous semblent-ils alignes avec votre maniere de travailler?

### Bloc 3. Exceptions

- Quelles differences vous semblent vraiment non negociables?
- Lesquelles sont juste des preferences d'interface ou d'affichage?
- Quelles parties de votre fonctionnement vous croyez uniques, mais ressemblent peut-etre a un standard?

### Bloc 4. Activation

- Quelles donnees migre-t-on en premier?
- Quels utilisateurs doivent etre actifs au jour 1?
- Quelles integrations sont bloquantes?
- Quels parcours doivent absolument marcher la premiere semaine?

## Sortie attendue

La consultation doit produire un paquet decisionnel simple:

```yaml
bundle_final: on-solo-real-estate-immigration-flat-fee
overrides_valides:
  - accepted_payment_methods
  - reminder_days
custom_items:
  - none
activation_priority:
  - trust_reconciliation
  - invoice_email
  - role_permissions
blocking_integrations:
  - resend
```

## Regle commerciale

La consultation doit reduire l'ambiguite, pas ouvrir un puits sans fond.

Si un cabinet veut sortir du standard sur un point qui touche:

- modele comptable
- logique de facturation
- conformite coeur
- workflow critique

alors il faut le qualifier en `custom facturable`, pas le faire glisser en silence dans le standard.
