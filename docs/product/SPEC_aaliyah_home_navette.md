# SPEC — Accueil « Today » d'Aaliyah + Navette (communication interne assistante↔avocate)

> Statut : **proposée, à valider avant code**
> Date : 2026-06-03
> Persona : **Aaliyah** — assistante directe Derisier, **utilisatrice principale** de SAFE (EN par défaut).
> Vision : `docs/product/VISION_assistante_navette_TDAH.md`
> Maquette validée : `docs/product/mockups/aaliyah-home-v3.html` (thème SAFE fidèle, sans emoji)
> Réutilise : `ready-for-review-service.ts`, `getAssistantQueue`, `preparation-status`, T1 `getDossierResume`.

---

## 0. Objectif

Donner à Aaliyah un **dashboard** (pas un écran unique verrouillé) : elle voit **ce qu'elle est
en train de faire**, ses **activités**, sa **communication**, et accède à ses outils via un
**menu**. Le « Today » en est la page d'accueil, mais elle navigue librement.

**Menu d'Aaliyah (navigation)** :
- **Today** (dashboard d'accueil : brief, prochaine action, deadlines, reconnaissance)
- **Navette** (communication interne centrée dossier avec Me Derisier)
- **Mes dossiers** (sa file de travail)
- **Facturation** (elle prépare les factures — permission existante)
- **Mon temps & ma paye** (elle soumet ses heures travaillées → sa paye)

**Périmètre de cette spec** : (1) le dashboard Today + menu, (2) la **Navette** interne,
(3) la **soumission d'heures employé pour la paye** (Aaliyah soumet → Me Derisier approuve/paie).
**Hors périmètre** : communication client, `components/pdf`, notifications push.

> ⚠️ **À revoir avec Me Derisier** : les détails de **rémunération d'Aaliyah** (taux horaire exact,
> ce qui compte comme heures payées, déductions, lien éventuel avec les dossiers). Cette spec
> conçoit le **flux** (soumettre → approuver → payer) avec une rémunération **configurable** ;
> les règles précises seront fixées après cette revue.

---

## 1. Ce qui existe déjà (à réutiliser, ne pas refaire)

| Besoin | Existant | Rôle dans Today |
|---|---|---|
| Prochaine action / manquants par dossier | `preparation-status.ts` (`nextAction`, `missingItems`) | alimente « Next action » + focus list |
| Reprise de contexte | `dossier-resume.ts` (T1) | détail d'un dossier ouvert depuis Today |
| File de travail (buckets) | `assistant-queue.ts` (`getAssistantQueue`) | « Today's focus » + file complète |
| Échéances | `DossierEvenement` | rail « Deadlines » + comptes à rebours |
| Aller de navette (assistante→avocate) | `DossierReadyForReviewSignal` + `ready-for-review-service.ts` | types `ready_for_review` / `approved` de la Navette |
| Traçabilité | `AuditLog` | journal d'actions |
| Rôles | `UserRole` (`assistante`, `avocat`, `admin_cabinet`, `comptabilite`) | permissions Navette |

**Manque** (ce que la spec ajoute) : le **retour** (avocate→assistante : *sent back*, *question*),
les **messages libres** par dossier, le **fil unifié**, l'**écran Today**, le **chrono passif**,
les **notifications calmes**.

---

## 2. La Navette — modèle de données

Nouveau modèle unifié `DossierNavetteMessage` (le fil de handoffs par dossier). Migration Prisma
**additive** (dev = prod : prudente, testée).

```prisma
enum NavetteMessageType {
  question          // avocate↔assistante : une question
  info              // info simple
  sent_back         // avocate → assistante : à revoir (avec raison + échéance)
  ready_for_review  // assistante → avocate : prêt à valider
  approved          // avocate → assistante : validé
  reply             // réponse à un message parent
}

model DossierNavetteMessage {
  id            String   @id @default(cuid())
  cabinetId     String
  dossierId     String
  authorId      String                 // User qui écrit
  authorRole    String                 // snapshot du rôle au moment de l'envoi
  recipientId   String?                // destinataire principal (avocate ou assistante)
  type          NavetteMessageType
  body          String?                // texte (null pour un pur évènement d'état)
  dueDate       DateTime?              // échéance optionnelle (sent_back / question)
  parentId      String?                // threading (reply)
  confidentiel  Boolean  @default(false)
  // cycle de vie (seules mutations autorisées — sinon append-only / audit-grade)
  readAt        DateTime?
  readById      String?
  resolvedAt    DateTime?              // « addressed / fixed »
  resolvedById  String?
  createdAt     DateTime @default(now())

  cabinet  Cabinet @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  dossier  Dossier @relation(fields: [dossierId], references: [id], onDelete: Cascade)
  author   User    @relation("NavetteAuthor", fields: [authorId], references: [id])

  @@index([cabinetId, dossierId, createdAt])
  @@index([cabinetId, recipientId, resolvedAt])  // « needs me »
}
```

