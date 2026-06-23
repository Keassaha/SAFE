# SAFE — Audit de préparation produit (Product Readiness)

**Date :** 2026-06-21
**Branche analysée :** `release/2026-06-11-compta-admin-derisier`
**Dernier commit :** `16f6893 fix(compta): durcit ecritures et corrige flux facturation`
**Méthode :** lecture du code (routes, services, schéma Prisma, composants), 5 explorations ciblées en parallèle, vérifications directes (`tsc`, tests, git, env, onboarding).

> Cette version v2 remplace le brouillon du matin. Elle corrige deux affirmations erronées repérées en vérification : (1) le `.env` n'est PAS commité dans git, (2) il existe deux « onboarding » distincts qu'il ne faut pas confondre.

---

## 1. Résumé exécutif

SAFE n'est pas un MVP fragile. C'est une plateforme juridique avancée qui couvre déjà clients, dossiers, documents, édition, temps, forfaits, débours, facturation, paiements, fidéicommis, comptabilité opérationnelle, rapports, import, employés, rôles, onboarding marketing, audit gratuit et console interne. Le code compile (`tsc` exit 0), les tests passent (644 tests verts), la parité i18n est parfaite (3131 clés FR/EN).

Le diagnostic n'est donc plus « est-ce que ça marche ». C'est : **est-ce cohérent, fiable et présentable à un vrai cabinet sans accompagnement**. Et là, trois familles de problèmes ressortent :

1. **Parcours de premier usage cassé.** Un cabinet neuf qui se connecte tombe sur des écrans vides sans guidage. La page `app/onboarding/page.tsx` ne persiste rien. Le produit ne se « met pas en route » tout seul.
2. **Fiabilité facture non prouvée formellement.** Preview UI, PDF et facture publique partagent bien la même source de calcul, mais rien ne le garantit par test. C'est le point le plus sensible commercialement (un avocat ne pardonne pas un écart de montant).
3. **Surface produit trop large et trop manuelle par endroits.** Doublons de concepts (3 routes pour « les heures », 3 portes vers la comptabilité), modules à moitié esquissés (paie, impersonation, console) exposés au même niveau que les modules matures.

| Niveau de vente | Verdict |
| --- | --- |
| Démo interne / pilote accompagné | ✅ Prêt avec encadrement |
| Vente pilote à un cabinet connu (founder) | ⚠️ Possible après les 6 correctifs bloquants ci-dessous |
| Vente publique autonome | ❌ Pas encore (parcours + preuves de fiabilité) |
| Produit enterprise / compliance large | ❌ Trop tôt |

**Les 6 correctifs bloquants** (détaillés §4) : onboarding qui persiste, écrans vides guidés, test d'équivalence facture (preview = PDF = public), fermeture de dossier réelle, rotation des secrets + masquage console interne, rate-limit sur le PDF d'audit public.

**Estimation honnête :** 2 à 3 semaines de stabilisation ciblée pour atteindre le seuil « vente pilote founder », 6 à 8 semaines pour « vente publique encadrée ».

---

## 2. Philosophie produit de SAFE

La promesse la plus forte, lisible dans le code :

> SAFE permet à un avocat solo ou à un petit cabinet de fonctionner comme une structure professionnelle complète, sans équipe administrative lourde et sans bricoler entre Clio, QuickBooks, Excel, Drive et une boîte courriel.

Ce que SAFE **est réellement** dans le code : un **système d'exploitation de cabinet juridique** centré sur le flux `client → dossier → temps/forfait/débours → facture → paiement → fidéicommis → conformité`. La comptabilité y est une **comptabilité juridique opérationnelle avec export externe** (journal mono-axe append-only, double-entrée générée seulement à l'export QB/Xero/Sage), pas un grand livre comptable général.

Ce que SAFE **ne doit pas prétendre être** : un CRM, un clone de Clio, un QuickBooks juridique, un outil IA générique.

**Problème de cohérence de la promesse :** l'interface ne raconte pas encore cette histoire. Les modules sont juxtaposés (18 entrées de menu) au lieu d'être enfilés dans un parcours. Un cabinet ne « sent » pas le fil conducteur. La philosophie est dans le code et dans les docs, pas encore dans l'UX.

**Maturité par perception :**

| Perçu comme mature | Perçu comme expérimental |
| --- | --- |
| Facturation, fidéicommis, journal, RBAC, import, navette avocat-adjointe | Onboarding in-app, fermeture dossier, paie, console SAFE Inc., impersonation, capacités IA |

---

## 3. État actuel par module

