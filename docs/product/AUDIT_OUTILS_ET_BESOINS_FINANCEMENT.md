# Audit des outils, besoins futurs et utilisation des fonds

> Écrit le 2026-07-27, en préparation d'une demande de financement.
> Deux questions traitées : **avec quoi vous travaillez aujourd'hui**, et
> **qu'est-ce que l'argent demandé achèterait exactement**.
>
> Documents liés : `docs/product/OU_TROUVER_DU_FINANCEMENT.md`,
> `docs/product/SITUATION_JURIDIQUE_ET_FINANCEMENT.md`,
> `docs/product/PLAN_CROISSANCE_2026.md`.

---

## 0. Le cadrage que je dois poser avant les listes

Un dossier de financement ne se gagne pas sur la liste d'outils. Il se gagne sur une
phrase : **« voici ce que 20 000 $ produisent que 0 $ ne produit pas »**. Tout ce
document sert à rendre cette phrase vérifiable.

Deux vérités à garder en tête pendant la lecture :

1. **Vous êtes à environ 150 $ par mois de revenu.** Un analyste qui voit une liste
   d'abonnements IA à 400 $ par mois en face de ça conclut à de la dispersion, sauf si
   chaque ligne est rattachée à un résultat mesurable. La liste doit être courte et
   justifiée, pas exhaustive et impressionnante.
2. **Votre goulot n'est pas l'outillage de production.** Vous produisez déjà énormément
   seul : 166 000 lignes de code, 673 fichiers de test, un produit en production chez une
   vraie cliente. Le goulot est ailleurs, et je le nomme en §2.

---

## 1. Audit de l'existant

### 1.1 Le socle logiciel, mesuré dans le dépôt

| Élément | État constaté |
|---|---|
| Base de code | ~166 700 lignes (`app`, `lib`, `components`) |
| Stack | Next.js 15, React 19, TypeScript, Prisma 6, Supabase, Tailwind |
| Tests | 673 fichiers de test, exécutés avec Vitest |
| IA en production | SDK Anthropic branché sur 5 usages réels : résumé de dossier, classification de documents, extraction de preuve de paiement, extraction de reçu de dépense, analyse de PDF |
| Paiement | Stripe intégré |
| Courriel | Resend intégré |
| Stockage | Vercel Blob privé |
| Documents | Génération PDF, lecture Word, lecture Excel, Playwright et Puppeteer pour le rendu |
| Hébergement | Vercel |

**Lecture honnête : c'est un produit, pas un prototype.** L'IA n'y est pas une promesse
de pitch, elle traite déjà des reçus et des relevés. C'est un argument de dossier, et il
est vérifiable en démonstration.

### 1.2 Vos outils de travail, tels que vous les décrivez

| Outil | Ce qu'il fait pour vous | Verdict |
|---|---|---|
| **Claude Code** | Conception, code, recherche, documentation, co-direction | Cœur du dispositif. À garder, non négociable. |
| **Codex** | Deuxième moteur de code | Utile en second avis. Redondance partielle assumée. |
| **Perplexity** | Recherche sourcée | Utile, et vos documents de recherche montrent qu'il sert vraiment. |
| **Gemini (via MCP)** | Analyse de documents, vidéo, recherche | Déjà connecté dans votre environnement. Sous-exploité. |

**Ce que je constate : votre pile actuelle est cohérente et déjà payante.** Vous n'avez
pas un problème d'outils manquants. Vous avez trois problèmes différents, en §2.

### 1.3 Les trous réels, par ordre de risque

Voici ce que l'audit du dépôt fait ressortir, et qui compte davantage que n'importe quel
nouvel abonnement.

| # | Trou constaté | Risque concret | Coût pour le combler |
|---|---|---|---|
| 1 | **Aucune surveillance d'erreurs en production** (pas de Sentry ni équivalent) | Une erreur chez Me Derisier n'est visible que si elle vous appelle. Sur un logiciel qui touche du fidéicommis, c'est le trou le plus sérieux. | Faible, plan gratuit puis ~30 $/mois |
| 2 | **Aucune intégration continue** (aucun workflow GitHub) | 673 tests existent mais rien ne garantit qu'ils tournent avant un déploiement | Gratuit, quelques heures de mise en place |
| 3 | **Aucune mesure d'usage** (pas d'analytique produit) | Vous ne savez pas ce qui est utilisé dans SAFE. Impossible de prouver l'adoption à un bailleur. | Gratuit à ~50 $/mois |
| 4 | **Aucune sauvegarde vérifiée documentée** | À confirmer côté Supabase. Si la restauration n'a jamais été testée, elle n'existe pas. | Temps seulement |
| 5 | **Pas d'existence légale sous « SAFE »** | Bloque l'ensemble des guichets de financement | Quelques dizaines de dollars |