**Doctrine d'intégrité** : le `body` n'est jamais modifié après envoi (immutable). Seuls
`readAt`/`resolvedAt` évoluent. Toute action écrit aussi un `AuditLog`. → défendable en inspection.

**Pont avec l'existant** : `ready_for_review` / `approved` peuvent rester portés par
`DossierReadyForReviewSignal` (déjà câblé). **Décision T0** : la Navette **lit les deux sources**
et les présente en un fil unifié (adapteur), sans migrer le signal. Quand l'action
« Marquer prêt pour revue » est déclenchée, on continue d'émettre le signal **et** on écrit un
`DossierNavetteMessage(type=ready_for_review)` pour le fil. *(Consolidation = V2.)*

---

## 3. La Navette — service & actions

`lib/navette/navette-service.ts` (server) :
- `getDossierNavette(cabinetId, dossierId, locale)` → fil d'un dossier (messages + signaux unifiés).
- `getNavetteInbox(cabinetId, userId, role, locale)` → boîte unifiée multi-dossiers pour Today
  (filtres : `all`, `needs_me`, `sent_for_review`, `approved`).
- `countNeedsMe(cabinetId, userId, role)` → badge.

Server actions `app/(app)/navette/actions.ts` :
- `sendNavetteMessage({ dossierId, type, body?, dueDate?, recipientId?, parentId?, confidentiel? })`
- `markNavetteRead(id)` · `resolveNavetteMessage(id)` (« addressed / fixed »)
- **Avocate** : `sendBackToAssistant({ dossierId, reason, dueDate? })` (= `sent_back`) ·
  `approveMatter({ dossierId, note? })` (= `approved`, + acquitte le signal existant).
- **Assistante** : `markReadyForReview({ dossierId, note? })` (réutilise `emitReadyForReviewSignal` + écrit le message).

**Garde-fous permissions** (frontière doctrinale) :
- `sent_back`, `approved` : **avocat / admin** seulement.
- `ready_for_review` : **assistante / admin**.
- `question`, `info`, `reply` : tous les rôles internes.
- `confidentiel` : visible seulement avocat/admin (jamais exposé à un futur portail client).
- Tout est **scopé `cabinetId`**.

---

## 4. La Navette — UI

- `components/navette/NavettePanel.tsx` (client) — le fil + filtres + compose (maquette v3).
  - messages typés (icônes lucide, couleurs **statut SAFE** : sent_back=danger, question=warning,
    approved/ready=success/brand), `matter` chip, `when`, actions par type.
  - compose : sélecteur de dossier + zone texte + envoi ; type implicite (question par défaut,
    `ready_for_review` via bouton dédié sur la carte dossier).
- `components/navette/NavetteThread.tsx` — fil d'un seul dossier (réutilisé dans le détail dossier).
- **Bilingue** (EN défaut Aaliyah). Aucune chaîne en dur (clés `navetteUi`).

---

## 5. La vue avocate (asymétrie — « 15-sec view »)

- `components/navette/LawyerGlance.tsx` + widget sur `tableau-de-bord` de l'avocate :
  **« Needs me »** = dossiers `ready_for_review` non acquittés + questions de l'assistante.
  Chaque ligne : briefing 1-ligne (dossier · 0 manquant · échéance) + **1 clic** :
  *Approve* / *Send back…* (ouvre raison + échéance).
- Réutilise / élargit `ReadyForReviewInbox.tsx` (déjà sur le dashboard avocate).

---

## 6. L'écran Today d'Aaliyah

Route **`app/(app)/aujourdhui/page.tsx`** (server) — landing de l'assistante (lien nav + redirection
par défaut pour le rôle `assistante`). Compose, sans nouvelle logique métier lourde :

