# 2026-07-31 — CH-09 livré : le rapport comptable annuel

Dixième chantier du [Programme Inspection Ready](../compliance/PROGRAMME_INSPECTION_READY.md).
Ferme **QC-28** de l'audit. Le Québec passe à 98.

## Ce que l'art. 42 impose

> « Au moins une fois par an et dans les 30 jours suivant la réception d'une demande
> par le directeur de l'inspection professionnelle, l'avocat doit transmettre à ce
> dernier, en utilisant le formulaire prescrit par le Comité exécutif, un rapport
> comptable annuel couvrant la période de 12 mois identifiée dans la demande. »

Sept blocs, pour **chaque compte général en fidéicommis**.

## Québec seulement, et l'affirmation est bornée

By-Law 9, lu intégralement, **n'impose aucun rapport comptable annuel**. Ses
obligations périodiques s'arrêtent à la comparaison mensuelle de la s. 18(8), à
produire dans les 25 jours. Le service refuse de s'exécuter hors Québec.

**Incertitude déclarée.** Le LSO impose par ailleurs un « Lawyer Annual Report ».
Cette obligation ne figure pas dans By-Law 9 et n'a pas été lue dans cette session.
Elle existe donc probablement, mais hors du corpus vérifié : le module ne la modélise
pas et ne prétend pas le contraire. Dire « l'Ontario n'a pas de rapport annuel » tout
court aurait été faux.

## Deux blocs sans équivalent au rapport mensuel

| Bloc | Différence |
|---|---|
| **42(4)** | Le total des recettes et des débours de **chaque mois** de la période. Douze couples de totaux, là où l'art. 41(4) n'en demande qu'un. |
| **42(7)** | La liste des comptes généraux **et particuliers fermés** au cours de la période. Aucune obligation équivalente ailleurs. |

L'art. 42(7) est ce qui explique une décision prise dès CH-01 : **un compte fermé
n'est jamais supprimé**. Il doit pouvoir figurer au rapport de la période de sa
fermeture, parfois des mois plus tard.

## Trois décisions

**Le délai part de la demande, pas du calendrier.** Sans demande du directeur, il n'y
a pas d'échéance — seulement l'obligation de rendre compte « au moins une fois par
an ». Calculer une échéance en son absence inventerait un délai.

**Les totaux mensuels reprennent les rapports mensuels certifiés.** Les recalculer
depuis le registre pourrait donner un chiffre différent de celui déjà signé. Un mois
sans rapport est calculé depuis le registre **et marqué non certifié**, ce qui bloque
la certification annuelle.

**Réutilisation plutôt que duplication.** Les blocs 42(1) à 42(3) exigent les mêmes
listes que les art. 41(1) à 41(3). Les trois tables de lignes du rapport mensuel
accueillent donc aussi le rapport annuel, via `annualReportId`. Dupliquer ferait
diverger deux définitions d'une même chose, et un inspecteur qui recoupe le mensuel
et l'annuel trouverait deux vérités.

## Une exigence présentée pour ce qu'elle est

La certification annuelle est bloquée tant que les **douze rapports mensuels** ne sont
pas certifiés. Cette règle ne vient pas directement de l'art. 42 : elle découle de sa
combinaison avec l'art. 40, qui impose un registre permanent des rapports mensuels.

Le message de blocage le dit explicitement — « cette exigence découle de la
combinaison des art. 40 et 42, elle n'est pas une phrase du règlement ». La donner
pour une citation serait inventer une règle.

## Vérification

`tsc --noEmit` propre. **111 fichiers de tests, 1 227 tests, tous verts.**
39 nouveaux tests sur ce chantier.

## Scores

| | Départ | CH-05 | CH-07 | CH-08 | CH-09 |
|---|---|---|---|---|---|
| Barreau du Québec | 48 | 91 | 93 | 96 | **98** |
| Law Society of Ontario | 42 | 77 | 92 | 95 | **95** |
| Global | 45 | 84 | 93 | 96 | **97** |

L'Ontario ne bouge pas : ce chantier est intégralement québécois.

## Reste

**CH-10** (solde débiteur, intérêts au Fonds d'études juridiques et à la LFO),
**CH-11** (rétention différenciée, mode inspecteur, trousse d'inspection),
**CH-12** (registre de conformité vivant, cycle de vie du cabinet). Et les écrans.
