# Cas de test — calculateur de patrimoine familial

**Tenu depuis** : 2026-08-19
**Règle** : aucun cas n'entre ici sans sa source ET son arithmétique rejouée en code.

Chaque cas porte son statut de vérification :

- **VÉRIFIÉ** : source publiée, et le calcul a été rejoué et concorde
- **DÉRIVÉ** : construit par nous à partir d'une règle vérifiée, sans exemple publié
- **DOUTEUX** : la source se contredit ; ne pas utiliser tel quel

---

## C1 — Résidence possédée au mariage, avec hypothèque **VÉRIFIÉ**

Source : Éducaloi, exemple 2. Rejoué le 2026-08-19, concordance au dollar.

| Entrée | Valeur |
|---|---|
| Valeur brute au mariage | 100 000 $ |
| Dette au mariage | 40 000 $ |
| Valeur brute au partage | 200 000 $ |
| Dette au partage | 25 000 $ |

**Attendu** : valeur nette au mariage 60 000 $ ; proportion 0,60 ; déduction de plus-value
60 000 $ ; **valeur partageable 55 000 $** ; part de chaque époux **27 500 $**.

---

## C2 — Remploi d'un bien possédé au mariage **VÉRIFIÉ**

Source : Lavallée et Samoisette, (1997-98) 28 R.D.U.S. 259, cas Lucille et Jean-Guy,
situation 1. Rejoué le 2026-08-19, concordance sur les cinq étapes.

Maison Dufferin possédée au mariage (1978), revendue, produit réinvesti comptant dans
la maison Portland.

| Entrée | Valeur |
|---|---|
| Bien 1, valeur brute au mariage | 60 000 $ |
| Bien 1, dette au mariage | 20 000 $ |
| Bien 1, produit de vente réinvesti | 90 000 $ |
| Bien 2, prix d'achat (1992) | 160 000 $ |
| Bien 2, valeur au divorce | 180 000 $ |
| Bien 2, dette résiduelle | 60 000 $ |

**Attendu**, étape par étape :

| Étape | Calcul | Résultat |
|---|---|---|
| Valeur nette du bien 1 au mariage | 60 000 − 20 000 | 40 000 $ |
| Plus-value du bien 1 | 90 000 − 60 000 | 30 000 $ |
| Déduction de plus-value, bien 1 | 30 000 × (40 000 ÷ 60 000) | 20 000 $ |
| Déductions totales portées par le bien 1 | 40 000 + 20 000 | 60 000 $ |
| Plus-value du bien 2 | 180 000 − 160 000 | 20 000 $ |
| Déduction de plus-value, bien 2 | 20 000 × (60 000 ÷ 160 000) | 7 500 $ |
| **Valeur partageable** | 180 000 − 60 000 − 40 000 − 20 000 − 7 500 | **52 500 $** |
| Part de chaque époux | 52 500 ÷ 2 | **26 250 $** |

> **Erreur de la source secondaire, relevée et corrigée.** Le document Perplexity écrit
> « valeur partageable finale = 52 500 $ **pour chaque époux** ». C'est faux : 52 500 $
> est la valeur à partager, et chaque époux en reçoit 26 250 $. La preuve est dans le
> même document : sa deuxième hypothèse calcule `40 000 + 20 000 + 7 500 + 26 250 =
> 93 750 $`, où 26 250 $ est bien la moitié de 52 500 $.

**Règle de calcul du remploi**, tirée de ce cas : la déduction de plus-value du bien de
remploi se calcule dans la proportion `déductions totales portées par le bien d'origine
÷ prix d'achat du bien de remploi`. C'est ce que l'art. 418 al. 3 appelle « les mêmes
déductions, compte tenu des adaptations nécessaires ».

---

## C3 — Bilan complet d'un dossier **VÉRIFIÉ** (arithmétique seulement)

Même source, bilan final du cas Lucille et Jean-Guy, sans impôt latent.

