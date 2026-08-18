# 2026-08-18 — Lot 0 bis : les catégories qui ne portent aucune taxe

## Pourquoi ce lot passait en premier

La spec dépenses le désignait comme « le seul `A_CONFIRMER` bloquant » et « préalable
dur au lot 1 ». La raison est mécanique : le lot 1 décomposera le TTC pour en extraire
la taxe récupérable. Sans liste d'exclusion, il fabriquerait de la taxe sur un salaire
et sur une prime d'assurance. Le résultat ne serait pas un affichage faux, ce serait une
demande de remboursement surestimée, découverte à la vérification.

## Ce qui a été établi

Trois catégories sur 24 ne portent structurellement aucune taxe, plus une quatrième qui
sort du périmètre pour une raison différente.

| Catégorie | Régime | Base |
| --- | --- | --- |
| Salaires | sans taxe, dur | l'emploi n'est pas une fourniture |
| Assurances | sans taxe, dur | émission de polices exonérée |
| Frais bancaires | sans taxe, souple | services financiers exonérés, mais « la plupart » |
| Débours avancés | hors périmètre | relève du module débours |

Les 17 autres suivent le régime général. Trois restent en zone d'incertitude.

## Trois décisions de conception

**Une règle, pas un taux à zéro.** Un taux à zéro est une valeur : modifiable, donc
modifiée un jour par inadvertance, et muette sur la raison. Un régime est une règle : il
refuse l'estimation et porte son motif à l'écran. Même logique que la liste fermée de
motifs d'annulation livrée la veille.

**Deux duretés, pas une.** Les salaires et l'assurance refusent aussi la **saisie
manuelle**. Les frais bancaires ne refusent que l'**estimation**. La raison est dans le
mot « most » de l'ARC : une location de coffret bancaire est taxable, alors qu'aucune
prime d'assurance ne porte de taxe récupérable. Un régime unique aurait été faux dans un
sens ou dans l'autre.

**Les incertitudes restent taxables.** Frais de tribunal, registre foncier et huissier ne
peuvent pas être tranchés : l'ARC n'exonère que « certains » services gouvernementaux. Ils
sont laissés en taxable avec un marqueur d'incertitude. La direction de l'erreur est
assumée : un cabinet qui réclame trop peu de crédits se corrige, un cabinet qui en
réclame trop se fait reprendre.

## Le piège de l'assurance

Au Québec, les primes d'assurance portent une taxe sur les primes, distincte de la TVQ et
**non récupérable**. Si un cabinet voit « taxe » sur sa facture d'assurance et la saisit,
SAFE la compterait en récupérable et gonflerait la demande. C'est ce qui justifie le
régime dur plutôt que souple sur cette catégorie précise.

## Un piège de recherche à connaître

Une recherche sur « GST employee salary not a supply » renvoie massivement des sources
portant sur la **TPS indienne** (CGST Act, annexe III), pas canadienne. Elles sont
plausibles, bien rédigées, et sans aucune valeur ici. La règle canadienne a été prise
directement dans la Loi sur la taxe d'accise plutôt que dans une synthèse.

Les deux sources primaires de l'ARC et de Revenu Québec renvoient un 403 à un robot ; il
faut passer par le navigateur, comme pour le répertoire du Barreau de l'Ontario.

## Livré

- `docs/research/RECHERCHE_categories_sans_taxe_2026-08-18.md`, sourcé, avec marquage
  `VERIFIE` / `INFERENCE` / `A_CONFIRMER`.
- `lib/expense-journal/tax-regime.ts` : quatre régimes, chaque règle portant sa source et
  sa date de vérification.
- 12 tests, dont un qui vérifie qu'aucun régime ne vise un code de catégorie inexistant,
  et un qui interdit de parler en code à l'utilisateur.

## Reste ouvert avant le lot 1

Trancher les frais de tribunal, au moins pour le Québec, puisque c'est la juridiction de
la cliente actuelle. Source à viser : annexe V partie VI de la Loi sur la taxe d'accise,
croisée avec le tarif des frais judiciaires.
