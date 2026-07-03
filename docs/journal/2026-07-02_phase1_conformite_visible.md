# 2026-07-02 — Phase 1 (étape B) : conformité visible au cabinet + fix province-aware

## Buildé
1. **Fix province-aware du retard de rapprochement (STATUS-PROV-01).**
   - Nouvelle fonction PURE `computeReconciliationSeverity({isCurrentPeriodDone, daysSinceMonthEnd, province})`
     dans `lib/services/fideicommis/reconciliation-service.ts`. ON = rappel J+20 / critique J+25
     (By-Law 9 art. 22(2)). QC = rappel possible mais **jamais « critique / non-conforme »**
     (B-1 r.5 n'a aucun délai chiffré).
   - `getReconciliationStatus(cabinetId, province?)` récupère la province (via `getCabinetProvince`
     si non fournie) et délègue à la fonction pure. Rétro-compatible : sans province → défaut ON.
   - Corrige un faux signal de non-conformité pour les cabinets QC (ex. Cayard). Changement live
     dans la direction sûre (retire une alerte fausse), testé.
2. **Obligations sourcées exposées au cabinet.**
   - `app/api/conformite/route.ts` renvoie `obligations = getDisplayableRules(province)` **sous le
     flag `COMPLIANCE_RULES_ENABLED`** (défaut éteint → `[]`, aucun changement prod).
   - `components/conformite/ComplianceDashboard.tsx` : section « Vos obligations de conformité »,
     groupée par domaine, énoncé + source + « à confirmer » (PARTIEL) + échéance.

## Vérifié
- `vitest` : 26 tests verts (20 rules + 6 severity) ; suites fiducie/sécurité existantes vertes (15).
- `tsc --noEmit` : aucune erreur sur les fichiers touchés.
- Navigateur (flag local ON, Cabinet Test = ON) : section rendue, groupée, sourcée ; API renvoie
  15 obligations, **0 INCERTAIN**, **0 règle QC** (province-aware confirmé), confidences CONFIRME/PARTIEL ;
  reconciliation status « ok » ; aucune erreur console. Le plan de contingence TR-ON-06 apparaît
  avec son échéance 2026-03-31.

## Flag
`COMPLIANCE_RULES_ENABLED=1` ajouté à `.env.local` (LOCAL seulement, pour la démo). Prod/Vercel
restent éteintes par défaut. Pour activer en prod plus tard : variable d'env Vercel.

## Reste (limitations connues, hors périmètre étape B)
- Les énoncés d'obligations sont en français ; pour un cabinet ON anglophone (Derisier), prévoir
  une version EN des statements (localisation) avant activation prod.
- Le score de conformité reste sur les 6 vérifs historiques ; l'unification avec le moteur
  readiness (10 domaines) reste à faire (Phase 1 suite).
