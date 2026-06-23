# 2026-06-23 — Phase 1 (exécution Claude Code) : progression

## Buildé et vérifié
- **Task 1 — Rate-limit PDF audit public** : `app/api/audit-gratuit/[id]/pdf` limité à 10/min/IP avant la génération Playwright. tsc vert.
- **Task 3 — Équivalence facture + presenter unique** : la route JSON publique orpheline délègue désormais à `presentInvoice` (fin de la divergence). 4 tests de contrat ajoutés (le presenter surface les totaux persistés, ne recalcule jamais). Constat vérifié : aperçu/PDF/courriel/page publique passaient DÉJÀ tous par `presentInvoice` ; le risque était plus petit que l'audit le craignait.
- **Task 2 — Gating console via `User.isInternal`** : migration additive `20260623120000_add_user_is_internal` créée ET appliquée à la base (feu vert CEO). Gating basculé sur `isSafeInternalUser(userId)` avec repli transitoire cabinet "SAFE". Admin SAFE Inc. flagué interne. Vérifié en base : seul jeremie@safecabinet.ca est interne ; les comptes Derisier ne le sont pas.
- Exclusion `docs/propositions` dans tsconfig (le projet safe-interface copié cassait le type-check).
- Global : `tsc` exit 0, **648/648 tests verts**.

## Découvertes notables
- **`.env` a des identifiants de base PÉRIMÉS** (P1000 auth failed) ; `.env.local` a les bons (l'app tourne dessus). Le CLI Prisma ne lit que `.env`. À réconcilier dans le cadre de la rotation des secrets (Task 5). Migration appliquée en passant les creds de `.env.local`.
- Doublon de compte Derisier avec faute de frappe : `aalyiah@derisierlaw.com` ET `aaliyah@derisierlaw.com`. Hygiène de données à vérifier (hors périmètre Phase 1).

## Reste Phase 1
- Task 4 — Adopter le design system safe-interface (gros chantier).
- Task 5 — Rotation des secrets (action CEO) + réconcilier .env / .env.local.

## Prochaine action
- Sur go : démarrer Task 4 (adoption design). C'est le plus gros ; mérite un découpage et une revue.
