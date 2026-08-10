# Réévaluation réglementaire — SAFE

**Date** : 2026-08-10
**Objet** : reprendre la [réévaluation du 2026-08-03](REEVALUATION_2026-08-03.md) après la livraison des onze écrans de la section Inspection
**Méthode** : vérification dans le code, pas dans les notes de chantier

---

## 0. Avertissement de fiabilité

**J'audite mon propre travail**, et j'ai écrit les écrans que j'évalue ici. C'est la
pire position pour être sévère.

Trois précautions, qui n'annulent pas le biais :

1. Chaque affirmation est adossée à une vérification dans le code ou dans `git`, pas
   aux journaux de chantier.
2. La recherche a commencé par ce qui MANQUE, pas par ce qui a été livré.
3. Le §3 nomme le défaut qui rend une partie du §2 théorique. Un tiers devrait le lire
   en premier.

---

## 1. La question posée, et pourquoi elle se reformule

> « Est-ce que SAFE est réglementaire ? »

La question n'a pas de réponse en l'état, et ce n'est pas une esquive.

**Le règlement n'oblige pas SAFE. Il oblige l'avocate.** C'est elle qui tient les
livres (art. 30), elle qui certifie le rapport (art. 41), elle que le directeur de
l'inspection professionnelle interroge (art. 29). Aucun logiciel n'est partie à cette
obligation, et aucun ne peut la porter à sa place.

Ce qu'un logiciel peut être :

- un outil qui rend l'obligation **tenable** — produire en un clic ce qui prendrait
  deux jours à reconstituer ;
- un outil qui refuse les gestes qui mettraient le cabinet **en défaut** ;
- un outil qui ne **fabrique pas** de fausse conformité — ne jamais afficher comme
  prouvé ce qui n'est que déclaré.

C'est la seule promesse défendable devant un inspecteur, et c'est aussi la seule qui
ne transfère pas au vendeur la responsabilité professionnelle de l'acheteur.

---

## 2. Les 25 documents du §16.2, troisième recomptage

| | 2026-07-30 | 2026-08-03 | 2026-08-10 |
|---|---|---|---|
| Producible par le cabinet | 2 | 6 | **19** |
| Donnée en base, aucun écran | 0 | 16 | **3** |
| Absent, assumé | 13 | 3 | **3** |

### 2.1 Ce qui a bougé depuis le 3 août

Treize des seize documents « sans écran » en ont un. Les écrans vivent tous sous
`/inspection`, dont cinq livrés le 2026-08-10 :

| Document | Écran | Article |
|---|---|---|
| Journal de caisse fidéicommis imprimable | `/inspection/registres` | art. 38 · s. 18(1) |
| Journal d'administration imprimable | `/inspection/registres` | art. 38 · s. 18(2) |
| Chèques compensés, registre des chèques | `/inspection/registres` | art. 61 · s. 11 |
| Copies papier de tous les registres | `/inspection/registres` | art. 30 · par. 21(2) |
| Liste des dossiers fermés sur 7 ans | `/inspection/registres` + `/inspection/cycle-de-vie` | art. 9 |
| Reçus d'espèces | `/inspection/especes` | art. 69-73 · s. 4-6 |
| Déclarations art. 71 | `/inspection/especes` | art. 71 · s. 19 |
| Registre des autres biens | `/inspection/autres-biens` | art. 43-46 · s. 18(9) |
| Trousse d'inspection | `/inspection/trousse` | art. 29, 30, 33 |
| **Rapport annuel** | `/inspection/rapport-annuel` | art. 42 |
| **Preuve de conservation** | `/inspection/conservation` | art. 29-33 · s. 21-23 |
| **Confirmations de virement** | `/inspection/virements` | s. 12(2)3 |
| **Form 9A** | `/inspection/virements` | s. 12(2)4 |

### 2.2 Les trois qui restent sans écran

| Service | Fichier | Pourquoi ça compte |
|---|---|---|
| Ouverture d'un compte en fidéicommis | `lib/services/fideicommis/trust-bank-account-service.ts` → `openTrustBankAccount` | **Voir §3.** C'est la marche zéro. |
| Frais de renvoi | même dossier → `recordReferralFee` | s. 18 ON. Aucun cabinet servi n'en verse aujourd'hui. |
| Suivi des intérêts de fiducie | `lib/compliance/trust-shortfall.ts` → `assessInterestRemittance` | Dépend de E-4, la liste des institutions ayant conclu l'entente B-1 r.10. |

### 2.3 Les trois assumés absents, inchangés

