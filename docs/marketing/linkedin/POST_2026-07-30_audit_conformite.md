# Post LinkedIn — audit de conformité SAFE

**Date de rédaction** : 2026-07-30
**Angle** : build-in-public, publication du score réel
**Pièces jointes suggérées** : capture de la matrice ([MATRICE_ETAT_CONFORMITE.md](../../compliance/MATRICE_ETAT_CONFORMITE.md), §2 et §3)

---

## 1. Texte du post

Un avocat qui prépare une inspection ne cherche pas un logiciel. Il cherche une réponse à une question simple : est-ce que mes livres tiennent ?

Nous avons voulu savoir si SAFE permettait de répondre oui. Alors nous avons fait l'inverse de ce qui se fait d'habitude. Nous avons demandé un audit à charge de notre propre logiciel.

Trois textes, lus en entier, pas en résumé :

▪ Règlement sur la comptabilité et les normes d'exercice professionnel des avocats (Québec), articles 1 à 87
▪ By-Law 9 de la Law Society of Ontario
▪ By-Law 7.1, partie III

113 obligations cartographiées une par une, chacune avec son article exact en regard du code.

Résultat : 45 sur 100.

Voilà ce que ça voulait dire concrètement.

Une facture encore au brouillon permettait de sortir de l'argent du compte en fidéicommis. Le règlement est pourtant net : les honoraires ne se retirent que pour une facturation déjà envoyée au client.

Le rapprochement annonçait trois voies. Il en comparait deux. La troisième était calculée, stockée, et jamais confrontée aux autres.

Le formulaire de vérification d'identité proposait « Vidéo » comme méthode. Cette méthode n'apparaît dans aucun des deux règlements.

Et un point qui change beaucoup de choses : le By-Law 9 ne contient aucune règle d'identification du client. Elles sont dans un règlement distinct, le By-Law 7.1. Nous l'avions manqué. Ce n'est pas une confusion rare.

En une journée de travail, les failles les plus lourdes sont fermées. Le score est passé à 52.

Il n'est pas à 100. Il ne le sera pas avant plusieurs mois. Le rapport comptable mensuel, qui est la première pièce qu'un inspecteur demande, reste à construire.

Nous publions les deux chiffres, et la liste de ce qui manque encore.

Un logiciel qui affiche « 100 % conforme » vous demande de le croire. Un logiciel qui affiche son score et son plan vous laisse vérifier.

---

## 2. Premier commentaire (CTA + lien)

La matrice complète est publique : les 113 obligations, l'article correspondant, l'état actuel, et le chantier qui la ferme.

Si vous tenez une comptabilité en fidéicommis au Québec ou en Ontario, elle vous sert même sans SAFE. C'est une liste de contrôle adossée au texte officiel.

→ safecabinet.ca/conformite

Et si vous voyez une obligation que nous avons mal lue, dites-le. C'est exactement pour ça qu'on la publie.

---

## 3. Récapitulatif des modifications apportées à la demande initiale

| Demande | Ce qui a été livré | Pourquoi |
|---|---|---|
| Montrer un état final à 100 % de conformité | Publication de **45 → 52**, avec la cible à 100 et le calendrier | SAFE n'est pas à 100 aujourd'hui : 2 chantiers sur 13 sont faits, et le rapport mensuel de l'art. 41 n'existe pas. Publier 100 serait faux, contredirait la page d'accueil (« SAFE garantit-il ma conformité ? Non »), et exposerait un avocat qui s'y fierait. |
| Résumer la tâche effectuée | Trois défauts concrets nommés, plutôt qu'une liste de fonctionnalités | Doctrine contenu : partir d'un problème concret, pas du produit. Un lecteur retient « facture brouillon = argent sorti », pas « garde-fou implémenté ». |
| Montrer la matrice | Renvoi vers la matrice publiée, avec appel à correction | La matrice est trop dense pour un post. En lien, elle devient un actif réutilisable et une raison de commenter. |
| — | Ajout de la découverte sur By-Law 9 / By-Law 7.1 | C'est l'élément le plus mémorable et le plus utile au lecteur. Il donne une raison de sauvegarder le post. |
| — | Aucun tiret long dans le corps du texte | Règle dure. |
| — | Voix « vous », ton posé, pas d'appui sur la peur de l'inspection | L'inspection est nommée une fois, comme contexte, jamais comme menace. |

