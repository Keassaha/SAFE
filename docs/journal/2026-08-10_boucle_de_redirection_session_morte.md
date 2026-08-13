# 2026-08-10 — La porte qui se referme sur elle-même

Trouvé en voulant simplement se connecter au local pour regarder le registre
clients. `ERR_TOO_MANY_REDIRECTS` sur `/connexion`, sans aucune porte de sortie.

## Le mécanisme

Deux gardes lisent la session, et elles ne lisent pas la même chose.

Le rappel `jwt` de `lib/auth.ts` relit l'utilisateur en base à intervalle
régulier. Si le compte a disparu, si l'employé est désactivé ou si le mot de
passe a été réinitialisé, il pose `token.revoked = true`, et le rappel `session`
retire `session.user`. Les layouts protégés voient donc une session vide et
renvoient vers `/connexion`. C'est le comportement voulu.

Mais `middleware.ts` n'appelle pas ces rappels. Il appelle `getToken()`, qui se
contente de déchiffrer le cookie. Le drapeau `revoked` n'y figure pas : il est
calculé côté serveur et ne redescend jamais dans le cookie du navigateur. Le
middleware voit donc un jeton parfaitement déchiffrable, en conclut que la
personne est connectée, et la renvoie du formulaire vers le tableau de bord.

```
/connexion  --(jeton déchiffrable)-->  /tableau-de-bord
/tableau-de-bord  --(session révoquée)-->  /connexion
```

Boucle infinie. Et pas d'issue : le formulaire de connexion, seule page qui
permettrait de repartir, est précisément celle qui rebondit.

Le commentaire de `lib/auth.ts` affirmait que « toutes les gardes de l'app
(`getSessionOrRespond`, layouts, middleware) traitent l'absence de
`session.user` comme une non-authentification ». Le middleware, non.

## Ce qui déclenche

Tout ce qui fait disparaître un compte sous une session encore valide :

- base de développement réinitialisée ou vidée (le cas rencontré) ;
- employé désactivé pendant qu'il est connecté ;
- mot de passe réinitialisé, donc `sessionsValidFrom` déplacé ;
- compte supprimé.

En production, la troisième et la quatrième ligne suffisent. Une personne dont
on révoque l'accès pendant sa session ne se retrouve pas déconnectée : elle se
retrouve enfermée, sans pouvoir se reconnecter.

## Le correctif

Un marqueur, porté par l'URL, qui dit au middleware que le rebond vient d'un
layout protégé.

- `app/(app)/layout.tsx` et `app/(app-v2)/v2/layout.tsx` renvoient désormais
  vers `/connexion?session=expiree` au lieu de `/connexion`.
- `middleware.ts` reconnaît ce marqueur sur les pages d'authentification : il ne
  redirige pas, laisse passer, et purge les deux cookies de session au passage.

Le cookie mort disparaît au lieu de survivre à la boucle.

## Vérification

Jeton périmé fabriqué avec `next-auth/jwt` sur un identifiant d'utilisateur
inexistant, puis rejoué :

| Requête | Avant | Après |
|---|---|---|
| `/connexion` | 307 vers le tableau de bord | 307 vers le tableau de bord |
| `/tableau-de-bord` | 307 vers `/connexion` | 307 vers `/connexion?session=expiree` |
| destination | rebouclait | 200 + `Set-Cookie` d'expiration ×2 |

Chaîne complète suivie comme le ferait un navigateur : **2 redirections puis
200**, au lieu d'une boucle. Jeton de test détruit après l'essai.

## En chemin

`npm run seed:demo`, `seed:cayard` et `seed:derisier:audit` appelaient `node`
directement. `node` ne lit pas `.env.local`, contrairement à Next : les trois
échouaient sur « Environment variable not found: DATABASE_URL » et n'avaient
donc jamais pu servir. Corrigés avec `--env-file=.env.local`, natif depuis
Node 20.6, sans nouvelle dépendance.

La base `safe_local` avait ses 122 tables et zéro ligne. Elle porte maintenant
le cabinet de démo : 2 utilisateurs, 2 clients, 2 dossiers.
