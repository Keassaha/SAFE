# Page Fonctionnalités — plan avant écriture

> À valider avant que je code. La page actuelle traite quatre sujets à plat
> (fidéicommis, facturation, temps, dossiers) et rate ce qui vous distingue.

---

## Le problème de la page actuelle

Elle décrit des **modules**. Elle ne dit jamais pourquoi SAFE existe plutôt qu'un
logiciel comptable générique.

Or votre différenciateur est unique et défendable : **SAFE est bâti sur les règles qui
régissent les cabinets, pas adapté après coup.** Aucun concurrent générique ne peut le
dire. C'est ça qui doit ouvrir la page, pas la liste des fonctions.

---

## Le nouvel ordre, et pourquoi

| # | Section | Pourquoi cette place |
|---|---|---|
| 1 | **La conformité, par conception** | Votre seul avantage inimitable. Il répond à la peur n° 1 de l'avocat : l'inspection. |
| 2 | **Le temps, saisi en quelques secondes** | La tâche la plus fréquente. Si elle est pénible, rien d'autre ne compte. |
| 3 | **La facture part, la comptabilité se fait seule** | Le gain le plus spectaculaire. C'est là que le « 30 minutes » disparaît. |
| 4 | **Les rappels, sans que vous y pensiez** | L'argent qui rentre. Prolonge naturellement la section 3. |
| 5 | **Le dossier arrive déjà structuré** | La preuve la plus concrète du « adapté à votre pratique ». Suite logique de la section 1. |
| 6 | **Tout reste relié au dossier** | Le liant. Se lit mieux à la fin, une fois les usages compris. |

> **Il reste de la matière.** Vous m'avez signalé que la liste est plus longue. Cette
> page ne doit pas tout dire : six sections est déjà la limite haute. Ce qui n'entre pas
> ici (vérification de conflits, échéances et prescriptions, rapports réglementaires,
> import de reçus, Navette) mérite soit une page « toutes les fonctions » en tableau,
> soit des publications. Dites-moi ce qui doit absolument monter en page principale.

Fil conducteur de la page, répété trois fois :

> **SAFE fonctionne comme l'assistant de votre assistante. Ou comme votre assistante, si
> vous n'en avez pas.**

---

## Section 1 · La conformité, par conception

**Titre proposé**
> Le système connaît les règles. Il vous arrête avant l'erreur.

**Ce qu'on dit**

SAFE n'est pas un logiciel comptable auquel on a ajouté du juridique. Il est construit à
partir des obligations qui encadrent un cabinet : fidéicommis, tenue de livres,
rapports, plafonds. Selon le barreau où vous exercez, certaines actions sont simplement
bloquées, et le système vous dit pourquoi.

Trois preuves concrètes, dans cet ordre :

1. **Un dépôt en espèces de 7 500 $ ou plus est refusé.** Le système ne se contente pas
   d'avertir, il empêche l'écriture et cite la règle. `[à vérifier avec vous : voir plus bas]`
2. **Une certification de rapprochement reste bloquée tant qu'un écart subsiste.** Vous
   ne pouvez pas signer une période qui ne concorde pas.
3. **L'état de conformité du cabinet est visible en permanence**, domaine par domaine.
   Vous savez où sont vos manques avant qu'on vous les signale.

**Maquette interactive** : le visiteur tente lui-même un dépôt de 8 000 $ en espèces.
Le champ passe en ambre, l'écriture est refusée, la règle s'affiche. Il change pour
2 000 $, l'écriture passe. Une seule interaction, très parlante.

**Ce que ça remplace** : rien, c'est une section nouvelle.

---

## Section 2 · Le temps, saisi en quelques secondes

**Titre proposé**
> Deux façons de compter. Aucune de les oublier.

**Ce qu'on dit**

Certains avocats facturent à l'heure, d'autres au forfait, souvent les deux dans le même
cabinet. SAFE prend les deux au même endroit. Le chronomètre tourne pendant que vous
travaillez, ou vous inscrivez la durée après coup. Chaque entrée est reliée au dossier,
donc rien ne se perd d'ici la facture.

