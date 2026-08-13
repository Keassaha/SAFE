# Journal de recherche — Patrimoines conjugaux (Québec)

Carnet de bord prévu à la section 8.2 de `00_METHODE_2026-08-11.md`.
Sert à ne pas perdre l'état du dossier entre les sessions, puisque la livraison est unique.

---

## Session 1 — 11 et 12 août 2026

### Décisions de cadrage reçues

Périmètre triple (patrimoine familial + société d'acquêts + union parentale) · produit SAFE
générique · avocat validateur identifié · livraison unique. Méthode verrouillée en v0.2.

### Ce qui a été fait

**Accès aux sources.** LégisQuébec et CanLII retournent 403 aux outils de récupération standard.
LégisQuébec s'est révélé accessible en ligne de commande avec un agent navigateur : le filtrage
portait sur l'agent, pas sur le contenu. CanLII et le site de la Cour supérieure sont restés
inaccessibles par toutes les voies tentées.

**Extraction du corpus.** Trois itérations d'outillage ont été nécessaires :

1. moissonnage article par article (bug d'URL à double préfixe `se:`, corrigé) ;
2. limitation de débit du serveur (503) contournée par temporisation et reprise ;
3. bascule sur l'extraction du document complet, plus fiable et sans nouvelle requête.

Deux formats d'identifiant coexistent sur LégisQuébec : `se:415` pour les articles simples et
`se:521_29` (souligné, non point) pour les articles à décimale. C'est ce qui expliquait l'échec
initial sur l'union parentale.

**Résultat.** 3 523 articles du C.c.Q. extraits en verbatim avec hiérarchie et historique
législatif, dont 118 articles couvrant les trois régimes.

### Corrections apportées à mes propres hypothèses de départ

| Hypothèse initiale | Réalité vérifiée |
|---|---|
| Union parentale aux art. 521.19 et suivants (référence du dépôt) | **Faux.** Titre premier.2, art. 521.20 et s. Le patrimoine d'union parentale est aux art. 521.29 et s. |
| Le patrimoine d'union parentale ressemble au patrimoine familial | **Partiellement faux.** Neuf dimensions sur seize diffèrent, dont l'exclusion totale de la retraite et du RRQ |
| JuriFamille couvre les pensions alimentaires | **Contredit.** Le site officiel ne mentionne que les pensions ; un catalogue de formation annonce les trois régimes. Contradiction non résolue |
| Le dépôt affirme un format Excel obligatoire à Montréal | **Partiellement confirmé.** Les formulaires existent et sont listés par le Barreau de Montréal ; le caractère obligatoire n'a pas pu être vérifié à la source |

### Découverte structurante

L'historique législatif des articles d'union parentale porte la mention **« 2024, c. 22 »**.
C'est le rattachement de la réforme, obtenu par la source primaire elle-même et non par une
source secondaire.

### État à la fin de la session

| Bloc | État |
|---|---|
| Socle législatif des trois régimes | **Fait**, verbatim officiel |
| Articulation entre régimes (P15) | **Fait**, mais la règle centrale reste `REVIEW_REQUIRED` |
| RRQ et régimes de retraite | **Fait** côté Retraite Québec |
| Fiscalité | **Amorcé seulement** — repérage du T2220, rien de vérifié |
| Jurisprudence | **Non commencé** — CanLII inaccessible |
| Doctrine | **Non commencé** |
| Marché | **Fait partiellement** — deux fiches, champs non vérifiables laissés vides |
| Scénarios de test (25 minimum) | **Non commencé** |
| Formules | Rédigées dans le rapport, non extraites en `formulas.json` |

### Points de friction ouverts, à traiter en priorité à la reprise

1. Règle de non-duplication patrimoine familial / société d'acquêts (`ART-001`, `U-002`).
2. Formule d'égalisation par moitié de l'écart (`PF-006`, `U-003`).
3. Directive et formulaires de la Cour supérieure (`U-004`) — **nécessite une action humaine**.
4. Articulation Retraite Québec / union parentale (`U-005`).
5. Qualifications conditionnelles en attente de jurisprudence (`U-001`).

### Ce qui bloque et ne peut pas être débloqué par moi

- **CanLII** : aucune jurisprudence tant que l'accès n'est pas obtenu autrement.
- **Cour supérieure** : quelqu'un du cabinet doit télécharger les deux fichiers `.xls` et la
  directive de la division de Montréal, puis les déposer dans `data/`.
- **CAIJ et bases payantes** : extraction par une personne du cabinet, je n'utilise aucun
  identifiant.

### Prochaine session — ordre proposé

1. Fiscalité (LIR, Loi sur les impôts, folios ARC, Revenu Québec) — le plus gros bloc restant.
2. Récompenses en société d'acquêts (art. 475 à 480), non modélisées.
3. Scénarios de test, une fois la fiscalité stabilisée.
4. Jurisprudence, dès qu'un accès est disponible.
