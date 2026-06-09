# ADR-009 — Catalogue d'outils et inversion du menu

- **Date** : 2026-06-07
- **Statut** : Accepté
- **Lien spec** : `docs/journal/2026-06-07_catalogue_outils_inversion_menu.md`
- **Prototype** : `lib/catalog/`, `app/(app)/console/catalogue/`

## Contexte

Vision CEO : SAFE est une **bibliothèque interne qui range tous les outils** et
assemble une application sur mesure par cabinet. L'audit et le rapport génèrent,
dans la Console, les instructions d'assemblage. Activer un outil (ex : calculateur
de patrimoine familial) doit l'ajouter tout seul au bon endroit dans le menu.

L'app actuelle ne permet pas ça :

1. **Pas de catalogue d'outils.** Dans les bundles, un outil n'est qu'une chaîne
   (`"famille"`, `widgets: []`). Rien ne décrit ce qu'EST un outil.
2. **Menu statique et soustractif.** `NAV_ITEMS` (components/layout/SidebarNav.tsx)
   est codé en dur ; la config peut seulement *cacher* un item existant
   (`activeNavIds` / `hiddenNavIds`), jamais en *injecter* un nouveau.

Trois options :

1. Continuer en soustractif : tout coder dans NAV_ITEMS, puis cacher partout sauf
   où l'outil est pertinent.
2. **Inverser** : le catalogue devient la source de vérité, le menu est composé
   depuis les outils activés.
3. Système de plugins chargés dynamiquement.

## Décision

On adopte **l'inversion** (option 2). Le catalogue d'outils est la source de
vérité. Le menu de chaque cabinet est *composé* via `composeInterface(catalog,
activatedToolIds)` à partir de son manifeste d'activation.

Granularité d'un outil : **trois types** (décision CEO 2026-06-07) :

- **page** : un onglet/page, se place dans un groupe de menu à une position.
- **widget** : une carte injectée dans une page hôte (host + slot).
- **action** : un bouton/automatisation attaché à un hôte (host + location).

Le schéma est figé dans `lib/catalog/types.ts` (`ToolDefinition`, `CabinetManifest`).

## Justification

- Réalise littéralement la vision : un outil décrit une fois, placé automatiquement.
- Aucun cabinet ne devient un mini-produit : on assemble du catalogue, pas du code.
- S'emboîte avec l'existant : le manifeste est la sortie naturelle du moteur
  `audit -> bundle -> configuration` (lib/configuration/) et l'objet piloté par la
  Console (docs/product/CRM_SPEC_v1.md).
- Les outils custom restent explicites (`status: "custom"`), jamais glissés dans
  le standard (cohérent avec `customBacklog`).

## Conséquences

**Positives** :
- Un seul endroit décrit chaque outil (placement, domaines, dépendances, seeds,
  conformité, overrides).
- Le menu, les seeds et la checklist d'activation dérivent du même manifeste.
- Onboarding d'un cabinet = produire un manifeste, pas écrire du code.

**Négatives / coûts** :
- Migration progressive de NAV_ITEMS vers le catalogue (parité à garantir).
- Le rendu React (icônes, sous-items, prédicats de rôle, compteurs, libellé
  forfait) reste dans SidebarNav ; le catalogue décide la *présence*, pas tout le
  rendu, tant que la migration n'est pas complète.

## Implications techniques

- `lib/catalog/types.ts` — schéma figé (3 types d'outils + manifeste).
- `lib/catalog/catalog.ts` — catalogue de démonstration (Console).
- `lib/catalog/catalog-safe.ts` — catalogue grounded sur l'app réelle (parité
  NAV_ITEMS prouvée par test).
- `lib/catalog/compose-menu.ts` — moteur de composition (pur, testé).
- Branchement SidebarNav derrière le flag `CATALOG_DRIVEN_NAV` (par défaut
  **éteint** : comportement de production inchangé tant qu'on ne l'active pas).

## Suite (hors périmètre de cet ADR)

1. Faire descendre le manifeste depuis le layout jusqu'à SidebarNav.
2. Brancher le manifeste sur la sortie du moteur `audit -> bundle`.
3. Enrichir le schéma au besoin (rôles, sous-items) pour absorber tout le rendu.

## Décision restée ouverte

Monorepo + flags (retenu pour démarrer) vs vrai système de plugins chargés
dynamiquement (réévaluer au scale). Pas tranché ici.

## Alternatives rejetées

- **Rester en soustractif** : ne permet pas d'ajouter un outil propre à un domaine
  sans le coder pour tout le monde. C'est le problème de départ.
- **Plugins dynamiques maintenant** : surcoût d'infrastructure injustifié au stade
  actuel.
