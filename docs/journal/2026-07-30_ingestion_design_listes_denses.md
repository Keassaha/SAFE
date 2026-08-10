# 2026-07-30 — Mobbin écarté pour l'instant, ingestion design par navigateur

## Décidé

- **Ne pas prendre Mobbin maintenant.** Le MCP officiel existe (600k+ écrans) mais
  **l'accès MCP est réservé aux plans payants** (~10 $/mois). Le plan gratuit ne l'ouvre pas.
- **Ne pas installer le MCP Mobbin non officiel** trouvé sur GitHub : il exige les
  identifiants de session Mobbin, scrape le site au nom de l'utilisateur et enfreint
  probablement les conditions d'utilisation. Profil de risque refusé.
- **Un MCP n'enrichit pas les connaissances du modèle.** Il donne un accès de recherche
  par session, rien ne persiste. La mémoire du projet, c'est `docs/design/DESIGN_HUMAIN.md`.
  Toute source doit y atterrir pour compter.
- **Le format d'ingestion s'élargit aux interfaces existantes**, pas seulement aux vidéos,
  avec une règle de méthode : distinguer ce qui est **mesuré** (CSS calculé sur une app live)
  de ce qui est **observé** (capture produit officielle, donc retouchée).

## Fait

Première ingestion sans Mobbin, sur la **liste dense** (équivalent des vues Dossiers,
Clients, Factures, Employés de SAFE) :

- **Linear** — vue Triage, page d'équipe, menu contextuel. Captures produit officielles
  ouvertes en pleine résolution. Décisions de composition relevées, aucune mesure.
- **shadcn/ui Tasks** — interface live, valeurs relevées via CSS calculé (hauteur de ligne,
  graisses, opacité des filets, largeurs de colonnes, comportement de survol).

Sortie : [docs/design/sources/2026-07-30_listes-denses-linear-shadcn.md](../design/sources/2026-07-30_listes-denses-linear-shadcn.md)

12 règles ajoutées à DESIGN_HUMAIN.md (L3, L4, E2, T2, C2, P3, P4, P5, MO1, A13, A14, A15),
E1 renforcée 🟡→🟢, §8 Motion n'est plus vide, 1 conflit arbitré en §11.

## Observé

- Les sites marketing modernes (Linear, Attio) sont trop animés au scroll pour être lus.
  **Contournement efficace : ouvrir directement l'URL de l'image produit** en pleine
  résolution, ou mesurer une app live via le CSS calculé.
- Le centre d'aide de Clio exige une connexion : la comparaison directe avec les logiciels
  de gestion de cabinet (Clio, MyCase, PracticePanther) reste à faire par un autre chemin.
- Aucune des sources consultées ne montrait d'**état vide, de chargement ou d'erreur**.
  Trou identifié dans la base, à combler à la prochaine ingestion.

## Suite possible

- Prochaine cible d'ingestion : les états vide / chargement / erreur, et la vue détail.
- Benchmark des logiciels de cabinet (Clio et concurrents) par une source publique.
- Réévaluer Mobbin si le rythme d'ingestion justifie les 10 $/mois.
