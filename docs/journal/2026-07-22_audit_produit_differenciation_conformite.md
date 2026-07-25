# Audit produit SAFE et plan de différenciation

**Date** : 2026-07-22
**Contexte** : audit de l'état réel du code confronté aux angles stratégiques définis en conversation (la vraie force de SAFE, comment se différencier sur le fond tout en faisant aussi bien que la concurrence).
**Méthode** : quatre explorations parallèles du code (moteur de conformité, comptabilité/fidéicommis, IA/capture passive, modules table stakes). Tout est sourcé par fichier.

---

## Résumé en une page

SAFE est plus avancé que ce que le CEO croit sur ses différenciateurs, et plus fragile que prévu sur deux points qui peuvent tout gâcher.

**La bonne nouvelle** : le moat (conformité + système qui fait le travail) est en grande partie **déjà bâti**. Le moteur de readiness 14 domaines fonctionne, quatre garde-fous durs sont réellement bloquants, l'import intelligent Interac est complet de bout en bout, le résumé de dossier IA et la classification de documents existent.

**Le problème** : ce moat est soit **invisible**, soit **éteint**.
1. **La clé API Anthropic manque en production.** Tout le pan « système qui fait le travail » (import Interac, résumé de dossier, classification) est **inactif en prod**. Le différenciateur numéro un est débranché.
2. **Le moteur de conformité est invisible au cabinet.** Il tourne, il calcule, mais seul un admin qui va dans `/parametres` le voit. Le cabinet ne voit jamais son score.
3. **L'agenda est un squelette.** Backend présent, aucune interface calendrier. C'est le seul trou de table stakes qui peut faire éliminer SAFE avant la démo.
4. **Le dossier d'inspection n'existe pas.** C'est pourtant la feature signature qui incarnerait « SAFE protège votre avenir ».

La différenciation ne demande pas d'inventer. Elle demande de **rendre visible et de rebrancher** ce qui est déjà là, puis de fermer un trou table stakes.

---

## Angle 1 — La conformité comme moteur (le moat)

### Ce qui existe (solide)

- **Moteur de readiness 14 domaines**, `lib/admin/readiness/engine.ts`. Doctrine « jamais conforme sans preuve » (`enforceEvidenceRule`) : un domaine n'est `complete` que si tous les checks passent avec une preuve non nulle. Aucun bypass. Score 0-100.
- **Quatre garde-fous durs réellement bloquants** :
  - Solde fidéicommis négatif : bloque la fermeture de dossier et la certification (`closure-blockers.ts`, `reconciliation-service.ts:135`).
  - Plafond espèces 7 500 $ : bloque le dépôt (`trust-transaction-service.ts:72`).
  - Numérotation de factures sans trou : séquençage atomique `pg_advisory_xact_lock` (`numero-facture.ts:40`).
  - Certification du rapport annuel LSO : bloquée tant que les 12 rapprochements mensuels ne sont pas certifiés (`lso-report-service.ts:288`).
- **Registre réglementaire canonique** : 50+ règles codifiées, province-aware (QC/ON/FED), avec niveau de confiance (CONFIRME/PARTIEL/INCERTAIN) et source primaire par règle (`lib/compliance/rules.ts`, `docs/compliance/REGISTRE_OBLIGATIONS.md`). Politique saine : rien d'INCERTAIN n'est affiché.

### Ce qui est partiel ou cassé

- **Invisibilité au cabinet** : le readiness n'est affiché que dans `/parametres` (admin). La page `/conformite` montre un **autre** score, calculé différemment (6 vérifications, `app/api/conformite/route.ts`). **Deux scores de conformité divergents** vivent dans le produit. ADR-011 propose de fusionner et de n'exposer que le readiness. Non fait.
- **Flag `COMPLIANCE_RULES_ENABLED` éteint en prod** : les obligations réglementaires ne sont affichées à personne.
- **8 questions au Barreau en suspens** (INCERTAIN) : RAP, audit CPA annuel, conflits d'intérêts, Loi 25, régime FINTRAC avocats, périmètre exact du plafond espèces. Bloque la Phase 0 du plan de refonte.

### Ce qui manque

