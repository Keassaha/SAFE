# 2026-06-26 — Vraies captures de l'app intégrées à la vitrine

Objectif : enrichir les animations de la landing avec de **vraies images de l'application**
(pas des rendus IA, qui étaient faux : euros, RGPD, fautes). Contrainte CEO : ne pas
survendre, ne pas exposer de données client réelles (Dérisier), ne pas polluer la prod.

## Méthode : base locale jetable, zéro risque prod
1. `brew install postgresql@16` + Postgres local sur **port 5433**, base `safe_shots` (jetable).
   Piège macOS : `FATAL: postmaster became multithreaded` → résolu en exportant `LC_ALL=en_US.UTF-8`.
2. `prisma migrate deploy` sur la base locale (toutes les migrations à neuf).
3. Seed `prisma/seeds/demo-cabinet.mjs` (Cabinet Démo SAFE, avocat `camille.demo@safecabinet.ca`).
4. Nouveau **`scripts/seed-demo-financial.ts`** : appelle les VRAIS services
   (`createDraftFromBillableItems` → `issueInvoice`, `createPayment`, `createTrustDeposit/Withdrawal`)
   → journal + KPI cohérents. Données : facture 2026-001 payée (1 106,64 $), 2026-002 impayée
   (3 621,71 $), 2026-003 impayée (316,18 $), fidéicommis global 16 000 $.
5. Nouveau **`scripts/capture-app-shots.mjs`** : Playwright (chromium déjà installé), login
   automatisé (`#cabinetName`/`#email`/`#password`), capture 1440×900 @2x de `/tableau-de-bord`,
   `/facturation`, `/comptabilite`, `/comptes`, détail facture. Nettoie le DOM avant capture
   (bandeau d'alerte, indicateur dev Next, alertes de conformité non traduites).
6. Captures rangées dans **`public/images/app/`** (comptabilite, facture, fideicommis, facturation, dashboard).
7. Démontage : Postgres arrêté, serveur dev arrêté, fichiers temp supprimés. Prod intacte (jamais touchée).

## Intégration vitrine
- **`components/landing/ui/BrowserFrame.tsx`** : cadre « fenêtre » réutilisable (next/image).
- **Hero** : image produit (compta lisible) animée sous le hero.
- **`components/landing/ProduitEnVrai.tsx`** : section « En vrai — Pas une promesse », 3 captures
  (facture / fidéicommis / suivi) en layout alterné, révélées au scroll. Câblée après FeaturesGrid.
- Vérifié : `tsc` rc=0, 679 tests verts, rendu Playwright OK, aucune erreur console.

## Bugs réels découverts au passage (à traiter un jour, hors périmètre)
- `prisma/seeds/demo-cabinet.mjs` utilisait `type: "litige"` (invalide) → corrigé en `litige_civil`.
- `TrustReconciliationBanner` et alertes fidéicommis s'affichent **en anglais** quand le cabinet
  n'est pas détecté « Québec » (le cabinet démo n'avait pas de province). Chaînes non traduites
  côté FR. Masquées pour les captures, mais le bug subsiste dans l'app.
- Le module **Comptabilité** est interdit au rôle `avocat` (RBAC : admin_cabinet / comptabilite
  seulement). Un avocat solo propriétaire doit être `admin_cabinet` pour voir sa compta. À vérifier
  côté onboarding réel (le propriétaire d'un cabinet doit avoir le bon rôle).

## Reste
- Le badge dev Next et l'« Aide » flottante : absents en prod, non bloquants.
- `public/images/app/dashboard.png` non utilisée dans la landing (le tableau de bord mène par la
  navette/onboarding, moins vendeur). Conservée comme asset.
