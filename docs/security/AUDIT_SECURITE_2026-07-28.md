# Audit de sécurité SAFE — code + déploiement Vercel

**Date** : 2026-07-28
**Portée** : dépôt `SAAS - SAFE 02` (branche `release/2026-06-11-compta-admin-derisier`), projet Vercel `safe` (www.safecabinet.ca), schéma Prisma, variables d'environnement de production.
**Angle demandé** : sécurité générale + risque de perte de données.
**Méthode** : lecture statique (105 routes API, 33 modules `"use server"`, schéma Prisma 3623 lignes, middleware, next.config, scripts de build), inventaire `vercel env ls`. Pas de test d'intrusion actif, pas d'accès à la console Supabase.

---

## Verdict global

Le socle est meilleur que la moyenne des SaaS à ce stade. Points réellement solides, vérifiés :

- Aucun secret dans le dépôt (`git grep` sur les motifs Stripe / Resend / Anthropic / Supabase / URL Postgres : rien).
- Cloisonnement multi-cabinets discipliné : les 105 routes API passent toutes par une garde de session, et les requêtes Prisma sont scopées par `cabinetId` de façon quasi systématique. Aucun IDOR trouvé sur les lectures par `id`.
- RLS Supabase réactivé automatiquement à chaque déploiement (`scripts/secure-rls.mjs`), ce qui ferme l'exposition PostgREST du schéma `public`.
- Documents stockés sur Vercel Blob **privé**, servis uniquement via routes authentifiées avec journal d'audit (`app/api/documents/[id]/download/route.ts`).
- Webhook Stripe à signature vérifiée + idempotence (`recordStripeEvent`).
- Mots de passe en bcrypt coût 12, réinitialisation sans énumération de comptes, jetons de 32 octets.
- En-têtes de sécurité présents (HSTS preload, nosniff, frame-ancestors none).
- Aucune migration destructive (`DROP TABLE` / `DROP COLUMN` / `TRUNCATE`) sur 30 migrations.

Cela dit, il y a **deux risques de perte de données réels et actionnables aujourd'hui**, et une poignée d'écarts de sécurité à corriger.

---

## 🔴 Critique — perte de données

### C1. Les déploiements Preview écrivent dans la base de production

**Constat.** `DATABASE_URL`, `DIRECT_URL`, `POSTGRES_URL` et `POSTGRES_URL_NON_POOLING` portent la **même valeur** sur `Production`, `Preview` et `Development` (`vercel env ls`). Or `vercel.json` impose `buildCommand: npm run vercel-build` pour **tous** les environnements, et [scripts/vercel-build.mjs](scripts/vercel-build.mjs) exécute, dans l'ordre :

