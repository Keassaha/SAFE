# Spec — Onboarding in-app qui persiste

> Statut : **DRAFT**, en attente validation CEO. Route vers 10/10, P1 (bloqueur self-serve).
> État actuel confirmé par cartographie du code (2026-07-04).

## Problème

Un cabinet inconnu qui s'inscrit seul ne peut pas réussir sans accompagnement. L'audit
maturité (2026-07-02) a identifié le bloqueur **B1** : le formulaire d'onboarding in-app
« ne persiste rien ». Aujourd'hui, un cabinet fonctionnel (province, mode de taxe, nom,
n° de Barreau, forfaits, débours, taxonomie) n'est configuré que par des **scripts de seed**
(`rebuild-derisier-from-audit.mjs`). Un cabinet neuf tombe sur des tableaux vides, une
checklist « Pour commencer » figée à 0/5, et aucune config appliquée.

C'est LE dernier gros bloqueur pour passer de « pilote accompagné » à « produit autonome ».

## Objectif

Un onboarding in-app qui, une fois complété, **persiste une configuration fonctionnelle**
et rend le cabinet immédiatement utilisable : facturation avec les bonnes taxes, conformité
province-aware, formulaires branchés. Le tout sans script.

## État actuel (confirmé)

- **Le formulaire d'onboarding existe mais est masqué** (`app/onboarding/page.tsx`, caché
  depuis décision CEO 2026-06-22, redirige vers le dashboard).
- **`/api/onboarding` (POST)** reçoit les données d'audit, calcule un plan, et **envoie des
  courriels (admin + client) SANS AUCUNE écriture en base**. C'est le bloqueur B1 : rien
  n'est persisté.
- **La checklist « Pour commencer »** (`app/(app)/tableau-de-bord/page.tsx:472-490`) est
  **déjà vivante** : l'avancement est dérivé des données réelles (config présente ? clients > 0 ?
  dossiers > 0 ? heures > 0 ? factures > 0 ?). Le Lot 2 ci-dessous est donc en grande partie
  DÉJÀ FAIT ; il manque juste que l'étape 1 (config cabinet) puisse se compléter.
- **Page Paramètres → Cabinet** (`app/(app)/parametres/cabinet/page.tsx`) persiste nom,
  adresse, email, téléphone, barreauNumero. **Mais PAS la province, ni le mode de taxe, ni les
  disciplines.** Incomplet pour rendre un cabinet fonctionnel.
- **Briques déjà présentes à réutiliser** : `lib/onboarding/types.ts` (`OnboardingData` :
  province, hasTrustAccount, billingMethod…), `lib/onboarding/calculator.ts`,
  `lib/onboarding/taxes.ts` (dérivation province → mode de taxe), `lib/cabinet-config.ts`
  (`parseCabinetConfig`), et le pattern d'upsert idempotent de `lib/seeds/onboard-derisier.ts`
  (référence de ce qu'il faut écrire : `CabinetInterface`, `DeboursType`, `DeboursTemplate`).
- **Ce qu'un cabinet a besoin** (dérivé du seed) : `Cabinet` (nom, province, barreauNumero,
  email), `Cabinet.config` (devise, mode de taxe, format facture, taxNumbers, dossierTaxonomy,
  trustBanking), `CabinetInterface` (onglets, disciplines, modules, conformité), forfaits,
  débours.

## Portée (MVP)

Persister le **socle minimal** qui débloque le quotidien, sans reproduire tout le seed :

1. **Identité du cabinet** : nom, province (QC/ON), n° de Barreau/LSO, coordonnées.
2. **Régime de taxe** : dérivé de la province (QC → TPS/TVQ, ON → TVH) + numéros
   d'inscription (optionnels au départ).
3. **Disciplines / mode de facturation** : quelques cases (immobilier, immigration, famille…)
   qui pilotent l'interface et, à terme, la taxonomie.
4. **Défauts sensés** : seed idempotent des types de débours standards et d'un compte fiducie
   placeholder si le cabinet le déclare.

Hors périmètre MVP : taxonomie complète custom, import de données, connexion bancaire.

## Plan par lots

- **Lot 1 — Persistance du socle (le vrai correctif B1).** Transformer `/api/onboarding` (ou
  une nouvelle action) pour ÉCRIRE : `Cabinet` (nom, province, barreauNumero) + `Cabinet.config`
  (mode de taxe dérivé via `lib/onboarding/taxes.ts`, taxNumbers, devise, formatFacture) +
  `CabinetInterface` de base (disciplines cochées). Idempotent, ne jamais écraser une config
  existante sans confirmation. Migrations additives uniquement. Réutilise `OnboardingData` et
  le pattern d'upsert de `onboard-derisier.ts`.
- **Lot 1b — Compléter la page Paramètres → Cabinet** : ajouter province + mode de taxe (les
  champs manquants), pour que la config reste éditable après l'onboarding.
- **Lot 2 — Checklist vivante.** DÉJÀ EN PLACE (`tableau-de-bord/page.tsx:472-490`). Une fois
  le Lot 1 livré, l'étape « Configurer votre cabinet » se complètera enfin (config présente).
  Reste éventuellement à rendre chaque étape cliquable vers son action.
- **Lot 3 — Effet immédiat.** Vérifier que la config persistée pilote : taxes sur facture,
  copie réglementaire province-aware (`regulator.ts`), et le tableau de conformité (le module
  compliance récent lit déjà la province).
- **Lot 4 (option)** — défauts métier : débours standards (seed idempotent), forfaits proposés
  selon les disciplines cochées.

## Critères d'acceptation

- Un cabinet neuf complète l'onboarding → recharge → sa config est persistée (vérifiable en
  base et à l'écran : taxes correctes, province affichée, conformité dans la bonne juridiction).
- La checklist « Pour commencer » reflète l'état réel (pas figée à 0).
- Re-compléter l'onboarding n'écrase pas de données existantes sans confirmation.
- tsc + suite verte + parité i18n.

## Garde-fous

- **Migrations additives**, cabinet Derisier sanctuarisé (aucun impact sur les cabinets
  existants configurés par seed).
- **Idempotence** : l'onboarding ne doit jamais dupliquer ni écraser en silence.
- **Province = source de la réglementation** affichée (jamais une règle ON à un cabinet QC).
- Derrière un flag si le comportement live du dashboard change.
