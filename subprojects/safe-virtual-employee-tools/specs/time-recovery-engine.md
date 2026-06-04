# SAFE Time Recovery — Spec

> Version 2 — élargie pour couvrir les modes de facturation, la qualité des suggestions, et la décision sur la couche `Correspondence / Activity`.
> Remplace la V1 minimale du 2026-05-07.

---

## 1. Purpose

SAFE Time Recovery aide les avocats solos et petits cabinets à récupérer la **vérité opérationnelle** d'un dossier :

- temps facturable oublié (dossiers horaires),
- temps interne / effort réel (dossiers forfaitaires, retainer, contingence),
- rentabilité réelle vs prix facturé,
- scope creep et travaux additionnels non prévus,
- historique de travail réel sur un mandat.

L'outil ne sert pas seulement à transformer du temps en facture. Il sert d'abord à **rendre visible le travail déjà effectué** dans SAFE.

## 2. Product Principle

- Déterministe avant IA. L'IA n'arrive qu'après que le workflow déterministe soit utile.
- Préfère **moins de suggestions, mais meilleures**.
- Une page ouverte ou un onglet actif n'est jamais une preuve de travail.
- Aucune action automatique vers le client. Aucune facture créée seule. Aucune entrée de temps sans revue humaine.
- Multi-tenant strict. Chaque requête est filtrée par `cabinetId`.

## 3. Target User

Avocat solo ou petit cabinet qui utilise SAFE pour clients, dossiers, documents, billing.

## 4. Problem

Le travail facturable se perd quand l'avocat :

- répond à un email ou un appel sans créer d'entrée de temps,
- modifie un document sans saisir le temps de rédaction,
- met à jour un dossier sans facturer le travail associé,
- prépare la facture en retard et oublie les petites tâches,
- change de contexte plusieurs fois dans la journée.

Pour les dossiers forfaitaires, le problème est différent : le travail est toujours fait, mais sans visibilité sur l'**effort réel**, le cabinet ne peut pas :

- calculer la rentabilité du forfait,
- détecter le scope creep,
- ajuster le prix futur du même type de mandat,
- justifier un travail additionnel auprès du client.

## 5. Billing Modes (obligatoire dès V1)

SAFE stocke déjà le mode de facturation sur `Dossier.modeFacturation` (enum `ModeFacturationDossier` : `horaire | forfait | retainer | contingent`). SAFE Time Recovery doit traiter ces modes différemment dès le départ. Deux modes logiques additionnels sont exposés au moteur :

| Mode produit | Source SAFE | Comportement Time Recovery |
| --- | --- | --- |
| `hourly` | `Dossier.modeFacturation = horaire` | Activité récupérée → candidate `TimeEntry` facturable, après approbation explicite. |
| `flat_fee` | `Dossier.modeFacturation = forfait` | Activité récupérée → `TimeEntry` interne (`facturable=false`). Sert effort réel, rentabilité, scope creep. **Ne jamais augmenter la facture forfaitaire sans action explicite.** |
| `retainer` | `Dossier.modeFacturation = retainer` | Idem `flat_fee` jusqu'à confirmation — V1 = analytique seulement. |
| `contingency` | `Dossier.modeFacturation = contingent` | Activité récupérée → `TimeEntry` interne, soutient analytics charge / rentabilité. Aucune facturation immédiate. |
| `mixed` | non stocké actuellement, dérivé | À ajouter plus tard si besoin. V1 traite comme `unknown`. |
| `unknown` | `Dossier.modeFacturation = null` | Suggestion **interne uniquement**, demander la confirmation de l'avocat avant toute action. |

Règle absolue : **le temps récupéré ne signifie jamais automatiquement « temps facturable »**. Le mode du dossier décide.

Champs déjà disponibles côté schéma :

- `Dossier.modeFacturation` (enum)
- `Dossier.tauxHoraire` (Float, dossier horaire)
- `User.defaultHourlyRate`
- `ForfaitService` (catalogue de forfaits, par cabinet)
- `RegistreTache` (registre de tâches forfaitaires par dossier, avec `montantBase`, `ajustement`, `rabais`, `montantFinal`, `statut`)
- `DossierBillingStage` (facturation par étape pour les forfaits phasés)

Conclusion : **aucune migration nécessaire pour représenter le mode**. Le moteur lit `Dossier.modeFacturation` et applique la bonne stratégie.

## 6. Couche Correspondence / Activity Layer — décision

### Question

Faut-il créer une table physique transversale `Activity` / `CorrespondenceLayer` qui unifie emails, messages, appels, notes, documents, tâches, événements ?