**Maquette interactive** : celle qui existe déjà sur la page À propos, avec le
chronomètre et la bascule horaire/forfait. On la réutilise telle quelle.

---

## Section 3 · La facture part, la comptabilité se fait seule

**Titre proposé**
> Vous cliquez « envoyer ». Le reste est déjà écrit.

**Ce qu'on dit**

C'est le cœur du gain. L'avocat fait deux choses : saisir son temps, relire la facture.
Au moment de l'envoi, SAFE passe seul les écritures comptables : le revenu, les taxes,
la créance, l'affectation au dossier. Le tableau de bord se met à jour dans la foulée.

Rien à reporter dans un autre logiciel. Rien à ressaisir en fin de mois.

**Maquette interactive** : une facture prête. Le visiteur clique « Envoyer ». La facture
part, puis les écritures s'inscrivent une à une sous ses yeux (revenu, TPS, TVQ,
créance), et le solde du tableau de bord bouge. C'est la démonstration la plus forte de
toute la page.

---

## Section 4 · Les rappels, sans que vous y pensiez

**Titre proposé**
> Les factures oubliées ne le restent pas.

**Ce qu'on dit**

Passé le délai que vous fixez, SAFE signale les factures en souffrance et prépare les
rappels. Vous approuvez, ils partent. Ce n'est pas une relance agressive, c'est le suivi
qu'une assistante ferait si elle avait le temps de tout regarder chaque semaine.

**Maquette interactive** : celle du tableau de bord complet, section « À traiter
maintenant », avec le bouton « Envoyer les rappels ». Elle existe déjà.

---

## Section 5 · Le dossier arrive déjà structuré

**Titre proposé**
> Vous ouvrez un dossier. Le cartable est déjà monté.

**Ce qu'on dit**

C'est ici que « adapté à votre pratique » cesse d'être une promesse. À l'ouverture d'un
dossier, SAFE monte le cartable réglementaire du domaine concerné. Vous ne créez pas les
sections, vous ne cherchez pas la bonne nomenclature : elle est là.

En droit de la famille, le cartable ouvre avec ses neuf sections :

> Mandat et engagement · Pièces Madame (P-) · Pièces Monsieur (D-) · Procédures ·
> Jugements et ordonnances · Correspondance · Fidéicommis · Notes et honoraires ·
> Fermeture du dossier

Les sections de pièces citent leur source, le Règlement de la Cour du Québec. Vous
déposez vos documents, ils se rangent à leur place, et une section obligatoire encore
vide est signalée avant qu'elle devienne un problème.

Un dossier en droit criminel n'a pas ce cartable. Il a le sien, avec sa phase
préjudiciaire. C'est le même produit, configuré pour votre pratique.

**Maquette interactive** : le visiteur choisit un domaine dans une liste déroulante
(famille, criminel, immobilier). Le cartable se remonte devant lui, section par section,
avec les sources réglementaires. Il glisse ensuite un document fictif, qui se range dans
la bonne section.

**Vérifié dans le code** : `lib/dossiers/cartable-templates/index.ts` contient bien ces
sections, avec leurs sources. La génération est automatique à la création du dossier
(`generateCartable`). Ce n'est pas une promesse, c'est livré.

---

## Section 6 · Tout reste relié au dossier

**Titre proposé**
> Chaque affaire garde son contexte.

**Ce qu'on dit** : le texte actuel, conservé. Clients, parties, documents, échéances,
temps et débours restent reliés au dossier.

**Maquette interactive** : le dossier navigable, déjà en place.

---

## Section de clôture · Ce que SAFE ne fait pas

À garder, raccourcie. SAFE soutient le suivi des obligations, il ne s'y substitue pas.
La responsabilité professionnelle demeure celle du cabinet.

---

## Ce que je dois vérifier avec vous avant d'écrire

Réponses reçues : on nomme le Québec et l'Ontario, la facture part directement au client
depuis SAFE, les rappels partent après votre approbation, et le classement automatique
des pièces est actif. Reste le seuil d'espèces, traité ci-dessous.

---

## Recherche vérifiée · le plafond d'espèces (2026-07-26)