Légende maturité : 🟢 mature / 🟡 fonctionnel à finir / 🟠 esquissé / 🔴 stub ou absent.

| Module | Maturité | Constat principal |
| --- | --- | --- |
| **Auth / RBAC** | 🟢 | Matrice 7 rôles × 12 modules appliquée server-side, gardes de page + d'API, tests (`lib/auth/rbac.ts`, `lib/auth/page-guard.ts`). Aucun IDOR détecté sur l'échantillon. |
| **Clients** | 🟢 | Wizard 6 étapes, conflict-check temps réel, détection de doublon, vérification d'identité réelle (`ClientIdentityVerification`). FINTRAC/antécédents = champs de données, pas de logique de vérification. |
| **Dossiers** | 🟢 | Wizard, taxonomie optionnelle + fallback `AAAA-NNN`, cartable auto-généré, spécificités immobilier/immigration (champs présents, guidage procédural faible). |
| **Documents / Édition** | 🟡 | Éditeur TipTap + versions immuables solides. Mais **architecture documentaire éclatée** : 5 concepts concurrents (upload `Document`, `RichDocument`, `DossierPiece`, `DossierProcedure`, pièces jointes facture). L'utilisateur ne sait pas où ranger une preuve. |
| **Temps / honoraires** | 🟢 | `TimeEntry` avec cycle de vie complet (`NON_BILLED → READY_TO_BILL → IN_DRAFT_INVOICE → BILLED`). Logique solide, mais 3 portes d'accès (`/temps`, `/mes-heures`, `/fiches-de-temps`). |
| **Forfaits** | 🟢 | `ForfaitService` (catalogue) + `RegistreTache`, séparation claire d'avec l'horaire, transaction de facturation testée. |
| **Débours** | 🟢 | Cycle taxable/non-taxable, statuts `NON_FACTURE → FACTURE → RECOUVRE/RADIE`. Pas d'écran central « débours à refacturer ». |
| **Facturation** | 🟡 | Pipeline brouillon → validé → émis → encaissé complet et relié. Numérotation séquentielle sans trou. **Manque : preuve formelle d'équivalence preview/PDF/public.** |
| **Paiements** | 🟡 | Fiable mais manuel (3-4 clics : créer paiement puis allouer). Allocation non forcée → risque de paiements orphelins. Stripe/Interac/1-clic = planifiés, **non implémentés**. |
| **Fidéicommis** | 🟢 | Garde-fous réels : jamais via processeur, plafond espèces 7500 $, blocage solde négatif sous verrou advisory PostgreSQL, anti-commingling, verrouillage de période, certification LSO/By-Law 9, réconciliation 3-way. |
| **Comptabilité** | 🟢 | Journal mono-axe append-only, corrections par entrées séparées, idempotence (sourceModule + sourceId), KPIs lus depuis la DB. Export QB/Xero/Sage présent. |
| **Taxes** | 🟢 | TPS/TVQ (QC) et HST (ON) par cabinet, par ligne. |
| **Créances / aging** | 🟢 | `receivables-aging.ts` (0-30/30-60/60-90/90+). Intérêts de retard : service présent mais **non auto-calculé**. |
| **Rapports** | 🟡 | Présents (rentabilité dossier, remise de taxes, monitoring fiducie). À cadrer côté présentation. |
| **Import** | 🟢 | MVP réel et utilisable : 5 types (clients, dossiers, temps, relevé bancaire, journal), détection de colonnes, preview, historique. Utilisable par un vrai cabinet, pas qu'un outil de migration. |
| **Employés / RH** | 🟠 | CRUD employés + year-end T4/T4A (PDF réel). **Manque : création de paie (`Payslip`), saisie d'heures, calcul de retenues.** C'est un MVP RH, pas un moteur de paie. |
| **Gestion / navette** | 🟢 | Doctrine assistante prépare / avocat décide, permissions navette testées. Utilisable. |
| **Onboarding in-app** | 🔴 | `app/onboarding/page.tsx` : formulaire client-side sans handler de soumission, ne persiste rien. À ne pas confondre avec le funnel d'audit public (`/api/onboarding`, qui envoie des emails). |
| **Console SAFE Inc.** | 🟠 | Leads/clients/support fonctionnels mais **accès hard-codé sur `cabinet.nom === "SAFE"`** (`lib/safe-inc.ts`). Interne seulement. DRAFT v1.1. |
| **Impersonation** | 🔴 | Modèle Prisma `ImpersonationSession` présent, **zéro implémentation** (ni route, ni UI, ni audit trail effectif). |
| **Capacités IA** | 🟠 | 1ère brique (classification doc + résumé dossier) codée avec garde-fous, mais `ANTHROPIC_API_KEY` présente en local seulement et jamais testée en conditions réelles. |
| **Design system** | 🟡 | Tokens complets (`lib/ds/tokens.ts`), mais application hétérogène (~587 couleurs ad hoc vs tokens), pas de composant `Input`/`FormField` unifié. |

