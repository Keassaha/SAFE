# 2026-07-30 — Standard premium, audit du code monté, et garde-fous

## Ce qui a été observé

**L'audit précédent (2026-07-24) mesurait sur du code mort.** Un compteur qui part des
75 routes de `app/(app)` et suit le graphe d'imports donne des chiffres très différents
d'un `grep` sur tout le dépôt : 1 537 écarts sur l'intérieur réellement monté, contre
les 2 540 occurrences brutes annoncées. Trois cibles P1 de cet audit, `AlertsPanel`,
`MonthlyComparisonTable` et `DossierEvolutionPanel`, ne sont montées par aucune route.

**La barre latérale n'existe plus.** `components/layout/Sidebar.tsx` était importé à
`AppChrome.tsx:5` sans jamais être rendu, depuis le commit `1c0bf3e` du 26 avril qui a
déplacé la navigation dans le `Header`. Trois coquilles coexistent : celle en
production (navigation en en-tête), la barre morte, et `ShellV2` câblée sur
`/v2/dossiers` seulement.

**`SupportWidget` était rendu deux fois**, à `layout.tsx:83` et `AppChrome.tsx:69`.

**La chaîne de jetons n'existe pas.** `lib/ds/tokens.ts` (313 lignes) et
`lib/design-tokens.ts` (48 lignes) ne sont importés nulle part. `globals.css` et
`tailwind.config.ts` sont maintenus à la main, en parallèle.

**La dette est concentrée.** 42 % dans quinze fichiers. `CreateInvoiceView` en porte 94
à lui seul sur 1 615 lignes.

## Ce qui a été décidé

**Le standard remplace la doctrine.** `docs/design/SAFE_PREMIUM_DESIGN_STANDARD.md`
absorbe `DOCTRINE_INTERFACE_INTERIEUR.md` et le durcit : 7 lois non négociables,
93 règles auditables `PS-001` à `PS-093` avec seuil mesurable et gravité, grille de
notation sur 100, procédure d'audit exécutable, manifeste. Pointé depuis `CLAUDE.md`.

**Le socle de preuves est sourcé.** Douze sources primaires vérifiées, dont Lindgaard
2006 (jugement esthétique en 50 ms), Tuch 2012 (complexité visuelle à 17 ms), Fogg
Stanford (apparence citée dans 46,1 % des jugements de crédibilité), Reber 2004
(fluidité de traitement), et les seuils de temps de réponse Nielsen, Doherty, INP.

**La modernité n'est pas notée**, volontairement : critère de mode, non mesurable, il
vieillit. Le mode sombre est hors barème tant que le clair n'atteint pas 90.

**Priorité nouvelle, issue du terrain et non du code** : la saisie du temps sous cinq
secondes. Documentée comme l'écran décisif de l'adoption en cabinet, absente des audits
précédents, à la fois de très fort impact utilisateur et business.

## Ce qui a été construit

| Livrable | Effet |
|---|---|
| `docs/design/SAFE_PREMIUM_DESIGN_STANDARD.md` | référentiel opposable, auditable par une IA |
| `scripts/design-audit.mjs` (`npm run design:audit`) | compteur d'écarts sur le code monté seulement, suit `next/dynamic` |
| `scripts/design-baseline.mjs` (`npm run design:baseline`) | régénère la liste de référence, refuse de l'agrandir |
| `.eslint-design-baseline.json` | 247 fichiers en écart, exemptés le temps de la reprise |
| `eslint.config.mjs` | règle `no-restricted-syntax` : PS-001 hexadécimales, PS-002 palettes génériques, PS-005 ombres |

## Correctifs appliqués

- `app/(app)/layout.tsx` : doublon `SupportWidget` retiré, celui d'`AppChrome` connaît
  `isSafeInc` et ne s'affiche pas en mode consultant.