1. `prisma migrate resolve --rolled-back` sur 4 migrations,
2. `prisma migrate resolve --applied 20260427000000_derisier_baseline`,
3. **`prisma migrate deploy`**,
4. `node scripts/secure-rls.mjs` (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY` sur toute table).

**Conséquence.** Chaque push sur **n'importe quelle branche** déclenche un build Preview qui applique les migrations de cette branche à la base de production, et manipule l'historique `_prisma_migrations`. Une migration expérimentale, un renommage de colonne, un `@@unique` ajouté à chaud : la production le prend. Pire, c'est silencieux — le build Preview réussit, personne ne regarde.

C'est le risque de perte de données numéro un du projet, et il est structurel, pas hypothétique.

**Correctif.**
- Créer une base Preview distincte (Supabase branch, ou Neon via le Marketplace) et y pointer `DATABASE_URL` / `DIRECT_URL` / `POSTGRES_URL*` uniquement pour `Preview` et `Development`.
- À défaut immédiat : conditionner l'étape migration dans `vercel-build.mjs` à `process.env.VERCEL_ENV === "production"`, et sortir en no-op sinon.
- Retirer les `migrate resolve --rolled-back` codés en dur : ils réécrivent l'historique de migration à chaque build, ce qui est un correctif ponctuel devenu permanent.

### C2. Suppression d'un utilisateur = suppression en cascade de ses documents et de ses heures

**Constat.** Dans [prisma/schema.prisma](prisma/schema.prisma), plusieurs enfants pointent vers `User` en `onDelete: Cascade` :

| Ligne | Relation | Ce qui disparaît |
|---|---|---|
| 1661 | `Document.uploadedBy → User` | **Toutes les pièces qu'il a téléversées** (+ en cascade `DossierDocketEntry`, `ClientIdentityVerification`) |
| 993 | `TimeEntry.user → User` | Toutes ses entrées de temps, donc les heures facturables non facturées |
| 934 | `DossierTache.assignee → User` | Ses tâches de dossier |
| 2719 | `RichDocument.createdBy → User` | Les documents rédigés (+ versions, ligne 2748) |
| 2556 | `DossierNavetteMessage.author → User` | L'historique de navette |
| 2781 | `WorkSession` | Sessions de travail |

Et `User.cabinet → Cabinet` est lui-même en `Cascade` (ligne 112) : supprimer un cabinet supprime les utilisateurs, donc leurs documents.

**Conséquence.** Le garde-fou de rétention Barreau est écrit dans le code applicatif — `deleteDocument()` lève `DocumentRetentionError` dès qu'un document est rattaché à un client ou un dossier ([lib/services/document.ts:177](lib/services/document.ts)). Mais une cascade Postgres **passe sous ce garde-fou** : elle supprime la ligne `Document` sans jamais appeler le service, et **sans supprimer l'objet Blob**, qui devient orphelin et impayable à retrouver. Un départ d'employé traité par « on supprime son compte » détruit des pièces soumises à conservation 10 ans (B-1 r.5) et des heures non facturées.

Il n'y a pas aujourd'hui de chemin UI qui supprime un `User` (aucun `prisma.user.delete` dans `app/` ou `lib/`), donc le risque est latent, pas actif. Mais il se déclenchera à la première opération manuelle en base ou au premier bouton « retirer un employé ».

**Correctif.**
- Passer en `onDelete: Restrict` les relations `Document.uploadedBy`, `TimeEntry.user`, `RichDocument.createdBy`, `DossierNavetteMessage.author` (migration additive, aucune donnée touchée).
- Formaliser la désactivation d'utilisateur (`Employee.status = inactive`, déjà vérifié à l'authentification dans [lib/auth.ts](lib/auth.ts)) comme **seule** voie de retrait, sur le modèle de `deleteClient` qui archive déjà.
- Idem pour `Dossier → Document` (ligne 1660, `Cascade`) : supprimer un dossier supprime ses pièces.

### C3. Aucune procédure de sauvegarde/restauration documentée ni testée

**Constat.** [docs/legal/DPA_SAFE_FR.md](docs/legal/DPA_SAFE_FR.md) (§202, §335) et [app/confidentialite/page.tsx:169](app/confidentialite/page.tsx) promettent contractuellement « sauvegardes chiffrées avec rétention de 30 jours ». Aucune trace de sauvegarde dans le dépôt : pas de cron `pg_dump`, pas de runbook de restauration, aucune mention de PITR dans `docs/`.

**Conséquence.** Double problème : risque opérationnel (rien ne prouve qu'une restauration est possible), et risque contractuel (engagement écrit envers les cabinets, non étayé). Le plan Supabase gratuit n'offre pas 30 jours de rétention ; il faut vérifier le plan réel du projet `rsblxmmqlnywcjxztebu`.

**Correctif.**
- Vérifier dans le tableau de bord Supabase le plan et la fenêtre PITR effective. Si < 30 jours, soit monter de plan, soit corriger le DPA et la page Confidentialité **avant** de signer la cohorte de 10.
- Ajouter un `pg_dump` chiffré hebdomadaire vers un stockage distinct (Vercel Blob privé ou S3), et **exécuter une restauration de test une fois** — un backup non restauré n'est pas un backup.
- Les objets Vercel Blob (documents clients) ne sont pas couverts par les sauvegardes Postgres. Prévoir leur sauvegarde séparément.

---

## 🟠 Élevé

### E1. `STRIPE_WEBHOOK_SECRET` mal nommé en production — les webhooks Stripe sont tous rejetés

La variable s'appelle `STRIPE_WEBHOOK_SECRETSTRIPE_WEBHOOK_SECRET` (nom dupliqué, visible dans `vercel env ls`). Le code lit `process.env.STRIPE_WEBHOOK_SECRET` ([app/api/webhooks/stripe/route.ts](app/api/webhooks/stripe/route.ts)), qui est donc `undefined` → la route retourne `500 Webhook secret not configured` pour **chaque** événement.

Conséquence : aucun `checkout.session.completed`, `customer.subscription.*` ni `invoice.payment_*` n'atteint la base. Les abonnements ne se synchronisent pas sur `Cabinet`, et le garde-fou d'abonnement (`shouldBlockForSubscription`) travaille sur un état périmé. À corriger avant la première vente de la cohorte.

Correctif : `vercel env add STRIPE_WEBHOOK_SECRET production` avec la bonne valeur, supprimer la variable mal nommée, redéployer, puis rejouer les événements manqués depuis le tableau de bord Stripe.

### E2. La limitation de débit est inopérante en production

[lib/rate-limit.ts](lib/rate-limit.ts) utilise Redis/KV s'il est configuré, sinon **une `Map` en mémoire de processus**. Aucune variable `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `UPSTASH_REDIS_REST_URL` ni `UPSTASH_REDIS_REST_TOKEN` n'existe sur le projet.

Conséquence : sur Vercel, chaque instance de fonction a son propre compteur. Les 5 tentatives/minute qui protègent la connexion ([lib/auth.ts](lib/auth.ts)), `forgot-password`, `/api/audit` et `/api/onboarding` sont contournables simplement en provoquant la montée en charge. Le bourrage d'identifiants sur un cabinet ciblé redevient réaliste.

Correctif : provisionner Upstash Redis via le Marketplace Vercel et renseigner les deux variables REST. Aucune modification de code nécessaire, le fallback est déjà écrit.

### E3. `SUPABASE_SERVICE_ROLE_KEY` et `SUPABASE_JWT_SECRET` exposés aux environnements Preview et Development

La clé `service_role` **contourne totalement RLS** : lecture et écriture sur toute la base. Elle est présente sur `Production, Preview, Development`, alors qu'aucun code du dépôt ne l'utilise (`grep SERVICE_ROLE` sur `app/`, `lib/`, `components/`, `scripts/` : aucun résultat).

Combiné à C1 (Preview = base de production), toute personne pouvant déclencher un build Preview ou lire l'environnement d'un déploiement Preview obtient un accès total à la production.

Correctif : supprimer `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_SECRET_KEY` et `POSTGRES_PASSWORD` des environnements où ils ne servent pas — idéalement partout, puisqu'ils sont inutilisés. Rotation de la clé `service_role` dans Supabase après suppression.

### E4. Les modules de service portent `"use server"` et exposent `cabinetId` en paramètre

[lib/services/document.ts](lib/services/document.ts), [lib/services/client.ts](lib/services/client.ts), [lib/services/dossier.ts](lib/services/dossier.ts), [lib/services/identity-verification.ts](lib/services/identity-verification.ts) et [lib/services/audit.ts](lib/services/audit.ts) commencent par `"use server"`. En Next.js App Router, cette directive transforme **chaque fonction async exportée** du module en point d'entrée RPC adressable par identifiant d'action.

Or ces fonctions reçoivent le cloisonnement en argument, pas depuis la session :

```ts
deleteDocument(documentId: string, cabinetId: string, userId: string)
listIdentityVerifications(clientId: string, cabinetId: string)
createDocumentRecord({ cabinetId, userId, ... })
```

Un appelant qui obtient l'identifiant d'action (ils fuitent dans les bundles clients dès qu'un composant client référence l'action) peut passer un `cabinetId` arbitraire et lire, créer ou supprimer hors de son cabinet. `createAuditLog` étant lui aussi exposé, le journal d'audit devient falsifiable.

Correctif : retirer `"use server"` de ces modules — ce sont des bibliothèques serveur, importées par des routes et des actions qui portent déjà leur propre garde. Réserver `"use server"` aux fichiers `actions.ts` dont les fonctions dérivent `cabinetId` de la session via `requireCabinetAndUser()`.

---

## 🟡 Moyen

### M1. Les sessions JWT ne reflètent jamais un changement de droits

`session: { strategy: "jwt", maxAge: 30 jours }` sans rafraîchissement ([lib/auth.ts](lib/auth.ts)). `role` et `cabinetId` sont figés à la connexion. Conséquences : une rétrogradation de rôle, une désactivation d'employé, une suppression de compte ou une réinitialisation de mot de passe **n'invalident aucune session existante** — jusqu'à 30 jours d'accès résiduel avec les anciens droits.

Correctif : ajouter un rechargement périodique dans le callback `jwt` (relire `role`, `cabinetId`, `employee.status` toutes les ~15 min via un `tokenIssuedAt`), et un champ `sessionsInvalidatedAt` sur `User` incrémenté à la réinitialisation de mot de passe et au changement de rôle.

### M2. La CSP est en mode rapport seulement

`Content-Security-Policy-Report-Only` dans [next.config.ts](next.config.ts) : la politique est calculée mais **jamais appliquée**. De plus elle contient `script-src 'unsafe-inline' 'unsafe-eval'`, ce qui la viderait largement de son sens même en mode bloquant.

Correctif : passer en `Content-Security-Policy` (bloquant) après avoir retiré `unsafe-eval` et remplacé `unsafe-inline` par un nonce. Les quatre usages de `dangerouslySetInnerHTML` du dépôt sont des `<style>` et un JSON-LD statiques, sans entrée utilisateur : la migration est faisable.

### M3. Jetons de réinitialisation stockés en clair

`User.resetToken` contient la valeur brute du jeton ([app/api/auth/forgot-password/route.ts](app/api/auth/forgot-password/route.ts)). Toute lecture de la table `User` (fuite de sauvegarde, accès en lecture) permet la prise de contrôle de comptes pendant la fenêtre d'une heure. `/api/auth/reset-password` n'a par ailleurs aucune limitation de débit.

Correctif : stocker `sha256(token)`, comparer le haché, ajouter une limitation de débit par IP sur `reset-password`.

### M4. Le repli sur le stockage local est un piège en production

`shouldUseLocalStorage()` renvoie `true` si `STORAGE_PROVIDER === "local"` ([lib/services/document.ts:15](lib/services/document.ts)), y compris en production. Dans ce cas, les documents sont écrits sur le système de fichiers éphémère de la fonction Vercel et **disparaissent au prochain déploiement**, silencieusement. La variable n'est pas définie aujourd'hui, donc pas de risque actif, mais c'est une bombe à retardement de configuration.

Correctif : refuser `STORAGE_PROVIDER=local` quand `VERCEL_ENV === "production"` (lever une erreur au démarrage).

### M5. Le mot de passe de la base de production est faible et conservé en clair hors coffre

Le mot de passe Postgres du projet canonique est une phrase personnelle devinable, consignée en clair dans les fichiers de mémoire de l'assistant (`~/.claude/.../memory/project_db_infra_state.md`). Il donne un accès direct, hors application, à l'intégralité des données de tous les cabinets.

Correctif : rotation immédiate vers un secret aléatoire de 32+ caractères, mise à jour des 7 variables Vercel, purge de la valeur des fichiers de mémoire et des journaux. Ne plus y écrire de secret.

---

## 🟢 Faible / à surveiller

- **`/api/audit-gratuit/[id]` et `/audit/[id]/print`** exposent nom, courriel, téléphone et cabinet du prospect à quiconque connaît l'identifiant. Les `id` sont des `cuid()` (non énumérables), et la route documente ce choix explicitement. Acceptable pour un lead magnet ; à ne pas réutiliser pour des données clients.
- **`eslint.ignoreDuringBuilds: true`** : les règles de sécurité ESLint (dont `react/no-danger`) ne bloquent jamais un déploiement. TypeScript reste strict, donc l'impact est limité.
- **`/v2` absent de `isProtectedPath`** dans [middleware.ts](middleware.ts) : la garde est bien faite dans `app/(app-v2)/v2/layout.tsx`, donc pas de faille — mais la protection n'existe plus au niveau edge, contrairement au reste de l'app. À aligner quand `/v2` sortira du prototype.
- **`connect-src 'self' https:`** dans la CSP autorise l'exfiltration vers n'importe quel domaine HTTPS. À restreindre en même temps que M2.
- **Migrations : `migrate resolve --rolled-back` en dur** dans le script de build (voir C1) — dette technique qui rend l'historique de migration non reproductible.

---

## Ce qui n'a pas été couvert

- Test d'intrusion actif (aucune requête envoyée contre la production).
- Vérification de l'état RLS réel en base (nécessite une connexion Supabase ; le script est correct, son exécution effective reste à confirmer dans les journaux de build).
- Revue des dépendances (`npm audit`) et de la chaîne d'approvisionnement.
- Exactitude comptable du module fidéicommis (intégrité métier, pas sécurité).
- Configuration Vercel WAF / BotID (non activée à ma connaissance).

---

## 🔴 Découvert au déploiement — C4. Le script RLS n'a jamais tourné

**Constat.** L'audit statique avait validé `scripts/secure-rls.mjs` comme filet de sécurité
exécuté à chaque déploiement. Les journaux du déploiement de production `f2d2c5b` ont
montré autre chose :

```
Error: Cannot find module '/vercel/path0/scripts/secure-rls.mjs'
```

[.vercelignore](.vercelignore) excluait `scripts/*` avec une seule exception,
`!scripts/vercel-build.mjs`. Le script RLS n'a donc **jamais été téléversé** depuis son
ajout le 2026-07-21. L'appel étant en `allowFailure`, chaque build échouait en silence :
rien dans la sortie, aucun déploiement rouge, et la protection réputée active ne l'était
pas.

**Conséquence, mesurée.** Après correction de `.vercelignore` et redéploiement, le script
a rapporté :

```
secure-rls: RLS activé sur 3 table(s) : SupportAttachment, SupportConversation, SupportMessage
```

Ces trois tables, créées par les migrations du 17 juillet, étaient donc restées **sans RLS
pendant 11 jours**, c'est-à-dire lisibles et modifiables via l'API REST Supabase avec la
clé publiable qui est livrée dans le frontend. Elles contiennent les fils de support entre
les cabinets et SAFE Inc. et leurs pièces jointes.

**Correctif appliqué.** `!scripts/secure-rls.mjs` ajouté à `.vercelignore` (commit
`5d654ac`), redéployé, RLS confirmé actif sur les trois tables.

**Leçon à retenir.** Un `allowFailure` sur un contrôle de sécurité transforme une panne en
silence. À reprendre : faire échouer le build si `secure-rls.mjs` est introuvable, et ne
tolérer l'échec que sur une erreur transitoire de base.

---

## Statut des correctifs (2026-07-28, même jour)

| Point | Statut | Où |
|---|---|---|
| C1 Preview migre la prod | ✅ Corrigé et déployé | `scripts/vercel-build.mjs` : migrations et RLS uniquement si `VERCEL_ENV === "production"` |
| C4 Script RLS jamais téléversé | ✅ Corrigé et déployé | `.vercelignore` : `!scripts/secure-rls.mjs` — 3 tables de support sécurisées après 11 jours d'exposition |
| C2 Cascade `User` → documents/heures | ✅ Corrigé | `prisma/schema.prisma` + migration `20260728120000_protect_client_records_from_cascade` (8 clés étrangères passées en `RESTRICT`) |
| C3 Sauvegardes | ⏳ Action CEO | Vérifier le plan Supabase et la fenêtre PITR ; aligner le DPA si < 30 jours |
| E1 Secret webhook Stripe | ⏳ Action CEO | Valeur `whsec_…` à récupérer dans le tableau de bord Stripe |
| E2 Limitation de débit | ⏳ Action CEO | Provisionner Upstash Redis (aucun code à écrire) |
| E3 Clés Supabase sur Preview | ⏳ Action CEO | `vercel env rm` (valeurs chiffrées, non relisibles depuis la CLI) |
| E4 `"use server"` sur les services | ✅ Corrigé | Directive retirée de `lib/services/{audit,client,document,dossier,identity-verification}.ts` |
| M1 Sessions JWT figées | ✅ Corrigé | `lib/auth.ts` : relecture des droits toutes les 15 min + `User.sessionsValidFrom` (migration `20260728121000`) ; révocation posée à la réinitialisation de mot de passe et au changement de rôle/statut |
| M2 CSP en Report-Only | ⏸ Reporté | Passage en bloquant à faire après retrait de `unsafe-eval` et mise en place d'un nonce |
| M3 Jetons de reset en clair | ✅ Corrigé | SHA-256 stocké côté base + limitation de débit sur `reset-password` |
| M4 `STORAGE_PROVIDER=local` en prod | ✅ Corrigé | `lib/services/document.ts` : erreur explicite au lieu d'une perte silencieuse |
| M5 Mot de passe DB faible | ⏳ Action CEO | Rotation + purge des fichiers de mémoire |

Vérification : `npx prisma validate` ✅, `npx tsc --noEmit` ✅ (zéro erreur), `vitest run` 753 tests verts.
Un échec de suite subsiste (`ready-for-review-detection-hooks.test.ts`, paquet `server-only` non résolu par Vite) : **antérieur à ces changements**, vérifié par `git stash`.

**Déployé en production le 2026-07-28** (commits `f2d2c5b` puis `5d654ac`,
`https://www.safecabinet.ca`). Les deux migrations sont appliquées, confirmé dans les
journaux de build : `Applying migration 20260728120000_protect_client_records_from_cascade`
puis `20260728121000_add_user_sessions_valid_from`, `All migrations have been successfully
applied`. Santé après déploiement : accueil 200, `/connexion` 200, `/api/auth/db-check`
`{"ok":true}`, `/tableau-de-bord` 307 vers la connexion.

Note sur le déblocage : le déploiement précédent était en état `BLOCKED`
(`TEAM_ACCESS_REQUIRED`), motif exact renvoyé par l'API Vercel :
« Git author votre@email.com must have access to the team ». Le dépôt portait encore
l'identité git gabarit `Votre Nom <votre@email.com>`, que Vercel refuse puisqu'elle ne
correspond à aucun membre de l'équipe. Identité corrigée en `Keassaha`, déploiement passé.

---

## Ordre de traitement recommandé

| # | Action | Effort | Gain |
|---|---|---|---|
| 1 | Base Preview distincte (ou migrations conditionnées à `VERCEL_ENV=production`) — **C1** | 1–2 h | Supprime le risque de perte de données n°1 |
| 2 | Corriger `STRIPE_WEBHOOK_SECRET` + rejouer les événements — **E1** | 20 min | Débloque la facturation de la cohorte |
| 3 | `onDelete: Restrict` sur les 4 relations `User` + politique de désactivation — **C2** | 2 h | Protège les pièces sous rétention Barreau |
| 4 | Purger les clés Supabase des environnements Preview/Dev + rotation mot de passe DB — **E3, M5** | 1 h | Ferme l'accès total hors application |
| 5 | Retirer `"use server"` des 5 modules de service — **E4** | 1 h | Ferme le contournement de cloisonnement |
| 6 | Provisionner Upstash + vérifier PITR Supabase — **E2, C3** | 1 h | Rétablit la limitation de débit, aligne le DPA sur la réalité |
| 7 | Rafraîchissement JWT + CSP bloquante + hachage des jetons — **M1, M2, M3** | 1 j | Durcissement |
