# A-05 — Rien n'isole les cabinets au niveau de la base

**Gravité** : P1
**Statut** : ouvert, non corrigé
**Revérifié le** : 2026-08-24, contre la base de production, en lecture seule

## Ce qui a été mesuré

```sql
select count(*) from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
 where ns.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity;   -->  124

select count(*) from pg_policies where schemaname = 'public';            -->    0

select current_user, rolsuper, rolbypassrls from pg_roles
 where rolname = current_user;
 --> { "current_user": "postgres", "rolsuper": false, "rolbypassrls": true }
```

Tables dont ce rôle est propriétaire : **124 sur 124**.

## Ce que ça veut dire

La sécurité au niveau des lignes est **activée** sur 124 tables et **aucune règle
n'est écrite**. Une table avec RLS activé et zéro politique refuse tout, sauf à son
propriétaire et aux rôles qui la contournent. L'application est les deux à la fois.

Conséquence directe : **l'isolation entre cabinets repose entièrement sur le code
applicatif**. Chaque requête doit porter son `cabinetId`. Une seule qui l'oublie
rend les données d'un autre cabinet, et la base ne rattrape rien.

Ce n'est pas théorique : l'audit du 2026-08-21 a trouvé des lectures sans filtre de
cabinet, dont `lireCodeCategorieDuCabinet`, corrigée depuis. Rien ne garantit qu'il
n'en reste pas.

## Le piège à éviter

Écrire les 124 politiques ne suffirait pas. **Le rôle applicatif porte
`rolbypassrls = true` et possède toutes les tables** : les politiques seraient
ignorées. Une correction qui s'arrêterait là donnerait l'apparence d'une protection
sans en installer aucune, ce qui est pire que l'absence, parce qu'on cesse de s'en
méfier.

La correction complète suppose :

1. un rôle de connexion distinct, sans `BYPASSRLS` et non propriétaire ;
2. la propagation du `cabinetId` de la session vers la base (`SET LOCAL app.cabinet_id`),
   ce que Prisma ne fait pas seul avec un pool de connexions ;
3. 124 politiques, plus les tables sans `cabinetId` qui doivent passer par une jointure ;
4. un chemin d'exception pour les tâches d'administration et la console SAFE Inc.,
   qui lisent légitimement plusieurs cabinets.

## Pourquoi ce n'est pas corrigé

Voir ci-dessus : c'est un chantier d'infrastructure, pas un correctif. Il touche la
façon dont l'application se connecte à sa base, donc il ne se déploie pas à moitié.

## Ce qui rendrait la correction urgente

- Le premier cabinet qui pose la question, et un cabinet d'avocats la posera.
- Une inspection du Barreau qui demande comment les dossiers d'un cabinet sont
  séparés de ceux d'un autre.
- Tout accès direct à la base accordé à un tiers.

## Voir aussi

- Matrice des permissions : `../matrice_permissions.csv`
- `lib/auth/api-guard.ts` — garde de rôle applicative, qui ne remplace pas celle-ci
