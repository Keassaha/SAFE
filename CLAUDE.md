# CLAUDE.md — SAFE Inc. Codebase

> Instructions chargées automatiquement par Claude Code à chaque session.

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

## Règles de travail

- Ne pas builder sans spec validée (voir pipeline Delivery Syst)
- Consulter la KB (`~/Desktop/Delivery Syst/knowledge-base/`) avant d'inventer une règle métier
- Respecter les templates YAML pour tous les documents client
- Conformité Barreau du Québec — vérifier `09 - Droit/` pour toute feature légale

---

**Dernière mise à jour** : 2026-04-15
