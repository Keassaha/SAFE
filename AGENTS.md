# AGENTS.md — SAFE Inc. Codebase

> Instructions chargées automatiquement par Codex à chaque session.

---

## Projet

**SAFE Inc.** — SaaS de gestion de cabinet d'avocats (Next.js, Prisma, Supabase).
Stack : Next.js 14 App Router · TypeScript · Prisma · Supabase · Tailwind · i18n (FR/EN).

---

## Contexte externe à charger

Deux dossiers hors du repo sont des références permanentes pour ce projet.
**Toujours les consulter avant de coder ou de spécifier une feature.**

### 1. Pipeline de Delivery

```
~/Desktop/Delivery Syst/
```

Système en 3 phases (Comprendre → Spécifier → Construire) pour onboarder les cabinets.
- `AGENTS.md` — règles du pipeline (à lire en priorité)
- `prompts/` — prompts exécutables Phase 1, 2, post-delivery
- `templates/` — contrats de données YAML obligatoires
- `knowledge-base/` — modules SAFE, réglementation, patterns clients
- `clients/` — un dossier par client déployé

### 2. Dossier d'entreprise SAFE Inc.

```
~/Desktop/SAFE Inc./
```

Documents opérationnels, légaux, financiers et marketing de SAFE Inc.
- `01 - Infrastructure` — architecture technique
- `02 - Clients` — dossiers clients
- `03 - Contrats` — contrats signés
- `04 - Financier` — finances
- `05 - Marketing` — matériel marketing
- `06 - Futurpreneur` — dossier financement
- `07 - Operations` — processus internes
- `08 - Templates Emails` — gabarits emails
- `09 - Droit` — obligations légales, Barreau
- `10 - Delivery Pipeline` — pipeline delivery (copie)
- `11 - Subventions` — subventions
- `CEO` — documents direction

---

## Règles de travail

- Ne pas builder sans spec validée (voir pipeline Delivery Syst)
- Consulter la KB (`~/Desktop/Delivery Syst/knowledge-base/`) avant d'inventer une règle métier
- Respecter les templates YAML pour tous les documents client
- Conformité Barreau du Québec — vérifier `09 - Droit/` pour toute feature légale

---

## Pack recherche interne

Pour toute recherche longue, sensible ou destinée à devenir une référence réutilisable, consulter aussi:

- `docs/research/RESEARCH_STANDARDS.md`
- `docs/research/RESEARCH_TEMPLATE.md`
- `docs/research/RESEARCH_QA_CHECKLIST.md`
- `docs/research/PROCEDURE_recherche_complete.md`

Objectif: produire des recherches longues, claires, sourcées et avec marquage explicite des zones d'incertitude.

---

## Bibliotheque de bundles

Pour toute reflexion sur le scale, l'onboarding, la configuration par cabinet ou l'automatisation du delivery, consulter aussi:

- `docs/bundles/BUNDLE_SCHEMA.md`
- `docs/bundles/SAFE_BUNDLE_LIBRARY.md`
- `docs/bundles/BUNDLE_DECISION_RULES.md`

Ces fichiers definissent les bundles standards SAFE et la frontiere entre standard, override et custom.

---

## Schema d'audit

Pour toute evolution de l'audit gratuit, de la consultation de validation ou du mapping audit -> bundle, consulter aussi:

- `docs/audit/AUDIT_SCHEMA_CANONIQUE.md`
- `docs/audit/AUDIT_TO_BUNDLE_MAPPING.md`
- `docs/audit/CONSULTATION_PHASE2.md`

Ces fichiers definissent la structure cible de l'audit, les profils derives attendus et la maniere de recommander un bundle sans repartir de zero a chaque cabinet.

---

## Modele de configuration

Pour toute conception du moteur `audit -> bundle -> configuration`, consulter aussi:

- `docs/configuration/CONFIG_GENERATION_MODEL.md`
- `docs/configuration/CONFIG_ARTIFACTS.md`
- `lib/configuration/types.ts`

Ces fichiers definissent les artefacts de sortie, les entites du modele et la structure canonique du paquet de configuration a generer.

---

**Dernière mise à jour** : 2026-04-15
