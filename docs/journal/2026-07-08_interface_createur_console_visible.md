# 2026-07-08 — Rendre visible l'interface créateur (Console SAFE Inc.)

## Contexte
Le CEO a demandé une « tour de contrôle » pour piloter SAFE Inc. en interne :
accès à l'interface des cabinets sur demande, réception des audits, gestion des
abonnements, dépenses de mise en place, documentation d'impôt. Demande précisée :
**voir en visuel l'interface créateur**, même habillage que l'interface avocat,
mais avec les fonctions du créateur (ex. pas de compte en fidéicommis).

## Observé
- Ce besoin correspond à la **Console SAFE Inc.** déjà spécifiée (CRM_SPEC v1.1 +
  CONSOLE_CONSULTANT_REFACTOR v1.2) et **déjà bâtie à ~70 %** :
  - 18 modèles Prisma en base (migration `20260605210713_add_crm_console`).
  - Pages réelles sous `app/(app)/console/` (dashboard 452 l., clients/[id] 445 l.,
    audits 288 l., safe-lead 322 l., pipeline, support, leads).
  - Bascule menu créateur codée : `Header.CONSULTANT_NAV` s'affiche quand
    `isSafeInc = true` (détection cabinet dog-food « SAFE » via `lib/safe-inc.ts`).
- **Pourquoi le CEO ne l'avait jamais vu** : la base locale `safe_local` était
  vide (pas de cabinet « SAFE », pas d'admin, pas de workspace). Rien à quoi se
  connecter.

## Fait cette session
- Seed `prisma/seeds/safe-inc.mjs` → cabinet dog-food « SAFE » + admin
  `jeremie@safecabinet.ca` (mot de passe dev local `SafeCreateur2026!`).
- Seed `prisma/seeds/crm-workspace-and-leads.mjs` → Workspace SAFE Inc. + 5 leads
  de démo (pipeline visualisable).
- Connexion réussie → `/console` rend l'**interface créateur**.
- Menu créateur confirmé (lecture DOM) : **Tableau de bord · SAFE Lead · Clients ·
  Pipeline · Finances (Facturation / Comptabilité / Services de consultant) ·
  Support · Paramètres**. Aucun fidéicommis, dossier ou employé. ✅

## Défaut trouvé (à corriger)
`components/layout/MobileSidebar.tsx` ne reçoit pas la prop `isSafeInc` (voir
`AppChrome.tsx` : elle est passée au `Header` mais pas au `MobileSidebar`). En mode
créateur, sur écran étroit ou à l'ouverture du tiroir, l'ancien menu **cabinet**
(Pratique, fidéicommis…) réapparaît. Fix : propager `isSafeInc` jusqu'au
`MobileSidebar` et lui faire rendre `CONSULTANT_NAV` comme le `Header`.

## Reste (rappel de la carte des 6 besoins)
- Réception audits, gestion abonnements, dashboard interne : bâtis.
- Dépenses de mise en place + doc d'impôt : bâtis via dog-food (`journal/depenses`,
  `comptabilite`) — à valider en usage réel sur le cabinet « SAFE ».
- **Accès à l'interface des cabinets sur demande (impersonation)** : modèle DB
  `ImpersonationSession` présent, **aucune UI ni route** → seule vraie brique
  manquante de la demande initiale.