| Bloc | Source |
|---|---|
| **Morning brief** (1 ligne) | dérivé : top échéance + sent_back + récurrence du jour |
| **Next action** (une seule, tous dossiers) | `getAssistantQueue` → 1ʳᵉ action par sévérité globale |
| **Navette** (`needs_me` en tête) | `getNavetteInbox` |
| **Today's focus** (liste courte + « show full queue ») | `getAssistantQueue` |
| **Deadlines** (comptes à rebours) | `DossierEvenement` + `daysLeftUntil` (helper T1) |
| **Awaiting client** | état `en_attente_client` + dernière interaction |
| **Sent to Me Derisier** | `getNavetteInbox(filter=sent_for_review)` |
| **Your week** (reconnaissance) | agrégat : dossiers passés `ready_for_review` cette semaine, 0 oubli |

Composants : `MorningBrief`, `NextActionCard`, `NavettePanel`, `TodayFocusList`, `DeadlinesRail`,
`AwaitingClientRail`, `WeekRecognition`. Style **thème SAFE** (Geist, forest `#1F3A2E`, tokens statut,
icônes lucide, zéro emoji). Respecter `prefers-reduced-motion`.

**Quick capture (⌘K)** : `components/QuickCapture.tsx` — palette globale (créer tâche/note depuis
n'importe où). MVP : créer un `DossierTache` ou une note rapide.

**Mode Focus** : toggle qui masque tout sauf `NextActionCard` (deep work). Préférence par
utilisateur (réutilise le futur réglage accessibilité TDAH).

---

## 7. Chrono facturable passif

- `components/temps/BillableTimer.tsx` — timer dans la barre, rattaché à un dossier/tâche.
  `Start timer` sur l'action → au stop, propose une **entrée de temps** pré-remplie
  (durée + dossier + description), que l'assistante confirme. Réutilise le pipeline temps existant
  (`TimeEntry`). Lève le taux d'utilisation sans effort. *(Temps facturable CLIENT — distinct de §7bis.)*

---

## 7bis. Mon temps & ma paye — soumission d'heures employé

**Distinct du temps facturable client** (§7 / `TimeEntry`). Ici, Aaliyah soumet **ses** heures
travaillées **pour être payée**. S'intègre au **module paie existant** (`Employee.hourlyRate`,
`PayrollPeriod`, `Payslip.hoursWorked → grossPay`) — aujourd'hui `hoursWorked` est saisi à la main
par l'admin ; on ajoute la **soumission par l'employée**.

### Modèle (additif)
```prisma
enum EmployeeHoursStatus { submitted approved rejected paid }

model EmployeeHoursEntry {
  id              String   @id @default(cuid())
  cabinetId       String
  employeeId      String                 // l'employée (Aaliyah)
  date            DateTime
  hours           Float
  dossierId       String?                // optionnel : sur quel dossier (traçabilité, PAS facturation)
  note            String?
  status          EmployeeHoursStatus @default(submitted)
  submittedAt     DateTime @default(now())
  reviewedById    String?                // Me Derisier / admin
  reviewedAt      DateTime?
  rejectionReason String?
  payslipId       String?                // une fois inclus dans une paie
  createdAt       DateTime @default(now())
  @@index([cabinetId, employeeId, status])
  @@index([cabinetId, status])
}
```

### Flux
1. **Aaliyah soumet** (menu « Mon temps & ma paye ») : date + heures + (option) dossier + note → `submitted`.
2. **Me Derisier voit** dans `employees/[aaliyah]` → onglet Paie (+ badge « heures à approuver ») :
   **approuve** (`approved`) ou **rejette** (`rejected` + raison).
3. Les heures **approuvées** d'une période s'**agrègent dans un `Payslip`** (`hoursWorked` = somme,
   `hourlyRate` = `Employee.hourlyRate`, `grossPay` calculé). → la paie existante prend le relais.
4. Payslip payé → entrées passées à `paid`.

### Services / actions / UI
- Aaliyah : `submitEmployeeHours(...)`, `withdrawEmployeeHours(id)` (tant que `submitted`).
- Admin/avocate : `approveEmployeeHours(id)`, `rejectEmployeeHours(id, reason)`,
  `rollHoursIntoPayslip(employeeId, periodId)`.
