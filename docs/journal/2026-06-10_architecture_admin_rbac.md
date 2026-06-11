# 2026-06-10 — Architecture Administration / RBAC / Readiness (analyse, pas de code)

## Demande CEO
Analyse complète + architecture du volet Administration (Paramètres, Équipe, Rôles, Abonnement,
Console SAFE, Conformité, Paie). Livrable : rapport structuré (diagnostic, risques, doctrine,
readiness engine, matrice RBAC, UX, technique, modèle de données, règles, tests, plan priorisé).

## Buildé
- `docs/admin/ARCHITECTURE_ADMIN_RBAC.md` — rapport complet (12 sections, 343 lignes), ancré fichier:ligne.

## Méthode
Workflow : 7 auditeurs parallèles sur le vrai code (paramètres, dualité rôles, sur-permissions,
invitations, audit RH + paie, Stripe/Console, socle audit + readiness) → 1 agent de synthèse rédige
le rapport. 2 claims critiques spot-vérifiés à la main avant présentation.

## Diagnostic — 5 CRITIQUES confirmés (vérifiés en code)
1. **Page Rapports sans garde de rôle** (`rapports/page.tsx:26` = `requireCabinetId()` seul) → tout
   compte voit revenus, rentabilité nominative par avocat, taxes, fidéicommis. Idem `comptabilite`,
   `journal/general`, `journal/depenses` (URL directe sert la page ; la nav qui « cache » ne protège pas).
2. **Console gardée par NOM de cabinet, pas par rôle interne** (`console/layout.tsx:20` →
   `isSafeIncCabinet` = `cabinet.nom === "SAFE"`, `safe-inc.ts:19`). Tout compte du cabinet SAFE
   (même assistante/comptabilite) accède à la Console = données de TOUS les clients. Pire :
   `requireSafeSuperadmin` lui-même ne checke que le nom, et n'est jamais appelé.
3. **Portail Stripe sans `canManageCabinetSettings`** (`api/stripe/portal/route.ts`) alors que la route
   checkout sœur le fait → 3 rôles sur 4 ouvrent le portail (changer carte, annuler).
4. **NAS stocké en clair** (`schema.prisma:218`), exportable PDF par tout éditeur d'employés.
5. **Paie = estimation brute présentée comme paie** : `grossPay = hours*rate`, `deductions = 0` en dur,
   `netPay = grossPay` (`employees/actions.ts:283-287`). Colonnes Brut/Déductions/Net sans avertissement
   sur l'écran courant ; disclaimer honnête seulement en fin d'année.

