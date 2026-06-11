# 2026-06-09 — Onboarding cabinet potentiel CAYARD AVOCAT (Québec)

## Contexte
Prospect issu de l'audit `rapport-audit-CAYARD-AVOCAT.pdf` (réf. A 2026 0609 CMQ).
Objectif : interface cabinet opérationnelle de test, calquée sur Derisier mais
**simplifiée** (solo, sans couche assistante), pour démo rapide. Pas de landing,
pas de nouvelle architecture.

## Buildé
- `scripts/seed-cayard.mjs` — seed/config idempotent (cabinetId `cayard-avocat-qc-2026`),
  calqué sur `rebuild-derisier-from-audit.mjs`. Supporte `--dry-run`. Charge `.env.local`
  en priorité (Prisma via node ne lit que `.env`).
- `scripts/verify-cayard-delivery.mjs` — 36 vérifs lecture seule (interface, conformité QC,
  données démo, garde-fou Derisier). **36/36 PASS.**
- `package.json` — scripts `seed:cayard`, `verify:cayard`.
- Données démo : 3 clients, 4 dossiers (immigration EE, famille/divorce, litige civil,
  aide juridique), 3 factures forfait (1 payée + 2 impayées), 1 mouvement fidéicommis 3000$,
  1 vérif de conflit. Données d'audit (15 811$/an, 2.1 h/sem, 2 users, 10-30 dossiers) dans
  `Cabinet.config.onboardingAudit`. Taxes QC TPS 5% / TVQ 9.975%. Essai 30j (`trialing`).

## Décidé
- Couche assistante retirée via `ongletsMasques: ["file-assistante","employees","mes-heures"]`
  (le whitelist `ongletsActifs` ne filtre QUE le top-level ; les enfants ne se coupent que
  par le blacklist). Aucun user `assistante`, aucun wording « assistante ».
- Données d'audit stockées en config JSON plutôt que hardcodées (dashboard data-driven).

## Observé / corrigé (conformité)
- **Bug conformité** : `TrustReconciliationBanner` codait en dur « LSO By-Law 9 » (Ontario) en
  anglais, affiché tel quel à un cabinet **québécois**. Rendu sensible à la province :
  QC → Règlement B-1, r.5 (Barreau du Québec) en français ; défaut (ON) inchangé → Derisier
  préservé. Touche `TrustReconciliationBanner.tsx`, `AppChrome.tsx`, `app/(app)/layout.tsx`,
  `lib/cabinet-config.ts` (ajout `province?`).
- Reste (hors périmètre, à planifier) : d'autres chaînes anglaises/Ontario sur `/comptes`
  (ReconciliationAlert, LSOReportGenerator) à localiser pour QC.

## Vérifié
- `npm run build` : **exit 0**, compiled successfully.
- Pages Cayard 200 : tableau-de-bord, clients, dossiers, facturation, comptabilité, comptes,
  conformité, rapports, édition, temps, paramètres. Nav sans item assistante.
- Facturation : TPS/TVQ (pas de HST), facture en retard signalée. Fidéicommis : solde 3000$.
- Derisier intact : couche assistante préservée (1 user assistante), plan cabinet, distinct.

## Identifiants de test
- Cabinet : `Entreprise individuelle (CAYARD AVOCAT)` · `contact@cayard-avocat.ca` / `CayardAvocat2026!`

## Localisation fidéicommis Québec (2e passe, même jour)
Demande CEO : tout l'app doit citer le Barreau du Québec pour un cabinet QC, pas seulement la
bannière ; « trust account » → « compte en fidéicommis » en français ; règles sourcées (pas inventées).

Règles sourcées depuis la KB interne (Delivery Syst/knowledge-base + 09 - Droit) :
- Réglementation : Règlement B-1, r. 5 (Barreau du Québec). Rapprochement mensuel à trois voies, certifié.
- GARDE-FOU : le délai « 25 jours » est propre à l'Ontario (LSO By-Law 9), NON confirmé pour le QC dans
  la KB → jamais affiché côté QC. Voir détails et zones INCERTAIN dans l'analyse de session.

Infra créée (province-aware, défaut ON inchangé → Derisier préservé) :
- `lib/trust/regulator.ts` — terminologie fidéicommis par province (QC ↔ ON), helper pur.
- `lib/cabinet/get-province.ts` — lit Cabinet.config.province (server).
- `components/providers/CabinetProvinceProvider.tsx` — contexte client `useCabinetProvince()`, branché dans AppChrome.

Écrans localisés (QC → FR/Barreau du Québec ; ON → EN/LSO) :
- Pages : comptes/rapprochement, comptes/rapports, conformite, securite (PageHeaders + texte).
- Composants : ReconciliationAlert, ReconciliationWorkflow (titre/statut/certification),
  LSOReportGenerator (titre/desc/relevé/intérêts/3-voies), ComplianceDashboard, FideicommisDashboard (boutons).
- Catalogue FR : `messages/fr.json` — trustOkDetail / trustNeverReconciledDetail / cabinetBarreauNumber
  ne disent plus « LSO Bylaw 9 ».

Vérifié : `npm run build` exit 0 · i18n parité 3084/3084 · scan live 7 pages in-app (dashboard, comptes,
rapprochement, rapports, conformité, sécurité, facturation) = ZÉRO « LSO » visible · 0 erreur console.
Derisier (EN/ON) inchangé : tombe sur la branche LSO par défaut.

Reste (hors périmètre, plus profond) : libellés de formulaire/tableaux entièrement anglais dans
ReconciliationWorkflow et LSOReportGenerator (Bank Statement Balance, en-têtes de table, options
Monthly/Quarterly/Annual) ; PDFs (ImmigrationMandatePDF) ; page interne console/audits. À traduire dans
un 2e temps. Zones réglementaires INCERTAIN à valider sur LegisQuébec (titre exact B-1 r.5, délai en jours,
seuil espèces, conservation 7 vs 10 ans).

## À confirmer (CEO)
- N° Barreau Cayard (laissé null, jamais sur facture). Courriel provisoire. Vrai nom de l'avocat.
- Valider sur le texte officiel B-1, r. 5 : délai de rapprochement en jours (QC), titre exact du règlement.
