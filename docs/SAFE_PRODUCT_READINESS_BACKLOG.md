# SAFE — Backlog de mise en marché (P0/P1)

Date : 2026-06-22
Source : `SAFE_PRODUCT_READINESS_AUDIT.md`, `SAFE_PRODUCT_READINESS_COMPARISON.md`, `SAFE_PRODUCTION_EDITORIAL_CALENDAR.md`.
Exécution : Claude Code. Chaque item se termine par sa définition de terminé (DoD). Une phase ne s'ouvre qu'après la revue du CEO sur la précédente.

Légende : `[ ]` à faire · `[~]` en cours · `[x]` fait et vérifié.

---

## Phase 1 — Confiance facturation, sécurité publique, fondation design

- [ ] **P0 · Adopter le design system safe-interface.** Porter les tokens (forêt #0B1F19, albâtre #EFF2ED, surface, encre, muet, vérifié #2E7D5B, ambre #B07A1C), la coque à rail et les composants de base (Button, Card, Badge, Pill, Logo, champs) depuis `docs/propositions/safe-interface/`. **DoD :** tokens et composants disponibles dans l'app réelle, une page pilote re-habillée.
- [ ] **P0 · Équivalence facture.** Preview UI, PDF, pièce jointe courriel et lien public affichent les mêmes montants et la même présentation. **DoD :** test de contrat vert (lignes, taxes, total, payé, solde, client, dossier).
- [ ] **P0 · Presenter unique.** La route publique ne recalcule plus les totaux inline ; tout passe par le presenter. **DoD :** aucune route critique ne recalcule différemment.
- [ ] **P0 · Rate-limit PDF audit public.** Protéger `/api/audit-gratuit/[id]/pdf`. **DoD :** route limitée + vérification.
- [ ] **P0 · Console interne gatée.** Accès basé sur un flag `User.isInternal`, plus sur `cabinet.nom`. **DoD :** console invisible pour un cabinet client.
- [ ] **P0 · Rotation des secrets.** Faire tourner les clés locales ayant circulé. **DoD :** clés tournées ; `.env` hors git (déjà le cas).

## Phase 2 — Premier usage et écrans vides

- [ ] **P0 · Onboarding.** Cacher le faux formulaire tout de suite, puis bâtir une mise en route qui persiste (cabinet, profil, config, premier client). **DoD :** aucun formulaire ne donne l'illusion de sauvegarder ; un cabinet neuf est réellement créé.
- [ ] **P0 · États vides guidés** (tableau de bord, clients, dossiers, facturation), avec les composants safe-interface. **DoD :** un cabinet neuf voit une prochaine action claire sur chaque écran.

## Phase 3 — Comptabilité vendable et paiements

- [ ] **P0 · Texte/UX doctrinal compta.** Clarifier "comptabilité opérationnelle + export comptable". **DoD :** l'avocat comprend ce que SAFE fait et ne fait pas ; journaux présentés en mode expert.
- [ ] **P0/P1 · /comptabilite recadré** autour de Encaisser / Dépenser / Contrôle mensuel / Export, avec TrustCard (fidéicommis sur fond forêt) et Obligations (Barreau B-1 r.5). **DoD :** fidéicommis et conformité en tête, langage avocat.
- [ ] **P1 · Paiements orphelins** visibles. **DoD :** aucun paiement non alloué important n'est invisible.
- [ ] **P1 · Surpaiements** signalés (solde négatif). **DoD :** affiché + action proposée.
- [ ] **P1 · Reçu de paiement** plus visible. **DoD :** action visible depuis le paiement.

## Phase 4 — Cycle dossier et documents

- [ ] **P0 · Fermeture minimale.** Statut clôturé + alerte si facture impayée ou débours non recouvré. **DoD :** un dossier peut être marqué fermé et alerte sur ce qui manque.
- [ ] **P1-haut · Fermeture complète.** Checklist, lettre de fermeture, rétention 7/10 ans. **DoD :** fermeture propre avec document conservé.
- [ ] **P1 · Débours dossier** cohérents et accessibles. **DoD :** visibles à refacturer / recouvrer / radier.
- [ ] **P1 · Doctrine documentaire.** Un écran clair (joindre / rédiger / pièces / documents générés). **DoD :** l'utilisateur sait où ranger une pièce.

## Phase 5 — Le cabinet travaille à deux (P1-haut, pilote duo)

- [ ] **P1-haut · Édition vers navette.** Un document passé en "final" émet un signal navette. **DoD :** un document terminé apparaît chez l'avocat sans ouvrir l'éditeur.
- [ ] **P1-haut · Facture prête vers navette.** Un brouillon prêt à émettre signale l'avocat. **DoD :** "facture prête à émettre" apparaît comme action.
- [ ] **P1 · Acte urgent vers navette.** Échéance < 3 j ou en retard remonte à l'assistant(e). **DoD :** l'acte urgent apparaît dans /aujourd'hui.
- [ ] **P1 · Accueil avocat orienté action.** Revue et navette au-dessus de la ligne de flottaison. **DoD :** l'avocat voit d'abord ce qui attend une décision.
- [ ] **P1/P2 · Digest couvre les nouveaux signaux.** **DoD :** le courriel du matin liste documents prêts, factures prêtes, actes urgents, par personne.

## Phase 6 — Navigation et cohérence UX

- [ ] **P1 · Rail de navigation safe-interface** adopté ; routes heures et compta clarifiées. **DoD :** menu cohérent par persona, aucune page interne ne fuit.
- [ ] **P1 · Hub de facturation** découvrable (sous-pages accessibles). **DoD :** honoraires, débours, paiements, créances trouvables.
- [ ] **P1 · Modules expérimentaux** cachés ou étiquetés (console, impersonation, paie complète, Employés Virtuels "à venir"). **DoD :** rien d'incomplet vendu implicitement.
- [ ] **P1/P2 · FormField unifié** (sur `form.tsx` de safe-interface). **DoD :** les nouveaux écrans l'utilisent.

## Phase 7 — Démo pilote et QA finale

- [ ] **P1 · Seed démo** (cabinet type Derisier, duo avocat + adjointe, navette active, données complètes). **DoD :** démo reproductible en local et preview.
- [ ] **P1 · Script démo 20 min**, incluant le moment "l'assistant prépare, l'avocat approuve". **DoD :** document utilisable en appel de vente.
- [ ] **P1 · Guide pilote** (1 page par persona). **DoD :** "comment démarrer avec SAFE".
- [ ] **P1 · QA finale** parcours complet avocat + assistant. **DoD :** checklist signée.
- [ ] **P1 · Push officiel.** **DoD :** branche poussée, origin à jour.

---

## Hors périmètre (parké, après le pilote)

- SAFE Pro (droit familial / pension, vs Aliform) : valider le marché avant tout build. Voir `docs/propositions/safe-pro/`.
- Paie complète, Stripe Connect / paiement en ligne, OCR preuve Interac.
- Tests E2E Playwright (avant vente publique).
- Décision RBAC matrice vs helpers (ADR-010) : à trancher avant un cabinet multi-rôles.
- Réduction des `any`, réactivation ESLint.
