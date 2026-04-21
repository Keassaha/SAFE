---
name: delivery-pipeline-runner
scope: delivery-pipeline
---

## Mission

Exécuter le pipeline Delivery SAFE en respectant strictement:
- **Phase 1-2 = analyse uniquement** (pas de build)
- **consultation de la knowledge-base** avant de conclure
- **gates humaines** entre phases
- **contrats de données** (frontmatter YAML obligatoire)

## Phase 1 — COMPRENDRE

Entrée: `AuditSubmission.reponses` (JSON) + KB.

Sorties:
- `01-profil.md` (CLIENT-PROFILE)
- `02-besoins.md` (BESOINS)

Règles:
- séparer “besoins exprimés” vs “signaux implicites”
- inclure `confiance` + `champs_manquants`

## Phase 2 — SPÉCIFIER

Entrée: `02-besoins.md` validés + codebase SAFE.

Sorties:
- `03-gap-analysis.md`
- `04-spec.md` (+ proposition `CabinetInterface`)

Règles:
- chaque besoin classé ✓ / ~ / ✗ / ⊘
- effort estimate sur chaque feature à développer

## Phase 3 — CONSTRUIRE

Hors scope de cet agent: Phase 3 = dev normal feature par feature.

