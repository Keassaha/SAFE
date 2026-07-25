# 2026-07-21 — Base de connaissances design « humain » (anti-slop IA)

## Contexte / demande CEO

Le CEO veut entraîner l'assistant au design d'app mobile et web à partir de vidéos YouTube
gratuites qu'il enverra. Objectif : accumuler un maximum de conseils **humains** pour que
l'assistant ne produise pas de layouts/designs « AI-centered ». Contrainte forte : la base
doit être **portable entre LLM** (Codex, autres), donc stockée en markdown dans le repo, pas
seulement en mémoire Claude.

## Ce qui a été buildé

Système en 3 couches :

1. **Base de connaissances portable** — `docs/design/DESIGN_HUMAIN.md`
   - Hiérarchisée en 11 sections : §0 méta-règles, §1 layout, §2 espacement, §3 typo,
     §4 couleur, §5 hiérarchie, §6 composants, §7 mobile, §8 motion, §9 UX writing,
     §10 anti-patterns IA (catalogue vivant, cœur du système), §11 conflits.
   - Système de confiance 🟢/🟡/🟠, statut SEED vs SOURCÉ, sources tracées.
   - Seedé au départ : M1-M6 (méta-règles) + A1-A10 (tells IA connus), tous marqués SEED,
     à valider/enrichir par les vidéos humaines.

2. **Pipeline d'ingestion par vidéo** — `docs/design/sources/`
   - `_INDEX.md` (catalogue), `_TEMPLATE.md` (gabarit d'extraction en 5 sections :
     résumé, principes bruts, vérification/corroboration, règles promues, conflits).
   - Une vidéo = un fichier `AAAA-MM-JJ_slug.md` + promotion des règles vers DESIGN_HUMAIN.md.

3. **Déclencheurs multi-LLM**
   - Skill Claude `.claude/skills/design-humain/SKILL.md` (MODE A appliquer, MODE B ingérer).
   - `AGENTS.md` racine (Codex + autres agents) pointant vers la même base.
   - Pointeur ajouté dans `CLAUDE.md`.

## Décisions

- La connaissance vit dans le `.md`, jamais uniquement dans le skill/la mémoire → portabilité.
- Recherche approfondie (corroboration web) intégrée au process d'ingestion, à la demande du CEO.
- Dédup + gestion de conflits explicites (pas d'écrasement, §11 documente les désaccords).

## Reste à faire

- Attendre la 1re vidéo du CEO pour valider le pipeline d'ingestion bout à bout.
- Confirmer la capacité de récupération auto des transcriptions YouTube ; sinon, fallback =
  transcription collée par le CEO.
- Convertir progressivement les seeds SEED en SOURCÉ au fil des vidéos.