---

## 4. Problèmes bloquants (avant toute vente)

> Un « bloquant-vente » est un point qui, devant un vrai cabinet, casse la confiance ou le parcours dès la première heure.

### B1 — Onboarding in-app ne persiste rien 🔴
`app/onboarding/page.tsx` est un formulaire 5 étapes sans soumission (aucun `fetch`/action/`use server`). Un cabinet qui le remplit croit avoir configuré son compte et son premier client : rien n'est sauvegardé.
**Nuance vérifiée :** `/api/onboarding/route.ts` existe mais sert le **funnel d'audit public** (emails à Jérémie + prospect via `calculateOnboardingValue`), pas la mise en route du cabinet. Ne pas confondre.
**Correctif :** créer un vrai flux de mise en route qui persiste (cabinet, profil, premier client, config taxes/facturation) puis redirige vers un tableau de bord non vide. Effort : 2-3 jours.

### B2 — Écrans vides sans guidage pour cabinet neuf 🔴
`tableau-de-bord`, `clients`, `dossiers`, `facturation` affichent des KPI à « 0 $ » ou des tableaux vides sans appel à l'action. Le composant `EmptyState` existe mais n'est utilisé qu'après une recherche infructueuse.
**Correctif :** état vide guidé partout (« Commencez par créer un client → un dossier → enregistrer du temps »). Effort : 2 jours.

### B3 — Équivalence facture preview / PDF / public non prouvée 🟡→bloquant
La preview UI, le PDF (`@react-pdf/renderer`) et la page publique `/facture/[token]` lisent bien les mêmes champs persistés via `recalculateInvoiceTotals`, mais : la route publique JSON **recompute inline** au lieu de passer par le presenter, et aucun test ne verrouille l'équivalence. Un futur changement du presenter pourrait faire diverger le PDF du public sans alerte.
**Correctif :** (a) faire passer la route publique par `presentInvoice`, (b) ajouter un test de contrat comparant lignes/taxes/totaux/solde entre les trois rendus. Effort : 1 jour. **C'est le correctif le plus important commercialement.**

### B4 — Fermeture de dossier = stub 🔴
`components/dossiers/detail/DossierDetailFermeture.tsx` n'affiche qu'un texte. Le modèle `DossierClosure` (checklist, responsable, date de destruction) existe mais n'est jamais utilisé. Pas de checklist, pas de lettre de fermeture générée, pas de règle de rétention appliquée. C'est une obligation déontologique (Barreau).
**Correctif :** workflow réel (checklist, lettre via RichDocument, statut `cloture`, rétention 7/10 ans). Effort : 3-4 jours.

### B5 — Secrets en clair + console interne exposable 🟡→bloquant
**Correction de l'audit du matin : le `.env` n'est PAS dans git** (vérifié : `.gitignore` couvre `.env`, `.env.local`, `.env.production.local` ; seul `.env.example` est suivi). Donc **pas de fuite git**. Mais : des clés réelles (Stripe, Resend, NEXTAUTH_SECRET, mot de passe admin) vivent en clair dans des fichiers locaux, et ont transité dans des outils. Avant tout accès externe : **rotation systématique**. Par ailleurs, la console SAFE Inc. ne doit jamais apparaître chez un cabinet client (accès actuel basé sur le nom du cabinet, fragile).
**Correctif :** rotation des clés, flag `User.isInternal` (migration additive) pour gater la console, retirer la console de la navigation client. Effort : 1 jour.

### B6 — Rate-limit absent sur le PDF d'audit public 🟡→bloquant
`/api/audit-gratuit/[id]/pdf` génère un PDF (coûteux) sans limite de débit, alors que `/api/contact` et `/api/audit-gratuit` sont protégés. Vecteur de déni de service trivial.
**Correctif :** `checkRateLimit()` sur la route. Effort : 15 min.

---

## 5. Problèmes de cohérence