- UI Aaliyah : `components/temps/MyHoursPanel.tsx` — saisie rapide + liste de ses soumissions
  (status pills SAFE) + total période + **« expected pay »**.
- UI Me Derisier : intégré à `EmployeePayrollTab.tsx` — « X heures à approuver » + approbation 1-clic
  + génération du payslip.
- Permissions : soumettre = l'employée ; approuver/payer = admin/avocate. Scope `cabinetId`, traçable, immuable après approbation.

> **Rémunération configurable** (cf. §0) : `Employee.hourlyRate` existe ; les règles fines
> (déductions, heures sup, période, lien aux dossiers) seront confirmées avec Me Derisier.

---

## 8. Notifications calmes (anti-surcharge)

Règle (cf. vision §10) :
- **Immédiat** (in-app cloche, rare) : `sent_back` à échéance proche, échéance bloquante J-1.
- **Digest quotidien** (défaut) : tout le reste, 1 résumé/jour par personne (assistante & avocate).
- **Silence** : jamais de notif pour un message non daté/non actionnable.
- MVP : compteur in-app `needs_me` + digest courriel quotidien (réutilise `notification-service` /
  `NotificationLog`). Préférence on/off par utilisateur. **Pas de push.**

---

## 9. i18n, tests, conformité

- i18n FR/EN (`navetteUi`, `todayUi`) — EN par défaut pour Aaliyah ; respect du glossaire.
- Tests : service navette (permissions par type + scope cabinet + unification des deux sources),
  `getNavetteInbox` (filtres/needs_me), agrégat reconnaissance, helpers purs. `tsc` + suite verte + `next build`.
- Conformité Barreau : append-only, traçable (AuditLog), confidentialité cloisonnée, frontière des rôles.
- **dev = prod** : migration additive prudente (nouveau modèle + enum), testée, aucune donnée détruite.

---

## 10. Découpage (lots livrables)

| Lot | Contenu | Dépend de | Migration |
|---|---|---|---|
| **N1 — Navette modèle+service** | `DossierNavetteMessage` + service + actions + permissions + pont signal | — | ✅ (additive) |
| **N2 — Navette UI** | `NavettePanel` + `NavetteThread` + i18n + tests | N1 | — |
| **N3 — Vue avocate** | `LawyerGlance` / élargir `ReadyForReviewInbox` (approve / send back) | N1 | — |
| **N4 — Écran Today** | route `aujourdhui` + composition (brief, next action, focus, deadlines, awaiting, recognition) | N2 | — |
| **N5 — Capture rapide + Mode focus** | ⌘K + focus toggle | N4 | — |
| **N6 — Chrono passif** | `BillableTimer` → entrée de temps | N4 | — |
| **N7 — Notifications calmes** | needs_me badge + digest quotidien + préférences | N1 | éventuelle (prefs) |
| **N8 — Mon temps & ma paye** | `EmployeeHoursEntry` + soumission Aaliyah + approbation dans `EmployeePayrollTab` + roll-into-payslip | module paie existant | ✅ (additive) |

*(N4 « Écran Today » inclut le **menu/navigation** d'Aaliyah : Today · Navette · Mes dossiers · Facturation · Mon temps & ma paye.)*

**Recommandation de démarrage** : **N1 → N2 → N4** (la Navette + le dashboard = le cœur ressenti),
puis **N8** (soumission d'heures — autonome, fort besoin concret : sa paye), puis N3 (vue avocate),
puis N5/N6/N7. **Migrations DB : N1 et N8 seulement** (additives, testées) ; tout le reste est composition/UI.

---

## 11. Définition de « terminé » (pour le cœur N1-N4)

1. Aaliyah ouvre `/aujourdhui` : brief, **une** prochaine action, Navette avec `needs_me` en tête,
   focus, deadlines, reconnaissance — en anglais, thème SAFE, zéro emoji.
2. Me Derisier peut **renvoyer un dossier** (raison + échéance) et **approuver** ; Aaliyah le voit
   instantanément dans la Navette et peut répondre / corriger / relancer le client.
3. Aaliyah peut **marquer un dossier prêt pour revue** ; l'avocate le voit dans sa « 15-sec view ».
4. Tout est scopé cabinet, traçable, bilingue. `tsc` + tests + `next build` verts. Migration additive testée.
```
