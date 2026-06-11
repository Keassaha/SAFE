# Architecture Administration de SAFE : RBAC, readiness et doctrine de preuve

> Avertissement non juridique. Ce document est une analyse technique et architecturale interne. Il ne constitue pas un avis juridique ni un avis de conformité réglementaire. Les références au Barreau du Québec, au LSO (Ontario), à PIPEDA, à la Loi 25 ou à la fiscalité de paie servent à cadrer le risque produit. Faites valider toute exigence de conformité réelle par un conseiller qualifié de la province concernée.

> Doctrine produit fondatrice. SAFE ne doit jamais afficher « conforme » sans preuve suffisante. Un statut est calculé à partir de données vérifiables, jamais codé en dur ni déduit d'une simple présence. Tout ce document découle de cette règle.

Périmètre : modèle de rôles (UserRole et EmployeeRole), page Paramètres, invitations d'équipe, RH et paie, API Stripe, Console SAFE interne, journal d'audit, et conception d'un Administrative Readiness Engine. Chaque diagnostic est ancré dans le code réel, fichier:ligne.

---

## 1. Résumé exécutif

Quatre risques dominent, du plus grave au plus structurant.

**Risque 1 : sur-permissions sur les chiffres financiers, le temps et l'audit.** Trois helpers retournent `true` pour tout le monde : `canViewReports` (`lib/auth/permissions.ts:146-148`), `canManageTimeEntries` (`:88-90`), `canViewAuditLog` (`:185-187`). Le plus grave est la page Rapports : `app/(app)/rapports/page.tsx:26` n'appelle que `requireCabinetId()`, sans aucun garde de rôle. Tout compte connecté accède aux revenus du cabinet, à la rentabilité par avocat nominative (`lib/rapports/load.ts:302-310`) et par dossier (`:336-349`), aux taxes collectées et au solde fidéicommis. Même classe de trou pour `app/(app)/comptabilite/page.tsx:7` et `app/(app)/journal/general/page.tsx:6` : la navigation cache l'entrée, mais l'URL directe sert la page car aucune page ne revérifie le rôle. La nav qui « cache » n'est pas une protection.

**Risque 2 : dualité de rôles non réconciliée, avec des rôles non connectables.** Il existe deux modèles : `UserRole` (4 valeurs : admin_cabinet, avocat, assistante, comptabilite) et `EmployeeRole` (7 valeurs, matrice riche dans `lib/auth/rbac.ts`). La session ne transporte que `UserRole` (`lib/auth.ts:53-67` jette `employee` après le seul contrôle de statut actif). La matrice `EmployeeRole` n'est donc évaluée avec le vrai `Employee.role` qu'à un seul endroit, le tableau de bord (`app/(app)/tableau-de-bord/page.tsx:64-69`). Partout ailleurs, la matrice retombe sur le mapping figé `userRoleToEmployeeRole` (`rbac.ts:155-163`). Effet de bord non voulu : un compte `comptabilite` peut créer et éditer des employés, car le mapping le projette sur `ACCOUNTING_TECHNICIAN` dont la matrice autorise `employees: ["view","create","edit"]` (`rbac.ts:106`), et `createEmployee`/`updateEmployee` ne gardent que sur ce droit (`app/(app)/employees/actions.ts:36,117`). Par ailleurs, INTERN et READ_ONLY n'ont aucun équivalent `UserRole` (`employeeRoleToUserRole` renvoie null, `rbac.ts:180-188`), donc `canEmployeeRoleSignIn` est false (`:191-193`) : ces employés ne peuvent pas se connecter, et la liste d'équipe ne le signale pas.

**Risque 3 : la Console SAFE interne est protégée par appartenance au cabinet, pas par rôle interne.** `app/(app)/console/layout.tsx:19-24` autorise tout utilisateur dont le cabinet a pour nom « SAFE » (`lib/safe-inc.ts:14-20`, `cabinet.nom === "SAFE"`). Il n'existe aucun rôle interne ni aucun champ `isInternal` sur User ou Cabinet (seul `superadminId` apparaît, et uniquement comme FK du modèle ImpersonationSession, `schema.prisma:3390`). Conséquence : tout compte du cabinet SAFE, y compris `assistante` ou `comptabilite`, accède à la Console complète, donc aux données produit de tous les cabinets clients. `requireSafeSuperadmin` existe (`safe-inc.ts:41-47`) mais n'est jamais appelé. De plus la route portail Stripe (`app/(app)/api/stripe/portal/route.ts:6-31`) n'appelle pas `canManageCabinetSettings`, alors que la route checkout sœur le fait (`checkout/route.ts:16-19`) : 3 rôles sur 4 peuvent ouvrir le portail de facturation du cabinet (changement de carte, annulation).

**Risque 4 : la paie est une estimation brute présentée comme une paie.** Le calcul réel est `grossPay = hours * rate`, `deductions = 0` en dur, `netPay = grossPay` (`app/(app)/employees/actions.ts:283-287`, et `lib/payroll/employee-hours-service.ts:311-348`). Aucune notion de RRQ/RPC, AE, RQAP, impôt, CNESST, vacances ni part employeur nulle part. L'écran de paie courant affiche des colonnes Brut / Déductions / Net sans aucun avertissement (`components/employees/EmployeePayrollTab.tsx:115-119`), et propose même « Employé, T4 (retenues CPP/AE/impôt) » (`EmployeeYearEndPanel.tsx:148`). Le disclaimer honnête n'existe que sur l'écran fin d'année (`YearEndReportClient.tsx:270-278`). Le NAS est stocké en clair, sans chiffrement applicatif (`schema.prisma:218`, écriture brute `actions.ts:194-205`), exportable en PDF par tout éditeur d'employés (`canManagePayroll == canEditEmployees`, `permissions.ts:233-239`). Aucune action RH sensible n'est journalisée : `employees/actions.ts` n'importe jamais `createAuditLog`.

