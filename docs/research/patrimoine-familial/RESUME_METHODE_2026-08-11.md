# Résumé — Méthode de recherche « Patrimoine familial (Québec) »

Date : 2026-08-11 · Version 0.2 · Document complet : [00_METHODE_2026-08-11.md](00_METHODE_2026-08-11.md)

> Ceci résume la **méthode**, pas la recherche. La recherche n'a pas commencé.
> Aucune source n'a été ouverte. Aucune règle de droit n'est affirmée ici.

---

## En une phrase

Construire une base de règles **traçable et signable par un avocat québécois** pour un futur
calculateur de partage, en couvrant trois régimes patrimoniaux, sans jamais inventer une règle.

---

## Le mandat, tel que compris

Le livrable n'est pas un texte explicatif. C'est un artefact opposable : chaque règle doit
pouvoir être lue par un professionnel, remontée à sa source en un clic, puis signée ou rejetée
sans qu'il ait à me reposer une question.

Trois conséquences de conception :

- toute règle est une **fiche** (identifiant, entrées typées, logique, sources, statut, tests),
  jamais un paragraphe ;
- toute formule relie **chaque opération** à sa justification juridique ;
- le statut par défaut est le doute. Une règle démarre à `INCOMPLETE` et ne monte que par preuve.

**L'enjeu qui gouverne tout** : un calcul de patrimoine porte souvent sur des centaines de
milliers de dollars et débouche sur une convention ou un jugement. Une lacune signalée fait
appeler un professionnel. Une invention plausible fait signer une entente. C'est pourquoi la
non-invention est le critère d'acceptation, pas une consigne de style.

---

## Décisions du CEO (2026-08-11)

| Question | Décision | Effet |
|---|---|---|
| Périmètre | **Les trois régimes** : patrimoine familial, société d'acquêts, union parentale | Deux moteurs de calcul de plus, et une couche d'articulation entre eux |
| Destinataire | **Produit SAFE générique** | Règles configurables par cabinet ; l'analyse de marché redevient un livrable de premier plan |
| Validateur | **Un avocat déjà identifié** | Dossier formaté pour signature règle par règle ; `PROD_READY` redevient atteignable |
| Cadence | **Livraison unique**, conforme au mandat | Pas de point de contrôle intermédiaire ; carnet de bord obligatoire pour ne rien perdre entre sessions |

---

## Le risque n° 1, créé par le périmètre triple

Trois moteurs de calcul justes peuvent produire ensemble un résultat **faux** si un même bien
est partagé deux fois. L'erreur est silencieuse : rien ne plante, le total est simplement
erroné.

D'où **P15, l'articulation entre régimes**, ajoutée au cœur du périmètre :

- ordre des opérations entre les trois régimes ;
- règles de prévention du double comptage ;
- seuil de complétion : **minimum 5 scénarios de test faisant intervenir au moins 2 régimes** ;
- traitée **avant** la modélisation, parce qu'un double comptage découvert après l'écriture des
  formules oblige à reprendre les trois moteurs.

---

## Comment la recherche se fait

**Principe directeur : collecte avant narration.** Le registre des sources se remplit d'abord.
Aucune fiche de règle n'est créée sans un `source_id` de niveau 1 déjà enregistré. Si la source
n'existe pas au registre, la fiche n'existe pas ; on inscrit une incertitude à la place. Cette
inversion est la principale protection contre l'hallucination.

Sept étapes internes, une seule livraison :

1. **Socle législatif** des trois régimes (textes primaires, horodatés)
2. **Articulation entre régimes** (P15)
3. **Fiscalité et retraite** (fédéral et Québec strictement séparés)
4. **Jurisprudence**, ciblée sur les points de friction des étapes 1 à 3, jamais décorative
5. **Doctrine et pratique professionnelle**
6. **Modélisation** : règles, formules, pseudo-code, 25+ scénarios, annexes machine-readable
7. **Marché, QA et production** : concurrents vérifiés un par un, PDF, résumé exécutif, matrices

