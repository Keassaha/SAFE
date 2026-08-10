# Renforcement du système SAFE

Date : 2026-08-08
Déclencheur : un avocat s'apprête à accéder à SAFE en usage réel. Que faut-il solidifier avant, et autour ?
Méthode : audit exécuté sur le code et sur l'état réel du dépôt. Chaque constat est reproductible par la commande citée.

---

## 1. Ce qui est déjà solide

À ne pas toucher, et à savoir défendre en démo.

| Point | Preuve |
|---|---|
| Suite de tests réelle | `npm run test:run` → **123 fichiers, 1432 tests, tous verts en 6,6 s** |
| Typage propre | `npx tsc --noEmit` → **0 erreur** |
| Isolation base de données | RLS activée sur toutes les tables du schéma `public`, **rejouée à chaque déploiement** (`scripts/secure-rls.mjs` appelé par `scripts/vercel-build.mjs`) |
| Gardes d'authentification | **89 routes API sur 104** portent une garde. Les 15 restantes sont légitimement publiques (NextAuth, webhook Stripe, formulaire de contact, audit gratuit, lien de facture par token) |
| Limitation de débit | présente sur inscription, mot de passe oublié, réinitialisation, contact, génération de PDF |
| Sortie des données | exports clients, dossiers, journal général, comptable (QuickBooks / Xero / Sage), trousse d'inspection. **Un cabinet peut récupérer ses données.** C'est un argument de vente, pas seulement une conformité. |
| Dette technique | **12** occurrences de TODO/FIXME/HACK dans tout `app` + `lib` + `components` |

Le code est en meilleur état que la moyenne des SaaS à ce stade. Les faiblesses ci-dessous sont **opérationnelles**, pas techniques.

---

## 2. Les six renforcements, par gravité

### R1 — Aucune sauvegarde de base de données · CRITIQUE

**Constat**
```
ls scripts/ | grep -iE "backup|restore|dump"   → rien
find docs -iname "*backup*" -o -iname "*sauvegarde*"  → rien
```

Aucun script, aucune procédure, aucune documentation de restauration.

**Pourquoi c'est le point le plus grave**

SAFE détient de la comptabilité en fidéicommis et des dossiers clients d'avocat. Le jour où la base disparaît, ce n'est pas un incident produit. C'est le cabinet client qui se retrouve devant le syndic du Barreau sans registre de fidéicommis, avec une obligation de conservation de 10 ans qu'il ne peut plus honorer.

Supabase produit des sauvegardes automatiques selon le forfait. Deux problèmes : le forfait actuel n'a pas été vérifié, et **une sauvegarde jamais restaurée n'est pas une sauvegarde**.

**Proposition**
- `npm run backup` : `pg_dump` vers un bucket privé, en cron quotidien.
- `npm run restore:verify` : restaure le dernier dump dans une base jetable et compte les lignes des tables critiques (Invoice, TrustTransaction, Document, Client). Échoue bruyamment si l'écart dépasse un seuil.
- Une page `docs/ops/SAUVEGARDE_ET_RESTAURATION.md` avec la procédure, testée une fois pour de vrai.
- Vérifier le forfait Supabase et la rétention réelle des sauvegardes.

**Durée : 1 jour.**

---

### R2 — Aucun monitoring d'erreurs · CRITIQUE avant le premier client payant

**Constat**
```
grep -nE "sentry|posthog|logtail|datadog|opentelemetry" package.json  → aucun
grep -rn "console\.log" app lib components (hors tests)  → 54
```

**Pourquoi**

Aujourd'hui, le canal de détection des bugs est l'appel du client. Avec un avocat payant, c'est le pire canal possible : il découvre le problème avant vous, en plein travail, et c'est lui qui doit faire l'effort de vous le signaler.

Les 54 `console.log` partent dans les logs Vercel sans structure et sans alerte. Certains peuvent contenir des données client, ce qui est un problème distinct pour un cabinet soumis au secret professionnel.

**Proposition**
- Sentry (gratuit au volume actuel), avec alerte courriel sur toute erreur serveur.
- Remplacer les `console.log` par un logger qui n'écrit jamais de contenu client, seulement des identifiants.
- Reprendre `/api/auth/db-check` : il est public et renvoie déjà des messages utiles, mais autant qu'il alimente aussi le monitoring.

**Durée : 0,5 jour.**

---

### R3 — 189 fichiers non commités · URGENT, et c'est un récidiviste

**Constat**
```
git status --porcelain | wc -l   → 189   (81 modifiés, 108 non suivis)
git worktree list | wc -l        → 16
git branch -a | wc -l            → 38
```

**Pourquoi ce n'est pas de la cosmétique**

Le dernier commit du dépôt s'appelle littéralement :

> `fix(console): trois modules dont du code commite dependait n'etaient pas suivis`

