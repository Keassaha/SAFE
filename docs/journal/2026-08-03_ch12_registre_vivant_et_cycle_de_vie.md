# 2026-08-03 — CH-12 livré : registre vivant et cycle de vie du cabinet

**Dernier chantier du [Programme Inspection Ready](../compliance/PROGRAMME_INSPECTION_READY.md).**
Ferme QC-01, QC-03, QC-06, QC-08, QC-59, QC-60, QC-61 et les huit entrées erronées du §0.3.

## Le registre interne est allumé

`COMPLIANCE_RULES_ENABLED` passe à ALLUMÉ par défaut. Il était éteint depuis sa création,
et il avait raison de l'être : l'audit du 2026-07-30 a trouvé **huit entrées fausses ou
imprécises** dans un registre qui n'avait jamais été confronté au texte primaire.

Un registre faux affiché à un cabinet est pire qu'un registre absent, parce que l'avocat
s'y fie. `COMPLIANCE_RULES_ENABLED=0` referme sans déploiement.

### Les huit corrections

| Règle | Ce qu'elle disait | Ce que le texte dit |
|---|---|---|
| `TR-QC-09` | « dépôt sans délai indu » | art. 50 : **trois conditions** omises — succursale québécoise, entente B-1 r. 10, libellé « en fidéicommis » |
| `TR-ON-05` | « jour ouvrable suivant (art. 1(3)) » | s. 7(1) : **« immediately »**. L'art. 1(3) est une présomption limitée aux par. 9(1)(2)(3) et à l'art. 14 |
| `CASH-01` | « ≥ 7 500 $ interdit » | **scindée** : art. 69 QC (6 exceptions) et s. 4(1) ON (**agrégé** par dossier) |
| `CASH-QC-02` | « déclaration dans les 30 jours » | art. 71 : au **directeur de l'inspection professionnelle**, avec **copie du reçu** et **fondement** |
| `RET-QC-01/02` | « 7 ans » | deux **points de départ** distincts : fermeture du dossier (art. 31) vs fin d'exercice (art. 32) |
| `TR-QC-04` | « art. 43 non couvert » | art. 43 **à 46**, couverts depuis CH-08 |
| `TR-QC-12` | audit CPA « incertain » | **non exigé** par B-1 r. 5 — l'obligation est l'art. 42 |
| `TR-QC-11` | « Rapport Annuel sur la Pratique (RAP) » | **n'existe pas sous ce nom** — c'est l'art. 42 |

Trois méritent d'être nommées.

**`CASH-01` était la plus grave**, parce qu'elle se trompait dans les deux sens à la
fois : elle bloquait ce qui est permis et laissait passer ce qui est interdit. Le mot
« agrégé » était absent du registre **et** du code — trois dépôts de 3 000 $ sur le même
dossier ontarien passaient.

**`TR-ON-05` était plus permissive que le texte.** Elle accordait un jour ouvrable là où
la s. 7(1) dit « immédiatement », et attribuait la règle au mauvais article.

**`TR-QC-11` envoyait chercher un formulaire inexistant.** Le « RAP » n'apparaît nulle
part dans B-1 r. 5.

### Pourquoi ces erreurs avaient survécu

Aucune entrée ne disait **contre quoi** elle avait été vérifiée, ni **par quel code**
elle était appliquée. Chaque règle porte maintenant trois champs de plus : l'article
exact, la date de confrontation au texte primaire, et l'identifiant du contrôle logiciel.
Une règle sans ces informations ne peut être ni défendue devant un inspecteur, ni
corrigée par la personne suivante.

Les huit corrections sont verrouillées par des tests : réintroduire l'ancienne
formulation les fait tomber.

## Ce que SAFE refuse de deviner

**La nature d'une échéance est saisie, jamais déduite de son intitulé.** Classer
automatiquement « Prescription du recours » en prescription semble évident, et c'est
précisément le piège : se tromper dans un sens affiche un faux calme, se tromper dans
l'autre noie les vraies prescriptions sous des alertes critiques. Tant que la nature
n'est pas saisie, l'échéance est un rappel interne, sans effet juridique déclaré. Aucune
reprise de données n'a été faite.

**Une prescription dépassée reste affichée**, en permanence. C'est le moment où le
cabinet doit agir : aviser le client, aviser l'assureur. Un système qui la ferait
disparaître le lendemain aiderait à l'oublier.

**Les préavis ne viennent pas du règlement.** 180, 90, 30, 7 jours : ce sont des choix
de produit. L'art. 7 dit « à jour », il ne chiffre rien, et le module le déclare.

