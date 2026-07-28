# 2026-07-28 — Audit de sécurité : code SAFE + déploiement Vercel

## Ce qui a été fait

Audit statique complet demandé par le CEO, angle sécurité générale + perte de données.
Rapport : [docs/security/AUDIT_SECURITE_2026-07-28.md](../security/AUDIT_SECURITE_2026-07-28.md).

Couvert : 105 routes API, 33 modules `"use server"`, schéma Prisma (3623 lignes), middleware,
`next.config.ts`, `scripts/vercel-build.mjs`, `scripts/secure-rls.mjs`, 30 migrations,
inventaire `vercel env ls` (production + preview).

## Ce qui est solide (vérifié, pas supposé)

- Zéro secret dans le dépôt (`git grep` sur motifs Stripe / Resend / Anthropic / URL Postgres).
- Cloisonnement par `cabinetId` respecté sur la totalité des routes API ; aucun IDOR trouvé.
- RLS Supabase réactivé à chaque déploiement.
- Documents sur Vercel Blob privé, servis via routes authentifiées + journal d'audit.
- Webhook Stripe signé + idempotent. bcrypt coût 12. Pas d'énumération de comptes.
- Aucune migration destructive sur 30.

## Ce qui a été trouvé

**Critique (perte de données)**
1. Les déploiements **Preview partagent la `DATABASE_URL` de production** et lancent
   `prisma migrate deploy` à chaque build. Tout push de branche migre la prod.
2. `onDelete: Cascade` de `User` vers `Document`, `TimeEntry`, `RichDocument`,
   `DossierNavetteMessage` : supprimer un utilisateur détruit des pièces sous rétention
   Barreau 10 ans **en contournant** le garde-fou `DocumentRetentionError`, et laisse
   les objets Blob orphelins.
3. Aucune procédure de sauvegarde/restauration, alors que le DPA et la page
   Confidentialité promettent « sauvegardes chiffrées, rétention 30 jours ».

**Élevé**
4. `STRIPE_WEBHOOK_SECRET` mal nommé en prod (`STRIPE_WEBHOOK_SECRETSTRIPE_WEBHOOK_SECRET`)
   → **tous les webhooks Stripe échouent en 500**, les abonnements ne se synchronisent pas.
5. Aucune variable KV/Upstash → la limitation de débit est en mémoire de processus,
   donc contournable sur Vercel (bourrage d'identifiants).
6. `SUPABASE_SERVICE_ROLE_KEY` (contourne RLS) présent sur Preview et Development,
   alors qu'aucun code ne l'utilise.
7. Les modules `lib/services/*.ts` portent `"use server"` et reçoivent `cabinetId`
   en paramètre → chaque fonction exportée est un point d'entrée RPC cross-cabinet.

**Moyen** : sessions JWT 30 j jamais rafraîchies (rétrogradation de rôle sans effet),
CSP en `Report-Only`, jetons de réinitialisation en clair, repli `STORAGE_PROVIDER=local`
dangereux en prod, mot de passe DB faible et conservé en clair dans les fichiers de mémoire.

## Décision / suite

Ordre de traitement proposé en fin de rapport. Les deux premiers (base Preview séparée,
secret Stripe) valent d'être faits avant la cohorte de 10 : le premier protège les données
de Me Derisier, le second débloque l'encaissement.

## Correctifs appliqués dans la foulée (même jour)

Sur demande du CEO « effectue les arrangements nécessaires pour protéger les données des clients ».

- **C1** `scripts/vercel-build.mjs` : migrations Prisma et `secure-rls.mjs` uniquement
  si `VERCEL_ENV === "production"`. Un build Preview ne peut plus toucher au schéma
  de la base de production.
- **C2** 8 clés étrangères passées de `CASCADE` à `RESTRICT`
  (migration `20260728120000_protect_client_records_from_cascade`) :
  `Document.uploadedById`, `Document.dossierId`, `TimeEntry.userId`,
  `RichDocument.createdById`, `RichDocumentVersion.createdById`,
  `DossierNavetteMessage.authorId`, `DossierActe.assigneeId`, `WorkSession.userId`.
  Postgres refuse désormais toute suppression qui détruirait des pièces sous
  rétention Barreau ou des heures facturables.
- **E4** `"use server"` retiré des 5 modules `lib/services/*.ts`. Aucun composant
  client ne les importe (vérifié), donc aucune régression : ils redeviennent de
  simples bibliothèques serveur au lieu de points d'entrée RPC cross-cabinet.
- **M1** Sessions : relecture des droits en base toutes les 15 min dans le callback
  `jwt`, nouveau champ `User.sessionsValidFrom` (migration `20260728121000`),
  révocation posée à la réinitialisation de mot de passe et au changement de
  rôle/statut d'employé. Compte supprimé ou employé désactivé = session refusée.
- **M3** Jetons de réinitialisation stockés en SHA-256, limitation de débit ajoutée
  sur `POST /api/auth/reset-password`.
- **M4** `STORAGE_PROVIDER=local` lève désormais une erreur explicite en production
  au lieu d'écrire les documents sur un disque éphémère.

Vérification : `prisma validate` ok, `tsc --noEmit` sans erreur, 753 tests verts.
L'échec de `ready-for-review-detection-hooks.test.ts` (paquet `server-only` non
résolu par Vite) est antérieur, confirmé par `git stash`.

## Reste à faire — actions CEO (hors portée d'un agent)

- Récupérer le `whsec_…` dans Stripe et créer la variable `STRIPE_WEBHOOK_SECRET`
  (la variable actuelle est mal nommée), puis rejouer les événements manqués.
- Provisionner Upstash Redis pour rendre la limitation de débit effective.
- Retirer `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_SECRET_KEY`,
  `POSTGRES_PASSWORD` des environnements Preview/Development (valeurs chiffrées,
  non relisibles depuis la CLI, donc suppression à faire en connaissance de cause).
- Vérifier le plan Supabase et la fenêtre PITR réelle ; aligner le DPA si < 30 jours.
- Rotation du mot de passe Postgres.

Les deux migrations s'appliqueront au prochain déploiement de production.