### Ce qui a été volontairement écarté

- **« 100 % conforme »**, pour les raisons ci-dessus.
- **Toute promesse de garantie de conformité.** La formule retenue reste : SAFE outille, la responsabilité professionnelle demeure celle du cabinet.
- **Le score ontarien présenté comme une progression forte.** Il passe de 42 à 44 seulement, et son dénominateur va bouger quand la cartographie de By-Law 7.1 sera complète. Le post ne met donc en avant que le score global.

---

## 4. Prompt de vérification factuelle (Perplexity)

> Vérifie chacune des affirmations suivantes contre les textes officiels, et indique
> pour chacune : exacte, inexacte, ou partiellement exacte, avec la citation et le
> lien de la source primaire. Ne te fie pas à des articles de blogue ou à des pages
> de cabinets : uniquement LegisQuébec, le site du Barreau du Québec, et lso.ca.
>
> 1. Le Règlement sur la comptabilité et les normes d'exercice professionnel des
>    avocats du Québec porte la référence RLRQ c. B-1, r. 5 et comporte 87 articles.
>
> 2. Son article 56 n'autorise que trois types de retrait d'un compte général en
>    fidéicommis, et le retrait pour honoraires n'est permis que pour ceux « pour
>    lesquels la facturation a été envoyée ».
>
> 3. Son article 57 interdit tout retrait en espèces d'un compte général en
>    fidéicommis, sous la seule réserve de l'article 72.
>
> 4. Son article 41 impose un rapport comptable mensuel sur formulaire prescrit,
>    contenant sept éléments dont la liste des soldes de cartes-clients et la liste
>    des chèques en circulation.
>
> 5. Son article 26 fixe le délai de vérification d'identité à 60 jours pour une
>    société ou un organisme.
>
> 6. Le By-Law 9 de la Law Society of Ontario, paragraphe 9(1)3, permet le retrait
>    de fonds en fiducie pour des honoraires seulement « for which a billing has
>    been delivered ».
>
> 7. Le By-Law 9 impose que la comparaison mensuelle du paragraphe 18(8) soit créée
>    dans les 25 jours suivant la fin du mois (paragraphe 22(2)).
>
> 8. Le By-Law 9 ne contient AUCUNE règle d'identification et de vérification du
>    client. Ces règles se trouvent dans le By-Law 7.1, partie III.
>
> 9. Le By-Law 7.1, paragraphe 23(7), énumère limitativement trois méthodes de
>    vérification de l'identité d'une personne physique : pièce d'identité
>    gouvernementale avec photo, dossier de crédit canadien existant depuis au moins
>    trois ans, et double source indépendante.
>
> 10. Le By-Law 7.1, paragraphe 23(6), fixe à 30 jours le délai de vérification de
>     l'identité d'une organisation, soit un délai plus court qu'au Québec.
>
> 11. Le By-Law 7.1, paragraphe 23(2), exige d'obtenir la source des fonds, alors
>     que le règlement québécois ne comporte pas d'obligation équivalente.
>
> Pour toute affirmation que tu juges inexacte ou partiellement exacte, donne la
> formulation correcte avec la référence précise.

---

## 5. Notes de publication

- **Visuel recommandé** : un tableau simple à trois colonnes (Départ 45 · Actuel 52 · Cible 100) plutôt qu'une capture de la matrice complète, illisible sur mobile.
- **Moment** : le post fonctionne mieux séparé de tout contenu produit. Ne pas l'enchaîner avec une annonce de fonctionnalité.
- **Réponses aux commentaires** : si quelqu'un conteste une lecture d'article, remercier, vérifier contre le texte, et corriger publiquement si l'objection tient. C'est le seul comportement cohérent avec la thèse du post.
- **À ne pas faire** : republier ce post en le titrant « SAFE est conforme ». La force du texte tient entièrement au fait qu'il ne le dit pas.
