# 2026-06-25 — Audit de vendabilité (vérification fraîche)

Re-vérification de l'état réel, pas une réécriture de l'audit du 21 juin
([SAFE_PRODUCT_READINESS_AUDIT.md](../SAFE_PRODUCT_READINESS_AUDIT.md)) ni du verdict du 24 juin
([SAFE_VENDABILITE_VERDICT_2026-06-24.md](../SAFE_VENDABILITE_VERDICT_2026-06-24.md)). Objectif : confirmer
au code ce qui reste bloquant, et mesurer ce qui a bougé. Branche `release/2026-06-11-compta-admin-derisier`.

## Verdict (inchangé sur le fond, amélioré sur les détails)
**Vendable sur le fond, pas « vendable aujourd'hui tel quel ».** Le cœur (conformité Barreau + flux d'argent)
est solide et le code est sain. Ce qui reste n'est pas un manque de produit : c'est une **mise en service**
(P0 opérationnel) plus **un seul vrai trou produit** (export comptable mappable non branché).

## Preuves fraîches (vérifié au code, 2026-06-25)
- `tsc --noEmit` : **exit 0**.
- Tests : **679 passés / 79 fichiers** (644 le 21 juin → +35). Vert.
- Lint : 59 problèmes pré-existants, masqués par `eslint.ignoreDuringBuilds: true`.
- Taille : 92 routes pages, 93 routes API, 91 modèles Prisma.

## Ce qui a été refermé depuis le 24 juin
- **P1#5 Fonctions IA** : commit `29e0f90` masque le résumé IA tant que `ANTHROPIC_API_KEY` absente
  (`app/(app)/dossiers/[id]/page.tsx`). Plus d'échec silencieux visible côté cabinet.
- **B5 Console interne** : `User.isInternal` existe désormais (`prisma/schema.prisma:101`, `lib/safe-inc.ts:35`).
  Le gating ne dépend plus uniquement du nom de cabinet. (La rotation des secrets reste non vérifiable au code.)

## Travail compta non commité (working tree, 8 fichiers + 4 nouveaux)
Refonte « comptabilité lisible par des avocats » (cf. [2026-06-24_compta_lisible_avocats.md](2026-06-24_compta_lisible_avocats.md)) :
- `lib/accounting/movement-semantics.ts` (couche sémantique pure, réutilise `isTrustEntry`, zéro recalcul).
- `MovementsTable` / `SummaryCard` / `MovementLegend` + vue simplifiée 6 KPI + toggle Lisible/Expert.
- Durcissement `payment-allocation-service.ts` (+111 l, `resolveInitialAllocationAmount`, gardes) + test (+56 l)
  → adresse C5 (paiements orphelins).
- **Non commité** : à committer pour que ça compte dans la prochaine release.

## Blocages encore OUVERTS
### P0 — Opérationnel (non vérifiable au code, à confirmer en prod)
1. Connexion prod cassée (`safecabinet.ca`) — base répond `{"ok":true}`, donc compte/mot de passe.
2. Données de test en prod (client « Test » / ptiahou@gmail.com) polluant les KPI — script de suppression prêt.
3. Confirmer build déployé + migration `20260623130000_navette_p5_types` appliquée.

### P1 — Produit (le seul vrai trou)
4. **Export comptable mappable NON branché — confirmé.** `exportAccountingPeriodAction`
   (`app/(app)/journal/general/actions.ts:228`, QB/Xero/Sage, double-entrée balancée, testé) **n'est appelé
   nulle part dans le repo**. L'UI n'expose que `exportJournalAction` → CSV plat. Effort : brancher un bouton.

### P2 — Polish (non bloquant)
Lint (59), doublons de routes (3 portes heures, 3 portes compta), couleurs ad hoc, 0 test E2E (Playwright installé).

## Distance à la vente
- **Pilote founder** : lever P0 (jours, surtout opérationnel) + committer le travail compta + brancher l'export (P1#4).
- **Vente publique encadrée** : ajouter la consolidation des doublons + démo pré-remplie (semaines).

*Aucun code modifié pendant cet audit. Vérifications uniquement.*
