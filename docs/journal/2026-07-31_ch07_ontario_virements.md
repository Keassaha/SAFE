# 2026-07-31 — CH-07 livré : le volet ontarien

Huitième chantier du [Programme Inspection Ready](../compliance/PROGRAMME_INSPECTION_READY.md).
Ferme **M-06**, **M-12** et **M-14** de l'audit. L'Ontario passe de 77 à 92.

## Le point du chantier : un régime asymétrique

La s. 12 By-Law 9 impose un appareil complet autour de **tout** virement électronique
depuis un compte en fiducie :

- double contrôle à deux mots de passe, deux personnes distinctes (s. 12(2)1)
- réquisition signée **avant** toute saisie, sur formulaire prescrit (s. 12(2)4, 12(7))
- confirmation de l'institution portant six éléments précis (s. 12(2)3)
- contresignature datée le jour bancaire suivant, après impression, comparaison et
  annotation (s. 12(5))
- conservation dix ans (s. 18(11), 23(2))

**B-1 r.5 n'a aucun équivalent.** L'art. 58 permet le retrait d'honoraires « par
virement à un compte qui n'est pas un compte en fidéicommis, ouvert au nom de
l'avocat », sans réquisition, sans double contrôle, sans formulaire.

Les services de virement **refusent donc de s'exécuter** pour un cabinet québécois.
Servir le Form 9A au Québec inventerait une obligation, faute aussi grave que d'en
omettre une.

## Livré

- **`lib/compliance/electronic-transfer.ts`** — module pur : applicabilité par
  province, double contrôle et son exemption, six éléments de la confirmation, ordre
  chronologique, contresignature, cautionnement, transferts entre cartes-clients,
  statut de permis. 31 tests.
- **`ElectronicTrustTransferRequisition`** — Formulaire 9A, avec les deux étapes du
  double contrôle horodatées et les six champs de confirmation.
- **`TrustSignatory`** — pouvoir de signature et cautionnement.
- **`ClientLedgerTransfer`** — le registre de la s. 18(4).
- **`ReferralFee`** — le registre de la s. 19.1.
- **`User.licenceStatus`** — s. 2, 2.2, 2.3.
- 24 tests de service.

## Trois décisions

**L'ordre est vérifié, pas seulement l'existence.** La s. 12(2)4 dit « **BEFORE** any
data describing the details of the transfer […] is entered ». Une réquisition signée
après coup régularise, elle ne vérifie rien. Le service compare les horodatages et
refuse une saisie antérieure à la signature.

**Le cautionnement se calcule.** La s. 11(b) le fixe « at least equal to the maximum
balance on deposit during the immediately preceding fiscal year […] in **all** the
trust accounts on which signing authority has been delegated ». Ce n'est pas le solde
de clôture mais le **point haut** de l'exercice, obtenu en rejouant le registre
append-only. Et il porte sur l'ensemble des comptes délégués, pas sur le seul compte
visé. C'est ici que `Cabinet.fiscalYearEnd`, ajouté au chantier CH-00, sert enfin.

**L'exemption du praticien seul est consignée, pas silencieuse.** La s. 12(3) est
exigeante : « without another licensee as a partner […] and **without another licensee
or person as an employee** ». Un avocat avec une adjointe n'en est pas un. Quand elle
s'applique, elle est écrite sur la réquisition : à l'inspection, elle doit être
assumée, pas découverte.

## Un sur-blocage de plus, corrigé

SAFE interdisait de façon **absolue** les transferts entre cartes-clients
(`validateNoCrossAllocation`). C'est plus strict que les deux règlements : la s. 18(4)
en exige le **registre**, donc les suppose, et l'art. 56(3) permet le transfert direct
vers un autre compte en fidéicommis.

Le coût du sur-blocage était réel : le cabinet contourne par un retrait suivi d'un
dépôt, deux opérations qui cassent le lien et rendent le registre de la s. 18(4)
impossible à produire. Le contrôle porte désormais sur l'**objet**, que le texte
exige, et non sur l'interdiction.

C'est le troisième sur-blocage trouvé dans ce programme, après les espèces (CH-05) et
l'écart de rapprochement (CH-03). Le motif revient : **une règle plus stricte que le
texte détruit la donnée qu'elle prétend protéger.**

## Hors périmètre, assumé

s. 13 (fonds de clôture immobilière, Form 9B/9C), s. 20 (hypothèques détenues en
fiducie) et s. 24 (dossier prêteur). Ce sont des registres de pratique immobilière,
à ouvrir quand un cabinet de ce type sera servi. Ils restent dans la matrice.

## Vérification

`tsc --noEmit` propre. **107 fichiers de tests, 1 141 tests, tous verts.**
55 nouveaux tests sur ce chantier.

## Scores

| | Départ | CH-01 | CH-02 | CH-03 | CH-04 | CH-05 | CH-07 |
|---|---|---|---|---|---|---|---|
| Barreau du Québec | 48 | 67 | 74 | 80 | 85 | 91 | **93** |
| Law Society of Ontario | 42 | 49 | 57 | 66 | 71 | 77 | **92** |
| Global | 45 | 58 | 66 | 73 | 78 | 84 | **93** |

## Reste

**CH-08** (autres biens en fidéicommis, art. 43-46 / s. 18(9)), **CH-09** (rapport
annuel, art. 42), **CH-10** (solde débiteur, intérêts), **CH-11** (rétention, mode
inspecteur, trousse), **CH-12** (registre vivant, cycle de vie). Et les écrans.
