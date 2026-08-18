# 2026-08-18 — Les paliers du plafond, et pourquoi le barème se vérifie lui-même

## Les deux points levés

Ils étaient `A_CONFIRMER` depuis la recherche du 17, et bloquaient le lot 4.

**Le plafond québécois.** Trouvé dans le guide **IN-155 §6.11.1** de Revenu Québec,
exactement la source que la recherche désignait comme idéale :

| Chiffre d'affaires annuel | Plafond |
| --- | --- |
| 32 500 $ ou moins | 2 % |
| Entre 32 500 $ et 52 000 $ | 650 $ |
| 52 000 $ ou plus | 1,25 % |

**L'Ontario.** `VERIFIE` sur la source primaire fédérale : l'article 67.1(1) de la Loi
de l'impôt sur le revenu répute la dépense égale à « 50 per cent of the lesser of » le
montant payé et un montant raisonnable. **Aucun plafond n'y figure.** Le plafond est
une mesure exclusivement québécoise, et un cabinet ontarien n'est soumis qu'à la limite
de 50 %.

## Le barème se vérifie lui-même

2 % de 32 500 = 650. 1,25 % de 52 000 = 650.

Le plafond est donc **continu** aux deux bornes. Ce n'est pas une coïncidence, c'est
une propriété voulue du barème, et c'est le meilleur garde-fou contre une erreur de
transcription : si une borne était fausse, le plafond sauterait à la jonction. Un test
vérifie la continuité de part et d'autre des deux bornes, au centime.

C'est la même idée que le balayage d'arrondi de ce matin. Quand une donnée porte une
propriété interne, la tester vaut mieux que relire trois fois.

## Le chemin, pour la prochaine fois

Le ministère des Finances donne les trois valeurs sans les bornes. Revenu Québec
renvoie à IN-155 sans les donner non plus. Le texte intégral de la Loi sur les impôts
sur Légis Québec fait expirer le chargement du navigateur.

Ce qui a marché : le PDF d'IN-155, récupéré via un miroir, puis **extrait localement
avec `pdftotext`**. `WebFetch` sur un PDF rend le binaire, pas le texte. C'est la
méthode à garder pour toute publication fiscale.

## Ce que ça change dans le produit

L'incertitude `PLAFOND_QC_NON_CALCULE` disparaît du dossier de fin d'année. Le plafond
est calculé, au cumul de l'exercice comme la loi le veut, et le dossier montre la
limite de 50 %, le plafond, et lequel des deux a mordu.

Une incertitude plus **étroite** la remplace, et seulement quand le plafond mord
réellement : la loi soustrait à la limite et au plafond les abonnements et billets de
spectacle culturels tenus au Québec, et SAFE ne sait pas les distinguer d'un repas.
Le dossier le dit au lieu de le taire.

C'est le mouvement voulu : une incertitude large et permanente remplacée par une
incertitude précise et conditionnelle.

## Reste ouvert

`A_CONFIRMER` **L'édition du guide.** Le tableau vient de l'édition 2015-10, la seule
accessible. Les trois valeurs sont confirmées toujours en vigueur par le recueil des
dépenses fiscales 2025, mais ce recueil ne redonne pas les bornes. Si elles avaient
bougé, le plafond serait mal appliqué entre 32 500 $ et 52 000 $. À revoir sur
l'édition courante.

## Vérifié

18 tests sur le plafond, dont l'exemple chiffré du guide repris tel quel et la
continuité aux deux bornes. 4 tests du dossier réécrits. 1605 tests au total, `tsc`
propre, lint propre, parité i18n.
