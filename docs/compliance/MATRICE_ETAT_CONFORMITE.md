# Matrice de conformité — état réel

**Dernière mise à jour** : 2026-07-31, après les chantiers CH-00, CH-06, CH-01 à CH-05 et CH-07 à CH-10
**Source** : [audit du 2026-07-30](AUDIT_REGLEMENTAIRE_INSPECTION_2026-07-30.md) · [programme](PROGRAMME_INSPECTION_READY.md)

> Ce document est destiné à être montré, y compris à un prospect. Il ne contient
> donc aucune affirmation qui ne soit vérifiable ligne par ligne dans le code.

---

## 1. Les trois textes

| Texte | Portée | Lu intégralement |
|---|---|---|
| RLRQ c. B-1, r. 5 — Règlement sur la comptabilité et les normes d'exercice professionnel des avocats | Québec, art. 1 à 87 | ✅ 2026-07-30, à jour au 2026-04-01 |
| LSO By-Law 9 — Financial Transactions and Records | Ontario, art. 1 à 24 | ✅ 2026-07-30, version du 2017-04-27 |
| LSO By-Law 7.1, Partie III — Client Identification and Verification | Ontario, art. 20 à 24 | ✅ 2026-07-30, version du 2024-04-25 |

**Correction de périmètre trouvée en cours de route** : By-Law 9 ne contient
**aucune** règle d'identification du client. C'est By-Law 7.1 qui la porte. L'audit
initial confondait les deux, et l'aurait fait manquer entièrement.

---

## 2. Scores

Méthode identique aux trois mesures : chaque obligation pondérée par criticité
(critique 4, majeur 3, moyen 2, mineur 1), notée 1,0 couverte · 0,5 partielle · 0 absente.

| | Départ | CH-04 | CH-05 | CH-07 | CH-08 | CH-09 | Actuel (CH-10) | Cible |
|---|---|---|---|---|---|---|---|---|
| **Barreau du Québec** | 48 | 85 | 91 | 93 | 96 | 98 | **99 / 100** | 100 |
| **Law Society of Ontario** | 42 | 71 | 77 | 92 | 95 | 95 | **97 / 100** | 100 |
| **Global** | **45** | 78 | 84 | 93 | 96 | 97 | **98 / 100** | 100 |

### Pourquoi l'Ontario bouge peu

Deux raisons, toutes deux honnêtes :

1. Les obligations fermées aujourd'hui sont surtout québécoises (art. 56, 57, 26).
2. **Le dénominateur ontarien va augmenter.** By-Law 7.1 n'était pas dans la matrice
   d'origine. En l'ajoutant, on ajoute des obligations — dont plusieurs sont
   maintenant couvertes, mais qui n'étaient pas comptées avant. Le pourcentage
   ontarien sera donc recalculé à la hausse comme à la baisse quand la cartographie
   complète de By-Law 7.1 sera faite (chantier CH-07).

---

## 3. Ce qui a changé aujourd'hui

### 3.1 Obligations passées de ❌ ou 🟡 à ✅