### État actuel du schéma

Plusieurs tables couvrent déjà des fragments de ce périmètre :

- `DossierCorrespondence` (typeCommunication, expéditeur, destinataire, dateCommunication)
- `DossierNote`
- `DossierTache`, `DossierActe`
- `CalendarEvent`, `DossierEvenement`, `DossierReminder`
- `Document`, `RichDocument`, `RichDocumentVersion`
- `WorkSession` (timer, déjà rattachée à `dossierId` et `clientId`)
- `NotificationLog` (notifications client envoyées)
- `AuditLog` (audit système, oldValues / newValues JSON)

Aucune intégration Gmail / Outlook n'existe pour l'instant. Aucun email externe n'est ingéré.

### Décision V1

**NE PAS créer de table physique `Activity` maintenant.**

Raisons :

1. Les producteurs de signaux existent déjà. Une nouvelle table forcerait un large refactor pour migrer chaque source.
2. La règle SAFE est claire : pas de gros rewrites, un outil à la fois.
3. Le V1 utile (récupérer du temps déjà saisi en partie via WorkSession et autres signaux forts internes) ne nécessite **aucun ingest d'email externe**.
4. Une table `Activity` physique deviendrait un point de fuite multi-tenant supplémentaire à protéger.

### Approche retenue

**Couche logique en code, pas en base.** Créer un module `lib/time-recovery/activity-sources/` qui :

- expose un type `ActivitySignal` normalisé (cabinetId, clientId, dossierId, userId, sourceType, sourceId, occurredAt, signalStrength, payloadSummary),
- implémente une fonction `read-only` par source SAFE existante (work-session, rich-document-version, dossier-note, dossier-correspondence, dossier-tache, dossier-acte, calendar-event, document-upload),
- ne stocke **rien** de plus que les `RecoveryCandidate` produites.

La porte reste ouverte pour ajouter plus tard une table physique `Activity` si Gmail / Outlook ingestion devient nécessaire. Cette décision est **réversible**.

## 7. Classification des signaux

Source de la classification : éviter le bruit qui force l'avocat à corriger l'outil.

### Signaux faibles (NE PAS afficher seuls en V1)

- page consultée, dossier ouvert, profil client consulté
- onglet actif, présence idle
- navigation passive

> SAFE n'a actuellement **aucune table** qui capture ces signaux. Ne pas en créer en V1. Si un jour on tracke des vues, les ranger ici sans jamais les surfacer comme suggestion.

### Signaux moyens (contexte, jamais seuls en V1)

- navigation répétée dans le même dossier
- document téléchargé
- consultation suivie d'une activité forte
- brouillon commencé mais non complété

### Signaux forts (V1 — éligibles à devenir candidats)

- `WorkSession` orpheline (started, never ended) → **highest confidence target V1**
- `WorkSession` terminée mais sans `TimeEntry` lié (cas dégénéré)
- `RichDocumentVersion` créée par un avocat (drafting réel)
- `Document` téléversé (signaux : `createdAt`, `uploadedBy`)
- `DossierNote` créée
- `DossierCorrespondence` envoyée (typeCommunication = email_sent / appel_sortant / lettre)
- `DossierTache` complétée (statut `terminee`)
- `DossierActe` complété
- `CalendarEvent` passé avec status `realise`
- `Invoice` brouillon modifié
- `AuditLog` action sur entityType pertinent (changement statut dossier, etc.)

Règle V1 : **seules les suggestions à confiance haute sont affichées par défaut**. Les signaux moyens / faibles restent en analytics ou en preuve de soutien.

## 8. Stratégie qualité des suggestions

### Durée suggérée

Éviter les estimations trop précises. Utiliser des presets :

- 0.1 h, 0.2 h, 0.3 h, 0.5 h
- ou demander une confirmation humaine quand la durée est incertaine.

Pour `WorkSession` : la durée mesurée par le timer est de confiance haute, on garde la valeur réelle.

### Contenu obligatoire d'une suggestion

Chaque candidate exposée à l'avocat doit afficher :

1. **raison** (texte court, ex : "Session de rédaction non clôturée depuis 2 jours")
2. **activité source** (lien vers le RichDocument, la WorkSession, la Note, etc.)
3. **niveau de confiance** (haute / moyenne — V1 affiche haute uniquement)
4. **usage suggéré** selon mode :
   - hourly → "Créer entrée de temps facturable"
   - flat_fee / retainer / contingent → "Tracer effort interne"
   - unknown → "Confirmer le mode de facturation"
