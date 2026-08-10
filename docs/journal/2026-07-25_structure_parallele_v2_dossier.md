# 2026-07-25 — Structure parallèle /v2 : page Dossier « Calme opérationnel » branchée sur les vraies données

## Contexte

Le prototype de redesign (worktree `SAFE-redesign`, port 3002, route `/safe-redesign`) était une maquette 100 % simulée. Comparaison faite avec la page Dossier actuelle (3001) : le design du prototype est supérieur (sidebar Linear-style, bandeau financier, onglets, densité), mais tout y était factice.

## Décisions CEO

- Base = repo principal ; le clone `SAFE-redesign` ne sert que de référence de lecture.
- Périmètre = shell complet (sidebar + topbar) + page Dossier.
- Pas de flag de transition : **structure parallèle `/v2`** branchée sur les vraies données, pour juger sur pièces si le design vaut le coup. L'app actuelle n'est pas touchée.

## Ce qui a été construit (5 lots, tout vérifié à l'écran)

Uniquement des fichiers **nouveaux** (`git status` : zéro fichier legacy modifié) :

- `app/(app-v2)/v2/` — layout autonome (auth + garde abonnement dupliquées de `(app)`), `v2.module.css` (copie adaptée du CSS du prototype, resets scopés hors `.legacyEmbed`), ShellV2 / SidebarV2 (permissions par rôle réelles, counts réels) / TopbarV2 (fil d'ariane via contexte CrumbsProvider).
- `/v2/dossiers` — liste réelle (helpers `lib/dossiers/query.ts`), recherche serveur `?q=`.
- `/v2/dossiers/[id]` — onglets pilotés par `?tab=` (Server Component, ne charge que l'onglet actif) : Aperçu (DossierResumeCard + DossierPreparationCard + NavetteThread + DossierResumeIA embarqués tels quels + rail Repères/Échéances/Docs récents), Activité (AuditLog via `lib/dossiers/dossier-timeline.ts`, nouveau), Temps et débours (TimeEntries + débours réels), Facturation (factures réelles + deep-links), Fidéicommis (lecture seule), Documents (RichDocuments + DossierBriefcase).
- `lib/dossiers/financial-summary.ts` — **nouvel agrégateur financier par dossier** (temps non facturé, montant facturable, solde à recevoir, fidéicommis, readyToBillCount) ; alimente le bandeau 4 tuiles. N'existait nulle part avant.
- Drawer « Ajouter du temps » branché sur `POST /api/temps` (seule mutation v1, testée : 201, la tuile passe de 0,03 h → 0,53 h en direct). Les autres actions = deep-links réels vers les écrans existants (rien de simulé).

## Observations

- La cohabitation composants legacy Tailwind ↔ CSS module v2 marche avec un simple wrapper `.legacyEmbed` + resets exclus (`:not(.legacyEmbed *)`). Un seul bug rencontré (texte des boutons pleins), corrigé.
- Le prototype affichait 2 500 $ de fiducie sur ce dossier ; la réalité est 0 $. Bon rappel de la doctrine « brancher avant de bâtir » : les vraies données changent la perception du design.
- Piège date-only UTC (entrée du 25 affichée « 24 juill. ») corrigé en envoyant midi local.

## Reste à faire / dettes assumées

- Français en dur (comme les re-skins récents) : lot i18n si le design est adopté.
- Définition « temps non facturé » (exclut IN_DRAFT_INVOICE) à comparer avec `/facturation/temps-non-facture`.
- Garde d'abonnement dupliquée dans le layout v2 (commentaire en tête de fichier).
- Décision d'adoption : si le CEO garde le design v2, prochain chantier = généraliser le shell aux autres écrans puis basculer la route.

## Vérifications

Browser sur 3001 : liste → détail → 6 onglets, console sans erreur, POST /api/temps 201, mobile 375 px (off-canvas ok), page legacy `/dossiers/[id]` inchangée.
