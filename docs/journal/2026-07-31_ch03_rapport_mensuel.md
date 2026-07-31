# 2026-07-31 — CH-03 livré : le rapport comptable mensuel

Cinquième chantier du [Programme Inspection Ready](../compliance/PROGRAMME_INSPECTION_READY.md).
Ferme **M-01** de l'audit, le constat numéro un : « le livrable central de
l'inspection n'existe pas ».

## Ce qui existait avant

`chequesEnCirculation` et `depotsEnTransit` : **deux nombres flottants saisis à la
main**. Aucune ligne, nulle part.

Or l'art. 41 B-1 r.5 exige sept blocs, dont **quatre sont des listes détaillées** :

| Bloc | Ce que le texte énumère |
|---|---|
| 41(1) | soldes de cartes-clients · nom du client · dossier · **date de la dernière inscription** |
| 41(2) | chèques en circulation · montant · date d'émission · **numéro** · client · dossier |
| 41(3) | recettes en circulation · montant · date de réception · client · dossier |
| 41(4) | total des recettes et des débours du mois |
| 41(5) | état comparatif journal ↔ relevé bancaire |
| 41(6) | comptes particuliers · institution · numéro · ouverture · dépôt initial |
| 41(7) | **copie du relevé** de l'institution pour le mois visé |

Un inspecteur demande la liste, pas le total.

## Livré

- **`TrustMonthlyReport`** par compte bancaire et par période, avec les quatre tables
  de lignes et les motifs d'écart.
- **Génération des sept blocs**, dérivés du registre append-only. La date de dernière
  inscription vient d'un `_max` sur les écritures : le champ que SAFE n'avait nulle part.
- **Certification** avec six contrôles exécutés, sérialisés, et attestation générée à
  partir d'eux.
- **Figeage** du rapport signé, listes comprises.
- **`lib/compliance/monthly-report.ts`** — module pur : blocs par province, blocages
  de certification, échéance. 20 tests.

## Deux décisions de fond

**Le compte particulier n'apparaît pas en Ontario.** L'art. 41(6) est propre au régime
québécois : By-Law 9 ne connaît pas cette catégorie. L'ajouter inventerait une
obligation, ce qui est aussi grave que d'en omettre une.

**Correction de doctrine par rapport à CH-00.** Le rapprochement exigeait un écart
strictement **nul**. C'est plus strict que le règlement. L'art. 41(5) exige un « état
comparatif », et la s. 18(8) exige la comparaison « together with **the reasons** for
any differences ». Un écart motivé est conforme ; un écart silencieux ne l'est pas.

Exiger zéro avait un effet pervers concret : l'utilisateur ajuste un chiffre jusqu'à
ce que l'écart tombe, ce qui détruit précisément l'information que l'inspecteur
cherche. On bloque désormais **l'absence de motif**, pas l'écart.

Le solde débiteur reste bloquant même motivé. Ce n'est pas une différence à
expliquer : c'est l'utilisation des fonds d'un autre client, que l'art. 60 impose de
combler sans délai.

## Une limite assumée

Les **recettes en circulation** ne sont pas déduites automatiquement. SAFE ne dispose
d'aucune donnée bancaire : il ne peut pas savoir ce que la banque a crédité. Le
service propose donc les dépôts de la période et l'utilisateur coche ceux qui
n'apparaissent pas au relevé, exactement le geste d'un teneur de livres. Deviner
produirait un rapport faux.

## Vérification

`tsc --noEmit` propre. **101 fichiers de tests, 988 tests, tous verts.**
35 nouveaux tests sur ce chantier.

## Scores

| | Départ | CH-00+06 | CH-01 | CH-02 | CH-03 |
|---|---|---|---|---|---|
| Barreau du Québec | 48 | 60 | 67 | 74 | **80** |
| Law Society of Ontario | 42 | 44 | 49 | 57 | **66** |
| Global | 45 | 52 | 58 | 66 | **73** |

## Ce qui reste sur le rapport

Le **rendu PDF paginé** (CH-04) et les écrans de saisie. Les données sortent, il
reste à les imprimer.

**Jalon commercial atteint** : un cabinet peut désormais produire le document que
l'inspecteur demande en premier.
