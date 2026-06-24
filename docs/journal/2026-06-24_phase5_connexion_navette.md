# 2026-06-24 — Phase 5 : connexion navette

Theme calendrier (Semaine 5) : « faire en sorte que tout travail terminé dans un module remonte à la bonne personne, via la navette qui est déjà la colonne vertébrale ». Méthode ultracode (workflows). Décisions CEO : types dédiés (migration) + les 3 connexions + dashboard.
Branche `release/2026-06-11-compta-admin-derisier`. tsc + 661 tests verts, parité i18n. 5 commits.

## Constat (workflow de compréhension)
La navette est mature et auto-diffusante : tout message écrit via `createNavetteMessage` (recipientId + resolvedAt null) apparaît AUTOMATIQUEMENT dans /aujourd'hui, le coup d'œil avocat et le digest. Le travail = faire émettre les modules-îles, pas bâtir une infra.

## Buildé
- **Socle** : enum `NavetteMessageType` + `document_ready`, `invoice_ready`, `acte_urgent` ; colonne `DossierNavetteMessage.sourceRef` (dédup signaux dérivés). Migration ADDITIVE `20260623130000_navette_p5_types` (ADD VALUE / ADD COLUMN, IF NOT EXISTS), à déployer avant le code. Permissions (`canSendNavetteType`), labels i18n (digest + NavetteThread + AaliyahTodayView).
- **Facture → navette** : `approveInvoice` (DRAFT→READY_TO_ISSUE) émet `invoice_ready` vers l'avocat responsable (repli assistante), confidentiel, best-effort.
- **Édition → navette** : route PUT émet `document_ready` à la transition brouillon→final ; bouton « Marquer comme final » ajouté à la ligne document de l'atelier (le déclencheur manquait).
- **Acte urgent → navette** : `lib/navette/acte-urgent-scan.ts` (échéance < 3j ou dépassée, non terminé) émet `acte_urgent` vers l'assigné ; branché dans `runDailyDigest` ; dédup `sourceRef = acte:{id}` (jamais réémis, règle du silence).
- **Tableau de bord** : coup d'œil avocat (`LawyerGlance`) élargi (ready_for_review, question, document_ready, invoice_ready), libellé + icône par type ; seul ready_for_review garde Approuver/Renvoyer.

## Choix d'architecture
- `derivePaymentStatus` NON modifié (éviter de casser relances/exports).
- Émissions best-effort : un échec de signal n'annule jamais la mutation métier.
- Fidéicommis hors périmètre navette (signaux = métadonnées seulement).

## Revue adversariale (corrigée avant clôture)
- `createNavetteMessage` rendu idempotent sur `sourceRef` (anti-doublon : retry facture/document, run concurrent du scan).
- Facture : dossier chargé scopé cabinet (défense en profondeur) + destinataire de repli (assistante).
- Em-dashes retirés du digest courriel (titres navette + sujet).
- Icônes document/facture dans /aujourd'hui ; acte_urgent future-proof dans LawyerGlance ; filtre confidentiel défensif sur `countNeedsMe` ; log des échecs d'émission.

## Reste calendrier
P6 cohérence de la navigation par rôle · P7 démo / QA.
