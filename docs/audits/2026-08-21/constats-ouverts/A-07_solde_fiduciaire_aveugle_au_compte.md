# A-07 — Le solde d'un client ignore dans quel compte l'argent se trouve

**Gravité** : P2
**Statut** : ouvert, non corrigé
**Revérifié le** : 2026-08-24

## ⚠️ Le libellé d'origine n'a pas survécu à la revérification

L'audit du 2026-08-21 décrivait « une divergence de cache entre soldes bornés et non
bornés ». **Il n'y a pas de cache.** `trust-balance-service.ts` recalcule chaque solde
depuis le registre append-only à chaque appel. Ce constat était mal formulé.

Ce qui est vérifiable aujourd'hui est voisin mais différent, et vaut d'être gardé.

## Ce qui a été mesuré

`lib/services/fideicommis/trust-balance-service.ts:12` — `getTrustBalance` agrège
les transactions sur `{ cabinetId, clientId, dossierId }` et **ne filtre jamais sur
`trustBankAccountId`**.

`lib/services/fideicommis/trust-balance-service.ts:33` — `getGlobalTrustBalance`
accepte au contraire un `trustBankAccountId` optionnel, et son commentaire dit
pourquoi : art. 36 B-1 r.5 impose des livres distincts par compte général, s. 18(8)ii
By-Law 9 impose le rapprochement détaillé de chaque compte.

Les deux fonctions ne suivent donc pas la même règle.

## Ce que ça produit

Un client dont les fonds sont répartis sur deux comptes en fidéicommis obtient de
`getTrustBalance` **un solde fusionné**, qui ne correspond à aucun compte réel et
qui ne se rapproche avec aucun relevé bancaire.

Le cas n'est pas hypothétique : c'est exactement la configuration que A-01 a rendue
détectable. `resolveTrustBankAccountId` refuse désormais d'agir quand un cabinet a
deux comptes ouverts, en levant `TRUST_BANK_ACCOUNT_AMBIGUOUS`. Cette porte est
fermée à l'écriture. **La lecture, elle, répond toujours.**

## Pourquoi ce n'est pas corrigé

Aucun cabinet en production n'a deux comptes en fidéicommis ouverts. Le défaut est
réel mais actuellement inatteignable.

Le corriger demande de décider ce que `getTrustBalance` doit rendre quand aucun
compte n'est précisé : refuser comme A-01, ou rendre un détail par compte. C'est un
choix de contrat, à faire avec ses appelants sous les yeux.

## Ce qui rendrait la correction urgente

**Le jour où un cabinet ouvre un second compte en fidéicommis.** C'est courant :
un compte général et un compte séparé pour une transaction immobilière importante.
Ce jour-là, le constat passe de dormant à faux solde affiché.

## Voir aussi

- [A-08](A-08_deux_comptes_generaux_possibles.md) — le schéma autorise justement deux comptes généraux pour un même client
- [A-03](A-03_argent_en_virgule_flottante.md) — même surface de risque, l'exactitude des soldes
