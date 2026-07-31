# 2026-07-31 — CH-04 livré : les registres deviennent produisibles

Sixième chantier du [Programme Inspection Ready](../compliance/PROGRAMME_INSPECTION_READY.md).
Ferme **P-5** (« la tenue » annoncée au client), **QC-17** et **ON-39**.

## L'obligation exacte

Elle n'était pas de tenir les registres. SAFE les tenait déjà en base. Elle est de
pouvoir en produire une copie :

> **art. 30 B-1 r.5** : les livres et registres doivent être tenus lisiblement, de
> façon permanente, sur support papier ou faisant appel aux technologies de
> l'information, **pourvu que des copies puissent en être tirées immédiatement, en
> tout temps**.
>
> **s. 21(2) By-Law 9** : « If a financial record is entered and posted by mechanical
> or electronic means, a licensee shall ensure that **a paper copy** of the record may
> be **produced promptly** on the Society's request. »

Une base de données n'est pas un registre tant qu'on ne peut pas l'imprimer.

## Livré

**Huit registres**, chacun déclarant ses colonnes et l'article qui les exige :

| Registre | Québec | Ontario |
|---|---|---|
| Journal de caisse fidéicommis | art. 38 | s. 18(1), (2) |
| Registre de cartes-clients | art. 39 | s. 18(3) |
| Cartes-clients des comptes particuliers | art. 66 | — |
| Registre des chèques | art. 61 | s. 18(2) |
| Journal de caisse d'administration | art. 34 | s. 18(5), (6) |
| Livre des honoraires | art. 28 (général) | s. 18(7) |
| Dossiers actifs | art. 9 | — |
| Dossiers fermés sur 7 ans | art. 9 | — |

**Trois sorties portant les mêmes données au caractère près** : écran, CSV et HTML
imprimable, à partir d'un unique formateur. Un inspecteur qui compare l'export au
document imprimé ne trouve aucune divergence.

## Décisions de conception

**Un seul formateur pour les trois sorties.** Si le CSV et l'impression formataient
séparément, ils divergeraient un jour, et c'est exactement ce qu'un inspecteur
attrape. Les montants sortent à deux décimales sans symbole ni séparateur : un
registre comptable se recoupe, il ne se décore pas.

**Le solde court par carte dans les cartes-clients**, pas globalement. C'est « le
nouveau solde après chaque inscription » de l'art. 39(1)f, propre à la carte
concernée. Le journal de caisse, lui, porte le solde du compte (art. 38(1)h), avec
report du solde d'ouverture quand le registre est filtré sur un mois — sans quoi la
première ligne serait fausse.

**Le journal d'administration exclut les flux fidéicommis.** Ce sont deux
comptabilités distinctes (art. 34 contre art. 38), et les mélanger serait exactement
le commingling que le règlement interdit.

**Un registre hors régime est refusé, pas rendu vide.** Demander les cartes-clients
de comptes particuliers pour un cabinet ontarien lève une erreur explicite : le
produire reviendrait à inventer une obligation.

**L'empreinte SHA-256 est dite pour ce qu'elle est.** Déterministe pour un même
contenu, indépendante de la date de production (sinon deux tirages du même registre
donneraient deux empreintes et la comparaison ne prouverait rien). Elle n'est exigée
par aucun article, et le code le dit.

## Un défaut de sourçage attrapé par un test

Le test « chaque registre porte au moins une colonne réglementaire » a échoué sur le
**livre des honoraires québécois** : B-1 r.5 n'a aucun article énumérant ses colonnes,
contrairement à la s. 18(7) ontarienne.

Plutôt que d'inventer une référence pour faire passer le test, l'invariant a été
reformulé : **un registre sans colonne sourcée doit expliquer pourquoi en note**. Un
second test verrouille le fait que ce cas est unique, pour qu'une future absence de
source soit traitée comme une régression et non comme une nuance.

## Vérification

`tsc --noEmit` propre. **103 fichiers de tests, 1 030 tests, tous verts.**
42 nouveaux tests sur ce chantier.

## Scores

| | Départ | CH-00+06 | CH-01 | CH-02 | CH-03 | CH-04 |
|---|---|---|---|---|---|---|
| Barreau du Québec | 48 | 60 | 67 | 74 | 80 | **85** |
| Law Society of Ontario | 42 | 44 | 49 | 57 | 66 | **71** |
| Global | 45 | 52 | 58 | 66 | 73 | **78** |

## Reste

Les **écrans** : consultation et impression des registres, saisie des nouveaux champs,
composition du rapport mensuel. Le moteur produit du HTML imprimable prêt à passer
dans la chaîne PDF existante (`lib/audit-report/pdf-playwright.ts`).

Prochains chantiers réglementaires : **CH-05** (chaîne des espèces, art. 69-73) et
**CH-07** (Ontario : Form 9A, double contrôle, cautionnement).
