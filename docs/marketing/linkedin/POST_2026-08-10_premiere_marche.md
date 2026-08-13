# Post LinkedIn — la première marche qui manquait

**Date de rédaction** : 2026-08-10 · **corrigé le 2026-08-11**
**Format** : mercredi, « le défaut » (pilier de marque du [système quotidien](SYSTEME_BUILD_IN_PUBLIC_QUOTIDIEN.md))
**Pièce jointe** : [CARROUSEL_2026-08-10_premiere_marche.pdf](CARROUSEL_2026-08-10_premiere_marche.pdf) · 9 pages, 1080 × 1350
**Sources** : [réévaluation du 2026-08-10](../../compliance/REEVALUATION_2026-08-10.md) ·
[matrice](../../compliance/MATRICE_ETAT_CONFORMITE.md) ·
[bilan avant/après](../../compliance/BILAN_CONFORMITE_AVANT_APRES.pdf)

> **Le carrousel porte l'histoire. Le texte ne la répète pas, il donne envie de balayer.**
> Un post long doublé d'un document de neuf pages fait lire deux fois la même chose, et
> LinkedIn compte le temps passé sur le document, pas sur le texte.

---

## 1. Texte du post

On a demandé un audit à charge de notre propre logiciel.

Trois règlements du Barreau lus en entier, pas leurs résumés. 105 obligations, chacune avec son article en regard du code.

Résultat : 45 sur 100.

Une facture encore au brouillon permettait de sortir de l'argent d'un compte en fidéicommis. Et le rapport comptable mensuel, la première pièce qu'un inspecteur demande, n'était tout simplement pas produisible.

Onze jours de travail plus tard, on est à 99.

Mais le plus utile n'est pas ce chiffre.

C'est ce qu'on a trouvé après, en posant une question toute bête : qu'est-ce qu'un cabinet qui vient de s'inscrire peut réellement faire ?

Presque rien. Il manquait la première marche.

Le document ci-dessous raconte les deux, en neuf pages.

---

## 2. Premier commentaire (CTA + lien)

⚠️ **À ne publier qu'après la vérification 3 du §3.**

Nous publions la liste complète : chaque obligation relevée, son article, son état réel dans SAFE, et ce qui manque encore.

Elle s'appuie sur les textes officiels. Elle peut donc vous servir de liste de contrôle avant une inspection, même si vous n'utilisez pas SAFE.

→ safecabinet.ca/conformite

Si vous y voyez une obligation mal interprétée, dites-le-nous. C'est précisément pour cela que nous la publions.

---

## 3. Ce qui bloque avant publication

### ⚠️ Trois vérifications, dans cet ordre

**1. Promouvoir le déploiement.**
Le code est poussé et le build de préproduction est vert, mais la promotion en production
n'est pas faite. Tant qu'elle ne l'est pas, la page 07 du carrousel dit « ça part en ligne
cette semaine », ce qui est exact. Une fois faite, la regénérer avec « c'est en ligne
depuis ce matin » :

```bash
npx tsx scripts/render-doc-pdf.ts docs/marketing/linkedin/CARROUSEL_2026-08-10_premiere_marche.source.html docs/marketing/linkedin/CARROUSEL_2026-08-10_premiere_marche.pdf
```

**2. Un défaut ouvert en production, à régler AVANT de publier.**
Les migrations CH-08 et CH-09 n'ont pas été poussées le 6 août, alors que le code qui en
dépend l'était. Les tables `TrustProperty` et `TrustAnnualReport` n'existent pas dans la
base de production, et l'écran « Autres biens » y renvoie donc une erreur.

Publier un post sur la rigueur pendant qu'un écran plante chez un cabinet serait le pire
moment possible. La promotion corrige les deux d'un coup : le build applique les
migrations.

**3. La page safecabinet.ca/conformite affiche-t-elle les chiffres à jour ?**
Le premier commentaire y renvoie. Si elle porte encore l'ancien décompte, on corrige la
page avant de publier.

### Correction factuelle du 2026-08-11

**Une affirmation de la version précédente était fausse**, et elle venait de moi. Elle
disait : « le travail vit sur une branche à 92 commits de la version publiée, aucun
cabinet n'y a accès aujourd'hui ». C'était mesuré contre `main`.

**`main` est une branche morte**, figée au 30 juin. La production ne la suit pas : elle
tourne sur la branche release, promue à la main.

