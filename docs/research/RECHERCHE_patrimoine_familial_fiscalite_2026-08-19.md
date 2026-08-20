# Recherche — Le volet fiscal du patrimoine familial

**Date de recherche** : 2026-08-19
**Statut** : `draft` — **couverture partielle du mandat, voir §5**
**Complète** : `RECHERCHE_patrimoine_familial_QC_2026-08-19.md` (volet civil)
**Risque** : ÉLEVÉ

---

## 1. Résumé exécutif

**La question de l'impôt latent a une réponse, et elle change la conception de
l'outil.** La dette fiscale qui naîtra de la disposition d'un bien du patrimoine est
**déductible** au sens des articles 416 et 417 C.c.Q. Mais elle ne l'est qu'à une
condition, et cette condition est une appréciation judiciaire, pas un calcul.

**Conséquence directe** : le calculateur ne peut pas décider seul si l'impôt latent
entre dans le calcul. C'est une **cinquième zone** à ajouter aux quatre déjà
identifiées, et elle est plus fréquente que les quatre autres réunies, parce qu'il y a
un REER dans presque tous les dossiers.

**Un exemple publié montre pourquoi ça compte** : un partage qui semble parfaitement
égal peut être profondément inégal une fois l'impôt pris en compte.

---

## 2. La règle, et sa condition `VERIFIE`

Source : Lavallée, C. et Samoisette, L., « Le patrimoine familial : aspects civils et
fiscaux », (1997-98) 28 R.D.U.S. 259, Université de Sherbrooke. **Source secondaire de
doctrine**, rapportant une jurisprudence primaire.

Dans *Droit de la famille - 2384*, [1996] R.D.F. 410 (C.S.), le juge Jean-Pierre
Senécal conclut :

> « la dette reliée à la disposition d'un bien du patrimoine familial, et donc la dette
> d'impôt ou, selon le cas, la « charge » fiscale ou, plus exactement, la dette fiscale
> latente, fait partie des dettes devant être prises en compte dans le partage du
> patrimoine familial. C'est une dette implicitement visée aux articles 416 et 417
> C.c.Q. »

Le raisonnement rattache la dette fiscale au libellé de l'article 417 : la dette
consécutive à la disposition d'un bien découle de son « acquisition » et de sa
« conservation ».

**La condition, et c'est elle qui empêche d'automatiser :**

> « Mais il ne peut en être ainsi que si la dépense est réellement encourue ou qu'il
> est prévisible et probable qu'elle le sera dans un avenir prochain. Si tel n'est pas
> le cas, le tribunal doit apprécier selon les circonstances si elle doit être prise en
> considération et dans quelle mesure. »

Jurisprudence citée au même sens : *Droit de la famille - 713*, [1990] R.J.Q. 2115
(C.A.) ; *Droit de la famille - 1747*, [1993] R.D.F. 227 (C.S.) ; *Droit de la famille -
2028*, [1994] R.D.F. 544 (C.S.) ; *Droit de la famille - 2141*, [1995] R.D.F. 131
(C.S.) ; *Droit de la famille - 2550*, [1996] R.D.F. 875 (C.S.) ; *Droit de la famille -
2631*, [1997] R.J.Q. 1307 (C.S.).

`A_CONFIRMER` **Ces décisions ont trente ans.** Je n'ai pas pu confirmer l'état du droit
en 2026 à partir d'une source primaire, et aucune décision récente n'a été dépouillée.
La règle est présentée par la doctrine comme établie, mais la vérification manque. Une
recherche sur CanLII, postérieure à 2020, est nécessaire avant de s'y fier.

---

## 3. L'exemple qui montre l'enjeu `VERIFIE`

Tiré de la même source, §II. Deux biens, deux valeurs identiques.

| | Madame | Monsieur |
|---|---|---|
| Bien | REER | Résidence familiale |
| Valeur brute | 80 000 $ | 80 000 $ |
| **Partage apparent** | **aucune créance** | **aucune créance** |
| Impôt à la disposition | 32 000 $ (taux combiné de 40 %) | nul, exemption pour résidence principale |
| **Valeur nette après impôt** | **48 000 $** | **80 000 $** |

Un partage qui donne zéro de créance laisse en réalité un écart de 32 000 $ entre les
deux conjoints. Les auteures concluent que les incidences fiscales peuvent provoquer
« d'une manière indirecte, un partage inégal », contraire au principe même de
l'article 416.

**Ce cas devient un scénario de test**, et il est le meilleur argument possible pour
l'outil : le calcul qui a l'air juste ne l'est pas.

---

## 4. Ce que ça impose au calculateur

**Cinquième zone de refus.** L'outil ne décide pas si l'impôt latent s'applique. Il
détecte la situation, la nomme, et pose la question :

> Ce bien est-il susceptible d'être vendu ou liquidé dans un avenir prochain ?
> Si oui, la charge fiscale correspondante est déductible. Sinon, le tribunal
> apprécie, et ce calcul ne peut pas le faire à sa place.

**Deux affichages obligatoires**, dès qu'un bien à imposition latente est saisi :

1. le partage **sans** impôt latent ;
2. le partage **avec**, si l'utilisateur fournit un taux et une probabilité de
   disposition.

Les montrer côte à côte est plus honnête qu'un chiffre unique, et c'est exactement ce
que l'avocate a besoin de voir pour plaider.

**Les biens concernés** ne sont pas tous égaux : `INFERENCE`, tirée de l'exemple, un
REER porte un impôt latent sur la totalité du retrait, une résidence principale n'en
porte aucun si les conditions de l'exemption sont remplies, et un immeuble locatif ou
un portefeuille porte un gain en capital. L'outil doit donc connaître la nature du
bien, pas seulement sa valeur.

---

## 5. Ce que cette recherche N'A PAS couvert

Le mandat comportait quatre questions. Cette note en traite **une et demie**. Je le
dis plutôt que de laisser croire à une couverture complète.

| Question du mandat | État |
|---|---|
| Q1 — périmètre législatif exhaustif au-delà des art. 414-426 | **non traitée** |
| Q2 — dispositions fiscales | **partielle** : l'impôt latent est traité, les articles précis du roulement REER/FERR/CELI, des droits de mutation et de l'art. 160 L.I.R. **ne le sont pas** |
| Q3 — scénarios chiffrés publiés | **un seul trouvé** (§3), les huit situations listées restent à documenter |
| Q4 — les quatre zones non tranchées | **non traitée** ; aucune jurisprudence dépouillée |

**Aucune recherche CanLII n'a été faite.** C'est le manque principal, et il touche Q4
autant que la vérification de l'âge des décisions du §2.

---

## 6. Sources

**Doctrine**
- Lavallée, C. et Samoisette, L., « Le patrimoine familial : aspects civils et
  fiscaux », (1997-98) 28 [R.D.U.S.](https://www.usherbrooke.ca/droit/fileadmin/sites/droit/documents/RDUS/volume_28/28-12-lavalleesamoisette.pdf)
  259. Texte intégral consulté le 2026-08-19.

**Jurisprudence, citée par la doctrine, non consultée directement**
- *Droit de la famille - 2384*, [1996] R.D.F. 410 (C.S.) — la décision centrale
- *Droit de la famille - 713*, [1990] R.J.Q. 2115 (C.A.)
- et cinq autres, listées au §2

**Primaire**
- C.c.Q. art. 416 et 417, déjà détenus
- Loi de l'impôt sur le revenu, L.R.C. (1985) (5e suppl.), c. 1
