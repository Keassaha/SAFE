# 2026-05-07 — SAFE Time Recovery (plan journalier consolidé)

> Remplace `2026-05-07-time-recovery-engine.md` (plan partiel V1).
> Ce plan applique le brief enrichi : modes de facturation, qualité des suggestions, décision sur la couche `Activity`, division par agents.

## Outil courant

SAFE Time Recovery (premier outil de SAFE v1).

## Objectif du jour

Aujourd'hui : **planification + spec + recherche.**
Aucun code n'est écrit aujourd'hui. Le livrable est :

1. spec V2 mise à jour ([`specs/time-recovery-engine.md`](../specs/time-recovery-engine.md))
2. ce plan journalier
3. le prompt exact pour le prochain batch (plus petit slice de code utile)

## Résultat de la recherche (synthèse)

### Smokeball AutoTime et logiciels juridiques

- AutoTime (Smokeball) capture passivement l'activité de l'avocat (apps utilisées, documents ouverts, durée) et la propose en bloc en fin de journée comme entrées de temps facturables. Le pattern est : capture → groupement par dossier → revue humaine → facturation.
- Clio, MyCase, PracticePanther exposent des timers manuels couplés à des suggestions automatiques (entrée de calendrier, email envoyé, document modifié → "veux-tu créer une entrée de temps ?").
- Tous insistent sur **revue humaine obligatoire**. Aucun outil sérieux ne facture automatiquement.

### Time tracking automatique pour dossiers horaires

