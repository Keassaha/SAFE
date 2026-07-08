# SPEC — Lot A : actions en lot + filtres avancés (liste des dossiers)

> Statut : DRAFT, en attente validation CEO avant build.
> Périmètre : volet administratif, gestion de portefeuille pour l'adjointe.
> Journal lié : `docs/journal/2026-07-07_plan_volet_administratif.md`.
> **Aucune migration Prisma. 100 % additif.**

---

## 1. Problème

L'adjointe gère un portefeuille de 50 à 200 dossiers. Aujourd'hui la liste
(`/dossiers`) ne permet ni d'agir sur plusieurs dossiers à la fois, ni de filtrer
sur les critères qui comptent au quotidien (dossiers ouverts sur une période,
dossiers avec des tâches en retard, dossiers avec de l'argent en fiducie). Chaque
changement de statut ou d'assignation se fait dossier par dossier, via le menu
`⋯` de chaque ligne. C'est la friction de gestion de portefeuille numéro un.

Cible du rapport de recherche : item #5 (actions en lot) + volet « filtres
avancés » (section 1.4). Les concurrents petits cabinets couvrent mal les actions
en lot (CosmoLex les a ajoutées en mai 2025), c'est un point apprécié des
adjointes.

## 2. Objectif

Deux fonctionnalités livrées ensemble sur la page liste des dossiers :

- **A1. Actions en lot** : sélectionner plusieurs dossiers et appliquer une action
  commune (changer le statut, assigner un avocat responsable, archiver).
- **A2. Filtres avancés** : plage de dates d'ouverture, dossiers avec tâches en
  retard, dossiers avec solde en fiducie.

Critère de réussite : l'adjointe traite 20 dossiers en une action au lieu de 20,
et isole en un filtre « les 6 dossiers qui ont une tâche en retard ». Montrable en
démo en moins de 30 secondes.

## 3. Non-objectifs (hors périmètre, à ne PAS faire dans ce lot)

- **Pas de fermeture en lot.** La fermeture (`cloture`) passe obligatoirement par
  `closeDossier`, qui applique les bloqueurs de conformité (solde fiducie négatif =
  blocage dur, factures impayées = alerte acquittable). Une fermeture en masse
  contournerait ces garde-fous. Le statut `cloture` est donc **exclu** des actions
  en lot.
- **Pas d'édition libre de la date de rétention** (bien que listée dans l'item #5
  du rapport). `retentionJusqua` est calculée par `computeRetentionUntil` selon le
  type de dossier (règle Barreau). La laisser saisir en masse casserait la
  conformité. Reporté au Lot D (alertes de rétention).
- **Pas de recherche full-text / trigram / phonétique.** La recherche reste en
  `contains` (inchangée).
- **Pas de vues sauvegardées / filtres nommés.** Plus tard si besoin.
- **Pas de suppression en lot.** SAFE ne supprime pas un dossier (archive
  seulement), doctrine conformité inchangée.

## 4. A1 — Actions en lot

### 4.1 UX
- Ajout d'une **colonne de sélection** (case à cocher) en tête de chaque ligne du
  tableau, plus une case « tout sélectionner » dans l'en-tête (sélectionne les
  dossiers de la page courante uniquement).
- Quand au moins un dossier est coché, une **barre d'actions groupées** apparaît
  (sticky, au-dessus du tableau) : « N dossiers sélectionnés » + boutons d'action.
- Actions disponibles :
  1. **Changer le statut** → menu déroulant limité à `ouvert`, `actif`,
     `en_attente` (jamais `cloture`, voir non-objectifs ; `archive` a son propre
     bouton).
  2. **Assigner un avocat responsable** → menu déroulant de la liste des avocats
     du cabinet (mêmes options que le filtre).
  3. **Archiver** → action destructive douce, **confirmation obligatoire** via
     modal (« Archiver N dossiers ? Ils restent accessibles via le filtre de
     statut. »).
- Après action réussie : toast de confirmation, sélection vidée, liste
  rafraîchie (`revalidatePath`).

### 4.2 Implémentation
- `components/dossiers/registry/DossiersTable.tsx` gère déjà l'état client
  (`"use client"`). Ajouter un état local `selectedIds: Set<string>` et la colonne
  de cases à cocher. Extraire la barre d'actions dans
  `components/dossiers/registry/DossierBulkActionBar.tsx` (nouveau).
- Nouvelle server action dans `app/(app)/dossiers/actions.ts` :

```ts
export async function bulkUpdateDossiers(input: {
  ids: string[];
  action: "setStatut" | "assignLawyer" | "archive";
  statut?: "ouvert" | "actif" | "en_attente";   // requis si action = setStatut
  avocatResponsableId?: string;                  // requis si action = assignLawyer
}): Promise<{ ok: true; count: number } | { ok: false; error: string }>
```

### 4.3 Garde-fous (obligatoires)
- `requireCabinetAndUser()` puis `canManageDossiers(role)` — refus sinon.
- **Isolation cabinet** : le `updateMany` filtre TOUJOURS
  `where: { id: { in: ids }, cabinetId }`. Un id d'un autre cabinet est ignoré
  silencieusement (jamais d'erreur qui fuite l'existence).
- **Restriction rôle avocat** : si `role === "avocat"`, ajouter au `where`
  `avocatResponsableId: userId` (un avocat n'agit en lot que sur ses propres
  dossiers, cohérent avec `restrictToUserId` de la liste). L'adjointe et
  l'admin_cabinet agissent sur tout le cabinet.
- **Statut interdit** : rejeter côté serveur si `statut === "cloture"` ou
  `"archive"` passe par `setStatut` (défense en profondeur, l'UI ne le propose
  pas).