Grand livre hypothécaire (art. 20 ON), fonds de clôture immobilière Form 9B/9C
(art. 13 ON), blocage sur statut de permis (art. 2, 2.2, 2.3 ON). Aucun cabinet servi
ne fait d'immobilier ontarien. Les construire serait bâtir contre une hypothèse.

---

## 3. Le défaut qui rend le §2 partiellement théorique

**`openTrustBankAccount` n'est appelé depuis aucun écran ni aucune action serveur.**

```
$ grep -rln "openTrustBankAccount" app components
(rien)

$ grep -rln "openTrustBankAccount" scripts lib
scripts/seed-trust-demo.ts
lib/services/fideicommis/index.ts
lib/services/fideicommis/trust-bank-account-service.ts
```

Le seul appelant est un script de démonstration. Aucune création automatique non plus :
`prisma.trustBankAccount.create` n'apparaît que dans le service lui-même, et
`resolveDefaultTrustBankAccountId` renvoie `null` quand il n'y a pas exactement un
compte général ouvert.

Conséquence : un cabinet qui s'inscrit aujourd'hui ne peut pas déclarer son compte en
fidéicommis. Les onze écrans d'inspection commencent alors tous par la même phrase,
que j'ai écrite moi-même :

> « Aucun compte en fidéicommis n'est enregistré. »

**Le chiffre de 19 documents producibles suppose donc un compte existant.** Pour un
cabinet neuf, sans intervention manuelle en base, il retombe autour de 6.

C'est le même motif que le reste du programme : un moteur complet derrière une porte
qui n'existe pas. La différence, c'est que celle-ci est la première du couloir.

---

## 4. Ce qui n'est toujours pas déployé

| Mesure | Valeur au 2026-08-10 |
|---|---|
| Branche de travail | `release/2026-06-11-compta-admin-derisier` |
| Avance sur `main` | **83 commits** |
| Avance sur `origin` | 5 commits, non poussés |
| Écrans d'inspection présents sur `main` | **aucun** (`git ls-tree main -- "app/(app)/inspection"` est vide) |

**En production aujourd'hui, aucun cabinet ne voit quoi que ce soit de ce programme.**
Le score du moteur et la capacité de production réelle mesurent le dépôt, pas le
service rendu.

---

## 5. Ce qui reste ouvert par nature

### 5.1 Les huit dépendances externes

E-1 à E-8, inchangées : formulaires prescrits par le Comité exécutif non obtenus,
liste des institutions B-1 r.10 non obtenue, Form 9A non validé auprès du LSO Spot
Audit. C'est pourquoi SAFE **ne transmet rien** : il consigne que l'avocate l'a fait,
avec sa date.

### 5.2 Le corpus lu est partiel

Lus intégralement : B-1 r.5 (art. 1-87, à jour 2026-04-01), By-Law 9 (s. 1-24,
2017-04-27), By-Law 7.1 partie III (s. 20-24, 2024-04-25).

**Non lus** : Code de déontologie des avocats, B-1 r.10, Rules of Professional
Conduct, Practice Management Guidelines. Les règles qui en dépendent restent marquées
INCERTAIN dans le [registre des obligations](REGISTRE_OBLIGATIONS.md). Elles ne sont
pas devinées.

---

## 6. Ce qui peut être affirmé à un prospect

Vérifiable ligne par ligne, sans engager la responsabilité professionnelle de personne :

> SAFE ne vous rend pas conforme. Il tient vos livres selon les articles du règlement,
> il vous empêche de faire les gestes qui vous mettraient en défaut, et il produit en
> un clic ce qu'un inspecteur demande. La signature reste la vôtre.

Ce qui ne doit **jamais** être dit : « SAFE est conforme », « SAFE vous rend
conforme », « certifié Barreau ». Les trois transfèrent au vendeur une obligation qui
appartient à l'avocate, et aucune n'est vraie.

---

## 7. Ordre des prochains travaux

1. **Écran d'ouverture de compte en fidéicommis** (art. 34-37 QC · s. 7-8 ON). Sans
   lui, tout le reste est inatteignable pour un cabinet neuf.
2. **Fusion vers `main` et déploiement.** 83 commits d'écart, c'est le principal
   risque opérationnel du dépôt aujourd'hui.
3. Frais de renvoi, suivi des intérêts : après E-4.

---

**Documents liés** : [audit source](AUDIT_REGLEMENTAIRE_INSPECTION_2026-07-30.md) ·
[matrice](MATRICE_ETAT_CONFORMITE.md) · [réévaluation précédente](REEVALUATION_2026-08-03.md) ·
[registre des obligations](REGISTRE_OBLIGATIONS.md)
