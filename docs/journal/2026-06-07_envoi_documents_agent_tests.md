# Journal — 2026-06-07 — Numérotation factures, agent IA, workflow d'envoi, tests Derisier

## Buildé / déployé (sur `main`)

### Conformité Barreau — étape D (numérotation factures sans trou)
- Brouillon = numéro provisoire `BROUILLON-<uuid>` (ne consomme pas la séquence) ; numéro officiel `YYYY-NNN` attribué **à l'émission** seulement (`issueInvoice`), sous verrou, en ne comptant que les factures émises.
- Helpers purs `invoice-numero-format.ts` (`displayInvoiceNumero` → « Brouillon ») sur ~8 surfaces. 4 chemins de création → provisoire. Prod = 0 facture → aucune migration de données.

### Agent d'assistance — brique 1 (Résumé de dossier)
- `lib/ai/summarize-dossier.ts` (Claude `claude-sonnet-4-5`, factuel, garde-fous Barreau, `null` si pas de clé) + orchestration `dossier-summary.ts` + route `/api/dossiers/[id]/resume` + composant `DossierResumeIA` câblé.
- SDK + champ `Dossier.resumeDossier` déjà présents → aucune migration. **Bloquant activation : `ANTHROPIC_API_KEY` à poser dans Vercel.**

### Workflow « Envoyer des documents au client » (E1–E4)
- Moteur d'envoi partagé `sendDocumentsToClient` + `renderRichDocumentsToPdf` : la facture devient une pièce parmi d'autres.
- Portail d'édition : bouton « Envoyer au client » + fenêtre (destinataire/message pré-remplis éditables) + route GET/POST `/api/edition/documents/[id]/send`.
- Envoi facture : section « joindre d'autres documents du dossier » + extension de la route facture (`attachRichDocumentIds`).
- Gabarits d'email par type, bilingues. Trace dans `NotificationLog`. Aucune migration. Spec : `docs/product/SPEC_envoi_documents_client.md`.

### Réconciliation branches CRM (parallèle)
- `wip/landing-crm-20260605` (snapshot non vérifié) rendu **build-vert** : `DocumentRetentionError` sortie du module `"use server"`. Non mergé sur main (DRAFT, validation CEO).

## Décidé
- Workflow d'envoi : v1 = RichDocuments du portail, gabarits éditables par type (choix CEO).
- Taux horaire Aaliyah : **30 $/h provisoire** (à confirmer avec Me Derisier).

## Observé / tests
- **Smoke test E2E lecture seule** (Derisier Law) : les 4 écrans Me Derisier (Navette needs-me, heures à approuver, rapport LSO annuel, rendu PDF d'envoi) s'exécutent sans erreur.
- **Jeu de test créé** : fiche employé Aaliyah (30 $/h) + 1 soumission de 7,5 h + 1 message Navette « prêt pour revue ». Vérifié : Me Derisier voit 1 needs-me, Aaliyah voit 225 $ de paye attendue.
- Renommage **Natalya → Aaliyah** (compte assistante).
- **`.env` local périmé** (mot de passe DB rotaté) : `vercel env pull` pour reconnecter le dev local. Prod OK.

## Demandes / prochaines étapes
- **NOUVEAU (CEO 2026-06-07)** : les records de paie doivent alimenter, en fin de processus, la **préparation des feuillets de fin d'année (T4A / T4)**. Donnée déjà accumulée par `Payslip` (heures, taux, brut, déductions, net, date de paiement par période) → agrégation annuelle par employé. À spécifier (clarifier T4 employé vs T4A contractuel).
- ~~Activer l'agent (poser `ANTHROPIC_API_KEY`)~~ — **CONFIRMÉ ACTIF en prod 2026-06-09** (clé déjà présente depuis 3j, résumé de dossier testé et fonctionnel par CEO).
- Décider du sort de `wip/landing-crm-20260605` (scinder landing / Console).
