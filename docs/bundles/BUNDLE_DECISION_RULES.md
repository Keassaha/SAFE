# SAFE Bundle Decision Rules

Ce document aide a decider si un cabinet entre dans un bundle standard, dans un bundle + overrides, ou dans un build custom.

## Lecture rapide

- `standard`: le bundle couvre l'essentiel sans friction majeure
- `standard_plus_overrides`: le bundle convient mais demande quelques ajustements toleres
- `custom`: le cabinet sort du cadre et impose un traitement specifique

## Decision en 5 questions

### 1. Province

Le cabinet opere-t-il dans une province deja couverte proprement par le bundle?

- oui: continuer
- non: custom ou nouveau bundle

### 2. Domaine de pratique

Les pratiques principales du cabinet sont-elles incluses dans un bundle deja pense pour elles?

- oui: continuer
- partiellement: standard + overrides
- non: custom ou nouveau bundle

### 3. Mode de facturation

Le mode principal de facturation est-il couvert nativement?

- horaire standard: compatible
- forfait simple: compatible
- mixte raisonnable par dossier: compatible avec bundle hybride
- contingency, retainer complexe, success fee, aide juridique dominante: plutot custom

### 4. Conformite

Les obligations critiques sont-elles deja connues et configurees par SAFE?

- oui: continuer
- partiellement: standard + overrides
- non: custom ou nouveau bundle

### 5. Intensite des exceptions

Combien d'exceptions vraies restent apres choix du meilleur bundle?

- 0 a 3 exceptions faibles: standard
- 4 a 8 exceptions faibles ou moyennes: standard + overrides
- exceptions qui touchent moteur comptable, permissions coeur ou workflow critique: custom

## Overrides acceptables

Exemples d'overrides qui ne doivent pas faire sortir du standard:

- nombre de jours de relance
- widgets dashboard
- moyens de paiement acceptes
- masquage d'onglets
- ordre des checklists
- templates documentaires d'un domaine deja supporte

## Triggers de custom

Exemples de triggers qui doivent forcer une revue custom:

- plusieurs provinces actives dans le meme cabinet avec logiques non harmonisees
- exigences comptables qui contredisent le pipeline SAFE
- workflow documentaire legalement sensible non encore modele
- permissions tres atypiques par equipe
- tarification a plusieurs dimensions non supportees par les modes existants

## Regle business

Un cabinet ne devient pas custom parce qu'il se croit unique.
Il devient custom quand son ecart change vraiment:

- le modele de donnees
- le moteur de facturation
- le moteur de conformite
- le workflow coeur

Sinon, il doit etre absorbe par un bundle.
