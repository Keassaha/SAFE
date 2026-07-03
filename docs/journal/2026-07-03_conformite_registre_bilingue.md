# 2026-07-03 — Conformité : registre bilingue + affichage localisé + lien menu

## Buildé
1. **Registre bilingue** : `ComplianceRule.statement` = `{ fr, en }`, ~30 énoncés traduits.
   Helpers `localeForProvince` (QC→fr, ON→en) + `localizedStatement`. L'API `/conformite`
   localise l'énoncé selon la province. Composant `ComplianceDashboard` : titre de section,
   libellés de domaine, « à confirmer »/« échéance » aussi province-aware.
2. **Lien menu « Conformité »** ajouté dans `components/layout/SidebarNav.tsx` comme enfant du
   groupe Finances (entre Fidéicommis et Prestation), `routes.conformite` ajouté à `lib/routes.ts`.
   Icône ShieldCheck, `show: () => true`. Résout « je ne vois pas la page de conformité » : la
   page existait mais n'avait aucun lien de nav.

## Vérifié
- `vitest lib/compliance` + severity : 29 tests verts. `tsc` propre.
- **Lien menu prouvé correct par un build de production** (`next build`) : le chunk client du
  layout contient `{id:"conformite",href:routes.conformite,labelKey:"nav.compliance",...}` dans
  les enfants Finances, entre comptes et temps.

## GOTCHA dev à retenir
Le serveur **dev** (Turbopack ET webpack, via le navigateur du preview) est resté figé sur
l'ancienne version compilée de SidebarNav.tsx : les édits de CE fichier n'apparaissaient pas
même après `rm -rf .next`, kill des process, redémarrages. Les édits d'autres fichiers
(routes.ts) passaient. Le build de prod, lui, est correct. Diagnostic : cache d'exécution du
navigateur de preview incassable dans cet environnement (pas un problème de code).
→ Pour voir le lien en local : **hard refresh (Cmd+Shift+R)** ou stop dev + `rm -rf .next` +
restart + hard refresh. Accès direct toujours possible : `/conformite`.

## Flag
`COMPLIANCE_RULES_ENABLED=1` dans `.env.local` (local only) pour la section « Vos obligations ».
Prod éteinte par défaut.

## Reste (limite n°2)
Unifier le score de conformité (6 vérifs) avec le moteur readiness 10 domaines.