**Les points 1, 2 et 3 coûtent presque rien et transforment le discours de dossier.**
Passer de « j'ai un logiciel » à « j'ai un logiciel surveillé, testé automatiquement et
dont je mesure l'usage » change la catégorie dans laquelle un analyste vous range.

---

## 2. Les trois vrais goulots

Avant de parler d'ElevenLabs ou d'embauche, il faut nommer ce qui vous limite
réellement. Sinon on achète des solutions à des problèmes que vous n'avez pas.

### Goulot 1 · La preuve, pas le produit

Vous avez une cliente payante et un produit qui fonctionne. Ce qui manque au dossier de
financement comme au dossier de vente, ce sont **trois chiffres réels du cabinet
Derisier** et **une lettre d'intention signée**. Aucun outil ne les produit. Un appel
téléphonique, oui.

### Goulot 2 · Le temps du fondateur

Vous faites le produit, le design, la vente, la recherche, l'administratif et le
financement. C'est là que l'argent achète le plus de valeur, et c'est l'argument central
de votre demande : **financer du temps acheté, pas des licences**.

### Goulot 3 · La distribution

Le plan d'acquisition existe, la liste de cabinets existe, la stratégie DM existe. Peu
est parti. C'est ici, et seulement ici, que les outils de génération média
(voix, vidéo, image) deviennent pertinents.

---

## 3. Outils futurs, classés par ce qu'ils débloquent

Je sépare volontairement trois familles, parce qu'un bailleur les juge différemment.

### 3.1 Famille A · Fiabilité et crédibilité de la plateforme

**C'est la famille prioritaire.** Elle est peu coûteuse et elle protège la seule cliente
que vous avez.

| Outil | Rôle | Ordre de grandeur mensuel |
|---|---|---|
| Surveillance d'erreurs (Sentry ou équivalent) | Voir les erreurs avant la cliente | 0 à 30 $ |
| Intégration continue GitHub Actions | Faire tourner les 673 tests à chaque changement | 0 $ |
| Analytique produit (PostHog ou équivalent) | Mesurer ce qui est utilisé, prouver l'adoption | 0 à 50 $ |
| Journalisation et alertes | Savoir qu'un traitement a échoué la nuit | Inclus chez Vercel selon le palier |

`[Tous les montants de ce document sont des ordres de grandeur à confirmer au moment de
souscrire. Les grilles de prix changent souvent.]`

### 3.2 Famille B · Capacités IA dans le produit

Vous avez déjà l'essentiel branché. Ce qui suit est l'extension naturelle, et c'est **le
cœur de ce qu'un PARI ou un RS&DE finance** : du développement, pas de l'abonnement.

| Capacité | Ce qu'elle change pour un cabinet | Prérequis |
|---|---|---|
| **Transcription et résumé de rencontre client** | L'adjointe ne retranscrit plus. Le compte rendu arrive dans le dossier. | API de transcription, ~0,006 $ la minute selon les fournisseurs |
| **Dictée vers note de dossier** | L'avocat parle, SAFE écrit dans le bon dossier | Même brique |
| **Lecture automatique des relevés bancaires** | Extension de ce qui existe déjà pour les reçus | Développement seulement |
| **Détection d'écarts de fidéicommis en continu** | Le différenciateur conformité. Personne d'autre ne le fait en français. | Développement seulement |
| **Recherche dans les documents du cabinet** | Retrouver une clause dans 400 documents | Base vectorielle, coût faible |

**Point à noter pour le dossier : quatre de ces cinq capacités ne demandent pas de
nouvel outil, elles demandent des heures de développement.** C'est exactement ce que les
programmes de contribution financent, et c'est plus défendable qu'une liste
d'abonnements.

### 3.3 Famille C · Génération média pour la distribution

Vous nommez ElevenLabs, Seedance et Higgsfield. Je les traite ensemble, franchement.

| Outil | Usage réaliste pour SAFE | Mon avis |
|---|---|---|
| **ElevenLabs** | Voix off française propre sur la vidéo de démonstration de 3 minutes, sans studio ni prise de son | **Le plus défendable des trois.** Usage précis, résultat mesurable, coût faible. |
| **Seedance / génération vidéo** | Séquences d'illustration pour la landing et LinkedIn | Utile, mais votre landing tient déjà par le design et les captures produit. À tester avant d'abonner. |
| **Higgsfield** | Plans animés, effets | Le plus éloigné du besoin. Plaisir de création plus que levier de vente. |

**La règle que je vous propose, et que je maintiendrai :** un outil de génération média
n'entre dans le budget que quand un actif précis est commandé. « Vidéo de démonstration
de 3 minutes avec voix off » justifie ElevenLabs. « Faire du contenu » ne justifie rien.

