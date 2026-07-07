# 2026-07-06 — Fidéicommis : les personnes physiques n'apparaissaient plus

Observé au navigateur (cabinet test, page `/comptes`) : dans le modal « Ajouter une transaction »,
le menu déroulant Client ne montrait que 2 clients (Client Démo Inc., Client Rapide Test Inc.).
Le CEO signale « je ne vois pas tous les autres clients ».

## Diagnostic : bug d'affichage, pas de données

Le cabinet a bien **4 clients** en base. Les 2 manquants sont des personnes physiques
(Keassaha Paul, Pierre Porter) : `raisonSociale = null`, `prenom`/`nom` remplis. Or tout le module
fidéicommis affichait `client.raisonSociale` en direct → ces deux-là étaient rendus comme des
`<option>` **vides** (présentes mais sans texte, donc invisibles à l'œil).

Le helper canonique `clientDisplayName` (lib/clients/normalize-name.ts) existait déjà et retombe sur
« prénom + nom » quand `raisonSociale` est absent. Le bug : chaque écran refaisait son propre
affichage au lieu de passer par le helper.

## Corrigé (branché `clientDisplayName` partout dans le module)

- Menus dépôt + retrait : `components/fideicommis/DepotForm.tsx`, `RetraitForm.tsx`
- Filtre + colonne Client de l'historique : `components/fideicommis/TransactionsTable.tsx`
- Relevé PDF : `app/api/fideicommis/releve/route.ts` (fallback `clientDisplayName(c, "") || null`
  pour préserver la relance de requête quand le nom est vide)
- Rapport de conformité LSO : `lib/services/fideicommis/lso-report-service.ts`
- Requêtes serveur/API élargies pour ramener `prenom` + `nom` : `app/(app)/comptes/page.tsx`,
  `app/api/fideicommis/transactions/route.ts` ; types alignés (`lib/hooks/useFideicommis.ts` +
  ClientOption des composants).

Vérifié : `tsc --noEmit` propre, 17 tests `clientDisplayName` verts. Cause confirmée en base
(4 clients dont 2 physiques à `raisonSociale = null`).

## Audit du reste de l'app + propagation (même session)

Le même bug « personne physique = ligne vide » vivait bien au-delà du fidéicommis. Audit lecture seule
(agent) → occurrences classées affichage (à corriger) vs logique/requête (à ignorer). Corrigé partout,
en branchant `clientDisplayName` et en élargissant les requêtes Prisma amont à `prenom`/`nom` :

- **Facturation** : `DeboursAddForm` (menu), `InvoiceCard`, `InvoicePreviewModal`, templates PDF
  `InvoiceTemplate` + `InvoiceTemplateClean`, page `verification`, + sources `facturation/page.tsx`,
  `suivi/page.tsx` (+ type `SuiviPipelineView`). Le chemin PDF/courriel émis avait déjà son helper
  correct (`presentClientDisplayName` dans invoice-presenter), inchangé.
- **Édition** : `AtelierView` (avatar + nom + titre), `DossierAtelierView`, `TerminerDialog`.
- **Temps** : `TimeEntriesTable` + type hook `useTemps` + routes API `temps` et `temps/[id]`.
- **Rapports** : `ReportFilters` (menu client).
- **Export comptable** : `accounting-export.ts` (colonne clientName des exports QB/Xero/CSV).

**Laissés volontairement** : `app/(app)/dossiers/[id]/page.tsx` et `components/clients/ClientDossierPDF.tsx`
ont déjà une logique locale correcte au format formel « Nom, Prénom » (contexte dossier/PDF). Ce n'est pas
le bug, et unifier changerait leur format voulu. Non touchés.

Vérifié après propagation : `tsc --noEmit` propre, 62 tests verts (clients, fidéicommis, services).

## Règle de fond

Tout affichage de nom client passe par `clientDisplayName` (lib/clients/normalize-name.ts), jamais
`raisonSociale` nu. Toute requête qui alimente un affichage de nom sélectionne `raisonSociale + prenom + nom`.
À terme, envisager un lint/garde-fou contre `.raisonSociale` nu dans le JSX.