---

## 2. Diagnostic par zone

### Zone A : page Paramètres (états trompeurs)

Constat : plusieurs cartes affichent des valeurs codées en dur ou des champs Stripe bruts au lieu de statuts calculés.

- Devise codée en dur : `app/(app)/parametres/page.tsx:235` `value="CAD"`, alors que `config.devise` existe (`lib/cabinet-config.ts:77`) et que `config` est déjà parsé en mémoire (`page.tsx:177`).
- Taxes codées en dur, et fausses pour le Québec : `page.tsx:236` affiche la clé `billingTaxesHST` figée à « TVH 13 % (Ontario) ». Cayard est en `tps_tvq` (`scripts/seed-cayard.mjs:184`). Le moteur correct existe et est utilisé sur les factures réelles : `describeTaxConfig` (`lib/billing/taxes.ts:288`) + `getCabinetTaxConfigById` (`lib/billing/cabinet-tax-config.ts:15`).
- Mode de facturation non dérivé : `page.tsx:237` affiche « Forfait » figé, sans lire `modules.facturation.principal` (`seed-cayard.mjs:180`).
- Rétention « En vigueur » sur simple présence : `page.tsx:165,272`, le badge passe à « En vigueur » dès `count > 0`, sans vérifier la couverture des types requis (référentiel figé Ontario non branché, `lib/seeds/retention-policies.ts:15-25`).
- Abonnement depuis champs Stripe bruts : `page.tsx:194` recalcule le badge à la main, `:313` affiche le token Stripe brut non traduit (`past_due`, `unpaid`), alors qu'un moteur d'état unifié existe et est déjà utilisé ailleurs : `getCabinetSubscriptionState` (`lib/services/subscription-state.ts:40`).

Pourquoi c'est un risque : la page de configuration ment alors que le reste de l'app calcule juste. Un cabinet québécois lit « TVH 13 % (Ontario) » dans ses propres paramètres. C'est une violation directe de la doctrine de preuve.

Cible : chaque carte affiche une valeur dérivée du snapshot cabinet, avec fallback explicite. Aucune chaîne figée pour devise, taxes, mode de facturation, statut d'abonnement.

### Zone B : modèle de rôles (dualité UserRole / EmployeeRole)

Constat : `UserRole` garde réellement l'app (importé dans ~85 fichiers, sidebar et API), `EmployeeRole` est quasi décoratif. La session ne porte que `UserRole` (`lib/auth.ts:53-67`). `canModule` (`permissions.ts:242-248`), seul pont générique vers la matrice, n'a aucun appelant. `getEffectiveRole` n'évalue le vrai `Employee.role` qu'au dashboard.

Pourquoi c'est un risque : politique de sécurité dédoublée et divergente. Le même module est gardé de façon permissive côté `UserRole` et restrictive côté matrice, selon le chemin de code. La matrice donne une fausse impression de finesse. Le mapping de secours ouvre des droits non décidés (comptabilité qui édite des employés).

Cible : une seule échelle de rôles effectifs, calculée une fois et persistée dans la session, une seule source de règles (voir section 6).

### Zone C : permissions trop larges (reports, temps, audit, comptabilité, journal)

Constat : voir résumé exécutif risque 1. Détail des gardes manquants :

| Page | Garde de rôle | Données exposées |
|---|---|---|
| `app/(app)/rapports/page.tsx:26` | aucun (`requireCabinetId` seul) | revenus, rentabilité par avocat et par dossier, taxes, fidéicommis |
| `app/(app)/comptabilite/page.tsx:7` | aucun | revenus mois/année, dépenses par catégorie |
| `app/(app)/journal/general/page.tsx:6` | aucun | KPI comptables (`calculateJournalBalance`) |
| `app/(app)/journal/depenses/page.tsx:7` | aucun | journal des dépenses |

Nuances honnêtes : pour le temps, le scope ligne reste réduit (`canViewAllTimeEntries`, `permissions.ts:123-125`) et les mutations sont gardées (`api/temps/[id]/route.ts:42,149`). Pour l'audit, le scope est fiable via `canViewFullAuditLog` appliqué dans le `where` Prisma (`api/audit-log/route.ts:28-30`), mais ce scope est dupliqué en dur dans la page (`parametres/audit/page.tsx:27-28`), donc fragile. `canManageTimeEntries` est du code mort permissif (aucun callsite de garde).

Cible : garde de rôle sur chaque page Server Component qui charge des données sensibles, déléguée au service central. Suppression des helpers `=true`. Un seul helper de scope audit, jamais dupliqué.

### Zone D : invitations d'équipe