- **Plafond de lot** : refuser si `ids.length > 200` (garde-fou perf/erreur).
- **Audit** : un `createAuditLog` par dossier touché (`entityType: "Dossier"`,
  `action: "update"`, `metadata: { bulk: true, action, statut/avocat }`), OU un
  log agrégé si le volume le justifie — trancher au build, défaut = un log par
  dossier pour la traçabilité Barreau.
- `revalidatePath("/dossiers")` en fin d'action.

## 5. A2 — Filtres avancés

### 5.1 UX
Ajout dans `DossierFilters` (composant existant) de trois contrôles :
- **Plage de dates d'ouverture** : deux champs date (`dateFrom`, `dateTo`).
- **Tâches en retard** : bascule « À traiter » → ne montre que les dossiers ayant
  au moins une tâche non terminée dont l'échéance est dépassée.
- **Fiducie** : menu à 3 états — tous / avec solde en fiducie (`> 0`) / solde
  négatif (`< 0`, signal de conformité, remonte les bloqueurs de fermeture).

Les filtres se combinent (ET) avec la recherche et les filtres existants (client,
statut, type, avocat) et se propagent aux paramètres d'URL + à l'export CSV.

### 5.2 Implémentation
- Étendre `buildDossierListWhere` (`lib/dossiers/query.ts`) avec les paramètres :

```ts
dateFrom?: string | null;   // ISO date
dateTo?: string | null;     // ISO date, borne inclusive (fin de journée)
overdueTasks?: boolean;     // au moins une DossierTache non terminée + échue
trust?: "any" | "positive" | "negative";
```

- Traductions Prisma :
  - `dateFrom` / `dateTo` → `where.dateOuverture = { gte, lte }`.
  - `overdueTasks` → `where.taches = { some: { statut: { notIn: ["terminee",
    "annulee"] }, dateEcheance: { lt: <today> } } }` (confirmer le nom exact de la
    relation `DossierTache` et des enums de statut au build).
  - `trust: "positive"` → `where.soldeFiducieDossier = { gt: 0 }` ;
    `trust: "negative"` → `{ lt: 0 }`.
- `app/(app)/dossiers/page.tsx` : ajouter les nouveaux `searchParams`, les passer
  à `buildDossierListWhere` (liste ET stats) et à `exportParams`.
- `today` : instancier dans la Server Action / page (jamais dans le builder pur,
  qui doit rester déterministe et testable en passant la date en argument).

### 5.3 Garde-fous
- Validation des bornes : si `dateFrom > dateTo`, ignorer la plage (pas d'erreur).
- Le filtre `trust` respecte `canViewBillingTrust` : si le rôle n'a pas le droit
  de voir la fiducie, masquer le contrôle et ignorer le paramètre côté serveur.

## 6. i18n
Nouvelles clés `messages/fr.json` + `messages/en.json`, namespace `matters` :
- `bulkSelectedCount`, `bulkSetStatus`, `bulkAssignLawyer`, `bulkArchive`,
  `bulkArchiveConfirm`, `bulkDone`.
- `filterDateFrom`, `filterDateTo`, `filterOverdueTasks`, `filterTrustAny`,
  `filterTrustPositive`, `filterTrustNegative`.
Respecter la parité FR/EN (le build échoue sinon).

## 7. Critères d'acceptation
1. Cocher 3 dossiers, « Changer le statut → actif » : les 3 passent à `actif`, un
   toast confirme, la sélection se vide.
2. « Archiver » sur 5 dossiers demande confirmation ; après confirmation, ils
   disparaissent de la vue active et réapparaissent avec le filtre statut = archivé.
3. Un compte `avocat` ne peut pas modifier en lot un dossier dont il n'est pas
   responsable (l'action ignore ces id, le count retourné le reflète).
4. `cloture` n'apparaît jamais dans le menu de statut groupé ; un appel forgé avec
   `statut: "cloture"` est rejeté serveur.
5. Filtre « tâches en retard » : seuls les dossiers avec une tâche échue non
   terminée s'affichent ; le compteur de la liste est cohérent.
6. Filtre « fiducie négative » : remonte exactement les dossiers à
   `soldeFiducieDossier < 0`.
7. Les filtres avancés se retrouvent dans l'URL et dans l'export CSV.
8. Aucune migration ; `tsc --noEmit` vert ; parité FR/EN.

## 8. Plan de test
- Unitaire : `buildDossierListWhere` avec chaque nouveau paramètre (dont
  `dateFrom > dateTo`, `overdueTasks`, `trust`) → forme du `where` attendue, date
  injectée en argument.
- Unitaire : `bulkUpdateDossiers` — isolation cabinet, restriction avocat, rejet
  `cloture`, plafond 200.
- Manuel (preview authentifié cabinet test) : parcours des 7 critères
  d'acceptation ci-dessus.

## 9. Démo (preuve visuelle)
Scénario 30 s à filmer pour la cliente / build-in-public :
1. Liste avec ~30 dossiers.
2. Filtre « tâches en retard » → 4 dossiers isolés.
3. Tout cocher → « Assigner à Me X » → un clic, les 4 réassignés.
4. Toast « 4 dossiers mis à jour ».
Message : « ce que l'adjointe faisait en 4 fois, en un geste. »

## 10. Risques / points à trancher au build
- Nom exact de la relation `DossierTache` sur `Dossier` et des valeurs d'enum de
  statut (`terminee`/`annulee`) : à confirmer dans `schema.prisma` avant d'écrire
  le `some`.
- Granularité de l'audit en lot (un log par dossier vs agrégé) : défaut un par
  dossier ; réévaluer si volume > 200.
- Feature flag : le lot étant additif et sans schéma, un flag n'est pas
  strictement requis, mais on peut cacher la barre d'actions derrière un flag
  cabinet le temps du rodage. À trancher CEO.