**En cas de contradiction entre deux sources** : les deux positions sont consignées, les niveaux
d'autorité et les dates comparés, une troisième source cherchée. Si l'écart persiste, statut
`CONFLICT` et interdiction d'usage en production. Jamais d'arbitrage silencieux.

---

## Ce que le dépôt contient déjà, et qui n'est pas vérifié

Cinq affirmations juridiques **non sourcées** vivent dans le code et alimenteraient un futur
moteur de calcul. Elles sont la première liste de vérification, pas une base acquise.

| Affirmation | Emplacement | Enjeu |
|---|---|---|
| « art. 414-426 C.c.Q. » pour le patrimoine familial | `lib/documents/famille/wizard-data.ts:104` | Plage à confirmer |
| **Excel obligatoire, district de Montréal** | `planning/famille-document-generator.md:47` | **Si vrai, le produit doit générer ce fichier, pas un PDF maison.** Change la définition du produit |
| Union parentale « art. 521.19+ », en vigueur depuis juin 2025 | `lib/documents/famille/wizard-data.ts:107` | Droit récent, zone la plus volatile |
| Société d'acquêts « art. 448-484 », prestation compensatoire « art. 427-430 » | `lib/documents/famille/wizard-data.ts:105-106` | Frontières du périmètre |
| Prototype `calc-patrimoine-familial`, statut `ga`, seed `seed-bareme-patrimoine-qc` | `lib/catalog/catalog.ts:68` | Un partage ne se calcule pas par barème. Terme à cadrer |

---

## Ce que je ne peux pas faire

- **Bases juridiques payantes** hors de portée : La Référence, Lexis+, Westlaw, Taxnet Pro,
  JurisClasseur. Une partie de la doctrine québécoise de référence vit exclusivement là.
- **CAIJ** : je ne m'y connecte pas et je n'entre aucun identifiant, jamais. Le contenu doit
  être extrait par une personne du cabinet et déposé dans ce dossier.
- **Ma mémoire n'est pas une source**, et elle s'arrête en mai 2026 alors que le mandat vise
  aujourd'hui. Tout se vérifie en direct, sur la date de mise à jour affichée de chaque page.
- **Je ne valide pas.** `PROD_READY` signifiera « assez solide pour être soumis à validation »,
  jamais « approuvé ». Aucune règle ne va au code client sans signature humaine.

---

## Quand ce sera terminé

Seuils chiffrés, tous à zéro sauf mention contraire :

- règles de calcul `PROD_READY` sans test rattaché : **0**
- règles `PROD_READY` sans source de niveau 1 : **0**
- affirmations juridiques sans `source_id` : **0**
- fiches fiscales ne distinguant pas fédéral et Québec : **0**
- catégories de biens partageables par plus d'un régime sans règle d'articulation : **0**
- concurrents listés sans vérification directe du site officiel : **0**
- scénarios de test : **≥ 25**, dont **≥ 5** multi-régimes
- liens du registre retestés : **100 %**, dans les 7 jours avant livraison

**Le critère qui prime** : un professionnel québécois doit pouvoir prendre n'importe quelle
fiche, remonter à la source, et statuer sans me reposer de question.

---

## Prochaine action

En attente du feu vert du CEO pour ouvrir l'étape 1.

**Définition de terminé de l'étape 1** : registre des sources horodaté sur les textes primaires
des trois régimes, carte des dispositions, liste des points de friction qui piloteront la
recherche jurisprudentielle.

**Information utile, non bloquante** : nom et champ de pratique de l'avocat validateur.

---

*Travail préparatoire interne. Ne constitue pas un avis juridique, fiscal, comptable, notarial
ou actuariel. Aucune règle issue de cette recherche ne doit être intégrée dans un logiciel
utilisé auprès de clients avant validation formelle par les professionnels québécois compétents.*
