# Spec — Intake client basé sur l'audit (Console SAFE Inc.)

---
module: Console / Acquisition
date_spec: 2026-07-08
auteur: CEO + Claude (synthèse)
statut: DRAFT (en attente validation CEO)
parent: docs/product/CRM_SPEC_v1.md (v1.1)
phase_pipeline: SPÉCIFIER
---

> Règle CLAUDE.md respectée : spec validée avant build. Doctrine « brancher avant
> de bâtir » : cette feature réutilise l'audit existant, elle n'invente rien.

## 0. Problème

Le CEO veut ajouter **manuellement** un vrai client (cabinet) à la Console, via
un formulaire d'intake riche **calqué sur le formulaire d'audit** que le prospect
remplit. Aujourd'hui la Console n'a qu'un `NewLeadForm` léger (identité +
firmographique), sans lien avec la profondeur de l'audit.

## 1. Décision fondatrice : l'intake EST l'audit, réutilisé

Le questionnaire d'audit est déjà **data-driven** dans `lib/audit-gratuit/questions.ts`
(6 sections, 34 questions, conditions `showIf`, scoring). L'intake **réutilise cette
même source** au lieu de dupliquer des champs. Un seul questionnaire, deux points
d'entrée :

- **Mode A — Importer un audit** : le prospect a rempli l'audit gratuit. On choisit
  son `AuditSubmission` (parmi ceux non encore rattachés à un Lead) et l'intake
  **se pré-remplit** depuis `reponses` (les clés = ids de questions, mapping 1:1).
- **Mode B — Saisie manuelle** : le CEO remplit le questionnaire lui-même au nom du
  prospect (appel téléphonique, salon, référence). Mêmes 34 questions.

## 2. Périmètre V1

- Route `/console/clients/nouveau` (remplace le `NewLeadForm` léger actuel).
- Présentation **progressive en 6 sections** (une étape par section de l'audit),
  pour rester riche sans écraser (TDAH-friendly). Barre de progression.
- Bandeau haut « Importer depuis un audit » (Mode A) ou « Partir de zéro » (Mode B).
- À l'enregistrement :
  1. Crée (ou réutilise) un `AuditSubmission` `source="onboarding"`, `reponses` = JSON
     des réponses, `scoreGlobal` calculé via le scoring d'audit existant.
  2. Crée un `Lead` rattaché (`auditSubmissionId`), avec les champs firmographiques
     mappés (voir §3) + score firmographique auto (fonction existante).
  3. Crée un `LeadContact` depuis l'identité + coordonnées.
  4. Redirige vers la fiche `/console/clients/[leadId]`, prête à convertir en Cabinet.
- **Flag** : `isConsoleIntakeEnabled()` dans `lib/flags.ts`
  (`SAFE_FEATURE_CONSOLE_INTAKE`, activé par défaut, kill-switch off).
- Design **si-** (forêt/albâtre), cohérent avec le reskin Console.

## 3. Mapping réponse d'audit → champ Lead (best-effort)

Les réponses complètes restent **toujours** intégrales dans `AuditSubmission.reponses`.
Le mapping ci-dessous ne sert qu'à remplir les colonnes structurées du `Lead` :

| Réponse audit (id) | Champ Lead |
|---|---|
| `raison_sociale` | `raisonSociale` |
| `localisation.ville` / `localisation.province` | `ville` / `province` |
| `site_web` | `siteWeb` |
| `identite.nom_complet` + `identite.titre` | `LeadContact.prenom/nom/titre` |
| `contact.email` / `contact.telephone` | `LeadContact.email/telephone` |
| `nb_utilisateurs` | `tailleCabinet` (approx) + `nbAvocatsEstime` |
| `mode_facturation` | `modeFacturation` |
| `langues` | `langue` |
| `fideicommis_usage` (actif/peu) | `aTrustAccounting = true` |
| `logiciel_actuel` | `logicielActuel` |
| `domaines_pratique` (texte libre) | `domainesPratique` (parse best-effort ; sinon `notesPrivees`) |
| `dossiers_actifs` / `nouveaux_mois` | `volumeFacturation` (approx) |
| Mode A → `sourceLead = AUDIT_GRATUIT` ; Mode B → choix manuel |

Champs sans colonne Lead dédiée (forme juridique, années de pratique, adjoint,
comptable, satisfaction, ROI…) restent dans `reponses` et s'affichent dans la
section « Audit » de la fiche client (déjà prévue par la spec Console v1.2).

## 4. Réutilisation technique

| Besoin | Réutilise |
|---|---|
| Définition des questions | `lib/audit-gratuit/questions.ts` (`QUESTIONS`, `SECTIONS`, `visibleQuestions`) |
| Rendu du formulaire | `components/audit-gratuit/AuditForm.tsx` (à valider : réutilisable hors page publique, sinon renderer léger sur `QUESTIONS`) |
| Scoring | fonction de scoring d'audit existante (`scoreGlobal`, `scores`) |
| Création Lead + score firmo | `createLead` / `computeFirmographicScore` (`lib/validations/crm-lead`) |
| Lien audit ↔ lead | relation Prisma `AuditSubmission.lead` (existe déjà) |

**Aucune migration Prisma.** Tout le modèle existe (`AuditSubmission`, `Lead`,
`LeadContact`).

## 5. Plan de build (après validation)

1. Flag `SAFE_FEATURE_CONSOLE_INTAKE` + squelette route `/console/clients/nouveau`.
2. Renderer des 6 sections (réutilise `AuditForm` ou léger wrapper sur `QUESTIONS`).
3. Mode A : sélecteur d'`AuditSubmission` + préremplissage depuis `reponses`.
4. Server action : upsert `AuditSubmission` + `Lead` + `LeadContact` + scores.
5. Reskin des composants `components/console/` restés en palette générique
   (`NewLeadForm` etc.) au passage.
6. Vérif : tsc, écran par écran sur port 3010 (connecté créateur).

## 6. Non-objectifs V1

- Pas de signature électronique (chantier documents séparé).
- Pas de conversion automatique Lead → Cabinet (bouton existant, hors périmètre).
- Pas de refonte du scoring d'audit (réutilisé tel quel).

## 7. Décisions à confirmer par le CEO

- **D1** : garder les 6 sections complètes de l'audit (retenu) vs version resserrée.
- **D2** : Mode A (import audit) ET Mode B (saisie manuelle) dès la V1, ou Mode B seul d'abord ?
- **D3** : parser `domaines_pratique` (texte libre) vers la liste `domainesPratique`,
  ou garder le texte tel quel dans les notes ?