5. **impact** sur le mode (ne pas modifier la facture forfaitaire, ajouter à `unbilled_time` pour horaire, etc.)
6. **actions disponibles** : approuver, rejeter, reporter, ignorer ce type, ignorer pour ce dossier, ignorer pour ce client.

### Stratégie anti-bruit (V1 + roadmap)

V1 livre les minimums :

- approuver / rejeter / reporter par candidate
- déduplication par (`sourceType`, `sourceId`) pour ne jamais proposer 2× la même chose

Roadmap V1.1 — V1.2 :

- ignorer ce type de suggestion (par utilisateur)
- ignorer pour ce dossier (par dossier)
- ignorer pour ce client
- groupement de candidates similaires (même journée, même dossier)
- seuil minimal de confiance configurable
- apprentissage passif des rejets répétés (juste analytics, pas d'IA)

## 9. Workflow V1 (déterministe, no-AI)

```
[ Sources SAFE existantes ]
        │  (read-only adapters par source, filtrés par cabinetId)
        ▼
[ ActivitySignal[] normalisés ]
        │  (deterministic scoring rules → strong signals only V1)
        ▼
[ RecoveryCandidate persisté ]   ← nouveau modèle minimal
        │  (review queue, filtré par cabinetId + role)
        ▼
[ Avocat : approve / dismiss / defer ]
        │
        ├── approve + hourly      → crée TimeEntry (facturable=true, billingStatus=READY_TO_BILL)
        ├── approve + flat_fee    → crée TimeEntry (facturable=false, billingStatus=NON_BILLABLE) → analytics
        ├── approve + contingency → crée TimeEntry (facturable=false) → analytics
        ├── approve + retainer    → idem flat_fee
        ├── approve + unknown     → bloqué : forcer la sélection du mode d'abord
        ├── dismiss               → garde la trace + raison
        └── defer                 → réapparaît à la prochaine revue
```

## 10. Modèle minimal proposé (V1)

Ajout d'un seul nouveau modèle Prisma : `TimeRecoveryCandidate`.

Champs pressentis (à confirmer au batch d'implémentation) :

- `id`
- `cabinetId` (obligatoire, indexé)
- `clientId` (nullable si rattachement incertain)
- `dossierId` (nullable, idem)
- `userId` (l'avocat censé être l'auteur du travail)
- `sourceType` (enum : `work_session` | `rich_document_version` | `dossier_note` | `dossier_correspondence` | `dossier_tache` | `dossier_acte` | `calendar_event` | `document_upload` | `audit_log`)
- `sourceId` (id de la source, polymorphique)
- `occurredAt` (DateTime)
- `signalStrength` (enum : `high` | `medium` | `low` — V1 ne crée que `high`)
- `suggestedDurationMinutes` (Int, nullable si demande confirmation humaine)
- `suggestedBillingMode` (enum : `hourly | flat_fee | retainer | contingency | unknown`, dérivé du dossier)
- `reason` (String, court)
- `payload` (Json, payload normalisé léger pour audit, **pas de contenu d'email externe**)
- `status` (enum : `new | reviewed | approved | dismissed | deferred | converted`)
- `dedupeKey` (String, unique par cabinetId : `cabinetId|sourceType|sourceId`)
- `reviewedAt`, `reviewedById`
- `convertedTimeEntryId` (FK nullable vers `TimeEntry`)
- `dismissReason` (String, nullable)
- `createdAt`, `updatedAt`

Index : `(cabinetId, status, occurredAt)`, `(cabinetId, dossierId)`, `(cabinetId, userId)`, unique `(cabinetId, sourceType, sourceId)`.

## 11. Cibles de conversion (target des candidates approuvées)

- **Cible canonique** : créer une `TimeEntry` (modèle déjà central côté billing). Pattern de référence existant : `app/api/edition/documents/[id]/terminer/route.ts` (clôture WorkSession + crée TimeEntry).
- Champs de la `TimeEntry` créée :
  - `facturable` selon mode (`true` pour hourly, `false` sinon)
  - `billingStatus` : `READY_TO_BILL` (hourly) ou `NON_BILLABLE` (autres)
  - `tauxHoraire` / `hourlyRate` : `Dossier.tauxHoraire` ?? `User.defaultHourlyRate` ?? `0` (jamais inventer une valeur si les deux sont nuls — afficher un avertissement à l'avocat)
  - `description` : tirée de la `reason` + nom de la source
  - `dureeMinutes`, `durationHours`
  - lien retour : `TimeRecoveryCandidate.convertedTimeEntryId`
- **Aucune** création automatique de `Invoice` ou `InvoiceLine`. Le pipeline s'arrête à la `TimeEntry`.

## 12. Safety Rules (multi-tenant + produit)

- Toute requête filtrée par `cabinetId` (utiliser `requireCabinetAndUser` comme dans le reste du code).
- Permissions : seuls `admin_cabinet` et `avocat` peuvent approuver. `assistante` peut préparer / proposer mais pas convertir en facturable.
- Les candidates restent **internes** jusqu'à approbation explicite.
- Pas de création d'Invoice. Pas d'envoi d'email. Pas de notification client.
- Aucune ingestion Gmail / Outlook en V1. Si V2 : metadata-first (sender, recipient, subject, date), opt-in explicite, BCC ou OAuth scoped, contenu complet **optionnel** et **explicitement autorisé** par l'utilisateur, audit trail complet.
- Un dossier `forfait` / `contingent` / `retainer` : interdit V1 d'augmenter le prix client à partir d'une candidate. Seul un `TimeEntry` interne est créé.
- Aucune page ouverte ne crée seule une candidate.
- `dedupeKey` empêche la double-suggestion sur la même source.

## 13. Critères d'acceptation V1

V1 est livré utile si :

- modèle `TimeRecoveryCandidate` créé avec migration Prisma propre, `cabinetId` indexé, contrainte unique de dédup.
- une seule source de signal implémentée, la plus sûre : `WorkSession` orpheline (status `en_cours` ou `pause`, sans `endedAt`, plus de 24h).
- service `lib/time-recovery/candidate-service.ts` avec `listCandidates(cabinetId, filters)`, `approveCandidate(id, ...)`, `dismissCandidate(id, reason)`, `deferCandidate(id, until)` — toutes filtrées tenant.
- conversion réutilise le pattern existant de `app/api/edition/documents/[id]/terminer/route.ts` (création `TimeEntry` + clôture `WorkSession` en transaction).
- comportement par mode :
  - hourly → `facturable=true, billingStatus=READY_TO_BILL`
  - flat_fee / retainer / contingent → `facturable=false, billingStatus=NON_BILLABLE`
  - unknown → bloqué côté service avec erreur explicite
- tests unitaires : un test par mode + un test multi-tenant (un cabinet ne voit pas les candidates d'un autre).
- aucune UI nécessaire pour V1 — l'API service est suffisante pour valider le moteur.

## 14. Out of scope V1

- UI / dashboard (V1.1)
- Ingestion Gmail / Outlook (V2)
- Suggestions à partir de signaux moyens ou faibles (V1.1+)
- Apprentissage IA / scoring intelligent (V2+)
- Génération automatique de description de TimeEntry (V2+)
- Détection scope creep multi-dossiers (V2)
- Comparaison forfait vs effort réel — vue analytique (V1.2 — après que des données aient été collectées)

## 15. Open questions (résolues par cette V2)

- ✅ Modèle de TimeEntry canonique → `TimeEntry` dans `prisma/schema.prisma` (champ `billingStatus` est central).
- ✅ Linkage tenant fiable → tous les modèles candidats ont déjà `cabinetId` ou un parent `dossier.cabinetId`.
- ✅ Stocker ou calculer les candidates ? → **stocker** (`TimeRecoveryCandidate`), pour permettre dedup + audit + workflow d'approbation.
- ✅ Cible de conversion la plus sûre → `TimeEntry` (jamais directement `Invoice` / `InvoiceLine`).
- ⏳ Faut-il un mode `mixed` réel sur Dossier ? → reporté tant qu'aucun cabinet pilote ne le demande.

## 16. Références code existant

- `prisma/schema.prisma` : `Dossier`, `TimeEntry`, `WorkSession`, `Invoice`, `InvoiceLine`, `Cabinet`, `User`, `DossierCorrespondence`, `DossierNote`, `DossierTache`, `DossierActe`, `CalendarEvent`, `RichDocument`, `RichDocumentVersion`, `AuditLog`, `RegistreTache`, `ForfaitService`, `DossierBillingStage`.
- `app/api/edition/documents/[id]/terminer/route.ts` : pattern de référence pour clôturer une `WorkSession` et créer une `TimeEntry` en transaction.
- `lib/billing/time-entry-lifecycle.ts` : helpers `isTimeEntryBillingLocked`, `resolveEditableTimeEntryBillingFields`. À réutiliser quand on calcule `billingStatus` sur les candidates approuvées.
- `lib/auth/session.ts` : `requireCabinetAndUser`, point d'entrée standard pour le filtrage tenant.

---

**Dernière mise à jour** : 2026-05-07 (v2)
