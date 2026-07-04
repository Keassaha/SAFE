# 2026-07-03 — P1 : fermeture de dossier, masquage des clôturés (soft-lock)

Route vers 10/10, suite du P1.

## Diagnostic (l'évaluation « fermeture = stub » était périmée)
La fermeture de dossier est en réalité COMPLÈTE et fonctionnelle :
- `components/dossiers/detail/DossierDetailFermeture.tsx` : affiche les blocages
  (durs : solde fidéicommis négatif → bouton désactivé ; souples : factures impayées,
  débours, fidéicommis positif → acquittement obligatoire), lettre de fermeture,
  état clôturé + date de rétention.
- `closeDossier()` (actions.ts) : blocages, calcul rétention (`computeRetentionUntil`),
  `DossierClosure` (snapshot checklist), AuditLog. Solide.

Le vrai manque : les dossiers clôturés/archivés n'étaient PAS masqués de la liste active.

## Correctif
- `lib/dossiers/query.ts` : flag `excludeClosedByDefault`. Sans filtre de statut
  explicite, la liste masque clôturés + archivés (accessibles via le filtre de statut).
- `dossiers/page.tsx` : `listWhere` (vue active) pour liste + pagination ; `statsWhere`
  (tous statuts) pour les cartes de résumé. L'export inchangé (dump complet).
- Bonus : « immobilier » manquait dans la liste blanche du filtre par type → ajouté.

## Vérifié à l'écran (Cabinet Test)
Après passage de `2026-001` en clôturé : liste active = 3 dossiers (le clôturé masqué),
carte « Dossiers clôturés » = 1, filtre « Clôturé » → le dossier réapparaît.
726 tests verts (6 nouveaux), tsc propre.

## Reste (rétention — suivi, design-sensible)
La rétention est calculée et stockée (`retentionJusqua`, `DossierClosure.destructionDate`),
mais aucun job de purge à l'échéance. À concevoir prudemment : PAS de destruction auto
silencieuse de dossiers clients (doctrine : proposer, l'humain valide). À spécifier.

## Reste vers 10/10 (P1)
Onboarding qui persiste, bouton payer sur facture publique, création rapide client.
