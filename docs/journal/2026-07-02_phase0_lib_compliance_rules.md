# 2026-07-02 — Phase 0 (étape A) : lib/compliance/rules.ts

## Buildé
- `lib/compliance/rules.ts` : module pur qui encode le registre validé
  (docs/compliance/REGISTRE_OBLIGATIONS.md v0.2) comme données typées, province-aware.
  - Types : `Jurisdiction` (QC/ON/FED/ALL), `Confidence` (CONFIRME/PARTIEL/INCERTAIN),
    `ComplianceDomain`, `ComplianceRule`.
  - Doctrine ADR-011 câblée : `isDisplayable` exclut tout INCERTAIN et toute règle sans source ;
    `getDisplayableRules(province)` est l'entrée pour les surfaces utilisateur ;
    `getRulesForProvince` / `getOpenQuestions` pour le suivi interne.
  - Province-aware : `resolveProvince` aligné sur `lib/trust/regulator.ts` (QC sinon ON).
    Garantie testée : le délai ontarien 25 j n'atteint jamais un cabinet QC.
  - Flag `COMPLIANCE_RULES_ENABLED` (défaut ÉTEINT) : le module est INERTE tant qu'aucune
    surface ne le consomme. Le branchement UI (Phase 1) sera gaté dessus.
- `lib/compliance/__tests__/rules.test.ts` : 20 tests. Invariants clés : ids uniques,
  aucune fuite d'INCERTAIN dans l'affichage, non-contamination inter-provinces, flag éteint
  par défaut, FED/ALL appliqués aux deux provinces.

## Vérifié
- `vitest run lib/compliance` : 20/20 verts.
- `tsc --noEmit` : aucune erreur sur lib/compliance/*.
- Aucun changement de comportement live (rien ne consomme le module ; flag éteint).

## Suite
- Étape B (Phase 1) : brancher `getDisplayableRules` dans le tableau de conformité exposé au
  cabinet, sous `COMPLIANCE_RULES_ENABLED`, avec correction province-aware du calcul de retard
  de rapprochement (STATUS-PROV-01 : ne pas appliquer le seuil 25 j de l'Ontario à un cabinet QC).
- Externe (CEO) : envoyer les questions régulateurs + vérifier le plan de contingence Derisier.