- `components/layout/AppChrome.tsx` : import mort de `Sidebar` retiré.
- Base locale `safe_local` : colonne `User.sessionsValidFrom` ajoutée (migration
  `20260728121000` jamais appliquée, connexion cassée), puis huit clés étrangères
  alignées sur le schéma (`ON DELETE RESTRICT`, durcissement anti-cascade).

**`prisma migrate dev` n'a pas été lancé.** `_prisma_migrations` ne contient que 2 lignes
sur 32 : la base a été construite par `db push` ou en SQL direct. Prisma aurait proposé
une réinitialisation, donc la perte du cabinet test. SQL direct additif à la place.

## État des vérifications

- `npx tsc --noEmit` : 0 erreur, y compris `AppChrome.tsx:69` que l'ancien audit
  signalait comme bloquante.
- Garde-fou ESLint testé dans les deux sens : erreur sur un fichier fautif, silence sur
  un fichier conforme et sur un fichier de la liste de référence.
- Application : `/`, `/connexion`, `/api/auth/session`, `/api/auth/db-check` répondent
  200, aucune erreur serveur.
- Décalage base restant : `BeneficialOwner.updatedAt DROP DEFAULT`, dérive connue et
  tolérée, hors périmètre.

## Point de référence à faire baisser

```
TOTAL DES ÉCARTS : 1537   sur 304 fichiers montés, 187 en écart
PS-002 palette 562 · PS-001 hex 464 · PS-004 rayons 300 · PS-005 ombres 83
PS-042 mouvement continu 68 · PS-082 emoji 23 · PS-006 dégradés 14 · flous 12 · survol 11
```

## Ménage des orphelins, second passage

Le premier compte de 146 orphelins était faux. `scripts/design-orphans.mjs`
(`node scripts/design-orphans.mjs`) applique un détecteur volontairement prudent :
tous les points d'entrée de `app/` comptent et pas seulement les pages, les fichiers de
test comptent comme points d'entrée, `next/dynamic` et les réexports sont suivis, et
tout composant dont le nom apparaît en chaîne de caractères ailleurs est conservé.

```
composants inventoriés          386
atteints par un point d'entrée  256
non atteints                    130
  dont cités ailleurs, gardés    92
  réellement supprimables        38
```

**12 supprimés**, tous intérieurs, tous vérifiés à zéro référence textuelle dans le
dépôt : `ClientDocumentRefs`, `BillingPipeline`, `ChartRevenus`,
`DashboardTasksAndAppointments`, `DossierEvolutionPanel`, `ReadyForReviewInbox`,
`ColorSchemePreview`, `DeboursAddForm`, `FacturationKpis`, `MissingDeboursAlert`,
`ReportFilters`, `RevenueTable`.

**26 conservés** : landing, marketing, onboarding, tarification, public-site. Hors
périmètre intérieur, et surtout `components/public-site/HomePage.tsx` est modifié dans
l'arbre de travail par un chantier en cours tout en étant réputé non atteint. Signal
suffisant pour ne rien toucher de ce côté.

Après suppression : `tsc --noEmit` sans erreur, 848 tests passent, liste de référence
ESLint descendue de 247 à 240 fichiers, application toujours en 200.

**Un défaut préexistant relevé au passage** : `lib/dossiers/parties-sync.ts` importe
`server-only`, paquet absent de `package.json` et de `node_modules`. Un fichier de test
sur 94 ne se charge pas. Sans rapport avec ce lot, vient du commit `a300a7d`.

## Ce qui reste ouvert

1. **Trancher la coquille.** Rien de structurel ne devrait démarrer avant. Le rendu
   visuel proposé prend parti pour la barre latérale de 224 px de `ShellV2`.
2. **La chaîne de jetons reste à câbler**, à valeurs identiques pour ne rien déplacer
   visuellement.
3. **Les 26 orphelins hors périmètre intérieur**, à traiter quand les chantiers landing
   et tarification en cours seront posés.
4. **Aucun correctif visuel n'a été appliqué**, sur consigne.
