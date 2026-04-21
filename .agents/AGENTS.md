# Agents (SAFE)

Ce dossier définit des **agents de travail** (rôles) utilisables pour guider les interventions dans le codebase SAFE.

## Liste

- `security-auditor.md` — audit sécurité des routes, auth, secrets, webhooks
- `rbac-guardian.md` — contrôle d’accès, multi-tenancy (`cabinetId`), permissions par rôle
- `billing-domain-expert.md` — règles métier facturation / paiements / notes de crédit
- `delivery-pipeline-runner.md` — exécution des phases Delivery (Phase 1/2 analyse, Phase 3 build)

## Conventions

- Un agent = un fichier Markdown dans `.agents/agents/`.
- Les agents **ne remplacent pas** les prompts du pipeline Delivery : ils servent de “checklist intelligente” et de cadre d’exécution.

