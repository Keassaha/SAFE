# Catégories de dépenses sans taxe récupérable — cabinet juridique QC et ON

> Date de recherche : 2026-08-18
> Statut : lot 0 bis de `docs/accounting/SPEC_DEPENSES_ET_PREPARATION_FISCALE.md`
> Préalable dur au lot 1. Sans cette liste, la décomposition du TTC fabriquerait de
> la taxe là où il n'y en a pas.

---

## Question de départ

Parmi les 24 catégories de dépenses de SAFE, lesquelles ne portent **structurellement**
aucune TPS/TVH/TVQ, et ne doivent donc jamais faire l'objet d'une décomposition
automatique du montant TTC ?

---

## Résumé exécutif

Trois catégories sur 24 ne portent structurellement aucune taxe : **salaires**,
**assurances**, et **frais bancaires** au sens des services financiers. Une quatrième,
**débours avancés**, est hors périmètre pour une raison différente et plus forte : ce
n'est pas une dépense du cabinet.

Le reste est taxable par défaut, avec quatre catégories à traitement mixte qui exigent
la valeur déclarée sur la pièce plutôt qu'une estimation.

La conséquence produit est simple : le moteur d'estimation du lot 1 doit avoir une
**liste d'exclusion dure**, et non un taux à zéro. Un taux à zéro se corrige à la main
par erreur ; une exclusion refuse la saisie et explique pourquoi.

---

## Faits vérifiés

### 1. Les salaires ne sont pas une fourniture

`VERIFIE` La Loi sur la taxe d'accise définit « entreprise » comme incluant profession,
métier et entreprise de toute nature, **« but does not include an office or
employment »** (art. 123(1)). La TPS/TVH s'appliquant aux fournitures effectuées dans le
cadre d'une activité commerciale, et l'activité commerciale se construisant sur la
notion d'entreprise, l'emploi est structurellement hors champ.

Ce n'est donc pas une exonération, c'est une absence de fourniture. La distinction
compte : une exonération pourrait changer par règlement, l'exclusion de l'emploi tient à
la définition même.

**Catégorie visée : `SALAIRES`.**

### 2. Les services financiers sont exonérés

`VERIFIE` L'ARC classe « Most services provided by financial institutions such as
lending money or operating deposit accounts » parmi les fournitures **exonérées**.
Exonéré signifie : pas de taxe facturée, et pas de crédit de taxe sur les intrants.

**Catégorie visée : `FRAIS_BANCAIRES`**, avec la réserve du mot « most » traitée plus
bas.

### 3. Les primes d'assurance sont exonérées

`VERIFIE` L'ARC classe « The issuance of insurance policies by an insurer and the
arranging for the issuance of insurance policies by insurance agents » parmi les
fournitures **exonérées**.

**Catégorie visée : `ASSURANCES`.**

### 4. Les services juridiques et comptables sont taxables

`VERIFIE` L'ARC classe explicitement « Legal services » et « Accounting services » comme
**taxables**. De même « Advertising », sauf fourniture à un non-résident non inscrit.

**Catégories confirmées taxables : `HONORAIRES_EXT`, `RECHERCHE_JURIDIQUE`,
`PUBLICITE`.**

### 5. Les fournitures gouvernementales ne sont exonérées que « certaines »

`VERIFIE` L'ARC écrit « **Certain** property and services provided by governments,
non-profit organizations, municipalities, and other public service bodies ». Le mot
« certain » interdit toute règle générale.

**Conséquence : `TRIBUNAL` et `REGISTRE_FONCIER` ne peuvent pas être classés par
déduction.** Voir zones d'incertitude.

---

## Analyse détaillée

### Pourquoi une liste d'exclusion, et non un taux à zéro

Un taux à zéro est une valeur, donc modifiable, donc modifiée un jour par inadvertance.
Une exclusion est une règle, et elle peut porter son motif à l'écran : « les primes
d'assurance ne portent pas de TPS/TVQ, il n'y a rien à récupérer ». La différence se voit
le jour d'une vérification, où le cabinet doit expliquer pourquoi une ligne est à zéro.

C'est la même logique que la liste fermée de motifs d'annulation livrée le 17 : une
valeur libre se remplit tout seul de bruit, une règle se défend.

### Le piège de « la plupart des frais bancaires »

`INFERENCE` L'exonération vise les **services financiers**, pas tout ce qu'une banque
facture. Une banque qui loue un coffret de sûreté ou vend un service administratif
effectue une fourniture taxable. La catégorie `FRAIS_BANCAIRES` de SAFE mélange donc
deux natures.

Traitement retenu : exclusion par défaut, **mais** taxe saisissable à la main si la
pièce en montre une. L'exclusion empêche l'estimation automatique, elle n'interdit pas la
réalité. C'est le seul cas où l'exclusion doit être souple.

### L'assurance porte une autre taxe, non récupérable

`A_CONFIRMER` Au Québec, les primes d'assurance sont assujetties à une **taxe sur les
primes d'assurance** distincte de la TVQ, et non récupérable en CTI/RTI. En Ontario, un
mécanisme comparable existe sur certaines primes. Cette taxe est un **coût**, pas un
crédit.

Le risque produit est précis : si un cabinet voit « taxe » sur une facture d'assurance et
la saisit, SAFE la comptera en taxe récupérable et gonflera la demande de remboursement.
L'exclusion doit donc être **dure** sur `ASSURANCES`, et le libellé à l'écran doit dire
que la taxe d'assurance n'est pas récupérable.

