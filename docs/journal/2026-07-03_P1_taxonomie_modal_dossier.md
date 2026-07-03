# 2026-07-03 — P1 : taxonomie configurée branchée au modal de création dossier

Route vers 10/10, premier P1 (différenciateur « configuré pour votre cabinet »).

## Diagnostic
La taxonomie ÉTAIT déjà branchée sur `/dossiers/nouveau` (page complète) : sujets
configurés, sous-matières, numérotation par préfixe. Mais le **modal « Nouveau dossier »**
depuis la liste (chemin le plus courant) rendait `DossierCreationWizard` SANS
`subjectOptions` → retombait sur les 7 types génériques + numérotation legacy `2026-001`.
Cause : `DossierCreateModal` ne recevait ni ne passait la taxonomie ; `app/(app)/dossiers/page.tsx`
ne la chargeait pas.

## Correctif
- `lib/dossiers/cabinet-dossier-taxonomy.ts` : helper serveur unique
  `getCabinetDossierTaxonomyOptions` + dérivation pure `deriveTaxonomyOptions` (localisée).
  Source unique partagée par la page ET le modal → divergence impossible.
- `DossierCreateModal` : props `subjectOptions/submatterOptions/cabinetBillingMode` propagées au wizard.
- `dossiers/page.tsx` : charge la taxonomie + billingMode, passe aux 2 modals (liste + empty state).
- `dossiers/nouveau/page.tsx` : refactorée sur le même helper (fin de la double dérivation).

## Vérifié à l'écran (Cabinet Test = profil Dérisier)
- Modal affiche les 9 sujets configurés (Immobilier, Immigration, Aide juridique Ontario,
  Service ponctuel, Divers, Testaments & successions, Famille, Affaires, Autres services).
- Dossier créé via le modal → `numeroDossier = 2026-RE-00001`, `matterCode = RE`,
  `type = immobilier` (dérivé). Avant : `2026-001`, matterCode null.
- 720 tests verts (dont 5 nouveaux sur `deriveTaxonomyOptions`), tsc propre.

## Suivi mineur (non bloquant)
Le texte d'aide du wizard affiche encore « ex. 2026-001, 2026-002 » même quand la taxonomie
est active (`matterNumberAutoDesc`). Cosmétique ; à rendre taxonomie-aware quand on touchera
l'i18n de ce module.

## Reste vers 10/10 (P1)
Onboarding qui persiste, fermeture dossier + rétention (blocages/calcul déjà là ; reste
soft-lock listes + job purge), bouton payer sur facture publique, création rapide client.
