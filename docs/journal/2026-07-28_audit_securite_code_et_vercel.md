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

## Déblocage et déploiement production (même jour)

Le déploiement de production était en état `BLOCKED`. Motif exact, lu dans
`readyStateReason` via l'API Vercel (invisible dans `vercel inspect --logs`) :

> Git author votre@email.com must have access to the team keassaha's projects
> on Vercel to create deployments. — `blockCode: TEAM_ACCESS_REQUIRED`

Le dépôt portait encore l'identité git gabarit `Votre Nom <votre@email.com>`.
Vercel refuse tout déploiement dont l'auteur du commit ne correspond à aucun
membre de l'équipe. Identité corrigée en `Keassaha`, CLI Vercel mise à jour
(54.6.0 → 58.1.0), déploiement passé.

Commits `f2d2c5b` puis `5d654ac`, aliasés sur www.safecabinet.ca. Les deux
migrations sont appliquées (confirmé dans les journaux de build). Santé après
déploiement : accueil 200, `/connexion` 200, `db-check` `{"ok":true}`,
`/tableau-de-bord` 307.

## Trouvaille du déploiement : le script RLS n'avait jamais tourné

Les journaux du premier déploiement ont sorti :

    Error: Cannot find module '/vercel/path0/scripts/secure-rls.mjs'

`.vercelignore` excluait `scripts/*` avec pour seule exception `vercel-build.mjs`.
Le script RLS n'a donc jamais été téléversé depuis son ajout le 2026-07-21, et
l'appel étant en `allowFailure`, l'échec était totalement silencieux.

Après correction et redéploiement :

    secure-rls: RLS activé sur 3 table(s) : SupportAttachment, SupportConversation, SupportMessage

Ces trois tables sont restées **11 jours sans RLS**, donc lisibles et modifiables
via l'API REST Supabase avec la clé publiable livrée dans le frontend. Elles
contiennent les fils de support cabinet ↔ SAFE Inc. et leurs pièces jointes.
C'est fermé.

Leçon : un `allowFailure` posé sur un contrôle de sécurité transforme une panne
en silence. À reprendre — faire échouer le build si le script est introuvable.

## État du CEO

Deux choses valent d'être notées pour la suite. D'abord, ce que l'audit statique
n'avait pas vu, ce sont les journaux d'exécution qui l'ont montré : la prochaine
revue de sécurité devrait lire une sortie de build réelle, pas seulement le code.
Ensuite, quatre points restent en attente et ils demandent tous un accès compte
(Stripe, Upstash, Supabase, rotation du mot de passe) : ils ne bougeront pas tant
qu'ils ne seront pas planifiés explicitement.
