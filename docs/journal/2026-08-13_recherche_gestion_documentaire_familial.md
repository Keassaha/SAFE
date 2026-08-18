# Recherche : gestion documentaire du dossier familial québécois

**2026-08-13**

Première recherche fondatrice pour le module « gestion documentaire configurable par domaine de pratique », dont le droit de la famille est le premier cas.

## Ce qui a été livré

- `docs/research/gestion-documentaire-familial/00_SOURCES_ET_METHODE.md`
- `docs/research/gestion-documentaire-familial/RAPPORT_GESTION_DOCUMENTAIRE_FAMILIAL_QC.md`

Le rapport couvre les treize livrables demandés : cycle de vie, typologie, taxonomie, matrice, règles de pièces et de versions, contrôles qualité, règles de noyau, règles familiales, variations configurables, zones de validation, modèle de données, scénario complet, MVP.

## Le fait qui commande tout le reste

**LégisQuébec, CanLII, justice.gouv.qc.ca et le site de la Cour supérieure répondent tous 403** à la lecture automatisée. Le *Code de procédure civile*, le Règlement de la Cour supérieure en matière familiale et les directives locales n'ont donc **pas été lus à la source**.

Ce qui a pu l'être : la *Loi sur le divorce*, les *Lignes directrices fédérales* et le formulaire Annexe I. Tout le reste est rapporté par le Barreau du Québec et le Barreau de Montréal, sources professionnelles fiables mais secondaires.

Conséquence : 29 affirmations portent `SOURCE_PRIMAIRE_LUE`, 44 portent `SOURCE_RAPPORTEE`. Le rapport ne masque pas ce ratio, il le met en tête.

## Deux découvertes structurantes

**Il ne faut pas coder dix types de dossiers familiaux.** Les dix cas demandés se décomposent en trois axes indépendants : fondement juridique, objets de la demande, régime procédural. Un divorce contesté avec garde et pension est une combinaison, pas un type.

**Les aides-mémoire du Barreau sont en retard sur la loi fédérale.** Ils parlent encore de garde et d'accès là où la *Loi sur le divorce* parle de temps parental et de responsabilités décisionnelles depuis 2021. La boîte à outils de Montréal le reconnaît elle-même. Recopier ces libellés livrerait un vocabulaire périmé à des avocats.

## Une erreur attrapée par la relecture

Le brouillon plaçait le déclencheur de l'obligation continue de divulgation (art. 25 DORS/97-175) à **l'anniversaire de l'ordonnance**. Faux. L'obligation naît d'une **demande écrite** de l'autre époux, au plus une fois par année, et le délai de 30 ou 60 jours court depuis la **réception**, présumée dix jours après l'envoi.

Une échéance inventée dans un dossier alimentaire est exactement le préjudice que la règle anti-invention vise. La correction est consignée dans la règle `R-FAM-002` elle-même, avec sa note de révision, plutôt que effacée.

## Prochaine action

Faire lever le blocage sur les sources québécoises, par téléchargement manuel ou accès autorisé, puis reprendre les 44 affirmations `SOURCE_RAPPORTEE`. Sans cela, le MVP se limite au classeur financier fédéral, qui est le seul socle entièrement vérifié.
