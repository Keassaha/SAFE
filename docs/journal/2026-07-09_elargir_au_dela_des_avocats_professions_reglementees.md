# 2026-07-09 — Élargir SAFE au-delà des avocats : la bonne généralisation

## Question CEO

Est-ce que SAFE peut servir plusieurs causes et plusieurs personnes, pas
seulement les avocats, en particulier les travailleurs autonomes ? Dresser une
liste des professions / cas d'usage qui ont besoin d'un système pensé pour eux.

## Observation / analyse

Techniquement oui, le moteur comptable est déjà en grande partie agnostique au
métier. Mais l'avantage défendable ne se transfère pas partout.

- **Piège** : viser le travailleur autonome générique (graphiste, rédacteur,
  consultant solo) = océan rouge (Wave, QuickBooks Self-Employed, banques). Le
  différenciateur SAFE disparaît là. Ces gens veulent du simple et pas cher, pas
  de la conformité.
- **Actif réellement transférable** : ce que SAFE résout de dur, c'est la
  comptabilité en fidéicommis + conformité à un ordre professionnel (argent des
  tiers, rapprochements imposés, inspection, garde-fous durs). Peu de monde le
  fait bien, c'est douloureux et obligatoire.
- **Bonne généralisation** : pas « tous les autonomes », mais « les
  professionnels réglementés qui détiennent l'argent des autres et répondent à un
  ordre ». On réutilise la partie la plus chère à construire.

## Liste par distance au moteur actuel

**Tier 1 — réutilise directement le fidéicommis**
- Notaires (Chambre des notaires) — volume fidéicommis souvent supérieur aux
  avocats (immobilier, successions). Successeur naturel.
- Courtiers immobiliers (OACIQ) — dépôts en fidéicommis, rapprochements imposés.
- Huissiers de justice (Chambre des huissiers).
- Syndics / conseillers en insolvabilité (BSF) — fonds des débiteurs.
- Agences de recouvrement (OPC).

**Tier 2 — ordre professionnel + facturation, moins de fidéicommis**
- Teneurs de livres / comptables indépendants, courtiers hypothécaires et
  d'assurance.

**Tier 3 — à éviter pour l'instant (pas de fossé)**
- Entrepreneurs construction (RBQ), santé en pratique privée, consultants.

## Recommandation

- Successeur naturel = **notaires**, puis **courtiers immobiliers**. Même douleur,
  même moteur, on change le vocabulaire de l'ordre.
- **Pas maintenant** : préchauffage jusqu'au 2026-09-04, priorité = sur-livrer la
  cliente avocate + sortir les chiffres fondateurs. Élargir le persona
  aujourd'hui dilue la profondeur qui fait la première preuve.
- Condition d'industrialisation : rendre les règles d'ordre (fidéicommis, délais
  de rapprochement, obligations) **configurables, pas codées en dur**. Si le
  moteur lit un profil d'ordre au lieu de « Barreau » en dur, servir les notaires
  devient un fichier de config, pas un chantier. Cohérent avec la doctrine
  « audit vers config ».

## Statut

Feuille de route post-preuve. Aucune action de build engagée. À revisiter après
les premiers chiffres fondateurs.
