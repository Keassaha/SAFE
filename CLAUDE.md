# CLAUDE.md — SAFE Inc. Codebase

> Instructions chargées automatiquement par Claude Code à chaque session.

---

## ⚠️ LIRE D'ABORD : CO-DIRECTION.md

**[CO-DIRECTION.md](CO-DIRECTION.md)** — Mode de co-direction TDAH.
Charge automatiquement. Définit le fonctionnement de chaque interaction.
Toujours applicable, indépendamment de la tâche.

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
- `CLAUDE.md` — règles du pipeline (à lire en priorité)
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

## ⚠️ Avant de construire quoi que ce soit : REGLE_DE_BUILD.md

**[docs/product/REGLE_DE_BUILD.md](docs/product/REGLE_DE_BUILD.md)** — une page,
opposable, prime sur tout autre document de construction.

Elle dit à quoi sert SAFE, quel est le seul but, ce qui autorise et ce qui interdit
d'ouvrir un chantier, et ce que « terminé » veut dire. Elle tranche les
contradictions entre le blueprint Neolegal, le modèle SAFE Lead et la doctrine
d'ancrage.

Règle courte : on ne construit que ce qui **supprime une saisie réelle** ou **rend
visible ce qui existe déjà**. Et aucun chantier tant qu'aucun cabinet n'a franchi le
jour 0.

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

## Marque et logo

Pour tout travail touchant le logo, le nom, la voix, l'identité visuelle ou la
présentation de SAFE, lire AVANT de coder :

- `docs/brand/IDENTITE_SAFE.md` — **source de vérité de la marque** : ce qu'est SAFE, le
  genre d'application, la voix, le style visuel, la spécification du logo « L'Assemblage »
  (charte graphique v1.0, 2026-08-03).
- `docs/brand/SAFE_BRAND_CONTEXT.md` — pack autoportant à coller dans un assistant externe.

Règle dure : **les formes du logo vivent uniquement dans `components/brand/safe-mark.ts`**.
Ne jamais recopier un `path` de logo ailleurs. Les composants s'importent depuis
`@/components/branding/SafeLogo`. La page `/marque` sert de contrôle visuel.

---

## Base de connaissances design (sources humaines)

Pour tout travail de design, UI, layout, page, écran ou composant, consulter AVANT de coder:

- `docs/design/SAFE_PREMIUM_DESIGN_STANDARD.md` — **référentiel opposable** : 7 lois non négociables, jetons, 93 règles auditables (PS-001 à PS-093) avec seuils mesurables, grille de notation sur 100, procédure d'audit exécutable, manifeste. Prime sur `DOCTRINE_INTERFACE_INTERIEUR.md`, qu'il absorbe.
- `docs/design/DESIGN_HUMAIN.md` — base hiérarchisée de conseils design tirés de créateurs humains (source de vérité, markdown portable). §0 prime toujours.
- `docs/design/sources/` — extractions par vidéo + catalogue.

Objectif: produire des interfaces qui ressemblent a du travail humain de qualite, jamais a du design genere par IA. Les meta-regles (§0) et le catalogue anti-slop (§10) priment. Passer la checklist §10 avant de dire qu'un ecran est termine. Le skill Claude `design-humain` declenche l'ingestion d'une nouvelle video et l'application de la base.

---

**Dernière mise à jour** : 2026-07-21
