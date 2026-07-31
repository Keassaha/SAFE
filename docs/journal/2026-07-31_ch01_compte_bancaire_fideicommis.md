# 2026-07-31 — CH-01 livré : le compte bancaire en fidéicommis

Troisième chantier du [Programme Inspection Ready](../compliance/PROGRAMME_INSPECTION_READY.md).
Ferme **M-02** et **A-1** de l'audit : la dette de conception la plus lourde.

## Le problème

`TrustAccount` n'est pas un compte bancaire. C'est le sous-compte d'un client pour un
dossier, autrement dit la carte-client. SAFE ne modélisait donc **nulle part** la
banque, alors que tout le règlement raisonne par compte :

| Article | Exigence |
|---|---|
| art. 36 QC | livres, journaux et registres **distincts** pour chaque compte général |
| art. 41(7) QC | copie du relevé de l'institution pour **chaque** compte général |
| art. 42(6)(7) QC | liste des comptes particuliers, et des comptes fermés dans l'année |
| art. 62-68 QC | comptes particuliers, qui n'existaient pas du tout |
| s. 7(5) ON | « A licensee may keep one or more trust accounts » |
| s. 18(8)ii ON | « a detailed reconciliation made monthly of **each** trust bank account » |
| s. 9(3) ON | jamais plus que ce qui est détenu pour ce client **dans ce compte** |

Conséquence : un cabinet à deux comptes mélangeait deux banques dans un seul écart de
rapprochement, et aucun rapport réglementaire n'était produisible.

## Livré

- **`TrustBankAccount`** — général et particulier, institution, succursale, libellé,
  numéro, entente B-1 r.10, formulaire réglementaire, ouverture, fermeture motivée,
  bénéficiaire des intérêts.
- **`lib/compliance/trust-bank-account.ts`** — module pur : validation du libellé
  (insensible aux accents, parce que la banque écrit « FIDEICOMMIS » en majuscules
  sans accent), manquements bloquants et non bloquants, démarches post-ouverture,
  bénéficiaire des intérêts. 24 tests.
- **Service d'ouverture** — l'ouverture devient un **acte explicite**.
- **Toutes les écritures portent leur compte**, dépôt, retrait et correction.
- **Plafond de retrait borné au compte visé** (s. 9(3)).
- **Rapprochement par compte** : la clé d'unicité passe de `[cabinetId, periode]` à
  `[cabinetId, trustBankAccountId, periode]`.
- **Migration avec reprise**, testée sur données synthétiques : 3 écritures
  rattachées, solde exact, ouverture datée de la première écriture, zéro orpheline.

## Décisions de conception

**L'ouverture n'est plus un effet de bord.** Avant, un « compte » naissait au premier
dépôt. Ouvrir un compte général est pourtant réglementé : institution ayant une
entente avec le Barreau, succursale québécoise, libellé portant la mention,
formulaire transmis sans délai au Barreau et à l'institution. Rien de cela ne se
déduit d'un montant saisi dans un formulaire de dépôt.

**Bloquant et non bloquant sont deux choses différentes.** Un libellé non conforme
empêche l'ouverture. Une entente B-1 r.10 non encore confirmée ne l'empêche pas : le
compte existe déjà à la banque, et bloquer la saisie n'y changerait rien. On signale
et on suit.

**Le système refuse de choisir le compte à la place de l'utilisateur.** Un seul compte
général ouvert : il est retenu sans rien demander. Deux : l'écriture reste sans
rattachement plutôt que d'être imputée au hasard. Imputer de l'argent client au
mauvais compte produit un écart qui ne se verrait qu'au rapprochement suivant.

**La reprise n'invente rien.** Le compte créé pour l'existant porte « coordonnées à
compléter » comme nom d'institution et de numéro. Un faux numéro dans un rapport
réglementaire serait pire que l'absence de compte.

## Défaut trouvé en chemin

`vitest.config.ts` n'aliasait pas `server-only`, paquet absent du `node_modules`.
Résultat : `ready-for-review-detection-hooks.test.ts` **ne se chargeait pas du tout**
depuis le commit `a300a7d`, et ne signalait donc aucune régression. Corrigé par un
substitut de test. Le fichier, une fois chargé, a immédiatement révélé une vraie
régression liée à CH-06.6 — corrigée elle aussi.

Un fichier de tests qui ne se charge pas est pire qu'un test rouge : il est invisible.

## Vérification

`tsc --noEmit` propre. **97 fichiers de tests, 913 tests, tous verts.** Plus aucun
écart connu dans la suite.

## Scores

| | Départ | Après CH-00 + CH-06 | Après CH-01 |
|---|---|---|---|
| Barreau du Québec | 48 | 60 | **67** |
| Law Society of Ontario | 42 | 44 | **49** |
| Global | 45 | 52 | **58** |

## Reste dans le périmètre du compte

Registre de chèques numérotés (art. 61 → CH-02), registre propre aux comptes
particuliers (art. 66 → CH-04), restrictions d'usage du compte particulier (art. 65).
Les écrans de gestion des comptes restent à faire.

**Prochain chantier utile : CH-02** (champs réglementaires et pièces justificatives),
qui débloque CH-03, le rapport comptable mensuel.