L'état réel, mesuré le 11 août contre le déploiement en ligne :

| | En production | Écrit et testé |
|---|---|---|
| Modules de règles | **15 sur 15** | 15 |
| Écrans d'inspection | **6 sur 12** | 12 |
| Migrations de base | 14 sur 16 | 16 |

Le moteur et la moitié des écrans **servent déjà les cabinets**. Ce que raconte le post
reste vrai : la déclaration du compte en fidéicommis, elle, n'est pas en ligne, et c'est
bien elle qui bloquait un cabinet nouvellement inscrit.

### Ce qui a changé dans le texte

| Écrit d'abord | Corrigé en | Raison |
|---|---|---|
| Texte long de 25 lignes | 10 lignes, le carrousel porte le récit | Un post long doublé d'un document fait lire deux fois la même chose |
| « les 100 obligations relevées au Québec » | « 105 obligations » et « 100 sur 100 » séparés | Se lisait comme s'il y avait 100 obligations. 100 est un SCORE |
| « onze écrans sur onze affichaient la même phrase » | « le rapport mensuel… le rapport annuel, la même » | **Faux.** La phrase exacte n'apparaît que sur deux écrans |
| « quand vous lisez conforme au Barreau sur une page de vente » | « devant n'importe quel outil, y compris le nôtre » | Analogie horizontale, jamais dénigrante |
| « votre inspection peut tomber n'importe quand » | supprimé | On ne mène pas par la peur |
| Tirets longs en milieu de phrase | virgules et deux-points | Règle dure |

### Angles écartés

| Angle | Écarté parce que |
|---|---|
| Les deux migrations non suivies, qui plantent en production | **Meilleure histoire que celle-ci**, mais elle se publie une fois corrigée, jamais avant. Gardée pour un prochain mercredi |
| « SAFE est-il réglementaire ? », en question frontale | Attire les commentaires juridiques. Placée en conclusion du carrousel, pas en accroche |
| Les 110 erreurs de style corrigées, la palette de couleurs | Aucun intérêt pour la cible |

---

## 4. Prompt de vérification factuelle

À coller dans Perplexity avant publication. Les affirmations sont reprises telles quelles.

```
Tu es vérificateur de faits. Vérifie chacune des affirmations suivantes,
concernant la réglementation applicable aux avocats du Québec et de l'Ontario.
Pour chacune : VRAI, FAUX, ou IMPRÉCIS, avec la source officielle et la citation
exacte. Ne complète pas ce qui n'est pas demandé.

1. Le Règlement sur la comptabilité et les normes d'exercice professionnel des
   avocats (RLRQ c. B-1, r. 5) comporte bien des articles numérotés de 1 à 87.

2. Ce règlement impose à l'avocat de tenir les livres et registres, et c'est
   l'avocat, non son fournisseur de logiciel, qui en est responsable.

3. Le rapport comptable mensuel doit être certifié par l'avocat lui-même.

4. Au Québec, l'entité qui peut demander un rapport comptable à un avocat est le
   directeur de l'inspection professionnelle du Barreau du Québec.

5. Le By-Law 9 de la Law Society of Ontario ne contient AUCUNE règle
   d'identification et de vérification du client. Ces règles se trouvent dans le
   By-Law 7.1, partie III.

6. Au Québec, un avocat ne peut retirer des honoraires d'un compte en fidéicommis
   que pour une facturation qui a été ENVOYÉE au client, et non seulement émise.

7. Au Québec, le retrait de sommes en espèces d'un compte général en fidéicommis
   est interdit, sous réserve d'une exception limitée.

8. Aucun organisme de réglementation, au Québec ou en Ontario, ne certifie ni
   n'homologue de logiciel de comptabilité pour avocats. Un éditeur ne peut donc
   pas se dire « certifié Barreau ».

Termine par : toute formulation du texte ci-dessous qui pourrait laisser croire
qu'un logiciel peut être « conforme » à la place de l'avocat, ou qui attribue au
logiciel une obligation qui appartient à l'avocat.

[COLLER ICI LE TEXTE DU POST ET LES 9 PAGES DU CARROUSEL]
```

---

## 5. Variante texte seul

Si vous préférez publier sans document, la version longue de 25 lignes reste dans
l'historique git de ce fichier (commit du 2026-08-10). Elle raconte la même histoire en
entier. Ne publiez pas les deux : ce serait le même contenu deux fois dans le fil.
