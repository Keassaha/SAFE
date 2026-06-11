# ADR-010 — Normalisation RBAC (rôle effectif, matrice juge unique)

- **Statut** : Partiellement appliqué (correctif sécurité) + Proposé (le reste, décisions CEO requises)
- **Date** : 2026-06-10
- **Contexte** : audit Administration `docs/admin/ARCHITECTURE_ADMIN_RBAC.md` §6, plan P3.

## Contexte

Deux échelles de rôles coexistent : `UserRole` (4 valeurs, garde l'app sur ~85 fichiers) et
`EmployeeRole` (7 valeurs, dossier RH). Une matrice `ROLE_MODULE_PERMISSIONS` existe déjà dans
`lib/auth/rbac.ts` (clé = EmployeeRole, `can(role, module, action)`), et `permissions.ts` y délègue
DÉJÀ une partie des helpers (`canViewEmployees`, `canCreateEmployees`, `canEditEmployees` via
`getEffectiveRole`). Mais la majorité des helpers `can*` n'utilisent pas la matrice, et `canModule`
n'a aucun appelant : la matrice est restée « quasi décorative ».

Un trou concret : la matrice donnait à `ACCOUNTING_TECHNICIAN` (rôle effectif d'un compte
`comptabilite`) les droits `view/create/edit` sur `employees`. Comme `canEditEmployees` délègue à la
matrice et garde TOUTES les mutations d'employés (`employees/actions.ts`) ainsi que la paie, **un
compte comptabilité pouvait créer, modifier, supprimer des employés et lancer la paie**.

## Décision

### 1. APPLIQUÉ — correctif sécurité : comptabilité sans accès employés
`ROLE_MODULE_PERMISSIONS.ACCOUNTING_TECHNICIAN.employees = []` (était `view/create/edit`). Conforme à
la matrice cible §6.1 (employés : comptabilité = —). La comptabilité CONSERVE ses accès comptables
(facturation, paiements, journal, dépenses). Verrouillé par `lib/auth/__tests__/rbac.test.ts` (13
tests). **Changement de comportement live** : un compte `comptabilite` perd tout accès à la liste et
aux fiches employés. Réversible en une ligne si la cliente confie la gestion RH à sa comptable.

### 2. PROPOSÉ — la matrice devient le juge unique (PLUS subtil qu'un refactor)
Migrer les helpers plats `can*` de `permissions.ts` vers `can(getEffectiveRole(...), module, action)`.
**Analyse 2026-06-10 : ce N'EST PAS un refactor mécanique**, deux obstacles concrets :

- **(a) La matrice et les helpers divergent sur de VRAIES cellules.** Ex. `canEditClients` autorise
  l'avocat (live), mais `ROLE_MODULE_PERMISSIONS.LAWYER.clients = VIEW_ONLY` (pas d'édition).
  `canManageExpenseJournal` autorise l'assistante, mais `LEGAL_ASSISTANT.journal = []`. Migrer =
  CHOISIR la réponse de la matrice contre celle du helper = **changement de comportement live**, donc
  décision (cf. point 3), pas délégation transparente.
- **(b) `getEffectiveRole` rabat tout rôle inconnu sur `READ_ONLY`** (`userRoleToEmployeeRole` défaut),
  et READ_ONLY a `view` sur TOUT. Migrer les helpers à liste blanche (`canViewClients`, etc.) vers la
  matrice **régresserait le durcissement P0** (« refuser un rôle inconnu ») : un rôle hors des 4
  passerait de « refusé » à « READ_ONLY → vue accordée ». Prérequis : durcir le défaut de
  `getEffectiveRole` (refuser l'inconnu, ou variante stricte) AVANT toute migration de helper de lecture.

Conclusion : migration helper→matrice = chantier gardé par décisions (point 3) + durcissement du défaut
(b). Pas fait dans cet incrément, à raison.

### 3. EN ATTENTE — décisions CEO : divergences matrice actuelle ↔ cible §6.1
La matrice déployée diffère de la cible §6.1 sur des points qui sont des CHOIX de politique, pas des
bugs. À trancher avant de les appliquer (chacun change le comportement live) :
- **Avocat ↔ clients** : cible = `V E` (édition), actuel = vue seule.
- **Avocat ↔ paiements** : cible = `—` (aucun), actuel = vue.
- **Stagiaire / lecture seule** : la cible décrit leurs droits applicatifs, mais ils restent NON
  connectables tant que la normalisation (point 5) n'est pas faite.

### 4. EN ATTENTE — migration DB : `User.isInternal` (garde Console)
Remplacer la garde Console basée sur le NOM du cabinet (`cabinet.nom === "SAFE"`) par un vrai rôle
interne (`User.isInternal` ou enum), avec `requireConsoleAccess()` dans chaque page Console. Cela
**débloquerait honnêtement le domaine readiness « Console »** (aujourd'hui `blocking` pour SAFE).
Nécessite une migration Prisma additive : à faire avec le CEO (dérive repo↔prod sensible, cf. MEMORY ;
la base n'était pas joignable depuis l'environnement de build de cette session).

### 5. EN ATTENTE — persistance du rôle effectif en session
Calculer `getEffectiveRole` UNE fois et l'écrire dans le JWT / la session (`lib/auth.ts`), au lieu de
le recalculer partout. Touche le chemin d'authentification : à faire isolément, avec tests.

### 6. APPLIQUÉ — dédup du mapping rôle RH → rôle portail
`lib/employees/access.ts` ne contient PLUS de table : `EMPLOYEE_ROLE_TO_USER_ROLE` (créé en P1, aucun
consommateur externe) est supprimé, et `employeeRoleCanLogin` délègue à `rbac.canEmployeeRoleSignIn`.
Source unique = `lib/auth/rbac.ts`. Valeurs identiques (zéro changement de comportement), verrouillé par
`lib/employees/__tests__/access.test.ts` (égalité access.ts ↔ rbac.ts sur les 7 rôles + deriveEmployeeAccess).

## Conséquences
- Trou de sur-permission comptabilité refermé, RBAC enfin couvert par des tests (13).
- La matrice reste la référence ; sa convergence vers §6.1 et la consolidation des helpers se feront
  par décisions explicites, jamais par modification silencieuse du comportement live.
- Le domaine readiness « Console » restera `blocking` pour SAFE jusqu'au point 4 (migration DB).
