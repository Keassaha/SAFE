# 2026-06-23 — Phase 4 : fermeture de dossier

Theme calendrier : « un dossier peut être fermé proprement ou au minimum alerter sur ce qui manque ».
Branche `release/2026-06-11-compta-admin-derisier`. tsc + 648 tests verts. Méthode : ultracode (workflows).

## Méthode
1. **Workflow compréhension** (6 lecteurs parallèles + synthèse) : a révélé que presque toute l'infra existait déjà mais n'était PAS câblée.
2. Build P0 inline.
3. **Workflow revue adversariale** (4 dimensions, chaque trouvaille vérifiée) : 8 trouvailles confirmées, toutes corrigées avant commit.

## Constat clé (compréhension)
- Statut `cloture` déjà dans l'enum `DossierStatut` ; `Dossier.dateCloture`/`retentionJusqua`/`soldeFiducieDossier` déjà présents ; modèle `DossierClosure` complet mais JAMAIS écrit ; services de garde-fou monétaire réutilisables (`getTrustBalance` accepte `dossierId`) ; route lettre de fermeture PDF complète mais jamais appelée ; onglet « fermeture » = stub 28 lignes.
- **Conséquence : P0 = câblage + garde-fous + UI, AUCUNE migration.**

## Buildé (P0)
- `lib/services/dossiers/closure-blockers.ts` : `getDossierClosureBlockers` (factures impayées, débours non recouvrés, solde fidéicommis), scopé cabinet.
- `lib/dossiers/retention.ts` : `computeRetentionUntil` (même source que la lettre : `CabinetInterface.modules.pipeda.retention`).
- `closeDossier` (actions.ts) : blocage dur si fiducie négative (non acquittable, B-1 r.5), alerte acquittable sinon ; trace `DossierClosure` + `AuditLog` + `dateCloture` + `retentionJusqua` ; retourne un résultat (pas de redirect).
- `app/api/dossiers/[id]/closure-blockers/route.ts` : GET bloquants + état de fermeture.
- `DossierDetailFermeture` réécrit : react-query, Alert (warning/destructive/info), modal de confirmation avec case d'acquittement, lettre PDF.
- Anti-fermeture silencieuse : garde-fou serveur `updateDossier` (redirect si transition vers `cloture` hors flux) + option `cloture` masquée du `DossierForm`.

## Décisions (CEO 2026-06-23)
- Facture impayée / débours / fonds à restituer = ALERTE acquittable ; solde fidéicommis négatif = BLOCAGE DUR.
- Reçu/lettre : on expose la lettre PDF existante (consultable + imprimable).

## Corrections issues de la revue adversariale
- IDOR : `closeDossier` update Dossier scopé `{ id, cabinetId }` (était `{ id }`).
- Scope cabinet ajouté à l'agrégat `DeboursDossier`.
- Source du solde fiducie de la LETTRE unifiée sur `getTrustBalance` (était `TrustAccount.currentBalance`, risque d'incohérence avec l'alerte) + scope client.
- N° de Barreau du cabinet retiré de la lettre client (`barreauNumero: null`) — règle CEO.
- Em-dashes retirés du PDF (lignes titre/footer) + fallbacks (`"—"` → `""`).
- Confirmé correct : hard block = fiducie négative seulement (conforme).

## Reste (P1, différé)
Checklist structurée, persistance de la lettre, réparation envoi email (mapping cassé), motif de fermeture + `letterSentAt` (migration additive), rappel destruction J-90, immutabilité documents post-fermeture.
