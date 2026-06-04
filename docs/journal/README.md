# Journal de build SAFE Inc.

Trace brute du build de SAFE, au jour le jour. Sert à 3 choses :

1. **Case study cliente** — accumuler la matière chiffrée pour le témoignage J+90.
2. **Contenu LinkedIn** — alimenter la content-bank sans effort supplémentaire.
3. **Mémoire produit** — savoir pourquoi telle décision a été prise dans 6 mois.

## Structure

```
docs/journal/
├── README.md                         (ce fichier)
├── TEMPLATE.md                       (template d'entrée journalière)
├── 2026/
│   └── 06-juin/
│       └── 2026-06-04-build-log.md
├── captures/                         (screenshots, vidéos, Loom)
├── citations-cliente/                (1 fichier par mois, ex: 2026-06.md)
├── metriques/                        (baselines, 1 fichier par mois)
├── decisions/                        (ADR — Architecture Decision Records)
└── content-bank/
    ├── idees-posts.md                (backlog de graines de posts)
    └── posts-publies.md              (archive de ce qui est sorti)
```

## Rituels

- **Quotidien (10 min, fin de journée)** : remplir le journal du jour.
- **Hebdomadaire (45 min, vendredi PM)** : relire la semaine, sortir 2 idées de posts.
- **Mensuel (2h, dernier vendredi du mois)** : synthèse mensuelle + update case study.
- **Trimestriel (1/2 journée)** : revue stratégique.

## Règle d'or

Format > style. Trace brute > rédaction propre. C'est un journal, pas une vitrine.
Ce qui n'est pas tracé ici **n'existe pas** côté case study et contenu.

## Règles de confidentialité

- Jamais de nom de client final du cabinet (secret professionnel de l'avocat).
- Jamais de détail de dossier juridique identifiable.
- Anonymiser les citations cliente si publication envisagée.
- Aucune clé API, mot de passe, ou donnée perso dans le journal.