### Les débours avancés ne sont pas une dépense

`INFERENCE` `DEBOURS_AVANCES` désigne une somme avancée pour le compte du client et
refacturée. Sa taxe, s'il y en a une, suit le régime du débours et se règle dans le module
de facturation, pas dans le journal des dépenses. La faire estimer ici produirait une
double captation : une fois en dépense du cabinet, une fois en débours refacturé.

Traitement retenu : exclusion, avec renvoi vers le module débours. C'est cohérent avec le
refus `module_metier` déjà livré dans l'annulation.

---

## Classification proposée des 24 catégories

| Code | Régime | Base |
|---|---|---|
| `SALAIRES` | **Sans taxe, dur** | ETA 123(1), l'emploi n'est pas une entreprise |
| `ASSURANCES` | **Sans taxe, dur** | ARC, émission de polices exonérée |
| `DEBOURS_AVANCES` | **Hors périmètre** | relève du module débours |
| `FRAIS_BANCAIRES` | **Sans taxe, souple** | ARC, services financiers exonérés ; saisie manuelle permise |
| `TRIBUNAL` | `A_CONFIRMER` | « certain » services gouvernementaux |
| `REGISTRE_FONCIER` | `A_CONFIRMER` | idem |
| `HUISSIER` | `A_CONFIRMER` | officier public, statut non vérifié |
| `SALAIRES` hors, tous les autres | **Taxable** | régime général |

Les 17 catégories restantes suivent le régime général et sont estimables : loyer,
téléphone, internet, logiciels, fournitures, impression, poste, déplacements,
stationnement, formation, sous-traitance, publicité, honoraires externes, recherche
juridique, experts, traduction, autres.

---

## Points à confirmer

- `A_CONFIRMER` **Frais de tribunal et droits de greffe, QC et ON.** L'ARC n'exonère que
  « certains » services gouvernementaux. Impact si faux : taxe estimée sur des droits qui
  n'en portent pas, donc remise surestimée. Source idéale : liste des fournitures
  gouvernementales exonérées, annexe V partie VI de la LTA, croisée avec le tarif des
  frais judiciaires du MJQ et de la Cour supérieure de l'Ontario.
- `A_CONFIRMER` **Frais d'huissier.** Un huissier de justice est un officier public
  facturant des honoraires professionnels ; l'hypothèse est qu'ils sont taxables comme un
  service professionnel, mais l'article n'a pas été vérifié.
- `A_CONFIRMER` **Registre foncier.** Droits d'inscription probablement hors champ ou
  exonérés, non vérifié.
- `A_CONFIRMER` **Taux et assiette de la taxe sur les primes d'assurance**, QC et ON.
  Nécessaire seulement pour l'afficher comme coût ; sans effet sur l'exclusion elle-même.

---

## Risques

- **Le faux positif silencieux reste le risque principal**, comme dans la recherche du
  17. Une taxe estimée sur une catégorie exonérée ne déclenche aucune alerte et se
  découvre à la vérification.
- **Les quatre `A_CONFIRMER` sont tous des catégories à faible volume mais forte
  visibilité** : frais de tribunal et huissier apparaissent dans presque tous les dossiers
  de litige. Se tromper là est visible.
- **Le mot « most » de l'ARC est un piège de conception.** Traduire « most services
  provided by financial institutions » en « frais bancaires = 0 taxe » est une
  simplification qui sera fausse une fois sur dix.

---

## Recommandations

### Pour le lot 0 bis, immédiat

1. Coder trois régimes, pas deux : `TAXABLE`, `SANS_TAXE_DUR`, `SANS_TAXE_SOUPLE`, plus
   `HORS_PERIMETRE` pour les débours avancés.
2. Laisser les quatre `A_CONFIRMER` en `TAXABLE` avec un marqueur d'incertitude, et non
   en sans-taxe. Un cabinet qui déclare trop peu de CTI se corrige ; un cabinet qui en
   déclare trop se fait reprendre.
3. Chaque régime porte sa source et sa date de vérification dans le code, conformément au
   risque « les taux et seuils changent » relevé le 17.

### Avant le lot 1

4. Trancher les frais de tribunal, au moins pour le Québec, puisque c'est la juridiction
   de la cliente actuelle.

---

## Sources

- Loi sur la taxe d'accise, art. 123(1), définition de « business » :
  https://laws-lois.justice.gc.ca/eng/acts/E-15/section-123.html
- ARC, *Type of supply*, tableau des fournitures taxables, détaxées et exonérées :
  https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-type-supply.html
- Revenu Québec, *Fournitures exonérées* (consultée, accès direct refusé au robot) :
  https://www.revenuquebec.ca/fr/entreprises/taxes/tpstvh-et-tvq/regles-de-base-relatives-a-lapplication-de-la-tpstvh-et-de-la-tvq/types-de-fournitures/fournitures-exonerees/
- Recherche antérieure : `docs/research/RECHERCHE_deductibilite_et_taxes_depenses_QC_ON_2026-08-17.md`

### Note de méthode

Une recherche sur « GST employee salary not a supply » renvoie massivement des sources
portant sur la **TPS indienne** (CGST Act, annexe III). Elles sont sans valeur ici et ont
été écartées. La règle canadienne a été prise directement dans la loi.