Constat : flux 100 % API (`app/api/team/invite/route.ts` et `[token]/route.ts`), sans UI de déclenchement ni de révocation. Le rôle n'est validé que par présence (`route.ts:17-21`), jamais contre une liste blanche `z.nativeEnum(UserRole)`. Aucune des opérations n'est journalisée (`createAuditLog` absent de tout `app/api/team`). Le modèle `Invitation` n'a pas de champ `status` énuméré ni de `revokedAt` (`schema.prisma:2648-2664`), et il n'existe aucun endpoint de révocation. À l'acceptation, un `User` est créé sans `Employee` lié (`[token]/route.ts:58-77`), hors transaction avec le marquage `acceptedAt`. `User.email` n'a aucune contrainte d'unicité en base (`schema.prisma:93`), donc le contrôle anti-doublon applicatif n'est pas atomique. Le GET public renvoie `compensation` en clair (`[token]/route.ts:31`).

Pourquoi c'est un risque : escalade horizontale d'admin non bridée (un admin peut inviter un autre admin), aucune traçabilité de la création d'un compte connectable, fuite de données RH, et incohérence avec le volet RH puisque l'invité n'a pas de fiche Employee.

Cible : validation Zod stricte du rôle plus règle métier sur les rôles attribuables, statut d'invitation énuméré, endpoint de révocation, audit des trois opérations, transaction d'acceptation, unicité email en base, suppression de `compensation` de la réponse publique.

### Zone E : RH et paie

Constat : voir résumé exécutif risque 4. Précisions. Le seul flux RH journalisé est côté employé (`mes-heures/actions.ts:54-158`), pas côté admin. `AuditEntityType` (`lib/services/audit.ts:5-21`) ne contient ni `Invitation`, ni `User`, ni `Employee`, donc journaliser exige d'abord d'étendre l'union. Bug réel dans `addPayslipAdjustment` : `delta` agrégé puis inutilisé, `netPay` recalculé à partir du courant, donc dérive sur ajustements multiples (`actions.ts:388-398`).

Cible : audit RH systématique, NAS chiffré au repos avec permission dédiée distincte de l'édition d'employé, étiquetage clair « estimation, non conforme » sur tous les écrans de paie, correction du bug d'ajustement.

### Zone F : API Stripe et Console interne

Constat : voir risques 1 et 3. Pages Console enfants non scopées : `console/clients/[id]/page.tsx:123-134` et `console/support/[id]/page.tsx:28-40` font `findUnique({ where: { id } })` sans filtre tenant, protégées uniquement par le redirect du layout (pas de défense en profondeur). Les server actions Console, elles, revérifient `isSafeIncCabinet` (bon réflexe). Le webhook Stripe vérifie correctement la signature (`app/api/webhooks/stripe/route.ts:20-38`). L'impersonation cross-cabinet n'est pas implémentée : la table existe (`schema.prisma:3388-3403`) mais aucun code ne l'utilise.

Cible : garde de rôle interne sur portail Stripe et sur chaque page Console, `findUnique` scopés au workspace SAFE, impersonation non livrée sans rôle interne fort plus audit systématique.

### Zone G : journal d'audit (socle)

Constat : schéma complet (`schema.prisma:1569-1592`) avec acteur, action, cible, avant/après, horodatage, cabinetId, ip, userAgent, et indexation correcte. Helper centralisé `createAuditLog` (`lib/services/audit.ts:44`) utilisé sur ~70 sites, contourné à 2 endroits (`api/edition/documents/[id]/move/route.ts:52`, `api/edition/upload/confirm/route.ts:90`). Append-only en pratique (aucun update/delete applicatif) mais non garanti par contrainte DB. Unions `AuditEntityType` et `AuditAction` incomplètes face aux ~25 actions métier réellement écrites. Dette de schéma : `performedBy` redondant avec `userId`, `performedAt` nullable inutilisé en lecture.

Cible : socle réutilisable tel quel pour tracer les actions admin et RH, avec unions complétées et, si l'argument « inviolable » est utilisé en vente, une garantie technique réelle (RLS ou chaînage de hash).

### Zone H : signaux de readiness existants

Constat : deux agrégateurs déterministes existent, tous deux orientés risque opérationnel par dossier, pas readiness administrative du cabinet : `/api/conformite` (score 0-100) et `getSecurityAlerts` (`lib/services/security/security-alerts.ts`). Ils sont redondants et divergents (FINTRAC, conflits, rapprochement recalculés des deux côtés). Aucun concept d'onboarding ni de setup au niveau cabinet (`grep onboardingStatus/setupComplete/readinessScore` = 0 résultat). Les données de configuration existent toutes (identité, province, taxes, facturation, équipe, abonnement, rétention) mais ne sont jamais agrégées en signal de readiness.

Cible : un Administrative Readiness Engine pur et testable (section 5), réutilisant le pattern de score de `/api/conformite` et l'accès typé de `parseCabinetConfig`.

---

## 3. Risques (tableau)

