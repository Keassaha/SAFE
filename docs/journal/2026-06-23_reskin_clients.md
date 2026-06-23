# 2026-06-23 — Re-skin écran clients (Task 4, design safe-interface)

Serveur de référence unifié sur le **3010** (le 3001 démarré par erreur a été coupé). DB Supabase de retour (db-check 200).

## Buildé et vérifié en live (3010)
- **Cartes KPI clients** (`ClientSummaryCards`) re-skinnées en `si-*` : cartes `si-surface` + `si-line`, labels uppercase `si-muted`, valeurs en **GeistMono** `si-ink`, sous-texte « % du total » en `si-verified`. Remplacé les **4 verts différents** (`green-100`, `status-success`, `green-50`...) par une **seule pastille forêt calme** (`si-forest` à 6 %).
- **Table clients** (`ClientTable`) re-skinnée : en-têtes de tri `si-muted` → hover `si-forest`, fond d'en-tête albâtre, avatars cercle albâtre/initiales forêt, noms `si-ink` (hover forêt), courriels en lien forêt, montants en **mono** `si-ink`, lignes hover albâtre, vue mobile en cartes `si-surface`. Actions de ligne alignées (voir = forêt, dossiers = vérifié, archiver = ambre).
- Tokens confirmés par styles calculés : valeur KPI `rgb(31,42,36)` GeistMono, label `rgb(90,102,95)`, pastille `rgba(11,31,25,0.06)`, lien courriel `rgb(11,31,25)`, montant GeistMono.
- Vérifié desktop 1320px (table complète) et mobile 375px (cartes empilées + cartes clients). Zéro erreur console. `tsc` exit 0. Aucun token ancien résiduel dans les deux fichiers.
- Vérification via route jetable `/ds-preview/clients` (données fictives FR, sans DB/auth), capturée puis supprimée. Méthode imposée par l'absence de session (pas d'identifiants, et on n'entre pas d'identifiants).

## MAJ — écran liste clients TERMINÉ (même session)
Décision CEO : finir l'écran. Fait et vérifié en live (3010, route jetable) :
- `ClientSearchBar`, `ClientFilters`, `ClientPagination` re-skinnés en `si-*` (champs `si-surface`/`si-line`, focus forêt, hover albâtre, liens/pagination forêt).
- Page `app/(app)/clients/page.tsx` : remplacé **localement** la bannière dégradé vert foncé (`PageHeader` défaut) par un en-tête si calme (titre serif `si-ink` + description `si-muted` + actions), et la coque `Card`/`CardHeader`/`CardContent` partagée par la `Card` ds-safe (titre serif `CardTitle`). Primitives globales non modifiées.
- **Défaut mobile corrigé** : dans l'en-tête de carte, recherche + filtres se chevauchaient sur 375px → recherche pleine largeur puis filtres en dessous (`flex-col` mobile, `flex-row` desktop). Vérifié.
- tsc exit 0, zéro token ancien dans les 6 fichiers liste + page.
- Revue adversariale multi-agents lancée (workflow `reskin-clients-review`) sur les 7 fichiers : logique préservée, classes Tailwind, a11y/contraste, cohérence.

## Périmètre volontairement non touché
- Primitives partagées (`Button`, `StatusBadge`, `EmptyState`) : réservées à la bascule globale finale.
- `ClientSuccessBanner` (bandeau succès transitoire) et `ClientCreateModal`/`ClientCreationWizard` (trigger + modal de création) : tokens anciens, à grouper avec le re-skin du flux de création.
- **Page profil client `[id]`** (≈14 composants : ClientOverview, ClientBilling, ClientTrustAccount, ClientCases, ClientCompliance, ClientDossierFinancier, ClientProfileTabs, etc.) : écran DISTINCT, non visé par « écran liste ». Cible de re-skin à part (proche du chantier dossier).

## Reste sur Task 4
- Écran profil client `[id]` (gros, ≈14 composants).
- Écrans suivants : dossier, comptabilité, facture, courriels.
- Re-skin du flux de création client (modal/wizard) + `ClientSuccessBanner`.
- Retirer la route redondante `/tableau-de-bord/apercu`.
- Bascule finale des tokens globaux (`si-*` → globaux).

## Prochaine action
- Décider l'écran suivant : profil client `[id]`, ou **dossier**. Recommandation : dossier (cohérent avec la colonne vertébrale navette), puis revenir aux profils.
