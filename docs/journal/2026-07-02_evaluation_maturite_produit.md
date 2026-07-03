# 2026-07-02 — Évaluation de maturité produit (fonctions + usage concret)

## Méthode
Triple regard : (1) inventaire fonctionnel du code (agent), (2) audit qualité/robustesse
(agent : tests, multi-tenant, erreurs, i18n, migrations), (3) test terrain sur le Cabinet
Test local vide : parcours « premier jour d'une adjointe » (client → dossier → temps →
facture → fiducie) dans le navigateur.

## Verdict global
**7/10. Plateforme métier avancée, pas encore produit autonome.**
Prêt pour : pilote accompagné (Dérisier, cabinets fondateurs avec onboarding manuel).
Pas prêt pour : vente publique self-serve.

## Forces confirmées
- Facturation bout en bout (création → validation → envoi → paiement → allocation,
  PDF, portail public par token, notes de crédit, taxes multi-provinces) : production-ready.
- Fiducie durcie (réconciliation, rapports LSO certifiés, verrouillage période,
  anti-solde négatif) : production-ready, différenciateur réel vs Clio.
- Journal comptable append-only, export QB/Xero/Sage, idempotence testée.
- 679 tests verts, multi-tenant sain (15 routes sensibles échantillonnées, 0 fuite
  cabinetId), RBAC testé, 0 @ts-ignore.
- Terrain : création client (wizard 6 étapes) et dossier OK, page dossier riche
  (cartable immobilier auto, navette, chrono, résumé IA), page facture complète.

## Trouvailles terrain (nouvelles)
1. **Pages blanches `/temps` et `/comptes`** après rechargement complet : frontière
   Suspense jamais résolue + wrapper d'animation bloqué à opacity:0. Serveur répond 200,
   zéro erreur console/serveur. Reproduit en dev local (Turbopack) sur cabinet vide.
   À vérifier en prod : si reproductible, c'est un P0 silencieux (l'utilisateur voit
   une app morte sans message).
2. **La taxonomie dossier configurée n'est pas consommée par l'UI** : le Cabinet Test
   a la taxonomie Dérisier en config (RE/IMM/LAO, seqWidth 5) mais le formulaire
   « Nouveau dossier » montre des types génériques et numérote `2026-001` au lieu de
   `RE-00001`. La promesse « configuré pour votre cabinet » n'est pas tenue à l'écran.
3. Wizard client 6 étapes : complet (conformité) mais lourd pour un intake rapide ;
   pas de chemin « création rapide » (nom + email).

## Bloquants connus (audit interne 2026-06-21, re-confirmés par l'agent qualité)
B1 onboarding in-app ne persiste rien · B2 empty states (partiellement résolu : checklist
« Pour commencer » vue sur le dashboard) · B3 équivalence facture preview/PDF/public non
prouvée par test · B4 fermeture de dossier stub (rétention 7/10 ans non appliquée) ·
B5 secrets en clair + gate console par nom de cabinet · B6 pas de rate-limit sur PDF
audit gratuit.

## Priorités recommandées
- **P0 (avant tout nouveau cabinet)** : pages blanches (diagnostic prod), test de contrat
  facture (B3), rate-limit PDF (B6), rotation secrets + gate console isInternal (B5),
  re-vérifier B1.
- **P1 (différenciation, 2-4 semaines)** : brancher la taxonomie configurée dans le
  formulaire dossier + numérotation ; fermeture dossier + rétention (B4) ; bouton payer
  sur facture publique (plan Stripe Connect déjà spécifié) ; création rapide client.
- **P2 (scale)** : 10-15 tests API critiques, monitoring (Sentry), matching bancaire,
  rapports PDF, notifications.

## Écarts vs concurrence (Clio/PCLaw) assumables à court terme
Paie complète, sync calendrier, OCR, signatures électroniques, app mobile : absents,
mais non bloquants pour l'ICP solo QC/ON en phase fondateur.