- **Le dossier d'inspection en un clic n'existe pas.** Aucun export « prêt pour l'inspection » (PDF ou paquet daté avec preuves, historique de rapprochements, piste d'audit). C'est la Phase 4 du plan, jamais commencée.
- Garde-fous secondaires non imposés : déclaration au Barreau des espèces sous 30 jours, vérification FINTRAC bloquante, vérification de conflits bloquante à l'ouverture, destruction programmée à échéance de rétention.

### Actions de différenciation (par ordre)

1. **Rendre le readiness visible au cabinet.** Une page `/conformite` qui montre les 14 domaines en vert/jaune/rouge, avec le détail derrière le score fiducie (solde par dossier, écart, prochaine échéance). C'est votre meilleure preuve visuelle de vente et ça active un moteur déjà bâti. Flag `COMPLIANCE_DASHBOARD_V2`.
2. **Fusionner les deux scores** en un seul (le readiness), pour tuer la confusion.
3. **Construire le dossier d'inspection exportable.** C'est la feature qu'aucun concurrent local ne fait et qui incarne « SAFE protège votre avenir ». À faire une fois le readiness visible.
4. **Trancher les 8 questions Barreau** (action CEO, débloque la Phase 0 et l'imposition des garde-fous secondaires).

---

## Angle 2 — Le système qui fait le travail (copilote du copilote)

### Ce qui existe (c'est le joyau caché)

- **Import intelligent de preuve de paiement Interac, complet L1 à L5** : extraction par vision Claude (`extract-payment-proof.ts`), matching déterministe email + montant + nom + n° dossier (`match-payment.ts`), règles de payeur tiers qui s'apprennent (`payer-rules.ts`), anti-doublon SHA-256, stockage de la preuve, classement automatique dans le dossier client. Fonctionnel.
- **Import intelligent de reçu de dépense** : même moteur vision, catégorisation apprenante (`extract-expense-receipt.ts`, `categorization-rules.ts`).
- **Résumé de dossier IA** : factuel, garde-fous « pas de conseil juridique, pas d'invention » (`summarize-dossier.ts`).
- **Classification de documents à l'upload** : proposition de dossier + type, confiance affichée, validation humaine obligatoire (`classify-document.ts`).
- **Doctrine saine** : l'IA lit, des règles déterministes suggèrent, l'humain confirme. Jamais d'auto-save. Conforme à l'exigence de révision humaine du Barreau.

### Ce qui est cassé (critique)

- **`ANTHROPIC_API_KEY` absente de la production.** Présente en `.env.local`, absente en prod. Chaque fonction IA fait un fallback gracieux vers `null`, donc pas de crash, mais **tout le différenciateur est silencieusement éteint en production**. Un cabinet en prod n'a aucune de ces capacités.

### Ce qui manque (roadmap)

- **Capture passive par email (OAuth)** : spec écrite (`SPEC_IMPORT_PREUVE_PAIEMENT.md` §50), zéro code. C'est le passage de « l'adjointe upload la preuve » à « la preuve arrive toute seule ».
- **Event bus** : absent. Seul le webhook Stripe existe.
- **Impersonation** : modèle Prisma présent, zéro code opérationnel (stub).

### Actions de différenciation (par ordre)

1. **Poser `ANTHROPIC_API_KEY` en production via Vercel.** Coût : cinq minutes. Impact : rebranche l'intégralité de votre différenciateur « système qui fait le travail ». C'est le geste au meilleur ratio de tout cet audit.
2. **Mettre en avant l'import intelligent dans la démo et la vente.** C'est fonctionnel et personne d'autre ne le fait aussi simplement. Preuve visuelle immédiate.
3. **Planifier la capture par email (OAuth)** comme prochain grand pas, une fois la clé en prod et l'import mis en avant.

---

## Angle 3 — La profondeur verticale Québec

### État

- Registre réglementaire **province-aware** (QC/ON/FED), locale FR/EN, sévérité des alertes de rapprochement adaptée par province (ON j+25 critique, QC pas de délai chiffré).
- Règles fidéicommis, plafond espèces, rétention, taxes TPS/TVQ codées avec sources primaires.
- C'est une profondeur qu'un généraliste américain ne peut pas atteindre sans exploser ses coûts. C'est structurellement défendable.

### Action

- Continuer à traiter chaque profession réglementée ajoutée (notaires, puis SAFE autonome) comme une réutilisation du même moteur. Ne pas diluer en horizontal tant que la verticale avocat QC n'est pas parfaitement servie.

---

## Angle 4 — Les table stakes (faire aussi bien)

| Module | État | Verdict |
|---|---|---|
| Facturation | **MATURE** | Prêt. Sources multiples unifiées, taxes province-aware, mode mixte. |
| Dossiers | **MATURE** | Prêt. Co-clients/parties, numérotation flexible. |
| Clients | **MATURE** | Prêt. Détection de doublons, enchaînement vers dossier. |
| Saisie de temps | **MATURE** | Prêt. Taux auto-rempli, intégration facturation. |
| Forfaits | **MATURE** | Prêt. Registre des tâches, ajustements. |
| Documents | **PARTIEL** | Édition et versioning OK, mais classification absente de l'UI, pas d'export/publication. |
| **Agenda / calendrier** | **SQUELETTE** | Backend présent (`CalendarEvent`, actions CRUD), **aucune interface calendrier visuelle**. |

### Action de différenciation

- **L'agenda est le trou de table stakes le plus dangereux.** Un cabinet vérifie « est-ce que je vois mon calendrier » en trois secondes. Aujourd'hui, non. Le backend existe déjà, donc c'est surtout un chantier d'interface. À ramener au niveau « assez bon » vite, sans sur-ingénierie, pour ne pas se faire éliminer avant même de parler du moat.
- Documents : exposer la classification (déjà codée) dans l'UI et une vue d'historique de versions. Chantier plus léger.

---

## Synthèse : où mettre l'énergie

**La thèse tient : SAFE ne gagne pas en faisant mieux la même chose, il gagne en faisant une chose différente (protéger et faire le travail) assez bien pour rendre l'outil concurrent inutile.** L'audit confirme que cette chose différente est en grande partie déjà bâtie. Le travail n'est pas d'inventer, c'est de rebrancher, rendre visible, et fermer un trou.

Ordre recommandé :

1. **`ANTHROPIC_API_KEY` en prod.** Cinq minutes, rebranche tout le pan IA. Le geste au meilleur ratio.
2. **Agenda au niveau « assez bon ».** Ferme le seul trou table stakes éliminatoire.
3. **Readiness visible au cabinet + fusion des deux scores.** Active le moat déjà bâti et en fait une preuve de vente.
4. **Dossier d'inspection en un clic.** La feature signature qui n'existe nulle part ailleurs.
5. **Trancher les 8 questions Barreau.** Débloque l'imposition des garde-fous secondaires (action CEO).

Le reste (capture email OAuth, impersonation, event bus) est de la roadmap de fond, pas de l'urgence.

---

## Sources code (échantillon)

- Readiness : `lib/admin/readiness/engine.ts`, `lib/admin/readiness/types.ts`
- Garde-fous : `lib/services/dossiers/closure-blockers.ts`, `lib/services/fideicommis/trust-transaction-service.ts:72`, `lib/facturation/numero-facture.ts:40`, `lib/services/fideicommis/lso-report-service.ts:288`
- Registre règles : `lib/compliance/rules.ts`, `docs/compliance/REGISTRE_OBLIGATIONS.md`, `docs/compliance/PLAN_REFONTE_CONFORMITE.md`
- Deux scores divergents : `app/api/conformite/route.ts` vs `app/(app)/parametres/page.tsx`
- IA / import : `lib/ai/extract-payment-proof.ts`, `lib/ai/summarize-dossier.ts`, `lib/ai/classify-document.ts`, `lib/services/finance/match-payment.ts`, `lib/services/finance/payer-rules.ts`
- Clé API prod manquante : `.env.local` (présente) vs `.env.production.local` (absente)
- Table stakes : `app/(app)/facturation/`, `app/(app)/dossiers/`, `app/(app)/clients/`, `app/(app)/temps/`, `app/(app)/edition/`, agenda dans `app/(app)/gestion/lextrack/` sans UI calendrier