## Diagnostic — majeurs
- **Dualité de rôles non réconciliée** : `UserRole` (4) garde l'app (~85 fichiers), `EmployeeRole` (7)
  matrice quasi décorative (la session ne porte que UserRole ; `canModule` n'a aucun appelant). Le
  mapping de secours ouvre des droits non décidés (comptabilité édite des employés, `rbac.ts:106`).
  INTERN/READ_ONLY non connectables (pas d'équivalent UserRole) et la liste d'équipe ne le signale pas.
- **Page Paramètres ment** : devise « CAD », taxes « TVH 13 % (Ontario) », mode « Forfait » en dur ;
  Cayard QC voit « Ontario ». Rétention « En vigueur » dès `count > 0` (pas de couverture). Abonnement =
  token Stripe brut. Les moteurs corrects existent et sont utilisés ailleurs (`describeTaxConfig`,
  `getCabinetSubscriptionState`), juste pas branchés ici.
- **Invitations** : rôle non validé contre liste blanche, aucun audit, pas de révocation/statut,
  `compensation` renvoyée en clair au GET public, User créé sans Employee lié.
- **Aucune action RH admin journalisée** (création, rôle, taux, NAS, statut paie).

## Cible (synthèse rapport)
- **Doctrine** : statut calculé jamais codé en dur · preuve avant « conforme » · séparation
  employé/utilisateur/accès/rôle effectif · moindre privilège · audit des actions sensibles · une seule
  source de règles · « le menu cache, il ne protège pas ».
- **Administrative Readiness Engine** : `lib/admin/readiness/`, service pur testable, 5 états
  (complete/to_complete/warning/blocking/not_applicable), 14 domaines, jamais `complete` sans preuve.
- **RBAC** : une seule échelle de rôles effectifs (EmployeeRole), persistée en session ; matrice cible
  7 rôles ; superadmin SAFE = rôle interne distinct (pas le nom de cabinet).
- **Paie** : à court terme, ÉTIQUETER « estimation non conforme » partout ; vraie paie canadienne
  (RRQ/AE/RQAP/impôts/CNESST/vacances/part employeur) = déléguer à un fournisseur, pas réimplémenter.

## Plan priorisé (dans le rapport)
P0 sécurité critique (gardes de page + Stripe + Console rôle interne + validation invitation) ·
P1 UI/statuts calculés · P2 readiness engine · P3 normalisation RBAC · P4 audit RH ·
P5 conformité documentaire (rétention province-aware, révocation invitation) · P6 paie (étiquetage + NAS chiffré).

## P0 sécurité — LIVRÉ (décision CEO : « P0 sécurité »)
Tous les trous exploitables fermés, build vert, 9 tests auth verts.
- **Gardes de page financières** : nouveau helper `lib/auth/page-guard.ts` `requirePageAccess(allow)`
  (redirige vers /tableau-de-bord si rôle non autorisé). Appliqué à `rapports`, `comptabilite`,
  `journal/general`, `journal/depenses`. La page enforce désormais la MÊME politique que la nav
  (fini l'accès par URL directe).
- **`canViewReports`** : le blanc-seing `return true` remplacé par admin/avocat/comptabilité.
  **Changement de politique flaggé** : l'ASSISTANTE perd l'accès aux Rapports (rentabilité nominative
  par avocat = donnée de gestion). Réversible en une ligne si la cliente en a besoin.
- **`canViewComptabilite`** (nouveau, = `canManageExpenseJournal || canManageInvoices`) : garde
  comptabilité/journaux. Identique au prédicat de nav → zéro régression (avocat déjà exclu par la nav).
- **Portail Stripe** (`api/stripe/portal/route.ts`) : ajout `canManageCabinetSettings` → admin SEUL
  (avant : 3 rôles sur 4 pouvaient changer la carte / annuler).
- **Console** (`console/layout.tsx`) : exige désormais `isSafeIncCabinet` ET `canManageCabinetSettings`
  (admin). Un compte non-admin du cabinet SAFE ne voit plus les données de tous les clients. Étape
  minimale ; rôle interne distinct (`User.isInternal`) = P3.
- **Invitation** (`api/team/invite/route.ts`) : validation Zod stricte, `role` ∈ liste blanche des 4
  UserRole (avant : rôle pris du JSON sans validation). Courriel validé + normalisé. 400 propre.
- **Test** : `lib/auth/__tests__/permissions-p0-security.test.ts` (canViewReports, canViewComptabilite,
  canManageCabinetSettings). Vérifié : `npm run build` exit 0.

## Ajustement post-P0 (décision CEO)
- L'assistante GARDE l'accès aux Rapports : `canViewReports` repassé à 4 rôles (plus de `return true`
  aveugle quand même : un rôle hors des 4 est refusé). Test mis à jour.

## P1 — page Paramètres : statuts calculés — LIVRÉ
Fin de la « page qui ment ». Tout dérive désormais du vrai état du cabinet (build vert, parité i18n 3179=3179).
- **Devise** : `config.devise ?? "CAD"` (plus de « CAD » en dur).
- **Taxes** : `describeTaxConfig(getCabinetTaxConfig(CabinetInterface.modules, province))`. **Cayard (QC)
  affiche enfin « TPS 5% + TVQ 9,975% »** au lieu de « TVH 13 % (Ontario) ». Derisier (ON) → « HST 13% ».
- **Mode de facturation** : lu depuis `CabinetInterface.modules.facturation.principal` (forfait/horaire/mixte),
  helper `readBillingPrincipal`. (Piège corrigé : `modules` est sur CabinetInterface, pas Cabinet.)
- **Abonnement** : moteur unifié `deriveCabinetSubscriptionState` → statut traduit (Actif/Essai/Paiement en
  retard/Résilié/Impayé/Incomplet), badge à variante (success/error/warning), mention « se termine le … » si
  résiliation programmée. Fini le token Stripe brut `past_due` affiché à l'utilisateur.
- **Rétention** : le badge ne dit plus « En vigueur » sur une seule politique (mensonge de conformité). Il dit
  « Partiel » (neutre) si ≥1 politique, « À cadrer » si 0. La vraie couverture par type = readiness engine (P2).
- i18n : +10 clés (fr/en) : statusPartial, billingModeHourly/Mixed, 6 statuts d'abonnement, subscriptionEndsOn.
- **Vérifié** : `npm run build` exit 0 · parité i18n stricte.

### Reste de P1 — LIVRÉ (build vert, parité i18n 3108=3108, tsc --noEmit propre)
- **Colonne « Accès » dans la liste d'équipe** (`/employees`). Nouvel état CALCULÉ par employé, jamais figé :
  - `connected` (vert) : compte de connexion lié (`Employee.userId`).
  - `pending` (ambre) : actif + rôle connectable mais aucun compte → **à inviter**.
  - `no_access` (gris) : rôle SANS équivalent portail (`INTERN`, `READ_ONLY`) → voulu, pas un oubli.
  - `inactive` (gris pâle) : employé désactivé sans compte.
  - Source de vérité du mapping rôle RH → rôle portail extraite dans **`lib/employees/access.ts`**
    (`EMPLOYEE_ROLE_TO_USER_ROLE`, `deriveEmployeeAccess`), réutilisable par le futur flux d'invitation.
    Découverte clé : `EmployeeRole` (7 valeurs) ≠ `UserRole` (4 valeurs portail) ; INTERN/READ_ONLY n'ont
    aucun login possible, ce que la liste ne signalait pas avant.
- **Bandeau « estimation seulement »** sur l'onglet Paie (`EmployeePayrollTab`). Dès qu'au moins un bulletin
  existe, un `Alert variant=warning` explique que les montants sont le BRUT (heures × taux), que les déductions
  à la source (RRQ, AE, RQAP, impôts) ne sont pas calculées (« Déductions » = 0, « Net » = brut), et qu'une
  paie conforme passe par un service agréé (Payworks, Desjardins). Fini le tableau qui ressemble à une vraie
  paie avec 0 $ de déductions. (Le calcul réel reste P6 : vraie paie canadienne + NAS chiffré.)
- i18n : +11 clés fr/en (payrollEstimateTitle/Body, tableHeaderAccess, 4 libellés d'accès + 4 hints).
- **Vérifié** : `npm run build` exit 0 (33,9 s) · `tsc --noEmit` propre · parité i18n stricte.

### FRICTION BLOQUANTE RÉCURRENTE : disque du poste
Le disque est resté à ~100 % (780 Mo libres) toute la session. Il a fait échouer plusieurs builds et a
carrément BLOQUÉ toute écriture en milieu de P1 (ENOSPC sur édition ET sur sortie de commande). Le cache
webpack échoue à chaque build. **À traiter en priorité hors-code** : libérer plusieurs Go (vider la
Corbeille, Téléchargements, gros fichiers), sinon les prochaines sessions casseront de la même façon.

## P2 — Administrative Readiness Engine (incrément 1) — LIVRÉ
Fondations du moteur de readiness + domaine phare **Rétention** avec couverture RÉELLE par type.
Build vert (41 s), `tsc --noEmit` propre, **12 tests verts**, parité i18n 3110=3110.

### Moteur (`lib/admin/readiness/`)
- **Service pur, testable** : loader (seul à toucher Prisma) → `CabinetReadinessSnapshot` → domaines
  purs `(snapshot) => DomainResult` → `assembleReport`. 5 états (complete/to_complete/warning/blocking/
  not_applicable).
- **Règle d'or codée** (`enforceEvidenceRule`) : un domaine ne reste `complete` que si TOUS ses checks
  passent ET portent une `evidence` non nulle. Tout `complete` non prouvé est rétrogradé en `to_complete`.
  C'est la traduction technique de « jamais conforme sans preuve ». Testé explicitement.
- **Score** 0-100 sur les domaines applicables (not_applicable exclus) + tri blocking/warning pour l'UI.
- **4 domaines réels** ce tour : Identité, Province (blocking si absente), Abonnement (état dérivé, jamais
  le token Stripe brut), **Rétention**. Les 10 autres domaines de la spec §5.2 sont listés dans
  `PENDING_DOMAINS` (transparence : jamais comptés « complete » par défaut).

### Domaine Rétention (la demande CEO)
- **Couverture réelle par type requis**, pas un `count > 0`. Pour chaque type requis dans la province :
  existe-t-il une politique ? sa durée atteint-elle le minimum ? Matching tolérant (minuscules, accents
  retirés, alias) → « Pièce d'identité » reconnaît `piece_identite`.
- États : 0 couvert → `to_complete` ; partiel (ex. 3/7) → `to_complete` + liste des manquants ;
  complet + durées suffisantes → `complete` (preuve « 7/7 ») ; complet mais une durée sous le minimum →
  `warning`. Override province : fidéicommis ON = 10 ans.
- **Page Paramètres branchée** : le badge Conformité dérive maintenant de l'état du domaine (À cadrer /
  Partiel / À revoir / Complète), et la ligne montre « X / N types requis couverts » au lieu d'un compte brut.
- i18n : +2 clés fr/en (`statusReview`, `complianceRetentionCoverage`).

### ⚠️ Dette assumée : référentiel des types requis = PROVISOIRE
`lib/admin/readiness/retention-requirements.ts` contient une table de **minima prudents** (7 types, bases
légales Barreau QC B-1 r.5 / ARC / Loi 25 / LSO By-Law 9). Le fichier canonique de la KB
(`Delivery Syst/knowledge-base/modules-safe/documents/archivage-retention.md` + `types-par-domaine.md`)
**ne s'est pas téléchargé d'iCloud** de toute la session. La LOGIQUE du moteur est indépendante de ces
valeurs : seule la table bougera à la réconciliation. **À FAIRE quand le fichier KB sera lisible** :
remplacer la table par les vrais types + durées + bases légales, et aligner les clés sur la taxonomie
SAFE. (Décision CEO : « ce que tu me recommandes » → provisoire + réconcilier après.)

## P2 — incrément 2 : 6 domaines de plus + la bande de risques visible — LIVRÉ
Build vert (52 s), `tsc` propre, **20 tests verts**, parité i18n 3130=3130.

### 6 nouveaux domaines (10 réels au total ; PENDING = billing, trust, user_access, console)
- **Taxes** (§5.2.3) : numéros d'inscription cohérents avec le mode de la province (HST seul / TPS+TVQ / TPS).
  `to_complete` (pas blocking) si manquants : l'inscription est facultative sous 30 000 $.
- **Équipe** (§5.2.6) : au moins un employé actif.
- **Rôles** (§5.2.8) : `blocking` si aucun admin ; **`warning` si un rôle non connectable (stagiaire /
  lecture seule) a quand même un compte de connexion** — exactement le trou que la colonne « Accès » de P1
  a mis en lumière. Réutilise `employeeRoleCanLogin` (P1) : P1 et P2 partagent la même source de vérité.
- **Journal d'audit** (§5.2.11) : `complete` si le socle écrit (preuve = date de la dernière entrée).
- **Sécurité** (§5.2.12) : démarre HONNÊTEMENT en `to_complete` (aucun champ MFA au modèle), jamais
  `complete` sans contrôle mesurable. Application directe de la doctrine de preuve.
- **Onboarding** (§5.2.13) : agrège les bloquants restants (dérivé des autres domaines).

### Bande « Préparation administrative » en tête de Paramètres (spec §7)
- Nouveau composant serveur `AdminReadinessStrip` : score /100, compteurs « X à corriger / Y à surveiller »,
  puis la liste des domaines bloquants puis en avertissement, **chacun cliquable vers la surface à corriger**
  (province→cabinet, taxes→facture, rôles→employés, rétention→rétention, etc.).
- **Texte visible 100 % i18n** (+20 clés fr/en : chrome + 14 titres de domaines). Le détail dynamique des
  actions (FR, généré par le moteur) n'est pas affiché dans la bande pour rester i18n-propre.
- Page branchée sur `getCabinetReadiness(cabinetId)` (un seul rapport alimente la bande ET le badge rétention).
- **Snapshot/loader étendus** : employés (rôle/statut/userId), nombre d'admins, dernière entrée d'audit,
  numéros de taxes. Le moteur reste pur (le loader est le seul à toucher Prisma).
- Tests : +8 cas (taxes QC/ON, rôles sans admin, rôle non connectable avec compte, équipe, audit, sécurité,
  onboarding). Total readiness = 20 verts.

## P2 — incrément 3 : les 4 derniers domaines — P2 CLOS
Build vert (40 s), `tsc` propre, **24 tests verts**, `PENDING_DOMAINS = []`. Les 14 domaines de la spec §5.2
sont branchés.
- **Facturation** (§5.2.4) : `to_complete` tant que le gabarit n'est pas personnalisé (mention ou signature).
- **Fidéicommis** (§5.2.5) : réutilise `getTrustReconciliationStatus` (échéance 25 j, B-1 r.5 / By-Law 9).
  `not_applicable` si aucune activité fiduciaire ; **`blocking` si rapprochement en retard** (le vrai risque
  Barreau). Aucune réimplémentation : le moteur consomme le service existant.
- **Accès utilisateurs** (§5.2.7) : `warning` si des comptes User n'ont pas d'Employee lié (à rattacher ou
  révoquer). Calcul : totalUsers − comptes liés (Employee.userId).
- **Console SAFE** (§5.2.14) : `not_applicable` hors cabinet SAFE ; **`blocking` pour SAFE tant que la garde
  Console repose sur le NOM du cabinet** plutôt qu'un rôle interne distinct. Le moteur pointe lui-même vers la
  dette P3.
- Loader étendu (compte d'utilisateurs + statut fiduciaire) ; `isSafeInc` dérivé de `cabinet.nom` sans requête
  de plus. Tests : +5 cas. Strip déjà prête (titres/routes des 14 domaines).

### Reste hors P2
- i18n de la copie dynamique du moteur (actions/evidence) si on veut l'afficher en EN (la bande visible est
  déjà i18n ; seules les chaînes générées par le moteur restent FR).
- Réconciliation KB du référentiel rétention (chip de tâche posé).
- Suite logique : **P3** (normalisation RBAC : rôle interne `User.isInternal`, échelle de rôles effectifs),
  qui débloquerait honnêtement le domaine Console.

## P3 — normalisation RBAC (incrément sûr) — LIVRÉ
Zone la plus sensible (auth = ~85 fichiers). J'ai pris le chemin prudent : un correctif sécurité net,
des tests qui verrouillent la matrice, et un ADR qui sort les VRAIS choix de politique du périmètre
autonome. Build vert, **22 tests auth verts** (13 RBAC neufs + 9 existants intacts).

### Découverte : la matrice existe déjà, mais « quasi décorative »
`lib/auth/rbac.ts` contient déjà `ROLE_MODULE_PERMISSIONS` (clé EmployeeRole) + `can()` +
`getEffectiveRole`. `permissions.ts` y délègue DÉJÀ `canViewEmployees/Create/Edit`. P3 n'est donc pas
« construire la matrice » mais « la rendre correcte et juge unique ».

### Correctif sécurité APPLIQUÉ : comptabilité sans accès employés
La matrice donnait à `ACCOUNTING_TECHNICIAN` (= compte `comptabilite`) `view/create/edit` sur
`employees`. Comme `canEditEmployees` délègue à la matrice et garde TOUTES les mutations d'employés +
la paie, **un compte comptabilité pouvait créer / modifier / supprimer des employés et lancer la paie**.
Corrigé : `employees: []` (conforme cible §6.1). La comptabilité garde ses accès comptables.
**Changement de comportement live, flaggé et réversible** (comme l'ajustement assistante de P0).

### Ce que je n'ai PAS fait (volontairement) — voir ADR-010
- Les autres divergences matrice ↔ cible §6.1 (avocat→clients edit, avocat→paiements) sont des CHOIX
  de politique, pas des bugs : décisions CEO, jamais flippées en silence.
- `User.isInternal` (garde Console par rôle interne, débloque le domaine readiness Console) = migration
  Prisma → à faire AVEC le CEO (dérive repo↔prod sensible ; base injoignable en build cette session).
- Persistance du rôle effectif en JWT/session = touche le chemin d'auth, à isoler.
- Dédup du mapping rôle→portail (`access.ts` P1 ↔ `rbac.ts`) : valeurs identiques, juste dupliquées.

### Livré
- `lib/auth/rbac.ts` : correctif comptabilité→employees.
- `lib/auth/__tests__/rbac.test.ts` : 13 tests (matrice bien formée, accès complet admin, correctif
  comptabilité + effet vivant « seul l'admin édite les employés », droits par rôle, rôle effectif,
  mappings, connectabilité).
- `docs/journal/decisions/ADR-010-normalisation-rbac.md` : décision + roadmap P3 restante.

## P4 — Audit des actions RH / paie — LIVRÉ
Avant : `employees/actions.ts` ne journalisait **rien**. Créer un employé, changer un rôle, un taux, un
NAS, lancer la paie : aucune trace. Trou de conformité ET de sécurité (et le domaine readiness « Journal
d'audit » s'appuie justement là-dessus). Aucune migration : `AuditEntityType` est une colonne String.
Build vert (48 s), `tsc` propre.
- **`AuditEntityType`** étendu : `Employee`, `User`, `Invitation`, `Payslip`.
- **6 mutations instrumentées** via `createAuditLog` :
  - `createEmployee` → audit `Employee:create` (+ `User:create` si compte de connexion créé). La transaction
    renvoie désormais les ids créés.
  - `updateEmployee` → audit `Employee:update` avec **diff des champs sensibles** (rôle, taux, statut,
    courriel) en oldValues/newValues.
  - `updateEmployeeYearEndInfo` → audit `Employee:update`. **SÉCURITÉ : le NAS n'est JAMAIS journalisé en
    clair** ; on logge seulement `sinPresent: Boolean(...)` (présence, pas la valeur). Vérifié au grep.
  - `generatePayslipForEmployee` → audit `Payslip:create|update` (montants = estimation brute, cf. P1).
  - `updatePayslipStatus` → audit `Payslip:update` (ex. marqué « payé »), old/new status.
  - `addPayslipAdjustment` → audit `Payslip:update` (bonus/déduction/correction), old/new netPay.
- Chaque entrée porte `userId` (l'auteur, depuis `requireCabinetAndUser`).
- **Vérifié** : `npm run build` exit 0 · `tsc` propre · grep anti-fuite NAS OK.

### Reste hors P4
- Idéalement : audit aussi de l'envoi/acceptation d'invitation (→ piste « Sécurité invitations »).
- NAS chiffré au repos (P6) reste à faire ; P4 ne fait que ne pas l'exposer dans l'audit.

## Sécurité invitations — LIVRÉ
Build vert (24 s), `tsc` propre. Migration-free.
- **Fuite de compensation bouchée** : la route PUBLIQUE `GET /api/team/invite/[token]` (gardée par le seul
  token) renvoyait `compensation` en clair (taux horaire + facturable). Retirée de la réponse. Le serveur
  l'utilise toujours côté POST pour créer le compte ; le porteur du lien ne la voit plus. Vérifié : la page
  d'acceptation (`rejoindre/[token]`) ne lisait pas ce champ → zéro régression.
- **Traçabilité (réutilise l'entityType `Invitation` de P4)** :
  - Envoi (`POST /invite`) → audit `Invitation:create` (qui invite qui, à quel rôle ; jamais la compensation).
  - Acceptation (`POST /invite/[token]`) → audit `User:create` (via invitation) + `Invitation:update` (accepté).

### Reste (flaggé, non fait — pas atteignable sans plus de surface)
- **Révocation / statut d'invitation** : faisable sans migration (le modèle a `expiresAt`/`acceptedAt` ;
  révoquer = `expiresAt = now`, pattern déjà utilisé à l'envoi). MAIS il n'existe AUCUNE UI de gestion des
  invitations pour déclencher l'action → à coupler avec une liste d'invitations (nouvelle surface).
- **Compte sans employé lié** : l'acceptation crée un `User` SANS `Employee` (≠ `createEmployee` qui crée les
  deux). C'est précisément l'état « compte orphelin » que le domaine readiness `user_access` signale en
  `warning`. Le corriger (créer l'Employee lié à l'acceptation) fermerait le gap, mais c'est un changement de
  comportement dans le chemin critique de création de compte → à faire avec test du flux d'acceptation.

## P3 — consolidation RBAC (dédup + analyse) — LIVRÉ
Le « dernier morceau » constructible sans décision ni migration. Build vert (26 s), **52 tests verts**
(auth + employees + readiness). Détail dans ADR-010.
- **Dédup du mapping** (FAIT) : `lib/employees/access.ts` ne garde plus de table dupliquée. La
  `EMPLOYEE_ROLE_TO_USER_ROLE` (P1, aucun consommateur externe) est supprimée ; `employeeRoleCanLogin`
  délègue à `rbac.canEmployeeRoleSignIn`. **Source unique = `lib/auth/rbac.ts`.** Valeurs identiques →
  zéro changement de comportement. Verrouillé par `lib/employees/__tests__/access.test.ts` (égalité
  access.ts ↔ rbac.ts sur les 7 rôles).
- **Découverte importante** (pourquoi la migration helper→matrice N'EST PAS un simple refactor) :
  1. La matrice et les helpers plats **divergent sur de vraies cellules** (ex. `canEditClients` autorise
     l'avocat, mais la matrice `LAWYER.clients = VIEW_ONLY`). Migrer = choisir la matrice contre le
     comportement live = **décision**, pas délégation.
  2. `getEffectiveRole` rabat tout rôle inconnu sur `READ_ONLY` (vue sur tout). Migrer les helpers à
     liste blanche **régresserait le durcissement P0** (« refuser l'inconnu »). Prérequis : durcir le
     défaut de `getEffectiveRole` AVANT toute migration de helper de lecture.
  → consigné dans ADR-010 §2. La migration des helpers reste un chantier gardé par décisions, pas un
  refactor mécanique. Ne PAS le faire en aveugle.

## À confirmer (CEO)
- **P3 — comptabilité perd l'accès employés** : OK (sécurité) ou la comptable gère-t-elle la RH ? (revert 1 ligne)
- **P3 — divergences matrice §6.1** (avocat édite clients ? avocat voit paiements ?) : à trancher (ADR-010).
- **P3 — migration `User.isInternal`** pour la garde Console : à planifier ensemble (touche la prod).
- **Réconciliation KB rétention** : à relancer dès que `archivage-retention.md` redevient lisible (iCloud).
- Suite : P1 (UI/statuts calculés, fin des cartes trompeuses), ou P2 (readiness engine), ou pause ?
- Reste de P0 non bloquant reporté : scoper les `findUnique` des pages Console enfants au workspace
  (défense en profondeur), audit de l'envoi/acceptation d'invitation (→ P4), `compensation` en clair
  dans la réponse publique d'acceptation (→ P5).
- Disque du poste toujours ~100 % plein (warning cache webpack au dernier build).

## Graine de contenu (build-in-public)
« On a audité notre propre SaaS pour les trous de sécurité AVANT qu'un client en pâtisse. On a trouvé
qu'un compte assistante pouvait voir tous les revenus du cabinet par simple URL. Voilà pourquoi un
logiciel pour avocats doit refuser par défaut, et ne jamais afficher conforme sans preuve. » → content-bank.