| Risque | Domaine | Gravité | Conséquence |
|---|---|---|---|
| Page Rapports sans aucun garde de rôle | Sécurité / autorisation | Critique | Tout compte voit revenus, rentabilité nominative par avocat, taxes, fidéicommis |
| `/comptabilite`, `/journal/general`, `/journal/depenses` sans garde de page | Sécurité / autorisation | Critique | Données financières servies par URL directe à tout rôle |
| Portail Stripe sans `canManageCabinetSettings` | Sécurité | Critique | 3 rôles sur 4 ouvrent le portail de facturation (changer carte, annuler) |
| Console gardée par nom de cabinet, pas par rôle interne | Sécurité multi-tenant | Critique | Tout compte du cabinet SAFE accède aux données de tous les clients |
| NAS stocké en clair, exportable en PDF par tout éditeur d'employés | Sécurité / vie privée | Critique | Renseignement personnel sensible exposé, sans permission dédiée |
| Invitation : rôle non validé, audit absent, pas de révocation | Sécurité / conformité | Majeur | Escalade d'admin, création de compte non tracée, fuite `compensation` |
| Aucune action RH admin journalisée | Conformité / audit | Majeur | Changements de taux, rôle, NAS, statut de paie invisibles |
| Paie présentée comme conforme alors qu'elle est une estimation brute | Conformité / fausse représentation | Majeur | Risque légal de représentation trompeuse côté cabinet |
| Page Paramètres : taxes « Ontario » affichées à un cabinet QC | Confiance / doctrine de preuve | Majeur | Statut faux affiché, érosion de la confiance |
| Dualité de rôles non réconciliée, matrice inerte | Architecture / sécurité | Majeur | Politique dédoublée divergente, droits non décidés (comptabilité édite employés) |
| Pages Console enfants non scopées au tenant | Sécurité | Majeur | Aucune défense en profondeur, lecture par id arbitraire |
| Statut de readiness inexistant, agrégateurs redondants | Conformité / produit | Mineur | Pas de vue d'ensemble de la préparation du cabinet |
| `User.email` sans contrainte d'unicité | Intégrité des données | Mineur | Doublons de comptes possibles en concurrence |
| Scope audit dupliqué page vs API | Cohérence | Mineur | Divergence future si le helper change |
| Append-only non garanti par la DB | Conformité / audit | Mineur | Argument « inviolable » non soutenu techniquement |

---

## 4. Doctrine administrative SAFE

Sept principes, applicables à toute fonctionnalité d'administration.

1. **Statut calculé, jamais codé en dur.** Aucun « CAD », « TVH 13 % », « Forfait », « En vigueur » figé. Toute valeur affichée dérive du snapshot cabinet, avec fallback explicite et visible.
2. **Séparation employé / utilisateur / accès / rôle effectif.** L'Employee (RH) peut exister sans User (connexion). Le User peut être actif ou inactif. Le rôle effectif est calculé une fois, à partir d'une source unique. Ces quatre axes doivent être lisibles dans l'UI, jamais confondus.
3. **Preuve avant « conforme ».** Un domaine n'est « complet » que si une donnée vérifiable le prouve. La simple présence d'un enregistrement ne suffit pas : une politique de rétention isolée ne rend pas la rétention conforme.
4. **Moindre privilège par rôle × module × action.** Aucun helper ne retourne `true` pour tout le monde. Tout accès part d'un refus par défaut, puis ouvre explicitement.
5. **Audit de toute action sensible.** Toute création de compte, tout changement de rôle, de taux, de NAS, de statut de paie, toute action Console et toute impersonation s'écrit dans le journal d'audit, via le helper central.
6. **Une seule source de vérité des règles.** Une seule matrice rôle × module × action, un seul service qui l'évalue, consommé identiquement par l'UI et l'API. Pas de logique de scope dupliquée en dur dans les pages.
7. **Le menu cache, il ne protège pas.** Masquer une entrée de navigation n'est pas une autorisation. La page et l'API revérifient toujours le rôle côté serveur.

---

## 5. Administrative Readiness Engine : conception

### 5.1 Les 5 états

| État | Définition |
|---|---|
| `complete` | Tous les checks du domaine passent, preuve présente et vérifiée. Le seul état qui autorise un libellé positif. |
| `to_complete` | Configuration partielle, aucun risque de conformité immédiat, mais des champs manquent. Invite à compléter. |
| `warning` | Configuration présente mais fragile ou bientôt expirée. Action recommandée, non bloquante. |
| `blocking` | Manque ou anomalie qui empêche une opération réglementée ou expose une donnée. Action requise. |
| `not_applicable` | Le domaine ne s'applique pas au profil du cabinet (province, taille, activité). Exclu du score, jamais affiché « conforme ». |

Règle dure : un domaine n'est jamais `complete` par défaut ni par simple présence. L'absence de preuve donne `to_complete` ou `blocking`, jamais `complete`.

### 5.2 Les 14 domaines

Pour chacun : checks concrets, état attendu, preuve requise.

