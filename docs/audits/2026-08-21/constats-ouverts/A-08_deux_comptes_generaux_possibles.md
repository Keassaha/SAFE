# A-08 — Le schéma autorise deux comptes généraux pour un même client

**Gravité** : P2
**Statut** : ouvert, non corrigé
**Revérifié le** : 2026-08-24

## Ce qui a été mesuré

`prisma/schema.prisma`, modèle `TrustAccount` :

```prisma
matterId  String?
@@unique([cabinetId, clientId, matterId])
```

## Pourquoi la contrainte ne contraint pas

En PostgreSQL, **deux `NULL` ne sont pas égaux**. Un index unique portant une colonne
nullable laisse donc passer autant de lignes que l'on veut, dès lors que cette colonne
vaut `NULL`.

Ici `matterId = NULL` signifie « compte client général, non rattaché à un dossier ».
La contrainte empêche donc deux comptes pour le même dossier, et n'empêche **rien**
pour le compte général, qui est précisément celui qu'un cabinet utilise le plus.

Deux comptes généraux pour un même client, c'est deux soldes, deux registres, et un
rapprochement qui ne tombe jamais.

## La correction connue

Un index unique partiel :

```sql
create unique index trust_account_general_unique
  on "TrustAccount" ("cabinetId", "clientId")
  where "matterId" is null;
```

Additif, non destructeur. Il échouera à la création si des doublons existent déjà,
ce qui est le comportement souhaitable : il faut alors les traiter avant.

## Pourquoi ce n'est pas corrigé

La correction est simple, sa vérification préalable ne l'est pas. Il faut d'abord
compter les doublons existants en production, décider quoi en faire (fusion ou
correction manuelle), puis migrer. Ce n'est pas un geste à faire en fin de séance.

Aucun cabinet en production n'a de doublon aujourd'hui, le défaut est donc dormant.

## Ce qui rendrait la correction urgente

Le même déclencheur que [A-07](A-07_solde_fiduciaire_aveugle_au_compte.md) : le premier cabinet à ouvrir un second compte.
Traiter les deux ensemble a du sens, ils décrivent la même lacune vue de deux côtés.
