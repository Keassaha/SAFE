# AGENTS.md — SAFE Inc.

> Fichier d'instructions lu par les agents de code (Codex et autres) qui ouvrent ce repo.
> Il pointe vers les mêmes règles que celles chargées par Claude Code, pour que la
> connaissance et les instructions soient identiques quel que soit le LLM utilisé.

## Instructions générales

Les règles complètes du projet sont dans **`CLAUDE.md`** (à lire en premier). Elles
s'appliquent quel que soit l'assistant. `CO-DIRECTION.md` définit le mode de travail.

Projet : SAFE Inc., SaaS de gestion de cabinet d'avocats.
Stack : Next.js 14 App Router · TypeScript · Prisma · Supabase · Tailwind · i18n (FR/EN).

## Design d'interface — règle permanente

Pour TOUT travail de design, UI, layout, page, écran ou composant, consulter AVANT de coder :

- **`docs/design/DESIGN_HUMAIN.md`** — base de connaissances design hiérarchisée, tirée de
  créateurs humains et sourcée. C'est la source de vérité design du projet.
- `docs/design/sources/` — extractions par vidéo + catalogue `_INDEX.md`.

Objectif : produire des interfaces qui ressemblent à du travail humain de qualité, jamais à
du design généré par IA (« AI-centered »). Les méta-règles (§0) et le catalogue anti-slop
(§10) de `DESIGN_HUMAIN.md` priment. Passer la checklist §10 avant de considérer un écran
terminé.

**Ingestion d'une nouvelle source vidéo** (quand l'utilisateur envoie un lien YouTube design) :
suivre le processus décrit dans `.claude/skills/design-humain/SKILL.md`, section « MODE B ».
Le processus est le même pour n'importe quel LLM ; seul le mécanisme de déclenchement diffère.

## Conventions de voix

- Voix « vous », jamais « tu ». Pas d'em-dash (—) en milieu de phrase dans le copywriting.
- Conformité Barreau du Québec pour toute feature légale (voir `09 - Droit/` hors repo).