1. **Identité cabinet.** Checks : `nom`, `adresse`, `email`, `barreauNumero` présents (`schema.prisma:13-18`), logo facultatif. Attendu : `complete` si nom, adresse, email présents. Preuve : valeurs non vides du snapshot.
2. **Province / juridiction.** Checks : `config.province` défini et reconnu (`cabinet-config.ts:81`). Attendu : `blocking` si absent, car il conditionne taxes, rétention et fidéicommis. Preuve : valeur de province retenue.
3. **Taxes.** Checks : si revenus estimés au-dessus du seuil d'inscription, présence de `config.taxNumbers` cohérents avec la province (`cabinet-config.ts:20-29`), et libellé de taxe dérivé par `describeTaxConfig` égal à la province. Attendu : `blocking` si numéros manquants au-dessus du seuil, `not_applicable` sinon. Preuve : numéros enregistrés plus province concordante.
4. **Facturation.** Checks : `config.invoice` (template, mention légale, signature, accent) renseigné (`cabinet-config.ts:63-74`), mode de facturation dérivé de `modules.facturation.principal`. Attendu : `to_complete` si gabarit par défaut non personnalisé. Preuve : config de facture présente.
5. **Fidéicommis.** Checks : compte fidéicommis configuré, dernier rapprochement présent et récent (réutiliser `getReconciliationStatus`). Attendu : `blocking` si rapprochement en retard. Preuve : date et résultat du dernier rapprochement.
6. **Équipe.** Checks : au moins un Employee actif, invitations en attente comptées (`acceptedAt: null`), aucun employé non connectable marqué comme « accès actif ». Attendu : `warning` si invitations expirées en attente. Preuve : comptes Employee plus état des invitations.
7. **Accès utilisateurs.** Checks : chaque User actif rattaché à un Employee, aucun User orphelin, aucun User actif sans rôle. Attendu : `warning` si User sans Employee. Preuve : jointure User ↔ Employee.
8. **Rôles et permissions.** Checks : au moins un `admin_cabinet`, cohérence rôle RH ↔ rôle d'accès, aucun rôle non connectable sur un compte de connexion. Attendu : `blocking` si aucun admin. Preuve : inventaire des rôles effectifs.
9. **Abonnement.** Checks : `getCabinetSubscriptionState(cabinetId)` actif, résiliation programmée signalée, essai bientôt terminé (`subscription-state.ts:40`). Attendu : `blocking` si `past_due`/`unpaid`/`canceled`, `warning` si `cancelAtPeriodEnd`. Preuve : état dérivé, jamais le token Stripe brut.
10. **Rétention documentaire.** Checks : couverture des types de documents requis par province comparée aux `DocumentRetentionPolicy` présentes (`schema.prisma:1699`), pas un simple `count > 0`. Attendu : `to_complete` tant que la couverture est partielle (par exemple 3 sur 9). Preuve : ratio de couverture par type requis.
11. **Journal d'audit.** Checks : audit activé, présence d'écritures récentes, helper central utilisé. Attendu : `complete` si le socle écrit. Preuve : volume d'entrées sur la période.
12. **Sécurité.** Checks : politique de mot de passe, MFA, NAS chiffré au repos. Aujourd'hui aucun champ MFA n'existe au modèle, donc ce domaine démarre en `to_complete` honnête, jamais `complete`. Preuve : présence des contrôles réels.
13. **Onboarding.** Checks : agrégation des domaines bloquants restants au premier setup. Attendu : `to_complete` tant qu'un domaine bloquant subsiste. Preuve : liste des domaines non `complete`.
14. **Console SAFE interne.** Checks (cabinet SAFE uniquement) : accès Console gardé par rôle interne, pages scopées au workspace, impersonation auditée si activée. Attendu : `blocking` tant que la garde repose sur le nom de cabinet. Preuve : présence d'un rôle interne et d'un garde de rôle.

### 5.3 Architecture technique du moteur

- Emplacement : `lib/admin/readiness/`. Service pur, sans appel Prisma direct dans la logique de décision.
- Entrée : un `CabinetReadinessSnapshot` (objet simple, assemblé par un loader séparé qui lit Prisma et `parseCabinetConfig`). Le moteur ne connaît que ce snapshot.
- Sortie : `ReadinessReport` = liste de `DomainResult { domain, state, checks: CheckResult[], evidence }`, plus un score agrégé qui exclut les domaines `not_applicable`.
- Règle d'or codée dans le moteur : une fonction `markComplete` ne peut produire `complete` que si chaque check a une `evidence` non nulle. Sans preuve, le résultat est `to_complete` ou `blocking`. C'est la traduction technique de la doctrine.
- Testabilité : chaque domaine est une fonction pure `(snapshot) => DomainResult`, testée par cas (preuve présente, preuve absente, non applicable par province).
- Réutilisation : le pattern de `/api/conformite` (`score`, `issues[]` avec `href`) sert d'enveloppe de présentation. Les loaders réutilisent `getCabinetSubscriptionState`, `getCabinetTaxConfigById`, `describeTaxConfig`, `getReconciliationStatus`, `getCabinetProvince`.

---

## 6. Matrice RBAC cible et normalisation des rôles

### 6.1 Matrice cible (rôle × module × action)

Légende : `—` aucun accès, `V` view, `C` create, `E` edit, `D` delete, `A` approve, `X` export. Le superadmin SAFE n'agit pas sur les données d'un cabinet client par cette matrice : il accède à la Console interne par un rôle interne distinct (voir 6.2).

| Module | admin cabinet | avocat | assistante | comptabilité | lecture seule | stagiaire | superadmin SAFE |
|---|---|---|---|---|---|---|---|
| dashboard | V | V | V C E D | V | V | V | V (Console) |
| clients | V C E D | V E | V C E | V | V | V | — |
| dossiers | V C E D | V C E | V C E D | V | V | V | — |
| temps | V C E D A | V C E (les siens) | V | V | V | V C (les siens) | — |
| facturation | V C E A X | V X | V C E | V C E A X | V | — | — |
| paiements | V C E D | — | — | V C E | V | — | — |
| fidéicommis | V C E A X | V | — | V | V | — | — |
| dépenses | V C E D | V | V | V C E | V | — | — |
| journal | V C E D | V | — | V C E | V | — | — |
| rapports | V X | V | V X | V X | V X | — | — |
| employés | V C E D | V | — | — | — | — | — |
| paramètres | V C E D | — | — | V (lecture) | — | — | — |
| Console interne | — | — | — | — | — | — | V C E (rôle interne requis) |