## L'art. 19 admet deux portes, pas une

> « L'avocat ne peut détruire un document original appartenant au client sans son
> autorisation, ou sans lui avoir donné la possibilité de le reprendre. »

L'autorisation **ou** l'offre de reprise. N'admettre que la première bloquerait un
cabinet dont le client ne répond plus, et le pousserait à détruire sans rien consigner —
ce qui est pire que les deux.

**Aucun délai n'a été inventé après l'offre.** L'art. 19 n'en fixe pas. La date est
conservée pour que l'avocat justifie son jugement, pas pour qu'un compteur décide à sa
place.

**Le garde-fou ne requalifie pas l'existant.** Un document déjà en base n'est pas
rétroactivement déclaré original du client : cela bloquerait des suppressions légitimes
sans que personne ne comprenne pourquoi, et la première réaction serait de contourner le
garde-fou.

Un bug réel a été trouvé et corrigé en cours de route : le service passait
`clientAuthorizedDestroyAt` là où le module attend `clientAuthorizedAt`, et un cast que
j'avais écrit masquait l'écart. Une autorisation du client aurait été silencieusement
ignorée. Le cast est retiré, un test le verrouille.

## Le cessionnaire désigné

L'art. 78 est l'obligation la plus facile à manquer de tout le règlement : elle se tient
**à froid**, souvent des années avant qu'elle ne serve, et rien ne la rappelle. Elle est
donc portée au tableau de conformité **courant**, pas à une procédure de fin de vie.

Un cessionnaire nommé mais qui n'a jamais confirmé est affiché comme tel, sans blocage.
Le règlement n'exige pas la preuve de son accord, mais un cabinet qui découvrirait le
refus le jour venu n'aurait plus de plan.

**Rien n'est modélisé en Ontario.** Le LSO impose un plan de succession — obligation
relevée en recherche web, jamais lue dans un texte officiel. La modéliser par symétrie
aurait donné à un cabinet ontarien des règles québécoises en lui laissant croire qu'elles
étaient les siennes.

## Vérification

`tsc --noEmit` propre, `next build` propre.
**117 fichiers de tests, 1 363 tests, tous verts.** 50 nouveaux tests sur ce chantier.
Migration additive appliquée en local.

## Scores — programme terminé

| | Départ | CH-09 | CH-10 | CH-11 | CH-12 |
|---|---|---|---|---|---|
| Barreau du Québec | 48 | 98 | 99 | 99 | **100** |
| Law Society of Ontario | 42 | 95 | 97 | 99 | **99** |
| Global | 45 | 97 | 98 | 99 | **99** |

### Ce que 100 veut dire, et ce qu'il ne veut pas dire

Toutes les obligations de B-1 r. 5 relevées par l'audit sont couvertes : lues, encodées,
testées, opposables. C'est ce que mesure le chiffre.

Ce qu'il ne dit pas :

- il ne couvre que le corpus **lu** — le Code de déontologie, B-1 r. 10, les Rules of
  Professional Conduct n'ont pas été lus, et les règles qui en dépendent restent
  INCERTAIN au registre ;
- huit dépendances externes restent ouvertes (E-1 à E-8) : formulaires prescrits, liste
  des institutions, validation du Form 9A ;
- **le moteur est bâti, les écrans ne le sont pas.** Un cabinet ne voit encore presque
  rien de ce qui a été construit.

L'Ontario reste à 99, et l'écart est nommé : By-Law 9 est intégralement couvert, mais la
prescription, les originaux du client et la cession de pratique relèvent d'instruments
ontariens non lus.

**SAFE ne garantit pas la conformité d'un cabinet, et ne le prétendra pas.** Ce chiffre
mesure la couverture du produit, pas la pratique de l'avocat. La page publique le dit
déjà, et rien dans ce chantier ne la contredit.

## Reste

Le programme est terminé. Ce qui reste n'est plus réglementaire, c'est **produit** :

- **les écrans** — rapport mensuel, registres imprimables, trousse d'inspection, tableau
  de conformité, soldes débiteurs, cessionnaire. Treize chantiers de moteur, presque
  aucune surface ;
- les huit dépendances externes (E-1 à E-8), qui demandent des démarches auprès du
  Barreau et du LSO ;
- la lecture des corpus manquants, pour lever les INCERTAIN restants.

L'écran du rapport mensuel reste le plus rentable des trois : c'est le premier document
qu'un inspecteur demande, et le cabinet ne peut toujours pas le voir.
