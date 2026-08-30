# Structure finale de la page d'accueil — six mouvements

> Arrêtée par le CEO le 2026-08-30. **Opposable** : c'est le contenu de référence
> de `components/public-site/ExperienceCinema.tsx`. Un écart entre cette page et
> le site est un défaut du site, pas de ce document.

## Pourquoi ce fichier existe

Le brief de refonte vit dans `~/Downloads`, **hors du dépôt** : six `.md` et une
maquette validée qu'aucun `git log` ne connaît. Une session a déjà été perdue à
chercher « où sont les corrections ». La structure arrêtée entre donc ici, dans
le dépôt, à côté du code qu'elle gouverne.

Documents d'origine, à consulter pour le détail des mesures et des références
visuelles :

- `~/Downloads/BRIEF_DESIGN_ACCUEIL_SAFE_2026.md`
- `~/Downloads/STRUCTURE_NARRATIVE_CONTENU_SAFE.md`
- `~/Downloads/REFERENCES_VISUELLES_DESIGN_SAFE.md`

---

## L'ordre

```
Conviction → Dossier administratif → Facturation et comptabilité
           → Conformité → Réalité → Projection
```

La thèse, en trois lignes, telle que le CEO la formule :

> Le dossier organise.
> Les finances restent reliées.
> Les garde-fous vérifient.

L'administration est le **point de départ**, la facturation en est une
**continuité**, et la conformité agit comme une **couche de sécurité** autour de
l'ensemble.

---

## 1. La conviction

**Exergue** — Système de gestion pour cabinets d'avocats
**Titre** — SAFE tient votre cabinet ensemble.
**Texte** — Chaque dossier organise le travail administratif, relie les
opérations financières et soutient les obligations professionnelles du cabinet.
**Actions** — Évaluer mon cabinet · Voir SAFE en action →

> ⚠ **Contradiction non tranchée.** Le site porte aujourd'hui le titre COURT
> « Votre cabinet tient ensemble. », validé le 2026-08-27 sur maquette et
> retravaillé le 2026-08-29 (26 px, deux encres). La structure ci-dessus rétablit
> le titre LONG et une description en trois propositions. Les deux ne peuvent pas
> tenir ensemble. À trancher avant de toucher au mouvement 1.

## 2. Le dossier administratif

**Titre** — Chaque dossier s'ouvre avec la bonne structure.
**Texte** — SAFE organise le dossier selon le domaine de pratique et la manière
de travailler du cabinet.

Dans un même espace, l'équipe retrouve :

- les renseignements du client et du mandat ;
- les documents et les pièces ;
- les notes partagées ;
- les échéances ;
- les prochaines actions ;
- les personnes responsables ;
- le temps et les débours rattachés au dossier.

**Clôture** — L'information ne dépend plus de la mémoire d'une seule personne.
L'équipe voit ce qui a été fait, ce qui manque et ce qui doit suivre.

**Démonstration exigée** — un vrai dossier navigable, avec une note partagée, une
échéance et une prochaine action clairement attribuée.

> État au 2026-08-30 : la section montre le dossier réel 2026-028 (Gagnon, droit
> de la famille), navigable sur cinq onglets. La liste des sept éléments et la
> phrase de clôture ne sont pas encore posées ; la note partagée et l'échéance
> non plus, le dossier illustré n'en portant aucune.

## 3. La facturation et la comptabilité

**Titre** — Le travail administratif alimente naturellement les finances.
**Texte** — Le temps et les débours consignés dans le dossier préparent la
facturation sans reconstruire le travail.

Lorsqu'une facture est émise ou qu'un paiement est reçu, SAFE maintient le lien
entre :

- le client ;
- le dossier ;
- le travail effectué ;
- la facture ;
- le paiement ;
- le journal comptable opérationnel.

**Clôture** — Vous consignez le travail dans son contexte. SAFE maintient la
continuité jusqu'à la facture et aux écritures opérationnelles correspondantes.

