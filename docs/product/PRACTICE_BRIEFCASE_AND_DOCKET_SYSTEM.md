# Cartables intelligents et cahiers par pratique

## Objectif V1

SAFE doit passer d'un cartable principalement statique a un dossier documentaire capable de proposer une structure utile selon la pratique. La V1 cible cinq pratiques prioritaires:

- droit de la famille
- TUF / protection, traité dans SAFE comme une variante de dossier famille ou civil selon la configuration disponible
- criminel
- immigration
- immobilier

Le principe produit est simple: un document importé doit pouvoir être rattaché à une section de cartable, puis, lorsqu'il est significatif, alimenter un cahier adapté à la pratique.

## Trois modes de cahier

| Pratique | Mode de cahier | Rôle |
| --- | --- | --- |
| Famille | `procedure` | Suivre demandes, requêtes, ordonnances, jugements et pièces structurantes. |
| TUF / protection | `procedure` | Suivre procédures de protection, évaluations, audiences et ordonnances. |
| Criminel | `procedure` | Suivre divulgation, comparutions, requêtes, engagements et décisions. |
| Immigration | `suivi` | Suivre formulaires, soumissions, lettres IRCC/MIFI, biométrie, demandes additionnelles et décisions. |
| Immobilier | `transaction` | Suivre offre, financement, recherche de titres, clôture, ajustements et quittance. |

## Relation document -> section -> cahier

Un import produit maintenant deux niveaux de renseignement:

1. **Placement documentaire**: section cible du cartable, sous-type suggéré, niveau de confiance, revue humaine requise ou non.
2. **Entrée de cahier**: créée seulement pour les documents qui ont une valeur de suivi réelle.

Exemples:

- `Ordonnance de sauvegarde.pdf` dans un dossier famille -> section `jugements`, cahier `procedure`.
- `Divulgation DPCP volume 1.pdf` dans un dossier criminel -> section `divulgation`, cahier `procedure`.
- `Lettre IRCC - demande de documents additionnels.pdf` -> section `correspondance`, cahier `suivi`.
- `Engagement hypothécaire.pdf` -> section `financement-hypotheque`, cahier `transaction`.

## Revue humaine

La classification reste une suggestion. Les imports confirmés par un utilisateur sont marqués comme revus. Une suggestion à faible confiance ou non classable reste visible comme nécessitant une revue.

La V1 ne déplace pas automatiquement les documents entre dossiers sans validation humaine.

## Cartables V1

Les templates existants restent la base. La V1 les renforce surtout pour:

- immigration: soumissions et décisions deviennent des sections distinctes;
- immobilier: offre/convention, financement, recherche de titres, documents de clôture et débours/ajustements deviennent des sections plus métier;
- TUF / protection: profil documentaire dédié lorsqu'un sous-type du dossier permet de le reconnaître.

## Limites volontaires

- Pas de moteur IA autonome qui applique tout sans validation.
- Pas de migration des dossiers historiques vers les nouvelles sections.
- Pas de numérotation automatique complète des pièces P- / D- en V1.
- Pas encore de timeline procédurale reliée aux échéances LexTrack.
- Les cahiers sont alimentés par les imports et documents rédigés significatifs, puis affichés dans le dossier.

## Prochaine étape logique

Après la V1, les améliorations les plus utiles seront:

- validation/correction manuelle des entrées de cahier;
- numérotation des pièces par pratique;
- lien explicite cahier -> échéance / tâche;
- génération automatique d'un cahier PDF;
- enrichissement IA par pratique avec extraction des dates et parties.
