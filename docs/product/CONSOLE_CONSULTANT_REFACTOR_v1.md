# Spec — Refonte console consultant SAFE Inc. (v1.2)

---
module: Console / Navigation
date_spec: 2026-06-09
auteur: CEO + Claude (synthèse)
statut: VALIDÉE (CEO 2026-06-09)
parent: docs/product/CRM_SPEC_v1.md (v1.1)
phase_pipeline: SPÉCIFIER
---

> Évolution de la Console SAFE Inc. (CRM_SPEC v1.1). Cette spec définit la
> séparation nette entre l'**espace consultant** (SAFE Inc., qui gère des
> cabinets) et le **produit cabinet** (le SaaS vendu aux avocats).
> Règle CLAUDE.md respectée : spec validée avant build.

---

## 0. Problème

SAFE Inc. utilise son propre produit en dog food (ADR-006). Conséquence
non désirée : le CEO voit **deux barres de menu empilées** :

1. La barre cabinet d'avocats (`Header.tsx`) — Pratique, Finances, Outils, fidéicommis, dossiers, employés.
2. La barre console (`ConsoleNav.tsx`) — Dashboard, Cabinets, Pipeline, Audits, Clients, Support.

Le CEO n'est pas un cabinet d'avocats : c'est un **consultant qui gère des
cabinets**. Il n'a pas de dossiers, pas d'employés, pas de fidéicommis. Il
facture des **abonnements SaaS**, pas des honoraires juridiques.

## 1. Décisions CEO (2026-06-09)

| # | Décision | Choix |
|---|----------|-------|
| D1 | Menu cabinet en mode SAFE Inc. | **Remplacer entièrement** par un menu consultant unifié |
| D2 | Onglet « Audits » (conformité fidéicommis des clients) | **Fusionner dans la fiche client** (pas d'onglet séparé) |
| D3 | Fiche cabinet riche | **Vue complète d'un coup** (profil + audit + abonnement + activation) |
| D4 | Bouton « N » en bas à gauche | = Next.js Dev Tools, **pas** un élément applicatif. Rien à intégrer. |

## 2. Le menu unifié consultant

Quand le cabinet connecté est le cabinet dog-food SAFE Inc. (`Cabinet.nom === "SAFE"`),
on **n'affiche qu'une seule barre** :

| Item | Route | Note |
|------|-------|------|
| Tableau de bord | `/console` | Dashboard momentum (déjà refait 2026-06-09) |
| Clients | `/console/clients` | Liste de tous les cabinets → fiche riche. Fusion « Cabinets » + « Clients ». |
| Pipeline | `/console/pipeline` | Repensé : 4 colonnes au lieu de 13 stages |
| Finances | menu déroulant | Facturation · Comptabilité · Services de consultant |
| Support | `/console/support` | Tickets clients |
| Paramètres | `/parametres` | Inchangé |

**Disparaît en mode consultant** : Pratique (dossiers, file assistante, employés),
Outils juridiques (édition, import), fidéicommis (`/comptes`), la barre console
séparée, la barre cabinet du haut.

## 3. Fiche cabinet riche — `/console/clients/[id]`

Une page par cabinet, sections dans cet ordre :

1. **Profil** — raison sociale, localisation, forme juridique, contacts, domaines de pratique.
2. **Audit** — score d'audit + réponses clés issues de l'audit gratuit (lien `AuditSubmission`).
3. **Pratique & rémunération** — mode de facturation, fourchette de taux, volume, évolution.
4. **Abonnement** — plan, statut Stripe, MRR, date de renouvellement.
5. **Conformité** — état fidéicommis du cabinet client (D2 : l'« Audits » fusionné ici).
6. **Action** — bouton « Activer le cabinet + créer les accès » (comptes avocat / adjoint).

Sources de données : `Lead` (+ relations `cabinet`, `auditSubmission`, `bundleRecommendation`),
`getCabinetSubscriptionState`, `getTrustReconciliationStatus`.

## 4. Finances consultant

| Élément | Action |
|---------|--------|
| Fidéicommis (`/comptes`) | **Retirer** du menu et des vues consultant |
| Temps / « Prestation & service » | **Reframer** en « Services de consultant » (libellés non juridiques) |
| Facturation | **Garder** (facturation des abonnements aux cabinets) |
| Comptabilité | **Garder** (compta réelle de SAFE Inc., dog food) |
| Dossiers, Employés | **Retirer** |

## 5. Pipeline repensé (TDAH-friendly)

Problème : 13 colonnes = surcharge cognitive.

Cible : **4 colonnes** = les 4 phases réelles (Pré-engagement, Engagement,
Pré-audit, Conversion). Chaque carte : nom du cabinet + stage précis (petit
label) + prochaine action. Vue liste priorisée en alternative.

## 6. Plan d'exécution

| Chantier | Contenu | Dépend de |
|----------|---------|-----------|
| 1 | Menu unifié consultant (détection dog food → barre unique) | — |
| 2 | Fiche cabinet riche (`/console/clients/[id]`) | 1 |
| 3 | Finances consultant (retrait fidéicommis, reframe services) | 1 |
| 4 | Pipeline 4 colonnes | 1 |

Chaque chantier est testable indépendamment. Ordre : 1 → 2 → 3 → 4.

## 7. Garde-fous

- Ne **pas** casser le produit cabinet pour les vrais cabinets clients (Derisier
  garde sa navigation cabinet complète). La bascule consultant est conditionnée
  au cabinet dog-food SAFE Inc. uniquement.
- Pas de migration de données. Réutilise les modèles existants.
- Réutilise au maximum les services existants (subscription-state, trust-reconciliation-status).
