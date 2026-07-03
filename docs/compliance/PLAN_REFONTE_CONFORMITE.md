# Plan de refonte de la conformité SAFE

> Statut : DRAFT, en attente validation CEO. Base : audit sourcé du 2026-07-02
> (docs/journal/2026-07-02_audit_conformite_source.md).

## Principe fondateur

La conformité de SAFE souffre de trois maux, dans cet ordre d'importance : un **socle de
sourcing troué et contradictoire**, un **moteur invisible** au cabinet, des **obligations
détectées mais pas imposées**. Le moteur lui-même est largement construit et solide. Ce plan
ne réécrit pas le moteur : il assainit le sol, rend la conformité visible et prouvée, puis
la rend contraignante, et enfin en fait un livrable qui verrouille.

## Règles de gouvernance (non négociables)

- **Rien affiché sans source primaire.** Chaque règle porte sa juridiction, sa source, son
  niveau de confiance. En dessous du seuil de confiance ou sans source, on n'affiche pas.
- **Province-aware partout.** Jamais une règle ontarienne à un cabinet québécois, et inversement.
- **Brancher avant de bâtir.** Le critère de « terminé » est : visible et actionnable à l'écran.
- **Flag éteint par défaut + parité testée.** La prod ne bouge qu'à activation explicite.
- **Migrations additives, Dérisier sanctuarisée.** Gate de déploiement : soldes fiducie
  négatifs Dérisier vérifiés, branche ON byte-identique.
- **Un ADR par phase avant la première ligne de code.**
- **Silence et langage avocat.** Pas de badge anxiogène, langage risque et argent, une action
  à la fois (doctrine TDAH/design).

---

## PHASE 0 — Le socle réglementaire (bloque tout le reste)

Objectif : une source unique de vérité, zéro contradiction, zéro lien mort, délais confirmés.
On ne construit rien de neuf sur des sources absentes.

- **0.1 Registre canonique des obligations.** Créer `docs/compliance/REGISTRE_OBLIGATIONS.md`
  (ou YAML) : une ligne par obligation, avec juridiction (QC/ON), énoncé, source primaire
  (article + URL), niveau de confiance (CONFIRMÉ/PARTIEL/INCERTAIN), date de vérification,
  et le mapping vers le code qui l'applique. `docs/accounting/RECHERCHE_COMPTA_SAFE_QC_ON.md`
  devient la source de référence ; les fiches KB d'avril passent au statut « brouillon obsolète ».
- **0.2 Trancher les 5 contradictions** (au profit du fact-check) : rétention QC 7 vs 10 ans,
  plafond espèces (interdiction vs plafond+déclaration), délai de dépôt (QC vs ON), intérêts
  fiducie (Fonds d'études juridiques B-1 r.10), cadence de rapprochement (mensuel, pas de paliers).
- **0.3 Combler ou retirer les 3 liens morts de l'INDEX KB** : Code de déontologie QC, Loi 25,
  règles LSO fiducie. Soit on crée la fiche sourcée, soit on retire du INDEX (ne pas prétendre
  couvrir ce qu'on n'a pas).
- **0.4 Questions à confirmer au Barreau/LSO** (action CEO, dépendance externe) : délai de
  rapprochement fiducie QC, contenu et délai du RAP, audit annuel CPA QC obligatoire ou non,
  régime FINTRAC propre aux avocats, mention TPS/TVQ obligatoire sur facture. Liste exacte
  à préparer.
- **0.5 Le registre consommé par le code.** Un module `lib/compliance/rules.ts` typé,
  province-aware, avec confiance : le code lit le registre, il ne code plus les règles en dur.
  Rien ne s'affiche si la confiance est insuffisante.

**Gate** : le CEO valide le registre et a confirmé (ou marqué INCERTAIN) les points Barreau
avant les Phases 3 et 4. Effort : 3 à 5 jours de travail + délai externe Barreau.

---

## PHASE 1 — Rendre le moteur visible au cabinet (fort impact, faible risque)

Objectif : le cabinet voit sa conformité continue, prouvée. Le moteur existe déjà (readiness
10 domaines, « jamais conforme sans preuve »), il est enfermé en console interne.

- **1.1 Exposer le readiness au cabinet** sur `/conformite`, en remplaçant le tableau allégé
  à 6 vérifs pour éviter deux scores divergents. Un seul score, evidence-based.
- **1.2 Détail derrière le score fiducie** : solde par dossier, écart du dernier rapprochement,
  prochaine échéance (province-aware, donc dépend de 0.4 pour le QC).
- **1.3 Page piste d'audit** `/conformite/audit` en lecture, filtrable (l'append-only existe).
- **1.4 Alerte des mois non certifiés** dans le générateur de rapport annuel
  (`missingOrUncertifiedMonths` est déjà calculé, jamais affiché).
