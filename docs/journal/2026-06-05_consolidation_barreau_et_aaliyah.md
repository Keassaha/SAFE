# Journal — 2026-06-05 — Consolidation Barreau + parcours Aaliyah + SEO

## Buildé / déployé (tout sur `main`, dev = prod)

### Parcours assistante (Aaliyah)
- **N6** — Chrono billable passif : `StartTimerButton` (1 clic, pré-rempli) sur la carte « prochaine action » du Today et l'en-tête dossier. Réutilise l'infra `TimerContext` existante.
- **N8** — « Mon temps & ma paye » : modèle `EmployeeHoursEntry` (+ migration), service submit/withdraw/approve/reject/rollIntoPayslip, page `/mes-heures` (MyHoursPanel) + approbation dans la fiche employé (`PendingHoursApproval`). Flux soumettre → approuver → paie. Rémunération configurable (taux à confirmer avec Me Derisier).
- **N7b** — Digest courriel quotidien : service `daily-digest` (Navette needs_me + échéances ≤3j + tâches en retard + heures à approuver), rendu HTML bilingue sans emoji, route cron `/api/cron/daily-digest` (protégée `CRON_SECRET`), préférence `User.digestOptOut` + toggle. Règle du silence respectée.

### SEO
- Fondations récupérées proprement de `a36603c` (sans le code cassé / sans régression facture) : `lib/seo.ts`, `JsonLd`, `robots.ts`, `sitemap.ts`, metadata par page, `metadataBase` + OG.

### Conformité Barreau — consolidation de la dérive du 2026-06-03 (4 étapes)
Le travail Barreau avait été **appliqué en prod mais jamais commité** (il dormait dans `wip-local-backup-20260604`). Réconcilié dans `main` :
- **A** — schéma + 2 migrations réalignés sur la prod (16 FK Client `RESTRICT`, colonnes de certification). `migrate diff` schéma↔prod sans écart Barreau ; migrations déjà appliquées en prod → `migrate deploy` = no-op.
- **B** — SEV-1 fermée (`deleteClient` archive au lieu de hard-delete + bouton sur `archiveClient`), rétention documents (409 si rattaché client/dossier), plafond espèces 7 500 $ (No Cash).
- **C** — certification du rapport annuel LSO : `certifyComplianceReport` (refuse si les 12 rapprochements ne sont pas tous certifiés), route `/certify`, permission `canCertifyComplianceReport`, UI grille 12 mois.
- **D** — numérotation sans trou : brouillon = numéro provisoire `BROUILLON-<uuid>`, numéro officiel `YYYY-NNN` attribué à l'émission seulement, `displayInvoiceNumero` sur 8 surfaces.

## Décidé
- Méthode de consolidation : pour A/B/C les patchs du backup s'appliquent (`git apply`) ; pour D, ré-application **manuelle de la logique** (backup basé sur une vieille base, non patchable sans écraser le travail facture récent).
- Prod = 0 facture → numérotation modifiable sans migration de données.

## Observé / à retenir
- **Dérive repo ↔ prod résolue** : le `schema.prisma` décrit enfin la vraie base.
- Le **repo principal local** était resté sur le commit cassé `a36603c` avec ~30 fichiers + 98 untracked non commités → sauvegardés dans `wip-local-backup-20260604` (local + GitHub), puis `main` local resynchronisé sur `origin/main`.
- `wip-local-backup-20260604` contient encore des features non-Barreau à trier : créances-aging, rentabilité, taxes, temps-non-facturé, alertes fidéicommis, `DossierResumeIA` (1ʳᵉ brique de l'agent d'assistance).

## Config infra
- `CRON_SECRET` posée en prod Vercel (digest quotidien actif, jours ouvrables 11:00 UTC).
- **Bloquant agent d'assistance** : `ANTHROPIC_API_KEY` absente des variables Vercel — à poser avant de lancer l'agent.

## Prochain chapitre
Agent d'assistance : récupérer `DossierResumeIA` depuis le backup + poser `ANTHROPIC_API_KEY`.