- valeur évidente : revenu directement perdu si non capturé (5–15% du chiffre d'affaires selon les études de Thomson Reuters et Clio Legal Trends).
- la suggestion devient une entrée facturable après approbation.

### Time tracking automatique pour dossiers forfaitaires / contingent / retainer

- la valeur **n'est pas la facture**, c'est la connaissance :
  - rentabilité par dossier (effort réel vs prix forfait),
  - prix futur des mandats similaires (pricing data),
  - détection scope creep (dérive du périmètre demandé),
  - identification des travaux additionnels (qui pourraient justifier un avenant),
  - charge réelle de l'avocat (capacity planning).
- piège : si l'outil traite forfait comme horaire, il propose à tort de facturer le client. Risque produit majeur.

### Gmail / Outlook ingestion — patterns prudents

- metadata-first (from / to / subject / date) avant le contenu complet.
- OAuth scoped au minimum (read-only, scopes les plus étroits possibles).
- BCC / forwarding comme alternative légère pour les cabinets sceptiques.
- consentement utilisateur explicite, opt-in, révocable.
- minimisation des données stockées (ne pas conserver le corps complet sauf permission).
- audit trail complet (qui a importé quoi, quand).
- multi-tenant : isolation stricte par `cabinetId`, jamais d'agrégation cross-cabinet.

### Risques pour un SaaS juridique

- confidentialité (privilège avocat-client, secret professionnel).
- multi-tenant safety (un email d'un cabinet jamais visible d'un autre).
- permissions (assistante peut voir mais pas approuver une facture).
- stockage de contenu email (risque réglementaire et compliance Barreau Québec).
- erreurs de rattachement (un email rattaché au mauvais dossier = facturation erronée).
- actions automatiques non approuvées (envoi de message, création de facture).

### Risques produit du time tracking automatique

- fausses suggestions → l'avocat passe son temps à corriger l'outil.
- pages ouvertes sans travail réel → bruit pur.
- surcharge de correction → fatigue de revue → abandon.
- perte de confiance → l'outil est désinstallé.
- rejet par l'avocat dès la première semaine si trop de bruit.

### Implications pour SAFE V1

1. Ne pas importer Gmail / Outlook en V1. Aucun signal externe, aucun OAuth, aucun BCC. La V1 se limite aux signaux **internes** déjà présents dans SAFE.
2. Préférer drastiquement la précision sur le rappel : moins de candidates, mieux ciblées.
3. Toujours respecter `Dossier.modeFacturation`. Ne pas confondre "récupérer du temps" et "facturer le client".
4. Une seule source de signal en V1 : `WorkSession` orpheline. Très haut signal/bruit, déjà rattachée tenant + dossier + client + user.

## Carte des modèles SAFE existants (résumé)

Tenant / identité :

- `Cabinet`, `User` (avec `defaultHourlyRate`, `role`), `Employee`.

Clients & dossiers :

- `Client` (cabinetId, lawyerInChargeId).
- `Dossier` (cabinetId, clientId) — **possède déjà `modeFacturation` (`horaire | forfait | retainer | contingent`) et `tauxHoraire`**.

Temps & travail :

- `TimeEntry` (cabinetId, dossierId, clientId, userId) — modèle canonique facturable, avec `billingStatus`, `statut`, `approvedById`, `approvedAt`.
- `WorkSession` (cabinetId, userId, dossierId, clientId, richDocumentId optionnel) — timer avec `startedAt`, `endedAt`, `dureeMinutes`, `statut: en_cours | pause | termine`. **Crée déjà une TimeEntry à la clôture** via `app/api/edition/documents/[id]/terminer/route.ts`.

Facturation :

- `Invoice`, `InvoiceLine`, `InvoiceItem`, `Expense`, `DeboursDossier`, `DossierBillingStage`, `RegistreTache`, `ForfaitService`.

Documents :

- `Document`, `RichDocument`, `RichDocumentVersion`.

Notes / tâches / événements / correspondance :

- `DossierNote`, `DossierTache`, `DossierActe`.
- `CalendarEvent`, `DossierEvenement`, `DossierReminder`.
- `DossierCorrespondence`, `NotificationLog`.

Audit :

- `AuditLog` (oldValues / newValues JSON, par entité).

**Aucun modèle existant ne stocke des candidates de récupération avec un cycle `new → reviewed → approved → dismissed → converted`.**
**Aucune table physique `Activity` unifiée.**

## État du support des modes de facturation

| Élément | Présent dans le schéma ? |
| --- | --- |
| Mode de facturation par dossier | ✅ `Dossier.modeFacturation` |
| Type d'honoraires (horaire / forfait / contingent / retainer) | ✅ enum `ModeFacturationDossier` |
| Taux horaire dossier | ✅ `Dossier.tauxHoraire` |
| Taux horaire utilisateur | ✅ `User.defaultHourlyRate` |
| Montant forfaitaire | ⚠️ partiel : `RegistreTache.montantBase`, `ForfaitService.montant`, mais pas un champ unique `flatFee` sur `Dossier`. |
| Règles de facturation | ⚠️ partiel : `RegistreTache`, `DossierBillingStage`, `Dossier.modeFacturation` |
| Modèle de facture / ligne facturable | ✅ `Invoice`, `InvoiceLine`, `InvoiceItem` |

Conclusion : **aucune migration de mode de facturation n'est nécessaire pour V1**. Le moteur Time Recovery lit `Dossier.modeFacturation` et applique la bonne stratégie. Mode `mixed` reporté.

## Décision architecture

1. **Pas de couche physique `Activity` / `CorrespondenceLayer`**. Décision réversible. Justification dans la spec §6.
2. **Couche logique** dans `lib/time-recovery/` :
   - `lib/time-recovery/types.ts` (ActivitySignal, RecoveryCandidate, SignalStrength, BillingMode).
   - `lib/time-recovery/activity-sources/` : un fichier par source SAFE (V1 = un seul fichier `from-orphan-work-sessions.ts`).
   - `lib/time-recovery/candidate-service.ts` : list / approve / dismiss / defer, filtré tenant.
   - `lib/time-recovery/billing-mode-policy.ts` : règle pure qui mappe `ModeFacturationDossier → comportement candidate`.
3. **Un seul nouveau modèle Prisma** : `TimeRecoveryCandidate`. Voir spec §10 pour les champs.
4. **Conversion** : réutiliser le pattern de `app/api/edition/documents/[id]/terminer/route.ts` pour créer `TimeEntry` en transaction.
5. **Aucune UI cette semaine**. Le service + le modèle + les tests sont suffisants pour valider le moteur.

## Stratégie de qualité des suggestions

- V1 = signaux forts uniquement.
- V1 = une seule source : `WorkSession` orpheline (≥ 24h sans `endedAt`).
- Durée suggérée = durée mesurée (haute confiance) si la session a un `dureeMinutes`, sinon presets (0.1h / 0.2h / 0.3h / 0.5h) + confirmation humaine.
- Chaque candidate expose : raison, source, confiance, usage suggéré (selon mode), impact, actions disponibles (voir spec §8).
- Déduplication par `(cabinetId, sourceType, sourceId)`.

## Stratégie anti-bruit

V1 :

- pas de candidates faibles seules.
- déduplication stricte par sourceId.
- statut `dismissed` retenu (jamais re-suggéré).

V1.1+ (backlog) :

- ignorer ce type de suggestion.
- ignorer pour ce dossier / ce client.
- groupement de candidates similaires.
- seuil minimal de confiance configurable.
- analytics passive des rejets.

## Plan de build proposé

Aujourd'hui : **plan + spec uniquement** (livré).

Prochain batch (recommandé pour Claude Code, **un seul slice**) :

> Implémenter le squelette déterministe de SAFE Time Recovery — modèle + service + une source — sans UI.

Étapes :

1. Ajouter le modèle `TimeRecoveryCandidate` dans `prisma/schema.prisma` (avec énumérations associées si nécessaire) + migration Prisma.
2. Créer `lib/time-recovery/types.ts` (`SignalStrength`, `BillingMode`, `ActivitySignal`, `RecoveryCandidateInput`).
3. Créer `lib/time-recovery/billing-mode-policy.ts` :
   - `mapDossierModeToBillingMode(mode: ModeFacturationDossier | null): BillingMode`
   - `resolveCandidateOutcome(billingMode: BillingMode): { facturable: boolean; billingStatus: BillingStatus | null; }`
4. Créer `lib/time-recovery/activity-sources/from-orphan-work-sessions.ts` :
   - `findOrphanWorkSessionSignals(cabinetId, opts: { olderThanHours?: number = 24 }): Promise<ActivitySignal[]>`
   - filtre : `WorkSession.cabinetId = cabinetId`, `statut in ('en_cours','pause')`, `endedAt is null`, `startedAt < now - 24h`, `timeEntryId is null`.
5. Créer `lib/time-recovery/candidate-service.ts` :
   - `generateCandidatesFromSources(cabinetId): Promise<{ created, skipped }>` (idempotent via `dedupeKey`).
   - `listCandidates(cabinetId, filters)`.
   - `approveCandidate(cabinetId, userId, candidateId, overrides?: { durationMinutes?, description? })` — bloque si mode `unknown`, applique policy, crée `TimeEntry` en transaction, lie `convertedTimeEntryId`.
   - `dismissCandidate(cabinetId, userId, candidateId, reason)`.
   - `deferCandidate(cabinetId, userId, candidateId, until?)`.
6. Tests unitaires `lib/time-recovery/__tests__/` :
   - billing-mode-policy : 1 test par mode (`hourly`, `forfait`, `contingent`, `retainer`, `null/unknown`).
   - candidate-service : un test multi-tenant (un cabinet ne voit pas les candidates d'un autre).
   - candidate-service : approval crée bien `TimeEntry` avec les bons flags pour chaque mode.
7. Aucune route API, aucune UI, aucune IA dans ce batch.

## Tâches divisées par agent / modèle

### 1. Agent Recherche

**Mission** : étudier les références produit (Smokeball AutoTime, Clio, MyCase, PracticePanther), extraire les patterns utiles, identifier les pièges, distinguer temps facturable vs analytique, lister les risques de bruit et fausses suggestions, produire les implications pour SAFE.

**Sortie attendue** :

- Résumé court : "Capture passive → review queue → approbation → conversion en TimeEntry. Jamais de facturation auto. Toujours respecter le mode du dossier."
- Risques : fausses suggestions, fatigue de revue, mauvais rattachement de dossier, traitement uniforme des modes, fuite cross-cabinet.
- Recommandations produit :
  - V1 sans intégration email.
  - V1 avec une seule source haut signal/bruit (`WorkSession` orpheline).
  - V1 avec stratégie par mode de facturation explicite.

**Statut** : ✅ livré dans la section "Résultat de la recherche" ci-dessus et dans la spec §2, §4, §5.

### 2. Agent Architecture

**Mission** : inspecter le repo SAFE, identifier les modèles existants, vérifier la présence des champs tenant, vérifier le mode de facturation, déterminer si une couche `Correspondence`/`Activity` existe déjà, recommander le modèle interne minimal et la représentation de la confiance.

**Sortie attendue** :

- Carte des modèles existants : ✅ section "Carte des modèles SAFE existants" et spec §6, §16.
- Trous à combler : un seul modèle nouveau, `TimeRecoveryCandidate`. Aucune migration de `Dossier`, aucune table `Activity`, aucun champ ajouté à `TimeEntry`.
- Décision : **réutiliser** `TimeEntry` (cible canonique), **réutiliser** `WorkSession` comme première source, **étendre** par un seul nouveau modèle déduplicateur, **ne pas créer** de couche physique `Activity`.
- Confiance : enum `SignalStrength { high, medium, low }`. V1 ne crée que `high`.

**Statut** : ✅ livré.

### 3. Agent Sécurité / Multi-tenant

**Mission** : vérifier les risques de fuite inter-cabinet, définir les règles de permission, identifier les données sensibles, recommander une stratégie metadata-first, définir les actions interdites selon le mode, vérifier que les signaux faibles ne créent pas de fausses facturations.

**Sortie attendue** :

- Contraintes obligatoires :
  - chaque requête filtrée par `cabinetId` (utilisation de `requireCabinetAndUser`).
  - unique `(cabinetId, sourceType, sourceId)` sur `TimeRecoveryCandidate`.
  - jamais charger une `WorkSession` ou un `Dossier` sans clause `cabinetId`.
  - lors de l'approbation, vérifier que le `dossier` et le `client` appartiennent au même `cabinetId` que l'utilisateur.
- Règles de filtrage :
  - `assistante` : peut `list`, `dismiss`, `defer`. Ne peut pas `approve`.
  - `avocat` et `admin_cabinet` : tout.
  - `comptabilite` : `list` + analytics seulement.
- Actions interdites en V1 :
  - création automatique d'`Invoice` ou `InvoiceLine`.
  - envoi d'email ou notification client.
  - augmentation d'une facture forfaitaire / retainer / contingent.
  - création de `TimeEntry` sans approbation explicite.
  - suggestions à partir d'un signal faible seul.
  - ingestion Gmail / Outlook (reportée à V2 avec design dédié).

**Statut** : ✅ couvert dans la spec §12.

### 4. Agent Produit

**Mission** : définir le workflow utilisateur, clarifier ce qui est manuel/semi-auto/auto, distinguer le workflow par mode, définir la stratégie anti-bruit, prioriser le plus petit batch utile.

**Sortie attendue** :

- Workflow V1 : voir spec §9.
- Critères d'acceptation V1 : voir spec §13.
- Limites explicites :
  - aucune UI dans le premier batch de code.
  - aucune ingestion externe.
  - aucune IA.
  - aucune création de facture.

**Statut** : ✅ livré.

### 5. Agent Implémentation

**Mission** : construire uniquement le plus petit slice approuvé, après les 4 analyses précédentes.

**À faire au prochain batch** (pas aujourd'hui) :

- Fichiers à créer / modifier :
  - `prisma/schema.prisma` (ajout du modèle `TimeRecoveryCandidate` + énumérations).
  - migration Prisma générée.
  - `lib/time-recovery/types.ts`
  - `lib/time-recovery/billing-mode-policy.ts`
  - `lib/time-recovery/activity-sources/from-orphan-work-sessions.ts`
  - `lib/time-recovery/candidate-service.ts`
  - `lib/time-recovery/__tests__/billing-mode-policy.test.ts`
  - `lib/time-recovery/__tests__/candidate-service.test.ts`
- Conventions à respecter :
  - utiliser `prisma` depuis `@/lib/db`.
  - utiliser `requireCabinetAndUser` depuis `@/lib/auth/session` si une route s'ajoute (pas de route ce batch).
  - réutiliser `lib/billing/time-entry-lifecycle.ts` quand on calcule `billingStatus`.
- Tests ou validation :
  - `npm test` (ou commande équivalente du repo) doit passer.
  - tests unitaires multi-tenant explicites.
- Interdits :
  - aucune IA.
  - aucune intégration Gmail / Outlook.
  - aucun affichage de signaux faibles.
  - aucune création d'Invoice.
  - aucune UI (dashboard reporté).

### 6. Agent Review

**Mission** : relire le plan ou le diff, chercher les risques produit / sécurité / multi-tenant / dette technique, refuser les scopes trop larges, vérifier que les dossiers forfaitaires ne sont pas traités comme horaires, vérifier que les pages ouvertes ne créent pas de suggestions.

**Checklist à appliquer après le batch d'implémentation** :

- [ ] Tous les `prisma.timeRecoveryCandidate.*` ont une clause `cabinetId`.
- [ ] La fonction `approveCandidate` charge le `dossier` avec `cabinetId` et lève si discordance.
- [ ] Le mode `forfait` / `retainer` / `contingent` produit `facturable=false` ET `billingStatus=NON_BILLABLE`.
- [ ] Le mode `unknown` (Dossier.modeFacturation null) bloque l'approbation avec une erreur claire.
- [ ] La création de `TimeEntry` réutilise `lib/billing/time-entry-lifecycle.ts` quand pertinent.
- [ ] La contrainte unique `(cabinetId, sourceType, sourceId)` est posée et empêche les doublons.
- [ ] Aucune source autre que `WorkSession` orpheline dans ce premier batch.
- [ ] Aucun fichier hors `lib/time-recovery/` + `prisma/schema.prisma` + migration n'est modifié.
- [ ] Tests multi-tenant présents et passants.

Décision attendue : `go` / `no-go` + points à corriger + prochain batch recommandé (probablement : route API + mini UI de revue).

## Fichiers probablement affectés (prochain batch — pas aujourd'hui)

- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_time_recovery_candidate/migration.sql` (généré)
- `lib/time-recovery/types.ts` (nouveau)
- `lib/time-recovery/billing-mode-policy.ts` (nouveau)
- `lib/time-recovery/activity-sources/from-orphan-work-sessions.ts` (nouveau)
- `lib/time-recovery/candidate-service.ts` (nouveau)
- `lib/time-recovery/__tests__/billing-mode-policy.test.ts` (nouveau)
- `lib/time-recovery/__tests__/candidate-service.test.ts` (nouveau)

Aucun autre fichier ne doit être modifié.

## Critères d'acceptation

Aujourd'hui (planning) :

- [x] Spec V2 livrée avec billing modes, signaux, anti-bruit, décision sur la couche `Activity`.
- [x] Daily file livré avec division par 6 agents.
- [x] Décision architecture explicite (pas de table physique `Activity` en V1).
- [x] Prompt exact pour Claude Code disponible dans la section ci-dessous.

Prochain batch (code) — voir spec §13 et la checklist Agent Review.

## Risques

- **Risque 1** : un futur batch ajoute une source `DossierCorrespondence` sans réfléchir à la confidentialité du contenu. → mitigation : la spec dit metadata-first par défaut.
- **Risque 2** : la création de `TimeEntry` pour un dossier `forfait` crée par accident une ligne facturable. → mitigation : tests unitaires par mode + checklist Agent Review.
- **Risque 3** : le `dedupeKey` n'est pas posé et le batch génère N candidates par session orpheline. → mitigation : contrainte unique Prisma `(cabinetId, sourceType, sourceId)` + index.
- **Risque 4** : un cabinet voit les candidates d'un autre. → mitigation : tous les services prennent `cabinetId` explicite, jamais déduit côté client. Test dédié.
- **Risque 5** : pression à brancher Gmail rapidement. → mitigation : la spec et ce plan refusent toute ingestion externe en V1, à reporter à un design dédié V2.

## Prompt exact pour Claude Code (prochain batch)

```md
You are implementing the FIRST CODE BATCH for SAFE Time Recovery.

Read first, in order:

- `CLAUDE.md`
- `subprojects/safe-virtual-employee-tools/CLAUDE.md`
- `subprojects/safe-virtual-employee-tools/specs/time-recovery-engine.md` (V2, sections 5, 6, 7, 9, 10, 11, 12, 13)
- `subprojects/safe-virtual-employee-tools/daily/2026-05-07-safe-time-recovery.md` (sections "Plan de build proposé" and "Tâches divisées par agent / modèle → 5. Agent Implémentation")
- `prisma/schema.prisma` (focus: Cabinet, User, Dossier, ModeFacturationDossier, TimeEntry, WorkSession, BillingStatus enum)
- `app/api/edition/documents/[id]/terminer/route.ts` (reference pattern for closing a WorkSession + creating a TimeEntry in a transaction)
- `lib/billing/time-entry-lifecycle.ts` (reuse helpers when computing billingStatus)

Implement only this batch:

1. Add a single new Prisma model `TimeRecoveryCandidate` in `prisma/schema.prisma` with the fields listed in the spec §10 (id, cabinetId, clientId?, dossierId?, userId, sourceType enum, sourceId, occurredAt, signalStrength enum, suggestedDurationMinutes?, suggestedBillingMode enum, reason, payload Json, status enum, dedupeKey, reviewedAt?, reviewedById?, convertedTimeEntryId?, dismissReason?, createdAt, updatedAt). Add the required relations to Cabinet, User, Client (optional), Dossier (optional), TimeEntry (optional via convertedTimeEntryId). Add indexes (cabinetId, status, occurredAt), (cabinetId, dossierId), (cabinetId, userId), and a UNIQUE on (cabinetId, sourceType, sourceId).
2. Generate the Prisma migration. Do NOT alter Dossier, TimeEntry, WorkSession, Cabinet, User, Client beyond adding the back-relation arrays.
3. Create `lib/time-recovery/types.ts` with: SignalStrength, BillingMode (= 'hourly' | 'flat_fee' | 'retainer' | 'contingency' | 'unknown'), ActivitySignal, RecoveryCandidateInput.
4. Create `lib/time-recovery/billing-mode-policy.ts` with two pure functions:
   - `mapDossierModeToBillingMode(mode)` — mapping ModeFacturationDossier (or null) to BillingMode.
   - `resolveCandidateOutcome(billingMode)` — returns `{ facturable: boolean; billingStatus: BillingStatus | null }` for the TimeEntry that would be created. `unknown` returns a sentinel that callers must reject.
5. Create `lib/time-recovery/activity-sources/from-orphan-work-sessions.ts` exporting `findOrphanWorkSessionSignals(cabinetId, opts?: { olderThanHours?: number })`. Default 24h. Filter: cabinetId match, statut in ('en_cours','pause'), endedAt is null, timeEntryId is null, startedAt before threshold. Map to ActivitySignal.
6. Create `lib/time-recovery/candidate-service.ts` exporting:
   - `generateCandidatesFromSources(cabinetId)` — runs the source(s), upserts by dedupeKey `${cabinetId}|${sourceType}|${sourceId}`, returns `{ created, skipped }`.
   - `listCandidates(cabinetId, filters?)`.
   - `approveCandidate(cabinetId, userId, candidateId, overrides?)` — load candidate filtered by cabinetId, load Dossier (cabinetId guarded), throw if mode is `unknown`, apply `resolveCandidateOutcome`, in a single transaction: create the TimeEntry (using the same field shape as `app/api/edition/documents/[id]/terminer/route.ts`), set candidate.status='converted' and candidate.convertedTimeEntryId. If the source is an orphan WorkSession, also close it (statut='termine', endedAt, link timeEntryId) — same transaction.
   - `dismissCandidate(cabinetId, userId, candidateId, reason)` — sets status='dismissed' and dismissReason.
   - `deferCandidate(cabinetId, userId, candidateId, until?)` — sets status='deferred'. (No new column needed; reuse status. Keep simple.)
7. Add tests in `lib/time-recovery/__tests__/`:
   - `billing-mode-policy.test.ts`: one test per mode (hourly, flat_fee/forfait, retainer, contingency/contingent, unknown). Confirm correct facturable + billingStatus.
   - `candidate-service.test.ts`: a multi-tenant test (cabinet A's user cannot see, approve, or dismiss cabinet B's candidate); approval on a `forfait` dossier creates a TimeEntry with `facturable=false` and `billingStatus='NON_BILLABLE'`; approval on an `horaire` dossier creates a TimeEntry with `facturable=true` and `billingStatus='READY_TO_BILL'`; approval on a dossier with `modeFacturation=null` throws an explicit error.

Hard constraints:

- Multi-tenant: every query MUST be filtered by cabinetId.
- No new files outside `lib/time-recovery/`, `prisma/schema.prisma`, and the generated migration.
- No API route, no UI, no AI, no Gmail/Outlook ingestion.
- No automatic Invoice or InvoiceLine creation.
- A `forfait`, `retainer` or `contingent` dossier must NEVER produce a billable TimeEntry from a recovered candidate.
- A page-view-style signal must NOT be implemented.
- Reuse `lib/billing/time-entry-lifecycle.ts` helpers if relevant (e.g. when constructing the billingStatus update payload). Do not duplicate constants.
- Keep changes narrow. No drive-by edits.

End with:

1. What was completed
2. Files changed
3. What remains
4. Exact next prompt for the next batch (probably: API routes + minimal review queue UI)
```

## Prochain batch recommandé (après le batch ci-dessus)

> Exposer le moteur via API + UI de revue minimale, toujours sans IA.

Périmètre pressenti :

- `app/api/time-recovery/candidates/route.ts` (`GET` list + `POST` generate).
- `app/api/time-recovery/candidates/[id]/approve/route.ts`, `.../dismiss/route.ts`, `.../defer/route.ts`.
- Utilisation de `requireCabinetAndUser`, contrôle de role (assistante = pas d'approbation).
- Page minimale `app/(app)/temps/recovery/page.tsx` : liste les candidates en statut `new`, boutons approuver / rejeter / reporter, badge "interne" vs "facturable" selon le mode du dossier.
- Aucune IA, aucun email, toujours une seule source (`WorkSession` orpheline) en V1.
