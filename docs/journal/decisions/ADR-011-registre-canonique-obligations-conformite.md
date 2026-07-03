# ADR-011 — Registre canonique des obligations de conformité (source unique, consommée par le code)

- **Statut** : Proposé (en attente validation CEO)
- **Date** : 2026-07-02
- **Contexte** : audit de conformité sourcé `docs/journal/2026-07-02_audit_conformite_source.md`,
  Phase 0 du `docs/compliance/PLAN_REFONTE_CONFORMITE.md`.

## Contexte

L'audit du 2026-07-02 a établi que le principal risque de conformité de SAFE n'est pas un
manque de fonctionnalités, mais la **fragilité du sol réglementaire** :

- Trois fichiers de référence annoncés dans l'INDEX de la knowledge-base **n'existent pas**
  physiquement (Code de déontologie QC, Loi 25, règles LSO fiducie). Liens morts.
- Le dossier `~/Desktop/SAFE Inc./09 - Droit/` ne contient **aucun texte réglementaire**.
- Une seule source est fact-checkée sur textes primaires : `docs/accounting/RECHERCHE_COMPTA_SAFE_QC_ON.md`.
- Plusieurs fiches KB d'avril **contredisent** ce fact-check (rétention QC 7 vs 10 ans ;
  plafond espèces « interdit » vs « plafond/mandat + déclaration 30 j » ; délai de dépôt
  attribué au QC alors qu'il est ontarien ; intérêts fiducie mal nommés ; paliers de cadence
  non sourcés).
- Le code encode certaines règles **en dur** et parfois de façon douteuse : le plafond espèces
  est un blocage de dépôt ≥ 7500 $ (`lib/services/fideicommis/trust-transaction-service.ts:16,72`),
  alors que la source fact-checkée décrit un plafond de règlement par mandat avec déclaration.
  Le délai de rapprochement fiducie **QC est inconnu du code** (`lib/trust/regulator.ts:8-12`
  note que le J+25 est ontarien et non confirmé pour le QC).

Tant que les règles vivent, dispersées et contradictoires, dans des fiches KB, des constantes
de code et des docs concurrents, SAFE risque d'**afficher une obligation fausse à un avocat**.
C'est précisément le risque qui détruirait la crédibilité réglementaire, qui est le cœur du
positionnement « SAFE protège votre permis ».

## Décision

### 1. Un registre canonique unique, sourcé, versionné

Créer `docs/compliance/REGISTRE_OBLIGATIONS.md` (format tabulaire + éventuel miroir YAML) comme
**source unique de vérité réglementaire**. Chaque obligation porte : identifiant stable,
juridiction (`QC` / `ON` / `federal`), énoncé, source primaire (article + URL officielle),
niveau de confiance (`CONFIRME` / `PARTIEL` / `INCERTAIN`), date de vérification, et le mapping
vers le code qui l'applique.

Hiérarchie de confiance : source primaire fact-checkée > `RECHERCHE_COMPTA_SAFE_QC_ON.md` >
fiche KB citant un article précis > fiche KB générique. Les fiches KB d'avril passent au statut
« brouillon obsolète » et ne sont plus autorité.

### 2. Le code lit le registre, il ne code plus les règles en dur

Introduire `lib/compliance/rules.ts` : un module typé, province-aware, exposant les règles avec
leur confiance. Toute surface (dashboard conformité, calendrier de rapprochement, rétention,
plafonds) consomme ce module. Règle d'affichage : **rien n'est affiché à l'utilisateur si la
confiance est `INCERTAIN` ou si la source est absente**. Une règle `INCERTAIN` peut exister dans
le registre (pour suivi) mais ne produit aucune affichage ni aucun blocage réglementaire.

### 3. Trancher les contradictions au profit du fact-check

Les 5 contradictions identifiées sont résolues dans le registre au profit de
`RECHERCHE_COMPTA_SAFE_QC_ON.md`. Les entrées correspondantes sont marquées et datées.

### 4. Combler ou retirer les liens morts

Les trois fichiers absents de l'INDEX KB sont soit créés (fiche sourcée), soit **retirés de
l'INDEX**. On ne prétend pas couvrir ce qu'on n'a pas.

### 5. Marquer explicitement les zones à confirmer

Les points non sourçables en interne deviennent des questions formelles au Barreau/LSO
(`docs/compliance/QUESTIONS_BARREAU.md`). Tant qu'ils sont ouverts, ils restent `INCERTAIN`
dans le registre et ne pilotent aucun affichage ni blocage.

## Conséquences

- **Positif** : une seule source, auditable, diffable. Aucune règle affichée sans preuve.
  Base saine pour brancher la visibilité (Phase 1) et l'application (Phase 2) sans propager
  d'erreurs. Les corrections de règles douteuses (plafond espèces, délai QC) deviennent des
  changements de données dans le registre, pas des chasses au code en dur.
- **Coût** : 3 à 5 jours de mise en place + dépendance externe (réponses du Barreau) à lancer
  tôt. Un refactor progressif des règles aujourd'hui en dur vers `lib/compliance/rules.ts`,
  fait sous flag et parité testée.
- **Changement de comportement live** : possible sur le plafond espèces et le calendrier QC,
  une fois les règles corrigées. Traité comme décision explicite, pas glissé en silence,
  et gaté par la validation CEO + confirmation Barreau (Phases 3).

## Alternatives écartées

- **Statu quo (règles en dur + fiches KB)** : perpétue le risque d'affichage faux et la
  divergence des sources. Écarté.
- **Un seul gros document prose** : non diffable, non consommable par le code, redevient vite
  incohérent. Écarté au profit d'un registre structuré consommé par `lib/compliance/rules.ts`.
