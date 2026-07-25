# 2026-07-24 — Build du dashboard hybride (route isolée)

## Buildé
- Exécuté le spec `docs/design/SAFE_DASHBOARD_HYBRID_BUILD_SPEC.md`.
- La route isolée `/safe-linear-visual/dashboard` existait déjà (page.tsx + module.css complets, ~285 + ~1011 lignes, non commitée).
- Correction pour fidélité au spec §5.8 / à la capture de référence : bandeau opérationnel inférieur réordonné en **Fidéicommis · Temps non facturé · Taux d'encaissement 82 %** (l'ancienne version affichait « Temps facturable 72,4 h » en 1re cellule, hors spec).
- Vérifié visuellement sur le dev server : rendu fidèle à `public/images/linear-style/safe-dashboard-hybrid-production-concept.png` (sidebar en retrait, 4 KPI en un bloc, gros chiffres tabulaires, logo gravé ChevronMark central, décisions > timeline).

## Observé / incident
- `npm run build` : le **prototype compile** (« Compiled successfully in 31.3s »). Le build échoue ensuite au **type-check sur du code de PROD non lié** : `components/layout/AppChrome.tsx:69` — `SupportWidget` sans prop requise `cabinetId`. Pré-existant (working tree console/support), hors périmètre du spec. Non corrigé (interdiction de toucher la prod).
- Lancer `next build` pendant que le `next dev` tournait a corrompu le `.next` partagé → dev server en 500. Résolu : kill du next-server, `rm -rf .next`, redémarrage propre. À éviter : ne pas builder pendant que le dev tourne.

## Décidé
- Ne pas modifier la prod pour faire passer le build (respect contrainte §3 du spec). L'erreur `SupportWidget.cabinetId` est à traiter séparément si on veut un build vert.

## Isolation confirmée
- `/tableau-de-bord` et composants de prod non touchés. Seule modif : `app/safe-linear-visual/dashboard/page.tsx` (bandeau inférieur).