- **1.5 UX « prêt pour inspection »** : état clair, langage avocat, une action à la fois,
  pas de badge rouge anxiogène.

**Flag** : `COMPLIANCE_DASHBOARD_V2`. Parité : tests que score et items reflètent les données
réelles. Effort : 1 à 2 semaines. Peut démarrer en parallèle de Phase 0 (sauf l'affichage des
délais QC, qui attend 0.4).

---

## PHASE 2 — Passer de détecté à imposé (application)

Objectif : les obligations ne sont plus optionnelles. Dépend du sourcing (Phase 0) pour ce qui
est réglementaire.

- **2.1 Fermeture de dossier** : brancher `closure-blockers` à l'écran et empêcher la fermeture
  en cas de blocage dur (fiducie négative, fonds à restituer, conflit non résolu). Vrai statut
  fermé, pas un simple soft delete.
- **2.2 Conflits** : rendre la vérification obligatoire à l'ouverture (gate d'intake) et
  bloquante à la clôture si non résolue.
- **2.3 Rétention** : rappel programmé + workflow de destruction à échéance, avec confirmation
  humaine, AuditLog et trace. Jamais de suppression automatique silencieuse (on propose, l'humain
  valide).
- **2.4 FINTRAC** : passer du flag booléen à la vérification liée au document (pièce attachée +
  date), seuil espèces, génération de la déclaration.
- **2.5 Mandats** : valider le contenu (clause requise, signature datée), pas seulement l'existence.

Effort : 2 à 3 semaines.

---

## PHASE 3 — Corriger les règles douteuses et durcir la sécurité (dépend de Phase 0)

- **3.1 Plafond espèces** : réaligner le code sur la règle confirmée (plafond de règlement
  7500 $/mandat + déclaration au Barreau sous 30 j, art. 71) plutôt qu'un simple blocage de dépôt,
  et ajouter le suivi de la déclaration 30 j si confirmé.
- **3.2 Délai de rapprochement QC** : brancher le vrai délai une fois confirmé (aujourd'hui
  inconnu du code).
- **3.3 Chiffrer les données sensibles** : NAS employé (stocké en clair), et pièces d'identité
  le cas échéant.
- **3.4 Étendre l'AuditLog** aux mutations manquantes (client, tarif, assignation) et remplir
  IP/UserAgent.

Effort : 1 à 2 semaines (dépend des confirmations 0.4).

---

## PHASE 4 — Le livrable qui verrouille (dossier d'inspection)

Objectif : transformer la conformité en verrou commercial et en arme de l'adjointe.

- **4.1 Dossier d'inspection exportable** (PDF ou paquet) : état de conformité daté, preuves,
  historique des rapprochements certifiés, registre fiducie, piste d'audit, province-aware,
  prêt à remettre à un inspecteur.
- **4.2 Artefact de persuasion** pour l'adjointe : avant/après, « vous êtes prêts pour l'inspection ».

Effort : 1 à 2 semaines.

---

## Séquencement et dépendances

- **Phase 0 bloque** les Phases 2, 3 et une partie de la 4.
- **Phase 1 démarre en parallèle** de la Phase 0 (branchement du moteur existant, indépendant du
  sourcing sauf l'affichage des délais QC).
- Ordre de valeur : **0 + 1 d'abord** (plus haut levier, plus faible risque, protège la
  crédibilité), puis 2, 3, 4.

Durée totale indicative : 6 à 9 semaines de développement plus le délai externe du Barreau.
Réaliste de livrer 0 + 1 avant J+90 (2026-09-04) ; 2 à 4 peuvent suivre.

## Première action proposée

Écrire l'ADR + la spec de la **Phase 0** (le registre d'obligations) et préparer la **liste
exacte des questions au Barreau**. C'est le point qui débloque tout et le seul avec une
dépendance externe à lancer tôt.