> ⚠ **Cette phrase de clôture n'est plus sur la page.** Retirée le 2026-08-30
> sur demande du CEO, en même temps que le lien « Voir la facturation » et que
> le bas de section du mouvement 2. Le document et la page divergent donc ici,
> et c'est une décision, pas un oubli. La phrase reste écrite ci-dessus : si le
> mouvement doit se conclure un jour, c'est par elle.

> **Interdiction absolue** : ne jamais écrire « comptabilité automatisée » ni
> « comptabilité entièrement automatisée ». Cette formulation laisserait croire
> que SAFE remplace le comptable ou produit une comptabilité complète. SAFE tient
> la comptabilité **opérationnelle et juridique** du cabinet, puis prépare
> l'information destinée au comptable.

## 4. La conformité

**Titre** — Des garde-fous là où la rigueur ne permet aucun raccourci.
**Texte** — SAFE soutient les obligations professionnelles du cabinet en
intégrant des contrôles aux opérations sensibles.

Trois capacités, en composition éditoriale et **jamais en trois cartes
génériques** :

- **Compare** — SAFE rapproche le relevé bancaire, le registre du fidéicommis et
  les soldes détenus pour chaque dossier.
- **Encadre** — SAFE signale ou bloque une opération lorsque les conditions
  requises ne sont pas réunies.
- **Garde la trace** — Les opérations, validations et corrections demeurent
  datées, attribuées et vérifiables.

**Clôture** — SAFE soutient la tenue, la vérification et la traçabilité requises
par les règles professionnelles applicables. Le jugement et la responsabilité
professionnelle demeurent ceux du cabinet.

**Bande de confiance**, immédiatement après la démonstration :

- conçu au Québec ;
- données hébergées au Canada ;
- contrôles d'accès selon les rôles ;
- registre de fidéicommis vérifiable ;
- pensé pour les règles professionnelles du Québec et de l'Ontario.

> Ce ne sont pas des badges décoratifs mais des **preuves factuelles**. Le ruban
> qui les portait a été retiré temporairement le 2026-08-29 ; son balisage est en
> commentaire dans `ExperienceCinema.tsx`, à reprendre ici.

## 5. La réalité

**Titre** — Conçu dans la réalité des cabinets d'ici.
**Texte** — SAFE est déjà utilisé dans deux cabinets. Un troisième déploiement
est en préparation.

Chaque implantation permet d'adapter le système :

- aux domaines de pratique ;
- à la structure des dossiers ;
- aux responsabilités de l'équipe ;
- aux parcours administratifs ;
- aux contrôles nécessaires.

**Clôture** — SAFE ne demande pas au cabinet d'adopter une structure générique.
Il est configuré autour de la manière dont le travail doit réellement circuler.

> ⚠ « Deux cabinets » et « un troisième en préparation » sont des affirmations
> chiffrées et publiques. À revalider avant mise en ligne.

## 6. La projection

**Titre** — Voyez votre cabinet fonctionner comme un seul système.
**Texte** — L'implantation commence par le fonctionnement réel du cabinet :

1. comprendre les pratiques et les responsabilités ;
2. structurer les dossiers et les parcours administratifs ;
3. relier la facturation, la comptabilité opérationnelle et les contrôles ;
4. valider le fonctionnement avec l'équipe ;
5. mettre SAFE en service.

**Actions** — Évaluer mon cabinet · Parler à quelqu'un →

---

## Règles qui gouvernent l'exécution

Elles ne viennent pas de ce document, elles s'y appliquent :

- **L'illustration ne précède jamais l'écran.** Si l'écran doit changer, il
  change d'abord et la vitrine le recopie ensuite.
- **Aucune donnée inventée.** Chaque valeur affichée est lue dans le cabinet de
  démonstration ou dérivée du code. Règle CEO du 2026-08-14.
- **Aucun texte en gras** dans le discours de la page. C'est l'encre qui
  distingue, jamais la graisse.
- **Pas de tiret long** en milieu de phrase.
- **Cycle de design** : proposition, image, validation, exécution. Aucun code de
  design sans une capture montrée et un oui explicite.
