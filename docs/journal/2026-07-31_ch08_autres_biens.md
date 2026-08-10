# 2026-07-31 — CH-08 livré : les autres biens en fidéicommis

Neuvième chantier du [Programme Inspection Ready](../compliance/PROGRAMME_INSPECTION_READY.md).
Ferme **M-09** de l'audit. C'était l'un des rares blocs **entièrement absents**.

## Ce que couvre l'obligation

Art. 1(3) B-1 r.5 : un « autre bien en fidéicommis » est « tout bien, autre qu'une
somme d'argent, reçu par un avocat pour être affecté suivant les instructions du
client ou d'une autre personne ».

Concrètement : titres, actions, testaments originaux, actes notariés, clés, bijoux
détenus en garantie, chèques certifiés non déposés.

SAFE n'en tenait aucun registre.

## Les deux régimes n'exigent pas la même chose

| | Québec (art. 43-46) | Ontario (s. 18(9)) |
|---|---|---|
| Description, n° d'identification | ✅ | ✅ |
| Date de prise de possession, client | ✅ | ✅ |
| Date de remise, destinataire | ✅ | ✅ |
| **Valeur du bien** | — | ✅ |
| **Détenteur précédent** | — | ✅ |
| **Lieu de garde** | ✅ art. 45 | — |
| **Affectation** | ✅ art. 46 | — |
| **Informer le client (bien de tiers)** | ✅ art. 44 | — |

Le service **n'écrit pas** les champs de l'autre régime. Un registre québécois ne
porte pas de colonnes ontariennes vides, et inversement.

## Trois décisions

**L'historique des lieux est conservé.** Écraser l'emplacement ferait perdre la trace
du déplacement, alors que l'art. 45 vise précisément « tout changement d'emplacement
subséquent ». Un déplacement **rouvre** l'obligation d'aviser le client : la
notification précédente portait sur l'ancien emplacement.

**Une remise ne se reprend pas.** Le registre est permanent (art. 43). Un bien déjà
remis ne peut pas l'être une seconde fois ; une erreur se corrige par une inscription
nouvelle, pas par une réécriture.

**Le numéro d'identification reste facultatif.** Le texte dit « s'il y a lieu ».
L'exiger toujours bloquerait l'inscription d'un bien qui n'en porte pas — un trousseau
de clés, un document non numéroté.

## Une nuance de conservation attrapée

En Ontario, le registre des biens est le **paragraphe 9** de la s. 18. Il est donc
visé par la s. 23(2), qui impose **dix ans**, et non par les six ans de la s. 23(1).

Purger à six ans détruirait un registre encore exigible. Les deux points de départ
diffèrent aussi : fermeture du dossier au Québec (art. 31), fin d'exercice en Ontario.

## Aussi

Le registre est ajouté au moteur d'impression de CH-04 : **neuvième registre
produisible**, avec ses colonnes propres à chaque province.

Une alerte signale les biens encore détenus à la fermeture d'un dossier. Elle
**signale sans bloquer** : aucun article n'interdit la fermeture, et présenter
l'alerte comme un blocage réglementaire inventerait une règle.

## Vérification

`tsc --noEmit` propre. **109 fichiers de tests, 1 188 tests, tous verts.**
47 nouveaux tests sur ce chantier.

## Scores

| | Départ | CH-04 | CH-05 | CH-07 | CH-08 |
|---|---|---|---|---|---|
| Barreau du Québec | 48 | 85 | 91 | 93 | **96** |
| Law Society of Ontario | 42 | 71 | 77 | 92 | **95** |
| Global | 45 | 78 | 84 | 93 | **96** |

## Reste

**CH-09** (rapport annuel, art. 42), **CH-10** (solde débiteur, intérêts),
**CH-11** (rétention, mode inspecteur, trousse), **CH-12** (registre vivant, cycle
de vie). Et les écrans.
