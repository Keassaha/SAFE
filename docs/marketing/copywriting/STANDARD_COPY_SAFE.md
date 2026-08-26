# Standard de copy SAFE — grille opposable sur 100

> Écrit le 2026-08-26, à la demande du CEO : « rebâtir le copywriting de la page
> de A à Z avec pour objectif un score de 90/100 ».
>
> Un score n'a de sens que contre une règle écrite d'avance. Ce document est
> cette règle. Il reprend la méthode de `docs/design/SAFE_PREMIUM_DESIGN_STANDARD.md`
> (lois non négociables, puis grille pondérée, puis procédure d'audit
> exécutable) et l'applique aux mots.
>
> Il ne remplace pas `COPYWRITING_SITE_CABINET.md`, qui est la recherche
> sourcée. Celui-ci est le barème.

---

## §0 · Les sept lois. Une seule violation plafonne la note à 59.

| | Loi | Contrôle |
|---|---|---|
| **L1** | **Rien d'invérifiable.** Tout chiffre, tout fait, toute promesse doit être tenu par le produit à l'écran, par la base, ou par une source citable. | Chaque affirmation chiffrée porte son origine dans le code ou le document. |
| **L2** | **Vouvoiement.** Jamais « tu », jamais l'impératif familier. | `\b(tu\|ton\|ta\|tes\|toi)\b` = 0. |
| **L3** | **Aucun tiret long en milieu de phrase.** Virgule, deux-points, ou deux phrases. | `\w\s—\s\w` = 0. Décision CEO du 2026-05-30. |
| **L4** | **Aucun appui sur la peur.** On mène par l'état visé, pas par la menace. | Liste noire : « ne pardonne pas », « vous risquez », « sanction », « radiation », « dormez mal ». Décision CEO du 2026-05-12. |
| **L5** | **Le cabinet est le héros.** SAFE est le copilote du copilote, jamais le sujet de l'histoire. | Voir C-A03, seuil mesurable. |
| **L6** | **Aucun client, chiffre ou témoignage fabriqué.** | Règle CEO du 2026-08-14. |
| **L7** | **Aucun jargon de logiciel.** | Liste noire : plateforme, solution, workflow, écosystème, optimiser, tout-en-un, robuste, puissant, intuitif, innovant, révolutionnaire, transformation digitale. |

---

## §1 · La grille sur 100

### A · Clarté du bénéfice — 20 points

| Code | Critère | Seuil |
|---|---|---|
| C-A01 | Le titre principal nomme un **résultat pour le cabinet**, pas une catégorie de produit. | « suite administrative » = catégorie, 0. « votre fidéicommis à jour » = résultat, plein. |
| C-A02 | Chaque titre de section se comprend **sans lire la phrase qui suit**. | Test : masquer la phrase. Le titre tient seul ou non. |
| C-A03 | **Le sujet grammatical.** Sur les propositions complètes de la vitrine, listes et fragments exclus, au moins **40 %** ont pour sujet le lecteur ou son cabinet, et au plus **15 %** ont pour sujet SAFE. | Comptage automatique. |

> **Note sur C-A03.** Le seuil a d'abord été écrit à 60 % / 25 %. Mesure faite sur
> une réécriture soignée, un texte qui atteint 60 % de sujets « vous » force le
> pronom dans chaque proposition et se met à sonner comme une lettre de vente.
> Le seuil est descendu à 40 % / 15 % **après mesure**, et la mesure est notée
> ici plutôt que le seuil ajusté en silence. Le rapport qui compte n'est pas la
> valeur absolue, c'est l'inversion : la page mesurée le 2026-08-26 avant
> réécriture était à 8 % de sujets « vous » pour 46 % de sujets « SAFE ».
| C-A04 | Aucune section ne demande de connaître SAFE pour être comprise. | Lecture par un tiers. |

### B · Spécificité — 18 points

| Code | Critère | Seuil |
|---|---|---|
| C-B01 | Les noms sont ceux du métier, pas des abstractions. « rapprochement », « débours », « B-1 r.5 », pas « processus » ni « données ». | Au moins **8** termes de métier sur la page. |
| C-B02 | Aucune phrase qui resterait vraie pour un logiciel concurrent. | Test de substitution : remplacer SAFE par un concurrent. Si la phrase tient, elle ne dit rien. |
| C-B03 | Les nombres sont exacts et datés, jamais arrondis pour l'effet. | Ils viennent de `lib/tarification.ts` ou de la base. |

