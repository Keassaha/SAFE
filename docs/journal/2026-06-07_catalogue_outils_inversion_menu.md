# 2026-06-07 — Bibliothèque interne d'outils : l'inversion du menu

## Contexte / déclencheur

Réflexion CEO : repenser l'organisation de SAFE et du pipeline pour viser
l'automatisation long terme. Image directrice : **SAFE est une bibliothèque
interne qui range tous les outils**. Selon l'entrevue et le rapport d'audit, le
système génère dans le CRM les instructions d'assemblage. Exemple : un cabinet
en droit de la famille active le « calculateur de patrimoine familial » dans la
biblio, et son menu se modifie pour ajouter l'outil au bon endroit.

## Constat (ce qui existait déjà vs le manque)

Déjà posé :
- Moteur `audit -> bundle -> configuration` modélisé (`lib/configuration/types.ts`,
  `docs/configuration/CONFIG_GENERATION_MODEL.md`).
- Bibliothèque de bundles (`docs/bundles/SAFE_BUNDLE_LIBRARY.md`, 6 presets).
- Menu qui sait se réduire par cabinet (`components/layout/SidebarNav.tsx` via
  `activeNavIds` / `hiddenNavIds`).

Le chaînon manquant (le vrai sujet) :
1. **Pas de catalogue d'outils.** Dans les bundles un outil n'est qu'une chaîne
   (`"famille"`, `widgets: []`). Rien ne décrit ce qu'EST un outil.
2. **Le menu est statique et soustractif.** `NAV_ITEMS` est codé en dur ; la
   config peut cacher un item existant mais pas en injecter un nouveau. C'est
   l'inverse du modèle voulu.

L'inversion à faire : le **catalogue** devient la source de vérité ; le menu de
chaque cabinet est **composé** à partir des outils activés.

## Décisions CEO de la session

- **Prochain pas** : prototyper le menu composé (avant ADR).
- **Granularité d'un outil** : trois types — **page**, **widget**, **action**.

(Décisions structurantes encore ouvertes, à trancher en ADR-009 : adopter
formellement l'inversion du rendu ; monorepo + flags vs vrai système de plugins.)

## Ce qui a été buildé (prototype)

Isolé, sans toucher au menu de production :
- `lib/catalog/types.ts` — schéma déclaratif d'un outil (3 types, placement,
  domaines, requires, seeds, conformité, overrides, status) + `CabinetManifest`.
- `lib/catalog/catalog.ts` — catalogue d'exemple (10 outils : cœur + famille +
  immobilier + immigration), dont le calculateur de patrimoine familial.
- `lib/catalog/compose-menu.ts` — moteur pur `composeInterface(catalog, activatedIds)`
  → menu groupé/trié + injections widgets/actions + dépendances manquantes.
- `app/(app)/console/catalogue/` — page + vue interactive : cocher un outil →
  il se place tout seul dans le menu de gauche ; presets « cabinet famille /
  immobilier / immigration » ; manifeste JSON généré.
- `lib/catalog/__tests__/compose-menu.test.ts` — 7 tests (verts).

Vérif : 7/7 tests + typecheck propre. Pas de capture navigateur (route sous
auth, pas de connexion effectuée).

## Suite proposée

1. ADR-009 actant l'inversion + figeant le schéma d'outil.
2. Cartographier le produit actuel en entrées de catalogue (mesurer la vraie
   granularité, révéler combien d'outils SAFE a déjà).
3. Brancher `composeInterface` sur le vrai `SidebarNav` derrière un flag.
4. Relier le manifeste à la sortie du moteur `audit -> bundle` existant et à la
   Console (les « instructions » générées).

## Addendum — les 3 pas exécutés (même jour)

CEO : « on peut y aller ». Livré :

1. **ADR-009** (`docs/journal/decisions/ADR-009-catalogue-outils-et-inversion-du-menu.md`)
   acte l'inversion + fige le schéma (3 types page/widget/action). Ouvert :
   monorepo+flags (retenu) vs plugins.
2. **Cartographie** de l'app réelle (agent Explore) → 22 pages principales,
   65 page.tsx. A révélé des pages hors menu (briefing, securite, conformite,
   gestion-lextrack) et la page orpheline fiches-de-temps.
3. **Catalogue grounded** `lib/catalog/catalog-safe.ts` (parité NAV_ITEMS) +
   **pont** `lib/catalog/nav-bridge.ts` (flag `CATALOG_DRIVEN_NAV`, défaut
   ÉTEINT) branché dans `lib/services/cabinet-interface.ts`. Quand éteint :
   production strictement inchangée. Quand allumé : la whitelist de nav est
   dérivée du catalogue (identique aujourd'hui grâce à la parité, prête à
   accueillir les outils de domaine).

Vérif : 13/13 tests catalogue verts + typecheck propre sur les fichiers touchés.

Reste (suite ADR-009) : descendre un vrai manifeste depuis le layout, le relier
au moteur audit→bundle, enrichir le schéma (rôles, sous-items) pour absorber tout
le rendu, puis intégrer briefing/securite/conformite au catalogue.

## Idées à propager (content-bank)

- Angle « SAFE = bibliothèque qui construit un outil sur mesure » : narratif fort
  côté positionnement (chaque cabinet a SON app, pas un produit générique), sans
  surcoût de build. À transformer en post build-in-public.