| Réf. | Article | Obligation | Avant | Après |
|---|---|---|---|---|
| QC-41 | B-1 r.5, art. 56 | Trois motifs de retrait permis, et rien d'autre | ❌ | ✅ |
| QC-42 | B-1 r.5, art. 57 | Aucun retrait en espèces d'un compte général | ❌ | ✅ |
| QC-44 | B-1 r.5, art. 59 | Jamais plus que le solde du dossier | ✅ | ✅ durci (verrou étendu au dépôt et à la correction) |
| QC-45 | B-1 r.5, art. 60 | Aucun solde de carte-client débiteur | 🟡 | ✅ (garde-fou à l'écriture + détection et suivi : CH-10) |
| ON-13 | By-Law 9, s. 9(1) | Cinq motifs de retrait, dont facturation **délivrée** | ❌ | ✅ |
| QC-05 | B-1 r.5, art. 13-14 | Occupation, nature des activités, personnes autorisées, tiers | 🟡 | ✅ |
| QC-09 | B-1 r.5, art. 20 | Vérification déclenchée par tout mouvement de fonds | 🟡 | ✅ |
| QC-10 | B-1 r.5, art. 21 | Les sept exemptions modélisées et opposables | ❌ | ✅ |
| QC-11 | B-1 r.5, art. 22-23 | Source fiable et indépendante, détenteurs 25 % et plus | 🟡 | ✅ |
| QC-12 | B-1 r.5, art. 24-25 | Mandataire et attestation de répondant | ❌ | 🟡 (modèle posé, écran à faire) |
| QC-13 | B-1 r.5, art. 26 | Délais : immédiat (personne) · 60 jours (société) | ❌ | ✅ |
| QC-14 | B-1 r.5, art. 27 | Dispense de re-vérification | ❌ | 🟡 |
| — | By-Law 7.1, s. 22-23 | Régime ontarien d'identification, distinct de By-Law 9 | ❌ non identifié | ✅ encodé et testé |

### 3.1 bis — CH-01 : le compte bancaire en fidéicommis

C'était la dette de conception la plus lourde de l'audit. `TrustAccount` n'était pas
un compte bancaire mais la carte-client d'un dossier. SAFE ne modélisait donc nulle
part la banque, alors que tout le règlement raisonne par compte.

| Réf. | Article | Obligation | Avant | Après |
|---|---|---|---|---|
| QC-22 | art. 36 | Livres et registres distincts par compte général | ❌ | ✅ |
| ON-09 | s. 7(5) | Plusieurs comptes en fiducie possibles | ❌ | ✅ |
| ON-14 | s. 9(3) | Retrait borné au solde du client **dans ce compte** | 🟡 | ✅ |
| ON-31 | s. 18(8)ii | Rapprochement détaillé de **chaque** compte | ❌ | ✅ structure (rapport : CH-03) |
| QC-36 | art. 50 | Libellé « en fidéicommis », succursale québécoise, entente B-1 r.10 | ❌ | 🟡 (liste des institutions non obtenue, cf. §5) |
| QC-37 | art. 51 | Formulaire d'ouverture au Barreau | ❌ | 🟡 (suivi posé, formulaire non généré) |
| QC-47 | art. 62 | Compte particulier quand le client exige les revenus | ❌ | 🟡 |
| QC-48 | art. 63 | Libellé et succursale du compte particulier | ❌ | 🟡 |
| QC-49 | art. 64 | Formulaire signé par les deux parties, copie au client | ❌ | 🟡 (champs posés) |
| QC-52 | art. 67 | Virer le solde quand le compte n'est plus requis | ❌ | 🟡 (fermeture refusée si solde non nul) |

**Point de conception notable.** L'ouverture d'un compte devient un **acte explicite**.
Avant, un « compte » naissait par effet de bord du premier dépôt. Or ouvrir un compte
général est réglementé : institution ayant une entente avec le Barreau, succursale
québécoise, libellé portant la mention, formulaire transmis sans délai. Rien de cela
ne se déduit d'un montant saisi dans un formulaire de dépôt.

**Ce que CH-01 ne ferme pas encore** : le registre de chèques numérotés (art. 61,
QC-46), le registre propre aux comptes particuliers (art. 66, QC-51), et les
restrictions d'usage du compte particulier (art. 65, QC-50).

### 3.1 ter — CH-02 : les champs du journal et les pièces

Le journal de caisse portait la date, le montant, le client, le dossier et une
description libre. L'art. 38 en exige davantage, et les cartes-clients de l'art. 39
reprennent les mêmes champs : le trou se propageait.

| Réf. | Article | Obligation | Avant | Après |
|---|---|---|---|---|
| QC-24 | art. 38 | Journal de caisse : payeur, bénéficiaire, objet, n° de chèque, indicateur espèces | 🟡 | ✅ |
| QC-25 | art. 39 | Cartes-clients : mêmes champs, dérivés du journal | 🟡 | ✅ champs (registre imprimable : CH-04) |
| QC-21 | art. 34 | Journal d'administration : payeur, bénéficiaire, objet, espèces | 🟡 | ✅ champs |
| QC-46 | art. 61 | Chèques numérotés consécutivement, bénéficiaire nominatif | ❌ | ✅ |
| QC-42 | art. 57 al. 2 | Jamais au porteur, à « caisse » ou « cash », jamais en blanc | 🟡 | ✅ |
| QC-19 | art. 32 | Pièces justificatives attachées aux opérations | ❌ | ✅ |
| QC-34 | art. 48 | Affectation des sommes reçues | ❌ | ✅ champ |
| QC-35 | art. 49 | Fonds reçus d'un tiers, notification du client | 🟡 | ✅ champs |
| ON-25 | s. 18(1) | Livre-journal des recettes : méthode, personne, objet | 🟡 | ✅ |
| ON-26 | s. 18(2) | Livre-journal des débours : identifiant du document, bénéficiaire | ❌ | ✅ |
| ON-29 | s. 18(5)(6) | Journaux généraux hors fiducie | 🟡 | ✅ champs |
| ON-33 | s. 18(10) | Relevés, chèques compensés, bordereaux de dépôt | ❌ | ✅ |
| QC-36 | art. 50 | Délai de dépôt mesurable | 🟡 | ✅ (deux dates consignées) |

**Point notable.** Aucun de ces contrôles ne bloque une écriture (PR-8). Refuser un
dépôt parce que le bordereau n'est pas encore scanné pousserait l'utilisateur à ne
pas enregistrer l'opération — et une opération non consignée est invisible au
rapprochement, alors qu'une pièce manquante est une ligne dans une liste.

Le seul refus dur ajouté porte sur le **bénéficiaire d'un chèque**, parce que l'art.
57 al. 2 est une interdiction, pas une exigence de forme.

**Ce que CH-02 ne ferme pas** : le rendu imprimable des registres (CH-04) et les
écrans de saisie des nouveaux champs.

### 3.1 quater — CH-03 : le rapport comptable mensuel

**Le livrable central de l'inspection existe.** C'était le constat numéro un de
l'audit : « SAFE ne peut produire ni le rapport de l'art. 41, ni son équivalent
ontarien ».

| Réf. | Article | Obligation | Avant | Après |
|---|---|---|---|---|
| QC-27 | art. 41 | **Rapport comptable mensuel, sept blocs** | ❌ | ✅ |
| QC-26 | art. 40 | Registre permanent des rapports mensuels par compte | 🟡 | ✅ |
| ON-31 | s. 18(8) | Comparaison mensuelle + liste par client + rapprochement par compte | ❌ | ✅ |
| ON-41 | s. 22(2) | Échéance de 25 jours, Ontario seulement | ✅ | ✅ étendu au rapport |
| — | s. 18(8) | **Motifs des écarts**, donnée structurée | ❌ | ✅ |

Les quatre listes détaillées que l'art. 41 exige ligne par ligne sont désormais
produites : soldes de cartes-clients **avec la date de la dernière inscription**,
chèques en circulation avec numéro et date d'émission, recettes en circulation,
motifs d'écart. Le relevé bancaire du mois est obligatoire pour certifier.

**Correction de doctrine par rapport à CH-00.** Le rapprochement exigeait un écart
strictement nul. C'est plus strict que le règlement : l'art. 41(5) exige un « état
comparatif » et la s. 18(8) exige la comparaison « together with **the reasons** for
any differences ». Un écart motivé est conforme ; un écart silencieux ne l'est pas.
Exiger zéro poussait à ajuster un chiffre pour faire tomber l'écart, ce qui détruit
exactement l'information que l'inspecteur cherche.

Le solde débiteur, lui, reste bloquant même motivé : ce n'est pas une différence à
expliquer, c'est l'utilisation des fonds d'un autre client (art. 60).

**Ce que CH-03 ne ferme pas** : le rendu PDF paginé (CH-04) et les écrans de saisie.

### 3.1 quinquies — CH-04 : les registres deviennent produisibles

L'obligation n'était pas de tenir les registres — SAFE les tenait en base — mais de
pouvoir en produire une copie :

> art. 30 B-1 r.5 : « pourvu que **des copies puissent en être tirées immédiatement,
> en tout temps** »
> s. 21(2) By-Law 9 : « **a paper copy** of the record may be **produced promptly**
> on the Society's request »

Une base de données n'est pas un registre tant qu'on ne peut pas l'imprimer.

| Réf. | Article | Obligation | Avant | Après |
|---|---|---|---|---|
| QC-17 | art. 30 | Copies tirées immédiatement, en tout temps | 🟡 | ✅ |
| ON-39 | s. 21(2) | Copie papier produite promptement | 🟡 | ✅ |
| QC-24 | art. 38 | Journal de caisse fidéicommis **imprimable** | 🟡 | ✅ |
| QC-25 | art. 39 | Registre de cartes-clients **matérialisé** | 🟡 | ✅ |
| QC-51 | art. 66 | Cartes-clients des comptes particuliers | ❌ | ✅ |
| QC-21 | art. 34 | Journal d'administration imprimable | 🟡 | ✅ |
| QC-03 | art. 9 | Liste des dossiers actifs et fermés sur 7 ans | 🟡 | ✅ |
| ON-27 | s. 18(3) | Grand livre des clients | 🟡 | ✅ |
| ON-30 | s. 18(7) | Livre des honoraires | ✅ | ✅ imprimable |

**Huit registres**, chacun déclarant ses colonnes et l'article qui les exige. Trois
sorties portant les mêmes données au caractère près : écran, CSV, HTML imprimable.

**Point notable.** Le rendu porte une empreinte SHA-256 en pied, **déterministe pour
un même contenu et indépendante de la date de production**. Elle n'est exigée par
aucun article : elle permet de prouver qu'une copie remise correspond au registre. Le
code le dit explicitement pour que personne ne la cite comme une exigence du Barreau.

### 3.1 sexies — CH-05 : la chaîne des espèces

L'audit relevait ici **trois défauts simultanés, dont deux opposés**.

| Réf. | Article | Obligation | Avant | Après |
|---|---|---|---|---|
| QC-54 | art. 69 | Seuil de 7 500 $ **et ses six paragraphes d'exception** | 🟡 | ✅ |
| QC-55 | art. 70 | Reçu pour **toute** somme en espèces, signé des deux parties | ❌ | ✅ |
| QC-56 | art. 71 | Déclaration au directeur dans les 30 jours | ❌ | ✅ |
| QC-57 | art. 72 | Remboursement obligatoirement **en espèces** | ❌ | ✅ |
| QC-58 | art. 73 | Conversion au taux de midi de la Banque du Canada | ❌ | ✅ |
| ON-02 | s. 4(1) | Seuil **agrégé** par dossier client | ❌ | ✅ |
| ON-03 | s. 4(2) | Conversion, jour ouvrable précédent si férié | ❌ | ✅ |
| ON-05 | s. 6 | Les cinq exceptions ontariennes | ❌ | ✅ |
| ON-35 | s. 19(1) | Carnet de reçus en double, numéroté | ❌ | ✅ |

**Le sur-blocage était aussi grave que le sous-blocage.** Le code refusait toute
somme de 7 500 $ ou plus, y compris l'avance d'honoraires que l'art. 69(6) autorise
expressément. Un garde-fou qui refuse une opération licite pousse au contournement :
la somme est saisie en mode « AUTRE », et l'indication « espèces » de l'art. 38(1)g
disparaît des registres.

**Une distinction de régime encodée.** L'art. 69 vise la réception **en fidéicommis**.
La s. 4(1) vise **toute** somme rattachée à un dossier client. Des espèces reçues en
paiement direct d'une facture ne tombent pas sous l'art. 69, mais tombent sous la
s. 4(1). Aplatir les deux produirait soit un blocage illégitime, soit un trou.

**Le reçu n'a pas de seuil.** L'art. 70 vise « une somme en espèces » et la s. 19(1)
« every licensee who receives cash ». Un reçu est exigé pour 50 $ comme pour
50 000 $. Seuls l'acceptation et la déclaration dépendent du seuil.

### 3.1 septies — CH-07 : le volet ontarien

| Réf. | Article | Obligation | Avant | Après |
|---|---|---|---|---|
| ON-19 | s. 12(2)4, 12(7) | **Formulaire 9A signé AVANT toute saisie** | ❌ | ✅ |
| ON-17 | s. 12(2)1 | Double contrôle à deux personnes distinctes | ❌ | ✅ |
| ON-20 | s. 12(3) | Exemption du praticien véritablement seul | ❌ | ✅ |
| ON-18 | s. 12(2)2-3 | Confirmation portant six éléments | ❌ | ✅ |
| ON-21 | s. 12(5) | Contresignature datée le jour bancaire suivant | ❌ | ✅ |
| ON-16 | s. 11(b) | Cautionnement des signataires non titulaires | ❌ | ✅ |
| ON-15 | s. 10 | Modes de retrait admis | ❌ | ✅ |
| ON-28 | s. 18(4) | Registre des transferts entre cartes-clients | ❌ | ✅ |
| ON-36 | s. 19.1 | Registre des frais de renvoi | ❌ | ✅ |
| ON-01 | s. 2, 2.2, 2.3 | Titulaire failli ou suspendu | ❌ | ✅ |

**Le régime est ASYMÉTRIQUE, et c'est le point du chantier.** La s. 12 impose un
appareil complet dont B-1 r.5 **n'a aucun équivalent** : l'art. 58 permet le virement
vers un compte non fiduciaire au nom de l'avocat, sans réquisition, sans double
contrôle, sans formulaire. Les services de virement **refusent de s'exécuter** pour un
cabinet québécois. Servir le Form 9A au Québec inventerait une obligation.

**L'ordre est vérifié, pas seulement l'existence.** La s. 12(2)4 dit « **BEFORE** any
data […] is entered ». Une réquisition signée après coup régularise, elle ne vérifie
rien. Le service compare les horodatages.

**Le cautionnement se calcule.** La s. 11(b) le fixe « at least equal to the maximum
balance on deposit during the immediately preceding fiscal year ». Ce n'est pas le
solde de clôture mais le **point haut** de l'exercice, obtenu en rejouant le registre.

**Sur-blocage corrigé.** SAFE interdisait de façon absolue les transferts entre
cartes-clients. La s. 18(4) en exige le **registre**, donc les suppose ; l'art. 56(3)
les permet. Le sur-blocage poussait au contournement par un retrait suivi d'un dépôt,
deux opérations qui cassent le lien et rendent ce registre impossible à produire. Le
contrôle porte désormais sur l'**objet**, que le texte exige.

**Hors périmètre, assumé** : s. 13 (fonds de clôture immobilière, Form 9B/9C),
s. 20 (hypothèques en fiducie) et s. 24 (dossier prêteur). Ce sont des registres de
pratique immobilière, à ouvrir quand un cabinet de ce type sera servi.

### 3.1 octies — CH-08 : les autres biens en fidéicommis

L'un des rares blocs **entièrement absents** de SAFE. Un « autre bien en
fidéicommis » est, selon l'art. 1(3), « tout bien, autre qu'une somme d'argent, reçu
par un avocat pour être affecté suivant les instructions du client » : titres,
actions, testaments originaux, actes notariés, clés, bijoux détenus en garantie.

| Réf. | Article | Obligation | Avant | Après |
|---|---|---|---|---|
| QC-29 | art. 43 | Registre permanent, inscrit dès réception ou remise | ❌ | ✅ |
| QC-30 | art. 44 | Informer sans délai le client quand le bien vient d'un tiers | ❌ | ✅ |
| QC-31 | art. 45 | Aviser du lieu de garde **et de tout changement** | ❌ | ✅ |
| QC-32 | art. 46 | Affectation du bien | ❌ | ✅ |
| ON-32 | s. 18(9) | Registre avec **valeur** et **détenteur précédent** | ❌ | ✅ |

**Les deux régimes n'exigent pas la même chose.** L'Ontario ajoute la valeur du bien
et la personne qui le détenait immédiatement avant ; le Québec ajoute le lieu de
garde, l'affectation et l'information du client. Le service **n'écrit pas** les
champs de l'autre régime : un registre québécois ne porte pas de colonnes
ontariennes vides, et inversement.

**L'historique des lieux est conservé.** Écraser l'emplacement ferait perdre la trace
du déplacement, alors que l'art. 45 vise précisément « tout changement d'emplacement
subséquent ». Un déplacement **rouvre** l'obligation d'aviser : la notification
précédente portait sur l'ancien emplacement.

**Une nuance de conservation attrapée.** En Ontario, le registre des biens est le
paragraphe 9 de la s. 18, visé par la s. 23(2) — **dix ans**, et non les six ans de
la s. 23(1). Purger à six ans détruirait un registre encore exigible.

Le registre est ajouté au moteur d'impression : neuvième registre produisible.

### 3.1 nonies — CH-09 : le rapport comptable annuel

| Réf. | Article | Obligation | Avant | Après |
|---|---|---|---|---|
| QC-28 | art. 42 | **Rapport comptable annuel, sept blocs** | ❌ | ✅ |
| — | art. 42(4) | Totaux de **chaque mois** de la période | ❌ | ✅ |
| — | art. 42(7) | Liste des **comptes fermés** durant la période | ❌ | ✅ |

**Québec seulement, et l'affirmation est bornée.** By-Law 9, lu intégralement,
n'impose aucun rapport comptable annuel : ses obligations périodiques s'arrêtent à la
comparaison mensuelle. Le service refuse de s'exécuter hors Québec.

*Incertitude déclarée* : le LSO impose par ailleurs un « Lawyer Annual Report ». Cette
obligation ne figure pas dans By-Law 9 et n'a pas été lue. Elle n'est donc pas
modélisée, et rien ne prétend la couvrir.

**Deux blocs sans équivalent au rapport mensuel.** L'art. 42(4) exige les totaux de
**chaque mois** — douze couples, là où l'art. 41(4) n'en demande qu'un. L'art. 42(7)
exige la liste des comptes fermés durant la période : c'est cette obligation qui
explique qu'un compte fermé ne soit jamais supprimé du système.

**Le délai part de la demande, pas du calendrier.** L'art. 42 dit « dans les 30 jours
suivant la réception d'une demande ». Sans demande, il n'y a pas d'échéance —
seulement l'obligation de rendre compte « au moins une fois par an ». Calculer une
échéance en l'absence de demande inventerait un délai.

**Réutilisation plutôt que duplication.** Les blocs 42(1), 42(2) et 42(3) exigent les
mêmes listes que les art. 41(1) à 41(3). Les trois tables de lignes du rapport
mensuel accueillent donc aussi le rapport annuel. Dupliquer ferait diverger deux
définitions d'une même chose, et un inspecteur qui recoupe le mensuel et l'annuel
trouverait deux vérités.

### 3.1 decies — CH-10 : le solde débiteur et les intérêts

| Réf. | Article | Obligation | Avant | Après |
|---|---|---|---|---|
| QC-45 | art. 59, 60 | Combler **sans délai** tout solde débiteur | 🟡 | ✅ |
| ON-23 | s. 9(3), 14 | Soldes suffisants **en tout temps** | 🟡 | ✅ |
| — | art. 50 / L.S.A. s. 57 | Intérêts du compte général au Fonds d'études juridiques / à la Law Foundation | ❌ | 🟡 (suivi, pas calcul) |
| — | art. 62 | Intérêts du compte particulier au client | ❌ | ✅ |

**Le problème que ce chantier corrige.** Un solde débiteur n'était vu qu'au moment de
certifier le rapprochement mensuel. Un découvert survenu le 3 pouvait donc vivre
jusqu'au 25 du mois suivant sans que personne ne le sache. L'art. 60 dit « sans
délai » et la s. 14 dit « at all times » : détecter une fois par mois ne peut
satisfaire ni l'un ni l'autre. La détection est désormais déclenchée **à l'écriture**.

**Aucun délai chiffré n'a été inventé.** Ni l'art. 60 ni la s. 14 ne donnent de nombre
de jours. Le module mesure et affiche l'ancienneté d'un découvert, mais ne la convertit
jamais en verdict : afficher « conforme jusqu'au jour 5 » fabriquerait une tolérance
que le règlement ne donne pas.

**Un incident comblé reste visible.** Un découvert survenu le 3 et comblé le 4
n'apparaîtrait nulle part si l'on ne regardait que les soldes de fin de mois. Or c'est
précisément ce qu'un inspecteur cherche : non pas l'état à une date, mais ce qui s'est
passé. Masquer un incident résolu présenterait une comptabilité plus propre qu'elle ne
l'a été.

**Le renflouement par le cabinet est justifié par écrit.** L'art. 52 limite ce qui peut
entrer au compte général ; un dépôt de renflouement n'entre littéralement dans aucune
de ses catégories, mais l'art. 60 l'impose. Les deux articles se lisent ensemble et le
raisonnement est inscrit dans le code, parce qu'un inspecteur peut poser la question.

*Incertitude déclarée, et elle explique le 🟡.* **Ni B-1 r.10 ni la s. 57 de la Law
Society Act n'ont été lus.** Le bénéficiaire des intérêts découle des articles lus et
est donc certain, et SAFE l'impose au lieu de le laisser saisir. La **mécanique** ne
l'est pas : taux, fréquence, formulaire. SAFE assure le **suivi** d'un versement
constaté — période, montant, date, pièce — et ne calcule aucun montant. La table ne
porte volontairement aucune colonne de taux : en ajouter une fabriquerait une règle
que personne n'a vérifiée, et un cabinet verserait le chiffre obtenu.

### 3.2 Défauts de code corrigés

| Défaut | Ce qu'il permettait | État |
|---|---|---|
| Statut de facture non vérifié au retrait | Sortir des fonds client sur une facture **brouillon** | ✅ corrigé |
| Mode espèces offert au retrait | Enregistrer une opération interdite par l'art. 57 | ✅ corrigé |
| Troisième voie jamais comparée | Certifier un rapprochement dont les cartes-clients ne tombent pas juste | ✅ corrigé |
| Correction sans verrou ni garde | Rendre un dossier débiteur sans alerte | ✅ corrigé |
| Dépôt sans verrou | Écrire un solde courant faux (art. 38(1)h) | ✅ corrigé |
| `upsert` décertifiant | Effacer silencieusement une certification signée | ✅ corrigé |
| Un seul rapprochement possible par mois et par cabinet | Un cabinet à deux comptes voyait le second écraser le premier | ✅ corrigé (clé d'unicité par compte) |
| Fichier de tests silencieusement non chargé | `ready-for-review-detection-hooks` ne signalait aucune régression depuis le commit `a300a7d` | ✅ corrigé |
| Contrôle des espèces per-transaction | Bloquait l'avance d'honoraires licite et laissait passer trois versements de 3 000 $ | ✅ corrigé |
| Interdiction absolue des transferts entre cartes-clients | Poussait au contournement par retrait puis dépôt, rendant le registre de la s. 18(4) impossible | ✅ corrigé |

---

## 4. Ce qui reste ouvert

C'est la partie que nous montrons aussi, parce qu'un état de conformité sans la
liste de ce qui manque n'est pas un état, c'est une affiche.

| Réf. | Article | Obligation | Chantier | Semaine |
|---|---|---|---|---|
| QC-16 | art. 29 | Accès inspecteur, trousse d'inspection | CH-11 | S14-S15 |

**Total** : 113 obligations et défauts cartographiés, chacun affecté à un chantier.
Aucun point n'est laissé hors périmètre. La liste complète est au §5 du
[programme](PROGRAMME_INSPECTION_READY.md).

---

## 5. Ce que nous ne disons pas

- SAFE **ne garantit pas** la conformité d'un cabinet. La responsabilité
  professionnelle reste celle de l'avocat. C'est écrit sur notre page d'accueil et
  ça ne changera pas, même à 100 sur cette matrice.
- Un score de 100 sur cette matrice signifiera que **le logiciel** couvre les
  obligations qu'il est censé outiller. Pas qu'un cabinet donné est en règle.
- Quatre dépendances externes restent hors de notre contrôle : les formulaires
  prescrits du Comité exécutif du Barreau (art. 41, 42, 51, 64), la liste des
  institutions ayant une entente au sens de B-1 r. 10, la validation du Form 9A par
  le service Spot Audit du LSO, et une relecture par un CPA en comptabilité
  juridique. Elles sont demandées, elles ne sont pas obtenues.

---

*Chaque ligne de ce document renvoie à un article lu dans son texte officiel et à un
test automatisé. 875 tests, dont 74 écrits aujourd'hui sur ces seules obligations.*