**Et le point dur : ne mettez pas cette famille en tête d'une demande de subvention.**
Un conseiller d'ID Gatineau qui voit « abonnements de génération vidéo » avant
« surveillance de production » lit un dossier de créateur de contenu, pas de logiciel.

---

## 4. Budget d'outils, en trois paliers

| Poste | Palier survie | Palier crédible | Palier financé |
|---|---|---|---|
| Claude Code | 100 $ | 100 $ | 200 $ |
| Codex | 0 $ | 30 $ | 30 $ |
| Perplexity | 0 $ | 25 $ | 25 $ |
| Surveillance erreurs | 0 $ | 0 $ | 30 $ |
| Analytique produit | 0 $ | 0 $ | 50 $ |
| Hébergement Vercel | 20 $ | 20 $ | 60 $ |
| Base de données | 0 $ | 25 $ | 25 $ |
| API IA en production | 20 $ | 50 $ | 150 $ |
| Courriel transactionnel | 0 $ | 20 $ | 20 $ |
| ElevenLabs | 0 $ | 0 $ | 25 $ |
| Génération vidéo | 0 $ | 0 $ | 40 $ |
| **Total mensuel** | **~140 $** | **~270 $** | **~655 $** |

`[Montants indicatifs en dollars canadiens, à confirmer. Les paliers d'API varient avec
le volume réel.]`

**Ce que ce tableau dit à un bailleur :** vous tournez aujourd'hui à environ 140 $ par
mois d'outils pour 150 $ de revenu. Le palier financé représente environ 7 900 $ par an.
Ce n'est pas le gros de la demande, et c'est une bonne chose : **l'essentiel du
financement doit aller aux personnes, pas aux licences.**

---

## 5. Embaucher : qui, quand, et sous quelle forme

### 5.1 La règle de forme, avant les rôles

**Contractuels avant salariés.** Trois raisons, toutes vérifiables :

1. À 150 $ de revenu mensuel, un salaire est intenable et un bailleur le sait.
2. Les subventions locales financent souvent des mandats et des honoraires
   professionnels plus facilement que de la masse salariale.
3. Vous ne savez pas encore quel profil vous manque le plus. Un mandat de 20 heures le
   révèle sans vous engager pour un an.

`[À vérifier auprès d'ID Gatineau : quelles dépenses sont admissibles dans leurs fonds,
salaire, honoraires ou les deux. Cette réponse change la structure de la demande.]`

### 5.2 Les rôles, par ordre de rendement

| Rang | Rôle | Ce qu'il débloque | Format | Ordre de grandeur |
|---|---|---|---|---|
| 1 | **Comptable fiscaliste** (mandat ponctuel) | Décision d'incorporation, RS&DE réclamable, structure propre. Débloque plusieurs guichets. | 2 à 4 heures | 400 à 1 000 $ |
| 2 | **Designer produit senior** (mandat) | Votre chantier de re-skin avance écran par écran et vous le portez seul. Un designer qui pose le système une fois vous rend des semaines. | 20 à 40 heures | 2 000 à 6 000 $ |
| 3 | **Développeur senior à temps partiel** | Reprend la dette technique et les tests pendant que vous vendez. C'est le poste qui achète du temps de fondateur. | 1 à 2 jours par semaine | 3 000 à 6 000 $ par mois |
| 4 | **Adjointe ou vendeur à temps partiel** | Exécute la séquence de contact des 150 cabinets | 10 h par semaine | 1 500 à 2 500 $ par mois |
| 5 | **Rédacteur ou monteur vidéo** | Produit les actifs de preuve | Au projet | 500 à 1 500 $ par actif |

`[Fourchettes indicatives pour le marché Outaouais et Ottawa. À confirmer par deux ou
trois devis réels avant de les inscrire dans un dossier.]`

### 5.3 La séquence que je recommande

**Ne recrutez pas dans l'ordre de vos envies, recrutez dans l'ordre des blocages.**

1. **Maintenant, avant tout financement** : le comptable. Il coûte le moins cher et il
   débloque le plus. Sans lui, la question de l'incorporation reste ouverte et le PARI
   reste fermé.
2. **Au premier financement obtenu** : le designer, en mandat borné. Livrable défini,
   pas de relation ouverte.
3. **À la troisième cliente payante, pas avant** : le développeur à temps partiel. Avant
   ce seuil, vous financez du code sans revenu en face.
4. **Jamais avant d'avoir un discours de vente qui convertit vous-même.** Déléguer une
   vente qu'on n'a pas encore réussie ne fonctionne pas.

### 5.4 Et pour vous

Vous mentionnez du financement pour continuer à améliorer vos propres outils. C'est
légitime et c'est chiffrable :

