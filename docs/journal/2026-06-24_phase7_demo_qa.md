# 2026-06-24 — Phase 7 : démo pilote + QA finale

Theme calendrier (Semaine 7) : « SAFE est montrable et vendable ». Clôt le calendrier (Phases 1-7).
Branche `release/2026-06-11-compta-admin-derisier`.

## Vérification finale
| Contrôle | Résultat |
| --- | --- |
| `npx tsc --noEmit` | ✅ aucune erreur |
| `npm run test:run` | ✅ 661 tests / 77 fichiers |
| `npm run build` | ✅ succès (toutes les routes) |
| `npm run i18n:keys` | ✅ 3133 / 3133 (parité fr/en) |
| `npm run lint` | ⚠️ 55 problèmes PRÉ-EXISTANTS (52 apostrophes JSX, 3 alt-text, 3 no-assign-module-variable dans un test, 1 hook-deps). Aucun dans le code de cette release. Build non bloqué. À nettoyer post-pilote. |

## Livrables
- `docs/SAFE_DEMO_SCRIPT.md` : scénario de démo 20 min (sales), avec le moment navette « l'assistant prépare, l'avocat approuve ».
- `docs/SAFE_GUIDE_PILOTE.md` : guide de démarrage 1 page par persona (avocat solo + duo).
- `docs/SAFE_QA_CHECKLIST.md` : checklist QA signable (vérif technique + parcours avocat/assistant + étanchéité + note de déploiement).
- `prisma/seeds/demo-cabinet.mjs` (+ `npm run seed:demo`) : cabinet de démo reproductible — duo avocat/assistante, clients, dossiers, temps, document final, acte urgent, messages navette. Idempotent (clés stables + `sourceRef`). Données financières (factures/paiements/fidéicommis) à peupler via l'UI (schémas riches + meilleure démo). Syntaxe vérifiée ; À VALIDER contre une base au premier run.

## Non fait (volontaire / à confirmer)
- **Push officiel** : NON exécuté (action sortante, à confirmer par le CEO).
- Nettoyage lint (cosmétique, pré-existant, post-pilote).

## Rappel déploiement
La migration `20260623130000_navette_p5_types` (Phase 5, additive) doit être appliquée AVANT le déploiement du code P5.

## Bilan calendrier
Phases 1 (design + sécurité) · 2 (onboarding) · 3 (compta vendable) · 4 (fermeture dossier) · 5 (connexion navette) · 6 (cohérence nav) · 7 (démo + QA) : **toutes livrées**. Chaque phase fonctionnelle (3-7) comprise → construite → revue de façon adversariale.