| # | Incohérence | Gravité | Référence |
| --- | --- | --- | --- |
| C1 | **3 routes pour « les heures »** : `/temps`, `/mes-heures`, `/fiches-de-temps`. Quel lien pour un cabinet mixte ? | Important | `lib/routes.ts:17-18,111` |
| C2 | **3 portes vers la compta** : `/comptabilite` (onglets), `/journal/general`, `/journal/depenses`. | Important | `lib/routes.ts:40-43` |
| C3 | **Facturation surpeuplée** : 14 sous-pages, mais le menu n'expose que « Facturation » sans chevron ni découverte. | Important | `app/(app)/facturation/*` |
| C4 | **5 concepts documentaires** concurrents sans doctrine claire de rangement. | Important | §3 Documents |
| C5 | **Paiements orphelins** : un paiement peut rester non alloué → comptes à recevoir faussés (avertissement non bloquant). | Important | `payment-allocation-service.ts` |
| C6 | **Divergence matrice RBAC ↔ helpers** (ex. `canEditClients`) en attente de décisions CEO (ADR-010). | Important | `lib/auth/permissions.ts` |
| C7 | **Solde négatif (surpaiement) permis** sans signalement UI. | Finition | `invoice-calculations.ts` |
| C8 | **Rabais legacy à double système** (`InvoiceItem` + `InvoiceLine`). | Amélioration | presenter facture |
| C9 | **Système de couleurs hétérogène** : ~587 couleurs ad hoc vs tokens ; pas de `FormField` unifié. | Important | `lib/ds/tokens.ts` |
| C10 | **Numéros de dossiers mixtes** si bascule taxonomie puis retour (`AAAA-NNN` et `AAAA-PREFIX-NNN`). | Finition | `dossiers/actions.ts:84-114` |

---

## 6. Recommandations UX

1. **Faire raconter le parcours par l'UX.** Regrouper le menu autour du flux (Pratique → Finances → Cabinet) et masquer ce qui est interne (console). Réduire de 18 entrées visibles à un menu composé clair.
2. **États vides guidés partout** (B2). C'est le levier #1 de confiance en démo.
3. **Consolider les doublons** (C1, C2) : une route « Temps » avec filtre par rôle ; « Comptabilité » comme hub avec onglets, en retirant les routes-jumelles du menu.
4. **Rendre la facturation explorable** : une page hub avec cartes (« Honoraires à facturer », « Temps non facturé », « Taxes », « Créances ») au lieu de 14 routes invisibles.
5. **Unifier les formulaires** : créer `FormField` (label + input + erreur + aide), refactorer les ~10 formulaires custom, ramener les couleurs ad hoc sous 100.
6. **Doctrine documentaire** : un écran « Documents du dossier » qui distingue clairement Joindre (upload) / Rédiger (éditeur) / Pièces structurées / Documents générés.
7. **Nettoyer le micro-polish** : string « Chargement… » hardcodée, documenter les 9 variantes de bouton, alternance de lignes dans les tableaux.

---

## 7. Recommandations comptabilité / facturation

1. **Verrouiller l'équivalence facture (B3)** : presenter unique + test de contrat. Priorité absolue.
2. **Page « Paiements orphelins »** : lister les paiements non alloués > 30 j et les inclure correctement dans les comptes à recevoir.
3. **Forcer/faciliter l'allocation** : pré-remplir l'allocation quand une seule facture est ouverte ; lien rapide depuis le paiement.
4. **Signaler les surpaiements** (solde < 0) en rouge, proposer crédit ou remboursement.
5. **Intérêts de retard** : batch mensuel ou déclenchement à la certification de période (le service existe déjà).
6. **Garder le cap doctrinal** : compta juridique opérationnelle + export externe. Ne pas dériver vers un grand livre général. C'est un argument de simplicité pour l'avocat solo, pas une lacune.
7. **Démo de vente** : préparer un cabinet pré-rempli montrant facture → PDF → envoi → paiement → reçu → KPI fidéicommis + certification LSO, pour ne jamais montrer un écran vide.

---

## 8. Recommandations administration