- **Formation ou accompagnement technique** : certains fonds locaux couvrent une part de
  la formation du dirigeant. À demander explicitement à ID Gatineau.
- **Mentorat** : le BESP de Futurpreneur inclut jusqu'à deux ans de mentorat gratuit, et
  MicroEntreprendre inclut un accompagnement pendant toute la durée du prêt. Ce sont deux
  ressources déjà identifiées, non utilisées, et gratuites.

---

## 6. Traduction en « utilisation des fonds »

C'est la section à recopier dans un dossier. Trois scénarios, selon le guichet.

### Scénario 1 · 5 000 $ à 10 000 $ (MicroEntreprendre, ID Gatineau)

| Poste | Montant | Résultat mesurable |
|---|---|---|
| Consultation comptable et structure légale | 1 000 $ | Entreprise immatriculée, décision d'incorporation prise |
| Mandat de design produit | 4 000 $ | Système de design posé, cohérent sur tous les écrans |
| Outils, 12 mois au palier crédible | 3 300 $ | Surveillance, analytique, IA de production |
| Actifs de preuve (vidéo, voix off) | 1 200 $ | Vidéo de démonstration de 3 minutes |
| **Total** | **9 500 $** | |

### Scénario 2 · 25 000 $

Ajoute au scénario 1 :

| Poste | Montant | Résultat mesurable |
|---|---|---|
| Développeur senior, 3 mois à temps partiel | 12 000 $ | Trois capacités IA livrées : transcription de rencontre, lecture de relevés, détection d'écarts en continu |
| Adhésion AJEFO, congrès, déplacement | 2 000 $ | Présence sur le canal unique du marché cible |
| Réserve d'imprévus | 1 500 $ | |
| **Total** | **25 000 $** | |

### Scénario 3 · 50 000 $ à 75 000 $ (BESP, FACE)

Ajoute au scénario 2 : développeur porté à 9 mois, appui à la vente à temps partiel sur
6 mois, et une réserve de trésorerie de 6 mois. **À ne demander qu'avec une deuxième
cliente signée.** Demander 75 000 $ avec un client de 150 $ par mois affaiblit le
dossier plutôt que de le renforcer.

---

## 7. Ce que je ne recommande pas maintenant

Je préfère le nommer pour vous éviter d'y consacrer du temps ou de l'argent.

| À écarter pour l'instant | Pourquoi |
|---|---|
| Un abonnement à chaque nouvel outil IA vu passer | Coût cumulé invisible, aucun résultat rattachable. Un outil, un livrable commandé. |
| Une application mobile native | Déjà écarté dans vos décisions, toujours vrai |
| Un CRM payant | Votre volume tient dans une feuille. Le CRM viendra avec la cohorte. |
| Un salarié à temps plein | Intenable au revenu actuel, et non finançable de façon crédible |
| Une refonte technique de fond | Le produit fonctionne en production. Le goulot n'est pas là. |

---

## 8. Les cinq prochaines actions

Dans cet ordre, et rien d'autre en parallèle.

1. **Ajouter « SAFE » comme autre nom sous votre NEQ existant.** Quelques dizaines de
   dollars, en ligne. Bloque tout le reste. Voir `SITUATION_JURIDIQUE_ET_FINANCEMENT.md`.
2. **Prendre rendez-vous avec ID Gatineau** et poser une question précise : quelles
   dépenses sont admissibles, honoraires professionnels ou salaire.
3. **Brancher la surveillance d'erreurs et l'intégration continue.** Une demi-journée,
   coût nul, et cela change la catégorie de sérieux du dossier.
4. **Appeler un comptable fiscaliste** pour la question incorporation et RS&DE.
5. **Obtenir de Me Derisier les trois chiffres réels et la lettre d'intention signée.**
   C'est la pièce qui vaut le plus dans n'importe lequel des trois scénarios.

**Quatre des cinq sont des appels ou de l'administratif, pas du développement.** C'est
inconfortable, et c'est précisément pourquoi ça reste à faire.

---

## 9. Les limites de ce document

- Je ne suis ni comptable, ni fiscaliste, ni conseiller financier. Les fourchettes
  d'honoraires, l'admissibilité des dépenses et la décision d'incorporation relèvent de
  professionnels.
- **Aucun prix d'outil ni tarif de contractuel n'a été vérifié en ligne aujourd'hui.**
  Ce sont des ordres de grandeur destinés à cadrer une conversation, pas des chiffres à
  déposer tels quels dans un formulaire.
- L'audit technique de la §1 est mesuré dans le dépôt et fiable. L'audit de vos outils de
  travail repose sur ce que vous m'avez décrit, sans vérification de vos abonnements.
