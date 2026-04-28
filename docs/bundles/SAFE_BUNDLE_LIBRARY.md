# SAFE Bundle Library

Date de mise a jour: 2026-04-28

Cette bibliotheque pose les premiers bundles standards SAFE a partir de la structure actuelle du produit et des patterns deja documentes dans `Delivery Syst`.

## Principe

On ne construit pas un cabinet a partir de zero.
On choisit d'abord le bundle le plus proche, puis on applique:

1. le standard du bundle
2. quelques overrides toleres
3. du custom seulement si le cabinet sort du cadre

## Bundles actifs

### 1. `on-solo-real-estate-immigration-flat-fee`

Profil:

- Ontario
- 1 avocat ou 1 avocat + 1 assistant
- immobilier residentiel + immigration
- facturation forfaitaire
- exigences LSO + FINTRAC + PIPEDA

Configuration canonique:

- `locale`: `en`
- `disciplines`: `["immobilier", "immigration"]`
- `ongletsActifs`: `["tableau-de-bord", "clients", "dossiers", "facturation", "comptes", "documents", "conformite", "parametres"]`
- `ongletsMasques`: `["temps", "fiches-de-temps", "employees", "rapports-comptables"]`
- `modules.facturation.principal`: `forfait`
- `modules.facturation.periodeFact`: `bimonthly`
- `modules.fideicommis.regle`: `bylaw9-lso`
- `modules.fintrac.actif`: `true`
- `modules.pipeda.actif`: `true`

Activation pack:

- seeds immobilier Ontario
- seeds immigration
- retention policies ON
- email templates EN
- trust reconciliation workflow

Overrides toleres:

- jours de relance
- moyens de paiement acceptes
- widgets dashboard
- segmentation plus fine des sous-types immobiliers

Sortie en custom si:

- plusieurs bureaux
- facturation mixte par dossier
- workflow Teraview ou IRCC trop specifique pour le standard

### 2. `qc-solo-family-flat-fee`

Profil:

- Quebec
- solo ou solo + assistant
- pratique principalement familiale
- facturation surtout au forfait
- forte intensite documentaire et relation client

Configuration canonique:

- `locale`: `fr`
- `disciplines`: `["famille"]`
- `ongletsActifs`: `["tableau-de-bord", "clients", "dossiers", "facturation", "documents", "conformite", "parametres"]`
- `ongletsMasques`: `["employees"]`
- `modules.facturation.principal`: `forfait`
- `conformite.verif_conflits`: `true`
- `conformite.loi25`: `true`

Activation pack:

- checklists familial
- templates engagement, correspondance, cloture
- retention familiale Quebec
- dashboard de suivi dossiers et mandats

Overrides toleres:

- affichage ou non du temps interne
- montant et cadence de pre-paiement
- granularite des etapes dossier

Sortie en custom si:

- aide juridique dominante
- forte part de litige complexe avec facturation hybride

### 3. `qc-small-business-hourly`

Profil:

- Quebec
- 1 a 3 avocats
- pratique affaires / contrats / conseil
- facturation majoritairement horaire

Configuration canonique:

- `locale`: `fr`
- `disciplines`: `["affaires"]`
- `ongletsActifs`: `["tableau-de-bord", "clients", "dossiers", "temps", "facturation", "documents", "rapports", "parametres"]`
- `ongletsMasques`: `[]`
- `modules.facturation.principal`: `horaire`
- `modeFacturation.principal`: `horaire`

Activation pack:

- taux horaires par avocat
- time tracking visible
- rapports revenus par client et avocat
- templates de facture horaire

Overrides toleres:

- plafonds par dossier
- remises client
- niveau de detail de facture

Sortie en custom si:

- retainer mensuel structure
- success fee
- reconnaissance de revenu avancee

### 4. `qc-hybrid-multi-practice-small-firm`

Profil:

- Quebec
- 2 a 4 avocats
- pratiques mixtes: familial, affaires, travail ou autre combinaison proche
- plusieurs styles de facturation selon le dossier

Configuration canonique:

- `locale`: `fr`
- `disciplines`: `["famille", "affaires", "travail"]`
- `ongletsActifs`: `["tableau-de-bord", "clients", "dossiers", "temps", "facturation", "documents", "rapports", "parametres"]`
- `modules.facturation.principal`: `mixte`
- `modeFacturation.principal`: `mixte`
- tagging obligatoire du domaine par dossier

Activation pack:

- regles de facturation par domaine
- tagging domaine au dossier
- rapports par domaine
- templates differencies selon pratique

Overrides toleres:

- ajout ou retrait d'un domaine
- affichage de widgets lies a un domaine
- niveau de detail des permissions assistant/bookkeeper

Sortie en custom si:

- plus de trois logiques de facturation incompatibles
- governance multi-equipes trop differenciee
- demandes fortes de workflow inter-domaine non supporte

### 5. `on-immigration-boutique-stage-billing`

Profil:

- Ontario
- boutique immigration
- dossiers longs et etapes IRCC
- facturation par etapes ou forfait progressif

Configuration canonique:

- `locale`: `en`
- `disciplines`: `["immigration"]`
- `ongletsActifs`: `["tableau-de-bord", "clients", "dossiers", "facturation", "documents", "conformite", "parametres"]`
- `modules.facturation.principal`: `forfait`
- `modules.facturation.stageBilling`: `true`
- `modules.pipeda.actif`: `true`

Activation pack:

- checklists immigration
- templates mandat immigration et IMM 5476
- suivi des expirations documentaires
- alertes deadlines IRCC

Overrides toleres:

- langue FR/EN
- types de dossiers immigration actifs
- cadence de relance

Sortie en custom si:

- forte dependance a des plateformes externes specialisees
- logique de billing conditionnelle complexe par programme

### 6. `qc-generalist-foundation-hourly`

Profil:

- petit cabinet generaliste
- Quebec
- peu structure technologiquement
- besoin d'une base simple avant specialisation

Configuration canonique:

- `locale`: `fr`
- `disciplines`: `["generaliste"]`
- `ongletsActifs`: `["tableau-de-bord", "clients", "dossiers", "temps", "facturation", "documents", "parametres"]`
- `modules.facturation.principal`: `horaire`
- `modeFacturation.principal`: `horaire`

Activation pack:

- setup de base clients / dossiers / temps / factures
- templates generiques
- permissioning simple
- dashboard de pilotage essentiel

Overrides toleres:

- specialisation progressive vers un domaine
- ajout d'un module conformite specifique
- masquage de modules secondaires

Sortie en custom si:

- heterogeneite tres forte des pratiques
- attentes avancees de reporting ou fiducie

## Bundles a ne pas standardiser tout de suite

Ces categories restent trop couteuses ou trop peu stabilisees pour devenir des bundles standards immediats:

- contingency-heavy litigation
- aide juridique dominante
- workflows notariaux tres specifiques
- cabinets multi-bureaux avec gouvernance differenciee
- cabinets qui veulent leur propre logique comptable hors SAFE

## Regle d'utilisation

Quand un cabinet arrive:

1. choisir le bundle le plus proche
2. mesurer l'ecart reel
3. rester en standard si l'ecart est faible
4. utiliser des overrides si l'ecart est moyen
5. sortir en custom si l'ecart touche la logique coeur

Le but est d'eviter que chaque cabinet devienne un mini-produit.