Le problème s'est donc **déjà produit** et a demandé un correctif. 108 fichiers non suivis, c'est 108 occasions de le reproduire, plus des semaines de travail qui n'existent que sur un seul disque.

La mémoire projet signale par ailleurs des documents fondateurs coincés dans des worktrees jetables. Il y en a 16.

**Proposition**
- Une session de tri : commiter ce qui est fini, mettre en branche ce qui est en cours, supprimer les worktrees morts. **2 h, en basse énergie, c'est du travail mécanique.**
- Ensuite un garde-fou léger : un rappel quotidien (ou un hook) qui signale quand plus de N fichiers non suivis dorment depuis plus de 48 h.

**Durée : 0,5 jour.**

---

### R4 — La limitation de débit retombe en mémoire si KV n'est pas configuré

**Constat**

`lib/rate-limit.ts` cherche `KV_REST_API_URL` ou `UPSTASH_REDIS_REST_URL`. À défaut, il retombe sur une `Map` dans la mémoire du processus. Ces variables sont **absentes en local** et n'ont pas été vérifiées sur Vercel.

**Pourquoi**

En serverless, chaque instance a sa propre mémoire. La limite de 3 inscriptions par minute devient 3 × le nombre d'instances actives, et se réinitialise à chaque démarrage à froid. Autrement dit : la protection existe dans le code et peut ne pas exister en production.

**Proposition**
- Vérifier `vercel env ls`. Si absent, brancher Upstash Redis via le marketplace Vercel (gratuit au volume actuel).

**Durée : 1 h.**

---

### R5 — L'onboarding ne persiste rien : chaque cabinet coûte un script écrit à la main

**Constat**

`docs/product/SPEC_onboarding_persistant.md` a déjà identifié ce point comme bloqueur **B1** le 2026-07-04. Le formulaire d'onboarding existe mais est masqué. Un cabinet réellement fonctionnel n'est configuré que par des scripts de seed : `rebuild-derisier-from-audit.mjs`, `seed-cayard.mjs`, `seed-test-cabinet.mjs`.

**Pourquoi c'est structurel et pas technique**

La règle « ne pas vendre ses heures du fondateur » interdit exactement cette forme de livraison. Avec 10 places visées, c'est 10 scripts écrits à la main, 10 fois le même travail, et un plafond de croissance fixé par le nombre d'heures disponibles.

**Ce point n'a pas besoin d'être spécifié : la spec est écrite et attend une validation CEO.** Le travail à faire est de décider, puis de bâtir.

**Durée : à estimer après validation de la spec. Ce n'est pas un lot de deux jours.**

---

### R6 — Deux tiers des requêtes ne sont pas bornées

**Constat**
```
grep -rn "findMany({" app lib | wc -l   → 321
grep -rn "take:" app lib | wc -l        → 105
```

**Pourquoi ce n'est pas urgent**

Chez un cabinet avec 200 dossiers, c'est invisible. Au troisième cabinet, avec cinq ans d'historique, plusieurs pages ralentiront d'un coup et sans prévenir. La bibliothèque documentaire (`take: 200` en dur) est déjà un cas concret : au 201ᵉ document, elle ment silencieusement.

**Proposition**
- Ne rien faire en préventif. Traiter par lot le jour où une page devient lente.
- Exception : borner et paginer la bibliothèque, ce qui est déjà prévu au lot B2 du chantier documentaire.

---

## 3. Recommandation de séquencement

R1 + R2 + R3 + R4 ne forment pas un chantier. Ils forment un **sas** : **2 jours**, à passer avant que l'avocat entre, pas en concurrence avec la construction.

La logique est simple. Les relances et la bibliothèque augmentent ce que SAFE vaut. Le sas protège ce que SAFE vaut déjà. Un incident sans sauvegarde efface les deux chantiers d'un coup, et il efface aussi la référence client qui devait ouvrir les neuf autres places.

Ordre proposé :

1. **Sas (2 jours)** : sauvegarde + monitoring + tri du dépôt + vérification KV.
2. **Chantier 1 (8 jours)** : relances multi-niveaux et écran unique de facturation.
3. **Décision CEO sur R5** : valider ou amender `SPEC_onboarding_persistant.md`. C'est une décision, pas une session de code.
4. **Chantier 2 (8 jours)** : bibliothèque et archiviste.

R6 reste en attente, sans date.

---

## 4. Ce qu'on ne fait pas

- **Refactoriser les 54 `console.log` un par un.** Ils partent avec le logger de R2, en une passe.
- **Réduire les 38 branches.** Bruit visuel, aucun risque réel. Le tri de R3 traite les worktrees, qui eux contiennent du travail unique.
- **Optimiser les requêtes en préventif** (R6).
- **Ajouter un environnement de préproduction.** Utile plus tard, inutile avec un seul cabinet en production et des déploiements de prévisualisation Vercel déjà disponibles sur chaque branche.