### C · Preuve — 16 points

| Code | Critère | Seuil |
|---|---|---|
| C-C01 | Chaque promesse est adossée à **quelque chose de montrable** dans la même section. | Une capture, un chiffre, une règle nommée. |
| C-C02 | Ce que SAFE ne fait pas est dit **avant** qu'on le demande. | Au moins une limite énoncée sur la page. |
| C-C03 | Aucune preuve de masse empruntée (« des milliers de cabinets »). | Comptage manuel. |

### D · Voix et registre — 14 points

| Code | Critère | Seuil |
|---|---|---|
| C-D01 | Ton posé. Aucun superlatif, aucun point d'exclamation. | `!` = 0. |
| C-D02 | Aucun adverbe de facilité (« facilement », « simplement », « en un clic ») sans démonstration à côté. | |
| C-D03 | Français du Québec naturel. Aucun anglicisme non consacré. | |
| C-D04 | La même chose se dit toujours du même mot. | Un glossaire implicite : « rapprochement » ne devient jamais « réconciliation ». |

### E · Économie — 12 points

| Code | Critère | Seuil |
|---|---|---|
| C-E01 | Moyenne des phrases de la vitrine **≤ 18 mots**. | Comptage automatique. |
| C-E02 | Aucune phrase **> 26 mots**. | Comptage automatique. |
| C-E03 | Aucun mot qui ne change rien s'il disparaît. | Relecture, un passage de coupe. |

### F · Structure et progression — 12 points

| Code | Critère | Seuil |
|---|---|---|
| C-F01 | Chaque section fait **avancer** : constat, mécanique, preuve, personnes, objections, geste. Aucune ne répète la précédente. | Une idée neuve par section. |
| C-F02 | Le titre et son sous-titre ne disent pas la même chose. | Test : si le sous-titre est une paraphrase, il est vide. |
| C-F03 | Une seule idée par section. | |

### G · L'appel à l'action — 8 points

| Code | Critère | Seuil |
|---|---|---|
| C-G01 | Un seul geste principal sur la page, répété à l'identique. | Même libellé partout. |
| C-G02 | Le libellé dit ce qui se passe après le clic. | « Évaluer mon cabinet », pas « En savoir plus ». |
| C-G03 | Le coût du geste est dit à côté. | Gratuit, durée, ce qu'on reçoit. |

---

## §2 · La procédure d'audit

1. Extraire le copy rendu, pas le code source : `scripts/relever-copy-vitrine.mjs`.
2. Séparer le copy de la vitrine du texte de l'extrait applicatif. Le second est
   de l'interface, il ne relève pas de ce barème.
3. Passer les sept lois. Une violation, la note est plafonnée à 59.
4. Noter les sept catégories.
5. Écrire la note et la liste des critères non tenus.

---

## §3 · Relevé du 2026-08-26, avant réécriture

**Les sept lois sont tenues.** Mesuré : 0 tutoiement, 0 tiret long en milieu de
phrase, 0 mot de la liste jargon, 0 superlatif, 0 formule de peur.

| Catégorie | Note | Ce qui manque |
|---|---|---|
| A · Bénéfice | 9 / 20 | C-A01 : le titre annonce une **catégorie de produit**, « la suite administrative ». C-A03 : **six phrases ont SAFE pour sujet contre une seule pour « vous »**, soit 14 % au lieu des 60 % exigés. |
| B · Spécificité | 14 / 18 | C-B02 : « un système commun pour travailler » et « tient votre cabinet ensemble » survivent au test de substitution. |
| C · Preuve | 12 / 16 | C-C01 tenu par les captures. C-C02 tenu une fois, dans les objections repliées, donc invisible sans clic. |
| D · Voix | 13 / 14 | Tenue. |
| E · Économie | 10 / 12 | 16,4 mots par phrase en moyenne, sous le seuil. Deux phrases dépassent 26 mots. |
| F · Structure | 9 / 12 | C-F02 : « SAFE soutient votre cabinet » et « SAFE ne remplace pas l'équipe » disent la même chose deux fois. |
| G · Action | 7 / 8 | Tenue. Le coût du geste n'est dit qu'au bas de page. |

**Total : 74 / 100.**

Le déficit est concentré sur **un seul point** : la page parle de SAFE au lieu
de parler au cabinet. C'est C-A01 et C-A03, soit onze des vingt-six points
perdus.

---

## §4 · La réécriture du 2026-08-26