Notes de cadrage. La comptabilité n'édite pas les employés (corrige l'effet de bord actuel `rbac.ts:106`). Seul l'admin gère la facturation au sens approbation, la comptabilité gère paiements et journal. Le stagiaire et la lecture seule ne sont pas connectables tant que la normalisation 6.2 n'est pas faite, donc leurs lignes décrivent l'intention une fois la connexion possible.

### 6.2 Stratégie de normalisation UserRole / EmployeeRole

Objectif : une seule échelle de rôles effectifs, calculée une fois et persistée dans la session.

1. **Rôle effectif unique.** `EmployeeRole` devient la seule échelle de référence. `UserRole` reste en base pour compatibilité, mais le rôle effectif est calculé par `getEffectiveRole(Employee.role sinon mapping UserRole)` et écrit dans le JWT et la session (`lib/auth.ts`), au lieu d'être recalculé partout.
2. **Mapping bidirectionnel stable.** Conserver `userRoleToEmployeeRole` et `employeeRoleToUserRole`, mais traiter le cas null explicitement. Un employé INTERN ou READ_ONLY reste non connectable tant qu'aucun équivalent `UserRole` n'existe.
3. **Rôles non connectables.** Deux options claires, à trancher. Option A : étendre l'enum `UserRole` avec `stagiaire` et `lecture_seule`, ce qui rend ces rôles connectables et aligne les deux modèles (migration additive). Option B : assumer que ces rôles sont RH purs, jamais connectables, et l'imposer côté invitation et côté création de compte. Recommandation : option A, car la matrice cible décrit déjà leurs droits applicatifs, donc l'intention est de les laisser se connecter en lecture.
4. **Une source de règles.** La matrice `ROLE_MODULE_PERMISSIONS` devient le seul juge. Les helpers plats `can*` deviennent des appels minces vers `can(effectiveRole, module, action)`. Les trois helpers `=true` sont supprimés.
5. **Visibilité UI.** L'UI montre toujours rôle RH, rôle d'accès, état du compte (actif/inactif/non configuré) et rôle effectif, sans les confondre.

---

## 7. Corrections UX

