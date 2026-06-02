# SPEC — T1 : Bloc « Où j'en étais ? » (context-resume par dossier)

> Statut : **proposée, à valider avant code**
> Date : 2026-06-01
> Vision : `docs/product/VISION_assistante_navette_TDAH.md` (§14-15)
> Recherche : `docs/research/RECHERCHE_module_taches_fil_execution_TDAH.md`
> Maquette validée : `docs/product/mockups/maquette-ou-jen-etais.html`

---

## 1. Objectif

Afficher, en tête de chaque dossier, un **bloc de reprise de contexte** qui répond en
≤ 15 secondes à « Où j'en étais ? » :
- la **dernière action significative**,
- la **prochaine action** recommandée + son échéance,
- l'**échéance la plus proche** (compte à rebours),
- un **résumé narratif** (2-3 phrases).

C'est **le différenciateur** (aucun concurrent ne l'a) et le cœur du design TDAH
(externalisation de la mémoire de travail).

**Contrainte forte : 100 % dérivé des données existantes → AUCUNE migration Prisma.**

---

## 2. Périmètre

**Dans T1 :**
- Un service `getDossierResume(dossierId, cabinetId)` qui compose le bloc.
- Un constructeur de résumé **déterministe** et **pur** (testable).
- Un mapping `AuditLog → libellé humain + type d'acteur`.
- Un composant `DossierResumeCard` rendu en tête du détail de dossier.

**Hors T1 (tranches suivantes) :**
- T2 : fil d'exécution complet (timeline). T1 n'utilise que la *dernière* action.
- T3 : vue supervision chiffrée.
- V2+ : résumé par LLM, persistance `context_snapshots`, tag `actor_type='ia'` natif,
  dépendances, templates de tâches.

---

## 3. Sources de données (toutes existantes)

| Donnée | Source | Fonction/Champ |
|---|---|---|
| État + manquants + prochaine action | `lib/dossiers/preparation-status.ts` | `getDossierPreparationStatus(snapshot)` → `{ state, missingItems[], nextAction, readyToBill }` via `loadDossierPreparationSnapshot()` |
| Dernière action significative | `AuditLog` | filtrer `entityType='Dossier' AND entityId=dossierId` **+** `entityType IN (...) AND metadata.dossierId=dossierId` ; trier `performedAt`/`createdAt` desc |
| Tâches en retard | `DossierTache` | `statut IN (a_faire,en_cours) AND dateEcheance < now` |
| Échéance la plus proche | `DossierEvenement` | `date >= now` order by `date asc` limit 1 |

**Note de réconciliation** : `DossierTacheStatut` n'a **pas** de valeur `bloquee`
(enum = `a_faire | en_cours | terminee | annulee`). Le compteur « bloqués » de T1 vient donc
de l'**état de préparation** (`state === 'bloque'` ou `missingItems.severity === 'blocking'`),
**pas** des tâches. (La notion de tâche bloquée arrivera avec le module Tâches étendu.)

---

## 4. Type de sortie

```ts
// lib/dossiers/dossier-resume.ts
export type ResumeActorType = "human" | "system" | "ia";

export interface ResumeLastActivity {
  label: string;                 // « Preuves de fonds téléversées »
  actorName: string | null;      // nom de l'utilisateur, null si système
  actorType: ResumeActorType;
  at: Date;
}

export interface ResumeDeadline {
  label: string;                 // « Audience » / « Expiration portail IRCC »
  date: Date;
  daysLeft: number;              // entier, >= 0
}

export interface DossierResume {
  summary: string;               // résumé narratif déterministe (2-3 phrases)
  lastActivity: ResumeLastActivity | null;
  nextAction: string | null;     // = PreparationStatus.nextAction
  nextActionDueDate: Date | null;// échéance de la tâche en retard la plus prioritaire, si liée
  state: PreparationState;       // réutilise le type existant
  counts: {
    overdueTasks: number;
    blockingIssues: number;      // dérivé de l'état/manquants (cf. §3)
    criticalMissing: number;     // missingItems severity = critical
  };
  nearestDeadline: ResumeDeadline | null;
}
```

---

## 5. Logique

### 5.1 Constructeur de résumé (pur, testable)
`buildResumeSummary(parts): string` — assemble des fragments selon des règles, **sans I/O** :

1. **Ouverture** : si `lastActivity` → « Dernière action : {label} ({actorName|"système"}, {date courte}). »
   sinon → « Dossier ouvert récemment, aucune action enregistrée. »
2. **Tension temporelle** : si `nearestDeadline.daysLeft <= 7` →
   « {deadline.label} dans {daysLeft} jour(s). »