1. **Console SAFE Inc. = interne strict** (B5) : flag `User.isInternal`, retrait de la navigation client. Ne pas la vendre comme feature tant que ce n'est pas migré.
2. **Impersonation** : décider si c'est un vrai besoin MVP. Si oui, l'implémenter avec audit trail effectif ; sinon, retirer la promesse. Aujourd'hui ce n'est qu'un modèle vide.
3. **Paie** : assumer le périmètre « MVP RH + year-end pour le comptable ». Soit on complète (saisie d'heures + génération `Payslip`), soit on communique clairement que la paie complète n'est pas dans le scope. Ne pas laisser un demi-module ambigu.
4. **RBAC** : trancher les divergences matrice/helpers (ADR-010) et calculer le rôle effectif une fois en session plutôt que partout.
5. **Garder navette + import tels quels** : ils sont prêts.

---

## 9. Risques techniques

| Risque | Gravité | État vérifié |
| --- | --- | --- |
| Secrets réels en clair (local, non git) à faire tourner | Bloquant | ✅ vérifié : hors git, mais à rotationner |
| PDF audit public sans rate-limit (DoS) | Bloquant | ✅ confirmé |
| Build : `tsc` OK, tests OK, mais `eslint: ignoreDuringBuilds: true` masque 100+ erreurs JSX | Important | ✅ confirmé |
| Aucun test E2E (Playwright installé, 0 suite) | Important | ✅ confirmé |
| 417 `any`, 57 `console.log`, 2 TODO | Finition | ✅ comptés |
| Dérive repo↔prod : 2 dérives mineures connues (default updatedAt, index renommé), hors périmètre | Finition | mémoire projet |
| CSP permissif (`unsafe-inline`/`unsafe-eval` pour Stripe), mode Report-Only | Finition | ✅ confirmé |
| Détection de doublon client en O(n) en mémoire | Amélioration | OK < 1000 clients |

**Points forts techniques :** aucun IDOR détecté (les routes filtrent par `cabinetId` côté requête ET côté DB), tokens non devinables (cuid), webhooks Stripe signés, `CRON_SECRET` refusé si absent, migrations idempotentes et conformes Barreau (Client RESTRICT sur 16 relations, soft-delete documents, numérotation sans trou). La couverture de tests des couches critiques (billing, fidéicommis, journal, RBAC) est excellente.

---

## 10. Plan d'action priorisé

### Niveau 1 — Bloquants avant push officiel (≈ 2 semaines)
1. B3 — Test d'équivalence facture + presenter unique sur la route publique. *(le plus important)*
2. B1 — Flux d'onboarding in-app qui persiste réellement.
3. B2 — États vides guidés sur les 4 écrans clés.
4. B4 — Workflow de fermeture de dossier (checklist + lettre + rétention).
5. B5 — Rotation des secrets + flag `User.isInternal` + console hors nav client.
6. B6 — Rate-limit sur le PDF d'audit public.

### Niveau 2 — Nécessaires avant vente pilote (≈ +2-3 semaines)
1. Consolidation des doublons de routes (C1, C2, C3).
2. Page « Paiements orphelins » + allocation facilitée + signalement surpaiements.
3. `FormField` unifié + réduction des couleurs ad hoc.
4. Doctrine documentaire (un écran clair).
5. Décision RBAC (ADR-010) + rôle effectif en session.
6. Démo cabinet pré-rempli + 1 page de doc parcours.

### Niveau 3 — Après lancement
1. Automatisation des paiements (Stripe Connect, Interac, 1-clic).
2. Paie complète (saisie heures + `Payslip`) ou décision de scope.
3. Capacités IA (débloquer et tester `ANTHROPIC_API_KEY`).
4. Tests E2E (Playwright) sur billing/fidéicommis.
5. Intérêts de retard auto, export comptable enrichi, impersonation si retenue.
6. Réduction progressive des `any`, réactivation ESLint.

---

## 11. Calendrier de stabilisation avant push officiel

> Estimations réalistes (déjà majorées). À traiter une priorité à la fois, max 2 tâches actives.

| Semaine | Focus | Définition de terminé |
| --- | --- | --- |
| **S1** | B3 (équivalence facture) + B6 (rate-limit) + B5 (secrets/console) | Test de contrat vert ; PDF audit limité ; clés tournées ; console invisible côté client |
| **S2** | B1 (onboarding persistant) + B2 (états vides) | Un cabinet neuf est créé, configuré et atterrit sur un tableau de bord guidé |
| **S3** | B4 (fermeture dossier) + début niveau 2 (doublons routes) | Un dossier se ferme avec checklist + lettre + rétention ; menu nettoyé |
| **S4-S5** | Niveau 2 (paiements orphelins, FormField, doctrine doc, RBAC) | Parcours facturation/paiement net ; formulaires homogènes |
| **S6** | Démo cabinet pré-rempli + QA pilote + doc parcours | Démo de vente reproductible de bout en bout sans écran vide |

**Jalon « vente pilote founder » :** fin S3 (les 6 bloquants levés).
**Jalon « vente publique encadrée » :** fin S6.

---

*Fin de l'audit. Aucun code n'a été modifié. Les correctifs sont décrits, pas appliqués.*