**Conclusion : les deux barreaux ne fonctionnent pas de la même façon.** C'est une
excellente nouvelle pour la page, et un problème pour le code.

### Ontario · Law Society of Ontario, By-Law 9

Interdiction pure. Un titulaire de permis **ne peut recevoir, pour un même dossier
client, des espèces dont le total dépasse 7 500 $ CA**. Noter la formulation : le
règlement dit « more than $7,500 », donc un montant de 7 500 $ pile demeure permis.

Des exceptions existent (article 6) : institutions financières, organismes publics,
ordonnances judiciaires, et honoraires ou débours professionnels lorsque tout
remboursement se fait également en espèces.

### Québec · Règlement sur la comptabilité et les normes d'exercice professionnel des avocats

Régime différent. Recevoir **7 500 $ ou plus en espèces pour un même mandat n'est pas
interdit en soi : cela déclenche une déclaration obligatoire** au directeur de la Qualité
de la profession, dans les 30 jours, avec copie des reçus.

L'interdiction absolue vise des cas précis : règlement hors cour non entériné par le
tribunal, transaction d'achat immobilier pour un client, et la plupart des opérations
commerciales. Les mêmes familles d'exceptions existent (institutions financières,
organismes publics, ordonnances, cautionnements, avances d'honoraires ou de débours).

### Ce que ça implique pour le code

`lib/services/fideicommis/trust-transaction-service.ts` définit
`CASH_DEPOSIT_LIMIT = 7500` et bloque tout dépôt de « 7 500 $ ou plus », pour les deux
provinces. Deux écarts :

1. **Ontario** : la règle porte sur un montant *supérieur* à 7 500 $. Un dépôt de
   7 500 $ exactement est aujourd'hui bloqué à tort.
2. **Québec** : le blocage pur est trop strict. Un avocat québécois qui reçoit 8 000 $ en
   avance d'honoraires a le droit de le faire ; il doit le déclarer. SAFE devrait donc
   *permettre l'écriture et ouvrir la déclaration*, pas refuser.

Tant que ce n'est pas corrigé, je ne peux pas écrire sur le site que SAFE applique la
règle du barreau : ce serait faux pour le Québec.

### Ce que ça donne pour la page, une fois corrigé

C'est votre meilleure démonstration, et elle devient bien plus forte que prévu :

> Le même dépôt de 8 000 $ en espèces ne produit pas le même résultat selon votre
> barreau. En Ontario, SAFE le refuse. Au Québec, SAFE l'accepte et prépare votre
> déclaration de 30 jours. Un logiciel comptable générique ne connaît ni l'une ni
> l'autre de ces règles.

**Maquette** : un sélecteur Québec / Ontario au-dessus du champ. Le visiteur entre
8 000 $ et bascule d'une province à l'autre pour voir les deux comportements. C'est la
preuve la plus parlante de toute la page.

**Sources**
- [LSO · Cash limits and exceptions](https://lso.ca/lawyers/practice-supports-and-resources/topics/managing-money/cash-and-money-laundering/cash-limits-and-exceptions,-definitions)
- [Barreau du Québec · FAQ comptabilité et fidéicommis](https://www.barreau.qc.ca/en/membres-ordre/obligations-membres/comptabilite-fideicommis-facturation/comptabilite-fideicommis-faq/)
- [Règlement RLRQ c B-1, r 5](https://www.legisquebec.gouv.qc.ca/fr/document/rc/b-1,%20r.%205)

> Vérification faite par recherche web le 2026-07-26. À faire confirmer par votre
> conseiller avant publication : je suis confiant sur la distinction déclaration /
> interdiction, mais un site lu par des avocats mérite une relecture humaine.

---

## Ce que je construis, une fois validé

- Trois maquettes neuves : **le refus de dépôt non conforme**, **l'envoi de facture qui
  écrit la comptabilité**, et **le cartable qui se monte selon le domaine**.
- Trois maquettes réutilisées : fiche de temps, tableau de bord complet, dossier
  navigable.
- Animations au scroll dans le même langage que la page d'accueil, jamais d'épinglage
  long, aucun émoji.