3. **Cap** : si `nextAction` → « Prochaine action : {nextAction}. »
   sinon si `state === 'pret_pour_revue'` → « Tout est prêt, en attente de revue par l'avocat·e. »

Concaténer les fragments présents en une à trois phrases. **Bilingue FR + EN**, piloté par la
locale next-intl ; **EN par défaut** (l'adjointe Derisier travaille surtout en anglais).
`buildResumeSummary(parts, locale)` prend la locale et produit la bonne langue.

### 5.2 Mapping AuditLog → libellé + acteur
`auditEventToResume(entry): { label, actorType } | null` :
- `actorType` : `userId == null → 'system'` ; sinon `'human'` (le `'ia'` viendra quand un
  flag sera posé dans `metadata`, ex. `{ actor: 'ia' }`).
- `label` : table de correspondance `(entityType, action)` → libellé **bilingue**
  (ex. `("Document","create") → { en:"Document added", fr:"Document ajouté" }`,
  `("Invoice","create") → { en:"Invoice prepared", fr:"Facture préparée" }`).
  Fallback : « {action} · {entityType} ». **On filtre les actions mineures/bruit**
  (liste blanche d'événements « significatifs » pour la reprise).

### 5.3 Service
`getDossierResume(dossierId, cabinetId): Promise<DossierResume>` :
1. charge le snapshot → `getDossierPreparationStatus`.
2. requête `AuditLog` (significatifs, desc, limite ~20) → 1ère entrée mappable = `lastActivity`.
3. compte tâches en retard ; `blockingIssues`/`criticalMissing` depuis `missingItems`.
4. `DossierEvenement` futur le plus proche → `nearestDeadline` (+ `daysLeft`).
5. `summary = buildResumeSummary(...)`.

Garde-fou : toute lecture est **scopée par `cabinetId`** (isolation cabinet).

---

## 6. UI

`components/dossiers/DossierResumeCard.tsx` — rend le hero de la maquette validée :
- en-tête « Où j'en étais ? » ;
- résumé narratif (filet accent à gauche) ;
- bandeaux d'alerte : échéance critique + **compte à rebours** (« expire dans 3 JOURS »,
  couleur selon `daysLeft`) ;
- **une** prochaine action mise en avant (+ échéance) ; bouton « Faire maintenant »
  (pour T1 : lien vers l'onglet/section pertinente ou no-op stylé — pas de nouvelle route).

**Intégration** : afficher la carte en tête du **détail de dossier** (server component qui
appelle `getDossierResume`). État de repos : si `state === 'pret_pour_revue'` et 0 retard →
badge « 0 oubli ». Respecter max 2 couleurs (vert SAFE + neutres), `prefers-reduced-motion`.

i18n : libellés **FR + EN** dans le namespace dossiers ; le résumé et les libellés d'audit sont
bilingues, **rendus dans la locale de l'utilisateur (EN par défaut pour Derisier)**.

---

## 7. Cas limites
- **Aucun historique** (dossier neuf) → `lastActivity=null`, résumé d'ouverture.
- **Aucune échéance** → pas de bandeau compte à rebours.
- **`nextAction=null`** (prêt) → message « tout est prêt ».
- **Audit volumineux** → limite + index existant `(@@index([entityType, entityId]))` ;
  pas de N+1 (une requête bornée).
- **Échéance passée non nettoyée** → exclue (`date >= now`).

---

## 8. Tests
- `buildResumeSummary` (pur) : 6+ cas — historique+échéance proche / en retard / prêt /
  vide / sans deadline / sans nextAction. **× 2 locales (EN + FR)**.
- `auditEventToResume` : mapping connus + fallback + filtrage bruit + actorType system/human.
- `getDossierResume` : composition avec données injectées (mock Prisma léger) — vérifie
  counts, nearestDeadline.daysLeft, sélection de la dernière action significative.
- `tsc` propre + suite complète verte.

---

## 9. Effort & livrables
- `lib/dossiers/dossier-resume.ts` (type + service + `buildResumeSummary` + `auditEventToResume`).
- `components/dossiers/DossierResumeCard.tsx`.
- Branchement dans le détail de dossier.
- i18n FR + tests.
- **Aucune migration.** Petit lot, fort ressenti, faible risque.

## 10. Définition de « terminé »
1. La carte s'affiche en tête d'un dossier réel avec un résumé correct.
2. Compte à rebours juste sur une échéance réelle.
3. État de repos « 0 oubli » quand le dossier est prêt et sans retard.
4. tsc + tests verts ; zéro migration ; scopé par cabinet.
