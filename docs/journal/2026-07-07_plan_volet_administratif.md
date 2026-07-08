# 2026-07-07 — Plan d'amélioration du volet administratif (gestion de dossiers)

## Contexte
Demande CEO : bâtir un plan pour améliorer le volet administratif de SAFE, en
s'inspirant du rapport de recherche `~/Downloads/Gestion de dossiers pour petit
cabinet québécois — État de l'art, conformité et améliorations prioritaires.md`
(12 améliorations priorisées, sourcées Barreau + concurrents Clio/Smokeball).

Le rapport a été précédé d'un audit du code réel (agent d'exploration) : le module
dossier est mature (75-85 %), pas un squelette. Voir aussi
[[project_dev_doctrine]] (brancher avant de bâtir, filtre 3 questions).

## Principe directeur
Le volet administratif = la journée de l'adjointe. Chaque item se juge à une aune :
enlève-t-il une tâche répétitive ou une angoisse à l'adjointe, et se montre-t-il
en démo ? Aligné [[strategy_positioning_copilote]] + [[strategy_preuve_visuelle]].

## Réconciliation recherche ↔ code réel (le cœur de la décision)
Sur les 12 items du rapport, la majorité existe déjà en tout ou partie. On ne
rebâtit pas l'existant.

| # Recherche | État réel SAFE | Verdict |
|---|---|---|
| 1. Délais CPC auto | `DossierReminder` existe, aucun moteur ni envoi | À bâtir (gros morceau) |
| 2. Gabarits de dossier | Cartable auto-généré, tâches non séquencées | À étendre |
| 3. Formulaire ID client | `ClientIdentityVerification` existe, bloque le dossier | À vérifier/finir |
| 4. Conflits cross-dossier | Modèle + blocage existent, UI à moitié bâtie | À finir |
| 5. Actions en lot | Rien | À bâtir (gain rapide) |
| 6. Alertes de rétention | `retentionJusqua` calculé, pas de planificateur | Planificateur à bâtir |
| 7. Checklist de fermeture | `closeDossier` avec bloqueurs durs/souples | Fait, à montrer |
| 8. Résumé IA | Existe, bloqué : `ANTHROPIC_API_KEY` absente | Débloquer la clé |
| 9. Champs perso par domaine | Immobilier/immigration codés en dur | À reporter |
| 11. Suggestion prochaine action | Bloc « Où j'en étais » (T1) existe | À étendre légèrement |
| 12. RCA automatisé | Certification rapport annuel LSO existe | À vérifier/finir |

Bilan : 4 items déjà debout (3, 7, 8, 11), 4 partiels (2, 4, 6, 12), 2 réellement
neufs (1, 5).

## Plan en 4 lots (décidé)
- **Lot A — Gérer le portefeuille (gain rapide, démo immédiate)** : actions en lot
  (#5) + filtres avancés (plage de dates, tâches en retard, solde fiducie). Faible
  effort, zéro migration. **Priorité 1, spec écrite en foulée.**
- **Lot B — Ne rien échapper** : B1 planificateur de rappels (fait vivre
  `DossierReminder` + alerte rétention 7 ans, cron Vercel, effort faible) ; puis
  B2 moteur de délais CPC (#1, différenciateur québécois, gros chantier,
  spec + flag obligatoires avant code).
- **Lot C — Ouvrir un dossier en un clic** : gabarits complets (#2) en étendant le
  cartable existant (structure + tâches séquencées + assignation équipe).
- **Lot D — Argument conformité** : finir conflits (#4), vérifier/durcir ID client
  (#3), vérifier/finir RCA (#12).

## Reporté
- Champs perso dynamiques (#9), dossiers liés (#10) : différenciateurs réels mais
  aucun cabinet ne bloque là-dessus aujourd'hui.
- Items IA (#8, #11) : bloqués par l'absence de `ANTHROPIC_API_KEY`. Voir
  [[project_ai_agents]]. À débloquer avant toute promesse IA en démo.

## Recommandation de séquencement
1. Cette semaine : Lot A (montrable tout de suite à la cliente actuelle).
2. En parallèle : B1 (planificateur de rappels).
3. Écrire la spec du moteur CPC (B2) pendant que A/B1 se codent.
Piège identifié : sauter direct sur le moteur CPC (excitant mais invisible avant
des semaines). Livrer A + B1 d'abord pour la preuve visuelle.

## Décidé (CEO, 2026-07-07)
- Go plan en 4 lots. Log au journal (ce fichier), puis rédaction immédiate de la
  spec Lot A → `docs/product/SPEC_LOT_A_actions_lot_filtres_dossiers.md`.

## Buildé (Lot A, 2026-07-07)
Spec : `docs/product/SPEC_LOT_A_actions_lot_filtres_dossiers.md`. Aucune migration.
- `lib/dossiers/query.ts` — `buildDossierListWhere` étendu : `dateFrom`/`dateTo`
  (plage d'ouverture, borne haute fin de journée, ignore si from > to),
  `overdueTasks` + `now` (relation `taches`, statut `notIn [terminee, annulee]`,
  échéance < now), `trust` (`positive` > 0 / `negative` < 0). `now` passé par
  l'appelant (builder reste pur).
- `app/(app)/dossiers/actions.ts` — `bulkUpdateDossiers` (setStatut / assignLawyer
  / archive). Garde-fous : `canManageDossiers`, `updateMany` borné `cabinetId`,
  `cloture`/`archive` interdits via setStatut, plafond 200, un audit log par
  dossier. Avocat validé (cabinet + rôle) avant assignation.
- `components/dossiers/registry/DossierBulkActionBar.tsx` (nouveau) — barre sticky,
  confirmation d'archivage en ligne (pas de modale), refresh comme feedback.
- `DossiersTable.tsx` — colonne de cases (tout/ligne), surlignage sélection, barre
  montée quand `canManage` + sélection non vide.
- `DossierFilters.tsx` — champs date, bascule « tâches en retard », select fiducie
  (gated `canViewTrust`).
- `app/(app)/dossiers/page.tsx` — parse des nouveaux `searchParams`, passe
  `avocats`/`canManage` au tableau, `canViewTrust` aux filtres, propage à l'export.
- `app/api/dossiers/export/route.ts` — export CSV honore dateFrom/dateTo/overdue,
  fiducie gated `canViewBillingTrust`.
- i18n : clés `bulk*` + `filter*` ajoutées à `matters` (FR + EN).

## Vérifié
- `tsc --noEmit` : exit 0, zéro erreur. JSON FR/EN valides.
- Preview authentifié (cabinet test, rôle admin_cabinet) :
  - Cases à cocher (1 en-tête + 3 lignes), 2 champs date, bouton « Tâches en
    retard », select fiducie tous rendus. Zéro erreur console/serveur.
  - Sélection d'une ligne → barre d'actions groupées visible ; `cloture` NON
    proposé dans le menu de statut (garde-fou confirmé côté UI).
  - Action de bout en bout : dossier passé « Actif » → « En attente » via l'action
    en lot, sélection vidée après coup. Restauré à « Actif » ensuite.
  - Filtres `overdue=1`, `trust=negative/positive`, plage de dates : tous 200.

## Reste
- Tests unitaires (`buildDossierListWhere`, `bulkUpdateDossiers`) non encore écrits
  (prévus à la spec §8) : à ajouter.
- Décision flag cabinet (rodage) laissée ouverte : livré sans flag (additif).