- **Cartes calculées, jamais trompeuses.** Remplacer chaque valeur figée de la page Paramètres par un statut dérivé. Afficher la province réelle, le libellé de taxe dérivé, le mode de facturation dérivé, l'état d'abonnement traduit. Aucune carte ne dit « En vigueur » sans couverture prouvée.
- **Risques admin prioritaires.** Une vue d'administration en tête de page liste les domaines `blocking` puis `warning`, cliquables vers la zone à corriger, sur le modèle des `issues[]` de `/api/conformite`.
- **Distinction employé / utilisateur / accès / rôle.** La liste d'équipe affiche une colonne « accès » (peut se connecter, compte non configuré, inactif), pas seulement le badge de rôle. Le détail montre rôle RH, rôle d'accès et rôle effectif côte à côte. Aujourd'hui l'info n'existe que dans un onglet (`EmployeeAccessTab.tsx:45-49`), à remonter dans la liste.
- **Checklist de configuration cabinet.** Une checklist d'onboarding pilotée par le readiness engine, qui passe au vert seulement sur preuve.
- **Jamais « conforme » sans preuve.** Tout libellé positif est accompagné de la preuve (date de rapprochement, ratio de couverture, statut d'abonnement dérivé). Le mot « conforme » est réservé à l'état `complete`.
- **Paie clairement étiquetée.** Bandeau visible « Estimation de masse salariale brute, non conforme à la paie réglementaire » sur l'écran de paie courant, pas seulement à la fin d'année.

---

## 8. Corrections techniques

- **Service central de règles.** Un module unique qui expose `can(effectiveRole, module, action)`, consommé par l'UI et l'API. Suppression des helpers `=true` (`permissions.ts:88-90,146-148,185-187`). Suppression du scope audit dupliqué (`parametres/audit/page.tsx:27-28`) au profit de `canViewFullAuditLog`.
- **Validation Zod des invitations et rôles.** `z.nativeEnum(UserRole)` plus règle métier sur les rôles qu'un admin peut attribuer, dans `app/api/team/invite/route.ts`. Échec propre en 400, jamais une 500 Prisma.
- **Durcissement API Stripe.** Ajouter `if (!canManageCabinetSettings(role)) return 403` dans `app/(app)/api/stripe/portal/route.ts`, en miroir de checkout.
- **Console par rôle interne.** Introduire un rôle ou flag interne (par exemple `User.isInternal` ou un enum interne), remplacer `nom === "SAFE"` par un vrai garde de rôle, et un `requireConsoleAccess()` appelé dans chaque page Console. Scoper les `findUnique` de `console/clients/[id]` et `console/support/[id]` au workspace SAFE.
- **Audit des actions RH sensibles.** Brancher `createAuditLog` dans `employees/actions.ts` pour création d'employé, création de compte, changement de rôle, de taux, de NAS, de statut de paie. Étendre `AuditEntityType` avec `Employee`, `User`, `Invitation`.
- **Normalisation des rôles.** Calculer le rôle effectif une fois et le persister dans la session (section 6.2).
- **Suppression des valeurs codées en dur.** Page Paramètres : remplacer `value="CAD"`, `billingTaxesHST`, `billingForfait`, le badge rétention `count > 0` et la lecture Stripe brute par les moteurs dérivés existants.
- **Garde de page systématique.** Ajouter un garde de rôle sur `rapports/page.tsx`, `comptabilite/page.tsx`, `journal/general/page.tsx`, `journal/depenses/page.tsx`.

---

## 9. Modèle de données (changements proposés, migration prudente non destructive)

Tous additifs, aucun champ supprimé ni renommé en première étape.

1. **Rôle interne SAFE.** Ajouter `User.isInternal Boolean @default(false)` (ou un enum interne `InternalRole?`). Migration additive. La Console se garde sur ce champ, plus sur le nom de cabinet.
2. **Rôles connectables.** Si option A retenue (section 6.2), étendre l'enum `UserRole` avec `stagiaire` et `lecture_seule`. Ajout de valeurs d'enum, additif.
3. **Statut d'invitation.** Ajouter `Invitation.status` énuméré (`pending`, `accepted`, `expired`, `revoked`), `revokedAt DateTime?`, `revokedById String?`. Backfill : `accepted` si `acceptedAt` non nul, `expired` si `expiresAt` passé, sinon `pending`.
4. **Unicité email.** Ajouter `@@unique([cabinetId, email])` sur User après déduplication contrôlée des doublons existants. À faire en deux temps : audit des doublons, puis contrainte.
5. **Audit RH.** Étendre les unions `AuditEntityType` et `AuditAction` (changement de code, pas de schéma DB puisque les colonnes sont `String`). Optionnel : nettoyer la redondance `performedBy` vs `userId` plus tard, hors première vague.
6. **NAS chiffré.** Chiffrer `Employee.sinNumero` au repos (chiffrement applicatif au niveau champ), conserver le masquage à l'affichage, et une permission dédiée distincte de l'édition d'employé pour le déchiffrement et l'export.
7. **Snapshot readiness.** Optionnel, pour historiser : `CabinetReadinessSnapshot` (cabinetId, date, score, payload JSON des domaines). Non requis pour la v1 du moteur, qui peut calculer à la volée.

---

## 10. Règles métier clés (énumérées, testables)

1. Aucune carte de paramètres n'affiche une valeur littérale figée : tout dérive du snapshot, fallback explicite.
2. La page Paramètres d'un cabinet QC affiche un libellé de taxe québécois, jamais « Ontario ».
3. Un domaine de readiness n'est `complete` que si chaque check a une preuve non nulle.
4. La rétention n'est jamais `complete` sur `count > 0` : elle exige une couverture des types requis par province.
5. L'état d'abonnement affiché provient de `getCabinetSubscriptionState`, jamais d'un token Stripe brut.
6. Toute page chargeant des données financières revérifie le rôle côté serveur, indépendamment de la navigation.
7. Le portail Stripe n'est accessible qu'à `admin_cabinet`.
8. La Console n'est accessible qu'à un compte interne SAFE, identifié par rôle, jamais par le seul nom de cabinet.
9. Une invitation valide un rôle contre une liste blanche, et un admin ne peut pas attribuer un rôle au-dessus du sien.
10. La création d'un compte de connexion, tout changement de rôle, de taux, de NAS et de statut de paie sont journalisés.
11. Le NAS n'est jamais stocké en clair et son déchiffrement exige une permission dédiée.
12. Aucun écran de paie n'affiche « Net » sans avertissement « estimation, non conforme ».
13. Un employé dont le rôle est non connectable n'est jamais présenté comme un accès actif.
14. Il existe une seule matrice rôle × module × action, consommée identiquement par l'UI et l'API.

---

## 11. Tests à écrire

Unitaires readiness, un fichier par domaine sous `lib/admin/readiness/__tests__/` :
- identité, province, taxes, facturation, fidéicommis, équipe, accès utilisateurs, rôles, abonnement, rétention, audit, sécurité, onboarding, Console. Chaque domaine teste trois cas au moins : preuve présente (`complete`), preuve absente (`to_complete`/`blocking`), non applicable par province.

RBAC matrice :
- pour chaque rôle × module × action, l'attendu de la matrice cible. Cas de non-régression : comptabilité ne peut pas éditer un employé ; lecture seule et stagiaire en lecture uniquement ; au moins un admin requis.

Validation invitations :
- rôle hors enum rejeté en 400 ; admin ne peut pas attribuer un rôle supérieur ; acceptation crée User et Employee liés en transaction ; double acceptation concurrente ne crée pas de doublon.

Garde API Stripe et Console :
- portail Stripe refuse 3 rôles sur 4 ; Console refuse un compte non interne du cabinet SAFE ; pages Console enfants refusent un id hors workspace.

Audit RH :
- chaque action sensible écrit une entrée d'audit avec acteur, avant/après et horodatage.

Intégration des flux sensibles :
- invitation bout en bout (envoi, acceptation, révocation, audit) ; changement de NAS chiffré puis lecture masquée ; génération de paie avec bandeau d'estimation.

---

## 12. Plan d'implémentation priorisé

### P0 : correctifs critiques de sécurité

- Objectif : fermer les trous exploitables aujourd'hui.
- Fichiers : `app/(app)/api/stripe/portal/route.ts` (ajout `canManageCabinetSettings`), `app/(app)/rapports/page.tsx`, `app/(app)/comptabilite/page.tsx`, `app/(app)/journal/general/page.tsx`, `app/(app)/journal/depenses/page.tsx` (gardes de rôle), `app/api/team/invite/route.ts` (validation Zod du rôle), `lib/safe-inc.ts` plus `app/(app)/console/layout.tsx` (garde Console par rôle interne, étape minimale), suppression des helpers `=true` dans `lib/auth/permissions.ts`.
- Définition de terminé : aucun compte non admin n'ouvre le portail Stripe ; aucune page financière servie par URL directe à un rôle non autorisé ; aucun rôle hors liste blanche accepté à l'invitation ; tests de garde verts.
- Effort : moyen, environ 3 à 5 jours.

### P1 : clarification UI et statuts calculés

- Objectif : supprimer les états trompeurs et exposer la distinction employé / accès.
- Fichiers : `app/(app)/parametres/page.tsx` (devise, taxes, mode, rétention, abonnement dérivés), `components/settings/SubscriptionManager.tsx`, `app/(app)/employees/page.tsx` plus `EmployeeTable` (colonne accès), bandeau d'estimation sur `components/employees/EmployeePayrollTab.tsx`.
- Définition de terminé : la page Paramètres n'affiche plus aucune valeur figée ; Cayard voit un libellé de taxe québécois ; la liste d'équipe distingue les comptes connectables ; l'écran de paie courant porte l'avertissement.
- Effort : moyen, environ 4 à 6 jours.

### P2 : Administrative Readiness Engine

- Objectif : un moteur pur calculant les 14 domaines et leurs 5 états, jamais « conforme » sans preuve.
- Fichiers : `lib/admin/readiness/` (moteur, types, loaders), une vue d'administration consommant le rapport, fusion progressive avec `app/api/conformite/route.ts` et `lib/services/security/security-alerts.ts`.
- Définition de terminé : moteur testé par domaine ; vue admin listant `blocking` puis `warning` ; aucun `complete` sans preuve ; les deux agrégateurs redondants convergent.
- Effort : élevé, environ 2 à 3 semaines.

### P3 : normalisation RBAC

- Objectif : une seule échelle de rôles effectifs, persistée en session, une seule source de règles.
- Fichiers : `lib/auth.ts` (persister le rôle effectif), `lib/auth/rbac.ts` et `lib/auth/permissions.ts` (helpers minces sur la matrice), `lib/auth/session.ts`, migration additive `UserRole` si option A.
- Définition de terminé : rôle effectif dans la session ; matrice unique consommée par UI et API ; comptabilité ne peut plus éditer d'employés ; matrice cible testée.
- Effort : élevé, environ 2 semaines.

### P4 : audit RH

- Objectif : tracer toute action RH sensible.
- Fichiers : `app/(app)/employees/actions.ts`, `lib/services/audit.ts` (unions étendues), `app/api/team/invite/route.ts` et `[token]/route.ts` (audit envoi, acceptation, révocation).
- Définition de terminé : chaque action sensible écrit une entrée d'audit ; l'onglet Activité reflète les modifications subies par l'employé ; tests d'audit verts.
- Effort : moyen, environ 4 à 6 jours.

### P5 : conformité documentaire

- Objectif : rendre la rétention province-aware et la révocation d'invitation possible.
- Fichiers : référentiel de types requis par province, branchement sur le check rétention du readiness engine, `Invitation.status` plus endpoint de révocation et UI, `@@unique([cabinetId, email])` sur User après déduplication.
- Définition de terminé : la rétention affiche un ratio de couverture ; une invitation se révoque depuis l'UI ; unicité email garantie en base.
- Effort : moyen à élevé, environ 1 à 2 semaines.

### P6 : paie

- Objectif court terme : étiqueter clairement la paie comme estimation non conforme. Objectif long terme : vraie paie via un fournisseur.
- Fichiers : tous les écrans de paie (`EmployeePayrollTab.tsx`, `EmployeeYearEndPanel.tsx`, libellés `messages/fr.json`), chiffrement `Employee.sinNumero` plus permission dédiée, correction du bug d'ajustement (`actions.ts:388-398`).
- Recommandation explicite. À court terme, étiqueter clairement comme estimation non conforme, partout, pas seulement à la fin d'année. La vraie paie canadienne (RRQ/RPC, AE, RQAP, impôts QC et fédéral, CNESST, vacances 4 ou 6 %, part employeur, production des feuillets) est un chantier lourd, à fort risque réglementaire, qui évolue chaque année et engage la responsabilité du cabinet. Il est nettement préférable de déléguer à un fournisseur de paie reconnu plutôt que de réimplémenter ces calculs. Tant que cette intégration n'existe pas, présenter un « Net » sans retenues comme une paie est une fausse représentation. L'étiquetage clair est la seule position défendable à court terme.
- Définition de terminé : aucun écran n'affiche « Net » sans avertissement ; NAS chiffré et accès restreint ; bug d'ajustement corrigé ; décision documentée sur le fournisseur de paie cible.
- Effort : étiquetage faible (2 à 3 jours), chiffrement NAS moyen, vraie intégration paie très élevé (hors périmètre court terme).
