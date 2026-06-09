# Journal — 2026-06-09 — Refonte navigation consultant + dashboard console

> Mode PRÉCHAUFFAGE (J+6/92). Session de build console SAFE Inc.

## Buildé

### Dashboard console refait (`app/(app)/console/page.tsx`)
- 4 zones : ancre (phase J+X/90 + barre progression), bloc Cliente pilote (Derisier),
  4 KPIs momentum (jours restants, cabinets actifs, pipeline chaud, activités 7j),
  2 colonnes (« Qui toucher aujourd'hui » + « Ce qui s'est passé »).
- Remplacé le « MRR » vanity par « Activités 7 jours » (honnête en préchauffage).
- Corrigé les accents français manquants.

### Provisioning SAFE Inc. (dog food)
- Cabinet `SAFE` + user CEO provisionnés en base via `prisma/seeds/safe-inc.mjs`.
- Ajout `stripeSubscriptionStatus: "active"` au seed pour passer le garde d'abonnement
  (SAFE Inc. utilise son propre produit, pas de Stripe requis).

### Refonte navigation (spec CONSOLE_CONSULTANT_REFACTOR_v1)
- **Chantier 1** — Menu unifié consultant. Flag `isSafeInc` (layout → AppChrome → Header).
  En mode SAFE Inc. : une seule barre (Tableau de bord · Clients · Pipeline · Finances · Support · Paramètres).
  Disparu : menu cabinet (Pratique, Outils, fidéicommis, dossiers, employés), 2e barre ConsoleNav, widget support.
- **Chantier 2** — Fiche cabinet riche `/console/clients/[id]` : profil, pratique & rémunération,
  audit gratuit (score + piliers + lien rapport), scoring CRM, abonnement, conformité fidéicommis,
  activation & accès (liste des comptes), contacts, timeline, notes. Ancienne `/console/leads/[id]` → redirige.
- **Chantier 3** — Finances consultant (niveau menu) : fidéicommis retiré, « Temps » relabellisé
  « Services de consultant », Facturation + Comptabilité gardées.
- **Chantier 4** — Pipeline repensé : 4 colonnes (À engager · En conversation · Audit & décision · Clients)
  au lieu de 13. Chaque carte : nom + score + stage précis + **prochaine action**. Bascule Tableau / Liste.

## Décidé (CEO)
- Menu cabinet remplacé entièrement (pas fusionné) en mode SAFE Inc.
- Onglet Audits fusionné dans la fiche client (section Conformité).
- Fiche cabinet construite en vue complète d'un coup.

## Observé / à suivre
- Le serveur dev (Turbopack) a planté 2-3 fois sous recompilations lourdes ; relances OK.
- **Reste à faire** : (1) backend du bouton « Activer le cabinet & créer les accès » (création
  comptes + invitations, sensible, à câbler proprement) ; (2) reframe du contenu de la page `/temps`
  en « services de consultant » (le menu est relabellisé mais la page garde l'UI juridique) ;
  (3) 16 erreurs TS pré-existantes dans `employees/` + `payroll/` (dérive schéma `EmploymentType`,
  hors périmètre, modules masqués en mode consultant).

## Fichiers touchés
- `app/(app)/console/page.tsx`, `app/(app)/console/clients/[id]/page.tsx` (nouveau),
  `app/(app)/console/clients/page.tsx`, `app/(app)/console/leads/[id]/page.tsx` (→ redirect),
  `app/(app)/console/pipeline/page.tsx`, `app/(app)/console/layout.tsx`, `app/(app)/layout.tsx`
- `components/layout/Header.tsx`, `components/layout/AppChrome.tsx`,
  `components/console/pipeline/PipelineBoard.tsx`
- `prisma/seeds/safe-inc.mjs`
- `docs/product/CONSOLE_CONSULTANT_REFACTOR_v1.md` (spec)