Total attribué à Lucille 123 000 $, à Jean-Guy 58 500 $.
**Créance de Lucille envers Jean-Guy** : (123 000 − 58 500) ÷ 2 = **32 250 $**.

Rejoué le 2026-08-19 : concordance. La composition détaillée des deux totaux n'a pas
été revérifiée poste par poste contre la source primaire.

---

## C4 — L'impôt latent change un partage apparemment égal **VÉRIFIÉ**

Source : même chronique, §II.

| | Madame | Monsieur |
|---|---|---|
| Bien | REER 80 000 $ | Résidence 80 000 $ |
| Créance de partage, sans impôt | **0 $** | **0 $** |
| Impôt à la disposition, taux combiné 40 % | 32 000 $ | nul, exemption |
| Valeur nette après impôt | **48 000 $** | **80 000 $** |

Sert à vérifier que l'outil **signale** l'écart. Il ne sert pas à vérifier un montant :
voir §Corrections, l'impôt latent n'est pas une règle tranchée.

---

## C5 — Chalet avec gain en capital **DOUTEUX**

Même source. La source se contredit : elle écrit « gain imposable de 45 000 $ » puis
« impôt de 12 000 $ sur un gain en capital imposable de 30 000 $ ».

Recalcul : gain en capital 60 000 $, taux d'inclusion de 50 %, gain imposable 30 000 $,
impôt à 40 % = 12 000 $. Les 45 000 $ sont donc l'erreur, et 30 000 $ la valeur juste.

**Ne pas utiliser comme cas de test** tant que le chiffre n'a pas été confirmé sur la
source primaire. La façon dont les 12 000 $ se répartissent entre les deux époux
(80 000 $ chacun devenant 68 000 $ chacun) n'est pas non plus établie.

---

## C6 — Un troisième exemple publié, et ce qu'il révèle **ARRONDI**

Source : SBL Avocats, « Le patrimoine familial a trente ans », Claude Voyer, avocat.
Consulté le 2026-08-20.

| Entrée | Valeur |
|---|---|
| Valeur brute au mariage | 150 000 $ |
| Dette au mariage | 50 000 $ |
| Valeur brute au partage | 200 000 $ |
| Dette au partage | 25 000 $ |

| | La source publie | Le calcul exact |
|---|---|---|
| Proportion | **66 %** | 0,666666… |
| Déduction de plus-value | 33 000 $ | **33 333,33 $** |
| Déduction totale | 133 000 $ | **133 333,33 $** |
| Valeur partageable | 42 000 $ | **41 666,67 $** |
| Part de chaque époux | 21 000 $ | **20 833,33 $** |

**Ce n'est pas une erreur de la source, c'est un arrondi pédagogique.** Mais il coûte
**333,33 $** sur un partage de 42 000 $, et l'écart grandit avec la valeur du bien.

**Conséquence pour le calculateur, et elle est déjà appliquée** : la proportion ne
s'arrondit jamais. Seul le résultat final est arrondi au cent. Arrondir la proportion
avant de multiplier ferait dériver chaque dossier.

**Ne pas utiliser comme vecteur exact.** Utile comme contrôle de vraisemblance à 1 %
près, et surtout comme illustration de ce qu'un tableur fait quand il tape « 66 % ».

---

## Cas encore à trouver

| Situation | État |
|---|---|
| Apport provenant d'un héritage pendant le mariage | source citée, chiffres non extraits |
| Bien en moins-value | source citée, chiffres non extraits |
| Valeur nette négative au mariage | **introuvable.** Recherche refaite le 2026-08-20 : CanLII rend une page vide aux outils automatisés, SOQUIJ protège sa recherche par un contrôle anti-robot, et la doctrine consultée traite des cas voisins sans celui-ci. Non contournés. |
| Dissolution par décès | aucun exemple chiffré publié trouvé |
| Partage inégal, art. 422 | aucune grille chiffrée publiée |
| Patrimoine d'union parentale | aucun exemple chiffré publié trouvé |
