# 2026-07-28 · Liste de cibles Ottawa refaite à partir du registre du Barreau

## Demande CEO

Reprendre la liste de cabinets à zéro. Critères : praticien seul ou un avocat plus au
moins une adjointe, **0 à 5 ans de pratique**, profils susceptibles de vivre les problèmes
que SAFE règle. Territoire : Ottawa et Est ontarien. Axe communautaire en secondaire.

## Méthode, et pourquoi elle change tout

L'ancienne liste (`LISTE_CABINETS_FRANCO_ONTARIENS_2026-07-26.md`) présumait la
francophonie à partir du patronyme et n'avait aucune coordonnée. Elle est remplacée.

Le répertoire public du Barreau de l'Ontario (`lsodirectory.lso.ca`) publie par avocat :
date de début de permis, nom d'exercice, adresse, téléphone, courriel, domaines déclarés,
et une case « offre des services en français ». Il se pilote par URL
(`/en-US/result-main/?licenceType=lawyers&city=...&areasOfLaw=...&offersServicesInFrench=Y`)
et le jeu de résultats complet est intégré dans le HTML de la page. Les courriels sont
obfusqués par Cloudflare (`data-cfemail`) et se décodent par XOR sur le premier octet.

22 villes croisées avec 3 domaines à fidéicommis actif (immobilier, testaments et
successions, familial), puis fiche par fiche pour la date de permis et les coordonnées.

## Résultat

| Étape | Nombre |
|---|---|
| Avocats de la région dans les 3 domaines | 360 |
| Francophones en pratique privée | 121 |
| Permis en 2021 ou après (0-5 ans) | 17 |
| **Propriétaires de leur cabinet, donc acheteurs possibles** | **8** |

Livré : `docs/research/CIBLES_OTTAWA_EST_ONTARIEN_0_5_ANS_2026-07-28.md`.

## La distinction qui réduit la liste de 17 à 8

Un avocat assermenté en 2024 chez Sicotte Guilbault ou Kelly Santini n'achète rien : il
est salarié et le logiciel du cabinet est déjà choisi. Neuf des dix-sept sont dans ce cas.
Ils sont classés en rang C comme informateurs, pas comme prospects.

Le croisement complet « francophone, 0 à 5 ans, propriétaire de son cabinet, Est
ontarien » donne huit noms. C'est peu, et c'est le vrai chiffre.

## Signaux relevés

- **ALX Legal** compte deux avocats tous les deux dans la fenêtre (2021 et 2025). Seul cas.
- **Melid Hasaj**, assermenté en 2025 à Vanier, utilise une adresse Gmail : signal de
  besoin le plus fort de la liste, budget probablement le plus serré.
- **Leavoy Law Avocat**, **Cabinet Juridique I Sabourin** et **CS Services Juridiques** ont
  inscrit le français dans leur nom légal d'exercice. Déclaration publique, pas une case
  cochée.
- **Roméo Mbourangon** et **Joanne Roulston** partagent le 116 Albert St, bureau 300.

## Axe communautaire : laissé vide, volontairement

Le Barreau ne publie ni origine ni appartenance communautaire. J'ai refusé de déduire
l'origine à partir des patronymes : peu fiable, et cela reviendrait à étiqueter des
personnes nommées sur une supposition, avec le risque d'ouvrir une conversation sur une
base fausse.

À la place, une procédure de vérification sur trois sources où les gens se déclarent
eux-mêmes (chapitre d'Ottawa de l'Association des juristes noirs, AJEFO, pages « à propos »
des huit cabinets). Environ 2 h. La case reste vide là où rien n'est déclaré.

## Écart non comblé, à redire

Ces cabinets relèvent du régime ontarien : Formulaire 9A, rapprochement dû dans les
25 jours, intérêts à la Fondation du droit de l'Ontario. Le moteur de conformité de SAFE
est québécois. Vendre à ces huit cabinets suppose de combler cet écart, ou de vendre sur
autre chose que la conformité.

## Reste disponible sans effort

Le champ « Real estate insured » du répertoire indique qui fait vraiment de l'immobilier,
donc qui a du volume réel en fidéicommis. Pas encore récolté. Les 121 francophones en
pratique privée sont extraits avec coordonnées si le CEO veut élargir au-delà de 0-5 ans.

## État du CEO

_À remplir par le CEO._
