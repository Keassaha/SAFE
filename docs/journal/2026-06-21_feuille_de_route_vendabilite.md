# 2026-06-21 — Feuille de route vendabilité + vérifications code

## Produit
- `docs/SAFE_FEUILLE_DE_ROUTE_VENDABILITE.md` : document maître en langage clair (résumé + conséquences d'abord, technique léger ensuite). 4 chantiers, double validation, règle du cap unique.
- Vérification par workflow (8 agents, investigation + vérification adversariale) des courriels clients, du design facture, de la compta juridique et du statut des corrections UX.

## Observé (faits vérifiés dans le code)
- **Courriels clients : aucune instruction de paiement Interac** (ni courriel de facture `lib/email.ts:98`, ni rappel `lib/email.ts:137`, ni facture en ligne `app/facture/[token]`). Modes de paiement saisis à l'onboarding mais jamais propagés. Ton du rappel un peu froid. Incohérence couleur (vert `#0F2A22` vs bleu `#003087`). Deux implémentations parallèles de courriel de document.
- **Facture : le PDF final client est déjà propre et conforme** (1 couleur + neutres, pas de n° Barreau). Le « pas pro » vient de l'**aperçu in-app** (`InvoiceTemplate*`, gabarit chargé). Vieux gabarit `InvoiceTemplateClean` = code mort. Vrai correctif = une seule facture, aperçu = PDF = en ligne (rejoint le test d'équivalence S1).
- **Compta : ouvre sur vocabulaire comptable** (onglets « Journal général », colonnes « Entrée/Sortie »). Fidéicommis (point Barreau) absent de `/comptabilite`, relégué à `/comptes`. Recadrage, pas reconstruction.
- **UX : 5/6 corrections déjà faites** (états vides, /fiches-de-temps redirige vers /temps, hub facturation, couleurs var(--safe-*), composant Input). Reste : onboarding ne persiste pas (bloquant), guidage dashboard cabinet neuf non rendu, « Chargement… » en dur.

## Décidé / cadré
- 4 chantiers : A courriels Interac (S1), B facture unique (S1), C compta parle-avocat (S3), D onboarding qui sauvegarde (S2). Insérés dans le calendrier 7 semaines existant sans casser l'ordre.
- Règle dure posée : aucune autre modification produit hors de cette liste tant que double validation (plan + résultats) non obtenue.

## Prochaine action physique
- Attendre la validation 1 (le plan) du CEO. Si validé, démarrer Chantier B (facture unique) + A (courriels) en S1.
