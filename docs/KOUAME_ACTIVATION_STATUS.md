# Kouame Avocat — Activation Status

Date de mise a jour: 2026-05-08

Ce fichier suit l'etat reel de l'activation Kouame Avocat depuis le repo produit. Le brief detaille reste dans `docs/configuration/RUTH_KOUAME_ACTIVATION_BRIEF.md`. Ce resume permet de savoir immediatement ou en est le cabinet.

L'interface produit reste IDENTIQUE a celle deployee pour Derisier Law: meme sidebar, meme tableau de bord, memes composants, meme densite. Seule la configuration cliente change.

## Statut global

`config-ready-pending-activation`

Les seeds, l'identite cabinet et la configuration `CabinetInterface` sont en place dans le repo. L'activation n'est pas fermee tant que les seeds n'ont pas ete executes en production, que les utilisateurs n'ont pas ete invites et que les parcours critiques n'ont pas ete valides sur l'environnement cible.

## Profil cabinet

- Nom: Kouame Avocat
- Avocate principale: Me Ruth-Esther Kouame
- Province: Quebec
- Profil: avocate solo — pas d'assistante humaine
- Score d'audit global: 43/100 (niveau Debutant)
- Perte mensuelle estimee: 5 875 $/mois
- Point fort confirme: convention de mandat systematique

## Priorites d'activation (ordre d'execution)

1. Fideicommis et conciliation mensuelle — audit 12/100, critique
2. Conformite Loi 25 — audit 20/100, critique
3. Centre de commandement cabinet — operations 30/100, critique
4. File assistante / assistant SAFE — feature SAFE virtuelle (pas d'humain, cabinet solo)
5. Planificateur juridique
6. Facturation et recouvrement — audit 56/100
7. Gestion structuree des dossiers — audit 48/100
8. Bibliotheque documentaire et retention

## Ce qui est confirme cote repo

- Seed cabinet et utilisateurs: `lib/seeds/create-kouame-cabinet.ts`
- Onboarding (CabinetInterface + debours QC): `lib/seeds/onboard-kouame.ts`
- Brief d'activation: `docs/configuration/RUTH_KOUAME_ACTIVATION_BRIEF.md`
- Configuration cliente alignee sur le profil Quebec: mode mixte horaire/forfait, fiducie Barreau QC, Loi 25, taxes TPS/TVQ
- Reuse complet de l'interface Derisier — aucune nouvelle surface, aucun nouveau composant

## Ce qui reste externe au repo

- Confirmation URL de production et projet Supabase
- Execution des seeds sur la base cible (`create-kouame-cabinet.ts` puis `onboard-kouame.ts`)
- Application du JSON `CabinetInterface` en production
- Invitation de Me Ruth-Esther Kouame et verification des permissions admin_cabinet (cabinet solo — un seul utilisateur)
- Configuration Resend pour les emails sortants
- Configuration des integrations bancaires pour la conciliation 3-way fideicommis
- Validation des parcours critiques sur l'environnement Kouame
- Designation officielle du responsable PRP (Loi 25) et registre d'incidents initialise

## Condition de sortie

On pourra considerer Kouame Avocat "active" quand les conditions suivantes seront remplies:

1. Les seeds `create-kouame-cabinet.ts` et `onboard-kouame.ts` ont ete executes sur l'environnement cible.
2. Les soldes fideicommis par client/dossier ont ete importes et la premiere conciliation mensuelle est certifiee.
3. La politique Loi 25 est documentee, le responsable PRP est designe et le registre d'incidents est initialise.
4. Les parcours critiques (ouverture de dossier, fideicommis, facturation et recouvrement, agenda) ont ete testes sur l'environnement cible.
5. Le statut du present fichier passe a `operational`.

## Identifiants par defaut (developpement uniquement)

A regenerer obligatoirement avant la mise en production.

- Cabinet id: `kouame-avocat-qc-2026`
- Avocate (seul utilisateur): `info@kouameavocat.ca` / `Kouame2026`