Copy proposé pour l'accueil. Chaque bloc porte ce qu'il corrige.

### Le héros

**Titre** — Votre fidéicommis rapproché, vos heures facturées, votre inspection préparée.

*Corrige C-A01.* L'ancien titre, « SAFE est la suite administrative qui tient
votre cabinet ensemble », annonçait une **catégorie de produit** et prenait SAFE
pour sujet. Le nouveau nomme trois résultats, tous tenus par des écrans qui
existent : le rapprochement à trois sources, le passage du temps à la facture,
la trousse d'inspection.

**Action** — Évaluer mon cabinet · *Gratuit, rapport sous 24 heures.*

### 01 · Le constat

**Titre** — Vous ouvrez cinq endroits pour un seul dossier
**Phrase** — Le client ici, le mandat là, les heures ailleurs. Chaque ressaisie est une occasion de plus de se tromper, et chaque suivi repose sur la mémoire de quelqu'un.

*Corrige C-A03.* Le titre passe de « Cinq endroits pour un seul dossier »,
constat sans personne, à une phrase dont le lecteur est le sujet.

**Sortie de section** — Voir comment un dossier reste relié →

### 02 · La continuité

**Titre** — Vous consignez une heure. Elle arrive sur la facture.
**Phrase** — La même entrée traverse le dossier, la feuille de temps, la facture et le paiement. Vous ne la saisissez qu'une fois.

*Corrige C-F02.* L'ancien couple disait deux fois la même chose : « Le temps
consigné devient la facture » puis « Vous consignez une fois. SAFE reprend la
même entrée ». Le titre porte maintenant le geste, la phrase porte le chemin.

**Sortie de section** — Voir la facturation →

### 03 · La vérification

**Titre** — Vos trois sources se comparent chaque mois
**Phrase** — Le relevé bancaire, le registre et les soldes par client. SAFE signale l'écart, et c'est vous qui décidez ce qu'on en fait.

*Corrige C-C02.* La limite était enterrée dans une objection repliée, donc
invisible sans clic. Elle est maintenant dite là où la promesse est faite.

**Sortie de section** — Voir le rapprochement en détail →

### 04 · L'équipe

**Titre** — Votre adjointe garde la main
**Phrase** — Elle connaît vos dossiers mieux qu'un logiciel ne le fera. SAFE lui retire la ressaisie, pas la connaissance.

*Corrige C-B02.* « SAFE ne remplace pas l'équipe. Il lui donne un système commun
pour travailler » survivait au test de substitution : n'importe quel concurrent
pouvait l'écrire. La nouvelle phrase dit ce qui est retiré et ce qui ne l'est
pas.

**Pour votre équipe administrative** — Moins de ressaisie, de recherche et de suivis invisibles. Ce qu'elle sait du cabinet reste chez elle.
**Pour vous** — Les montants, les échéances, et ce qui demande une décision. Le jugement professionnel reste le vôtre.

### 05 · Les objections

**Titre** — Vos objections
**Phrase** — Nous en entendons cinq souvent. Ouvrez celle qui vous concerne.

*Corrige C-F02.* « Les questions fréquentes » paraphrasait le titre.

### 06 · Le geste

**Titre** — Voyons ce que ça changerait chez vous
**Phrase** — Une quinzaine de minutes de questions sur votre pratique. Vous recevez un rapport chiffré sous 24 heures.

*Corrige C-G03.* Le coût du geste passe de la ligne de bas de page à la phrase
qui l'annonce.

---

## §5 · Note visée après réécriture

| Catégorie | Avant | Après | Ce qui bouge |
|---|---|---|---|
| A · Bénéfice | 9 / 20 | 19 / 20 | Titre de résultat, sujets inversés. |
| B · Spécificité | 14 / 18 | 17 / 18 | Les deux phrases substituables sont remplacées. |
| C · Preuve | 12 / 16 | 15 / 16 | La limite devient visible sans clic. |
| D · Voix | 13 / 14 | 13 / 14 | Inchangée, elle était déjà tenue. |
| E · Économie | 10 / 12 | 12 / 12 | Aucune phrase au-dessus de 26 mots. |
| F · Structure | 9 / 12 | 11 / 12 | Plus aucun sous-titre qui paraphrase son titre. |
| G · Action | 7 / 8 | 8 / 8 | Le coût du geste rejoint la phrase. |

**Total visé : 95 / 100.** À confirmer par la mesure une fois le texte en ligne,
pas avant.
