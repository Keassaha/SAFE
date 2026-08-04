# 2026-08-04 — CH-13 livré : la transmission de la facture

Corrige le défaut relevé au §4.3 de la
[réévaluation du 2026-08-03](../compliance/REEVALUATION_2026-08-03.md).

C'était le seul point restant qui touche **l'argent des clients** plutôt que la
production de documents.

## Le défaut

> art. 56(2) QC : retrait permis pour les honoraires « pour lesquels la facturation a
> été **envoyée** ».
> s. 9(1)3 ON : fees « for which a billing has been **delivered** ».

Envoyée, pas préparée. Délivrée, pas émise.

Or `issueInvoice` posait `sentAt: now` **au moment de l'émission**, sans qu'aucun envoi
n'ait lieu. Le garde-fou `INVOICE_NOT_DELIVERED`, construit au CH-00, vérifiait donc une
date qui ne prouvait rien : **toute facture émise ouvrait le retrait.**

Ce n'était pas une régression. C'est un défaut préexistant que le garde-fou a rendu
visible en s'appuyant dessus, et qui a survécu treize chantiers.

## Ce qui a changé

`sentAt` n'est plus posé à l'émission. Une nouvelle donnée porte le fait réglementaire :
`deliveredAt` et son **canal**.

| Canal | SAFE détient | Ouvre le retrait |
|---|---|---|
| Courriel envoyé depuis SAFE | la **preuve** (journal d'envoi) | ✅ sans signalement |
| Poste, main propre, autre courriel, portail | la **déclaration** du cabinet | ✅ signalé comme déclaré |
| Transmission présumée (avant le 2026-08-03) | rien | ✅ signalé comme présumé |
| Aucune | — | ❌ |

## La décision qui compte : ne pas faire un mur

N'accepter que l'envoi courriel de SAFE aurait été **du sur-blocage**, la faute que
l'audit met au même rang que le sous-blocage. Un cabinet qui poste ses factures les a
bel et bien envoyées. Lui refuser le retrait l'aurait poussé à contourner, et le
contournement détruit exactement la traçabilité qu'on protège.

La porte de sortie est donc explicite : une **déclaration de transmission**, datée,
attribuée, avec son canal. Elle n'exige ni pièce jointe ni preuve — l'imposer aurait
transformé la porte en second mur, et un cabinet qui a posté une facture n'a souvent que
sa parole, ce que le règlement n'interdit pas.

**Ce que SAFE ne fait pas : maquiller une déclaration en preuve.** La différence est
portée par le canal, écrite au dossier, et journalisée à chaque retrait qui s'y appuie.

## L'héritage, qualifié plutôt que réécrit

Les factures existantes portaient un `sentAt` issu de l'émission. Deux mauvaises options :

- l'effacer aurait bloqué le retrait sur des factures **réellement transmises**, sur la
  seule base d'un défaut logiciel qui n'est pas le fait du cabinet ;
- le reprendre tel quel aurait prétendu qu'une preuve existe.

Choix retenu : reprendre la date **et la marquer** `LEGACY_PRESUME`. Le retrait reste
possible, et tout retrait qui s'y appuie est signalé comme reposant sur une transmission
présumée. C'est le principe de l'interrupteur daté du CH-06 : on ne réécrit pas le passé,
on le qualifie.

Reprise locale : 2 factures marquées.

## Trois contrôles ajoutés au passage

- **Une date sans canal est refusée.** Sinon n'importe quelle date écrite en base
  rouvrirait le retrait.
- **On ne peut pas s'attribuer un envoi SAFE à la main.** `EMAIL_SAFE` n'est posé que par
  la route d'envoi réelle, et seulement si l'envoi a réussi.
- **La transmission ne peut pas être postérieure au retrait.** Sans quoi on retirerait
  aujourd'hui en déclarant demain avoir transmis la semaine dernière.

## Un mock qui rendait un test vert à tort

Le mock d'audit des tests CH-00 ne capturait que `metadata.reason`. Mon signalement passe
par `newValues` : le test de journalisation était vert sans rien vérifier. Le mock capture
maintenant la charge entière.

## Effets de bord, tous dans le bon sens

- `billing-journal.ts` datait l'écriture sur `sentAt ?? dateEmission`. `sentAt` étant
  désormais nul à l'émission, elle tombe sur `dateEmission` — ce qui est la date correcte.
- `RegistreTacheTable` affichait « transmise au client » pour toute facture émise. C'est
  maintenant exact.
- L'enum legacy `InvoiceStatut` n'a pas de valeur « emise » : `statut` reste `envoyee`
  pour une facture émise. Abus de langage hérité, désormais sans effet réglementaire,
  signalé en commentaire. À traiter séparément (17 sites de lecture).

## Vérification

`tsc --noEmit` propre, `next build` propre.
**118 fichiers de tests, 1 393 tests, tous verts.** 30 nouveaux tests.
Migration additive appliquée en local.

## Reste

L'écran de déclaration de transmission n'existe pas encore : le service est là, la porte
de sortie est ouverte côté code, mais un cabinet qui poste ses factures ne peut pas encore
le déclarer lui-même. **C'est un sur-blocage tant que l'écran manque**, et il doit venir
avec la vague d'écrans.

Suite prévue : la trousse d'inspection, puis les registres imprimables.
