# 2026-07-31 — CH-02 livré : les champs du journal et les pièces justificatives

Quatrième chantier du [Programme Inspection Ready](../compliance/PROGRAMME_INSPECTION_READY.md).
Ferme **M-13**, **M-04** et **M-07** de l'audit. C'est le chantier qui débloque CH-03,
le rapport comptable mensuel.

## Le problème

Le journal de caisse en fidéicommis portait la date, le montant, le client, le dossier
et une description libre. L'art. 38 B-1 r.5 en exige davantage :

| Sens | Champs exigés et absents |
|---|---|
| Recettes (art. 38(1)) | nom de la personne **de qui** la somme est reçue · **objet** · indicateur **espèces** |
| Débours (art. 38(2)) | nom du **bénéficiaire** · **objet** · mode de retrait · **numéro de chèque** |

Le problème se propageait : les cartes-clients de l'art. 39 reprennent les mêmes
champs, et la liste des chèques en circulation de l'art. 41(2) exige numéro, date
d'émission, montant, client et dossier. Sans registre de chèques, elle se réduisait à
un nombre saisi à la main. C'est ce qu'elle était.

## Livré

- **Champs de l'art. 38** sur `TrustTransaction` : payeur, bénéficiaire, objet typé
  et libre, numéro de chèque, indicateur espèces, affectation (art. 48), fonds de
  tiers (art. 49), et surtout **`receivedAt` distinct de `depositedAt`** — sans les
  deux dates, le « sans délai » de l'art. 50 est invérifiable.
- **Champs de l'art. 34** sur le journal d'administration.
- **`TrustCheque`** — registre avec numérotation consécutive par compte, détection des
  trous, chèques en circulation pour l'art. 41(2), annulation conservée.
- **`TrustTransactionDocument`** — pièces justificatives de l'art. 32 et de la
  s. 18(10), avec rôles typés et rapport des pièces manquantes sur une période.
- **`lib/compliance/trust-records.ts`** — module pur : champs exigés par sens et par
  province, bénéficiaires interdits, séquence, pièces attendues par mode, délai de
  dépôt. 27 tests.

## Décisions de conception

**Signaler plutôt que bloquer (PR-8).** Aucun de ces contrôles n'empêche une écriture.
Refuser un dépôt parce que le bordereau n'est pas encore scanné pousserait
l'utilisateur à ne pas enregistrer l'opération. Une opération non consignée est
invisible au rapprochement ; une pièce manquante est une ligne dans une liste.

**Une seule exception : le bénéficiaire d'un chèque.** L'art. 57 al. 2 est une
interdiction, pas une exigence de forme. « cash », « caisse », « au porteur » et le
chèque en blanc sont refusés avant toute écriture.

**Mais « Caisse Desjardins » passe.** Refuser sur simple présence du mot bloquerait
un paiement parfaitement licite, ce qui pousse au contournement. La comparaison porte
sur le nom entier normalisé, pas sur une sous-chaîne.

**Le registre suit, il ne conditionne pas.** L'inscription du chèque se fait après
l'écriture : le mouvement de fonds existe indépendamment du registre. Une erreur
d'inscription ne doit pas annuler un décaissement déjà parti à la banque.

**Le seuil des six mois est dit pour ce qu'il est.** Un chèque en circulation depuis
plus de six mois est signalé, mais le commentaire précise que ce seuil vient de la
pratique bancaire canadienne et **non du règlement**. Personne ne pourra le citer
comme une règle du Barreau.

**Le délai de dépôt ne déclare aucune infraction.** Ni l'art. 50 ni la s. 7(1) ne
chiffrent un nombre de jours. Le système mesure l'écart et le signale au-delà d'un
jour ouvrable, en disant explicitement que le repère n'est pas un délai réglementaire.
La présomption de la s. 1(3) By-Law 9 ne vaut que pour les s. 9(1)(2)(3) et 14 : elle
ne crée pas de délai général, contrairement à ce que le registre interne affirmait
avant correction.

## Vérification

`tsc --noEmit` propre. **99 fichiers de tests, 953 tests, tous verts.**
40 nouveaux tests sur ce chantier.

## Scores

| | Départ | CH-00 + CH-06 | CH-01 | CH-02 |
|---|---|---|---|---|
| Barreau du Québec | 48 | 60 | 67 | **74** |
| Law Society of Ontario | 42 | 44 | 49 | **57** |
| Global | 45 | 52 | 58 | **66** |

## Prochain chantier

**CH-03, le rapport comptable mensuel de l'art. 41.** Toutes ses données existent
désormais en base : chèques en circulation ligne par ligne, soldes de cartes-clients
avec date de dernière inscription, pièces manquantes, écarts. C'est le jalon
commercial du programme.
